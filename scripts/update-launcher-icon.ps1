$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'android-app/icon-source.png'
$resourceRoot = Join-Path $projectRoot 'android/app/src/main/res'
$source = [System.Drawing.Image]::FromFile($sourcePath)

function Save-Icon([string]$targetPath, [int]$size, [double]$contentRatio) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $innerSize = [int][Math]::Round($size * $contentRatio)
        $offset = [int][Math]::Floor(($size - $innerSize) / 2)
        $destination = [System.Drawing.Rectangle]::new($offset, $offset, $innerSize, $innerSize)
        $graphics.DrawImage($source, $destination)
        $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    $sizes = @(
        @{ density = 'mdpi'; icon = 48; foreground = 108 },
        @{ density = 'hdpi'; icon = 72; foreground = 162 },
        @{ density = 'xhdpi'; icon = 96; foreground = 216 },
        @{ density = 'xxhdpi'; icon = 144; foreground = 324 },
        @{ density = 'xxxhdpi'; icon = 192; foreground = 432 }
    )
    foreach ($entry in $sizes) {
        $folder = Join-Path $resourceRoot "mipmap-$($entry.density)"
        Save-Icon (Join-Path $folder 'ic_launcher.png') $entry.icon 1.0
        Save-Icon (Join-Path $folder 'ic_launcher_round.png') $entry.icon 1.0
        Save-Icon (Join-Path $folder 'ic_launcher_foreground.png') $entry.foreground (2.0 / 3.0)
    }
} finally {
    $source.Dispose()
}

Write-Output 'Android launcher icons updated for all densities.'
