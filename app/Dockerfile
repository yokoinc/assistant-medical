# Dockerfile pour l'application médicale - Version corrigée
FROM node:18-alpine

# Métadonnées
LABEL maintainer="Assistant Médical Web"
LABEL description="Assistant médical - Application Node.js sécurisée"
LABEL version="2.0.0"

# Installation des dépendances système
RUN apk add --no-cache \
    curl \
    tzdata \
    && cp /usr/share/zoneinfo/Europe/Paris /etc/localtime \
    && echo "Europe/Paris" > /etc/timezone

# Création de l'utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs \
    && adduser -S medical -u 1001 -G nodejs

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copie du code source complet
COPY . .

# Copie du fichier .env depuis la racine du projet (un niveau au-dessus)
COPY ../.env .env

# Création du dossier uploads avec permissions correctes
RUN mkdir -p uploads \
    && chmod +x docker-entrypoint.sh wait-for-db.js \
    && chown -R medical:nodejs /app \
    && chmod -R 755 /app
# Basculer vers l'utilisateur non-root
USER medical

# Exposition du port
EXPOSE 3000

# Healthcheck pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Point d'entrée avec attente DB
ENTRYPOINT ["./docker-entrypoint.sh"]