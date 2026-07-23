$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$BaseUrl = if ($env:VSPYSHKA_DOWNLOAD_BASE) { $env:VSPYSHKA_DOWNLOAD_BASE } else { "https://arlist.ru/dl/vspyshka" }
$InstallDir = if ($env:VSPYSHKA_INSTALL_DIR) { $env:VSPYSHKA_INSTALL_DIR } else { "$env:LOCALAPPDATA\Vspyshka\bin" }

$arch = if ([Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
} else {
    Write-Error "Поддерживаются только 64-битные системы."
    exit 1
}

$archive = if ($arch -eq "arm64") { "vspyshka-win32-arm64.zip" } else { "vspyshka-win32-x64.zip" }

Write-Host "Скачиваю Вспышку ($archive)..."
$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $tmpDir | Out-Null
try {
    $archivePath = Join-Path $tmpDir $archive
    Invoke-WebRequest -Uri "$BaseUrl/latest/$archive" -OutFile $archivePath

    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Expand-Archive -Path $archivePath -DestinationPath $tmpDir -Force
    Copy-Item -Path (Join-Path $tmpDir "vsp.exe") -Destination (Join-Path $InstallDir "vsp.exe") -Force
    Copy-Item -Path (Join-Path $tmpDir "vspyshka-windows-sandbox-setup.exe") -Destination $InstallDir -Force
    Copy-Item -Path (Join-Path $tmpDir "vspyshka-command-runner.exe") -Destination $InstallDir -Force

    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$InstallDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$userPath;$InstallDir", "User")
        Write-Host "Добавил $InstallDir в PATH — перезапустите терминал."
    }
} finally {
    Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue
}

Write-Host "Готово. Запустите: vsp"
