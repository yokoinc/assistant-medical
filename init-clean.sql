-- ===== ASSISTANT MÉDICAL - BASE DE DONNÉES VIERGE =====
-- Configuration anonyme pour medical_assistant database avec medical_user
-- Personnalisez toutes les informations via l'interface admin (/admin/parameters)

-- Création de la base de données complète pour l'assistant médical
-- Version 2.0 avec nouveau format des horaires

-- ===== CRÉATION DES TABLES =====

-- Table des utilisateurs administrateurs (médecins)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    specialite VARCHAR(100),
    email VARCHAR(255),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Table des patients autorisés
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour l'authentification rapide
    UNIQUE(nom, prenom, date_naissance)
);

-- Table des sessions/consultations
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    session_token VARCHAR(255) UNIQUE,
    conversation_history JSONB DEFAULT '[]',
    fichiers_uploades TEXT[],
    statut VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Table des messages privés pour le médecin
CREATE TABLE IF NOT EXISTS messages_prives (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    consultation_id INTEGER REFERENCES consultations(id),
    sujet VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    niveau_urgence VARCHAR(20) DEFAULT 'normale',
    fichiers_joints TEXT[],
    lu_par_docteur BOOLEAN DEFAULT false,
    reponse_docteur TEXT,
    date_reponse TIMESTAMP,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fichiers uploadés
CREATE TABLE IF NOT EXISTS fichiers (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER REFERENCES consultations(id),
    nom_original VARCHAR(255) NOT NULL,
    nom_stockage VARCHAR(255) NOT NULL,
    type_mime VARCHAR(100),
    taille_bytes INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des numéros d'urgence et de garde
CREATE TABLE IF NOT EXISTS urgences (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    description TEXT,
    site_web TEXT,
    horaires TEXT DEFAULT '24h/24 - 7j/7',
    ordre INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions admin (optionnel, pour un suivi avancé)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    session_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '8 hours'),
    actif BOOLEAN DEFAULT true
);

-- Table de suivi des utilisations du chat IA (pour limiter l'usage)
CREATE TABLE IF NOT EXISTS chat_usage (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    consultation_id INTEGER REFERENCES consultations(id),
    message_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index unique pour éviter les doublons par patient/jour
    UNIQUE(patient_id, usage_date)
);

-- Table des paramètres du cabinet médical
CREATE TABLE IF NOT EXISTS cabinet_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, json, number, boolean
    description TEXT,
    category VARCHAR(50) DEFAULT 'general', -- general, contact, horaires, urgences
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admins(id)
);

-- ===== INSERTION DES DONNÉES DE BASE =====

-- Insertion des numéros d'urgence de base (personnalisez selon votre région)
INSERT INTO urgences (nom, telephone, description, site_web, horaires, ordre) VALUES
('SAMU', '15', 'Urgences médicales', NULL, '24h/24 - 7j/7', 1),
('Pompiers', '18', 'Secours d''urgence', NULL, '24h/24 - 7j/7', 2),
('Police/Gendarmerie', '17', 'Urgences sécuritaires', NULL, '24h/24 - 7j/7', 3),
('Urgence Européenne', '112', 'Toutes urgences depuis un mobile', NULL, '24h/24 - 7j/7', 4),
('Hôpital Local - Urgences', '+33 X XX XX XX XX', 'Service d''urgences hospitalier', 'https://www.hopital-local.fr/urgences', '24h/24 - 7j/7', 5),
('Médecin de Garde', '+33 3237', 'Service de permanence des soins', 'https://www.3237.fr', 'Weekend uniquement', 6),
('Pharmacie de Garde', '+33 3237', 'Pharmacie de permanence', 'https://www.3237.fr', 'Dimanche uniquement', 7),
('SOS Médecins Local', '+33 X XX XX XX XX', 'Médecins à domicile', 'https://www.sosmedecins-local.fr', '24h/24 - 7j/7', 8),
('Cabinet Médical - Urgences', '+33 X XX XX XX XX', 'Urgences du cabinet', 'https://www.doctolib.fr/', 'Lundi au Vendredi', 9),
('Dentiste de Garde', '+33 X XX XX XX XX', 'Urgences dentaires', 'https://www.ordre-chirurgiens-dentistes.fr/garde', 'Dimanche uniquement', 10),
('Vétérinaire d''Urgence', '+33 X XX XX XX XX', 'Urgences vétérinaires', 'https://www.veterinaire-urgence-local.fr', 'Nuit uniquement (20h-8h)', 11),
('Centre Antipoison', '+33 1 40 05 48 48', 'Intoxications et empoisonnements', 'https://www.centres-antipoison.net', '24h/24 - 7j/7', 12)
ON CONFLICT DO NOTHING;

-- ===== INSERTION DES PARAMÈTRES PAR DÉFAUT =====

INSERT INTO cabinet_settings (setting_key, setting_value, setting_type, description, category) VALUES
-- Informations générales du cabinet (à personnaliser via l'interface admin)
('cabinet_nom_docteur', 'Dr [Votre Nom]', 'string', 'Nom complet du médecin', 'general'),
('cabinet_specialite', 'Médecine Générale', 'string', 'Spécialité médicale', 'general'),
('cabinet_ville', '[Votre Ville]', 'string', 'Ville d''exercice', 'general'),

-- Contact (à personnaliser via l'interface admin)
('cabinet_telephone', '+33 X XX XX XX XX', 'string', 'Numéro de téléphone du cabinet', 'contact'),
('cabinet_email', 'contact@votre-cabinet.fr', 'string', 'Email du cabinet', 'contact'),
('cabinet_adresse', '[Adresse de votre cabinet]
[Code postal] [Ville]', 'string', 'Adresse complète du cabinet', 'contact'),
('cabinet_site_web', 'https://www.doctolib.fr/', 'string', 'Site de prise de rendez-vous', 'contact'),

-- Horaires par défaut (personnalisez via l'interface admin)
('cabinet_horaires', '{"Lundi": {"ferme": false, "journee_continue": false, "matin_debut": {"heure": "08", "minute": "30"}, "matin_fin": {"heure": "12", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "18", "minute": "30"}}, "Mardi": {"ferme": false, "journee_continue": false, "matin_debut": {"heure": "08", "minute": "30"}, "matin_fin": {"heure": "12", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "18", "minute": "30"}}, "Mercredi": {"ferme": false, "journee_continue": true, "matin_debut": {"heure": "08", "minute": "30"}, "matin_fin": {"heure": "17", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "18", "minute": "30"}}, "Jeudi": {"ferme": false, "journee_continue": false, "matin_debut": {"heure": "08", "minute": "30"}, "matin_fin": {"heure": "12", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "18", "minute": "30"}}, "Vendredi": {"ferme": false, "journee_continue": false, "matin_debut": {"heure": "08", "minute": "30"}, "matin_fin": {"heure": "12", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "17", "minute": "00"}}, "Samedi": {"ferme": false, "journee_continue": true, "matin_debut": {"heure": "09", "minute": "00"}, "matin_fin": {"heure": "13", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "18", "minute": "30"}}, "Dimanche": {"ferme": true, "journee_continue": false, "matin_debut": {"heure": "08", "minute": "00"}, "matin_fin": {"heure": "12", "minute": "00"}, "aprem_debut": {"heure": "14", "minute": "00"}, "aprem_fin": {"heure": "19", "minute": "00"}}}', 'json', 'Horaires d''ouverture par jour (nouveau format)', 'horaires'),

-- Informations pratiques (à personnaliser)
('cabinet_parking', 'Parking disponible', 'string', 'Informations sur le parking', 'general'),
('cabinet_acces', 'Accessible PMR', 'string', 'Informations d''accessibilité', 'general'),
('cabinet_rdv_mode', 'Sur rendez-vous via téléphone ou Doctolib', 'string', 'Mode de prise de rendez-vous', 'general'),

-- Paramètres système (modifiables via l'interface)
('assistant_nom', 'Assistant Médical', 'string', 'Nom de l''assistant IA', 'general'),
('chat_limite_horaire', '25', 'number', 'Limite de messages chat par heure', 'general'),
('chat_limite_quotidienne', '50', 'number', 'Limite de messages chat par jour', 'general'),
('chat_longueur_max', '400', 'number', 'Longueur maximale d''un message chat', 'general')

ON CONFLICT (setting_key) DO NOTHING;

-- ===== CRÉATION DE L'ADMIN PAR DÉFAUT =====
-- L'admin sera créé automatiquement par Node.js depuis les variables du .env
-- Configurez ADMIN_USERNAME et ADMIN_PASSWORD dans votre fichier .env

-- Fonction pour mettre à jour le timestamp automatiquement
CREATE OR REPLACE FUNCTION update_cabinet_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER trigger_update_cabinet_settings_timestamp
    BEFORE UPDATE ON cabinet_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_cabinet_settings_timestamp();

-- ===== CRÉATION DES INDEX =====

CREATE INDEX IF NOT EXISTS idx_patients_auth ON patients(nom, prenom, date_naissance);
CREATE INDEX IF NOT EXISTS idx_consultations_token ON consultations(session_token);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_consultation ON fichiers(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages_prives(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_urgence ON messages_prives(niveau_urgence, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_non_lus ON messages_prives(lu_par_docteur, created_at);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_usage_patient_date ON chat_usage(patient_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_chat_usage_date ON chat_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_cabinet_settings_key ON cabinet_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_cabinet_settings_category ON cabinet_settings(category);

-- ===== NOTES IMPORTANTES =====
-- 1. Configuration harmonisée avec docker-compose.yml et .env
--    - Base de données: medical_assistant
--    - Utilisateur: medical_user  
--    - Mot de passe: défini dans .env (DB_PASS)
-- 2. Identifiants admin configurés dans .env (ADMIN_USERNAME/ADMIN_PASSWORD)
-- 3. **PERSONNALISEZ TOUTES LES INFORMATIONS** via l'interface admin (/admin/parameters)
-- 4. Adaptez les numéros d'urgence à votre région
-- 5. Cette base est VIERGE - aucune donnée patient fictive
-- 6. Le nouveau format des horaires supporte matin/après-midi et journées continues
-- 7. Accès web: http://localhost:4480 (modifiable via EXTERNAL_PORT dans .env)
-- 8. Pour des données de test: ajoutez LOAD_TEST_DATA=true dans .env