Write-Host "Configurando hooks locales de Git para este repositorio..." -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path ".git")) {
  Write-Host "No se encontro carpeta .git en la raiz. Ejecuta este script dentro del repositorio." -ForegroundColor Red
  exit 1
}

git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
  Write-Host "No se pudo configurar core.hooksPath." -ForegroundColor Red
  exit 1
}

Write-Host "Hooks configurados correctamente." -ForegroundColor Green
Write-Host "Ruta activa: .githooks" -ForegroundColor Green
Write-Host "Ahora cada git push ejecutara quality en frontend y backend." -ForegroundColor Green
