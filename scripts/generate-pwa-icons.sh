#!/bin/bash

# Script de génération des icônes PWA
# Nécessite ImageMagick: sudo apt-get install imagemagick ou brew install imagemagick

LOGO_SOURCE="$1"

if [ -z "$LOGO_SOURCE" ]; then
    echo "Utilisation: ./generate-pwa-icons.sh <chemin-vers-logo>"
    echo "Exemple: ./generate-pwa-icons.sh logo.png"
    exit 1
fi

if [ ! -f "$LOGO_SOURCE" ]; then
    echo "Erreur: Le fichier '$LOGO_SOURCE' n'existe pas"
    exit 1
fi

echo "Génération des icônes PWA depuis: $LOGO_SOURCE"

# Création du dossier public s'il n'existe pas
mkdir -p public

# Icônes standard
echo "Génération des icônes standard..."
convert "$LOGO_SOURCE" -resize 192x192 -background white -gravity center -extent 192x192 public/pwa-192x192.png
convert "$LOGO_SOURCE" -resize 512x512 -background white -gravity center -extent 512x512 public/pwa-512x512.png

# Icônes maskable (contenu au centre, au moins 80% de l'espace)
echo "Génération des icônes maskable..."
convert "$LOGO_SOURCE" -resize 154x154 -background white -gravity center -extent 192x192 public/pwa-maskable-192x192.png
convert "$LOGO_SOURCE" -resize 410x410 -background white -gravity center -extent 512x512 public/pwa-maskable-512x512.png

# Favicon
echo "Génération des favicons..."
convert "$LOGO_SOURCE" -resize 32x32 -background white -gravity center -extent 32x32 public/favicon.ico
convert "$LOGO_SOURCE" -resize 180x180 -background white -gravity center -extent 180x180 public/apple-touch-icon.png

echo "Génération terminée!"
echo ""
echo "Icônes créées:"
echo "  ✓ public/pwa-192x192.png"
echo "  ✓ public/pwa-512x512.png"
echo "  ✓ public/pwa-maskable-192x192.png"
echo "  ✓ public/pwa-maskable-512x512.png"
echo "  ✓ public/favicon.ico"
echo "  ✓ public/apple-touch-icon.png"
echo ""
echo "N'oubliez pas d'ajouter des screenshots PWA:"
echo "  - public/screenshot-1.png (540x720 - mobile)"
echo "  - public/screenshot-2.png (1280x720 - desktop)"
