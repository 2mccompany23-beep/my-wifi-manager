# 🇧🇯 ABH 2026 · Super Kiosk Control Center (Gildas Zodome)

Poste de supervision réseau, régulation des flux et portail captif dédié au vote étudiant **Africa's Business Heroes 2026 (Candidat Gildas Zodome - BIO PHYTO Bénin)**.

---

## 🎯 Fonctionnalités Principales
1. **Accès Étudiant Immédiat (Wi-Fi Ouvert)** : Connexion libre sans mot de passe WPA ni ticket.
2. **Portail Captif Kiosk Automatisé** : Fiche officielle avec portrait de **Gildas Zodome**, compte à rebours de 3s et redirection directe vers le bulletin de vote :
   `https://abh2026top10vote.org/?candidate=gildas-zodome&lang=fr#vote`
3. **Périmètre d'Accès Ciblé (Walled Garden)** :
   * Plateforme officielle de vote ABH 2026 & passerelles de validation.
   * Services de messagerie (Gmail, Outlook, Yahoo, iCloud, ports IMAP/POP3) pour la réception du code OTP.
   * Tout flux non essentiel (vidéos, téléchargements lourds, réseaux sociaux tiers) est strictement filtré.
4. **Shaper de Débit Équitable (PCQ)** : Débit garanti et lissé (par défaut `512k/256k`), ajustable instantanément depuis le dashboard.
5. **Régulation des Sessions & Bannissement Configurable** :
   * Déconnexion automatique après dépassement du quota (ex: 20 Mo) ou du temps (ex: 15 min).
   * **Durée de restriction configurable** : `24h` par défaut, modifiable en direct (`1h`, `6h`, `12h`, `24h`, `48h`).

---

## 🔒 Sécurité du Dashboard Superviseur

Le Dashboard d'administration est **entièrement protégé par mot de passe** :
* **Mot de passe par défaut** : `admin` (ou `admin2026`, ou le mot de passe d'administration du routeur branché).
* Les sessions sont sécurisées par jeton Bearer ; toute déconnexion ou expiration redirige immédiatement vers l'écran de verrouillage.

---

## 🔌 Câblage Matériel (MikroTik RB951Ui-2HnD)

| Port | Rôle | Connexion |
|---|---|---|
| **Port 1 (`ether1`)** | **Uplink Internet** | Câble relié à la Box / Routeur d'accès |
| **Port 5 (`ether5`)** | **Poste Superviseur** | Câble relié au PC superviseur (`192.168.88.254`) |
| **Wi-Fi (`wlan1`)** | **Hotspot Kiosk** | SSID : `VOTE ABH 2026 - GILDAS ZODOME` (Ouvert) |

---

## 🛠️ Guide Pas à Pas : Mise à Jour des 2 Routeurs MikroTik

### Étape 0 : Éviter la coupure Internet sur le PC (À faire 1 seule fois)
Quand vous branchez le MikroTik en RJ45, Windows essaie de router Internet vers le MikroTik au lieu du Wi-Fi.
Pour empêcher cela :
* Soit faire un clic droit sur **`FIX-INTERNET-PC.bat`** -> **Exécuter en tant qu'administrateur**.
* Soit dans Windows (`ncpa.cpl`) -> Propriétés Ethernet -> IPv4 -> Mettre IP `192.168.88.250`, Masque `255.255.255.0`, et **Passerelle par défaut : VIDE**.
*(Votre PC conserve ainsi 100% de son Internet Wi-Fi et communique en même temps avec le MikroTik).*

---

### Étape 1 : Mettre à jour le ROUTEUR 1
1. Branchez le câble RJ45 du PC sur le **Port 2, 3, 4 ou 5** du Routeur 1.
2. Double-cliquez sur **`CONFIGURER-ROUTEUR.bat`** (ou lancez `npm run setup:router`).
   - Le script configure le SSID `VOTE ABH 2026 - GILDAS ZODOME`, le Hotspot, le Walled Garden strict et le shaper.
   - Le script téléverse le portail captif avec redirection automatique vers Gildas Zodome.
3. Testez avec un smartphone : connectez-vous au Wi-Fi `VOTE ABH 2026 - GILDAS ZODOME` -> Le portail s'ouvre et redirige vers la page de vote !

---

### Étape 2 : Mettre à jour le ROUTEUR 2
1. Débranchez le Routeur 1.
2. Branchez le câble RJ45 du PC sur le **Port 2, 3, 4 ou 5** du Routeur 2.
3. Double-cliquez à nouveau sur **`CONFIGURER-ROUTEUR.bat`** (ou `npm run setup:router`).
   - Le script détecte automatiquement le mot de passe (`4ZFF63YJ4H`) et configure la plage IP dédiée (`10.54.0.0/22`).
   - Le portail captif est téléversé.
4. Testez avec un smartphone.

---

### Étape 3 : Lancer le Dashboard de Supervision (Optionnel sur le terrain)
```powershell
npm start
```
Ouvrez **`http://localhost:3000`** (Mot de passe : `admin`).
