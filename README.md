# 🏥 Assistant Médical Web

Application web complète pour cabinet médical avec système de messagerie patient-médecin, assistant IA intégré et interface d'administration moderne.

## ✨ **Nouveautés v2.1**

### 🎨 **Design System Unifié**
- **Interface harmonisée** : Patient et admin partagent le même design macOS-inspired
- **Chat IA modernisé** : Interface épurée et intuitive avec suggestions intelligentes
- **Navigation fluide** : Headers unifiés et transitions smoothes
- **CSS modulaire** : Code réorganisé en 8 modules spécialisés

### 🚀 **Architecture Optimisée**
- **JavaScript factorisé** : Fonctions communes centralisées (-80% duplication)
- **Templates réutilisables** : Modals et composants modulaires
- **Container autonome** : Code internalisé pour déploiement simplifié
- **Performance améliorée** : Chargement plus rapide et UX fluide

### 🔧 **Améliorations Techniques**
- **Structure UUID** : Système de fichiers sécurisé et unifié
- **Rate limiting** : Protection anti-spam multi-niveaux
- **Logs détaillés** : Monitoring et debugging améliorés
- **Base de données** : Schéma optimisé avec index performants

## 🎯 **Deux modes de déploiement**

### 🏥 **Mode Production (BASE VIERGE)**
```bash
# Dans .env (racine)
LOAD_TEST_DATA=false
```
- **Base de données vierge** - Aucune donnée patient
- **Configuration anonyme** - À personnaliser entièrement
- **Prêt pour production** médicale réelle

### 🧪 **Mode Test/Démonstration**
```bash
# Dans .env (racine)
LOAD_TEST_DATA=true
```
- **5 patients fictifs** avec historiques complets
- **21 messages de test** avec différents niveaux d'urgence
- **Conversations IA complètes** pour démonstration
- **Parfait pour tests et formations**

## 🌟 **Fonctionnalités Complètes**

