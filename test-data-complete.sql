-- ===== DONNÉES DE TEST COMPLÈTES - ASSISTANT MÉDICAL =====
-- Ce fichier contient toutes les données fictives pour tester l'application
-- Chargé automatiquement si LOAD_TEST_DATA=true dans .env
-- ⚠️ À SUPPRIMER EN PRODUCTION ⚠️

-- ===== INSERTION DES PATIENTS DE TEST =====
INSERT INTO patients (nom, prenom, date_naissance, telephone, email, actif) VALUES
('MARTIN', 'Sophie', '1985-03-15', '+33 6 12 34 56 78', 'sophie.martin@email.com', true),
('DUBOIS', 'Pierre', '1978-11-22', '+33 6 23 45 67 89', 'pierre.dubois@email.com', true),
('BERNARD', 'Marie', '1992-07-08', '+33 6 34 56 78 90', 'marie.bernard@email.com', true),
('PETIT', 'Jean', '1965-12-03', '+33 6 45 67 89 01', 'jean.petit@email.com', true),
('MOREAU', 'Claire', '1988-09-14', '+33 6 56 78 90 12', 'claire.moreau@email.com', true)
ON CONFLICT (nom, prenom, date_naissance) DO NOTHING;

-- ===== INSERTION DES CONSULTATIONS DE TEST =====
INSERT INTO consultations (patient_id, session_token, conversation_history, statut, created_at) VALUES
-- Consultations Sophie Martin
(1, 'test_session_sophie_001', '[{"role": "patient", "content": "Bonjour, je voudrais des informations sur les vaccins de voyage", "timestamp": "2025-06-10T14:30:00Z"}, {"role": "assistant", "content": "Bonjour Sophie ! Je serais ravi de vous aider concernant les vaccins de voyage. Puis-je savoir dans quelle région ou quel pays vous comptez voyager ?", "timestamp": "2025-06-10T14:30:15Z"}, {"role": "patient", "content": "Je pars en Thaïlande le mois prochain", "timestamp": "2025-06-10T14:31:00Z"}, {"role": "assistant", "content": "Excellent choix de destination ! Pour la Thaïlande, je recommande de vérifier vos vaccins contre l''hépatite A et B, la fièvre typhoïde, et l''encéphalite japonaise selon la durée de votre séjour. Je vous conseille de prendre rendez-vous avec votre médecin pour un bilan pré-voyage complet.", "timestamp": "2025-06-10T14:31:30Z"}]', 'completed', '2025-06-10 14:30:00'),

-- Consultations Pierre Dubois  
(2, 'test_session_pierre_002', '[{"role": "patient", "content": "Bonsoir, j''ai des douleurs dans le dos depuis 3 jours", "timestamp": "2025-06-09T19:45:00Z"}, {"role": "assistant", "content": "Bonsoir Pierre. Je comprends que les douleurs dorsales puissent être très gênantes. Pouvez-vous me décrire plus précisément où se situe la douleur et si elle irradie quelque part ?", "timestamp": "2025-06-09T19:45:20Z"}, {"role": "patient", "content": "C''est au niveau des lombaires, ça tire jusque dans la jambe droite", "timestamp": "2025-06-09T19:46:00Z"}]', 'active', '2025-06-09 19:45:00'),

-- Consultations Marie Bernard
(3, 'test_session_marie_003', '[{"role": "patient", "content": "Bonjour, je voudrais savoir si je peux prendre de l''ibuprofène en étant enceinte", "timestamp": "2025-06-11T09:15:00Z"}, {"role": "assistant", "content": "Bonjour Marie ! C''est une excellente question concernant la sécurité pendant la grossesse. L''ibuprofène n''est généralement pas recommandé pendant la grossesse, surtout après le premier trimestre. À quel stade de grossesse êtes-vous ?", "timestamp": "2025-06-11T09:15:25Z"}]', 'active', '2025-06-11 09:15:00'),

-- Consultations Jean Petit (multiples sessions)
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
]', 'completed', '2025-06-14 10:15:00'),

