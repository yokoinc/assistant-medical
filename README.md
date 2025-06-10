# 🏥 Assistant Médical Web

Application web complète pour cabinet médical avec système de messagerie patient-médecin et assistant IA intégré.

## 🌟 Fonctionnalités

### 👥 Espace Patient
- **Authentification sécurisée** par nom, prénom et date de naissance
- **Chat avec assistant IA médical** (powered by OpenAI)
- **Messagerie privée** avec le médecin
- **Upload de fichiers** (analyses, radios, documents)
- **Gestion des niveaux d'urgence** des messages

### 👨‍⚕️ Espace Administration
- **Dashboard complet** avec statistiques en temps réel
- **Gestion des messages patients** (lecture, réponse, archivage)
- **Système de filtres avancés** (urgence, période, statut)
- **Téléchargement des fichiers** patients
- **Interface moderne et responsive**

### 🔧 Technique
- **Architecture Docker** avec docker-compose
- **Base de données PostgreSQL** sécurisée
- **Proxy Nginx** avec gestion des fichiers statiques
- **Sessions sécurisées** avec protection CSRF
- **Rate limiting** anti-bruteforce
- **Logging complet** des événements

## 🚀 Installation

### Prérequis
- Docker et Docker Compose
- 2GB RAM minimum
- 10GB espace disque

### Configuration rapide

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/assistant-medical.git
cd assistant-medical
```

2. **Configuration de l'environnement**
```bash
cp app/.env.example app/.env
cp init.sql.example init.sql
```

3. **Modifier les variables sensibles**
```bash
# Éditer app/.env avec vos vraies valeurs
nano app/.env

# Éditer init.sql avec vos données
nano init.sql
```

4. **Démarrage**
```bash
docker-compose up -d
```

5. **Accès à l'application**
- **Site principal** : http://localhost:4480 (ou le port configuré dans EXTERNAL_PORT)
- **Espace patient** : http://localhost:4480/login
- **Administration** : http://localhost:4480/admin

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
# Base de données (OBLIGATOIRE)
DB_PASS=VotreMotDePasseSecurise123
POSTGRES_PASSWORD=VotreMotDePasseSecurise123

# Sécurité sessions (OBLIGATOIRE)
SESSION_SECRET=VotreCleSecrete128CaracteresMinimum

# OpenAI (OPTIONNEL)
OPENAI_API_KEY=sk-your-api-key

# Port externe (OPTIONNEL)
EXTERNAL_PORT=4480

# Limitations chat IA (OPTIONNEL)
CHAT_HOURLY_LIMIT=20
CHAT_DAILY_LIMIT=40
CHAT_MESSAGE_MAX_LENGTH=1000

# Admin par défaut (OPTIONNEL)
ADMIN_USERNAME=votre_admin
ADMIN_PASSWORD=VotreMotDePasseAdmin123
```

### Limitations du chat IA

Les limites suivantes sont configurables selon vos besoins :

```env
# Cabinet avec beaucoup de patients - limites élevées
CHAT_HOURLY_LIMIT=50
CHAT_DAILY_LIMIT=100
CHAT_MESSAGE_MAX_LENGTH=500

# Cabinet économe - limites strictes
CHAT_HOURLY_LIMIT=10
CHAT_DAILY_LIMIT=20
CHAT_MESSAGE_MAX_LENGTH=200

# Valeurs par défaut - équilibrées
CHAT_HOURLY_LIMIT=20
CHAT_DAILY_LIMIT=40
CHAT_MESSAGE_MAX_LENGTH=300
```

### Création automatique de l'admin

L'administrateur est créé automatiquement au démarrage depuis les variables `.env` :

```env
# L'admin sera créé avec ces identifiants
ADMIN_USERNAME=votre_admin
ADMIN_PASSWORD=VotreMotDePasseSecurise123
```

Si ces variables ne sont pas définies, les valeurs par défaut sont :
- Username : `admin`
- Password : `changeme123`

