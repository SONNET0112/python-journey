@echo off
rem Python Journey 本地启动器：已启动就直接打开，没启动就先起服务、等服务就绪再开浏览器
setlocal
cd /d "%~dp0"
set "PORT=5188"
set "URL=http://localhost:%PORT%/"

rem 1) 服务已经在跑：直接打开
curl -s -o NUL --max-time 2 "%URL%"
if not errorlevel 1 (
  start "" "%URL%"
  exit /b 0
)

rem 2) 没装 Node 就明确报错，而不是闪一下窗口
where npm >NUL 2>NUL
if errorlevel 1 (
  echo [错误] 没有找到 Node.js / npm。请先安装 Node.js 再双击这个快捷方式。
  pause
  exit /b 1
)

echo 正在启动 Python Journey（第一次需要几秒）...
start "Python Journey 服务" /min cmd /c "npm run dev -- --port %PORT% --strictPort"

set /a TRIES=0
:wait
timeout /t 1 /nobreak >NUL
set /a TRIES+=1
curl -s -o NUL --max-time 2 "%URL%"
if not errorlevel 1 goto ready
if %TRIES% lss 45 goto wait

echo [错误] 启动超时（45 秒）。请把本窗口里的报错信息发给我。
pause
exit /b 1

:ready
echo 地址：%URL%
start "" "%URL%"
exit /b 0
