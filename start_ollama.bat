@echo off
chcp 932 > nul
echo ============================================
echo  Done Stack - Start Ollama
echo ============================================
echo.

where ollama > nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Ollama not found.
  echo         Please run setup_ollama.bat first.
  pause
  exit /b 1
)

:: Check if already running
curl -s --max-time 2 "http://localhost:11434/api/tags" > nul 2>&1
if %errorlevel% == 0 (
  echo [OK] Ollama is already running.
  echo      Reload the app to see "LLM connected".
  echo.
  pause
  exit /b 0
)

echo [  ] Starting Ollama...
echo      Keep this window open while using the app.
echo      Press Ctrl+C to stop.
echo.

set OLLAMA_ORIGINS=*
ollama serve