[CmdletBinding()]
param(
  [string]$ComposeFile = (Join-Path $PSScriptRoot '..\docker\docker-compose.yml'),
  [string]$BackupDirectory = (Join-Path $PSScriptRoot 'backups')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-DockerCompose {
  param([Parameter(Mandatory)][string[]]$CommandArguments)

  & docker compose --file $ComposeFile @CommandArguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE."
  }
}

if (-not (Test-Path -LiteralPath $ComposeFile -PathType Leaf)) {
  throw "Compose file not found: $ComposeFile"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI was not found in PATH.'
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')
$containerBackupPath = "/tmp/controle-acesso-$([Guid]::NewGuid().ToString('N')).dump"
$backupFileName = "controle-acesso-$timestamp.dump"
$operationSucceeded = $false

[void](New-Item -ItemType Directory -Path $BackupDirectory -Force)
$resolvedBackupDirectory = (Resolve-Path -LiteralPath $BackupDirectory).Path
$backupPath = Join-Path $resolvedBackupDirectory $backupFileName

try {
  $postgresUser = (Invoke-DockerCompose @('exec', '-T', 'postgresql', 'printenv', 'POSTGRES_USER')).Trim()
  $postgresDatabase = (Invoke-DockerCompose @('exec', '-T', 'postgresql', 'printenv', 'POSTGRES_DB')).Trim()

  [void](Invoke-DockerCompose @(
    'exec', '-T', 'postgresql',
    'pg_dump', '--username', $postgresUser, '--dbname', $postgresDatabase,
    '--format=custom', '--compress=6', '--no-owner', '--no-privileges',
    "--file=$containerBackupPath"
  ))
  [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'pg_restore', '--list', $containerBackupPath))

  Invoke-DockerCompose @('cp', "postgresql:$containerBackupPath", $backupPath)

  $backup = Get-Item -LiteralPath $backupPath
  if ($backup.Length -le 0) {
    throw "The backup file is empty: $backupPath"
  }

  $operationSucceeded = $true
}
finally {
  try {
    [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'rm', '-f', '--', $containerBackupPath))
  }
  catch {
    if ($operationSucceeded) {
      throw
    }

    Write-Warning "Could not remove the temporary container file: $containerBackupPath"
  }
}

Write-Output "Backup created and archive structure validated: $($backup.FullName)"
Write-Output "Size: $($backup.Length) bytes"
Write-Output 'Run Test-PostgreSqlRestore.ps1 before treating this backup as recoverable.'
