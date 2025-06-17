#!/bin/bash

# Script de backup automatique pour PostgreSQL
# Usage: ./backup.sh

set -e

# Configuration
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d-%H%M%S)
POSTGRES_DATA_DIR="postgres_data"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Script de backup PostgreSQL - Assistant Médical${NC}"
echo -e "${BLUE}=================================================${NC}"

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose n'est pas installé ou accessible${NC}"
    exit 1
fi

# Vérifier que le container PostgreSQL existe
if ! docker-compose ps postgres | grep -q "webmed-postgres-1"; then
    echo -e "${RED}❌ Container PostgreSQL non trouvé${NC}"
    echo -e "${YELLOW}💡 Lancez d'abord: docker-compose up -d${NC}"
    exit 1
fi

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🔄 Début du backup...${NC}"

# 1. Backup SQL via Docker (recommandé)
echo -e "${BLUE}📊 Backup de la base de données SQL...${NC}"
docker exec webmed-postgres-1 pg_dump -U medical_user medical_assistant > "$BACKUP_DIR/database-$DATE.sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup SQL terminé: $BACKUP_DIR/database-$DATE.sql${NC}"
else
    echo -e "${RED}❌ Erreur lors du backup SQL${NC}"
    exit 1
fi

# 2. Backup des fichiers uploadés
echo -e "${BLUE}📁 Backup des fichiers uploadés...${NC}"
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/
    echo -e "${GREEN}✅ Backup uploads terminé: $BACKUP_DIR/uploads-$DATE.tar.gz${NC}"
else
    echo -e "${YELLOW}⚠️ Dossier uploads non trouvé, ignoré${NC}"
fi

# 3. Backup des données PostgreSQL brutes (optionnel)
echo -e "${BLUE}💾 Backup des données PostgreSQL brutes...${NC}"
if [ -d "$POSTGRES_DATA_DIR" ]; then
    # Reprendre possession temporairement
    echo -e "${YELLOW}🔐 Prise de possession temporaire des données PostgreSQL...${NC}"
    sudo chown -R $(whoami):$(whoami) "$POSTGRES_DATA_DIR/"
    
    # Créer l'archive
    tar -czf "$BACKUP_DIR/postgres-data-$DATE.tar.gz" "$POSTGRES_DATA_DIR/"
    
    # Redémarrer PostgreSQL pour qu'il reprenne possession
    echo -e "${YELLOW}🔄 Redémarrage de PostgreSQL...${NC}"
    docker-compose restart postgres
    
    # Attendre que PostgreSQL soit prêt
    echo -e "${YELLOW}⏳ Attente que PostgreSQL soit prêt...${NC}"
    sleep 5
    
    # Vérifier que PostgreSQL fonctionne
    if docker-compose exec postgres pg_isready -U medical_user -d medical_assistant &>/dev/null; then
        echo -e "${GREEN}✅ Backup PostgreSQL data terminé: $BACKUP_DIR/postgres-data-$DATE.tar.gz${NC}"
        echo -e "${GREEN}✅ PostgreSQL redémarré avec succès${NC}"
    else
        echo -e "${RED}❌ PostgreSQL ne répond pas après redémarrage${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ Dossier postgres_data non trouvé, ignoré${NC}"
fi

# 4. Backup de la configuration
echo -e "${BLUE}⚙️ Backup de la configuration...${NC}"
tar -czf "$BACKUP_DIR/config-$DATE.tar.gz" \
    docker-compose.yml \
    nginx.conf \
    init.sql \
    app/.env.example \
    README.md \
    backup.sh 2>/dev/null || true
echo -e "${GREEN}✅ Backup configuration terminé: $BACKUP_DIR/config-$DATE.tar.gz${NC}"

# 5. Résumé
echo -e "${GREEN}🎉 Backup complet terminé !${NC}"
echo -e "${BLUE}📋 Résumé des fichiers créés:${NC}"
ls -la "$BACKUP_DIR/"*$DATE*

# 6. Calcul de l'espace utilisé
TOTAL_SIZE=$(du -sh "$BACKUP_DIR/"*$DATE* | awk '{sum += $1} END {print sum}' 2>/dev/null || echo "N/A")
echo -e "${BLUE}💽 Espace total du backup: ${TOTAL_SIZE}${NC}"

# 7. Nettoyage automatique (garder seulement les 10 derniers backups)
echo -e "${YELLOW}🧹 Nettoyage des anciens backups...${NC}"
cd "$BACKUP_DIR"
ls -t database-*.sql | tail -n +11 | xargs -r rm
ls -t uploads-*.tar.gz | tail -n +11 | xargs -r rm 2>/dev/null || true
ls -t postgres-data-*.tar.gz | tail -n +11 | xargs -r rm 2>/dev/null || true
ls -t config-*.tar.gz | tail -n +11 | xargs -r rm 2>/dev/null || true
cd ..

echo -e "${GREEN}✨ Backup terminé avec succès ! Tous les anciens backups ont été nettoyés.${NC}"
echo -e "${BLUE}📁 Dossier de backup: ./$BACKUP_DIR/${NC}"