(4, 'jean_session_nutrition_003', '[
  {
    "role": "patient", 
    "content": "Bonjour, j''ai une question sur mon régime alimentaire", 
    "timestamp": "2025-06-15T14:45:00Z"
  },
  {
    "role": "assistant", 
    "content": "Bonjour Jean ! Je suis là pour vous aider avec vos questions nutritionnelles. De quoi souhaitez-vous parler spécifiquement ?", 
    "timestamp": "2025-06-15T14:45:15Z"
  },
  {
    "role": "patient", 
    "content": "Je voudrais savoir quels aliments éviter ou privilégier pour ma tension artérielle", 
    "timestamp": "2025-06-15T14:46:00Z"
  },
  {
    "role": "assistant", 
    "content": "Excellente question ! Pour l''hypertension, je recommande de réduire le sel, privilégier les fruits et légumes frais, les poissons gras, les céréales complètes. Limitez la charcuterie, les plats préparés et l''alcool. Le régime méditerranéen est particulièrement adapté.", 
    "timestamp": "2025-06-15T14:46:40Z"
  },
  {
    "role": "patient", 
    "content": "Et pour le café ? Je sais que j''en bois trop...", 
    "timestamp": "2025-06-15T14:47:15Z"
  },
  {
    "role": "assistant", 
    "content": "Le café avec modération (2-3 tasses par jour maximum) n''est généralement pas problématique pour la tension. Mais si vous en buvez beaucoup, une réduction progressive serait bénéfique. Cela aidera aussi pour votre sommeil dont nous avons parlé récemment !", 
    "timestamp": "2025-06-15T14:47:50Z"
  }
]', 'completed', '2025-06-15 14:45:00'),

(4, 'jean_session_medications_004', '[
  {
    "role": "patient", 
    "content": "Bonjour, j''ai une question sur les interactions médicamenteuses", 
    "timestamp": "2025-06-13T16:20:00Z"
  },
  {
    "role": "assistant", 
    "content": "Bonjour Jean ! Les interactions médicamenteuses sont un sujet important. De quoi souhaitez-vous parler exactement ?", 
    "timestamp": "2025-06-13T16:20:10Z"
  },
  {
    "role": "patient", 
    "content": "Mon pharmacien m''a dit de faire attention avec certains médicaments en vente libre vu mon traitement pour l''hypertension", 
    "timestamp": "2025-06-13T16:20:45Z"
  },
  {
    "role": "assistant", 
    "content": "Votre pharmacien a raison d''être prudent. Certains médicaments en vente libre peuvent effectivement interagir avec les antihypertenseurs. Quels médicaments vous préoccupent en particulier ?", 
    "timestamp": "2025-06-13T16:21:00Z"
  },
  {
    "role": "patient", 
    "content": "Surtout l''ibuprofène pour les maux de tête, et les médicaments contre le rhume", 
    "timestamp": "2025-06-13T16:21:30Z"
  },
  {
    "role": "assistant", 
    "content": "Excellente question ! L''ibuprofène peut effectivement réduire l''efficacité de votre traitement antihypertenseur et retenir le sodium. Préférez le paracétamol pour les maux de tête. Pour les médicaments contre le rhume, évitez ceux contenant de la pseudoéphédrine qui peut augmenter la tension. Demandez toujours conseil à votre pharmacien en mentionnant votre traitement.", 
    "timestamp": "2025-06-13T16:22:00Z"
  }
]', 'completed', '2025-06-13 16:20:00'),

