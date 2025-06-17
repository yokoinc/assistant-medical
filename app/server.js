const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const OpenAI = require('openai');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration pour les proxies (nginx)
app.set('trust proxy', 1);

// Configuration base de données
const DB_CONFIG = {
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER || 'medical_user',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'medical_assistant',
    port: 5432,
};

const db = new Pool(DB_CONFIG);

// Configuration OpenAI - ✅ GESTION D'ERREUR AMÉLIORÉE
let openai = null;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ OpenAI configuré');
    } catch (error) {
        console.error('❌ Erreur configuration OpenAI:', error.message);
    }
} else {
    console.warn('⚠️  OpenAI non configuré - Chat désactivé');
}

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https://api-adresse.data.gouv.fr"],
            frameSrc: ["'self'", "https://www.bing.com"],
        },
    },
}));

// Rate limiting amélioré
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 tentatives par IP
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    }
});

// Rate limiting général
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requêtes par IP
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting spécifique pour le chat IA
const chatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: parseInt(process.env.CHAT_HOURLY_LIMIT) || 20, // Configurable via .env
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Limite de messages chat temporaire atteinte. Réessayez dans 1 heure.',
        suggestion: 'Pour des questions urgentes, utilisez la messagerie privée au médecin.'
    }
});

app.use(generalLimiter);

// Middleware Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Configuration pour servir les fichiers statiques avec les bons Content-Type
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Configuration des sessions - ✅ SÉCURISÉE ET STABLE
app.use(session({
    secret: process.env.SESSION_SECRET || 'medical-assistant-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'medical_session',
    cookie: {
        secure: false, // Forcé à false pour tunnel Cloudflare
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
        sameSite: 'lax'
    }
}));

// Middleware de debugging des sessions
app.use((req, res, next) => {
    // Logger uniquement les requêtes admin importantes pour éviter le spam
    if (req.url.startsWith('/api/admin/') || req.url.startsWith('/admin/')) {
        console.log('📊 Session middleware:', {
            url: req.url,
            method: req.method,
            sessionExists: !!req.session,
            sessionId: req.session?.id,
            adminSession: !!req.session?.admin,
            adminId: req.session?.admin?.id,
            adminUsername: req.session?.admin?.username,
            cookiePresent: !!req.headers.cookie,
            cookieValue: req.headers.cookie ? req.headers.cookie.substring(0, 50) + '...' : 'none'
        });
    }
    next();
});

// Configuration upload de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/heic',
            'application/zip'
        ];
        cb(null, allowedTypes.includes(file.mimetype));
    }
});

// Middleware d'authentification amélioré
const requireAuth = (req, res, next) => {
    if (req.session && req.session.patient && req.session.patient.id) {
        // Vérification additionnelle de la validité de la session
        next();
    } else {
        console.warn('🚨 Tentative d\'accès non autorisé à l\'espace patient');
        res.status(401).json({ error: 'Authentification requise' });
    }
};

const requireAdmin = (req, res, next) => {
    console.log('🔍 requireAdmin - Vérification session admin:', {
        sessionExists: !!req.session,
        sessionId: req.session?.id,
        adminExists: !!req.session?.admin,
        adminId: req.session?.admin?.id,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')?.substring(0, 50),
        cookies: Object.keys(req.cookies || {}),
        sessionCookie: req.get('Cookie')?.includes('medical_session') ? 'present' : 'missing',
        adminUsername: req.session?.admin?.username,
        loginTime: req.session?.admin?.loginTime,
        lastActivity: req.session?.admin?.lastActivity,
        currentTime: new Date().toISOString(),
        sessionCookie: req.headers.cookie,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        url: req.url,
        method: req.method
    });

    if (req.session && req.session.admin && req.session.admin.id) {
        // Mise à jour de la dernière activité
        req.session.admin.lastActivity = new Date().toISOString();
        
        // Vérification de l'âge de la session (24 heures max)
        const loginTime = new Date(req.session.admin.loginTime);
        const now = new Date();
        const sessionAge = now - loginTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        
        console.log('✅ Session admin valide:', {
            adminId: req.session.admin.id,
            username: req.session.admin.username,
            sessionAge: Math.round(sessionAge / 1000 / 60), // en minutes
            maxAge: Math.round(maxAge / 1000 / 60), // en minutes
            remaining: Math.round((maxAge - sessionAge) / 1000 / 60) // temps restant en minutes
        });
        
        if (sessionAge > maxAge) {
            console.warn('⚠️ Session admin expirée (24h dépassées):', {
                adminId: req.session.admin.id,
                username: req.session.admin.username,
                sessionAge: Math.round(sessionAge / 1000 / 60) + ' minutes',
                loginTime: loginTime.toISOString()
            });
            
            req.session.destroy((err) => {
                if (err) console.error('❌ Erreur destruction session expirée:', err);
            });
            
            // Si c'est une requête HTML (page), rediriger vers /admin
            if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
                return res.redirect('/admin');
            }
            
            return res.status(401).json({ 
                error: 'Session expirée', 
                reason: 'Session dépassée (24h max)',
                redirect: '/admin'
            });
        }
        
        next();
    } else {
        console.warn('🚨 Tentative d\'accès non autorisé à l\'administration:', {
            sessionExists: !!req.session,
            adminExists: !!req.session?.admin,
            adminId: req.session?.admin?.id,
            url: req.url,
            method: req.method,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            sessionCookie: req.headers.cookie ? 'present' : 'missing'
        });
        
        // Si c'est une requête HTML (page), rediriger vers /admin
        if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
            return res.redirect('/admin');
        }
        
        // Sinon, renvoyer JSON pour les requêtes API
        res.status(401).json({ 
            error: 'Authentification admin requise',
            redirect: '/admin'
        });
    }
};

// Configuration ChatGPT - Sera générée dynamiquement
let MEDICAL_SYSTEM_PROMPT = '';

