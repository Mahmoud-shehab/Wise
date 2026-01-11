@echo off
chcp 65001 >nul
echo ========================================
echo Starting Wise Task Manager Server...
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] node_modules folder not found!
    echo [INFO] Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo Please run: npm install
        pause
        exit /b 1
    )
)

echo [INFO] Starting development server...
echo [INFO] Server will be available at: http://localhost:5173
echo [INFO] Press Ctrl+C to stop the server
echo.
call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start server!
    echo Please check the error messages above.
    pause
    exit /b 1
)

pause
