# Script de génération des icônes PWA pour Windows
# Nécessite ImageMagick installé (https://imagemagick.org/script/download.php)
# Ou utiliser: choco install imagemagick

param(
    [string]$LogoSource
)

if ([string]::IsNullOrEmpty($LogoSource)) {
    Write-Host "Utilisation: .\generate-pwa-icons.ps1 -LogoSource <chemin-vers-logo>" -ForegroundColor Yellow
    Write-Host "Exemple: .\generate-pwa-icons.ps1 -LogoSource logo.png" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $LogoSource)) {
    Write-Host "Erreur: Le fichier '$LogoSource' n'existe pas" -ForegroundColor Red
    exit 1
}

# Vérifier si convert (ImageMagick) est disponible
try {
    $null = convert -version 2>$null
} catch {
    Write-Host "Erreur: ImageMagick n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Téléchargez-le depuis: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    exit 1
}

Write-Host "Génération des icônes PWA depuis: $LogoSource" -ForegroundColor Green

# Création du dossier public s'il n'existe pas
if (-not (Test-Path "public")) {
    New-Item -ItemType Directory -Path "public" -Force | Out-Null
}

Write-Host "Génération des icônes standard..." -ForegroundColor Cyan
convert "$LogoSource" -resize 192x192 -background white -gravity center -extent 192x192 "public/pwa-192x192.png"
convert "$LogoSource" -resize 512x512 -background white -gravity center -extent 512x512 "public/pwa-512x512.png"

Write-Host "Génération des icônes maskable..." -ForegroundColor Cyan
convert "$LogoSource" -resize 154x154 -background white -gravity center -extent 192x192 "public/pwa-maskable-192x192.png"
convert "$LogoSource" -resize 410x410 -background white -gravity center -extent 512x512 "public/pwa-maskable-512x512.png"

Write-Host "Génération des favicons..." -ForegroundColor Cyan
convert "$LogoSource" -resize 32x32 -background white -gravity center -extent 32x32 "public/favicon.ico"
convert "$LogoSource" -resize 180x180 -background white -gravity center -extent 180x180 "public/apple-touch-icon.png"

Write-Host "`nGénération terminée!" -ForegroundColor Green
Write-Host "`nIcônes créées:" -ForegroundColor Green
Write-Host "  ✓ public/pwa-192x192.png"
Write-Host "  ✓ public/pwa-512x512.png"
Write-Host "  ✓ public/pwa-maskable-192x192.png"
Write-Host "  ✓ public/pwa-maskable-512x512.png"
Write-Host "  ✓ public/favicon.ico"
Write-Host "  ✓ public/apple-touch-icon.png"
Write-Host "`nN'oubliez pas d'ajouter des screenshots PWA:" -ForegroundColor Yellow
Write-Host "  - public/screenshot-1.png (540x720 - mobile)"
Write-Host "  - public/screenshot-2.png (1280x720 - desktop)"
