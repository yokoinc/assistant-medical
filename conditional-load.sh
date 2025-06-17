#!/bin/bash
# ===== SCRIPT DE CHARGEMENT CONDITIONNEL DES DONNÉES =====
# Ce script charge les données de test uniquement si LOAD_TEST_DATA=true

set -e

echo "🔍 Vérification de la variable LOAD_TEST_DATA..."

# Les variables d'environnement sont déjà disponibles via docker-compose
# Utilisation de la valeur par défaut si non définie
LOAD_TEST_DATA=${LOAD_TEST_DATA:-false}

echo "📊 LOAD_TEST_DATA = ${LOAD_TEST_DATA}"

if [ "$LOAD_TEST_DATA" = "true" ]; then
    echo "🧪 Chargement des données de test..."
    
    # Vérifier que le fichier de données de test existe
    if [ -f "/docker-entrypoint-initdb.d/02-test-data.sql" ]; then
        echo "📥 Exécution de test-data-complete.sql..."
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/02-test-data.sql
        echo "✅ Données de test chargées avec succès !"
        echo "👥 5 patients de test ajoutés"
        echo "💬 Messages privés et consultations de test disponibles"
        echo "📁 Fichiers fictifs intégrés"
    else
        echo "❌ Fichier test-data-complete.sql non trouvé !"
        exit 1
    fi
else
    echo "🏥 Mode PRODUCTION - Base de données vierge"
    echo "📝 Personnalisez les informations via /admin/parameters"
    echo "🔧 Pour activer les données de test : LOAD_TEST_DATA=true dans .env"
fi

echo "🎉 Initialisation de la base de données terminée !"

# Affichage du résumé
echo ""
echo "=== RÉSUMÉ DE L'INSTALLATION ==="
echo "Base de données: $POSTGRES_DB"
echo "Utilisateur: $POSTGRES_USER"
echo "Mode: $([ "$LOAD_TEST_DATA" = "true" ] && echo "DÉVELOPPEMENT (avec données test)" || echo "PRODUCTION (base vierge)")"
echo "Accès web: http://localhost:${EXTERNAL_PORT:-4480}"
echo "Interface admin: http://localhost:${EXTERNAL_PORT:-4480}/admin"
echo "================================="