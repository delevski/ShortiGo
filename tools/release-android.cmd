@echo off
rem ShortiGo - one double-click Android release (builds a signed AAB for Google Play).
rem Works from anywhere: it jumps to the repo root first.
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0release-android.ps1"
set RC=%ERRORLEVEL%
echo.
if not "%RC%"=="0" (
  echo Release build did NOT finish. Read the STOP message above.
) else (
  echo Finished.
)
pause
exit /b %RC%
