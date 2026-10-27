[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^https?://')]
    [string]$ApiBaseUrl,

    [ValidateSet('low', 'medium', 'intense')]
    [string]$Profile = 'low',

    [switch]$ApprovedRemoteTarget
)

$ErrorActionPreference = 'Stop'
$apiUri = [Uri]$ApiBaseUrl
$isLocalTarget = $apiUri.Host -in @('localhost', '127.0.0.1', '::1')

if (-not $isLocalTarget -and $apiUri.Scheme -ne 'https') {
    throw 'Alvos remotos exigem HTTPS.'
}

if (-not $isLocalTarget -and -not $ApprovedRemoteTarget) {
    throw 'Use -ApprovedRemoteTarget somente após confirmar alvo, janela e responsáveis pelo ensaio.'
}

$email = Read-Host 'E-mail da conta fictícia dedicada ao ensaio'
$securePassword = Read-Host 'Senha da conta fictícia' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $loginBody = @{ email = $email; password = $plainPassword } | ConvertTo-Json -Compress
    $login = Invoke-RestMethod `
        -Method Post `
        -Uri "$($ApiBaseUrl.TrimEnd('/'))/auth/login" `
        -ContentType 'application/json' `
        -Body $loginBody

    if ([string]::IsNullOrWhiteSpace($login.accessToken)) {
        throw 'A autenticação não retornou um token de acesso.'
    }

    $resultDirectory = Join-Path $PSScriptRoot '..\..\..\artifacts\k6' |
        Resolve-Path -ErrorAction SilentlyContinue

    if (-not $resultDirectory) {
        $resultDirectory = New-Item -ItemType Directory -Force `
            -Path (Join-Path $PSScriptRoot '..\..\..\artifacts\k6')
    }

    $env:K6_API_BASE_URL = $ApiBaseUrl.TrimEnd('/')
    $env:K6_ACCESS_TOKEN = $login.accessToken
    $env:K6_PROFILE = $Profile
    $env:K6_TARGET_APPROVED = if ($isLocalTarget) { 'no' } else { 'yes' }

    $scriptDirectory = (Resolve-Path $PSScriptRoot).Path
    $resultsPath = $resultDirectory.Path

    docker run --rm `
        -e K6_API_BASE_URL `
        -e K6_ACCESS_TOKEN `
        -e K6_PROFILE `
        -e K6_TARGET_APPROVED `
        -v "${scriptDirectory}:/scripts:ro" `
        -v "${resultsPath}:/results" `
        grafana/k6:2.3.0 run /scripts/baseline.js

    if ($LASTEXITCODE -ne 0) {
        throw "O k6 encerrou com código $LASTEXITCODE. Consulte o resumo sem publicar credenciais."
    }
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Variable plainPassword, securePassword, loginBody, login -ErrorAction SilentlyContinue
    Remove-Item Env:K6_ACCESS_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:K6_API_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:K6_PROFILE -ErrorAction SilentlyContinue
    Remove-Item Env:K6_TARGET_APPROVED -ErrorAction SilentlyContinue
}
