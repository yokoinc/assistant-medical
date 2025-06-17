#!/bin/bash

# Script de construction du container autonome
echo "🚀 Construction du container médical autonome..."

# Vérification que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant à la racine !"
    echo "Copiez app/.env vers .env ou créez-le"
    exit 1
fi

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose down

# Rebuild complet avec cache vidé
echo "🔨 Construction du nouveau container..."
docker-compose build --no-cache webapp

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attente de la santé du service
echo "⏳ Attente de la disponibilité du service..."
sleep 10

# Test de santé
if curl -s http://localhost:4480/ > /dev/null; then
    echo "✅ Container autonome opérationnel !"
    echo "🌍 Accès : http://localhost:4480"
    echo "🔧 Admin : dr.cuffel / [voir .env]"
else
    echo "❌ Problème de démarrage"
    docker-compose logs webapp --tail=20
fi

echo "📊 Status des containers :"
docker-compose ps