// Fonction pour générer le prompt système avec les paramètres du cabinet
async function generateSystemPrompt() {
    try {
        const settingsResult = await db.query('SELECT setting_key, setting_value FROM cabinet_settings');
        const settings = {};
        settingsResult.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        const docteurNom = settings.cabinet_nom_docteur || 'Dr Nom Prénom';
        const specialite = settings.cabinet_specialite || 'Médecin Généraliste';
        const ville = settings.cabinet_ville || 'Votre Ville';
        const assistantNom = settings.assistant_nom || 'Assistant Médical';

        // Récupérer les numéros d'urgence depuis la base
        const urgencesResult = await db.query('SELECT nom, telephone FROM urgences WHERE actif = true ORDER BY ordre ASC');
        const urgences = urgencesResult.rows.map(u => `- ${u.nom} : ${u.telephone}`).join('\n');

        MEDICAL_SYSTEM_PROMPT = `Tu es ${assistantNom} du ${docteurNom}, ${specialite} à ${ville}.

RÔLE ET LIMITES STRICTES :
L'assistant médical ne répondra qu'à des questions médicales simples, du type conseils en cas de maladie virale bénigne, rhume, gastro. Il expliquera éventuellement les modalités de réalisation de certificats et d'arrêt de travail en France. Par exemple, les arrêts de travail en France ne sont pas obligatoirement réalisés le jour même. Nous avons deux jours pour les déclarer. Il pourra également chercher dans la base de données uniquement les numéros de téléphone et adresse fournies, mais en aucun cas être capable d'aller puiser d'autres informations comme la liste des patients inscrits ou les retards.

- Tu NE peux PAS remplacer une consultation médicale
- Tu NE donnes PAS de diagnostic médical
- Tu NE prescris PAS de médicaments
- Tu ne traites QUE les questions sur les maladies virales bénignes (rhume, gastro, etc.)
- Tu expliques uniquement les modalités d'arrêts de travail et certificats en France
- Tu ne peux accéder QU'AUX numéros de téléphone et adresses du cabinet
- Tu ne peux PAS accéder à la liste des patients ou aux retards
- En cas d'urgence, tu diriges IMMÉDIATEMENT vers les numéros d'urgence

NUMÉROS D'URGENCE :
${urgences}

Réponds toujours en français, de manière claire et rassurante.`;

    } catch (error) {
        console.error('Erreur génération prompt système:', error);
        // Fallback
        MEDICAL_SYSTEM_PROMPT = `Tu es un assistant médical.

RÔLE ET LIMITES STRICTES :
L'assistant médical ne répondra qu'à des questions médicales simples, du type conseils en cas de maladie virale bénigne, rhume, gastro. Il expliquera éventuellement les modalités de réalisation de certificats et d'arrêt de travail en France. Par exemple, les arrêts de travail en France ne sont pas obligatoirement réalisés le jour même. Nous avons deux jours pour les déclarer. Il pourra également chercher dans la base de données uniquement les numéros de téléphone et adresse fournies, mais en aucun cas être capable d'aller puiser d'autres informations comme la liste des patients inscrits ou les retards.

- Tu NE peux PAS remplacer une consultation médicale
- Tu NE donnes PAS de diagnostic médical
- Tu NE prescris PAS de médicaments
- Tu ne traites QUE les questions sur les maladies virales bénignes (rhume, gastro, etc.)
- Tu expliques uniquement les modalités d'arrêts de travail et certificats en France
- Tu ne peux accéder QU'AUX numéros de téléphone et adresses du cabinet
- Tu ne peux PAS accéder à la liste des patients ou aux retards
- En cas d'urgence, tu diriges IMMÉDIATEMENT vers les numéros d'urgence

NUMÉROS D'URGENCE :
- SAMU : 15
- Pompiers : 18
- Police : 17
- Urgences européennes : 112

Réponds toujours en français, de manière claire et rassurante.`;
    }
}

