-- ===== DONNÉES DE TEST - ASSISTANT MÉDICAL =====
-- Ce fichier contient des données fictives pour tester l'application
-- Ces données sont ajoutées automatiquement si LOAD_TEST_DATA=true dans .env

-- ===== INSERTION DES PATIENTS DE TEST =====
-- Supprimez ou modifiez ces données en production
INSERT INTO patients (nom, prenom, date_naissance, telephone, email, actif) VALUES
('MARTIN', 'Sophie', '1985-03-15', '+33 6 12 34 56 78', 'sophie.martin@email.com', true),
('DUBOIS', 'Pierre', '1978-11-22', '+33 6 23 45 67 89', 'pierre.dubois@email.com', true),
('BERNARD', 'Marie', '1992-07-08', '+33 6 34 56 78 90', 'marie.bernard@email.com', true),
('PETIT', 'Jean', '1965-12-03', '+33 6 45 67 89 01', 'jean.petit@email.com', true),
('MOREAU', 'Claire', '1988-09-14', '+33 6 56 78 90 12', 'claire.moreau@email.com', true)
ON CONFLICT (nom, prenom, date_naissance) DO NOTHING;

-- ===== INSERTION DES CONSULTATIONS DE TEST =====
INSERT INTO consultations (patient_id, session_token, conversation_history, statut, created_at) VALUES
(1, 'test_session_sophie_001', '[{"role": "patient", "content": "Bonjour, je voudrais des informations sur les vaccins de voyage", "timestamp": "2025-06-10T14:30:00Z"}, {"role": "assistant", "content": "Bonjour Sophie ! Je serais ravi de vous aider concernant les vaccins de voyage. Puis-je savoir dans quelle région ou quel pays vous comptez voyager ?", "timestamp": "2025-06-10T14:30:15Z"}, {"role": "patient", "content": "Je pars en Thaïlande le mois prochain", "timestamp": "2025-06-10T14:31:00Z"}, {"role": "assistant", "content": "Excellent choix de destination ! Pour la Thaïlande, je recommande de vérifier vos vaccins contre l''hépatite A et B, la fièvre typhoïde, et l''encéphalite japonaise selon la durée de votre séjour. Je vous conseille de prendre rendez-vous avec votre médecin pour un bilan pré-voyage complet.", "timestamp": "2025-06-10T14:31:30Z"}]', 'completed', '2025-06-10 14:30:00'),
(2, 'test_session_pierre_002', '[{"role": "patient", "content": "Bonsoir, j''ai des douleurs dans le dos depuis 3 jours", "timestamp": "2025-06-09T19:45:00Z"}, {"role": "assistant", "content": "Bonsoir Pierre. Je comprends que les douleurs dorsales puissent être très gênantes. Pouvez-vous me décrire plus précisément où se situe la douleur et si elle irradie quelque part ?", "timestamp": "2025-06-09T19:45:20Z"}, {"role": "patient", "content": "C''est au niveau des lombaires, ça tire jusque dans la jambe droite", "timestamp": "2025-06-09T19:46:00Z"}]', 'active', '2025-06-09 19:45:00'),
(3, 'test_session_marie_003', '[{"role": "patient", "content": "Bonjour, je voudrais savoir si je peux prendre de l''ibuprofène en étant enceinte", "timestamp": "2025-06-11T09:15:00Z"}, {"role": "assistant", "content": "Bonjour Marie ! C''est une excellente question concernant la sécurité pendant la grossesse. L''ibuprofène n''est généralement pas recommandé pendant la grossesse, surtout après le premier trimestre. À quel stade de grossesse êtes-vous ?", "timestamp": "2025-06-11T09:15:25Z"}]', 'active', '2025-06-11 09:15:00'),

