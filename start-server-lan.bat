@echo off
cd /d "%~dp0"
echo.
echo   Phone / tablet on the same Wi-Fi:
echo   http://YOUR-PC-LAN-IP:8080/
echo   (Run ipconfig to find the IPv4 address. Allow PowerShell through the firewall.)
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Bind 0.0.0.0 -Port 8080
pause
