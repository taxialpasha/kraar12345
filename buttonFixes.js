// Correcciones para el funcionamiento del sidebar y navegación
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    
    // 1. Arreglo del botón de alternancia del sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Alternar la clase 'collapsed' en el sidebar
            sidebar.classList.toggle('collapsed');
            
            // Para pantallas pequeñas
            if (window.innerWidth <= 1024) {
                sidebar.classList.toggle('expanded');
            }
            
            // Ajustar el margen del contenido principal
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                if (window.innerWidth > 1024) {
                    mainContent.style.marginRight = sidebar.classList.contains('collapsed') ? '70px' : '280px';
                    mainContent.style.width = sidebar.classList.contains('collapsed') ? 'calc(100% - 70px)' : 'calc(100% - 280px)';
                }
            }
        });
    }
    
    // 2. Arreglo de la navegación entre páginas
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Ignorar si es el botón de cierre de sesión
            if (this.id === 'logout-btn') return;
            
            e.preventDefault();
            
            // Actualizar elemento de menú activo
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
            
            // Mostrar página correspondiente
            const pageId = this.getAttribute('data-page');
            if (pageId) {
                pages.forEach(page => {
                    page.classList.remove('active');
                });
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.classList.add('active');
                    
                    // Actualizar título de la página
                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle) {
                        const menuIcon = this.querySelector('i');
                        const menuSpan = this.querySelector('span');
                        if (menuIcon && menuSpan) {
                            pageTitle.innerHTML = `<i class="${menuIcon.className}" style="color: var(--primary-color);"></i> ${menuSpan.textContent}`;
                        }
                    }
                }
            }
            
            // Para pantallas pequeñas, cerrar el sidebar después de seleccionar
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('expanded');
            }
        });
    });
    
    // 3. Corregir modales
    const modalBtns = document.querySelectorAll('[data-modal]');
    const closeModalBtns = document.querySelectorAll('.close-modal, .modal-overlay');
    
    modalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                const modalOverlay = modal.closest('.modal-overlay');
                if (modalOverlay) {
                    modalOverlay.style.display = 'flex';
                    modal.style.display = 'block';
                }
            }
        });
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Solo cerrar si se hace clic directamente en el overlay o en el botón de cierre
            if (e.target === this || this.classList.contains('close-modal')) {
                const modalOverlay = this.closest('.modal-overlay');
                if (modalOverlay) {
                    modalOverlay.style.display = 'none';
                    const modal = modalOverlay.querySelector('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                }
            }
        });
    });
    
    // 4. Asegurarse de que al menos una página esté activa al cargar
    const activePage = document.querySelector('.page.active');
    if (!activePage && pages.length > 0) {
        pages[0].classList.add('active');
        if (menuItems.length > 0) {
            menuItems[0].classList.add('active');
        }
    }
    
    // 5. Agregar eventos a los botones adicionales
    const addInvestorBtn = document.getElementById('add-investor-btn');
    const investorModalOverlay = document.getElementById('investor-modal-overlay');
    const investorModal = document.getElementById('investor-modal');
    
    if (addInvestorBtn && investorModalOverlay && investorModal) {
        addInvestorBtn.addEventListener('click', function() {
            investorModalOverlay.style.display = 'flex';
            investorModal.style.display = 'block';
        });
    }
    
    const addDepositBtn = document.getElementById('add-deposit-btn');
    const addWithdrawalBtn = document.getElementById('add-withdrawal-btn');
    const operationModalOverlay = document.getElementById('operation-modal-overlay');
    const operationModal = document.getElementById('operation-modal');
    const operationTypeSelect = document.getElementById('operation-type');
    const operationModalTitle = document.getElementById('operation-modal-title');
    
    if (addDepositBtn && operationModalOverlay && operationModal && operationTypeSelect && operationModalTitle) {
        addDepositBtn.addEventListener('click', function() {
            operationTypeSelect.value = 'deposit';
            operationModalTitle.textContent = 'إضافة إيداع جديد';
            operationModalOverlay.style.display = 'flex';
            operationModal.style.display = 'block';
        });
    }
    
    if (addWithdrawalBtn && operationModalOverlay && operationModal && operationTypeSelect && operationModalTitle) {
        addWithdrawalBtn.addEventListener('click', function() {
            operationTypeSelect.value = 'withdrawal';
            operationModalTitle.textContent = 'إضافة سحب جديد';
            operationModalOverlay.style.display = 'flex';
            operationModal.style.display = 'block';
        });
    }
    
    // Cerrar modales cuando se hace clic en botones de cierre
    const closeButtons = document.querySelectorAll('.close-modal, [id$="-close"], [id$="-cancel"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalOverlay = this.closest('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });
    });
    
    console.log('Correcciones de botones aplicadas con éxito');
});