-- Consultations supplémentaires pour Jean Petit
(4, 'jean_session_sleep_001', '[
  {
    "role": "patient", 
    "content": "Bonjour, j''ai des problèmes pour dormir depuis quelques semaines", 
    "timestamp": "2025-06-13T21:30:00Z"
  },
  {
    "role": "assistant", 
    "content": "Bonsoir Jean ! Je comprends que les troubles du sommeil peuvent être très préoccupants. Depuis combien de temps exactement avez-vous ces difficultés à dormir ?", 
    "timestamp": "2025-06-13T21:30:15Z"
  },
  {
    "role": "patient", 
    "content": "Ça fait environ 3 semaines. J''ai du mal à m''endormir et je me réveille plusieurs fois dans la nuit", 
    "timestamp": "2025-06-13T21:31:00Z"
  },
  {
    "role": "assistant", 
    "content": "Je vois. Ces troubles peuvent avoir plusieurs causes. Avez-vous remarqué des changements dans votre routine quotidienne, votre stress ou votre alimentation récemment ?", 
    "timestamp": "2025-06-13T21:31:30Z"
  },
  {
    "role": "patient", 
    "content": "Effectivement, j''ai eu quelques soucis au travail et je bois plus de café qu''avant", 
    "timestamp": "2025-06-13T21:32:15Z"
  },
  {
    "role": "assistant", 
    "content": "C''est très probable que le stress professionnel et l''augmentation de caféine influencent votre sommeil. Je vous recommande de limiter le café après 14h et d''essayer des techniques de relaxation avant le coucher. Si cela persiste, n''hésitez pas à en parler à votre médecin qui pourra vous conseiller plus spécifiquement.", 
    "timestamp": "2025-06-13T21:32:45Z"
  }
]', 'completed', '2025-06-13 21:30:00'),

(4, 'jean_session_sport_002', '[
  {
    "role": "patient", 
    "content": "Bonne journée ! J''aimerais des conseils sur l''activité physique après 55 ans", 
    "timestamp": "2025-06-14T10:15:00Z"
  },
  {
    "role": "assistant", 
    "content": "Bonjour Jean ! C''est formidable que vous souhaitiez rester actif. L''activité physique est excellente à tout âge. Pratiquez-vous déjà une activité sportive ou souhaitez-vous commencer quelque chose de nouveau ?", 
    "timestamp": "2025-06-14T10:15:20Z"
  },
  {
    "role": "patient", 
    "content": "Je faisais du vélo mais j''ai arrêté il y a 2 ans. J''aimerais reprendre doucement", 
    "timestamp": "2025-06-14T10:16:00Z"
  },
  {
    "role": "assistant", 
    "content": "Excellent choix ! Le vélo est un sport très adapté et doux pour les articulations. Je recommande de reprendre progressivement : commencez par 20-30 minutes 2-3 fois par semaine, puis augmentez graduellement. Avec votre traitement pour l''hypertension, l''activité physique régulière sera très bénéfique.", 
    "timestamp": "2025-06-14T10:16:35Z"
  },
  {
    "role": "patient", 
    "content": "Parfait ! Y a-t-il des précautions particulières à prendre avec mes médicaments ?", 
    "timestamp": "2025-06-14T10:17:10Z"
  },
  {
    "role": "assistant", 
    "content": "Avec votre traitement antihypertenseur, veillez à bien vous hydrater, évitez les efforts intenses par forte chaleur, et contrôlez régulièrement votre tension. Votre médecin pourra vous donner des conseils plus précis lors de votre prochain rendez-vous.", 
    "timestamp": "2025-06-14T10:17:45Z"
  }
]', 'completed', '2025-06-14 10:15:00')

ON CONFLICT DO NOTHING;

