#!/usr/bin/env node
/**
 * Script d'attente de la base de données
 * Attend que PostgreSQL soit prêt avant de démarrer l'application
 */

const { Pool } = require('pg');

// Configuration de la base de données depuis les variables d'environnement
const DB_CONFIG = {
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER || 'medical_user',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'medical_assistant',
    port: 5432,
};

const MAX_RETRIES = 30; // 30 tentatives
const RETRY_DELAY = 2000; // 2 secondes entre chaque tentative

async function waitForDatabase() {
    console.log('🔄 Attente de la disponibilité de PostgreSQL...');
    console.log(`📍 Configuration: ${DB_CONFIG.user}@${DB_CONFIG.host}:5432/${DB_CONFIG.database}`);
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const pool = new Pool(DB_CONFIG);
            
            // Test de connexion simple
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            await pool.end();
            
            console.log(`✅ PostgreSQL est prêt ! (tentative ${attempt}/${MAX_RETRIES})`);
            process.exit(0);
            
        } catch (error) {
            console.log(`⚠️ Tentative ${attempt}/${MAX_RETRIES} - PostgreSQL pas encore prêt:`, error.message);
            
            if (attempt === MAX_RETRIES) {
                console.error('❌ Impossible de se connecter à PostgreSQL après', MAX_RETRIES, 'tentatives');
                console.error('🔧 Vérifiez votre configuration dans le fichier .env');
                process.exit(1);
            }
            
            // Attendre avant la prochaine tentative
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
}

// Gestion propre des signaux d'arrêt
process.on('SIGINT', () => {
    console.log('\n📛 Arrêt du script d\'attente...');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n📛 Arrêt du script d\'attente...');
    process.exit(1);
});

// Démarrage du script
waitForDatabase().catch(error => {
    console.error('❌ Erreur critique dans le script d\'attente:', error);
    process.exit(1);
});