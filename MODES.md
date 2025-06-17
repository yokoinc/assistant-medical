# 🎯 Modes d'Installation - Assistant Médical

## Configuration à deux vitesses

Cette application propose une configuration intelligente pour s'adapter à tous les besoins :

## 🏥 Mode Production - Base Vierge

**Configuration :**
```bash
# Dans app/.env
LOAD_TEST_DATA=false
```

**Caractéristiques :**
- ✅ **Base de données vierge** - Aucune donnée patient fictive
- ✅ **Anonymat complet** - Aucune référence personnelle dans le code
- ✅ **Prêt pour production** - Configuration sécurisée
- ✅ **Personnalisation via admin** - Toutes les informations modifiables via `/admin/parameters`

**Données incluses :**
- Structure complète des tables
- Numéros d'urgence génériques (à personnaliser)
- Paramètres cabinet par défaut (à personnaliser)
- **AUCUN** patient ou message fictif

## 🧪 Mode Développement - Données de Test

**Configuration :**
```bash
# Dans app/.env
LOAD_TEST_DATA=true
```

**Caractéristiques :**
- 🧪 **5 patients fictifs** avec historiques complets
- 💬 **19+ messages privés** de test avec différents niveaux d'urgence
- 🤖 **15+ consultations IA** complètes pour tester l'interface
- 📁 **Fichiers attachés** fictifs
- 📊 **Statistiques de test** pour le dashboard

**Patients de test :**
1. **MARTIN Sophie** - Voyage, vaccins, effets secondaires
2. **DUBOIS Pierre** - Douleurs dorsales urgentes, kinésithérapie
3. **BERNARD Marie** - Grossesse, échographies, analyses
4. **PETIT Jean** - Hypertension, sommeil, nutrition, sport (patient très actif)
5. **MOREAU Claire** - Sport, allergie alimentaire

## 🔄 Changer de Mode

### Passer en Mode Production
```bash
# 1. Modifier la configuration
echo "LOAD_TEST_DATA=false" >> app/.env

# 2. Arrêter l'application
docker-compose down -v

# 3. Relancer (base vierge)
docker-compose up -d

# 4. Personnaliser via /admin/parameters
```

### Passer en Mode Développement
```bash
# 1. Modifier la configuration
echo "LOAD_TEST_DATA=true" >> app/.env

# 2. Arrêter l'application
docker-compose down -v

# 3. Relancer (avec données test)
docker-compose up -d

# 4. Tester avec les patients fictifs
```

## 📁 Structure des Fichiers

```
webmed/
├── init.sql                   # Base vierge (production)
├── init-clean.sql            # Copie de sauvegarde
├── test-data-complete.sql    # Données de test complètes
├── conditional-load.sh       # Script de chargement intelligent
├── app/.env                  # Variable LOAD_TEST_DATA
└── docker-compose.yml        # Configuration des volumes
```

## 🔧 Fonctionnement Technique

Le système utilise l'initialisation PostgreSQL en 3 étapes :

1. **01-init.sql** - Structure des tables (toujours)
2. **02-test-data.sql** - Données de test (si LOAD_TEST_DATA=true)
3. **03-conditional-load.sh** - Script intelligent de décision

## 🎯 Cas d'Usage

### Pour le Développement
- Utilisez `LOAD_TEST_DATA=true`
- Testez toutes les fonctionnalités
- Données riches pour les démonstrations
- Patient "Jean PETIT" très actif pour tests poussés

### Pour la Production
- Utilisez `LOAD_TEST_DATA=false`
- Base complètement vierge et anonyme
- Personnalisez via l'interface admin
- Aucune donnée fictive à supprimer

### Pour les Démonstrations
- Utilisez `LOAD_TEST_DATA=true`
- Scenarios réalistes pré-configurés
- Différents niveaux d'urgence
- Historiques de conversations IA

## ⚠️ Sécurité et Anonymat

**Garanties :**
- ✅ Aucune référence à une personne réelle
- ✅ Données de test clairement fictives
- ✅ Configuration anonyme par défaut
- ✅ Variables à personnaliser identifiées `[Votre...]`

**En production :**
- Tous les contacts génériques `+33 X XX XX XX XX`
- Nom par défaut `Dr [Votre Nom]`
- Ville `[Votre Ville]`
- Adresses `[Adresse de votre cabinet]`

## 📊 Vérification du Mode

```bash
# Vérifier les patients (5 = test, 0 = production)
docker-compose exec postgres psql -U medical_user -d medical_assistant -c "SELECT COUNT(*) as patients FROM patients;"

# Vérifier les messages (19+ = test, 0 = production)
docker-compose exec postgres psql -U medical_user -d medical_assistant -c "SELECT COUNT(*) as messages FROM messages_prives;"

# Voir le mode dans les logs
docker-compose logs postgres | grep "Mode:"
```

## 🎉 Avantages

### Flexibilité
- **Un seul code source** pour dev et production
- **Switching facile** entre les modes
- **Pas de maintenance double**

### Sécurité
- **Anonymat garanti** en production
- **Données réalistes** en développement
- **Aucune fuite possible** de données réelles

### Productivité
- **Tests rapides** avec données riches
- **Déploiement immédiat** en production
- **Démonstrations efficaces** avec scenarios

Cette approche garantit un développement serein et un déploiement en production en toute sécurité ! 🚀