@echo off
chcp 932 > nul
echo ============================================
echo  Done Stack - Ollama Setup
echo ============================================
echo.

:: Check if Ollama is already installed
where ollama > nul 2>&1
if %errorlevel% == 0 (
  echo [OK] Ollama is already installed.
  goto :pull
)

:: Download installer
echo [1/2] Downloading Ollama installer...
curl -L --progress-bar "https://ollama.com/download/OllamaSetup.exe" -o "%TEMP%\OllamaSetup.exe"
if %errorlevel% neq 0 (
  echo [ERROR] Download failed. Please check your network connection.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting installer. Please follow the on-screen instructions.
echo.
start /wait "" "%TEMP%\OllamaSetup.exe"

:: Refresh PATH after install
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Ollama"

where ollama > nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Ollama command not found after install.
  echo         Please close this window and run again.
  pause
  exit /b 1
)
echo [OK] Ollama installed successfully.

:: Download model
:pull
echo.
echo -- Checking model (gemma3:4b) --

ollama list 2>nul | findstr /I "gemma3:4b" > nul
if %errorlevel% == 0 (
  echo [OK] gemma3:4b is already downloaded.
  goto :done
)

echo [  ] Downloading gemma3:4b. Please wait...
echo.
ollama pull gemma3:4b
if %errorlevel% neq 0 (
  echo [ERROR] Model download failed.
  pause
  exit /b 1
)

:done
echo.
echo ============================================
echo  Setup complete!
echo  Run start_ollama.bat to start the server.
echo ============================================
echo.
pause
