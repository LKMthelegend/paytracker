# Guide de Déploiement PWA - PayTracker

## Préalables

- Node.js 16+ ou Bun
- npm ou yarn ou bun
- Accès à un serveur de production (avec HTTPS activé)
- Domaine personnalisé

## Étapes de Déploiement

### 1. Préparer les Icônes PWA

Générez les icônes PWA à partir de votre logo (carré de préférence 512x512px):

**Sur Windows (PowerShell):**
```powershell
.\scripts\generate-pwa-icons.ps1 -LogoSource logo.png
```

**Sur macOS/Linux:**
```bash
./scripts/generate-pwa-icons.sh logo.png
```

Les icônes seront générées dans le dossier `public/`.

### 2. Vérifier la Configuration PWA

Avant de build, vérifiez que tout est configuré:

```bash
npm run build
npm run preview
```

Puis ouvrez http://localhost:4173 et vérifiez:
- DevTools → Application → Service Workers → Service Worker enregistré
- DevTools → Application → Manifest → Manifest chargé correctement
- Chrome → Menu → "Installer PayTracker" ou icône téléchargement disponible

### 3. Générer la Build de Production

```bash
npm run build
```

Cela générera une version optimisée dans le dossier `dist/`.

### 4. Déploiement sur Serveur

#### Option A: Hébergement Statique (Vercel, Netlify, GitHub Pages)

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option B: Serveur Personnalisé (Apache, Nginx, Node.js)

**Avec Apache:**
1. Copiez le contenu du dossier `dist/` vers votre racine web
2. Copiez `public/.htaccess` vers la racine web
3. Assurez-vous que `mod_rewrite` est activé

**Avec Nginx:**
1. Copiez le contenu du dossier `dist/` vers `/var/www/paytracker/`
2. Configurez Nginx selon `nginx.conf`
3. Redémarrez Nginx: `sudo systemctl restart nginx`

**Avec Node.js:**
```bash
# Installer un serveur statique
npm install -g serve

# Lancer l'application
serve -s dist -l 3000
```

### 5. Configuration HTTPS

**Très Important**: La PWA ne fonctionne correctement qu'en HTTPS (sauf localhost)

**Option A: Let's Encrypt (recommandé et gratuit)**
```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Générer un certificat
sudo certbot certonly --nginx -d paytracker.app -d www.paytracker.app

# Renouvellement automatique
sudo systemctl enable certbot.timer
```

**Option B: Certificat payant**
Contactez votre fournisseur d'hébergement pour obtenir un certificat SSL.

### 6. Tester la PWA

Après le déploiement, testez:

#### Chrome/Edge (Bureau et Mobile)
```
1. Ouvrir https://paytracker.app
2. Menu → "Installer PayTracker" ou icône téléchargement
3. L'application s'installe sur l'écran d'accueil
```

#### Safari (iOS)
```
1. Ouvrir https://paytracker.app dans Safari
2. Partage → "Ajouter à l'écran d'accueil"
3. L'application s'ajoute à l'écran d'accueil
```

#### Firefox
```
1. Ouvrir https://paytracker.app
2. Alerte de PWA ou menu → "Installer PayTracker"
```

#### Lighthouse (Audit PWA)
```bash
# Dans Chrome DevTools
1. F12 → Lighthouse
2. Sélectionner "PWA"
3. Générer un rapport
```

### 7. Vérification de la Configuration

**Checklist de déploiement:**

- [ ] HTTPS activé
- [ ] Service Worker enregistré (`/sw.js`)
- [ ] Manifest valide (`/site.webmanifest`)
- [ ] Icônes présentes dans `public/`
  - [ ] `favicon.ico`
  - [ ] `apple-touch-icon.png`
  - [ ] `pwa-192x192.png`
  - [ ] `pwa-512x512.png`
  - [ ] `pwa-maskable-192x192.png`
  - [ ] `pwa-maskable-512x512.png`
- [ ] Headers correctement configurés
  - [ ] `Cache-Control` sur les fichiers statiques
  - [ ] `no-cache` sur `index.html` et `site.webmanifest`
  - [ ] `no-cache` sur `sw.js`
- [ ] Redirections URL configurées (SPA routing)
- [ ] Compression Gzip activée
- [ ] Tests sur plusieurs navigateurs/appareils
- [ ] Lighthouse score PWA: >= 90

### 8. Monitoring et Maintenance

**Vérifier régulièrement:**

```bash
# Logs du Service Worker
# Chrome DevTools → Application → Service Workers

# Erreurs de mise en cache
# Chrome DevTools → Application → Cache Storage

# Performance
# https://pagespeed.web.dev/

# Lighthouse
# Chrome DevTools → Lighthouse → PWA audit
```

## Configuration du Domaine

### DNS
```
paytracker.app A <IP_DU_SERVEUR>
www.paytracker.app CNAME paytracker.app
```

### Redirection www
Configurez votre serveur pour rediriger `www.paytracker.app` vers `paytracker.app` (voir nginx.conf ou .htaccess).

## Environnements

### Développement
```bash
npm run dev
# http://localhost:8080
```

### Staging
Déployez sur un domaine de test:
```
https://staging-paytracker.app
```

### Production
```
https://paytracker.app
```

## Scripts Utiles

```bash
# Build de production
npm run build

# Preview local de la build
npm run preview

# Linter
npm run lint

# Générer les icônes
npm run generate-icons
```

## Troubleshooting Déploiement

### Service Worker ne s'enregistre pas
- ✓ Vérifier que HTTPS est activé
- ✓ Vérifier les en-têtes `Cache-Control` du fichier `sw.js`
- ✓ Vérifier que `/sw.js` est accessible
- ✓ Rafraîchir la page (Ctrl+Shift+R)

### Manifest non trouvé
- ✓ Vérifier que `site.webmanifest` est dans le dossier `public/`
- ✓ Vérifier le lien dans `index.html`
- ✓ Vérifier le Content-Type: `application/manifest+json`

### Icônes ne s'affichent pas
- ✓ Vérifier que les fichiers d'icônes sont dans `public/`
- ✓ Vérifier les chemins dans le manifest
- ✓ Vérifier les dimensions (192x192, 512x512)
- ✓ Vérifier que les fichiers sont PNG valides

### Application ne s'installe pas
- ✓ Vérifier que HTTPS est activé
- ✓ Vérifier que le manifest est valide
- ✓ Vérifier que les icônes sont présentes
- ✓ Vérifier que le score Lighthouse PWA est >= 90

### Mise à jour ne fonctionne pas
- ✓ Forcer le rafraîchissement: Ctrl+Shift+R
- ✓ Vider le cache: DevTools → Application → Cache Storage → Supprimer
- ✓ Vérifier que `skipWaiting: true` est dans la configuration Vite

## Support et Documentation

- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Vite Plugin PWA](https://vite-pwa-org.netlify.app/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