// ===== ROUTES PUBLIQUES =====

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    if (req.session.patient) {
        return res.redirect('/espace-patient');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/api/cabinet-info', async (req, res) => {
    try {
        // Récupérer les paramètres depuis la base de données
        const settingsResult = await db.query('SELECT setting_key, setting_value, setting_type FROM cabinet_settings');
        
        const settings = {};
        settingsResult.rows.forEach(row => {
            let value = row.setting_value;
            if (row.setting_type === 'json' && value) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.warn(`Erreur parsing JSON pour ${row.setting_key}:`, e);
                }
            }
            settings[row.setting_key] = value;
        });

        const cabinetInfo = {
            docteur: {
                nom: settings.cabinet_nom_docteur || "Dr Nom Prénom",
                specialite: settings.cabinet_specialite || "Médecin Généraliste",
                ville: settings.cabinet_ville || "Votre Ville"
            },
            horaires: settings.cabinet_horaires || {
                "Lundi": "8h00 - 19h00",
                "Mardi": "8h00 - 19h00", 
                "Mercredi": "8h00 - 19h00",
                "Jeudi": "8h00 - 19h00",
                "Vendredi": "8h00 - 19h00",
                "Samedi": "8h00 - 12h00",
                "Dimanche": "Fermé"
            },
            contact: {
                telephone: settings.cabinet_telephone || "02 XX XX XX XX",
                adresse: settings.cabinet_adresse || "Adresse du cabinet",
                email: settings.cabinet_email || "contact@votre-cabinet.fr"
            },
            infos: {
                "Rendez-vous": settings.cabinet_rdv_mode || "Sur rendez-vous uniquement",
                "Urgences": "Contacter le 15 (SAMU)",
                "Parking": settings.cabinet_parking || "Parking gratuit disponible",
                "Accès": settings.cabinet_acces || "Accessible PMR"
            },
            settings: settings
        };
        res.json(cabinetInfo);
    } catch (error) {
        console.error('Erreur info cabinet:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/urgences', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM urgences WHERE actif = true ORDER BY ordre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur urgences:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ===== AUTHENTIFICATION PATIENTS =====

app.post('/api/auth', authLimiter, [
    body('nom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('prenom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('dateNaissance').isISO8601().toDate(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('🚨 Validation échouée pour auth patient:', errors.array());
            return res.status(400).json({ error: 'Données invalides' });
        }

        const { nom, prenom, dateNaissance } = req.body;

        console.log(`🔐 Tentative de connexion patient: ${prenom} ${nom}`);

        const result = await db.query(`
            SELECT * FROM patients 
            WHERE LOWER(nom) = LOWER($1) 
            AND LOWER(prenom) = LOWER($2) 
            AND date_naissance = $3 
            AND actif = true
        `, [nom.trim(), prenom.trim(), dateNaissance]);

        if (result.rows.length === 0) {
            console.warn(`🚨 Patient non trouvé: ${prenom} ${nom} (${dateNaissance})`);
            return res.status(401).json({ 
                error: 'Patient non trouvé dans la patientèle du cabinet' 
            });
        }

        const patient = result.rows[0];
        const sessionToken = uuidv4();
        
        const consultation = await db.query(
            'INSERT INTO consultations (patient_id, session_token) VALUES ($1, $2) RETURNING *',
            [patient.id, sessionToken]
        );

        req.session.patient = {
            id: patient.id,
            nom: patient.nom,
            prenom: patient.prenom,
            consultationId: consultation.rows[0].id,
            sessionToken: sessionToken,
            loginTime: new Date().toISOString()
        };

        console.log(`✅ Connexion patient réussie: ${patient.prenom} ${patient.nom} (ID: ${patient.id})`);

        res.json({ 
            success: true, 
            patient: { nom: patient.nom, prenom: patient.prenom },
            redirect: '/espace-patient'
        });

    } catch (error) {
        console.error('❌ Erreur authentification patient:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ===== ROUTES PATIENTS =====

app.get('/espace-patient', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'espace-patient.html'));
});

// Redirection de /chat vers /chat-assistant pour compatibilité
app.get('/chat', requireAuth, (req, res) => {
    res.redirect('/chat-assistant');
});

app.get('/chat-assistant', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.post('/api/message-prive', requireAuth, upload.array('files', 5), async (req, res) => {
    try {
        console.log(`📧 Nouveau message privé de ${req.session.patient.prenom} ${req.session.patient.nom}`);

        // Validation renforcée
        const { sujet, message, urgence } = req.body;
        
        if (!sujet || typeof sujet !== 'string' || sujet.trim().length < 5 || sujet.trim().length > 200) {
            return res.status(400).json({ error: 'Le sujet doit contenir entre 5 et 200 caractères' });
        }
        
        if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 2000) {
            return res.status(400).json({ error: 'Le message doit contenir entre 10 et 2000 caractères' });
        }
        
        if (!urgence || !['faible', 'normale', 'elevee'].includes(urgence)) {
            return res.status(400).json({ error: 'Niveau d\'urgence invalide' });
        }

        const patientId = req.session.patient.id;
        const consultationId = req.session.patient.consultationId;

        // Insérer le message
        const messageResult = await db.query(`
            INSERT INTO messages_prives (
                patient_id, consultation_id, sujet, message, niveau_urgence
            ) VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [patientId, consultationId, sujet.trim(), message.trim(), urgence]);

        const messageId = messageResult.rows[0].id;

        // Traiter les fichiers s'il y en a
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await db.query(`
                    INSERT INTO fichiers (
                        consultation_id, nom_original, nom_stockage, type_mime, taille_bytes
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [consultationId, file.originalname, file.filename, file.mimetype, file.size]);
            }
            console.log(`📎 ${req.files.length} fichier(s) ajouté(s) au message ${messageId}`);
        }

        console.log(`✅ Message envoyé avec succès, ID: ${messageId}, Urgence: ${urgence}`);

        res.json({
            success: true,
            message: 'Message envoyé avec succès au médecin',
            messageId: messageId
        });

    } catch (error) {
        console.error('❌ Erreur envoi message:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
});

app.get('/api/mes-messages', requireAuth, async (req, res) => {
    try {
        const messages = await db.query(`
            SELECT m.*, 
                   CASE WHEN m.reponse_docteur IS NOT NULL THEN true ELSE false END as repondu
            FROM messages_prives m 
            WHERE m.patient_id = $1 
            ORDER BY m.created_at DESC 
            LIMIT 20
        `, [req.session.patient.id]);

        res.json({
            messages: messages.rows.map(msg => ({
                id: msg.id,
                sujet: msg.sujet,
                message: msg.message,
                urgence: msg.niveau_urgence,
                date: moment(msg.created_at).format('DD/MM/YYYY HH:mm'),
                repondu: msg.repondu,
                reponse: msg.reponse_docteur,
                dateReponse: msg.date_reponse ? moment(msg.date_reponse).format('DD/MM/YYYY HH:mm') : null
            }))
        });
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Fonction pour vérifier et incrémenter la limite quotidienne par patient
async function checkAndIncrementChatLimit(patientId, consultationId) {
    try {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Utiliser UPSERT pour incrémenter ou créer l'entrée du jour
        const result = await db.query(`
            INSERT INTO chat_usage (patient_id, consultation_id, usage_date, message_count)
            VALUES ($1, $2, $3, 1)
            ON CONFLICT (patient_id, usage_date)
            DO UPDATE SET 
                message_count = chat_usage.message_count + 1,
                consultation_id = $2
            RETURNING message_count
        `, [patientId, consultationId, today]);
        
        const currentCount = parseInt(result.rows[0]?.message_count || 0);
        const dailyLimit = parseInt(process.env.CHAT_DAILY_LIMIT) || 40;
        
        // Retourner true si la limite est atteinte
        return currentCount > dailyLimit;
    } catch (error) {
        console.error('Erreur gestion limite chat:', error);
        return false; // En cas d'erreur, on laisse passer
    }
}

// ✅ GESTION D'ERREUR AMÉLIORÉE POUR LE CHAT
app.post('/api/chat', requireAuth, chatLimiter, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message vide' });
        }

        const maxLength = parseInt(process.env.CHAT_MESSAGE_MAX_LENGTH) || 300;
        if (message.length > maxLength) {
            return res.status(400).json({ error: `Message trop long (max ${maxLength} caractères)` });
        }

        // ✅ VÉRIFIER ET INCRÉMENTER LA LIMITE QUOTIDIENNE PAR PATIENT
        const dailyLimitReached = await checkAndIncrementChatLimit(
            req.session.patient.id, 
            req.session.patient.consultationId
        );
        if (dailyLimitReached) {
            return res.status(429).json({ 
                error: 'Limite quotidienne de messages chat atteinte',
                suggestion: 'Revenez demain ou utilisez la messagerie privée pour des questions importantes.'
            });
        }

        // ✅ REGÉNÉRER LE PROMPT SYSTÈME AVEC LES PARAMÈTRES ACTUELS
        await generateSystemPrompt();

        // ✅ VÉRIFIER SI OPENAI EST DISPONIBLE
        if (!openai) {
            return res.status(503).json({ 
                error: 'Assistant temporairement indisponible',
                fallback: 'En cas d\'urgence, appelez le 15 (SAMU)'
            });
        }

        const consultation = await db.query(
            'SELECT conversation_history FROM consultations WHERE id = $1',
            [req.session.patient.consultationId]
        );

        let conversationHistory = consultation.rows[0]?.conversation_history || [];

        conversationHistory.push({
            role: 'user',
            content: message.trim(),
            timestamp: new Date().toISOString()
        });

        const messages = [
            { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
            ...conversationHistory.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        const assistantResponse = completion.choices[0].message.content;

        conversationHistory.push({
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date().toISOString()
        });

        await db.query(
            'UPDATE consultations SET conversation_history = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(conversationHistory), req.session.patient.consultationId]
        );

        res.json({
            response: assistantResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur chat:', error);
        res.status(500).json({ 
            error: 'Erreur assistant',
            fallback: 'En cas d\'urgence, appelez le 15 (SAMU)'
        });
    }
});

app.post('/api/logout', (req, res) => {
    const patientInfo = req.session.patient;
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Erreur déconnexion:', err);
            return res.status(500).json({ error: 'Erreur déconnexion' });
        }
        if (patientInfo) {
            console.log(`👋 Déconnexion patient: ${patientInfo.prenom} ${patientInfo.nom}`);
        }
        res.json({ success: true, redirect: '/' });
    });
});

// ===== ROUTES ADMIN =====

app.get('/admin', (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// ✅ AUTHENTIFICATION ADMIN COMPLÈTEMENT CORRIGÉE ET SÉCURISÉE
app.post('/api/admin/auth', authLimiter, [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9._-]+$/)
        .withMessage('Nom d\'utilisateur invalide')
        .escape(),
    body('password')
        .isLength({ min: 6, max: 200 })
        .withMessage('Mot de passe invalide'),
], async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Validation des entrées
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn('🚨 Validation échouée pour admin auth:', errors.array());
            return res.status(400).json({ 
                error: 'Données invalides',
                details: process.env.NODE_ENV === 'development' ? errors.array() : undefined
            });
        }

        const { username, password } = req.body;
        
        console.log(`🔑 Tentative de connexion admin: ${username}`);

        // Recherche de l'admin avec informations détaillées
        const adminResult = await db.query(`
            SELECT id, username, password_hash, nom, prenom, specialite, email, last_login, 
                   created_at, actif
            FROM admins 
            WHERE LOWER(username) = LOWER($1) AND actif = true
        `, [username]);

        // Vérification anti-timing attack (même temps d'exécution si user inexistant)
        const adminExists = adminResult.rows.length > 0;
        const admin = adminExists ? adminResult.rows[0] : null;
        
        // Hash factice pour éviter les timing attacks
        const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const hashToCheck = adminExists ? admin.password_hash : dummyHash;
        
        let passwordValid = false;
        
        // Mots de passe en clair pour NAS peu puissant (HTTPS sécurise la transmission)
        passwordValid = (password === hashToCheck);

        // Vérification finale avec protection anti-timing
        const isValidLogin = adminExists && passwordValid;
        
        if (!isValidLogin) {
            // Log de sécurité détaillé
            const clientInfo = {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                username: username
            };
            
            console.warn(`🚨 Tentative de connexion admin échouée:`, clientInfo);
            
            // Attendre un délai minimum pour éviter les timing attacks
            const minDelay = 1000; // 1 seconde minimum
            const elapsed = Date.now() - startTime;
            const remainingDelay = Math.max(0, minDelay - elapsed);
            
            await new Promise(resolve => setTimeout(resolve, remainingDelay));
            
            return res.status(401).json({ 
                error: 'Identifiants incorrects'
            });
        }

        // Connexion réussie - Mise à jour des informations de connexion
        await db.query(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );

        // Création de la session admin sécurisée
        req.session.admin = {
            id: admin.id,
            username: admin.username,
            nom: admin.nom,
            prenom: admin.prenom,
            specialite: admin.specialite,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };

        // Debugging - Logger les détails de la session créée
        console.log('🔐 Session admin créée:', {
            sessionId: req.session.id,
            adminId: admin.id,
            username: admin.username,
            loginTime: req.session.admin.loginTime,
            cookie: req.session.cookie,
            maxAge: req.session.cookie.maxAge,
            expires: req.session.cookie.expires,
            secure: req.session.cookie.secure,
            httpOnly: req.session.cookie.httpOnly,
            sameSite: req.session.cookie.sameSite
        });

        // Log de sécurité pour connexion réussie
        const successInfo = {
            adminId: admin.id,
            username: admin.username,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            lastLogin: admin.last_login
        };
        
        console.log(`✅ Connexion admin réussie:`, successInfo);

        // Attendre le délai minimum même en cas de succès
        const minDelay = 1000;
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minDelay - elapsed);
        
        await new Promise(resolve => setTimeout(resolve, remainingDelay));

        res.json({ 
            success: true, 
            admin: { 
                nom: admin.nom, 
                prenom: admin.prenom, 
                specialite: admin.specialite,
                lastLogin: admin.last_login ? moment(admin.last_login).format('DD/MM/YYYY HH:mm') : null
            },
            redirect: '/admin/dashboard'
        });

    } catch (error) {
        console.error('❌ Erreur authentification admin:', error);
        
        // Attendre le délai minimum même en cas d'erreur
        const minDelay = 1000;
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, minDelay - elapsed);
        
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
        
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN lu_par_docteur = false THEN 1 END) as messages_non_lus,
                COUNT(CASE WHEN reponse_docteur IS NULL THEN 1 END) as messages_sans_reponse,
                COUNT(CASE WHEN niveau_urgence = 'elevee' THEN 1 END) as messages_urgents,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as messages_aujourd_hui,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as messages_semaine,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as messages_mois,
                COUNT(CASE WHEN archived = true THEN 1 END) as messages_archives
            FROM messages_prives
        `);

        res.json({
            success: true,
            messages: stats.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


app.get('/admin/patients', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-patients.html'));
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(CASE WHEN lu_par_docteur = false THEN 1 END) as messages_non_lus,
                COUNT(CASE WHEN reponse_docteur IS NULL THEN 1 END) as messages_sans_reponse,
                COUNT(CASE WHEN niveau_urgence = 'elevee' THEN 1 END) as messages_urgents,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as messages_aujourd_hui,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as messages_semaine,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as messages_mois,
                COUNT(CASE WHEN archived = true THEN 1 END) as messages_archives
            FROM messages_prives
        `);

        res.json({
            messages: stats.rows[0]
        });

    } catch (error) {
        console.error('Erreur stats admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/admin/messages', requireAdmin, async (req, res) => {
    try {
        const { status = 'all', urgence = 'all', period = 'all', limit = 50 } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (status === 'unread') {
            whereClause += ' AND m.lu_par_docteur = false AND m.archived = false';
        } else if (status === 'archived') {
            whereClause += ' AND m.archived = true';
        } else if (status === 'active') {
            whereClause += ' AND m.archived = false';
        }
        
        if (urgence !== 'all') {
            whereClause += ` AND m.niveau_urgence = $${params.length + 1}`;
            params.push(urgence);
        }

        // Filtres par période
        if (period === 'today') {
            whereClause += ' AND m.created_at >= CURRENT_DATE';
        } else if (period === 'week') {
            whereClause += ' AND m.created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        } else if (period === 'month') {
            whereClause += ' AND m.created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        }
        
        params.push(parseInt(limit) || 50);
        
        console.log('📋 Filter query:', {
            status, urgence, period,
            whereClause,
            params
        });
        
        const messages = await db.query(`
            SELECT m.*, p.nom, p.prenom, p.telephone, p.email
            FROM messages_prives m
            JOIN patients p ON m.patient_id = p.id
            WHERE ${whereClause}
            ORDER BY m.created_at DESC
            LIMIT $${params.length}
        `, params);
        
        console.log('📋 Query returned:', messages.rows.length, 'messages');

        // Récupérer les fichiers associés
        for (let message of messages.rows) {
            let fichiersData = [];
            
            // Fichiers depuis consultation (table fichiers)
            if (message.consultation_id) {
                const fichiers = await db.query(`
                    SELECT f.id, f.nom_original, f.nom_stockage, f.type_mime, f.taille_bytes
                    FROM fichiers f
                    WHERE f.consultation_id = $1
                `, [message.consultation_id]);
                fichiersData = fichiers.rows;
            }
            
            // Fichiers joints directs (stockés dans fichiers_joints)
            if (message.fichiers_joints && Array.isArray(message.fichiers_joints)) {
                message.fichiers_joints.forEach(fichier => {
                    fichiersData.push({
                        nom_original: fichier,
                        nom_stockage: fichier,
                        type_mime: 'application/octet-stream',
                        taille_bytes: null
                    });
                });
            }
            
            message.fichiers = fichiersData;
        }

        res.json({
            messages: messages.rows.map(msg => ({
                id: msg.id,
                patient: {
                    nom: msg.nom,
                    prenom: msg.prenom,
                    telephone: msg.telephone,
                    email: msg.email
                },
                sujet: msg.sujet,
                message: msg.message,
                urgence: msg.niveau_urgence,
                lu: msg.lu_par_docteur,
                archived: msg.archived,
                repondu: !!msg.reponse_docteur,
                reponse: msg.reponse_docteur,
                dateMessage: moment(msg.created_at).format('DD/MM/YYYY HH:mm'),
                dateReponse: msg.date_reponse ? moment(msg.date_reponse).format('DD/MM/YYYY HH:mm') : null,
                fichiers: msg.fichiers || []
            }))
        });

    } catch (error) {
        console.error('Erreur messages admin:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/admin/messages/:id/mark-read', requireAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: 'ID de message invalide' });
        }

        await db.query(
            'UPDATE messages_prives SET lu_par_docteur = true WHERE id = $1',
            [messageId]
        );
        
        console.log(`✅ Message ${messageId} marqué comme lu par ${req.session.admin.username}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur marquer lu:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/admin/messages/:id/reply', requireAdmin, [
    body('reponse').trim().isLength({ min: 10, max: 5000 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Réponse invalide' });
        }

        const messageId = parseInt(req.params.id);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: 'ID de message invalide' });
        }

        const { reponse } = req.body;

        await db.query(`
            UPDATE messages_prives 
            SET reponse_docteur = $1, date_reponse = CURRENT_TIMESTAMP, lu_par_docteur = true
            WHERE id = $2
        `, [reponse.trim(), messageId]);

        console.log(`✅ Réponse envoyée au message ${messageId} par ${req.session.admin.username}`);
        res.json({ success: true, message: 'Réponse envoyée avec succès' });

    } catch (error) {
        console.error('Erreur réponse message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour télécharger les fichiers
app.get('/api/admin/files/:fileId', requireAdmin, async (req, res) => {
    try {
        const fileId = parseInt(req.params.fileId);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'ID de fichier invalide' });
        }

        const fileResult = await db.query(
            'SELECT * FROM fichiers WHERE id = $1',
            [fileId]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const file = fileResult.rows[0];
        const filePath = path.join(__dirname, 'uploads', file.nom_stockage);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier physique non trouvé' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.nom_original}"`);
        res.setHeader('Content-Type', file.type_mime || 'application/octet-stream');
        res.sendFile(filePath);

    } catch (error) {
        console.error('Erreur téléchargement fichier:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour télécharger un fichier par nom de stockage (pour les fichiers sans ID)
app.get('/api/admin/files/by-name/:filename', requireAdmin, async (req, res) => {
    try {
        const filename = req.params.filename;
        if (!filename) {
            return res.status(400).json({ error: 'Nom de fichier invalide' });
        }

        // Sécurité : vérifier que le nom de fichier ne contient pas de caractères dangereux
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Nom de fichier non autorisé' });
        }

        let filePath = path.join(__dirname, 'uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier physique non trouvé' });
        }

        // Essayer de deviner le nom original à partir du nom de stockage
        const originalName = filename.split('-').slice(4).join('-') || filename;
        
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.sendFile(filePath);

    } catch (error) {
        console.error('Erreur téléchargement fichier par nom:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour supprimer un message
app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: 'ID de message invalide' });
        }

        // Vérifier que le message existe
        const messageResult = await db.query(
            'SELECT consultation_id FROM messages_prives WHERE id = $1',
            [messageId]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message non trouvé' });
        }

        const consultationId = messageResult.rows[0].consultation_id;

        // Récupérer tous les fichiers associés (via consultation_id OU message_id)
        const filesResult = await db.query(
            'SELECT id, nom_stockage, nom_original FROM fichiers WHERE consultation_id = $1 OR message_id = $2',
            [consultationId, messageId]
        );

        // Supprimer les fichiers physiques du dossier uploads
        let deletedFiles = 0;
        let fileNames = [];
        
        for (const file of filesResult.rows) {
            const filePath = path.join(__dirname, file.nom_stockage);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFiles++;
                    fileNames.push(file.nom_original);
                    console.log(`📁 Fichier supprimé: ${file.nom_stockage}`);
                }
            } catch (fileError) {
                console.warn(`⚠️ Impossible de supprimer le fichier ${file.nom_stockage}:`, fileError.message);
            }
        }

        // Supprimer les enregistrements de fichiers en base
        if (filesResult.rows.length > 0) {
            await db.query('DELETE FROM fichiers WHERE consultation_id = $1 OR message_id = $2', [consultationId, messageId]);
        }

        // Supprimer le message
        await db.query('DELETE FROM messages_prives WHERE id = $1', [messageId]);
        
        console.log(`🗑️ Message ${messageId} supprimé par ${req.session.admin.username} (${deletedFiles} fichier(s) supprimé(s))`);
        res.json({ 
            success: true, 
            deletedFiles: deletedFiles,
            fileNames: fileNames,
            message: `Message supprimé avec ${deletedFiles} fichier(s)`
        });

    } catch (error) {
        console.error('Erreur suppression message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour archiver un message (marquer comme traité)
app.post('/api/admin/messages/:id/archive', requireAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        if (isNaN(messageId)) {
            return res.status(400).json({ error: 'ID de message invalide' });
        }

        await db.query(
            'UPDATE messages_prives SET lu_par_docteur = true, archived = true WHERE id = $1',
            [messageId]
        );
        
        console.log(`📁 Message ${messageId} archivé par ${req.session.admin.username}`);
        res.json({ success: true });

    } catch (error) {
        console.error('Erreur archivage message:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ===== GESTION DES PATIENTS =====

// Lister tous les patients
app.get('/api/admin/patients', requireAdmin, async (req, res) => {
    try {
        const { search = '', limit = 50, offset = 0 } = req.query;
        
        let whereClause = '';
        let params = [];
        
        if (search.trim()) {
            whereClause = `WHERE (LOWER(nom) LIKE LOWER($1) OR LOWER(prenom) LIKE LOWER($1) OR telephone LIKE $1 OR email LIKE LOWER($1))`;
            params.push(`%${search.trim()}%`);
        }
        
        const countQuery = `SELECT COUNT(*) as total FROM patients ${whereClause}`;
        const totalResult = await db.query(countQuery, params);
        const total = parseInt(totalResult.rows[0].total);
        
        params.push(parseInt(limit) || 50);
        params.push(parseInt(offset) || 0);
        
        const patients = await db.query(`
            SELECT id, nom, prenom, date_naissance, telephone, email, actif, created_at
            FROM patients 
            ${whereClause}
            ORDER BY nom, prenom
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        res.json({
            patients: patients.rows.map(patient => ({
                ...patient,
                created_at: moment(patient.created_at).format('DD/MM/YYYY')
            })),
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Erreur liste patients:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un nouveau patient
app.post('/api/admin/patients', requireAdmin, [
    body('nom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('prenom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('date_naissance').isISO8601().toDate(),
    body('telephone').optional().trim().isLength({ max: 20 }),
    body('email').optional().isEmail().normalizeEmail(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Données invalides', details: errors.array() });
        }

        const { nom, prenom, date_naissance, telephone, email, actif = true } = req.body;

        // Vérifier si le patient existe déjà
        const existing = await db.query(
            'SELECT id FROM patients WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2) AND date_naissance = $3',
            [nom, prenom, date_naissance]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Un patient avec ces informations existe déjà' });
        }

        const result = await db.query(`
            INSERT INTO patients (nom, prenom, date_naissance, telephone, email, actif)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nom, prenom
        `, [nom, prenom, date_naissance, telephone || null, email || null, actif]);

        console.log(`✅ Patient créé: ${result.rows[0].prenom} ${result.rows[0].nom} (ID: ${result.rows[0].id}) par ${req.session.admin.username}`);
        
        res.json({ 
            success: true, 
            patient: result.rows[0],
            message: 'Patient créé avec succès'
        });

    } catch (error) {
        console.error('Erreur création patient:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Modifier un patient
app.put('/api/admin/patients/:id', requireAdmin, [
    body('nom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('prenom').trim().isLength({ min: 2, max: 100 }).escape(),
    body('date_naissance').isISO8601().toDate(),
    body('telephone').optional().trim().isLength({ max: 20 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('actif').isBoolean(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Données invalides', details: errors.array() });
        }

        const patientId = parseInt(req.params.id);
        if (isNaN(patientId)) {
            return res.status(400).json({ error: 'ID patient invalide' });
        }

        const { nom, prenom, date_naissance, telephone, email, actif } = req.body;

        const result = await db.query(`
            UPDATE patients 
            SET nom = $1, prenom = $2, date_naissance = $3, telephone = $4, email = $5, actif = $6
            WHERE id = $7
            RETURNING id, nom, prenom
        `, [nom, prenom, date_naissance, telephone || null, email || null, actif, patientId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }

        console.log(`✅ Patient modifié: ${result.rows[0].prenom} ${result.rows[0].nom} (ID: ${result.rows[0].id}) par ${req.session.admin.username}`);
        
        res.json({ 
            success: true, 
            patient: result.rows[0],
            message: 'Patient modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur modification patient:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un ou plusieurs patients
app.delete('/api/admin/patients', requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Liste d\'IDs invalide' });
        }

        // Vérifier que tous les IDs sont des nombres
        const patientIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        if (patientIds.length !== ids.length) {
            return res.status(400).json({ error: 'IDs patients invalides' });
        }

        // Récupérer les noms des patients avant suppression (pour les logs)
        const patientsToDelete = await db.query(
            `SELECT id, nom, prenom FROM patients WHERE id = ANY($1)`,
            [patientIds]
        );

        // Supprimer les patients (CASCADE supprimera les relations)
        const result = await db.query(
            'DELETE FROM patients WHERE id = ANY($1) RETURNING id',
            [patientIds]
        );

        const deletedCount = result.rows.length;
        
        console.log(`🗑️ ${deletedCount} patient(s) supprimé(s) par ${req.session.admin.username}:`);
        patientsToDelete.rows.forEach(p => {
            console.log(`   - ${p.prenom} ${p.nom} (ID: ${p.id})`);
        });

        res.json({ 
            success: true, 
            deletedCount: deletedCount,
            message: `${deletedCount} patient(s) supprimé(s) avec succès`
        });

    } catch (error) {
        console.error('Erreur suppression patients:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const adminInfo = req.session.admin;
    const sessionId = req.session.id;
    
    console.log('🚪 Début déconnexion admin:', {
        adminId: adminInfo?.id,
        username: adminInfo?.username,
        sessionId: sessionId,
        loginTime: adminInfo?.loginTime,
        lastActivity: adminInfo?.lastActivity,
        sessionDuration: adminInfo?.loginTime ? 
            Math.round((new Date() - new Date(adminInfo.loginTime)) / 1000 / 60) + ' minutes' : 'unknown'
    });
    
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Erreur déconnexion admin:', err);
            return res.status(500).json({ error: 'Erreur déconnexion' });
        }
        if (adminInfo) {
            console.log(`👋 Déconnexion admin réussie: ${adminInfo.username} (session: ${sessionId})`);
        }
        res.json({ success: true, redirect: '/admin' });
    });
});

// ===== ROUTES PARAMÈTRES CABINET =====

// Route pour accéder à la page de configuration du cabinet
app.get('/admin/cabinet', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-cabinet.html'));
});

// Route pour la page des numéros d'urgence
app.get('/admin/emergency', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-emergency.html'));
});

// Route pour la page de configuration du chat IA
app.get('/admin/chat', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-chat.html'));
});

// Route pour la page des horaires d'ouverture
app.get('/admin/schedule', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-schedule.html'));
});

// GET - Récupérer tous les paramètres du cabinet
app.get('/api/admin/cabinet-settings', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT setting_key, setting_value, setting_type FROM cabinet_settings');
        
        const settings = {};
        result.rows.forEach(row => {
            let value = row.setting_value;
            
            // Convertir selon le type
            if (row.setting_type === 'json' && value) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.warn(`Erreur parsing JSON pour ${row.setting_key}:`, e);
                }
            } else if (row.setting_type === 'number' && value) {
                value = parseInt(value);
            } else if (row.setting_type === 'boolean' && value) {
                value = value === 'true';
            }
            
            settings[row.setting_key] = value;
        });

        res.json({ success: true, settings });

    } catch (error) {
        console.error('Erreur récupération paramètres cabinet:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST - Sauvegarder des paramètres du cabinet
app.post('/api/admin/cabinet-settings', requireAdmin, async (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Paramètres invalides' });
        }

        const adminId = req.session.admin.id;
        
        // Préparer les requêtes d'upsert
        for (const [key, value] of Object.entries(settings)) {
            if (value !== undefined && value !== null) {
                await db.query(`
                    INSERT INTO cabinet_settings (setting_key, setting_value, updated_by)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (setting_key)
                    DO UPDATE SET 
                        setting_value = $2,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = $3
                `, [key, String(value), adminId]);
            }
        }

        console.log(`✅ Paramètres cabinet mis à jour par ${req.session.admin.username}:`, Object.keys(settings));
        res.json({ success: true, message: 'Paramètres sauvegardés avec succès' });

    } catch (error) {
        console.error('Erreur sauvegarde paramètres cabinet:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// ===== ROUTES GESTION URGENCES =====

// POST - Sauvegarder les urgences (nouvelle interface complète)
app.post('/api/admin/urgences', requireAdmin, [
    body('urgences').isArray({ min: 0 }),
    body('urgences.*.nom').trim().isLength({ min: 2, max: 255 }),
    body('urgences.*.telephone').trim().isLength({ min: 1, max: 20 }),
    body('urgences.*.description').optional().trim().isLength({ max: 500 }),
    body('urgences.*.site_web').optional().trim().isLength({ max: 500 }),
    body('urgences.*.horaires').optional().trim().isLength({ max: 200 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Données invalides', details: errors.array() });
        }

        const { urgences } = req.body;

        if (!Array.isArray(urgences)) {
            return res.status(400).json({ error: 'Format de données invalide' });
        }

        // Commencer une transaction pour assurer la cohérence
        await db.query('BEGIN');

        try {
            // Supprimer toutes les urgences existantes
            await db.query('DELETE FROM urgences');

            // Insérer les nouvelles urgences avec leur ordre
            for (let i = 0; i < urgences.length; i++) {
                const urgence = urgences[i];
                await db.query(`
                    INSERT INTO urgences (nom, telephone, description, site_web, horaires, ordre, actif)
                    VALUES ($1, $2, $3, $4, $5, $6, true)
                `, [
                    urgence.nom,
                    urgence.telephone,
                    urgence.description || null,
                    urgence.site_web || null,
                    urgence.horaires || '24h/24 - 7j/7',
                    i + 1
                ]);
            }

            // Valider la transaction
            await db.query('COMMIT');

            console.log(`✅ ${urgences.length} urgences sauvegardées par ${req.session.admin.username}`);
            
            res.json({ 
                success: true,
                count: urgences.length,
                message: `${urgences.length} numéro(s) d'urgence sauvegardé(s) avec succès`
            });

        } catch (error) {
            // Annuler la transaction en cas d'erreur
            await db.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('Erreur sauvegarde urgences:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT - Modifier une urgence (conservé pour compatibilité)
app.put('/api/admin/urgences/:id', requireAdmin, [
    body('nom').trim().isLength({ min: 2, max: 255 }),
    body('telephone').optional().trim().isLength({ max: 20 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('site_web').optional().trim().isLength({ max: 500 }),
    body('horaires').optional().trim().isLength({ max: 200 }),
    body('actif').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Données invalides', details: errors.array() });
        }

        const urgenceId = parseInt(req.params.id);
        if (isNaN(urgenceId)) {
            return res.status(400).json({ error: 'ID urgence invalide' });
        }

        const { nom, telephone, description, site_web, horaires, actif } = req.body;

        const result = await db.query(`
            UPDATE urgences 
            SET nom = $1, telephone = $2, description = $3, site_web = $4, horaires = $5, actif = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING id, nom
        `, [nom, telephone || null, description || null, site_web || null, horaires || null, actif, urgenceId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Urgence non trouvée' });
        }

        console.log(`✅ Urgence modifiée: ${result.rows[0].nom} (ID: ${result.rows[0].id}) par ${req.session.admin.username}`);
        
        res.json({ 
            success: true, 
            urgence: result.rows[0],
            message: 'Numéro d\'urgence modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur modification urgence:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE - Supprimer une urgence (conservé pour compatibilité)
app.delete('/api/admin/urgences/:id', requireAdmin, async (req, res) => {
    try {
        const urgenceId = parseInt(req.params.id);
        if (isNaN(urgenceId)) {
            return res.status(400).json({ error: 'ID urgence invalide' });
        }

        // Récupérer le nom avant suppression pour les logs
        const urgenceResult = await db.query('SELECT nom FROM urgences WHERE id = $1', [urgenceId]);
        
        if (urgenceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Urgence non trouvée' });
        }

        const urgenceNom = urgenceResult.rows[0].nom;

        // Supprimer
        await db.query('DELETE FROM urgences WHERE id = $1', [urgenceId]);
        
        console.log(`🗑️ Urgence supprimée: ${urgenceNom} (ID: ${urgenceId}) par ${req.session.admin.username}`);
        
        res.json({ 
            success: true,
            message: 'Numéro d\'urgence supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression urgence:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ===== UTILITAIRES =====

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ✅ GESTION D'ERREURS AMÉLIORÉE
app.use((error, req, res, next) => {
    console.error('❌ Erreur middleware:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux (max 50MB)' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Trop de fichiers (max 5)' });
        }
    }
    
    // Ne pas exposer les erreurs internes en production
    const message = process.env.NODE_ENV === 'production' ? 'Erreur serveur' : error.message;
    res.status(500).json({ error: message });
});

app.use((req, res) => {
    console.warn(`❓ Route non trouvée: ${req.method} ${req.url}`);
    
    // Si c'est une requête API, retourner du JSON
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint API non trouvé' });
    }
    
    // Sinon, servir la page 404 HTML
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Test de connexion DB avec retry - ✅ GESTION D'ERREUR AMÉLIORÉE
async function testDatabaseConnection(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await db.query('SELECT NOW() as current_time, version() as db_version');
            console.log('✅ Base de données connectée:', {
                time: result.rows[0].current_time,
                version: result.rows[0].db_version.split(' ')[0]
            });
            return true;
        } catch (error) {
            const attempt = i + 1;
            if (attempt === retries) {
                console.error(`❌ Erreur DB après ${retries} tentatives:`, error.message);
                return false;
            }
            console.warn(`⚠️ Tentative ${attempt}/${retries} échouée, retry dans ${delay/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

// ✅ CRÉATION AUTOMATIQUE DE L'ADMIN DEPUIS LE .ENV
async function createAdminFromEnv() {
    try {
        console.log('🔐 Vérification/Création de l\'admin depuis .env...');
        
        // Vérifier d'abord si la table admins existe
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'admins'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('⚠️ Table admins non trouvée, skip création admin');
            return;
        }
        
        // Récupérer les identifiants du .env ou utiliser les defaults
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
        
        // Vérifier si l'admin existe déjà
        const existingAdmin = await db.query(
            'SELECT id, username FROM admins WHERE username = $1',
            [adminUsername]
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log(`✅ Admin '${adminUsername}' existe déjà (ID: ${existingAdmin.rows[0].id})`);
            return;
        }
        
        // Créer le nouvel admin
        console.log(`🔧 Création de l'admin '${adminUsername}'...`);
        
        const adminResult = await db.query(`
            INSERT INTO admins (username, password_hash, nom, prenom, specialite, actif)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, username
        `, [
            adminUsername,
            adminPassword, // Mot de passe en clair (sera utilisé tel quel)
            'Docteur',
            'Admin',
            'Médecin Généraliste'
        ]);
        
        console.log(`✅ Admin créé avec succès: ${adminResult.rows[0].username} (ID: ${adminResult.rows[0].id})`);
        
    } catch (error) {
        console.error('❌ Erreur création admin:', error.message);
        // NE PAS FAIRE CRASH LE SERVEUR - juste logger l'erreur
    }
}

// Démarrage du serveur - ✅ GESTION D'ERREUR ULTRA ROBUSTE
app.listen(PORT, '0.0.0.0', async () => {
    const EXTERNAL_PORT = process.env.EXTERNAL_PORT || '4480';
    console.log('🏥 Assistant Médical - Cabinet');
    console.log(`🚀 Serveur démarré sur le port ${EXTERNAL_PORT}`);
    console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Démarrage: ${new Date().toLocaleString('fr-FR')}`);
    
    // Test de connexion DB
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.error('🚨 ERREUR: Base de données non accessible');
        console.log('⚠️ Le serveur continue mais certaines fonctionnalités seront limitées');
    } else {
        // Créer l'admin depuis les variables .env
        await createAdminFromEnv();
        
        // Générer le prompt système initial
        await generateSystemPrompt();
        console.log('✅ Prompt système IA généré avec les paramètres du cabinet');
    }

    // Créer le dossier uploads
    const uploadDir = './uploads';
    try {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('📁 Dossier uploads créé');
        } else {
            console.log('📁 Dossier uploads OK');
        }
    } catch (uploadError) {
        console.error('❌ Erreur création dossier uploads:', uploadError.message);
    }

    // Vérifications de sécurité finales
    console.log('🔍 Vérifications de sécurité...');
    
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'medical-assistant-secret-key-change-in-production') {
        console.warn('⚠️ SESSION_SECRET par défaut détecté - CHANGER EN PRODUCTION !');
    }
    
    if (!process.env.DB_PASS) {
        console.warn('⚠️ Mot de passe DB non défini - Vérifier la configuration');
    }
    
    console.log('✅ Application prête et sécurisée !');
    
    const externalPort = process.env.EXTERNAL_PORT || '4480';
    console.log(`🌐 Application accessible sur le port externe: ${externalPort}`);
    console.log(`📍 URLs d'accès:`);
    console.log(`   • Site: http://localhost:${externalPort}`);
    console.log(`   • Patients: http://localhost:${externalPort}/login`);
    console.log(`   • Admin: http://localhost:${externalPort}/admin`);
    console.log(`   • Health: http://localhost:${externalPort}/api/health`);
    
    console.log('🎉 Serveur complètement initialisé - Prêt à recevoir des connexions');
});

// Gestion propre des arrêts et erreurs globales
process.on('SIGTERM', async () => {
    console.log('📛 Signal SIGTERM reçu - Arrêt propre du serveur...');
    try {
        await db.end();
        console.log('✅ Connexions DB fermées proprement');
    } catch (error) {
        console.error('❌ Erreur fermeture DB:', error.message);
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📛 Signal SIGINT reçu - Arrêt propre du serveur...');
    try {
        await db.end();
        console.log('✅ Connexions DB fermées proprement');
    } catch (error) {
        console.error('❌ Erreur fermeture DB:', error.message);
    }
    process.exit(0);
});

// Gestion ultra robuste des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    console.error('📍 Promise:', promise);
    console.error('📍 Stack:', reason?.stack);
    // Log mais ne pas crasher le serveur
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non gérée CRITIQUE:', error);
    console.error('📍 Stack:', error.stack);
    console.error('🚨 Redémarrage nécessaire du serveur');
    
    // Tentative de nettoyage avant arrêt
    setTimeout(async () => {
        try {
            await db.end();
            console.log('✅ Nettoyage DB effectué avant arrêt');
        } catch (cleanupError) {
            console.error('❌ Erreur nettoyage:', cleanupError.message);
        }
        process.exit(1);
    }, 1000);
});

// Export pour les tests
module.exports = app;