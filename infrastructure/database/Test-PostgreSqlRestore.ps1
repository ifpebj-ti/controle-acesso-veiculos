[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$BackupPath,

  [string]$ComposeFile = (Join-Path $PSScriptRoot '..\docker\docker-compose.yml')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-DockerCompose {
  param([Parameter(Mandatory)][string[]]$CommandArguments)

  $output = & docker compose --file $ComposeFile @CommandArguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE."
  }

  return $output
}

if (-not (Test-Path -LiteralPath $ComposeFile -PathType Leaf)) {
  throw "Compose file not found: $ComposeFile"
}

if (-not (Test-Path -LiteralPath $BackupPath -PathType Leaf)) {
  throw "Backup file not found: $BackupPath"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI was not found in PATH.'
}

$resolvedBackupPath = (Resolve-Path -LiteralPath $BackupPath).Path
if ([System.IO.Path]::GetExtension($resolvedBackupPath) -ne '.dump') {
  throw 'The backup file must use the .dump extension.'
}

$suffix = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$verificationDatabase = "controle_acesso_verify_$suffix"
$containerBackupPath = "/tmp/controle-acesso-$suffix.dump"
$verificationDatabaseCreated = $false
$operationSucceeded = $false

try {
  $postgresUser = (Invoke-DockerCompose @('exec', '-T', 'postgresql', 'printenv', 'POSTGRES_USER')).Trim()
  [void](Invoke-DockerCompose @('cp', $resolvedBackupPath, "postgresql:$containerBackupPath"))
  [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'pg_restore', '--list', $containerBackupPath))
  [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'createdb', '--username', $postgresUser, $verificationDatabase))
  $verificationDatabaseCreated = $true
  [void](Invoke-DockerCompose @(
    'exec', '-T', 'postgresql',
    'pg_restore', '--username', $postgresUser, '--dbname', $verificationDatabase,
    '--exit-on-error', $containerBackupPath
  ))

  $verificationSql = "SELECT CASE WHEN to_regclass('dbo.pessoas') IS NOT NULL AND to_regclass('dbo.registros_acesso') IS NOT NULL AND to_regclass('dbo.auditorias') IS NOT NULL THEN 'restore-ok' ELSE 'restore-invalid' END;"
  $verificationOutput = (Invoke-DockerCompose @(
    'exec', '-T', 'postgresql',
    'psql', '--username', $postgresUser, '--dbname', $verificationDatabase,
    '--set', 'ON_ERROR_STOP=1', '--tuples-only', '--no-align',
    '--command', $verificationSql
  )).Trim()

  if ($verificationOutput -ne 'restore-ok') {
    throw 'The restored database did not contain the expected application tables.'
  }

  $operationSucceeded = $true
  Write-Output "Restore verified successfully in isolated database: $verificationDatabase"
}
finally {
  try {
    if ($verificationDatabaseCreated) {
      [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'dropdb', '--username', $postgresUser, '--force', $verificationDatabase))
    }

    [void](Invoke-DockerCompose @('exec', '-T', 'postgresql', 'rm', '-f', '--', $containerBackupPath))
  }
  catch {
    if ($operationSucceeded) {
      throw
    }

    Write-Warning "Could not completely remove restore test resources for: $verificationDatabase"
  }
}
