[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$verifier = Join-Path $PSScriptRoot 'Assert-CoberturaThreshold.ps1'
$fixtureDirectory = Join-Path ([IO.Path]::GetTempPath()) ('cav-coverage-' + [guid]::NewGuid().ToString('N'))
[void] [IO.Directory]::CreateDirectory($fixtureDirectory)
$report = Join-Path $fixtureDirectory 'fixture.cobertura.xml'
$cases = @(
  @{ Name = 'exact threshold'; Line = '0.9'; Branch = '0.9'; Pass = $true },
  @{ Name = 'full coverage'; Line = '1'; Branch = '1'; Pass = $true },
  @{ Name = 'line regression'; Line = '0.89'; Branch = '0.95'; Pass = $false },
  @{ Name = 'branch regression'; Line = '0.95'; Branch = '0.89'; Pass = $false },
  @{ Name = 'NaN line'; Line = 'NaN'; Branch = '0.95'; Pass = $false },
  @{ Name = 'NaN branch'; Line = '0.95'; Branch = 'NaN'; Pass = $false },
  @{ Name = 'infinite line'; Line = 'Infinity'; Branch = '0.95'; Pass = $false },
  @{ Name = 'negative line'; Line = '-0.1'; Branch = '0.95'; Pass = $false },
  @{ Name = 'out of range branch'; Line = '0.95'; Branch = '1.1'; Pass = $false },
  @{ Name = 'comma decimal'; Line = '0,95'; Branch = '0.95'; Pass = $false },
  @{ Name = 'duplicate package'; Line = '0.95'; Branch = '0.95'; Duplicate = $true; Pass = $false },
  @{ Name = 'wrong package'; Line = '0.95'; Branch = '0.95'; Package = 'Other'; Pass = $false },
  @{ Name = 'missing line rate'; Line = ''; Branch = '0.95'; Pass = $false },
  @{ Name = 'malformed XML'; Malformed = $true; Pass = $false },
  @{ Name = 'no report'; Missing = $true; Pass = $false },
  @{ Name = 'multiple reports'; Line = '0.95'; Branch = '0.95'; Multiple = $true; Pass = $false }
)
$failures = @()

try {
  foreach ($case in $cases) {
    Get-ChildItem -LiteralPath $fixtureDirectory -File | Remove-Item -Force
    if (!$case.ContainsKey('Missing')) {
      if ($case.ContainsKey('Malformed')) {
        $xml = '<coverage>'
      }
      else {
        $name = if ($case.ContainsKey('Package')) { $case.Package } else { 'Critical' }
        $package = '<package name="{0}" line-rate="{1}" branch-rate="{2}" />' -f $name, $case.Line, $case.Branch
        if ($case.ContainsKey('Duplicate')) { $package += $package }
        $xml = '<coverage><packages>{0}</packages></coverage>' -f $package
      }
      [IO.File]::WriteAllText($report, $xml)
      if ($case.ContainsKey('Multiple')) {
        [IO.File]::WriteAllText((Join-Path $fixtureDirectory 'second.cobertura.xml'), $xml)
      }
    }

    $accepted = $true
    try {
      & $verifier -ReportDirectory $fixtureDirectory -PackageName Critical -MinimumLineCoverage 90 -MinimumBranchCoverage 90 | Out-Null
    }
    catch {
      $accepted = $false
    }
    if ($accepted -ne $case.Pass) { $failures += $case.Name }
  }
}
finally {
  # Only remove the files in this newly created, flat fixture directory.
  Get-ChildItem -LiteralPath $fixtureDirectory -File | Remove-Item -Force
  Remove-Item -LiteralPath $fixtureDirectory -Force
}

if ($failures.Count -gt 0) {
  throw ('Coverage gate regression cases failed: ' + ($failures -join ', '))
}
Write-Output ('Coverage gate: {0} regression cases passed.' -f $cases.Count)
