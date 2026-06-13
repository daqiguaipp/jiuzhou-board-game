$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8000
$pythonCandidates = @(
  "C:\Users\H\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe",
  "py",
  "python"
)

Set-Location $root

$python = $null
foreach ($candidate in $pythonCandidates) {
  if (Test-Path $candidate) {
    $python = $candidate
    break
  }
  $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
  if ($cmd) {
    $python = $cmd.Source
    break
  }
}

if (-not $python) {
  Write-Host "没有找到可用的 Python，无法启动本地服务。"
  Read-Host "按回车退出"
  exit 1
}

Write-Host "正在启动《九州：华夏文明》本地服务..."
Write-Host "地址：http://127.0.0.1:$port/"
Write-Host "请保持这个窗口打开。"

$server = Start-Process -FilePath $python -ArgumentList @("-m", "http.server", "$port", "--bind", "127.0.0.1") -WorkingDirectory $root -WindowStyle Minimized -PassThru
Start-Sleep -Seconds 1
Start-Process "http://127.0.0.1:$port/"

Read-Host "按回车关闭本地服务"
Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
