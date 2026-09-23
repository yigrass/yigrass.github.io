[CmdletBinding()]
param([string]$Launcher = (Join-Path $env:USERPROFILE '.codex/skills/aseprite-automation/scripts/invoke-aseprite.cmd'))
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$source=Join-Path $projectRoot 'assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png'
$workspace=Join-Path $projectRoot 'qa/scrollbar-arrow-assets'
$runName=([DateTime]::Now.ToString('yyyyMMdd-HHmmss'))+'-'+([Guid]::NewGuid().ToString('N').Substring(0,8))
$work=Join-Path $workspace ('derived/'+$runName)
$destination=Join-Path $projectRoot 'assets/pixel-ui/v1.3.0/generated'
if (!(Test-Path -LiteralPath $Launcher) -or !(Test-Path -LiteralPath $source)) { throw 'Aseprite launcher or source PNG missing.' }
[void][IO.Directory]::CreateDirectory($work)
[void][IO.Directory]::CreateDirectory($destination)
$runs=@()
function Invoke-ArrowStep([string[]]$Arguments) {
  $lines=& $Launcher @Arguments
  if ($LASTEXITCODE -ne 0) { throw 'Aseprite step failed; inspect the wrapper run log.' }
  $result=($lines -join "`n") | ConvertFrom-Json
  if (!$result.ok) { throw 'Aseprite step did not succeed.' }
  return $result
}
$runs+=Invoke-ArrowStep @('-Mode','doctor','-WorkspaceRoot',$workspace)
$runs+=Invoke-ArrowStep @('-Mode','run-script','-WorkspaceRoot',$workspace,'-ScriptPath',(Join-Path $projectRoot 'art/pixel-ui/v1.3.0/derive-arrows.lua'),'-ScriptParamList',("input="+$source+";output="+$work),'-ExpectedPathList',(Join-Path $work 'contact-sheet.aseprite'))
foreach ($name in @('arrow-right','arrow-down','arrow-left','arrow-up-disabled','arrow-right-disabled','arrow-down-disabled','arrow-left-disabled','contact-sheet')) {
  $output=if ($name -eq 'contact-sheet') { Join-Path $work 'contact-sheet.png' } else { Join-Path $destination ($name+'.png') }
  $runs+=Invoke-ArrowStep @('-Mode','export','-WorkspaceRoot',$workspace,'-InputPath',(Join-Path $work ($name+'.aseprite')),'-OutputPath',$output)
}
$report=[ordered]@{source='assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png';sourceSha256=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash;workDirectory=$work;wrapperRuns=@($runs | Select-Object mode,run_dir,ok);note='Generated variants only. The editable source PNG is never overwritten.'}
[IO.File]::WriteAllText((Join-Path $work 'generation.json'),($report | ConvertTo-Json -Depth 8)+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
Write-Output ('Generated seven arrow variants. Preview: '+(Join-Path $work 'contact-sheet.png'))
