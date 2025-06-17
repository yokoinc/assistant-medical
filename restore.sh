#!/bin/bash

# Script de restauration pour PostgreSQL
# Usage: ./restore.sh [backup_file.sql]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Script de restauration PostgreSQL - Assistant Médical${NC}"
echo -e "${BLUE}====================================================${NC}"

# Vérifier les paramètres
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}📋 Fichiers de backup disponibles:${NC}"
    if [ -d "backups" ]; then
        ls -la backups/database-*.sql 2>/dev/null || echo -e "${RED}❌ Aucun backup SQL trouvé dans le dossier backups/${NC}"
    else
        echo -e "${RED}❌ Dossier backups non trouvé${NC}"
    fi
    echo ""
    echo -e "${BLUE}Usage: $0 [fichier_backup.sql]${NC}"
    echo -e "${BLUE}Exemple: $0 backups/database-20241211-143022.sql${NC}"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier que le fichier de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Fichier de backup non trouvé: $BACKUP_FILE${NC}"
    exit 1
fi

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose n'est pas installé ou accessible${NC}"
    exit 1
fi

# Vérifier que le container PostgreSQL fonctionne
if ! docker-compose ps postgres | grep -q "webmed-postgres-1"; then
    echo -e "${RED}❌ Container PostgreSQL non trouvé ou arrêté${NC}"
    echo -e "${YELLOW}💡 Lancez d'abord: docker-compose up -d${NC}"
    exit 1
fi

# Vérifier que PostgreSQL est prêt
if ! docker-compose exec postgres pg_isready -U medical_user -d medical_assistant &>/dev/null; then
    echo -e "${RED}❌ PostgreSQL ne répond pas${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données actuelles !${NC}"
echo -e "${BLUE}📁 Fichier de restauration: $BACKUP_FILE${NC}"
echo -e "${BLUE}🗄️  Base de données: medical_assistant${NC}"
echo ""
read -p "Êtes-vous sûr de vouloir continuer ? (oui/non): " -r
if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo -e "${YELLOW}❌ Restauration annulée${NC}"
    exit 0
fi

echo -e "${YELLOW}🔄 Début de la restauration...${NC}"

# 1. Arrêter l'application (garder seulement postgres)
echo -e "${BLUE}⏸️  Arrêt de l'application...${NC}"
docker-compose stop webapp nginx

# 2. Créer une sauvegarde de sécurité avant restauration
echo -e "${BLUE}💾 Création d'une sauvegarde de sécurité...${NC}"
SAFETY_BACKUP="backups/safety-backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups
docker exec webmed-postgres-1 pg_dump -U medical_user medical_assistant > "$SAFETY_BACKUP"
echo -e "${GREEN}✅ Sauvegarde de sécurité créée: $SAFETY_BACKUP${NC}"

# 3. Supprimer et recréer la base de données
echo -e "${BLUE}🗑️  Suppression de la base existante...${NC}"
docker exec webmed-postgres-1 psql -U medical_user -c "DROP DATABASE IF EXISTS medical_assistant;"
docker exec webmed-postgres-1 psql -U medical_user -c "CREATE DATABASE medical_assistant;"
echo -e "${GREEN}✅ Base de données recrée${NC}"

# 4. Restaurer les données
echo -e "${BLUE}📥 Restauration des données...${NC}"
docker exec -i webmed-postgres-1 psql -U medical_user -d medical_assistant < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Restauration terminée avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la restauration${NC}"
    echo -e "${YELLOW}🔄 Restauration de la sauvegarde de sécurité...${NC}"
    docker exec -i webmed-postgres-1 psql -U medical_user -d medical_assistant < "$SAFETY_BACKUP"
    exit 1
fi

# 5. Vérifier l'intégrité des données restaurées
echo -e "${BLUE}🔍 Vérification de l'intégrité...${NC}"
TABLES_COUNT=$(docker exec webmed-postgres-1 psql -U medical_user -d medical_assistant -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
PATIENTS_COUNT=$(docker exec webmed-postgres-1 psql -U medical_user -d medical_assistant -t -c "SELECT COUNT(*) FROM patients;" | tr -d ' ')

echo -e "${BLUE}📊 Tables restaurées: $TABLES_COUNT${NC}"
echo -e "${BLUE}👥 Patients restaurés: $PATIENTS_COUNT${NC}"

# 6. Redémarrer tous les services
echo -e "${BLUE}🚀 Redémarrage de tous les services...${NC}"
docker-compose up -d

# 7. Attendre que tout soit prêt
echo -e "${YELLOW}⏳ Attente que tous les services soient prêts...${NC}"
sleep 10

# 8. Vérifier que tout fonctionne
if docker-compose exec webapp curl -f http://localhost:3000/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Application redémarrée avec succès${NC}"
else
    echo -e "${YELLOW}⚠️  Application pas encore prête, vérifiez les logs: docker-compose logs -f webapp${NC}"
fi

# 9. Résumé
echo -e "${GREEN}🎉 Restauration terminée !${NC}"
echo -e "${BLUE}📋 Résumé:${NC}"
echo -e "${GREEN}  ✅ Base de données restaurée depuis: $BACKUP_FILE${NC}"
echo -e "${GREEN}  ✅ Sauvegarde de sécurité: $SAFETY_BACKUP${NC}"
echo -e "${GREEN}  ✅ $TABLES_COUNT tables et $PATIENTS_COUNT patients restaurés${NC}"
echo -e "${GREEN}  ✅ Tous les services redémarrés${NC}"
echo ""
echo -e "${BLUE}🌐 Application accessible sur: http://localhost:4480${NC}"
echo -e "${BLUE}👨‍⚕️ Administration: http://localhost:4480/admin${NC}"