# Configuration PWA - PayTracker

## Vue d'ensemble

PayTracker est configuré comme une Progressive Web App (PWA) professionnelle. Cela signifie qu'elle peut être installée sur les appareils mobiles et de bureau, et fonctionner hors ligne.

## Fonctionnalités PWA Implémentées

### 1. **Installation sur l'écran d'accueil**
- Les utilisateurs peuvent installer l'application directement depuis le navigateur
- Affiche une icône sur l'écran d'accueil comme une application native
- Supporte Android, iOS (via PWA), et les navigateurs de bureau

### 2. **Fonctionnalité Hors Ligne**
- Le Service Worker met en cache les ressources statiques
- Les requêtes API sont cachées avec une stratégie "Network First"
- Les utilisateurs peuvent accéder aux données mises en cache hors ligne

### 3. **Mises à Jour Automatiques**
- Le Service Worker vérifie les mises à jour automatiquement
- Notifie l'utilisateur quand une nouvelle version est disponible
- L'utilisateur peut mettre à jour avec un clic

### 4. **Indicateurs de Connectivité**
- Affiche l'état en ligne/hors ligne en temps réel
- Notifie l'utilisateur lors de la déconnexion
- Affiche un message de synchronisation lors du retour en ligne

### 5. **Notifications Push** (optionnel)
- Support des notifications push du navigateur
- Peut être utilisé pour les alertes importantes

## Structure des Fichiers

```
src/
├── lib/
│   └── pwaUtils.ts          # Utilitaires PWA
├── hooks/
│   └── usePWA.ts            # Hook PWA pour React
├── components/
│   └── PWANotifications.tsx  # Composants de notifications PWA
└── App.tsx                   # Application principale (intégration PWA)

public/
├── site.webmanifest         # Manifest PWA
├── favicon.ico              # Icône favicon
├── apple-touch-icon.png     # Icône iOS
├── pwa-192x192.png          # Icône PWA (petit format)
├── pwa-512x512.png          # Icône PWA (grand format)
├── pwa-maskable-192x192.png # Icône maskable (petit format)
└── pwa-maskable-512x512.png # Icône maskable (grand format)
```

## Configuration Vite

La configuration PWA est définie dans `vite.config.ts` avec le plugin `vite-plugin-pwa`:

- **Type d'enregistrement**: `autoUpdate` - Met à jour automatiquement le SW
- **Mise en cache**: Stratégie Workbox personnalisée
  - Ressources statiques: `CacheFirst`
  - API: `NetworkFirst` avec timeout de 3 secondes
  - Polices Google: Mise en cache long terme (1 an)

## Utilisation dans les Composants

### Accéder aux informations PWA

```typescript
import { usePWA } from "@/hooks/usePWA";

export function MyComponent() {
  const { isOnline, isInstalled, canInstall, updateAvailable, installPWA } = usePWA();

  return (
    <div>
      {canInstall && <button onClick={installPWA}>Installer l'app</button>}
      {!isOnline && <p>Mode hors ligne</p>}
    </div>
  );
}
```

### Utiliser les utilitaires PWA

```typescript
import { onPWAEvent, initPWA, isPWASupported, sendNotification } from "@/lib/pwaUtils";

// Écouter les événements PWA
onPWAEvent((event) => {
  console.log(event.type, event.message);
});

// Envoyer une notification
sendNotification("Titre", {
  body: "Message de notification",
  icon: "/pwa-192x192.png"
});
```

## Icônes Requises

Pour une expérience optimale, les icônes suivantes doivent être ajoutées dans le dossier `public/`:

| Fichier | Dimension | Utilisation |
|---------|-----------|-------------|
| favicon.ico | 16x16 à 48x48 | Onglet du navigateur |
| apple-touch-icon.png | 180x180 | iOS Springboard |
| pwa-192x192.png | 192x192 | Icône PWA standard |
| pwa-512x512.png | 512x512 | Icône PWA haute résolution |
| pwa-maskable-192x192.png | 192x192 | Icône maskable (format de sécurité) |
| pwa-maskable-512x512.png | 512x512 | Icône maskable (format de sécurité) |
| screenshot-1.png | 540x720 | Screenshot PWA (mobile) |
| screenshot-2.png | 1280x720 | Screenshot PWA (desktop) |

**Note**: Les icônes maskable doivent avoir un contenu important au centre (au moins 80% de l'icône) car les navigateurs les découperont à différentes formes.

## Génération des Icônes

Pour générer les icônes, vous pouvez utiliser:

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
2. **Icons8**: https://icons8.com/icons/set/pwa
3. **ImageMagick** (CLI):
```bash
convert logo.png -resize 192x192 pwa-192x192.png
convert logo.png -resize 512x512 pwa-512x512.png
```

## Vérification de la Configuration

Pour vérifier que votre PWA est correctement configurée:

1. **Chrome DevTools**:
   - Ouvrir DevTools (F12)
   - Aller à l'onglet "Application"
   - Vérifier que le Service Worker est enregistré
   - Vérifier le Manifest

2. **Lighthouse** (Chrome DevTools):
   - Onglet "Lighthouse"
   - Sélectionner "PWA"
   - Exécuter l'audit

3. **PWA Builder**: https://www.pwabuilder.com/
   - Entrer l'URL de votre application
   - Recevra un rapport détaillé

## Amélioration Hors Ligne

Pour améliorer l'expérience hors ligne:

1. Mettre en cache plus de données dans le Service Worker
2. Implémenter une stratégie de synchronisation en arrière-plan
3. Ajouter une page "hors ligne" personnalisée
4. Synchroniser les modifications locales quand la connexion revient

## Sécurité

- La PWA doit être servie via HTTPS en production
- Le Service Worker ne fonctionnera qu'en HTTPS (sauf localhost)
- Utilisez des nonces de contenu (CSP) pour la sécurité

## Support des Navigateurs

| Navigateur | Support |
|-----------|---------|
| Chrome/Edge | Complet |
| Firefox | Complet |
| Safari (iOS 16.4+) | Partiel à Complet |
| Samsung Internet | Complet |
| Opera | Complet |

## Déploiement

Lors du déploiement:

1. Assurez-vous que le HTTPS est activé
2. Générez les icônes avec les bonnes dimensions
3. Testez sur plusieurs appareils et navigateurs
4. Utilisez Lighthouse pour valider
5. Mettez à jour le manifest selon votre domaine

## Troubleshooting

### Service Worker ne s'enregistre pas
- Vérifier que vous êtes en HTTPS (ou localhost)
- Vérifier la console pour les erreurs
- Nettoyer le cache du navigateur

### Icônes ne s'affichent pas
- Vérifier que les fichiers d'icônes sont dans le dossier `public/`
- Vérifier les chemins dans le manifest
- Vérifier les dimensions des icônes

### Les mises à jour ne s'installent pas
- Forcer le rafraîchissement de la page (Ctrl+Shift+R)
- Désactiver la mise en cache du navigateur en DevTools
- Vérifier que `skipWaiting: true` est configuré
