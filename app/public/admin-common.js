/**
 * ADMIN COMMON - JavaScript partagé pour les pages d'administration
 * Factorisation des fonctions communes : modals, logout, validation, utilitaires
 */

// ===== GESTION DES MODALS =====

// Ouvrir une modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Focus sur le premier champ de saisie si présent
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// Fermer une modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Fermer toutes les modals (utile pour Escape)
function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ===== MODAL DE CONFIRMATION =====

let confirmCallback = null;

function showConfirm(title, message, onConfirm, onCancel = null) {
    // Créer la modal si elle n'existe pas
    if (!document.getElementById('confirmModal')) {
        createConfirmModal();
    }
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message.replace(/\n/g, '<br>');
    
    confirmCallback = { confirm: onConfirm, cancel: onCancel };
    openModal('confirmModal');
}

function createConfirmModal() {
    const modalHTML = `
        <div class="modal" id="confirmModal">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header" style="border-bottom: 1px solid #fee2e2; background: #fef2f2;">
                    <h3 class="modal-title" style="color: #dc2626; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="confirmTitle">Confirmation</span>
                    </h3>
                    <button class="modal-close" onclick="closeConfirmModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 2rem 1.5rem;">
                    <p id="confirmMessage" style="margin-bottom: 1.5rem; color: var(--text-primary); font-size: 1rem;">
                        Êtes-vous sûr ?
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeConfirmModal()">
                        <i class="fas fa-times"></i>
                        Annuler
                    </button>
                    <button class="btn btn-danger" onclick="confirmAction()">
                        <i class="fas fa-check"></i>
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeConfirmModal() {
    if (confirmCallback && confirmCallback.cancel) {
        confirmCallback.cancel();
    }
    confirmCallback = null;
    closeModal('confirmModal');
}

function confirmAction() {
    if (confirmCallback && confirmCallback.confirm) {
        confirmCallback.confirm();
    }
    confirmCallback = null;
    closeModal('confirmModal');
}

// ===== MODAL DE SUCCÈS/ALERTE =====

function showAlert(title, message, isError = false) {
    // Créer la modal si elle n'existe pas
    if (!document.getElementById('alertModal')) {
        createAlertModal();
    }
    
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').innerHTML = message.replace(/\n/g, '<br>');
    
    const modal = document.getElementById('alertModal');
    const header = modal.querySelector('.modal-header');
    const icon = modal.querySelector('.modal-title i');
    
    if (isError) {
        header.style.borderBottom = '1px solid #fee2e2';
        header.style.background = '#fef2f2';
        modal.querySelector('.modal-title').style.color = '#dc2626';
        icon.className = 'fas fa-exclamation-circle';
    } else {
        header.style.borderBottom = '1px solid #dcfce7';
        header.style.background = '#f0fdf4';
        modal.querySelector('.modal-title').style.color = '#059669';
        icon.className = 'fas fa-check-circle';
    }
    
    openModal('alertModal');
}

function createAlertModal() {
    const modalHTML = `
        <div class="modal" id="alertModal">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header" style="border-bottom: 1px solid #dcfce7; background: #f0fdf4;">
                    <h3 class="modal-title" style="color: #059669; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-check-circle"></i>
                        <span id="alertTitle">Information</span>
                    </h3>
                    <button class="modal-close" onclick="closeModal('alertModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 2rem 1.5rem;">
                    <p id="alertMessage" style="color: var(--text-primary); font-size: 1rem;">
                        Message
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="closeModal('alertModal')">
                        <i class="fas fa-check"></i>
                        OK
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== MODAL DE DÉCONNEXION =====

function logout() {
    showConfirm(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?\n\nVous devrez vous reconnecter pour accéder au tableau de bord.',
        confirmLogout
    );
}

async function confirmLogout() {
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            window.location.href = result.redirect || '/admin/login';
        } else {
            showAlert('Erreur', 'Erreur lors de la déconnexion', true);
        }
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        window.location.href = '/admin/login';
    }
}

// ===== UTILITAIRES =====

// Échapper le HTML pour éviter les XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formater une date
function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Validation d'email simple
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation de téléphone français
function isValidPhone(phone) {
    return /^(?:\+33|0)[1-9](?:[0-9]{8})$/.test(phone.replace(/\s/g, ''));
}

// Compter les caractères restants dans un textarea
function setupCharCounter(textareaId, counterId, maxLength = 5000) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (!textarea || !counter) return;
    
    function updateCount() {
        const remaining = maxLength - textarea.value.length;
        counter.textContent = remaining;
        counter.style.color = remaining < 100 ? '#dc2626' : 'var(--text-secondary)';
    }
    
    textarea.addEventListener('input', updateCount);
    updateCount(); // Initial count
}

// ===== GESTION GLOBALE DES ÉVÉNEMENTS =====

// Initialisation commune à toutes les pages admin
document.addEventListener('DOMContentLoaded', function() {
    // Raccourcis clavier globaux
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (typeof loadData === 'function') {
                loadData();
            }
        }
    });
    
    // Fermer modals en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            if (modalId && modalId !== 'confirmModal') { // Confirm modal needs explicit action
                closeModal(modalId);
            }
        }
    });
    
    // Auto-refresh toutes les 2 minutes si la fonction existe
    if (typeof loadData === 'function') {
        setInterval(loadData, 120000);
    }
});

// ===== GESTION D'ERREURS =====

// Afficher une erreur dans un conteneur spécifique
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <h3>Erreur</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

// Afficher un état vide
function showEmptyState(containerId, icon, title, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

// ===== RECHERCHE ET FILTRES =====

// Utilitaire de recherche générique
function createSearchHandler(searchInputId, clearButtonId, onSearch) {
    const searchInput = document.getElementById(searchInputId);
    const clearButton = document.getElementById(clearButtonId);
    
    if (!searchInput) return;
    
    function handleSearch() {
        const searchValue = searchInput.value.trim();
        
        if (clearButton) {
            clearButton.style.display = searchValue ? 'block' : 'none';
        }
        
        if (onSearch) {
            onSearch(searchValue);
        }
    }
    
    function clearSearch() {
        searchInput.value = '';
        if (clearButton) {
            clearButton.style.display = 'none';
        }
        if (onSearch) {
            onSearch('');
        }
    }
    
    searchInput.addEventListener('input', handleSearch);
    if (clearButton) {
        clearButton.addEventListener('click', clearSearch);
    }
    
    return { handleSearch, clearSearch };
}

// Console log pour debugging
console.log('Admin Common JS loaded successfully');