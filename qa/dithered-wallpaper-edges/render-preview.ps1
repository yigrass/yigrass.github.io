$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$capture = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'draw-capture.json') -Raw | ConvertFrom-Json
$source = [System.Drawing.Bitmap]::new((Join-Path $projectRoot $capture.source))
$fill = [System.Drawing.ColorTranslator]::FromHtml($capture.fill)
$brush = [System.Drawing.SolidBrush]::new($fill)
try {
    foreach ($preview in $capture.cases) {
        $bitmap = [System.Drawing.Bitmap]::new([int]$preview.width, [int]$preview.height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear($fill)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear
            $destination = [System.Drawing.RectangleF]::new([single]$preview.left, [single]$preview.top, [single]$preview.imageWidth, [single]$preview.imageHeight)
            $graphics.DrawImage($source, $destination)
            foreach ($index in $preview.cells) {
                $column = $index % $preview.columns
                $row = [math]::Floor($index / $preview.columns)
                $x = $column * $capture.pixel
                $y = $row * $capture.pixel
                $cellWidth = [math]::Min($capture.pixel, $preview.imageWidth - $x)
                $cellHeight = [math]::Min($capture.pixel, $preview.imageHeight - $y)
                $graphics.FillRectangle($brush, [single]($preview.left + $x), [single]($preview.top + $y), [single]$cellWidth, [single]$cellHeight)
            }
            $outputPath = Join-Path $PSScriptRoot ($preview.name + '.png')
            $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
            Get-Item -LiteralPath $outputPath | Select-Object Name,Length
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $brush.Dispose(); $source.Dispose() }
