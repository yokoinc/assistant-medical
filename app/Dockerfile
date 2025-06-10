# Dockerfile pour l'application médicale - Version corrigée
FROM node:18-alpine

# Métadonnées
LABEL maintainer="Dr Grégory Cuffel <contact@cabinet-cuffel.fr>"
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
RUN npm ci --only=production \
    && npm cache clean --force

# Copie du code source
COPY . .

# Création du dossier uploads avec permissions correctes
RUN mkdir -p uploads \
    && chown -R medical:nodejs /app \
    && chmod -R 755 /app

# Suppression du script de hachage problématique
RUN rm -f hash-password.js

# Basculer vers l'utilisateur non-root
USER medical

# Exposition du port
EXPOSE 3000

# Healthcheck pour monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "server.js"]