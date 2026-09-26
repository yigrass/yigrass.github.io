$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$launcher = 'C:/Users/a/.codex/skills/aseprite-automation/scripts/invoke-aseprite.cmd'
$inputs = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'inputs.json') -Raw | ConvertFrom-Json
$count = 0
foreach ($inputRecord in $inputs) {
    $name = [IO.Path]::GetFileNameWithoutExtension($inputRecord.name)
    $destination = Join-Path $PSScriptRoot ('png/' + $inputRecord.name)
    if (Test-Path -LiteralPath $destination) { throw "Refusing stale output: $destination" }
    $run = Join-Path $PSScriptRoot ('exports-v2/' + $name)
    & $launcher -Mode export -WorkspaceRoot $root -InputPath (Join-Path $PSScriptRoot ('sprites-v2/' + $name + '.aseprite')) -OutputPath $destination -RunDir $run | Out-Null
    if ($LASTEXITCODE) { throw "Export failed: $name" }
    $logs = Get-Content -LiteralPath (Join-Path $run 'export.stdout.log'),(Join-Path $run 'export.stderr.log') -Raw
    if ($logs -match 'Error saving|Cannot save|Error:') { throw "Aseprite logged an export error: $name" }
    if ((Get-Item -LiteralPath $destination).Length -le 0) { throw "Missing image: $name" }
    $count++
    if ($count % 8 -eq 0) { Write-Output "Exported $count / $($inputs.Count) icons" }
}
