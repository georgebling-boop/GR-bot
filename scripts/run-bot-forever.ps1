$ErrorActionPreference = 'Stop'

# Runs the bot server forever; restarts on crash.
# Safe to run manually or via Task Scheduler.

$repo = "C:\Users\georg\GR-bot"

while ($true) {
  try {
    Set-Location $repo

    # Ensure pnpm is available via corepack
    corepack enable | Out-Null

    Write-Host "[GR-bot] Starting server..." -ForegroundColor Cyan
    corepack pnpm start

    Write-Host "[GR-bot] Server exited. Restarting in 5s..." -ForegroundColor Yellow
  } catch {
    Write-Host "[GR-bot] Crash: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[GR-bot] Restarting in 5s..." -ForegroundColor Yellow
  }

  Start-Sleep -Seconds 5
}