-- ===== INSERTION DES MESSAGES PRIVÉS DE TEST =====
INSERT INTO messages_prives (patient_id, consultation_id, sujet, message, niveau_urgence, fichiers_joints, lu_par_docteur, created_at) VALUES
(1, 1, 'Résultats prise de sang', 'Bonjour Docteur,

J''ai reçu mes résultats de prise de sang que vous m''aviez prescrite. Tout semble normal mais j''aimerais votre avis sur le taux de fer qui me semble un peu bas.

Pouvez-vous me rappeler quand vous aurez un moment ?

Merci beaucoup.
Sophie', 'normale', '{"resultats_prise_sang_sophie.pdf"}', false, '2025-06-10 16:45:00'),

(2, 2, 'URGENT - Douleurs persistantes', 'Docteur,

Mes douleurs lombaires se sont aggravées cette nuit. J''ai maintenant du mal à me lever du lit et la douleur descend jusqu''au pied.

J''ai pris du paracétamol mais ça ne fait rien. Dois-je aller aux urgences ou puis-je attendre notre RDV de demain ?

Pierre Dubois
+33 6 23 45 67 89', 'elevee', '{}', false, '2025-06-11 06:30:00'),

(3, 3, 'Question sur traitement grossesse', 'Bonjour Docteur,

Suite à notre discussion sur le chat, j''aimerais avoir une ordonnance pour un antalgique compatible avec ma grossesse (je suis à 18 SA).

J''ai aussi quelques questions sur l''alimentation pendant la grossesse.

Pouvez-vous me rappeler ou me donner un RDV cette semaine ?

Marie Bernard', 'normale', '{}', true, '2025-06-11 10:00:00'),

(4, NULL, 'Renouvellement ordonnance', 'Bonjour,

Je dois renouveler mon traitement pour l''hypertension. Mon ordonnance se termine la semaine prochaine.

Pouvez-vous me faire une ordonnance ou dois-je prendre RDV ?

Mon dernier bilan était bon il y a 2 mois.

Cordialement,
Jean Petit', 'faible', '{"derniere_ordonnance_jean.jpg"}', false, '2025-06-09 14:20:00'),

(5, NULL, 'Certificat médical sport', 'Bonjour Docteur,

J''ai besoin d''un certificat médical pour reprendre le sport (fitness et course à pied).

Je n''ai pas eu de problème de santé particulier cette année.

Quand pourriez-vous me recevoir ?

Merci,
Claire Moreau', 'faible', '{}', false, '2025-06-08 11:15:00'),

-- Messages supplémentaires pour les tests
(1, NULL, 'Effets secondaires médicament', 'Bonjour Docteur,

Depuis que j''ai commencé le nouveau traitement que vous m''avez prescrit, j''ai des nausées le matin et des vertiges.

Est-ce normal ? Dois-je arrêter le traitement ?

J''ai pris une photo de l''ordonnance pour vous rappeler de quel médicament il s''agit.

Sophie Martin', 'normale', '{"ordonnance_photo_sophie.jpg", "symptomes_journal_sophie.pdf"}', false, '2025-06-12 08:30:00'),

(4, NULL, 'Douleur thoracique ce matin', 'Docteur,

Ce matin vers 7h, j''ai eu une douleur dans la poitrine qui a duré environ 10 minutes.

Ce n''était pas très intense mais ça m''a inquiété vu mon hypertension.

Ça va mieux maintenant mais je préfère vous prévenir.

Dois-je venir vous voir rapidement ou attendre notre prochain rendez-vous ?

Jean Petit
+33 6 45 67 89 01', 'elevee', '{}', false, '2025-06-16 08:45:00')

ON CONFLICT DO NOTHING;

-- ===== INSERTION DES FICHIERS DE TEST =====
INSERT INTO fichiers (consultation_id, nom_original, nom_stockage, type_mime, taille_bytes, uploaded_at) VALUES
-- Fichiers des messages originaux
(1, 'resultats_prise_sang_sophie.pdf', 'uploads/2025/06/10/sophie_resultats_1718896500.pdf', 'application/pdf', 245760, '2025-06-10 16:45:00'),
(2, 'radio_dos_pierre.jpg', 'uploads/2025/06/09/pierre_radio_1718815200.jpg', 'image/jpeg', 1048576, '2025-06-09 20:00:00'),
(NULL, 'derniere_ordonnance_jean.jpg', 'uploads/2025/06/09/jean_ordonnance_1718797200.jpg', 'image/jpeg', 512000, '2025-06-09 14:20:00'),

-- Fichiers des nouveaux messages
(NULL, 'ordonnance_photo_sophie.jpg', 'uploads/2025/06/12/sophie_ordonnance_1718974200.jpg', 'image/jpeg', 421000, '2025-06-12 08:30:00'),
(NULL, 'symptomes_journal_sophie.pdf', 'uploads/2025/06/12/sophie_journal_1718974200.pdf', 'application/pdf', 156000, '2025-06-12 08:30:00')
ON CONFLICT DO NOTHING;

-- ===== INSERTION DU SUIVI CHAT =====
INSERT INTO chat_usage (patient_id, consultation_id, message_count, usage_date, created_at) VALUES
(1, 1, 4, '2025-06-10', '2025-06-10 14:30:00'),
(2, 2, 3, '2025-06-09', '2025-06-09 19:45:00'),
(3, 3, 2, '2025-06-11', '2025-06-11 09:15:00'),
(1, 1, 2, '2025-06-09', '2025-06-09 16:20:00'),
(4, NULL, 1, '2025-06-08', '2025-06-08 10:30:00'),
-- Suivi pour les nouveaux messages
(1, NULL, 3, '2025-06-12', '2025-06-12 08:30:00'),
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_sleep_001'), 6, '2025-06-13', '2025-06-13 21:30:00'),
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_sport_002'), 6, '2025-06-14', '2025-06-14 10:15:00'),
(4, NULL, 2, '2025-06-16', '2025-06-16 09:00:00')
ON CONFLICT (patient_id, usage_date) DO NOTHING;