-- Consultations Claire Moreau
(5, 'claire_session_allergie_001', '[
  {
    "role": "patient", 
    "content": "Bonsoir, je pense avoir fait une réaction allergique", 
    "timestamp": "2025-06-12T21:15:00Z"
  },
  {
    "role": "assistant", 
    "content": "Bonsoir Claire ! Les réactions allergiques peuvent être préoccupantes. Pouvez-vous me décrire vos symptômes et ce qui a pu les déclencher ?", 
    "timestamp": "2025-06-12T21:15:15Z"
  },
  {
    "role": "patient", 
    "content": "J''ai des plaques rouges et des démangeaisons après avoir mangé des fruits de mer", 
    "timestamp": "2025-06-12T21:15:45Z"
  },
  {
    "role": "assistant", 
    "content": "Les fruits de mer sont effectivement un allergène courant. Avez-vous des difficultés respiratoires, un gonflement du visage ou de la gorge ? Si oui, il faut consulter en urgence.", 
    "timestamp": "2025-06-12T21:16:00Z"
  },
  {
    "role": "patient", 
    "content": "Non, juste les plaques et démangeaisons. J''ai pris un antihistaminique", 
    "timestamp": "2025-06-12T21:16:30Z"
  },
  {
    "role": "assistant", 
    "content": "C''est une bonne réaction. Continuez à surveiller vos symptômes. Si ils s''aggravent ou si vous développez des troubles respiratoires, consultez immédiatement. Pour l''avenir, évitez les fruits de mer et consultez votre médecin pour des tests d''allergie.", 
    "timestamp": "2025-06-12T21:17:00Z"
  }
]', 'completed', '2025-06-12 21:15:00')

ON CONFLICT DO NOTHING;

