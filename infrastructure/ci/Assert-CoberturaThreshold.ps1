[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Container })]
  [string] $ReportDirectory,

  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string] $PackageName,

  [Parameter(Mandatory)]
  [ValidateRange(0, 100)]
  [double] $MinimumLineCoverage,

  [Parameter(Mandatory)]
  [ValidateRange(0, 100)]
  [double] $MinimumBranchCoverage
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$reports = @(Get-ChildItem -LiteralPath $ReportDirectory -Recurse -Filter '*.cobertura.xml')

if ($reports.Count -ne 1) {
  throw "Expected exactly one Cobertura report in '$ReportDirectory', found $($reports.Count)."
}

[xml] $coverage = Get-Content -LiteralPath $reports[0].FullName
$package = @($coverage.coverage.packages.package) |
  Where-Object { $_.name -eq $PackageName } |
  Select-Object -First 1

if ($null -eq $package) {
  throw "Package '$PackageName' was not found in '$($reports[0].FullName)'."
}

$culture = [Globalization.CultureInfo]::InvariantCulture
$lineCoverage = [double]::Parse($package.'line-rate', $culture) * 100
$branchCoverage = [double]::Parse($package.'branch-rate', $culture) * 100

Write-Output (
  '{0}: lines {1:N2}% (minimum {2:N2}%), branches {3:N2}% (minimum {4:N2}%)' -f
    $PackageName,
    $lineCoverage,
    $MinimumLineCoverage,
    $branchCoverage,
    $MinimumBranchCoverage
)

if ($lineCoverage + 0.0001 -lt $MinimumLineCoverage) {
  throw "Line coverage for '$PackageName' regressed below $MinimumLineCoverage%."
}

if ($branchCoverage + 0.0001 -lt $MinimumBranchCoverage) {
  throw "Branch coverage for '$PackageName' regressed below $MinimumBranchCoverage%."
}
