$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tree = Get-Content -LiteralPath (Join-Path $projectRoot 'project-task-tree.json') -Raw | ConvertFrom-Json
$validStatuses = @('pending','in_progress','paused','blocked','completed','cancelled')
$ids = @($tree.tasks | ForEach-Object { $_.id })
if (@($ids | Select-Object -Unique).Count -ne $ids.Count) { throw 'Duplicate task IDs.' }
foreach ($task in $tree.tasks) {
    if ($task.status -notin $validStatuses) { throw "Invalid task status: $($task.id)" }
    if ($null -ne $task.parent -and $task.parent -notin $ids) { throw "Unknown parent: $($task.id)" }
    if (-not $task.returnPoint) { throw "Missing return point: $($task.id)" }
    foreach ($dependency in $task.dependencies) { if ($dependency -notin $ids) { throw "Unknown dependency: $dependency" } }
}
if ($tree.rootTaskId -notin $ids -or $tree.currentContextTaskId -notin $ids) { throw 'Invalid root or context task.' }
$rootTask = $tree.tasks | Where-Object id -eq $tree.rootTaskId
if ($rootTask.status -ne $tree.status) { throw 'Root and project status differ.' }
if ($tree.status -in @('paused','completed')) {
    if ($tree.currentContextTaskId -ne $tree.rootTaskId -or $null -ne $tree.currentWorkingBranchTaskId -or @($tree.activeExecutionBranches).Count -or @($tree.writeLeases).Count -or @($tree.tasks | Where-Object status -eq 'in_progress').Count) { throw 'Invalid inactive project state.' }
}
if ($tree.status -eq 'completed' -and @($tree.tasks | Where-Object { $_.status -notin @('completed','cancelled') }).Count) { throw 'Completed project has unfinished tasks.' }
foreach ($eventLine in Get-Content -LiteralPath (Join-Path $projectRoot $tree.metadata.eventLogPath)) {
    if (-not $eventLine.Trim()) { continue }
    $event = $eventLine | ConvertFrom-Json
    if ($event.taskId -notin $ids -or $event.status -notin $validStatuses) { throw 'Invalid transition event.' }
}
& (Join-Path $PSScriptRoot 'generate-task-tree-doc.ps1') -Check
Write-Output 'Task controls passed.'