### 👥 **Espace Patient Modernisé**
- **Authentification sécurisée** par identité civile
- **Assistant IA médical** avec interface chat intuitive
- **Messagerie privée** avec le médecin (niveaux d'urgence)
- **Upload sécurisé** de documents médicaux (UUID)
- **Navigation mobile-first** responsive et accessible

### 👨‍⚕️ **Dashboard Médecin Avancé**
- **Statistiques temps réel** : Messages, urgences, archivage
- **Gestion complète des patients** : CRUD avec import/export CSV
- **Système de filtres intelligents** : Urgence, période, statut
- **Réponses rapides** avec templates et notifications
- **Téléchargement sécurisé** des fichiers patients

### 🤖 **Assistant IA Intégré**
- **Support OpenAI** et **Claude AI** (Anthropic)
- **Limitations configurables** par patient/période
- **Interface conversationnelle** avec suggestions contextuelles
- **Logging des interactions** pour suivi et facturation

### 🛡️ **Sécurité de Production**
- **Sessions chiffrées** avec rotation automatique
- **Rate limiting multi-niveaux** (auth, chat, API)
- **Validation stricte** des entrées utilisateur
- **Headers de sécurité** (Helmet + CSP)
- **Audit trail complet** des accès et modifications

## 🚀 **Installation Container Autonome**

### **Prérequis**
- Docker et Docker Compose v2+
- 4GB RAM recommandé
- 20GB espace disque

### **Installation Rapide**

1. **Cloner et configurer**
```bash
git clone https://github.com/yokoinc/assistant-medical.git
cd assistant-medical

# Configuration à partir du modèle
cp .env.example .env
```

2. **Personnaliser la configuration**
```bash
nano .env
```

Variables essentielles :
```env
# OBLIGATOIRES
DB_PASS=VotreMotDePasseSecurise123!
SESSION_SECRET=VotreCleSecrete128CaracteresMinimumPourLesSessionsChiffrees

# IA (OPTIONNEL)
OPENAI_API_KEY=sk-proj-votre-clé-openai
ANTHROPIC_API_KEY=sk-ant-votre-clé-claude

# ADMIN PAR DÉFAUT
ADMIN_USERNAME=admin
ADMIN_PASSWORD=VotreMotDePasseAdmin
```

3. **Déploiement automatique**
```bash
# Build container autonome et démarrage
./build-standalone.sh
```

4. **Accès immédiat**
- **Site principal** : https://votre-domaine.fr (ou http://localhost:4480)
- **Admin** : https://votre-domaine.fr/admin
- **Patient test** : Sophie MARTIN (15/03/1985)

## ⚙️ **Configuration Avancée**

### **Structure Container Autonome**
```
webmed/
├── .env                    # Configuration principale (RACINE)
├── app/                   # Code source (internalisé dans container)
│   ├── public/            # Interface web moderne
│   │   ├── css/          # CSS modulaire (8 modules)
│   │   ├── admin-common.js    # JS factorisé
│   │   └── modal-templates.js # Templates réutilisables
│   ├── server.js         # API Express sécurisée
│   └── Dockerfile        # Build autonome
├── docker-compose.yml    # Orchestration optimisée
├── build-standalone.sh   # Script de déploiement
└── nginx.conf           # Proxy avec compression et cache
```

### **Variables d'Environnement Complètes**

```env
# === SÉCURITÉ (OBLIGATOIRE) ===
DB_PASS=MotDePassePostgreSQL123!
SESSION_SECRET=CleSecrete128CaracteresMinimumPourChiffrementSessions

# === INTELLIGENCE ARTIFICIELLE ===
OPENAI_API_KEY=sk-proj-votre-clé-openai-ici
ANTHROPIC_API_KEY=sk-ant-votre-clé-claude-ici
AI_DEFAULT_MODEL=gpt  # ou "claude"

# === LIMITATIONS CHAT IA ===
CHAT_HOURLY_LIMIT=25      # Messages/heure par IP
CHAT_DAILY_LIMIT=50       # Messages/jour par patient
CHAT_MESSAGE_MAX_LENGTH=400  # Longueur maximum

# === ADMINISTRATION ===
ADMIN_USERNAME=votre_username
ADMIN_PASSWORD=VotreMotDePasseAdmin123!

# === DÉPLOIEMENT ===
EXTERNAL_PORT=4480        # Port d'accès externe
NODE_ENV=production       # Mode production
LOAD_TEST_DATA=false      # true=données test, false=production
```

### **Personnalisation Cabinet**

Configurez via **Admin → Paramètres Cabinet** :
- Informations docteur et spécialité
- Horaires d'ouverture (format JSON avancé)
- Coordonnées et site web
- Numéros d'urgence régionaux
- Messages et notifications automatiques

## 🏗️ **Architecture Technique**

### **Stack Technologique**
- **Backend** : Node.js 18 + Express.js + PostgreSQL 15
- **Frontend** : HTML5 + CSS3 modulaire + JavaScript ES6+
- **Containerisation** : Docker multi-stage avec optimisations
- **Proxy** : Nginx avec compression gzip et cache
- **Sécurité** : Helmet + Rate limiting + Validation stricte

### **Performance et Scalabilité**
- **Pool de connexions** PostgreSQL optimisé
- **Sessions en mémoire** avec cleanup automatique
- **Compression** et cache des assets statiques
- **Healthchecks** automatiques pour haute disponibilité
- **Logs structurés** pour monitoring

## 🛠️ **Maintenance et Monitoring**

### **Sauvegarde Automatisée**
```bash
# Backup complet quotidien
./backup.sh

# Restauration rapide
./restore.sh backups/backup-20241215-143022.sql
```

### **Monitoring en Temps Réel**
```bash
# Health check API
curl https://votre-domaine.fr/api/health

# Logs en temps réel
docker-compose logs -f webapp

# Métriques PostgreSQL
docker-compose exec postgres pg_stat_activity
```

### **Mises à Jour**
```bash
# Pull dernières améliorations
git pull origin main

# Rebuild container autonome
./build-standalone.sh

# Zero-downtime avec blue/green
docker-compose up --scale webapp=2
```

## 🔒 **Sécurité et Conformité**

### **Protection Multi-Niveaux**
- ✅ **Authentification forte** : Patients (identité civile) + Admin (credentials)
- ✅ **Chiffrement complet** : Sessions AES + Headers sécurisés
- ✅ **Rate limiting adaptatif** : Anti-brute force + Anti-spam
- ✅ **Validation stricte** : XSS + Injection SQL + CSRF
- ✅ **Audit complet** : Logs horodatés + Traçabilité

### **Conformité RGPD**
- **Consentement patient** explicite pour les données
- **Droit à l'oubli** via suppression de compte
- **Pseudonymisation** des données de test
- **Chiffrement** des données sensibles en base
- **Backup sécurisé** avec retention configurable

## 📊 **Tests et Qualité**

### **Données de Test Réalistes**
- **5 patients fictifs** : Consultations complètes
- **Conversations IA** : Scenarios médicaux variés
- **Messages urgents** : Gestion des priorités
- **Fichiers médicaux** : Upload/download sécurisé
- **Workflows complets** : De la consultation au suivi

### **Validation Automatique**
```bash
# Test de l'API
curl -s https://votre-domaine.fr/api/cabinet-info | jq

# Test authentification
curl -X POST -d '{"username":"admin","password":"test"}' \
     -H "Content-Type: application/json" \
     https://votre-domaine.fr/api/admin/auth

# Test performance
ab -n 100 -c 10 https://votre-domaine.fr/
```

## 🌐 **Déploiement Production**

### **Synology NAS (Optimisé)**
```bash
# Configuration NAS
export COMPOSE_HTTP_TIMEOUT=120
docker-compose up -d --build

# Monitoring NAS
watch -n 5 'docker stats --no-stream'
```

### **VPS/Cloud (Recommandé)**
```bash
# Avec HTTPS automatique
docker-compose -f docker-compose.prod.yml up -d

# Avec certificats Let's Encrypt
certbot --nginx -d votre-domaine.fr
```

### **Kubernetes (Enterprise)**
```bash
# Déploiement k8s avec Helm
helm install webmed ./k8s/helm-chart
```

## 📚 **Documentation Développeur**

### **API Endpoints**
- **GET** `/api/cabinet-info` - Informations publiques
- **POST** `/api/auth` - Authentification patient
- **GET** `/api/mes-messages` - Messages patient
- **POST** `/api/message-prive` - Nouveau message
- **GET** `/api/admin/stats` - Statistiques admin
- **POST** `/api/admin/messages/:id/reply` - Réponse médecin

### **Hooks et Events**
- `patient.login` - Connexion patient
- `message.received` - Nouveau message
- `file.uploaded` - Upload de fichier
- `admin.action` - Action administrative

## 🆘 **Support et Troubleshooting**

### **Problèmes Fréquents**

**Chat IA non disponible**
```bash
# Vérifier clé API
docker-compose logs webapp | grep -i openai

# Test connexion
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

**Performance lente**
```bash
# Statistiques PostgreSQL
docker-compose exec postgres psql -U medical_user -d medical_assistant \
  -c "SELECT * FROM pg_stat_user_tables;"

# Nettoyage automatique
docker system prune -a
```

**Problème d'accès fichiers**
```bash
# Permissions uploads
./permissions.sh status
./permissions.sh restore
```

### **Logs Détaillés**
```bash
# Application avec niveau debug
NODE_ENV=development docker-compose up

# Base de données verbose
docker-compose logs postgres | grep ERROR

# Nginx avec debug
docker-compose exec nginx nginx -T
```

## 📈 **Roadmap et Évolutions**

### **Version 2.2 (Q1 2025)**
- [ ] **API REST complète** avec documentation OpenAPI
- [ ] **Module de facturation** intégré
- [ ] **Calendrier de rendez-vous** avec synchronisation
- [ ] **Notifications push** temps réel
- [ ] **Tableaux de bord** analytics avancés

### **Version 3.0 (Q2 2025)**
- [ ] **Multi-cabinets** avec isolation des données
- [ ] **Intégration FHIR** pour interopérabilité
- [ ] **Module téléconsultation** vidéo intégré
- [ ] **IA diagnostique** avancée avec ML
- [ ] **Conformité HDS** pour hébergement de données de santé

## 📝 **Licence et Légal**

**Licence MIT** - Utilisation libre en cabinet privé et public.

**Avertissement médical** : Cet assistant IA ne remplace pas un diagnostic médical professionnel. En cas d'urgence, contactez le 15 (SAMU).

**Conformité** : Compatible RGPD, HDS-ready, certification médicale en cours.

## 🤝 **Communauté et Contribution**

### **Contributions Bienvenues**
1. **Fork** le projet sur GitHub
2. **Créer** une branche feature (`git checkout -b feature/amelioration`)
3. **Développer** avec tests unitaires
4. **Documenter** les changements
5. **Pull Request** avec description détaillée


## 🔗 **Liens Utiles**

- **🐙 Dépôt GitHub** : https://github.com/yokoinc/assistant-medical

---

⚕️ **Développé par le Dr Grégory Cuffel avec ❤️ pour moderniser la médecine de proximité**

*Assistant Médical Web v2.1 - Décembre 2024*
