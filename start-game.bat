@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
set CODEX_PY=C:\Users\H\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe

echo 正在启动《九州：华夏文明》本地服务...
echo 请不要关闭这个黑色窗口；关闭后游戏页面会停止读取数据。
echo.

if exist "%CODEX_PY%" (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:%PORT%/'"
  echo 如果浏览器没有自动打开，请手动访问：
  echo http://127.0.0.1:%PORT%/
  echo.
  "%CODEX_PY%" -m http.server %PORT% --bind 127.0.0.1
  pause
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:%PORT%/'"
  echo 如果浏览器没有自动打开，请手动访问：
  echo http://127.0.0.1:%PORT%/
  echo.
  py -m http.server %PORT% --bind 127.0.0.1
  pause
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:%PORT%/'"
  echo 如果浏览器没有自动打开，请手动访问：
  echo http://127.0.0.1:%PORT%/
  echo.
  python -m http.server %PORT% --bind 127.0.0.1
  pause
  goto :eof
)

echo 没有找到可用的 Python，无法启动本地服务。
echo 也可以把项目部署到 GitHub Pages 后打开。
pause
