/**
 * MODAL TEMPLATES - Templates HTML réutilisables pour les modals
 * Évite la duplication de code HTML des modals dans chaque page
 */

// ===== TEMPLATES HTML =====

const MODAL_TEMPLATES = {
    // Modal de réponse (pour messages patients)
    reply: `
        <div class="modal" id="replyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Répondre au Message</h3>
                    <button class="modal-close" onclick="closeModal('replyModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="original-message" id="originalMessage">
                        <!-- Original message content -->
                    </div>
                    <div class="form-group">
                        <label class="form-label">Votre réponse :</label>
                        <textarea 
                            id="replyText" 
                            class="form-textarea" 
                            rows="6"
                            placeholder="Tapez votre réponse au patient..."
                            maxlength="5000"
                        ></textarea>
                        <small style="color: var(--text-secondary); font-size: var(--font-size-xs);">
                            Caractères restants: <span id="replyCharCount">5000</span>
                        </small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('replyModal')">
                        Annuler
                    </button>
                    <button class="btn btn-primary" id="replySend">
                        <i class="fas fa-paper-plane"></i>
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    `,

    // Modal d'ajout/édition patient
    patientForm: `
        <div class="modal" id="patientModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="patientModalTitle">Ajouter un Patient</h3>
                    <button class="modal-close" onclick="closeModal('patientModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="patientForm" class="form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="patientNom">Nom *</label>
                                <input type="text" id="patientNom" class="form-input" required maxlength="100">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="patientPrenom">Prénom *</label>
                                <input type="text" id="patientPrenom" class="form-input" required maxlength="100">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="patientDateNaissance">Date de naissance *</label>
                            <input type="date" id="patientDateNaissance" class="form-input" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="patientTelephone">Téléphone</label>
                                <input type="tel" id="patientTelephone" class="form-input" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="patientEmail">Email</label>
                                <input type="email" id="patientEmail" class="form-input" maxlength="255">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox-label">
                                <input type="checkbox" id="patientActif" checked>
                                <span class="form-checkbox"></span>
                                Patient actif
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('patientModal')">
                        Annuler
                    </button>
                    <button class="btn btn-primary" id="patientSave">
                        <i class="fas fa-save"></i>
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    `,

    // Modal de contact d'urgence
    emergencyForm: `
        <div class="modal" id="emergencyModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="emergencyModalTitle">Ajouter un Contact d'Urgence</h3>
                    <button class="modal-close" onclick="closeModal('emergencyModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="emergencyForm" class="form">
                        <div class="form-group">
                            <label class="form-label" for="emergencyNom">Nom du service *</label>
                            <input type="text" id="emergencyNom" class="form-input" required maxlength="255">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="emergencyTelephone">Numéro de téléphone *</label>
                            <input type="tel" id="emergencyTelephone" class="form-input" required maxlength="20">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="emergencyDescription">Description</label>
                            <textarea id="emergencyDescription" class="form-textarea" rows="3" maxlength="500"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="emergencySiteWeb">Site web</label>
                            <input type="url" id="emergencySiteWeb" class="form-input" maxlength="255">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="emergencyHoraires">Horaires</label>
                            <input type="text" id="emergencyHoraires" class="form-input" maxlength="255" value="24h/24 - 7j/7">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="emergencyOrdre">Ordre d'affichage</label>
                            <input type="number" id="emergencyOrdre" class="form-input" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label class="form-checkbox-label">
                                <input type="checkbox" id="emergencyActif" checked>
                                <span class="form-checkbox"></span>
                                Contact actif
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('emergencyModal')">
                        Annuler
                    </button>
                    <button class="btn btn-primary" id="emergencySave">
                        <i class="fas fa-save"></i>
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    `,

    // Modal de paramètres cabinet
    settingForm: `
        <div class="modal" id="settingModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="settingModalTitle">Modifier le Paramètre</h3>
                    <button class="modal-close" onclick="closeModal('settingModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="settingForm" class="form">
                        <div class="form-group">
                            <label class="form-label" id="settingLabel">Paramètre</label>
                            <div id="settingInputContainer">
                                <!-- Input sera inséré dynamiquement selon le type -->
                            </div>
                            <small class="form-help" id="settingDescription"></small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('settingModal')">
                        Annuler
                    </button>
                    <button class="btn btn-primary" id="settingSave">
                        <i class="fas fa-save"></i>
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    `,

    // Modal de visualisation de fichier/image
    fileViewer: `
        <div class="modal" id="fileViewerModal">
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <div class="modal-header">
                    <h3 class="modal-title" id="fileViewerTitle">Visualiser le Fichier</h3>
                    <button class="modal-close" onclick="closeModal('fileViewerModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 0;">
                    <div id="fileViewerContent">
                        <!-- Contenu du fichier (image, PDF, etc.) -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('fileViewerModal')">
                        Fermer
                    </button>
                    <a class="btn btn-primary" id="fileDownloadBtn" target="_blank">
                        <i class="fas fa-download"></i>
                        Télécharger
                    </a>
                </div>
            </div>
        </div>
    `
};

