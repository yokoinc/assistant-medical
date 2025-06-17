#!/bin/sh
set -e

echo "🏥 Démarrage de l'Assistant Médical..."
echo "📅 $(date)"

# Attendre que PostgreSQL soit prêt
echo "🔄 Vérification de la base de données..."
node wait-for-db.js

if [ $? -eq 0 ]; then
    echo "✅ Base de données prête, démarrage de l'application..."
    exec node server.js
else
    echo "❌ Impossible de se connecter à la base de données"
    exit 1
fi