### Base de données (init.sql)

Modifiez le fichier `init.sql` pour :
- Adapter les numéros d'urgence à votre région
- Ajouter vos patients autorisés
- Supprimer les données de test

L'admin n'est plus créé dans init.sql mais automatiquement par Node.js.

## 🏗️ Architecture

```
assistant-medical/
├── app/                    # Application Node.js
│   ├── public/            # Interface web
│   ├── server.js          # Serveur Express
│   ├── package.json       # Dépendances
│   └── Dockerfile         # Image Docker
├── docker-compose.yml     # Orchestration
├── nginx.conf            # Configuration proxy
├── init.sql              # Schéma base de données
└── uploads/              # Fichiers patients
```

## 🔒 Sécurité

### Authentification
- **Patients** : Nom + Prénom + Date de naissance
- **Admin** : Username + Mot de passe hashé
- **Sessions** : Chiffrées avec rotation automatique

### Protection
- ✅ Rate limiting anti-bruteforce
- ✅ Validation stricte des entrées
- ✅ Headers de sécurité (Helmet)
- ✅ Protection CSRF
- ✅ Logs de sécurité complets

### Recommandations production
- Changer `SESSION_SECRET` (128+ caractères)
- Utiliser des mots de passe forts
- Configurer HTTPS avec certificats
- Sauvegarder régulièrement la base
- Monitorer les logs de sécurité

## 🌐 Déploiement

### Développement
```bash
# Mode développement avec hot reload
NODE_ENV=development docker-compose up
```

### Production
```bash
# Variables d'environnement
export NODE_ENV=production

# Build et démarrage
docker-compose up -d --build

# Vérification
docker-compose ps
docker-compose logs webapp
```

### Synology NAS
Compatible avec les NAS Synology (testé sur DS918+) :
- Ressources optimisées pour hardware limité
- Configuration bcrypt adaptée
- Gestion mémoire optimisée

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:4480/api/health
```

### Logs
```bash
# Logs application
docker-compose logs -f webapp

# Logs base de données
docker-compose logs -f postgres

# Logs nginx
docker-compose logs -f nginx
```

### Métriques
- Connexions patients/admin
- Messages par période
- Utilisation assistant IA
- Erreurs et tentatives d'intrusion

## 🛠️ Maintenance

### Sauvegarde
```bash
# Base de données
docker exec webmed-postgres-1 pg_dump -U medical_user medical_assistant > backup.sql

# Fichiers uploadés
tar -czf uploads-backup.tar.gz uploads/
```

### Mise à jour
```bash
# Pull dernière version
git pull origin main

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Nettoyage
```bash
# Logs anciens
docker system prune

# Sessions expirées
docker exec webmed-postgres-1 psql -U medical_user -d medical_assistant -c "DELETE FROM admin_sessions WHERE expires_at < NOW();"
```

## 🆘 Support

### Problèmes courants

**Erreur de connexion base de données**
```bash
# Vérifier les containers
docker-compose ps

# Logs PostgreSQL
docker-compose logs postgres
```

**Interface non accessible**
```bash
# Vérifier nginx
docker-compose logs nginx
```

**Performance lente**
- Vérifier ressources Docker
- Optimiser paramètres PostgreSQL
- Nettoyer logs anciens

### Logs utiles
- `webapp` : Erreurs application et authentification
- `postgres` : Erreurs base de données
- `nginx` : Erreurs proxy et accès web

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/NouvelleFonctionnalite`)
3. Commit vos changes (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push sur la branche (`git push origin feature/NouvelleFonctionnalite`)
5. Ouvrir une Pull Request

## 🔗 Contact

- **Développeur** : Grégory C.
- **Email** : yokoinc.synology@gmail.com
- **Projet** : https://github.com/yokoinc/assistant-medical

---

⚕️ **Développé avec ❤️ pour améliorer la relation patient-médecin**