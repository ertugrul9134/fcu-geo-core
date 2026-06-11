@echo off
REM Deploy FCU Jeodezik Cekirdek to Surge.sh
REM Run this from: uygulama_2\survey_app

echo Deploying to fundamentals-surveying.surge.sh ...

REM Option A: Token-based (non-interactive, recommended)
npx surge . fundamentals-surveying.surge.sh --token f446ab41f71c29db84adb45d7069ff13

REM Option B: If token fails, use env vars
REM set SURGE_TOKEN=f446ab41f71c29db84adb45d7069ff13
REM npx surge . fundamentals-surveying.surge.sh

echo.
echo Deploy complete. Site: https://fundamentals-surveying.surge.sh
pause
