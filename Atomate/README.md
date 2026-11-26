# Atomate - Multi-Browser Selenium Automation & Cross-Tab Workflow

Application de bureau construite avec **Electron**, **Selenium WebDriver** et un **navigateur témoin double-onglet** pour enregistrer et rejouer en parallèle des workflows complets entre deux onglets.

## ✨ Fonctionnalités Principales

1. **Configuration du Swarm & Lancement Parallèle** :
   - **Champ Lien 1** : URL cible chargée dans l'Onglet 1.
   - **Champ Lien 2** : URL cible chargée dans l'Onglet 2.
   - **Nombre de navigateurs** : Nombre d'instances Chrome indépendantes exécutées en parallèle.
   - **Stockage SQLite Chiffré (`AES-256-GCM`)** : Auto-sauvegarde chiffrée des champs et du workflow dans `data/vault.sqlite`.
   - **Bouton GO !** : Lance les instances Selenium en parallèle sur le workflow unique et affiche la progression en temps réel.
   - **Bouton Arrêter Tout** : Interrompt immédiatement toutes les instances actives.

2. **Workflow Unique & Témoin Double-Onglet** :
   - Bouton **« Ouvrir Témoin (Onglet 1 + 2) »** : Ouvre une fenêtre Chrome témoin avec l'Onglet 1 et l'Onglet 2 prêts.
   - **Bascule automatique d'onglet** : Lorsque vous agissez dans l'Onglet 1 puis dans l'Onglet 2 (et inversement), les étapes `switch_tab` sont automatiquement insérées dans le workflow.
   - **Menu flottant (HUD) dans Chrome** :
     - **`📥 Extraire`** : Pointez un élément de la page pour enregistrer sa valeur dans une variable `{{nom_var}}` (texte, `value`, `href` + regex optionnelle).
     - **`⏳ Attendre`** : Pointez un élément et attendez qu'il soit visible, non vide, qu'il corresponde à un texte/regex, ou que sa valeur **change** par rapport à `{{var}}` (avec actualisation périodique optionnelle).
     - **`🔄 Refresh`** et **`⏸ Pause 2s`**.
   - **Éditeur complet dans Electron** :
     - Réorganisation (`▲` / `▼`), insertion (`➕`), modification (`✎`), suppression (`✕`).
     - Barre de variables extraites cliquables (`{{val1}}`, etc.) et import/export JSON.

---

## 🚀 Démarrage

### Prérequis
- **Node.js** (v18+, testé sur Node v24 avec `node:sqlite`)
- **Google Chrome** installé sur la machine

### Lancement
```bash
npm start
```

---

## 📁 Structure du Projet

```text
Atomate/
├── main.js                          # Processus principal Electron & gestion IPC
├── preload.js                       # Passerelle sécurisée (ContextBridge)
├── package.json                     # Dépendances (electron, selenium-webdriver, ws)
├── src/
│   ├── storage/
│   │   └── db.js                    # Base SQLite chiffrée AES-256-GCM
│   ├── engine/
│   │   ├── recorder.js              # Témoin double-onglet & serveur WebSocket
│   │   ├── executor.js              # Exécuteur parallèle cross-tab avec variables
│   │   └── injected-recorder.js     # Enregistreur & HUD Shadow DOM injecté
│   └── renderer/
│       ├── index.html               # Interface utilisateur & modale d'édition
│       ├── style.css                # Styles thème sombre & badges d'onglet
│       └── app.js                   # État du workflow unique & auto-sauvegarde
└── data/
    └── vault.sqlite                 # Base SQLite chiffrée locale (non lue en clair)
```
