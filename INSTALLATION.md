# Assistant Médical - Installation

## Configuration harmonisée

Le fichier `init.sql` a été harmonisé avec la configuration Docker et les variables d'environnement.

### Configuration actuelle

- **Base de données**: `medical_assistant`
- **Utilisateur DB**: `medical_user`  
- **Port externe**: `4480` (configurable via `EXTERNAL_PORT`)

### Fichiers de configuration

1. **`docker-compose.yml`** - Configuration des conteneurs
2. **`.env`** - Variables d'environnement
3. **`init.sql`** - Initialisation de la base de données

### Installation rapide

```bash
# 1. Copiez le fichier d'exemple si nécessaire
cp init.sql.example init.sql

# 2. Modifiez les informations du cabinet dans init.sql
# - Nom du médecin
# - Coordonnées du cabinet  
# - Numéros d'urgence locaux

# 3. Configurez app/.env avec vos identifiants
# - DB_PASS (mot de passe base de données)
# - SESSION_SECRET (clé de session)
# - ADMIN_USERNAME/ADMIN_PASSWORD (connexion admin)

# 4. Lancez l'application
docker-compose up -d

# 5. Accédez à l'interface
# - Site: http://localhost:4480
# - Admin: http://localhost:4480/admin
```

### Vérification du fonctionnement

```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Vérifier les logs
docker-compose logs webapp

# Tester la connexion
curl http://localhost:4480/api/health
```

### Personnalisation

1. **Informations du cabinet**: Modifiez dans `init.sql` ou via `/admin/parameters`
2. **Numéros d'urgence**: Adaptez à votre région dans `init.sql`  
3. **Patients de test**: Supprimez en production dans `init.sql`
4. **Port d'accès**: Modifiez `EXTERNAL_PORT` dans `app/.env`

### Structure des fichiers

```
webmed/
├── app/
│   ├── .env                    # Variables d'environnement
│   ├── server.js              # Application Node.js
│   └── public/                # Interface web
├── docker-compose.yml         # Configuration Docker
├── init.sql                   # Base de données (personnalisé)
├── init.sql.example          # Modèle d'installation
└── uploads/                   # Fichiers uploadés
```

### Support

- Les identifiants admin sont définis dans `.env`
- La base utilise PostgreSQL 15
- L'interface est accessible via Nginx
- Les uploads sont persistants dans `./uploads/`
