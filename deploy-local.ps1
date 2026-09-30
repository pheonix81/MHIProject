#!/usr/bin/env pwsh
# Local Deployment Script for Healthcare Price Transparency Platform
# Runs both backend and frontend in production mode

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Local Production Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BackendPort = 3001
$FrontendPort = 3000
$BackendDir = ".\backend"
$FrontendDir = ".\frontend"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host ""

# Check if dist folders exist
Write-Host "✓ Checking production builds..." -ForegroundColor Yellow
if (-not (Test-Path "$BackendDir\dist")) {
    Write-Host "❌ Backend dist folder not found. Run: npm run build" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$FrontendDir\.next")) {
    Write-Host "❌ Frontend .next folder not found. Run: npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Builds verified" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
Push-Location $BackendDir
$BackendJob = Start-Job -ScriptBlock {
    cd $using:BackendDir
    node dist/server.js
} -Name "HealthcareBackend"
Pop-Location

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🚀 Starting Frontend Server..." -ForegroundColor Cyan
Push-Location $FrontendDir
$FrontendJob = Start-Job -ScriptBlock {
    cd $using:FrontendDir
    npm start
} -Name "HealthcareFrontend"
Pop-Location

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Local Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Server Status:" -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort @($BackendPort, $FrontendPort) -ErrorAction SilentlyContinue | 
  Where-Object { $_.State -eq "Listen" } | 
  ForEach-Object { 
    if ($_.LocalPort -eq $BackendPort) {
      Write-Host "  ✓ Backend:  Listening on port $($_.LocalPort)" -ForegroundColor Green
    } else {
      Write-Host "  ✓ Frontend: Listening on port $($_.LocalPort)" -ForegroundColor Green
    }
  }

Write-Host ""
Write-Host "🌐 Access the application:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor Green
Write-Host "   API:      http://localhost:$BackendPort/api/health" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Job IDs for reference:" -ForegroundColor Yellow
Write-Host "   Backend:  $($BackendJob.Id)" -ForegroundColor Gray
Write-Host "   Frontend: $($FrontendJob.Id)" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Keep script running and monitor jobs
while ($BackendJob.State -eq "Running" -or $FrontendJob.State -eq "Running") {
    Start-Sleep -Seconds 5
}

Write-Host "Deployment finished." -ForegroundColor Yellow