// ===== FONCTIONS D'INJECTION =====

// Injecter un template modal dans la page
function injectModal(templateName) {
    if (!MODAL_TEMPLATES[templateName]) {
        console.error(`Template modal "${templateName}" non trouvé`);
        return false;
    }
    
    // Vérifier si la modal existe déjà
    const modalId = templateName + 'Modal';
    if (document.getElementById(modalId)) {
        return true; // Déjà injectée
    }
    
    // Injecter le template
    document.body.insertAdjacentHTML('beforeend', MODAL_TEMPLATES[templateName]);
    return true;
}

// Injecter toutes les modals communes
function injectCommonModals() {
    Object.keys(MODAL_TEMPLATES).forEach(templateName => {
        injectModal(templateName);
    });
}

// ===== FONCTIONS UTILITAIRES POUR MODALS =====

// Pré-remplir un formulaire modal avec des données
function populateModalForm(modalId, data) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    Object.keys(data).forEach(key => {
        const field = modal.querySelector(`#${key}`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = Boolean(data[key]);
            } else {
                field.value = data[key] || '';
            }
        }
    });
}

// Récupérer les données d'un formulaire modal
function getModalFormData(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return {};
    
    const form = modal.querySelector('form');
    if (!form) return {};
    
    const formData = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.id] = input.checked;
        } else if (input.type === 'number') {
            formData[input.id] = parseInt(input.value) || 0;
        } else {
            formData[input.id] = input.value.trim();
        }
    });
    
    return formData;
}

// Réinitialiser un formulaire modal
function resetModalForm(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

// Valider un formulaire modal
function validateModalForm(modalId, rules = {}) {
    const data = getModalFormData(modalId);
    const errors = [];
    
    Object.keys(rules).forEach(fieldId => {
        const rule = rules[fieldId];
        const value = data[fieldId];
        
        if (rule.required && (!value || value.length === 0)) {
            errors.push(`${rule.label || fieldId} est requis`);
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${rule.label || fieldId} doit contenir au moins ${rule.minLength} caractères`);
        }
        
        if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(`${rule.label || fieldId} ne peut pas dépasser ${rule.maxLength} caractères`);
        }
        
        if (rule.email && value && !isValidEmail(value)) {
            errors.push(`${rule.label || fieldId} doit être un email valide`);
        }
        
        if (rule.phone && value && !isValidPhone(value)) {
            errors.push(`${rule.label || fieldId} doit être un numéro de téléphone valide`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        data: data
    };
}

// Afficher le visualiseur de fichier
function showFileViewer(fileName, fileUrl, fileType = null) {
    injectModal('fileViewer');
    
    document.getElementById('fileViewerTitle').textContent = fileName;
    document.getElementById('fileDownloadBtn').href = fileUrl;
    
    const content = document.getElementById('fileViewerContent');
    
    // Déterminer le type de fichier
    const extension = fileName.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const pdfTypes = ['pdf'];
    
    if (imageTypes.includes(extension)) {
        content.innerHTML = `<img src="${fileUrl}" style="max-width: 100%; max-height: 70vh; object-fit: contain;" alt="${fileName}">`;
    } else if (pdfTypes.includes(extension)) {
        content.innerHTML = `<iframe src="${fileUrl}" style="width: 100%; height: 70vh; border: none;"></iframe>`;
    } else {
        content.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <i class="fas fa-file" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h4>${fileName}</h4>
                <p>Prévisualisation non disponible pour ce type de fichier.</p>
                <p>Utilisez le bouton "Télécharger" pour ouvrir le fichier.</p>
            </div>
        `;
    }
    
    openModal('fileViewerModal');
}

// Auto-initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Les modals seront injectées à la demande pour éviter de surcharger le DOM
    console.log('Modal Templates JS loaded successfully');
});

// Export des fonctions pour utilisation externe
window.ModalTemplates = {
    inject: injectModal,
    injectAll: injectCommonModals,
    populate: populateModalForm,
    getData: getModalFormData,
    reset: resetModalForm,
    validate: validateModalForm,
    showFileViewer: showFileViewer
};