-- ===== INSERTION DES MESSAGES PRIVÉS DE TEST =====
INSERT INTO messages_prives (patient_id, consultation_id, sujet, message, niveau_urgence, fichiers_joints, lu_par_docteur, created_at) VALUES
-- Messages Sophie Martin
(1, 1, 'Résultats prise de sang', 'Bonjour Docteur,

J''ai reçu mes résultats de prise de sang que vous m''aviez prescrite. Tout semble normal mais j''aimerais votre avis sur le taux de fer qui me semble un peu bas.

Pouvez-vous me rappeler quand vous aurez un moment ?

Merci beaucoup.
Sophie', 'normale', '{"resultats_prise_sang_sophie.pdf"}', false, '2025-06-10 16:45:00'),

(1, NULL, 'Effets secondaires médicament', 'Bonjour Docteur,

Depuis que j''ai commencé le nouveau traitement que vous m''avez prescrit, j''ai des nausées le matin et des vertiges.

Est-ce normal ? Dois-je arrêter le traitement ?

J''ai pris une photo de l''ordonnance pour vous rappeler de quel médicament il s''agit.

Sophie Martin', 'normale', '{"ordonnance_photo_sophie.jpg", "symptomes_journal_sophie.pdf"}', false, '2025-06-12 08:30:00'),

(1, NULL, 'Vaccination voyage - Résolu', 'Bonjour,

Merci pour les conseils sur les vaccins pour la Thaïlande.

J''ai pris rendez-vous au centre de vaccination internationale.

Tout est en ordre pour mon voyage !

Sophie', 'faible', '{}', true, '2025-06-05 10:00:00'),

-- Messages Pierre Dubois
(2, 2, 'URGENT - Douleurs persistantes', 'Docteur,

Mes douleurs lombaires se sont aggravées cette nuit. J''ai maintenant du mal à me lever du lit et la douleur descend jusqu''au pied.

J''ai pris du paracétamol mais ça ne fait rien. Dois-je aller aux urgences ou puis-je attendre notre RDV de demain ?

Pierre Dubois
+33 6 23 45 67 89', 'elevee', '{}', false, '2025-06-11 06:30:00'),

(2, NULL, 'Suivi kinésithérapie', 'Docteur,

Mon kinésithérapeute me demande un certificat médical pour prolonger mes séances de rééducation du dos.

Mes douleurs se sont améliorées mais il pense que j''ai encore besoin de 10 séances.

Pouvez-vous me faire ce certificat ?

Pierre', 'faible', '{}', true, '2025-06-12 14:20:00'),

-- Messages Marie Bernard  
(3, 3, 'Question sur traitement grossesse', 'Bonjour Docteur,

Suite à notre discussion sur le chat, j''aimerais avoir une ordonnance pour un antalgique compatible avec ma grossesse (je suis à 18 SA).

J''ai aussi quelques questions sur l''alimentation pendant la grossesse.

Pouvez-vous me rappeler ou me donner un RDV cette semaine ?

Marie Bernard', 'normale', '{}', true, '2025-06-11 10:00:00'),

(3, NULL, 'Echographie grossesse - Questions', 'Bonjour Docteur,

J''ai passé mon échographie du 2e trimestre hier. Tout va bien pour le bébé !

J''ai quelques questions sur les résultats et j''aimerais vous montrer le compte-rendu.

Quand puis-je passer vous voir ?

Marie', 'normale', '{"echographie_2eme_trimestre.pdf", "resultats_laboratoire_marie.pdf"}', false, '2025-06-12 16:45:00'),

(3, NULL, 'Résultats analyse urine - OK', 'Docteur,

Les résultats de l''analyse d''urine que vous m''aviez prescrite sont normaux.

Merci pour le suivi de ma grossesse.

Marie', 'faible', '{"analyse_urine_marie.pdf"}', true, '2025-06-07 15:30:00'),

-- Messages Jean Petit (nombreux pour les tests)
(4, NULL, 'Renouvellement ordonnance', 'Bonjour,

Je dois renouveler mon traitement pour l''hypertension. Mon ordonnance se termine la semaine prochaine.

Pouvez-vous me faire une ordonnance ou dois-je prendre RDV ?

Mon dernier bilan était bon il y a 2 mois.

Cordialement,
Jean Petit', 'faible', '{"derniere_ordonnance_jean.jpg"}', false, '2025-06-09 14:20:00'),

(4, NULL, 'Problèmes de sommeil persistants', 'Bonjour Docteur,

J''ai des difficultés à dormir depuis quelques semaines maintenant. Je me réveille plusieurs fois dans la nuit et j''ai du mal à me rendormir.

J''ai discuté avec l''assistant médical qui m''a donné quelques conseils, notamment de réduire le café et le stress.

Cela semble un peu s''améliorer mais j''aimerais votre avis.

Dois-je prendre rendez-vous ou cela peut-il attendre ?

Merci,
Jean Petit', 'normale', '{}', false, '2025-06-14 08:30:00'),

(4, NULL, 'Reprise du sport - Demande certificat', 'Docteur,

J''aimerais reprendre le vélo après 2 ans d''arrêt. Je vais commencer doucement comme conseillé par l''assistant.

Pourriez-vous me faire un certificat médical pour reprendre une activité physique régulière ?

J''ai 59 ans et je prends un traitement pour l''hypertension.

Merci d''avance.

Jean Petit
+33 6 45 67 89 01', 'faible', '{}', false, '2025-06-14 15:45:00'),

(4, NULL, 'Conseils nutritionnels - Suivi', 'Bonjour Docteur,

J''ai commencé à suivre les conseils nutritionnels que j''ai reçus via le chat médical.

J''ai réduit ma consommation de sel et de café, et j''ai acheté un livre sur le régime méditerranéen.

Mes relevés de tension des derniers jours semblent un peu meilleurs.

Dois-je continuer ainsi ou faut-il ajuster le traitement ?

Cordialement,
Jean', 'normale', '{"relevés_tension_juin_jean.pdf"}', false, '2025-06-15 18:20:00'),

(4, NULL, 'Douleur thoracique ce matin', 'Docteur,

Ce matin vers 7h, j''ai eu une douleur dans la poitrine qui a duré environ 10 minutes.

Ce n''était pas très intense mais ça m''a inquiété vu mon hypertension.

Ça va mieux maintenant mais je préfère vous prévenir.

Dois-je venir vous voir rapidement ou attendre notre prochain rendez-vous ?

Jean Petit
+33 6 45 67 89 01', 'elevee', '{}', false, '2025-06-16 08:45:00'),

(4, NULL, 'Question sur interactions médicamenteuses', 'Bonjour Docteur,

Mon pharmacien m''a dit qu''il fallait faire attention avec certains médicaments en vente libre quand on prend des antihypertenseurs.

Puis-je prendre de l''ibuprofène en cas de mal de tête ou dois-je éviter ?

Et qu''en est-il des médicaments contre le rhume ?

Merci pour vos conseils.

Jean Petit', 'normale', '{}', false, '2025-06-13 16:20:00'),

(4, NULL, 'Surveillance tension - Relevés hebdomadaires', 'Docteur,

Voici mes relevés de tension de cette semaine comme convenu.

Je note une légère amélioration depuis que j''ai réduit le sel.

Les chiffres du matin restent un peu élevés.

Faut-il modifier quelque chose ?

Jean', 'normale', '{"tension_semaine_25_jean.pdf", "carnet_alimentaire_jean.jpg"}', false, '2025-06-12 11:30:00'),

(4, NULL, 'Résultats bilan cardiologique - OK', 'Bonjour Docteur,

J''ai reçu les résultats de mon bilan cardiologique que vous m''aviez prescrit il y a 3 mois.

L''écho et l''ECG sont normaux selon le cardiologue.

Il recommande de continuer le traitement actuel.

Merci pour le suivi.

Jean', 'faible', '{"bilan_cardio_jean.pdf", "echo_coeur_jean.pdf"}', true, '2025-06-01 16:30:00'),

(4, NULL, 'Vacances - Réserve de médicaments', 'Docteur,

Je pars en vacances 3 semaines en juillet.

Pouvez-vous me faire une ordonnance pour avoir une réserve de mes médicaments pour l''hypertension ?

Il me faut environ 25 jours de traitement.

Merci beaucoup.

Jean Petit', 'faible', '{}', true, '2025-05-28 14:15:00'),

-- Messages Claire Moreau
(5, NULL, 'Certificat médical sport', 'Bonjour Docteur,

J''ai besoin d''un certificat médical pour reprendre le sport (fitness et course à pied).

Je n''ai pas eu de problème de santé particulier cette année.

Quand pourriez-vous me recevoir ?

Merci,
Claire Moreau', 'faible', '{}', false, '2025-06-08 11:15:00'),

(5, NULL, 'Allergie alimentaire - Urgent', 'Docteur,

J''ai fait une réaction allergique après avoir mangé des fruits de mer ce soir. J''ai des plaques rouges et des démangeaisons.

J''ai pris un antihistaminique mais ça ne passe pas complètement.

Dois-je m''inquiéter ? Faut-il que j''aille aux urgences ?

Claire', 'elevee', '{"photos_allergie_claire1.jpg", "photos_allergie_claire2.jpg"}', false, '2025-06-12 21:15:00')

ON CONFLICT DO NOTHING;

-- ===== INSERTION DES FICHIERS DE TEST =====
INSERT INTO fichiers (consultation_id, nom_original, nom_stockage, type_mime, taille_bytes, uploaded_at) VALUES
-- Fichiers Sophie
(1, 'resultats_prise_sang_sophie.pdf', 'uploads/2025/06/10/sophie_resultats_1718896500.pdf', 'application/pdf', 245760, '2025-06-10 16:45:00'),
(NULL, 'ordonnance_photo_sophie.jpg', 'uploads/2025/06/12/sophie_ordonnance_1718974200.jpg', 'image/jpeg', 421000, '2025-06-12 08:30:00'),
(NULL, 'symptomes_journal_sophie.pdf', 'uploads/2025/06/12/sophie_journal_1718974200.pdf', 'application/pdf', 156000, '2025-06-12 08:30:00'),

-- Fichiers Pierre
(2, 'radio_dos_pierre.jpg', 'uploads/2025/06/09/pierre_radio_1718815200.jpg', 'image/jpeg', 1048576, '2025-06-09 20:00:00'),

-- Fichiers Marie
(NULL, 'echographie_2eme_trimestre.pdf', 'uploads/2025/06/12/marie_echo_1718996700.pdf', 'application/pdf', 890000, '2025-06-12 16:45:00'),
(NULL, 'resultats_laboratoire_marie.pdf', 'uploads/2025/06/12/marie_labo_1718996700.pdf', 'application/pdf', 234000, '2025-06-12 16:45:00'),
(NULL, 'analyse_urine_marie.pdf', 'uploads/2025/06/07/marie_urine_1718640600.pdf', 'application/pdf', 167000, '2025-06-07 15:30:00'),

-- Fichiers Jean
(NULL, 'derniere_ordonnance_jean.jpg', 'uploads/2025/06/09/jean_ordonnance_1718797200.jpg', 'image/jpeg', 512000, '2025-06-09 14:20:00'),
(NULL, 'relevés_tension_juin_jean.pdf', 'uploads/2025/06/15/jean_tension_juin_1719335200.pdf', 'application/pdf', 187000, '2025-06-15 18:20:00'),
(NULL, 'tension_semaine_25_jean.pdf', 'uploads/2025/06/12/jean_tension_sem25_1719052200.pdf', 'application/pdf', 134000, '2025-06-12 11:30:00'),
(NULL, 'carnet_alimentaire_jean.jpg', 'uploads/2025/06/12/jean_alimentaire_1719052200.jpg', 'image/jpeg', 567000, '2025-06-12 11:30:00'),
(NULL, 'bilan_cardio_jean.pdf', 'uploads/2025/06/01/jean_cardio_1717253400.pdf', 'application/pdf', 456000, '2025-06-01 16:30:00'),
(NULL, 'echo_coeur_jean.pdf', 'uploads/2025/06/01/jean_echo_1717253400.pdf', 'application/pdf', 892000, '2025-06-01 16:30:00'),

-- Fichiers Claire
(NULL, 'photos_allergie_claire1.jpg', 'uploads/2025/06/12/claire_allergie1_1719014100.jpg', 'image/jpeg', 534000, '2025-06-12 21:15:00'),
(NULL, 'photos_allergie_claire2.jpg', 'uploads/2025/06/12/claire_allergie2_1719014100.jpg', 'image/jpeg', 498000, '2025-06-12 21:15:00')

ON CONFLICT DO NOTHING;

-- ===== INSERTION DU SUIVI CHAT =====
INSERT INTO chat_usage (patient_id, consultation_id, message_count, usage_date, created_at) VALUES
-- Usage Sophie
(1, 1, 4, '2025-06-10', '2025-06-10 14:30:00'),
(1, 1, 2, '2025-06-09', '2025-06-09 16:20:00'),
(1, NULL, 3, '2025-06-12', '2025-06-12 08:30:00'),
(1, NULL, 2, '2025-06-05', '2025-06-05 10:00:00'),

-- Usage Pierre
(2, 2, 3, '2025-06-09', '2025-06-09 19:45:00'),
(2, NULL, 2, '2025-06-12', '2025-06-12 14:20:00'),

-- Usage Marie
(3, 3, 2, '2025-06-11', '2025-06-11 09:15:00'),
(3, NULL, 1, '2025-06-12', '2025-06-12 16:45:00'),
(3, NULL, 1, '2025-06-07', '2025-06-07 15:30:00'),

-- Usage Jean (utilisateur actif)
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_sleep_001'), 6, '2025-06-13', '2025-06-13 21:30:00'),
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_sport_002'), 6, '2025-06-14', '2025-06-14 10:15:00'),
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_nutrition_003'), 5, '2025-06-15', '2025-06-15 14:45:00'),
(4, (SELECT id FROM consultations WHERE session_token = 'jean_session_medications_004'), 5, '2025-06-13', '2025-06-13 16:20:00'),
(4, NULL, 2, '2025-06-16', '2025-06-16 09:00:00'),
(4, NULL, 1, '2025-06-08', '2025-06-08 10:30:00'),

-- Usage Claire
(5, (SELECT id FROM consultations WHERE session_token = 'claire_session_allergie_001'), 6, '2025-06-12', '2025-06-12 21:15:00'),
(5, NULL, 1, '2025-06-08', '2025-06-08 11:15:00')

ON CONFLICT (patient_id, usage_date) DO UPDATE SET 
    message_count = chat_usage.message_count + EXCLUDED.message_count;