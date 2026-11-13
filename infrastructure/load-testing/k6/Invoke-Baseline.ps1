[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^https?://')]
    [string]$ApiBaseUrl,

    [ValidateSet('low', 'medium', 'intense')]
    [string]$Profile = 'low',

    [switch]$ApprovedRemoteTarget,

    [string]$K6Executable
)

$ErrorActionPreference = 'Stop'
$apiUri = [Uri]$ApiBaseUrl
if (-not $apiUri.IsAbsoluteUri -or $apiUri.Scheme -notin @('http', 'https') -or
    $apiUri.UserInfo -or $apiUri.Query -or $apiUri.Fragment) {
    throw 'Informe uma origem HTTP(S) e caminho, sem credenciais, query ou fragmento.'
}
$isLocalTarget = $apiUri.DnsSafeHost -in @('localhost', '127.0.0.1', '::1')

if (-not $isLocalTarget -and $apiUri.Scheme -ne 'https') {
    throw 'Alvos remotos exigem HTTPS.'
}

if (-not $isLocalTarget -and -not $ApprovedRemoteTarget) {
    throw 'Use -ApprovedRemoteTarget somente após confirmar alvo, janela e responsáveis pelo ensaio.'
}

$useNativeK6 = $isLocalTarget -or -not [string]::IsNullOrWhiteSpace($K6Executable)
if ($useNativeK6) {
    $nativeCommand = if ([string]::IsNullOrWhiteSpace($K6Executable)) { 'k6' } else { $K6Executable }
    $nativeK6 = Get-Command $nativeCommand -CommandType Application -ErrorAction SilentlyContinue
    if (-not $nativeK6) {
        throw 'Para alvo loopback, instale o k6 nativo oficial ou informe -K6Executable. O localhost de um contêiner pertence ao contêiner.'
    }
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

    $runName = '{0}-{1}' -f [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'), $Profile
    $resultDirectory = New-Item -ItemType Directory -Force -Path (
        Join-Path $PSScriptRoot "../../../artifacts/k6/$runName")

    $env:K6_API_BASE_URL = $ApiBaseUrl.TrimEnd('/')
    $env:K6_ACCESS_TOKEN = $login.accessToken
    $env:K6_PROFILE = $Profile
    $env:K6_TARGET_APPROVED = if ($isLocalTarget) { 'no' } else { 'yes' }

    $scriptDirectory = (Resolve-Path $PSScriptRoot).Path
    $resultsPath = $resultDirectory.FullName
    $k6Image = 'grafana/k6:2.3.0@sha256:2dd4756ec6e14e62778916e1eb850108e4b499304c02df56760fa0bdb0fba0b8'

    if ($useNativeK6) {
        $env:K6_SUMMARY_PATH = Join-Path $resultsPath 'summary.json'
        & $nativeK6.Source run (Join-Path $scriptDirectory 'baseline.js')
    }
    else {
        docker run --rm `
            -e K6_API_BASE_URL `
            -e K6_ACCESS_TOKEN `
            -e K6_PROFILE `
            -e K6_TARGET_APPROVED `
            -v "${scriptDirectory}:/scripts:ro" `
            -v "${resultsPath}:/results" `
            $k6Image run /scripts/baseline.js
    }

    if ($LASTEXITCODE -ne 0) {
        throw "O k6 encerrou com código $LASTEXITCODE. Consulte o resumo sem publicar credenciais."
    }
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Variable plainPassword, securePassword, loginBody, login -ErrorAction SilentlyContinue
    Remove-Item Env:K6_ACCESS_TOKEN -ErrorAction SilentlyContinue
    Remove-Item Env:K6_API_BASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:K6_SUMMARY_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:K6_PROFILE -ErrorAction SilentlyContinue
    Remove-Item Env:K6_TARGET_APPROVED -ErrorAction SilentlyContinue
}
