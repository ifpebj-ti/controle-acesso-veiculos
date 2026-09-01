[CmdletBinding()]
param(
  [Uri]$ApiBaseUrl = 'http://127.0.0.1:8080',

  [PSCredential]$AdministratorCredential,

  [Security.SecureString]$DoormanPassword,

  [Security.SecureString]$SecurityGuardPassword,

  [Security.SecureString]$TransportationPassword
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-LoopbackUri {
  param([Parameter(Mandatory)][Uri]$Uri)

  if (-not $Uri.IsAbsoluteUri -or $Uri.Scheme -notin @('http', 'https')) {
    return $false
  }

  if (-not [string]::IsNullOrEmpty($Uri.UserInfo) -or
      -not [string]::IsNullOrEmpty($Uri.Query) -or
      -not [string]::IsNullOrEmpty($Uri.Fragment)) {
    return $false
  }

  if ($Uri.AbsolutePath -ne '/') {
    return $false
  }

  if ($Uri.Host -eq 'localhost') {
    return $true
  }

  $address = $null
  return [Net.IPAddress]::TryParse($Uri.Host, [ref]$address) -and
    [Net.IPAddress]::IsLoopback($address)
}

function ConvertFrom-SecureStringForRequest {
  param([Parameter(Mandatory)][Security.SecureString]$Value)

  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

if (-not (Test-LoopbackUri -Uri $ApiBaseUrl)) {
  throw 'ApiBaseUrl must be an HTTP or HTTPS loopback URL with no path, query, fragment, or embedded credential.'
}

$normalizedBaseUrl = [Uri]::new($ApiBaseUrl.AbsoluteUri.TrimEnd('/') + '/')

# Windows PowerShell 5.1 reads UTF-8 files without a BOM using the legacy system
# code page. Build accented request values explicitly so they remain valid on
# both Windows PowerShell 5.1 and PowerShell 7+.
$aTilde = [char]0x00E3
$cCedilla = [char]0x00E7
$iAcute = [char]0x00ED
$oAcute = [char]0x00F3

function Invoke-DemoApi {
  param(
    [Parameter(Mandatory)][ValidateSet('GET', 'POST')][string]$Method,
    [Parameter(Mandatory)][string]$Path,
    [AllowNull()][object]$Body,
    [AllowNull()][string]$AccessToken,
    [Parameter(Mandatory)][string]$Operation
  )

  $relativePath = $Path.TrimStart('/')
  $requestUri = [Uri]::new($normalizedBaseUrl, $relativePath)
  $parameters = @{
    Uri = $requestUri
    Method = $Method
    ErrorAction = 'Stop'
  }

  if (-not [string]::IsNullOrWhiteSpace($AccessToken)) {
    $parameters.Headers = @{ Authorization = "Bearer $AccessToken" }
  }

  if ($null -ne $Body) {
    $parameters.ContentType = 'application/json; charset=utf-8'
    $parameters.Body = $Body | ConvertTo-Json -Depth 10 -Compress
  }

  try {
    return Invoke-RestMethod @parameters
  }
  catch {
    $statusCode = $null
    if ($null -ne $_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    $statusText = if ($null -eq $statusCode) { 'no HTTP status' } else { "HTTP $statusCode" }
    throw "$Operation failed ($statusText). No credential or response body was written to the log."
  }
}

function Get-EncodedValue {
  param([Parameter(Mandatory)][string]$Value)
  return [Uri]::EscapeDataString($Value)
}

function Get-DemoCollection {
  param([AllowNull()][object]$Value)

  if ($null -eq $Value) {
    return
  }

  foreach ($item in $Value) {
    if ($null -ne $item) {
      Write-Output $item
    }
  }
}

Write-Output "Checking API readiness at $($normalizedBaseUrl.AbsoluteUri)"
$readiness = Invoke-DemoApi -Method GET -Path '/health/ready' -Operation 'API readiness check'
if ($readiness.status -ne 'Healthy') {
  throw "The API is not ready. Reported status: $($readiness.status)"
}

if ($null -eq $AdministratorCredential) {
  $AdministratorCredential = Get-Credential -Message 'Enter the local demonstration administrator email and password.'
}

if ($null -eq $DoormanPassword) {
  $DoormanPassword = Read-Host 'Enter the temporary password for the fictional Porteiro account' -AsSecureString
}

if ($null -eq $SecurityGuardPassword) {
  $SecurityGuardPassword = Read-Host 'Enter a different temporary password for the fictional Vigilante account' -AsSecureString
}

if ($null -eq $TransportationPassword) {
  $TransportationPassword = Read-Host 'Enter a different temporary password for the fictional SetorTransporte account' -AsSecureString
}

$administratorPassword = ConvertFrom-SecureStringForRequest -Value $AdministratorCredential.Password
try {
  $login = Invoke-DemoApi -Method POST -Path '/auth/login' -Body @{
    email = $AdministratorCredential.UserName
    password = $administratorPassword
  } -Operation 'Administrator login'
}
finally {
  $administratorPassword = $null
}

$accessToken = $login.accessToken
if ([string]::IsNullOrWhiteSpace($accessToken) -or $login.user.profileName -ne 'Administrador') {
  throw 'The supplied account did not return an administrator access token.'
}

$demoAccounts = @(
  @{
    name = "Porteiro de Demonstra${cCedilla}${aTilde}o"
    email = 'porteiro.demo@example.test'
    profileName = 'Porteiro'
    password = $DoormanPassword
  },
  @{
    name = "Vigilante de Demonstra${cCedilla}${aTilde}o"
    email = 'vigilante.demo@example.test'
    profileName = 'Vigilante'
    password = $SecurityGuardPassword
  },
  @{
    name = "Transporte de Demonstra${cCedilla}${aTilde}o"
    email = 'transporte.demo@example.test'
    profileName = 'SetorTransporte'
    password = $TransportationPassword
  }
)

$passwordFingerprints = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($account in $demoAccounts) {
  $demoPassword = ConvertFrom-SecureStringForRequest -Value $account.password
  try {
    if ($demoPassword.Length -lt 12 -or $demoPassword.Length -gt 128) {
      throw "The temporary password for $($account.email) must contain between 12 and 128 characters."
    }

    $passwordBytes = [Text.Encoding]::UTF8.GetBytes($demoPassword)
    $sha256 = [Security.Cryptography.SHA256]::Create()
    try {
      $fingerprintBytes = $sha256.ComputeHash($passwordBytes)
      $fingerprint = [BitConverter]::ToString($fingerprintBytes).Replace('-', '')
    }
    finally {
      $sha256.Dispose()
      [Array]::Clear($passwordBytes, 0, $passwordBytes.Length)
    }

    if (-not $passwordFingerprints.Add($fingerprint)) {
      throw 'Each fictional account must use a distinct temporary password.'
    }

    $emailQuery = Get-EncodedValue -Value $account.email
    $search = Invoke-DemoApi -Method GET -Path "/users?search=$emailQuery&page=1&pageSize=25" `
      -AccessToken $accessToken -Operation "Search fictional account $($account.email)"
    $existing = @(Get-DemoCollection -Value $search.items) |
      Where-Object { $_.email -eq $account.email } |
      Select-Object -First 1

    if ($null -eq $existing) {
      Invoke-DemoApi -Method POST -Path '/users' -AccessToken $accessToken -Body @{
        name = $account.name
        email = $account.email
        password = $demoPassword
        profileName = $account.profileName
      } -Operation "Create fictional account $($account.email)" | Out-Null
    }
    elseif ($existing.profileName -ne $account.profileName) {
      throw "Fictional account $($account.email) exists with an unexpected profile."
    }
    elseif (-not $existing.active) {
      Invoke-DemoApi -Method POST -Path "/users/$($existing.id)/reactivation" `
        -AccessToken $accessToken -Operation "Reactivate fictional account $($account.email)" | Out-Null
    }

    $accountLogin = Invoke-DemoApi -Method POST -Path '/auth/login' -Body @{
      email = $account.email
      password = $demoPassword
    } -Operation "Validate fictional account $($account.email)"

    if ($accountLogin.user.profileName -ne $account.profileName) {
      throw "Fictional account $($account.email) authenticated with an unexpected profile."
    }
  }
  finally {
    $demoPassword = $null
  }
}

function Get-OpenAccess {
  param([Parameter(Mandatory)][string]$Plate)

  $records = Invoke-DemoApi -Method GET -Path '/access-records/open' `
    -AccessToken $accessToken -Operation 'List open general accesses'
  return @(Get-DemoCollection -Value $records) |
    Where-Object { $_.plate -eq $Plate } |
    Select-Object -First 1
}

function Get-AccessHistory {
  param([Parameter(Mandatory)][string]$Plate)

  $plateQuery = Get-EncodedValue -Value $Plate
  $result = Invoke-DemoApi -Method GET `
    -Path "/access-records/history?plate=$plateQuery&page=1&pageSize=100" `
    -AccessToken $accessToken -Operation "Search access history for $Plate"
  return @(Get-DemoCollection -Value $result.items)
}

function New-GeneralAccess {
  param(
    [Parameter(Mandatory)][string]$DriverName,
    [Parameter(Mandatory)][string]$Plate,
    [Parameter(Mandatory)][string]$Objective,
    [Parameter(Mandatory)][string]$CategoryName,
    [AllowNull()][Nullable[int]]$EventAuthorizationId
  )

  $body = @{
    driverName = $DriverName
    plate = $Plate
    objective = $Objective
    categoryName = $CategoryName
    vehicleType = "Autom${oAcute}vel"
    brand = "Marca fict${iAcute}cia"
    model = "Modelo de demonstra${cCedilla}${aTilde}o"
    color = 'Prata'
    year = 2024
    observation = "Registro exclusivamente fict${iAcute}cio para demonstra${cCedilla}${aTilde}o local."
  }

  if ($null -ne $EventAuthorizationId) {
    $body.eventAuthorizationId = $EventAuthorizationId
  }

  return Invoke-DemoApi -Method POST -Path '/access-records/entries' -Body $body `
    -AccessToken $accessToken -Operation "Create general access for $Plate"
}

$closedPlate = 'DMO1A01'
$closedHistory = Get-AccessHistory -Plate $closedPlate
$closedRecord = $closedHistory | Where-Object { $_.status -eq 'Encerrado' } | Select-Object -First 1
if ($null -eq $closedRecord) {
  $recordToClose = Get-OpenAccess -Plate $closedPlate
  if ($null -eq $recordToClose) {
    $recordToClose = New-GeneralAccess -DriverName "Visitante Fict${iAcute}cio" -Plate $closedPlate `
      -Objective "Reuni${aTilde}o academica de demonstra${cCedilla}${aTilde}o" -CategoryName 'Visitante'
  }

  $closedRecord = Invoke-DemoApi -Method POST -Path "/access-records/$($recordToClose.id)/exit" `
    -AccessToken $accessToken -Operation "Close general access for $closedPlate"
}

$openPlate = 'DMO1A02'
$openRecord = Get-OpenAccess -Plate $openPlate
if ($null -eq $openRecord) {
  $openRecord = New-GeneralAccess -DriverName "Prestador Fict${iAcute}cio" -Plate $openPlate `
    -Objective "Manuten${cCedilla}${aTilde}o preventiva fict${iAcute}cia" `
    -CategoryName "Prestador de servi${cCedilla}o"
}

$vehicleResponse = Invoke-DemoApi -Method GET -Path '/institutional-vehicles' `
  -AccessToken $accessToken -Operation 'List institutional vehicles'
$vehicles = @(Get-DemoCollection -Value $vehicleResponse)

function Get-OrCreateInstitutionalVehicle {
  param(
    [Parameter(Mandatory)][string]$Plate,
    [Parameter(Mandatory)][string]$Identification,
    [Parameter(Mandatory)][string]$VehicleType
  )

  $vehicle = $vehicles |
    Where-Object { $null -ne $_ -and $_.identification -eq $Identification } |
    Select-Object -First 1
  if ($null -ne $vehicle) {
    return $vehicle
  }

  return Invoke-DemoApi -Method POST -Path '/institutional-vehicles' `
    -AccessToken $accessToken -Body @{
      plate = $Plate
      identification = $Identification
      vehicleType = $VehicleType
      brand = "Marca institucional fict${iAcute}cia"
      model = "Modelo de demonstra${cCedilla}${aTilde}o"
      color = 'Branco'
      year = 2023
    } -Operation "Create institutional vehicle $Identification"
}

$closedUsageVehicle = Get-OrCreateInstitutionalVehicle -Plate 'DMO2B01' `
  -Identification 'DEMO-001' -VehicleType 'Van'
$openUsageVehicle = Get-OrCreateInstitutionalVehicle -Plate 'DMO2B02' `
  -Identification 'DEMO-002' -VehicleType "Autom${oAcute}vel"

$driverResponse = Invoke-DemoApi -Method GET -Path '/institutional-drivers' `
  -AccessToken $accessToken -Operation 'List institutional drivers'
$drivers = @(Get-DemoCollection -Value $driverResponse)
$fictionalDriverName = "Motorista Institucional Fict${iAcute}cio"
$driver = $drivers |
  Where-Object { $null -ne $_ -and $_.name -eq $fictionalDriverName } |
  Select-Object -First 1
if ($null -eq $driver) {
  $driver = Invoke-DemoApi -Method POST -Path '/institutional-drivers' `
    -AccessToken $accessToken -Body @{
      name = $fictionalDriverName
    } -Operation 'Create fictional institutional driver'
}

function Get-InstitutionalUsageHistory {
  param([Parameter(Mandatory)][int]$VehicleId)

  $result = Invoke-DemoApi -Method GET `
    -Path "/institutional-vehicle-usages/history?vehicleId=$VehicleId&page=1&pageSize=100" `
    -AccessToken $accessToken -Operation "Search usage history for vehicle $VehicleId"
  return @(Get-DemoCollection -Value $result.items)
}

$closedUsageHistory = Get-InstitutionalUsageHistory -VehicleId $closedUsageVehicle.id
$closedUsage = $closedUsageHistory | Where-Object { $_.status -eq 'Concluido' } | Select-Object -First 1
if ($null -eq $closedUsage) {
  $openUsageResponse = Invoke-DemoApi -Method GET -Path '/institutional-vehicle-usages/open' `
    -AccessToken $accessToken -Operation 'List open institutional usages'
  $openUsages = @(Get-DemoCollection -Value $openUsageResponse)
  $usageToClose = $openUsages | Where-Object { $_.vehicleId -eq $closedUsageVehicle.id } | Select-Object -First 1
  if ($null -eq $usageToClose) {
    $usageToClose = Invoke-DemoApi -Method POST -Path '/institutional-vehicle-usages/departures' `
      -AccessToken $accessToken -Body @{
        vehicleId = $closedUsageVehicle.id
        driverId = $driver.personId
        departureMileage = 12500
        itinerary = "Campus - destino fict${iAcute}cio - campus"
      } -Operation 'Create completed institutional usage'
  }

  $closedUsage = Invoke-DemoApi -Method POST `
    -Path "/institutional-vehicle-usages/$($usageToClose.id)/returns" `
    -AccessToken $accessToken -Body @{ returnMileage = 12542 } `
    -Operation 'Complete institutional usage'
}

$openUsageResponse = Invoke-DemoApi -Method GET -Path '/institutional-vehicle-usages/open' `
  -AccessToken $accessToken -Operation 'List open institutional usages'
$openUsages = @(Get-DemoCollection -Value $openUsageResponse)
$openUsage = $openUsages | Where-Object { $_.vehicleId -eq $openUsageVehicle.id } | Select-Object -First 1
if ($null -eq $openUsage) {
  $openUsage = Invoke-DemoApi -Method POST -Path '/institutional-vehicle-usages/departures' `
    -AccessToken $accessToken -Body @{
      vehicleId = $openUsageVehicle.id
      driverId = $driver.personId
      departureMileage = 28400
      itinerary = "Campus - atividade externa fict${iAcute}cia"
    } -Operation 'Create open institutional usage'
}

$eventName = "Evento Fict${iAcute}cio de Demonstra${cCedilla}${aTilde}o"
$eventQuery = Get-EncodedValue -Value $eventName
$events = Invoke-DemoApi -Method GET `
  -Path "/event-authorizations?name=$eventQuery&active=true&page=1&pageSize=25" `
  -AccessToken $accessToken -Operation 'Search fictional event authorization'
$event = @(Get-DemoCollection -Value $events.items) |
  Where-Object { $_.name -eq $eventName } |
  Select-Object -First 1
if ($null -eq $event) {
  $event = Invoke-DemoApi -Method POST -Path '/event-authorizations' `
    -AccessToken $accessToken -Body @{
      name = $eventName
      responsible = "Coordenacao Academica Fict${iAcute}cia"
      startsAtUtc = [DateTime]::UtcNow.AddHours(-1).ToString('O')
      endsAtUtc = [DateTime]::UtcNow.AddDays(7).ToString('O')
      area = "Patio de demonstra${cCedilla}${aTilde}o"
      overnightAllowed = $true
      vehicleRules = @(
        @{ vehicleType = "Autom${oAcute}vel"; quantity = 1; plate = 'DMO3C01' },
        @{ vehicleType = 'Van'; quantity = 2 }
      )
      notes = "Evento e participantes exclusivamente fict${iAcute}cios."
    } -Operation 'Create fictional event authorization'
}

$eventPlate = 'DMO3C01'
$eventHistory = @(Get-AccessHistory -Plate $eventPlate)
$eventOpenRecord = Get-OpenAccess -Plate $eventPlate
if ($eventHistory.Count -eq 0 -and $null -eq $eventOpenRecord) {
  $eventOpenRecord = New-GeneralAccess -DriverName "Participante Fict${iAcute}cio" `
    -Plate $eventPlate -Objective "Participa${cCedilla}${aTilde}o no evento de demonstra${cCedilla}${aTilde}o" `
    -CategoryName 'Evento' -EventAuthorizationId $event.id
}

$summary = Invoke-DemoApi -Method GET -Path '/operations/daily-summary' `
  -AccessToken $accessToken -Operation 'Read demonstration daily summary'

$accessToken = $null

Write-Output ''
Write-Output 'Fictional local demonstration data is ready.'
Write-Output 'Accounts (use each distinct temporary password entered interactively):'
$demoAccounts | ForEach-Object { Write-Output "- $($_.profileName): $($_.email)" }
Write-Output "Closed general access: $closedPlate (record $($closedRecord.id))"
Write-Output "Open general access: $openPlate (record $($openRecord.id))"
Write-Output "Completed institutional usage: DEMO-001 (usage $($closedUsage.id))"
Write-Output "Open institutional usage: DEMO-002 (usage $($openUsage.id))"
Write-Output "Active event: $eventName (event $($event.id))"
Write-Output "Daily summary date: $($summary.localDate)"
Write-Output 'Run the script again with the same local database to confirm idempotency.'
