# Cloud Mikhmon 2.0 - Applications Mobile & Bureau

Ce projet contient deux applications pour gérer le hotspot MikroTik :

## 📱 Application Mobile Android (`/mobile`)

Application Android native (via Capacitor) qui se connecte au serveur distant `https://mcwifi.net`.

### Fonctionnalités
- 📊 **Tableau de bord** : Statut du routeur, statistiques en temps réel
- 👥 **Utilisateurs** : Liste, recherche, suppression individuelle ou en masse
- 🔌 **Sessions actives** : Surveillance et déconnexion des sessions
- 🎫 **Vouchers** : Génération de codes d'accès WiFi
- 💰 **Ventes** : Historique des transactions et revenus
- ⚙️ **Réglages** : Configuration du routeur et FedaPay

### Installation & Build

```bash
cd mobile
npm install

# Développement (navigateur)
npm run dev

# Build web
npm run build

# Ajouter la plateforme Android
npx cap add android

# Synchroniser le build web avec Android
npm run sync

# Ouvrir dans Android Studio
npm run android:open

# Build APK (macOS/Linux)
npm run android:build

# Build APK (Windows)
npm run android:build:win
```

L'APK sera généré dans `mobile/android/app/build/outputs/apk/debug/`.

> **Prérequis pour le build Android :**
> 1. **Java JDK 17+** : Téléchargez depuis [Adoptium](https://adoptium.net/) ou installez via Android Studio
>    - Configurez `JAVA_HOME` dans les variables d'environnement
> 2. **Android SDK** : Installez [Android Studio](https://developer.android.com/studio)
>    - Configurez `ANDROID_HOME` dans les variables d'environnement
> 3. **Alternative** : Ouvrez le dossier `mobile/android` dans Android Studio
>    - Android Studio installera automatiquement les composants nécessaires
>    - Cliquez sur "Build > Build APK(s)" pour générer l'APK
>
> **Vérification rapide :**
> ```bash
> java -version          # Doit afficher une version JDK 17+
> echo $env:JAVA_HOME    # Doit pointer vers le dossier JDK
> echo $env:ANDROID_HOME # Doit pointer vers le dossier Android SDK
> ```

### Configuration
- L'URL de l'API est configurée dans `mobile/src/App.tsx` (constante `API_BASE`)
- Par défaut : `https://mcwifi.net`
- Modifier cette constante pour pointer vers un autre serveur

---

## 💻 Application Bureau (`/desktop`)

Application Windows/Mac/Linux (via Electron) qui embarque le serveur Express localement.

### Fonctionnalités
- 🚀 **Serveur intégré** : Le serveur Express démarre automatiquement avec l'application
- 📊 **Toutes les fonctionnalités web** : Tableau de bord, utilisateurs, sessions, vouchers, ventes, réglages
- 🔒 **Sécurité** : Authentification admin, sessions avec expiration
- 🖥️ **Interface native** : Fenêtre dédiée avec menu personnalisé

### Installation & Build

```bash
cd desktop
npm install

# Développement
npm start

# Build Windows
npm run build:win

# Build Mac
npm run build:mac

# Build Linux
npm run build:linux
```

L'installateur sera généré dans `desktop/dist/`.

### Prérequis pour le build bureau
1. **Build du frontend** : Le serveur Express sert le frontend React depuis `dist/`
   ```bash
   # Depuis la racine du projet
   npm run build
   ```
2. **Copie automatique** : L'application copie automatiquement `server.bundle.cjs`, `data/`, `loc/` et `dist/` depuis la racine au premier lancement

### Configuration
- Le serveur démarre sur le port 5000 (ou le premier port disponible)
- Les données sont stockées dans `desktop/data/db.json`
- Les identifiants par défaut : `admin` / `admin` (à changer après la première connexion)

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────┐
│                 Applications                    │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Mobile      │  │  Bureau (Electron)     │  │
│  │  (Capacitor) │  │  - Serveur Express     │  │
│  │  → API dist. │  │  - Frontend React      │  │
│  └──────┬───────┘  └──────────┬─────────────┘  │
│         │                     │                │
│         ▼                     ▼                │
│  ┌─────────────────────────────────────────┐  │
│  │         API REST (Express)              │  │
│  │  /api/auth, /api/router, /api/sales,   │  │
│  │  /api/vouchers, /api/settings          │  │
│  └──────────────────┬──────────────────────┘  │
│                     │                         │
│                     ▼                         │
│  ┌─────────────────────────────────────────┐  │
│  │         Routeur MikroTik (RB951Ui)      │  │
│  │  REST API / Native API / Polling        │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 📋 Endpoints API principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion admin |
| GET | `/api/router/status` | Statut du routeur |
| GET | `/api/router/users` | Liste des utilisateurs |
| DELETE | `/api/router/users/:id` | Supprimer un utilisateur |
| POST | `/api/router/users/batch-delete` | Suppression en masse |
| PATCH | `/api/router/users/:id` | Modifier un utilisateur |
| GET | `/api/router/active` | Sessions actives |
| DELETE | `/api/router/active/:id` | Déconnecter une session |
| POST | `/api/vouchers/generate` | Générer des vouchers |
| GET | `/api/sales` | Historique des ventes |
| GET/POST | `/api/settings` | Configuration |

## 🔒 Sécurité

- **Authentification** : Token Bearer avec expiration (8h)
- **Mots de passe** : Hachés avec scrypt
- **Rate limiting** : 15 tentatives de connexion / 15 min
- **CORS** : Restreint aux origines connues
- **Helmet** : Headers de sécurité HTTP

© 2026 2MC COMPANY ETS. Tous droits réservés.