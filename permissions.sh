#!/bin/bash

# Script de gestion des permissions PostgreSQL
# Usage: ./permissions.sh [take|restore]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

POSTGRES_DATA_DIR="postgres_data"

echo -e "${BLUE}🏥 Gestion des permissions PostgreSQL - Assistant Médical${NC}"
echo -e "${BLUE}======================================================${NC}"

# Fonction d'aide
show_help() {
    echo -e "${BLUE}Usage: $0 [commande]${NC}"
    echo ""
    echo -e "${YELLOW}Commandes disponibles:${NC}"
    echo -e "${GREEN}  take${NC}     - Prendre possession du dossier postgres_data"
    echo -e "${GREEN}  restore${NC}  - Restaurer les permissions à PostgreSQL"
    echo -e "${GREEN}  status${NC}   - Afficher le statut actuel des permissions"
    echo ""
    echo -e "${BLUE}Exemples:${NC}"
    echo -e "  $0 take      # Prendre possession pour faire un backup"
    echo -e "  $0 restore   # Rendre les permissions à PostgreSQL"
    echo -e "  $0 status    # Voir qui possède le dossier"
}

# Fonction pour afficher le statut des permissions
show_status() {
    if [ -d "$POSTGRES_DATA_DIR" ]; then
        OWNER=$(stat -c '%U:%G' "$POSTGRES_DATA_DIR" 2>/dev/null || stat -f '%Su:%Sg' "$POSTGRES_DATA_DIR" 2>/dev/null || echo "unknown")
        PERMISSIONS=$(stat -c '%a' "$POSTGRES_DATA_DIR" 2>/dev/null || stat -f '%A' "$POSTGRES_DATA_DIR" 2>/dev/null || echo "unknown")
        
        echo -e "${BLUE}📁 Dossier: $POSTGRES_DATA_DIR${NC}"
        echo -e "${BLUE}👤 Propriétaire: $OWNER${NC}"
        echo -e "${BLUE}🔐 Permissions: $PERMISSIONS${NC}"
        
        if [[ "$OWNER" == "$(whoami):$(id -gn)" ]]; then
            echo -e "${GREEN}✅ Vous avez actuellement accès au dossier${NC}"
        elif [[ "$OWNER" == "999:999" ]] || [[ "$OWNER" =~ ^[0-9]+:[0-9]+$ ]]; then
            echo -e "${YELLOW}🐘 PostgreSQL possède actuellement le dossier (normal)${NC}"
        else
            echo -e "${RED}❓ Propriétaire inhabituel détecté${NC}"
        fi
    else
        echo -e "${RED}❌ Dossier $POSTGRES_DATA_DIR non trouvé${NC}"
        exit 1
    fi
}

# Fonction pour prendre possession
take_ownership() {
    if [ ! -d "$POSTGRES_DATA_DIR" ]; then
        echo -e "${RED}❌ Dossier $POSTGRES_DATA_DIR non trouvé${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔐 Prise de possession du dossier $POSTGRES_DATA_DIR...${NC}"
    
    # Vérifier si on a besoin de sudo
    if [ -w "$POSTGRES_DATA_DIR" ]; then
        chown -R $(whoami):$(id -gn) "$POSTGRES_DATA_DIR"
    else
        sudo chown -R $(whoami):$(id -gn) "$POSTGRES_DATA_DIR"
    fi
    
    echo -e "${GREEN}✅ Vous avez maintenant accès au dossier${NC}"
    echo -e "${YELLOW}⚠️  N'oubliez pas de restaurer les permissions après utilisation !${NC}"
    show_status
}

# Fonction pour restaurer les permissions à PostgreSQL
restore_ownership() {
    if [ ! -d "$POSTGRES_DATA_DIR" ]; then
        echo -e "${RED}❌ Dossier $POSTGRES_DATA_DIR non trouvé${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Redémarrage de PostgreSQL pour restaurer les permissions...${NC}"
    
    # Vérifier que Docker Compose est disponible
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ docker-compose n'est pas installé ou accessible${NC}"
        exit 1
    fi
    
    # Redémarrer PostgreSQL
    docker-compose restart postgres
    
    # Attendre que PostgreSQL soit prêt
    echo -e "${YELLOW}⏳ Attente que PostgreSQL soit prêt...${NC}"
    sleep 5
    
    # Vérifier que PostgreSQL fonctionne et a repris possession
    if docker-compose exec postgres pg_isready -U medical_user -d medical_assistant &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL redémarré avec succès${NC}"
        echo -e "${GREEN}🐘 PostgreSQL a repris possession du dossier${NC}"
        show_status
    else
        echo -e "${RED}❌ PostgreSQL ne répond pas après redémarrage${NC}"
        echo -e "${YELLOW}💡 Vérifiez les logs: docker-compose logs postgres${NC}"
        exit 1
    fi
}

# Traitement des arguments
case "${1:-}" in
    "take"|"t")
        take_ownership
        ;;
    "restore"|"r")
        restore_ownership
        ;;
    "status"|"s"|"")
        show_status
        ;;
    "help"|"h"|"--help"|"-h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Commande inconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac