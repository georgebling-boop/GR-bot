@echo off
REM Convenience wrapper for Task Scheduler
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-bot-forever.ps1"
