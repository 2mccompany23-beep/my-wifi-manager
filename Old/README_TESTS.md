# 2MC WIFI ZONE - Guide de Test et Dépannage

## 📋 Vue d'ensemble

Votre système de paiement WiFi Zone avec gestion de vouchers comporte plusieurs points de défaillance potentiels. Ce guide vous aide à identifier et corriger les problèmes.

## 🔧 Problèmes Identifiés et Corrections

### ❌ Problème 1: Dossier `/vouchers/` manquant
- **Symptôme:** Erreurs "file not found" dans les logs
- **Cause:** Les fichiers JSON n'étaient pas accessibles
- **Solution:** ✅ Dossier créé avec fichiers initialisés

### ❌ Problème 2: Chemins d'accès incohérents
- **Symptôme:** Webhooks échoient, transactions non enregistrées
- **Cause:** Chemins hardcodés différents dans chaque fichier
- **Solution:** ✅ Configuration centralisée dans `config.php`

### ❌ Problème 3: Pas de gestion des erreurs
- **Symptôme:** Erreurs silencieuses, pas de logs
- **Cause:** Aucune journalisation ou validation
- **Solution:** ✅ Logs détaillés et validation ajoutés

## 📁 Structure de fichiers créée

```
web/
├── www/
│   ├── config.php                    ← Configuration centralisée
│   ├── webhook.php                   ← Receveur webhooks (amélioré)
│   ├── get_voucher.php               ← Récupération vouchers (amélioré)
│   ├── diagnostic.php                ← Outil de diagnostic
│   ├── test_webhook.php              ← Tests unitaires
│   ├── test_integration.ps1          ← Tests d'intégration (Windows)
│   ├── test_integration.sh           ← Tests d'intégration (Linux/Mac)
│   └── vendor/
│       └── autoload.php
├── vouchers/                         ← ✨ NOUVEAU: Créé
│   ├── .vouchers.json               ← Vouchers disponibles
│   ├── transactions.json            ← Transactions enregistrées
│   └── log.txt                      ← Journalisation
```

## 🚀 Comment utiliser

### Option 1: Diagnostic (Recommandé en premier)

```bash
# Windows (PowerShell)
cd "C:\Users\pc\Desktop\DOCS WIFI ZONE\web\www"
php diagnostic.php

# Linux/Mac
php diagnostic.php
```

Cela vous affichera:
- ✓ Chemin d'accès
- ✓ Fichiers présents
- ✓ Permissions
- ✓ Dépendances PHP
- ✓ État des données

### Option 2: Tests unitaires

```bash
php test_webhook.php
```

Exécute 8 tests:
1. ✓ Fichiers JSON valides
2. ✓ JSON parseables
3. ✓ Matching vouchers par montant
4. ✓ Suppression voucher après attribution
5. ✓ Sauvegarde transaction
6. ✓ Voucher non disponible
7. ✓ Détection doublons
8. ✓ Récupération par référence

### Option 3: Tests d'intégration complets (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File test_integration.ps1

# Avec options
powershell -ExecutionPolicy Bypass -File test_integration.ps1 -TestType "all"
powershell -ExecutionPolicy Bypass -File test_integration.ps1 -TestType "diagnostic"
powershell -ExecutionPolicy Bypass -File test_integration.ps1 -TestType "flow"
```

### Option 4: Tests d'intégration complets (Linux/Mac)

```bash
chmod +x test_integration.sh
./test_integration.sh
```

## 📊 Fichiers de données

### .vouchers.json
Liste des vouchers disponibles:
```json
[
  {"code": "VOUCHER001", "montant": 1000},
  {"code": "VOUCHER002", "montant": 1000},
  {"code": "VOUCHER003", "montant": 2000},
  {"code": "VOUCHER005", "montant": 5000}
]
```

**Ajouter des vouchers:**
1. Ouvrir `/vouchers/.vouchers.json`
2. Ajouter des lignes:
```json
{"code": "CODE_UNIQUE", "montant": MONTANT_EN_UNITES}
```

### transactions.json
Transactions enregistrées après webhooks:
```json
[
  {
    "reference": "tx_abc123",
    "amount": 1000,
    "customer_email": "client@example.com",
    "voucher": "VOUCHER001",
    "received_at": "2026-03-25 14:30:00"
  }
]
```

### log.txt
Journalisation détaillée de tous les événements.

## 🔍 Flux de paiement (Corrigé)

```
1. Client paye via FedaPay → Générère transaction
   ↓
2. FedaPay envoie webhook → webhook.php reçoit
   ↓
3. webhook.php valide signature et charge config.php
   ↓
4. Cherche voucher correspondant au montant
   ↓
5. Sauvegarde transaction + supprime voucher utilisé
   ↓
6. Client reçoit réponse 200 (OK)
   ↓
7. Client appelle get_voucher.php?reference=TX_REF
   ↓
8. get_voucher.php retrouve transaction et renvoie voucher
   ↓
9. Client reçoit voucher + suppression vérifiée
```

## ⚙️ Configuration de FedaPay

Dans `config.php`:
```php
define('FEDAPAY_SECRET', 'wh_live_rANAlsmoCm9qTPovKbNH8W7G');
```

**IMPORTANT:** Changez cette clé en production!

## 🐛 Dépannage

### Symptôme: "Fichiers manquants"
```bash
php diagnostic.php
```
Vérifier que tous les fichiers affichent "✓ OK"

### Symptôme: "Aucun voucher attribué"
1. `php diagnostic.php` → Vérifier "Vouchers chargés: X"
2. Ajouter des vouchers dans `.vouchers.json`
3. Vérifier que les montants correspondent

### Symptôme: "Erreur signature webhook"
1. Vérifier `FEDAPAY_SECRET` dans `config.php`
2. Vérifier que FedaPay envoie au bon endpoint: `/www/webhook.php`
3. Vérifier logs: `tail vouchers/log.txt`

### Symptôme: "JSON invalide"
```bash
php -l config.php
php -l webhook.php
php -l get_voucher.php
```

### Symptôme: "Permission denied"
```bash
# Linux/Mac
chmod 755 vouchers/
chmod 644 vouchers/*.json

# Windows: Clic droit → Propriétés → Sécurité → Modifier permissions
```

## ✅ Checklist pré-production

- [ ] Diagnostic passé sans erreurs
- [ ] Tests unitaires: 8/8 réussis
- [ ] Fichiers `.vouchers.json` et `transactions.json` pléins
- [ ] Dossier `/vouchers/` writable
- [ ] FEDAPAY_SECRET mis à jour en production
- [ ] Webhook URL configuré dans FedaPay dashboard
- [ ] Logs consultables (`cat vouchers/log.txt`)
- [ ] Test de paiement complet réussi

## 📞 Script PowerShell d'installation rapide

```powershell
# Créer la structure
$projectRoot = "C:\Users\pc\Desktop\DOCS WIFI ZONE\web"
$wwwRoot = "$projectRoot\www"
$vouchersDir = "$projectRoot\vouchers"

# Créer dossier
if (!(Test-Path $vouchersDir)) { New-Item -ItemType Directory $vouchersDir | Out-Null }

# Créer fichiers vides
@() | ConvertTo-Json | Out-File "$vouchersDir\transactions.json" -Encoding UTF8
@() | ConvertTo-Json | Out-File "$vouchersDir\.vouchers.json" -Encoding UTF8

Write-Host "✓ Structure créée"
cd $wwwRoot
php diagnostic.php
```

---

**Besoin d'aide?** Exécutez `php diagnostic.php` pour obtenir un rapport complet.
