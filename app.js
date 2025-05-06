// Inicialización de variables globales
let db = null;
const DB_NAME = 'investment-system';
const DB_VERSION = 1;

// Datos de la aplicación
let investorsData = [];
let operationsData = [];
let profitsData = [];
let notificationsData = [];
let eventsData = [];
let backupsData = [];

// Configuración de la aplicación
let settings = {
    interestRate: 1.75,
    currency: 'IQD',
    theme: 'light',
    primaryColor: 'purple',
    language: 'ar',
    timezone: 'Asia/Baghdad',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '12',
    sidebarMode: 'expanded',
    fontSize: 'medium',
    autoLogout: '0',
    twoFactor: 'disabled',
    userActivity: 'enabled',
    autoBackup: 'daily',
    profitDay: '1',
    proportionalProfits: 'enabled'
};

// Elementos DOM comunes
const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.querySelector('.page-title');
const loaderOverlay = document.querySelector('.loader-overlay');

// Modales
const investorModalOverlay = document.getElementById('investor-modal-overlay');
const investorModal = document.getElementById('investor-modal');
const addInvestorBtn = document.getElementById('add-investor-btn');
const investorForm = document.getElementById('investor-form');
const investorDateInput = document.getElementById('investor-date');
const investorDateMessage = document.getElementById('investor-date-message');
const investorModalClose = document.getElementById('investor-modal-close');

const operationModalOverlay = document.getElementById('operation-modal-overlay');
const operationModal = document.getElementById('operation-modal');
const addDepositBtn = document.getElementById('add-deposit-btn');
const addWithdrawalBtn = document.getElementById('add-withdrawal-btn');
const operationForm = document.getElementById('operation-form');
const operationTypeSelect = document.getElementById('operation-type');
const operationModalTitle = document.getElementById('operation-modal-title');
const operationDateInput = document.getElementById('operation-date');
const operationDateMessage = document.getElementById('operation-date-message');
const operationModalClose = document.getElementById('operation-modal-close');

// Botones de cierre de modales
const closeButtons = document.querySelectorAll('.close-modal');

// Botones adicionales
const saveSettingsBtn = document.getElementById('save-settings-btn');
const exportDataBtn = document.getElementById('export-data-btn');
const importDataBtn = document.getElementById('import-data-btn');
const createBackupBtn = document.getElementById('create-backup-btn');
const generateReportBtn = document.getElementById('generate-report-btn');
const notificationBtn = document.querySelector('.notification-btn');

// ========================
// Inicialización
// ========================

// Función principal de inicialización
function initApp() {
    console.log('Inicializando aplicación...');
    
    // Inicializar base de datos
    initDatabase();
    
    // Establecer fecha actual en el calendario
    initCalendar();
    
    // Inicializar gráficos
    initCharts();
    
    // Inicializar eventos
    initEvents();
    
    // Mostrar página inicial
    showActivePage();
}

// Inicializar base de datos
function initDatabase() {
    console.log('Inicializando base de datos...');
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = function(event) {
        console.log('Actualizando esquema de base de datos...');
        const db = event.target.result;
        
        // Crear almacén de inversores
        if (!db.objectStoreNames.contains('investors')) {
            const investorsStore = db.createObjectStore('investors', { keyPath: 'id', autoIncrement: true });
            investorsStore.createIndex('name', 'name', { unique: false });
            investorsStore.createIndex('phone', 'phone', { unique: false });
            investorsStore.createIndex('idCard', 'idCard', { unique: true });
        }
        
        // Crear almacén de operaciones
        if (!db.objectStoreNames.contains('operations')) {
            const operationsStore = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
            operationsStore.createIndex('investorId', 'investorId', { unique: false });
            operationsStore.createIndex('date', 'date', { unique: false });
            operationsStore.createIndex('type', 'type', { unique: false });
        }
        
        // Crear almacén de ganancias
        if (!db.objectStoreNames.contains('profits')) {
            const profitsStore = db.createObjectStore('profits', { keyPath: 'id', autoIncrement: true });
            profitsStore.createIndex('investorId', 'investorId', { unique: false });
            profitsStore.createIndex('date', 'date', { unique: false });
        }
        
        // Crear almacén de notificaciones
        if (!db.objectStoreNames.contains('notifications')) {
            const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            notificationsStore.createIndex('date', 'date', { unique: false });
            notificationsStore.createIndex('read', 'read', { unique: false });
        }
        
        // Crear almacén de eventos
        if (!db.objectStoreNames.contains('events')) {
            const eventsStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
            eventsStore.createIndex('date', 'date', { unique: false });
            eventsStore.createIndex('type', 'type', { unique: false });
        }
        
        // Crear almacén de configuración
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
        }
        
        // Crear almacén de respaldos
        if (!db.objectStoreNames.contains('backups')) {
            const backupsStore = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
            backupsStore.createIndex('date', 'date', { unique: false });
            backupsStore.createIndex('type', 'type', { unique: false });
        }
        
        // Crear almacén de informes
        if (!db.objectStoreNames.contains('reports')) {
            const reportsStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
            reportsStore.createIndex('type', 'type', { unique: false });
            reportsStore.createIndex('date', 'date', { unique: false });
        }
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Base de datos inicializada correctamente');
        
        // Cargar configuración
        loadSettings();
        
        // Cargar datos iniciales
        loadInvestors();
        loadOperations();
        loadProfits();
        loadNotifications();
        loadEvents();
        loadBackups();
        
        // Verificar si hay ganancias pendientes de distribución
        checkPendingProfits();
    };
    
    request.onerror = function(event) {
        console.error('Error al inicializar la base de datos:', event.target.error);
        showAlert('Error al inicializar la base de datos. Por favor, recargue la página.', 'danger');
    };
}

// Inicializar calendario
function initCalendar() {
    const today = new Date();
    const currentMonthElement = document.querySelector('.calendar-title');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${getMonthName(today.getMonth())} ${today.getFullYear()}`;
    }
    
    // Marcar el día de hoy en el calendario
    highlightToday();
    
    // Mostrar eventos en el calendario
    updateCalendarEvents();
    
    // Configurar navegación del calendario
    const prevMonthBtn = document.querySelector('.calendar-nav-btn:first-child');
    const nextMonthBtn = document.querySelector('.calendar-nav-btn:last-child');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            navigateCalendar(-1);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            navigateCalendar(1);
        });
    }
}

// Inicializar gráficos
function initCharts() {
    // Cargar bibliotecas necesarias para gráficos
    loadChartLibraries().then(() => {
        console.log('Bibliotecas de gráficos cargadas');
        // Inicializar gráficos después de cargar datos
        updateAllCharts();
    }).catch(error => {
        console.error('Error al cargar bibliotecas de gráficos:', error);
    });
}

// Cargar bibliotecas de gráficos
function loadChartLibraries() {
    return new Promise((resolve, reject) => {
        // Verificar si Chart.js ya está cargado
        if (window.Chart) {
            resolve();
            return;
        }
        
        // Cargar Chart.js desde CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.integrity = 'sha512-ElRFoEQdI5Ht6kZvyzXhYG9NqjtkmlkfYk0wr6wHxU9JEHakS7UJZNeml5ALk+8IKlU6jDgMabC3vkumRokgJA==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        
        script.onload = () => {
            console.log('Chart.js cargado correctamente');
            resolve();
        };
        
        script.onerror = () => {
            console.error('Error al cargar Chart.js');
            // Intentar cargar una versión alternativa
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            
            fallbackScript.onload = () => {
                console.log('Chart.js (fallback) cargado correctamente');
                resolve();
            };
            
            fallbackScript.onerror = () => {
                reject(new Error('No se pudo cargar Chart.js'));
            };
            
            document.head.appendChild(fallbackScript);
        };
        
        document.head.appendChild(script);
    });
}

// Inicializar eventos
function initEvents() {
    // Navegación entre páginas
    menuItems.forEach(item => {
        item.addEventListener('click', handlePageNavigation);
    });
    
    // Eventos de modales
    addInvestorBtn.addEventListener('click', openAddInvestorModal);
    addDepositBtn.addEventListener('click', openAddDepositModal);
    addWithdrawalBtn.addEventListener('click', openAddWithdrawalModal);
    investorModalClose.addEventListener('click', closeInvestorModal);
    operationModalClose.addEventListener('click', closeOperationModal);
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Eventos de formularios
    investorForm.addEventListener('submit', handleInvestorFormSubmit);
    operationForm.addEventListener('submit', handleOperationFormSubmit);
    investorDateInput.addEventListener('change', validateInvestorDate);
    operationDateInput.addEventListener('change', validateOperationDate);
    
    // Eventos de ventana
    window.addEventListener('click', function(event) {
        if (event.target === investorModalOverlay) {
            closeInvestorModal();
        }
        if (event.target === operationModalOverlay) {
            closeOperationModal();
        }
    });
    
    // Botones de acción
    saveSettingsBtn.addEventListener('click', saveSettings);
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', handleImportData);
    createBackupBtn.addEventListener('click', createBackup);
    generateReportBtn.addEventListener('click', generateReport);
    
    // Notificaciones
    notificationBtn.addEventListener('click', toggleNotificationsPanel);
    
    // Búsqueda de inversores
    const investorSearch = document.getElementById('investor-search');
    if (investorSearch) {
        investorSearch.addEventListener('input', function() {
            filterInvestors(this.value);
        });
    }
    
    // Búsqueda de operaciones
    const operationSearch = document.getElementById('operation-search');
    if (operationSearch) {
        operationSearch.addEventListener('input', function() {
            filterOperations(this.value);
        });
    }
    
    // Eventos para gráficos
    const chartTabs = document.querySelectorAll('.card-tab');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            const tabs = this.parentElement.querySelectorAll('.card-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            updateChart(chartType);
        });
    });
    
    // Acordeón de preguntas frecuentes
    const faqHeaders = document.querySelectorAll('#help .card-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const body = this.nextElementSibling;
            if (body && body.classList.contains('card-body')) {
                if (body.style.display === 'block') {
                    body.style.display = 'none';
                } else {
                    document.querySelectorAll('#help .card-body').forEach(item => {
                        item.style.display = 'none';
                    });
                    body.style.display = 'block';
                }
            }
        });
    });
    
    // Delegación de eventos para botones de acción en tablas
    document.addEventListener('click', function(event) {
        // Botones de vista
        if (event.target.closest('.view-btn')) {
            const button = event.target.closest('.view-btn');
            const id = parseInt(button.getAttribute('data-id'));
            const page = getActivePage();
            
            if (page === 'investors') {
                viewInvestor(id);
            } else if (page === 'operations') {
                viewOperation(id);
            } else if (page === 'profits') {
                viewProfit(id);
            }
        }
        
        // Botones de edición
        if (event.target.closest('.edit-btn')) {
            const button = event.target.closest('.edit-btn');
            const id = parseInt(button.getAttribute('data-id'));
            const page = getActivePage();
            
            if (page === 'investors') {
                editInvestor(id);
            } else if (page === 'operations') {
                editOperation(id);
            } else if (page === 'profits') {
                editProfit(id);
            }
        }
        
        // Botones de eliminación
        if (event.target.closest('.delete-btn')) {
            const button = event.target.closest('.delete-btn');
            const id = parseInt(button.getAttribute('data-id'));
            const page = getActivePage();
            
            if (page === 'investors') {
                deleteInvestor(id);
            } else if (page === 'operations') {
                deleteOperation(id);
            } else if (page === 'profits') {
                deleteProfit(id);
            }
        }
    });
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de que desea cerrar sesión?')) {
                showAlert('Sesión cerrada exitosamente', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    }
}

// ========================
// Funciones de navegación
// ========================

// Manejar navegación entre páginas
function handlePageNavigation() {
    const pageId = this.getAttribute('data-page');
    
    // Ignorar si es el botón de cierre de sesión
    if (this.id === 'logout-btn') {
        return;
    }
    
    // Actualizar elemento de menú activo
    menuItems.forEach(menuItem => {
        menuItem.classList.remove('active');
    });
    this.classList.add('active');
    
    // Actualizar página activa
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Actualizar título de la página
    const menuSpan = this.querySelector('span');
    const menuIcon = this.querySelector('i');
    pageTitle.innerHTML = `<i class="${menuIcon.className}" style="color: var(--primary-color);"></i> ${menuSpan.textContent}`;
    
    // Actualizar datos específicos de la página
    updatePageData(pageId);
}

// Actualizar datos específicos de la página
function updatePageData(pageId) {
    switch (pageId) {
        case 'dashboard':
            updateDashboardStats();
            updateDashboardCharts();
            break;
        case 'investors':
            updateInvestorsTable();
            break;
        case 'profits':
            updateProfitsTable();
            updateProfitsCharts();
            break;
        case 'operations':
            updateOperationsTable();
            updateOperationsCharts();
            break;
        case 'analytics':
            updateAnalyticsCharts();
            break;
        case 'reports':
            // Nada específico por ahora
            break;
        case 'calendar':
            updateCalendarEvents();
            break;
        case 'notifications':
            loadNotifications();
            updateNotificationsPanel();
            break;
        case 'settings':
            updateSettingsUI();
            break;
        case 'backup':
            loadBackups();
            updateBackupsTable();
            break;
        case 'profile':
            // Actualizar información del perfil
            break;
        case 'help':
            // Nada específico por ahora
            break;
    }
}

// Mostrar página activa
function showActivePage() {
    const activeMenuItem = document.querySelector('.menu-item.active');
    if (activeMenuItem) {
        const pageId = activeMenuItem.getAttribute('data-page');
        document.getElementById(pageId).classList.add('active');
        
        // Actualizar título de la página
        const menuSpan = activeMenuItem.querySelector('span');
        const menuIcon = activeMenuItem.querySelector('i');
        pageTitle.innerHTML = `<i class="${menuIcon.className}" style="color: var(--primary-color);"></i> ${menuSpan.textContent}`;
        
        // Actualizar datos específicos de la página
        updatePageData(pageId);
    }
}

// Obtener página activa
function getActivePage() {
    const activePage = document.querySelector('.page.active');
    return activePage ? activePage.id : null;
}

// ========================
// Modales
// ========================

// Abrir modal para agregar inversor
function openAddInvestorModal() {
    investorForm.reset();
    investorForm.removeAttribute('data-mode');
    investorForm.removeAttribute('data-id');
    
    document.querySelector('.modal-title').textContent = 'إضافة مستثمر جديد';
    
    investorDateMessage.textContent = '';
    investorModalOverlay.style.display = 'block';
    investorModal.style.display = 'block';
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    investorDateInput.value = formattedDate;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    investorDateMessage.textContent = validation.message;
    investorDateMessage.style.color = validation.valid ? 'green' : 'red';
}

// Abrir modal para editar inversor
function editInvestor(id) {
    const investor = getInvestorById(id);
    if (!investor) {
        showAlert('No se encontró al inversor', 'danger');
        return;
    }
    
    investorForm.reset();
    investorForm.setAttribute('data-mode', 'edit');
    investorForm.setAttribute('data-id', id);
    
    document.querySelector('#investor-modal .modal-title').textContent = 'تعديل بيانات المستثمر';
    
    // Llenar el formulario con los datos del inversor
    document.getElementById('investor-name').value = investor.name;
    document.getElementById('investor-phone').value = investor.phone;
    document.getElementById('investor-address').value = investor.address || '';
    document.getElementById('investor-id-card').value = investor.idCard;
    document.getElementById('investor-email').value = investor.email || '';
    document.getElementById('investor-job').value = investor.job || '';
    document.getElementById('investor-notes').value = investor.notes || '';
    
    // No permitir cambiar el monto inicial
    const amountInput = document.getElementById('investor-amount');
    amountInput.value = investor.amount;
    amountInput.disabled = true;
    
    // Establecer fecha
    investorDateInput.value = formatDateForInput(new Date(investor.date));
    
    // Validar fecha
    const validation = validateInvestmentDate(investor.date);
    investorDateMessage.textContent = validation.message;
    investorDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    investorModalOverlay.style.display = 'block';
    investorModal.style.display = 'block';
}

// Ver detalles del inversor
function viewInvestor(id) {
    const investor = getInvestorById(id);
    if (!investor) {
        showAlert('No se encontró al inversor', 'danger');
        return;
    }
    
    // Crear modal de detalles
    createInvestorDetailsModal(investor);
}

// Crear modal de detalles del inversor
function createInvestorDetailsModal(investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('investor-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const totalInvestment = calculateTotalInvestment(investor.id);
    const monthlyProfit = calculateMonthlyProfit(investor.id);
    const investorOperations = operationsData.filter(op => op.investorId === investor.id);
    const daysActive = calculateDaysActive(investor.date);
    
    // Calcular totales
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalProfits = 0;
    
    investorOperations.forEach(op => {
        if (op.type === 'deposit') {
            totalDeposits += op.amount;
        } else if (op.type === 'withdrawal') {
            totalWithdrawals += op.amount;
        } else if (op.type === 'profit') {
            totalProfits += op.amount;
        }
    });
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'investor-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل المستثمر: ${investor.name}</div>
                    <span class="close-modal" id="investor-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 0 0 200px; text-align: center;">
                            <div style="width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 50px; font-weight: bold;">
                                ${investor.name.charAt(0)}
                            </div>
                        </div>
                        <div style="flex: 1; min-width: 300px;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                                <div>
                                    <div style="font-weight: bold;">الاسم الكامل</div>
                                    <div>${investor.name}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">رقم الهاتف</div>
                                    <div>${investor.phone}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">العنوان</div>
                                    <div>${investor.address || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">رقم البطاقة</div>
                                    <div>${investor.idCard}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">البريد الإلكتروني</div>
                                    <div>${investor.email || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">المهنة</div>
                                    <div>${investor.job || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">تاريخ الاستثمار</div>
                                    <div>${formatDate(investor.date)}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">عدد الأيام</div>
                                    <div>${daysActive} يوم</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-stats" style="margin-top: 20px;">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalInvestment)}</div>
                                <div class="stat-label">إجمالي الاستثمار</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--success-color), #6deca9);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(monthlyProfit)}</div>
                                <div class="stat-label">الربح الشهري</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--warning-color), #ffd54f);">
                                <i class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalProfits)}</div>
                                <div class="stat-label">إجمالي الأرباح المستلمة</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div class="card-title">
                                <i class="fas fa-exchange-alt"></i>
                                عمليات المستثمر
                            </div>
                            <div>
                                <button class="btn btn-success btn-round add-investor-deposit-btn" data-id="${investor.id}">
                                    <i class="fas fa-plus"></i>
                                    إيداع
                                </button>
                                <button class="btn btn-danger btn-round add-investor-withdrawal-btn" data-id="${investor.id}">
                                    <i class="fas fa-minus"></i>
                                    سحب
                                </button>
                                <button class="btn btn-warning btn-round distribute-profit-btn" data-id="${investor.id}">
                                    <i class="fas fa-money-bill-wave"></i>
                                    توزيع الربح
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>نوع العملية</th>
                                        <th>المبلغ</th>
                                        <th>التاريخ</th>
                                        <th>التفاصيل</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateInvestorOperationsRows(investorOperations)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-chart-bar"></i>
                            تحليل استثمارات ${investor.name}
                        </div>
                        <div id="investor-chart-container" style="height: 300px;">
                            <canvas id="investor-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="investor-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary edit-investor-btn" data-id="${investor.id}">تعديل</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos
    document.getElementById('investor-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('investor-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.querySelector('.edit-investor-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        editInvestor(investor.id);
    });
    
    document.querySelector('.add-investor-deposit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        openAddDepositModal(investor.id);
    });
    
    document.querySelector('.add-investor-withdrawal-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        openAddWithdrawalModal(investor.id);
    });
    
    document.querySelector('.distribute-profit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        distributeProfit(investor.id);
    });
    
    // Generar gráfico de inversor
    setTimeout(() => {
        generateInvestorChart(investor.id);
    }, 100);
}

// Generar filas de operaciones para un inversor
function generateInvestorOperationsRows(operations) {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedOperations.length === 0) {
        return '<tr><td colspan="5" style="text-align: center;">لا توجد عمليات</td></tr>';
    }
    
    let rows = '';
    
    sortedOperations.forEach(operation => {
        let typeClass = '';
        let typeText = '';
        
        if (operation.type === 'deposit') {
            typeClass = 'status-deposit';
            typeText = 'إيداع';
        } else if (operation.type === 'withdrawal') {
            typeClass = 'status-withdrawal';
            typeText = 'سحب';
        } else if (operation.type === 'profit') {
            typeClass = 'status-profit';
            typeText = 'أرباح';
        }
        
        rows += `
            <tr>
                <td><div class="status-pill ${typeClass}">${typeText}</div></td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td>${operation.details || '-'}</td>
                <td><div class="status-pill status-deposit">مكتمل</div></td>
            </tr>
        `;
    });
    
    return rows;
}

// Generar gráfico para un inversor
function generateInvestorChart(investorId) {
    const operations = operationsData.filter(op => op.investorId === investorId);
    
    if (operations.length === 0) {
        return;
    }
    
    // Ordenar operaciones por fecha
    const sortedOperations = [...operations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Preparar datos para el gráfico
    const dates = [];
    const investmentData = [];
    const profitData = [];
    
    let runningInvestment = 0;
    let runningProfit = 0;
    
    sortedOperations.forEach(operation => {
        const formattedDate = formatDate(operation.date);
        
        if (operation.type === 'deposit') {
            runningInvestment += operation.amount;
        } else if (operation.type === 'withdrawal') {
            runningInvestment -= operation.amount;
        } else if (operation.type === 'profit') {
            runningProfit += operation.amount;
        }
        
        dates.push(formattedDate);
        investmentData.push(runningInvestment);
        profitData.push(runningProfit);
    });
    
    // Crear gráfico
    const canvas = document.getElementById('investor-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Eliminar gráfico existente si lo hay
    if (window.investorChart) {
        window.investorChart.destroy();
    }
    
    window.investorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'الاستثمار',
                    data: investmentData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'الأرباح المتراكمة',
                    data: profitData,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'التاريخ'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'المبلغ'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'تطور الاستثمار والأرباح'
                }
            }
        }
    });
}

// Abrir modal para agregar depósito
function openAddDepositModal(investorId = null) {
    operationForm.reset();
    operationForm.removeAttribute('data-mode');
    operationForm.removeAttribute('data-id');
    
    operationTypeSelect.value = 'deposit';
    operationModalTitle.textContent = 'إضافة إيداع جديد';
    operationDateMessage.textContent = '';
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
    
    // Si se proporciona un ID de inversor, seleccionarlo en el formulario
    if (investorId !== null) {
        document.getElementById('operation-investor').value = investorId;
    }
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    operationDateInput.value = formattedDate;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
}

// Abrir modal para agregar retiro
function openAddWithdrawalModal(investorId = null) {
    operationForm.reset();
    operationForm.removeAttribute('data-mode');
    operationForm.removeAttribute('data-id');
    
    operationTypeSelect.value = 'withdrawal';
    operationModalTitle.textContent = 'إضافة سحب جديد';
    operationDateMessage.textContent = '';
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
    
    // Si se proporciona un ID de inversor, seleccionarlo en el formulario
    if (investorId !== null) {
        document.getElementById('operation-investor').value = investorId;
    }
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    operationDateInput.value = formattedDate;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
}

// Distribuir ganancia a un inversor
function distributeProfit(investorId) {
    const investor = getInvestorById(investorId);
    if (!investor) {
        showAlert('No se encontró al inversor', 'danger');
        return;
    }
    
    const totalInvestment = calculateTotalInvestment(investorId);
    const monthlyProfit = calculateMonthlyProfit(investorId);
    
    if (totalInvestment <= 0) {
        showAlert('No hay inversión activa para distribuir ganancias', 'danger');
        return;
    }
    
    // Crear modal para distribución de ganancias
    createDistributeProfitModal(investor, totalInvestment, monthlyProfit);
}

// Crear modal para distribución de ganancias
function createDistributeProfitModal(investor, totalInvestment, monthlyProfit) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('profit-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Calcular valores
    const interestRate = settings.interestRate;
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'profit-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">توزيع الربح: ${investor.name}</div>
                    <span class="close-modal" id="profit-modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="profit-form">
                        <div class="form-group">
                            <label>المستثمر</label>
                            <input type="text" class="form-control" value="${investor.name}" disabled>
                            <input type="hidden" id="profit-investor-id" value="${investor.id}">
                        </div>
                        <div class="form-group">
                            <label>إجمالي الاستثمار</label>
                            <input type="text" class="form-control" value="${formatCurrency(totalInvestment)}" disabled>
                        </div>
                        <div class="form-group">
                            <label>نسبة الفائدة الشهرية</label>
                            <input type="text" class="form-control" value="${interestRate}%" disabled>
                        </div>
                        <div class="form-group">
                            <label>الربح الشهري <span style="color: var(--danger-color);">*</span></label>
                            <input type="number" class="form-control" id="profit-amount" value="${monthlyProfit}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>تاريخ التوزيع <span style="color: var(--danger-color);">*</span></label>
                            <input type="date" class="form-control" id="profit-date" required>
                        </div>
                        <div class="form-group">
                            <label>تفاصيل</label>
                            <textarea class="form-control" id="profit-details" rows="3">توزيع الربح الشهري</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-primary" id="profit-modal-cancel">إلغاء</button>
                    <button type="submit" class="btn btn-primary" id="profit-modal-submit">توزيع الربح</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    document.getElementById('profit-date').value = formatDateForInput(today);
    
    // Agregar eventos
    document.getElementById('profit-modal-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-modal-cancel').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-modal-submit').addEventListener('click', function(e) {
        e.preventDefault();
        
        const form = document.getElementById('profit-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const investorId = parseInt(document.getElementById('profit-investor-id').value);
        const amount = parseFloat(document.getElementById('profit-amount').value);
        const date = document.getElementById('profit-date').value;
        const details = document.getElementById('profit-details').value;
        
        if (!date) {
            showAlert('يرجى تحديد تاريخ التوزيع', 'danger');
            return;
        }
        
        // Crear operación de ganancia
        const profitOperation = {
            investorId,
            type: 'profit',
            amount,
            date,
            details: details || 'توزيع الربح الشهري',
            createdAt: new Date().toISOString()
        };
        
        // Guardar operación
        addOperation(profitOperation);
        
        // Cerrar modal
        document.body.removeChild(modalOverlay);
    });
}

// Editar operación
function editOperation(id) {
    const operation = operationsData.find(op => op.id === id);
    if (!operation) {
        showAlert('No se encontró la operación', 'danger');
        return;
    }
    
    operationForm.reset();
    operationForm.setAttribute('data-mode', 'edit');
    operationForm.setAttribute('data-id', id);
    
    operationTypeSelect.value = operation.type;
    operationModalTitle.textContent = operation.type === 'deposit' ? 'تعديل إيداع' : operation.type === 'withdrawal' ? 'تعديل سحب' : 'تعديل ربح';
    
    // Llenar formulario
    document.getElementById('operation-investor').value = operation.investorId;
    document.getElementById('operation-amount').value = operation.amount;
    operationDateInput.value = formatDateForInput(new Date(operation.date));
    document.getElementById('operation-details').value = operation.details || '';
    
    // Validar fecha
    const validation = validateInvestmentDate(operation.date);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
    
    // Bloquear cambio de tipo y inversor en edición
    operationTypeSelect.disabled = true;
    document.getElementById('operation-investor').disabled = true;
}

// Ver detalles de operación
function viewOperation(id) {
    const operation = operationsData.find(op => op.id === id);
    if (!operation) {
        showAlert('No se encontró la operación', 'danger');
        return;
    }
    
    const investor = getInvestorById(operation.investorId);
    if (!investor) {
        showAlert('No se encontró al inversor asociado', 'danger');
        return;
    }
    
    // Crear modal de detalles
    createOperationDetailsModal(operation, investor);
}

// Crear modal de detalles de operación
function createOperationDetailsModal(operation, investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('operation-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    let typeClass = '';
    let typeText = '';
    
    if (operation.type === 'deposit') {
        typeClass = 'status-deposit';
        typeText = 'إيداع';
    } else if (operation.type === 'withdrawal') {
        typeClass = 'status-withdrawal';
        typeText = 'سحب';
    } else if (operation.type === 'profit') {
        typeClass = 'status-profit';
        typeText = 'أرباح';
    }
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'operation-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل العملية</div>
                    <span class="close-modal" id="operation-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="stat-card" style="margin-bottom: 20px;">
                        <div class="stat-icon" style="background: linear-gradient(135deg, ${operation.type === 'deposit' ? 'var(--success-color), #6deca9' : operation.type === 'withdrawal' ? 'var(--danger-color), #ff8f8f' : 'var(--warning-color), #ffd54f'});">
                            <i class="fas fa-${operation.type === 'deposit' ? 'arrow-up' : operation.type === 'withdrawal' ? 'arrow-down' : 'money-bill-wave'}"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">${formatCurrency(operation.amount)}</div>
                            <div class="stat-label"><div class="status-pill ${typeClass}">${typeText}</div></div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div>
                            <div style="font-weight: bold;">المستثمر</div>
                            <div>${investor.name}</div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">تاريخ العملية</div>
                            <div>${formatDate(operation.date)}</div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">حالة العملية</div>
                            <div><div class="status-pill status-deposit">مكتمل</div></div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">تاريخ الإنشاء</div>
                            <div>${formatDate(operation.createdAt || operation.date)}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold;">تفاصيل العملية</div>
                        <div>${operation.details || '-'}</div>
                    </div>
                    
                    ${operation.type !== 'profit' ? `
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold;">تأثير على الربح الشهري</div>
                        <div>${operation.type === 'deposit' ? '+' : '-'}${formatCurrency(calculateProfit(operation.amount))}</div>
                    </div>
                    ` : ''}
                    
                    <div class="alert ${operation.type === 'deposit' ? 'alert-success' : operation.type === 'withdrawal' ? 'alert-danger' : 'alert-warning'}">
                        <i class="fas fa-info-circle"></i>
                        ${operation.type === 'deposit' ? 'تمت عملية الإيداع بنجاح وتمت إضافة المبلغ إلى رصيد المستثمر.' : operation.type === 'withdrawal' ? 'تمت عملية السحب بنجاح وتم خصم المبلغ من رصيد المستثمر.' : 'تم توزيع الربح بنجاح على المستثمر.'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="operation-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary edit-operation-btn" data-id="${operation.id}">تعديل</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos
    document.getElementById('operation-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('operation-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.querySelector('.edit-operation-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        editOperation(operation.id);
    });
}

// Ver detalle de ganancia
function viewProfit(id) {
    const investor = getInvestorById(id);
    if (!investor) {
        showAlert('No se encontró al inversor', 'danger');
        return;
    }
    
    // Crear modal de detalle de ganancia
    createProfitDetailsModal(investor);
}

// Crear modal de detalle de ganancia
function createProfitDetailsModal(investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('profit-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const totalInvestment = calculateTotalInvestment(investor.id);
    const monthlyProfit = calculateMonthlyProfit(investor.id);
    const yearlyProfit = monthlyProfit * 12;
    const yearlyProfitRate = (yearlyProfit / totalInvestment) * 100;
    
    // Obtener operaciones de ganancia
    const profitOperations = operationsData.filter(op => op.investorId === investor.id && op.type === 'profit');
    
    // Calcular total de ganancias recibidas
    let totalProfitsReceived = 0;
    profitOperations.forEach(op => {
        totalProfitsReceived += op.amount;
    });
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'profit-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل أرباح: ${investor.name}</div>
                    <span class="close-modal" id="profit-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalInvestment)}</div>
                                <div class="stat-label">إجمالي الاستثمار</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--success-color), #6deca9);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(monthlyProfit)}</div>
                                <div class="stat-label">الربح الشهري</div>
                                <div class="stat-change positive">
                                    <i class="fas fa-percentage"></i>
                                    ${settings.interestRate}% شهرياً
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--warning-color), #ffd54f);">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(yearlyProfit)}</div>
                                <div class="stat-label">الربح السنوي المتوقع</div>
                                <div class="stat-change positive">
                                    <i class="fas fa-percentage"></i>
                                    ${yearlyProfitRate.toFixed(2)}% سنوياً
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--info-color), #67d4f5);">
                                <i class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalProfitsReceived)}</div>
                                <div class="stat-label">إجمالي الأرباح المستلمة</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div class="card-title">
                                <i class="fas fa-money-bill-wave"></i>
                                سجل توزيع الأرباح
                            </div>
                            <div>
                                <button class="btn btn-warning btn-round distribute-profit-btn" data-id="${investor.id}">
                                    <i class="fas fa-money-bill-wave"></i>
                                    توزيع الربح
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>المبلغ</th>
                                        <th>تاريخ التوزيع</th>
                                        <th>التفاصيل</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateProfitOperationsRows(profitOperations)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-chart-bar"></i>
                            تحليل أرباح ${investor.name}
                        </div>
                        <div id="profit-chart-container" style="height: 300px;">
                            <canvas id="profit-chart"></canvas>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-calculator"></i>
                            تفاصيل حساب الربح
                        </div>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            يتم حساب الربح الشهري بضرب إجمالي الاستثمار (${formatCurrency(totalInvestment)}) بنسبة الفائدة الشهرية (${settings.interestRate}%) = ${formatCurrency(monthlyProfit)}
                        </div>
                        ${settings.proportionalProfits === 'enabled' ? `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            ملاحظة: تم تفعيل خاصية حساب الأرباح النسبية. في حالة إيداع أو سحب مبلغ خلال الشهر، سيتم حساب الربح بناءً على عدد أيام الاستثمار.
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="profit-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary view-investor-btn" data-id="${investor.id}">عرض المستثمر</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos
    document.getElementById('profit-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.querySelector('.view-investor-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        viewInvestor(investor.id);
    });
    
    document.querySelector('.distribute-profit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        distributeProfit(investor.id);
    });
    
    // Generar gráfico de ganancias
    setTimeout(() => {
        generateProfitChart(investor.id);
    }, 100);
}

// Generar filas de operaciones de ganancia
function generateProfitOperationsRows(operations) {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedOperations.length === 0) {
        return '<tr><td colspan="4" style="text-align: center;">لا توجد عمليات توزيع أرباح</td></tr>';
    }
    
    let rows = '';
    
    sortedOperations.forEach(operation => {
        rows += `
            <tr>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td>${operation.details || '-'}</td>
                <td><div class="status-pill status-deposit">مكتمل</div></td>
            </tr>
        `;
    });
    
    return rows;
}

// Generar gráfico para ganancias
function generateProfitChart(investorId) {
    const profitOperations = operationsData.filter(op => op.investorId === investorId && op.type === 'profit');
    
    if (profitOperations.length === 0) {
        return;
    }
    
    // Ordenar operaciones por fecha
    const sortedOperations = [...profitOperations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Preparar datos para el gráfico
    const dates = [];
    const profitData = [];
    const cumulativeProfitData = [];
    
    let cumulative = 0;
    
    sortedOperations.forEach(operation => {
        const formattedDate = formatDate(operation.date);
        cumulative += operation.amount;
        
        dates.push(formattedDate);
        profitData.push(operation.amount);
        cumulativeProfitData.push(cumulative);
    });
    
    // Crear gráfico
    const canvas = document.getElementById('profit-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Eliminar gráfico existente si lo hay
    if (window.profitChart) {
        window.profitChart.destroy();
    }
    
    window.profitChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'الربح الشهري',
                    data: profitData,
                    backgroundColor: 'rgba(255, 193, 7, 0.5)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                },
                {
                    label: 'الأرباح المتراكمة',
                    data: cumulativeProfitData,
                    type: 'line',
                    fill: false,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'التاريخ'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'الربح الشهري'
                    },
                    beginAtZero: true
                },
                y1: {
                    title: {
                        display: true,
                        text: 'الأرباح المتراكمة'
                    },
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'تحليل توزيع الأرباح'
                }
            }
        }
    });
}

// Cerrar modal de inversor
function closeInvestorModal() {
    investorModalOverlay.style.display = 'none';
}

// Cerrar modal de operación
function closeOperationModal() {
    operationModalOverlay.style.display = 'none';
}

// Cerrar todos los modales
function closeAllModals() {
    investorModalOverlay.style.display = 'none';
    operationModalOverlay.style.display = 'none';
}

// Panel de notificaciones
function toggleNotificationsPanel() {
    // Eliminar panel existente si hay uno
    const existingPanel = document.getElementById('notifications-panel');
    if (existingPanel) {
        document.body.removeChild(existingPanel);
        return;
    }
    
    // Crear panel de notificaciones
    createNotificationsPanel();
}

// Crear panel de notificaciones
function createNotificationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'notifications-panel';
    panel.style.position = 'absolute';
    panel.style.top = '60px';
    panel.style.left = '20px';
    panel.style.width = '350px';
    panel.style.maxHeight = '500px';
    panel.style.overflow = 'auto';
    panel.style.backgroundColor = 'white';
    panel.style.boxShadow = 'var(--shadow-lg)';
    panel.style.borderRadius = 'var(--radius-lg)';
    panel.style.zIndex = '1000';
    panel.style.direction = 'rtl';
    
    // Cargar notificaciones
    loadNotifications();
    
    // Ordenar notificaciones (no leídas primero, luego por fecha)
    const sortedNotifications = [...notificationsData].sort((a, b) => {
        if (a.read !== b.read) {
            return a.read ? 1 : -1;
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    // Crear contenido
    let panelContent = `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; font-size: var(--font-lg);">الإشعارات</div>
            <div>
                <button class="btn btn-sm btn-outline-primary mark-all-read-btn">
                    <i class="fas fa-check-double"></i>
                    تحديد الكل كمقروء
                </button>
            </div>
        </div>
        <div class="notifications-container">
    `;
    
    if (sortedNotifications.length === 0) {
        panelContent += `
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 10px;"></i>
                <div>لا توجد إشعارات</div>
            </div>
        `;
    } else {
        sortedNotifications.forEach(notification => {
            let iconClass = '';
            
            if (notification.type === 'success') {
                iconClass = 'notification-success';
            } else if (notification.type === 'danger') {
                iconClass = 'notification-danger';
            } else if (notification.type === 'warning') {
                iconClass = 'notification-warning';
            } else {
                iconClass = 'notification-info';
            }
            
            panelContent += `
                <div class="notification-item" ${notification.read ? '' : 'style="background-color: rgba(114, 103, 239, 0.1);"'}>
                    <div class="notification-icon ${iconClass}">
                        <i class="fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'danger' ? 'exclamation-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${formatRelativeTime(notification.date)}</div>
                        <div class="notification-actions">
                            <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${notification.id}">
                                ${notification.read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    panelContent += `
        </div>
        <div style="padding: 10px; border-top: 1px solid var(--border-color); text-align: center;">
            <a href="#" class="show-all-notifications-btn" style="color: var(--primary-color); text-decoration: none;">عرض كل الإشعارات</a>
        </div>
    `;
    
    panel.innerHTML = panelContent;
    document.body.appendChild(panel);
    
    // Botón marcar todo como leído
    panel.querySelector('.mark-all-read-btn').addEventListener('click', function() {
        markAllNotificationsAsRead();
        document.body.removeChild(panel);
    });
    
    // Botones marcar como leído/no leído
    panel.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            toggleNotificationReadStatus(id);
            document.body.removeChild(panel);
        });
    });
    
    // Enlace a página de notificaciones
    panel.querySelector('.show-all-notifications-btn').addEventListener('click', function(e) {
        e.preventDefault();
        document.body.removeChild(panel);
        
        // Navegar a la página de notificaciones
        const notificationsMenuItem = document.querySelector('[data-page="notifications"]');
        if (notificationsMenuItem) {
            notificationsMenuItem.click();
        }
    });
    
    // Cerrar al hacer clic fuera del panel
    document.addEventListener('click', function closePanel(e) {
        if (panel && !panel.contains(e.target) && !document.querySelector('.notification-btn').contains(e.target)) {
            document.body.removeChild(panel);
            document.removeEventListener('click', closePanel);
        }
    });
}

// ========================
// Manipulación de Formularios
// ========================

// Validar fecha de inversión
function validateInvestorDate() {
    const dateString = investorDateInput.value;
    const validation = validateInvestmentDate(dateString);
    
    investorDateMessage.textContent = validation.message;
    investorDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    return validation.valid;
}

// Validar fecha de operación
function validateOperationDate() {
    const dateString = operationDateInput.value;
    const validation = validateInvestmentDate(dateString);
    
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    return validation.valid;
}

// Manejar envío de formulario de inversor
function handleInvestorFormSubmit(event) {
    event.preventDefault();
    
    // Validar formulario
    if (!this.checkValidity()) {
        this.reportValidity();
        return;
    }
    
    // Validar fecha
    if (!validateInvestorDate()) {
        return;
    }
    
    const mode = this.getAttribute('data-mode');
    const id = this.getAttribute('data-id');
    
    const name = document.getElementById('investor-name').value;
    const phone = document.getElementById('investor-phone').value;
    const address = document.getElementById('investor-address').value;
    const idCard = document.getElementById('investor-id-card').value;
    const email = document.getElementById('investor-email').value;
    const job = document.getElementById('investor-job').value;
    const amount = parseFloat(document.getElementById('investor-amount').value);
    const date = document.getElementById('investor-date').value;
    const notes = document.getElementById('investor-notes').value;
    
    if (mode === 'edit') {
        // Actualizar inversor existente
        const investor = {
            id: parseInt(id),
            name,
            phone,
            address,
            idCard,
            email,
            job,
            notes,
            date,
            updatedAt: new Date().toISOString()
        };
        
        updateInvestor(investor);
    } else {
        // Agregar nuevo inversor
        const investor = {
            name,
            phone,
            address,
            idCard,
            email,
            job,
            amount,
            date,
            notes,
            createdAt: new Date().toISOString()
        };
        
        addInvestor(investor);
    }
    
    // Cerrar modal
    closeInvestorModal();
}

// Manejar envío de formulario de operación
function handleOperationFormSubmit(event) {
    event.preventDefault();
    
    // Validar formulario
    if (!this.checkValidity()) {
        this.reportValidity();
        return;
    }
    
    // Validar fecha
    if (!validateOperationDate()) {
        return;
    }
    
    const mode = this.getAttribute('data-mode');
    const id = this.getAttribute('data-id');
    
    const investorId = parseInt(document.getElementById('operation-investor').value);
    const type = document.getElementById('operation-type').value;
    const amount = parseFloat(document.getElementById('operation-amount').value);
    const date = document.getElementById('operation-date').value;
    const details = document.getElementById('operation-details').value;
    
    // Validar inversor
    if (!investorId) {
        showAlert('يرجى اختيار المستثمر', 'danger');
        return;
    }
    
    // Validar monto de retiro
    if (type === 'withdrawal') {
        const totalInvestment = calculateTotalInvestment(investorId);
        if (amount > totalInvestment) {
            showAlert('مبلغ السحب أكبر من المبلغ المستثمر الحالي', 'danger');
            return;
        }
    }
    
    if (mode === 'edit') {
        // Actualizar operación existente
        const operation = {
            id: parseInt(id),
            investorId,
            type,
            amount,
            date,
            details,
            updatedAt: new Date().toISOString()
        };
        
        updateOperation(operation);
    } else {
        // Agregar nueva operación
        const operation = {
            investorId,
            type,
            amount,
            date,
            details,
            profit: calculateProfit(amount),
            createdAt: new Date().toISOString()
        };
        
        addOperation(operation);
    }
    
    // Cerrar modal
    closeOperationModal();
}

// Manejar importación de datos
function handleImportData() {
    const fileInput = document.getElementById('import-data-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('يرجى اختيار ملف', 'warning');
        return;
    }
    
    // Mostrar confirmación
    if (!confirm('سيؤدي استيراد البيانات إلى استبدال البيانات الحالية. هل تريد المتابعة؟')) {
        return;
    }
    
    // Leer archivo
    const reader = new FileReader();
    
    // Mostrar cargador
    loaderOverlay.style.display = 'flex';
    
    reader.onload = function(event) {
        importData(event.target.result);
    };
    
    reader.onerror = function() {
        loaderOverlay.style.display = 'none';
        showAlert('حدث خطأ أثناء قراءة الملف', 'danger');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// ========================
// Funciones de Base de Datos
// ========================

// Cargar configuración desde la base de datos
function loadSettings() {
    if (!db) return;
    
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(1);
    
    request.onsuccess = function(event) {
        if (event.target.result) {
            const storedSettings = event.target.result;
            
            // Actualizar objeto de configuración con valores almacenados
            Object.keys(settings).forEach(key => {
                if (storedSettings[key] !== undefined) {
                    settings[key] = storedSettings[key];
                }
            });
            
            // Actualizar UI con configuración
            updateSettingsUI();
        } else {
            // Guardar configuración predeterminada si no existe
            saveSettings();
        }
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar configuración:', event.target.error);
    };
}

// Cargar inversores desde la base de datos
function loadInvestors() {
    if (!db) return;
    
    const transaction = db.transaction(['investors'], 'readonly');
    const store = transaction.objectStore('investors');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        investorsData = event.target.result;
        
        // Actualizar tabla de inversores
        updateInvestorsTable();
        
        // Actualizar dropdown de inversores en el formulario de operaciones
        updateInvestorDropdown();
        
        // Actualizar tabla de ganancias
        updateProfitsTable();
        
        // Actualizar estadísticas del dashboard
        updateDashboardStats();
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar inversores:', event.target.error);
    };
}

// Cargar operaciones desde la base de datos
function loadOperations() {
    if (!db) return;
    
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        operationsData = event.target.result;
        
        // Actualizar tablas
        updateOperationsTable();
        updateProfitsTable();
        updateDashboardStats();
        
        // Actualizar gráficos
        updateAllCharts();
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar operaciones:', event.target.error);
    };
}

// Cargar ganancias desde la base de datos
function loadProfits() {
    if (!db) return;
    
    const transaction = db.transaction(['profits'], 'readonly');
    const store = transaction.objectStore('profits');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        profitsData = event.target.result;
        
        // Actualizar UI
        updateProfitsTable();
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar ganancias:', event.target.error);
    };
}

// Cargar notificaciones desde la base de datos
function loadNotifications() {
    if (!db) return;
    
    const transaction = db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        notificationsData = event.target.result;
        
        // Actualizar contador de notificaciones
        updateNotificationBadge();
        
        // Actualizar panel de notificaciones si estamos en esa página
        if (getActivePage() === 'notifications') {
            updateNotificationsPanel();
        }
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar notificaciones:', event.target.error);
    };
}

// Cargar eventos desde la base de datos
function loadEvents() {
    if (!db) return;
    
    const transaction = db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        eventsData = event.target.result;
        
        // Actualizar eventos en el calendario
        updateCalendarEvents();
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar eventos:', event.target.error);
    };
}

// Cargar respaldos desde la base de datos
function loadBackups() {
    if (!db) return;
    
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        backupsData = event.target.result;
        
        // Actualizar tabla de respaldos
        updateBackupsTable();
    };
    
    request.onerror = function(event) {
        console.error('Error al cargar respaldos:', event.target.error);
    };
}

// Agregar inversor a la base de datos
function addInvestor(investor) {
    if (!db) return;
    
    const transaction = db.transaction(['investors'], 'readwrite');
    const store = transaction.objectStore('investors');
    
    // Verificar si la tarjeta de identidad ya existe
    const index = store.index('idCard');
    const idCardRequest = index.get(investor.idCard);
    
    idCardRequest.onsuccess = function(event) {
        if (event.target.result) {
            showAlert('رقم البطاقة الشخصية مستخدم بالفعل', 'danger');
            return;
        }
        
        // Agregar inversor si la tarjeta de identidad es única
        const request = store.add(investor);
        
        request.onsuccess = function(event) {
            const investorId = event.target.result;
            
            // Agregar operación de depósito inicial
            if (investor.amount > 0) {
                const depositOperation = {
                    investorId,
                    type: 'deposit',
                    amount: investor.amount,
                    date: investor.date,
                    profit: calculateProfit(investor.amount),
                    details: 'إيداع أولي',
                    createdAt: new Date().toISOString()
                };
                
                addOperation(depositOperation);
            }
            
            // Agregar evento al calendario
            const investorEvent = {
                title: `مستثمر جديد: ${investor.name}`,
                date: investor.date,
                type: 'new_investor',
                investorId,
                createdAt: new Date().toISOString()
            };
            
            addEvent(investorEvent);
            
            // Agregar notificación
            const notification = {
                title: 'مستثمر جديد',
                message: `تم إضافة مستثمر جديد: ${investor.name}`,
                type: 'success',
                date: new Date().toISOString(),
                read: false
            };
            
            addNotification(notification);
            
            // Recargar inversores
            loadInvestors();
            
            // Mostrar mensaje de éxito
            showAlert('تم إضافة المستثمر بنجاح', 'success');
        };
        
        request.onerror = function(event) {
            console.error('Error al agregar inversor:', event.target.error);
            showAlert('حدث خطأ أثناء إضافة المستثمر', 'danger');
        };
    };
}

// Actualizar inversor en la base de datos
function updateInvestor(investor) {
    if (!db) return;
    
    const transaction = db.transaction(['investors'], 'readwrite');
    const store = transaction.objectStore('investors');
    
    // Verificar si la tarjeta de identidad ya existe para otro inversor
    const index = store.index('idCard');
    const idCardRequest = index.get(investor.idCard);
    
    idCardRequest.onsuccess = function(event) {
        const existingInvestor = event.target.result;
        
        if (existingInvestor && existingInvestor.id !== investor.id) {
            showAlert('رقم البطاقة الشخصية مستخدم بالفعل لمستثمر آخر', 'danger');
            return;
        }
        
        // Obtener inversor actual para preservar campos que no se actualizan
        const getRequest = store.get(investor.id);
        
        getRequest.onsuccess = function(event) {
            const currentInvestor = event.target.result;
            
            if (!currentInvestor) {
                showAlert('لم يتم العثور على المستثمر', 'danger');
                return;
            }
            
            // Preservar campos que no se actualizan
            const updatedInvestor = {
                ...currentInvestor,
                ...investor,
                amount: currentInvestor.amount, // Preservar monto inicial
                updatedAt: new Date().toISOString()
            };
            
            // Actualizar inversor
            const updateRequest = store.put(updatedInvestor);
            
            updateRequest.onsuccess = function() {
                // Recargar inversores
                loadInvestors();
                
                // Agregar notificación
                const notification = {
                    title: 'تحديث بيانات مستثمر',
                    message: `تم تحديث بيانات المستثمر: ${updatedInvestor.name}`,
                    type: 'info',
                    date: new Date().toISOString(),
                    read: false
                };
                
                addNotification(notification);
                
                // Mostrar mensaje de éxito
                showAlert('تم تحديث بيانات المستثمر بنجاح', 'success');
            };
            
            updateRequest.onerror = function(event) {
                console.error('Error al actualizar inversor:', event.target.error);
                showAlert('حدث خطأ أثناء تحديث بيانات المستثمر', 'danger');
            };
        };
    };
}

// Eliminar inversor de la base de datos
function deleteInvestor(id) {
    if (!db) return;
    
    // Mostrar confirmación
    if (!confirm('هل أنت متأكد من حذف هذا المستثمر؟ سيتم حذف جميع العمليات المرتبطة به.')) {
        return;
    }
    
    // Obtener nombre del inversor para notificación
    const investor = getInvestorById(id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    const transaction = db.transaction(['investors', 'operations'], 'readwrite');
    const investorsStore = transaction.objectStore('investors');
    const operationsStore = transaction.objectStore('operations');
    
    // Eliminar operaciones del inversor
    const operationsIndex = operationsStore.index('investorId');
    const operationsRequest = operationsIndex.openCursor(IDBKeyRange.only(id));
    
    operationsRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            operationsStore.delete(cursor.value.id);
            cursor.continue();
        }
    };
    
    // Eliminar inversor
    const deleteRequest = investorsStore.delete(id);
    
    deleteRequest.onsuccess = function() {
        // Recargar inversores y operaciones
        loadInvestors();
        loadOperations();
        
        // Agregar notificación
        const notification = {
            title: 'حذف مستثمر',
            message: `تم حذف المستثمر: ${investor.name}`,
            type: 'danger',
            date: new Date().toISOString(),
            read: false
        };
        
        addNotification(notification);
        
        // Mostrar mensaje de éxito
        showAlert('تم حذف المستثمر بنجاح', 'success');
    };
    
    deleteRequest.onerror = function(event) {
        console.error('Error al eliminar inversor:', event.target.error);
        showAlert('حدث خطأ أثناء حذف المستثمر', 'danger');
    };
}

// Agregar operación a la base de datos
function addOperation(operation) {
    if (!db) return;
    
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    // Validar monto de retiro
    if (operation.type === 'withdrawal') {
        const totalInvestment = calculateTotalInvestment(operation.investorId);
        if (operation.amount > totalInvestment) {
            showAlert('مبلغ السحب أكبر من المبلغ المستثمر الحالي', 'danger');
            return;
        }
    }
    
    const request = store.add(operation);
    
    request.onsuccess = function(event) {
        const investor = getInvestorById(operation.investorId);
        
        // Agregar notificación
        let notificationTitle, notificationMessage, notificationType;
        
        if (operation.type === 'deposit') {
            notificationTitle = 'إيداع جديد';
            notificationMessage = `تم إيداع مبلغ ${formatCurrency(operation.amount)} للمستثمر ${investor?.name || 'غير معروف'}`;
            notificationType = 'success';
        } else if (operation.type === 'withdrawal') {
            notificationTitle = 'سحب جديد';
            notificationMessage = `تم سحب مبلغ ${formatCurrency(operation.amount)} من المستثمر ${investor?.name || 'غير معروف'}`;
            notificationType = 'danger';
        } else if (operation.type === 'profit') {
            notificationTitle = 'توزيع أرباح';
            notificationMessage = `تم توزيع ربح بمبلغ ${formatCurrency(operation.amount)} للمستثمر ${investor?.name || 'غير معروف'}`;
            notificationType = 'warning';
        }
        
        const notification = {
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            date: new Date().toISOString(),
            read: false
        };
        
        addNotification(notification);
        
        // Agregar evento al calendario
        const operationEvent = {
            title: `${operation.type === 'deposit' ? 'إيداع' : operation.type === 'withdrawal' ? 'سحب' : 'توزيع أرباح'}: ${investor?.name || 'غير معروف'}`,
            date: operation.date,
            type: operation.type,
            investorId: operation.investorId,
            operationId: event.target.result,
            amount: operation.amount,
            createdAt: new Date().toISOString()
        };
        
        addEvent(operationEvent);
        
        // Recargar operaciones
        loadOperations();
        
        // Mostrar mensaje de éxito
        showAlert(`تم ${operation.type === 'deposit' ? 'إضافة الإيداع' : operation.type === 'withdrawal' ? 'إضافة السحب' : 'توزيع الربح'} بنجاح`, 'success');
    };
    
    request.onerror = function(event) {
        console.error('Error al agregar operación:', event.target.error);
        showAlert('حدث خطأ أثناء إضافة العملية', 'danger');
    };
}

// Actualizar operación en la base de datos
function updateOperation(operation) {
    if (!db) return;
    
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    // Obtener operación actual para preservar campos que no se actualizan
    const getRequest = store.get(operation.id);
    
    getRequest.onsuccess = function(event) {
        const currentOperation = event.target.result;
        
        if (!currentOperation) {
            showAlert('لم يتم العثور على العملية', 'danger');
            return;
        }
        
        // Preservar campos que no se actualizan
        const updatedOperation = {
            ...currentOperation,
            amount: operation.amount,
            date: operation.date,
            details: operation.details,
            profit: calculateProfit(operation.amount),
            updatedAt: new Date().toISOString()
        };
        
        // Validar monto de retiro
        if (updatedOperation.type === 'withdrawal') {
            const totalInvestment = calculateTotalInvestment(updatedOperation.investorId);
            // Sumar el monto actual de la operación para validar
            const availableAmount = totalInvestment + currentOperation.amount;
            
            if (updatedOperation.amount > availableAmount) {
                showAlert('مبلغ السحب أكبر من المبلغ المستثمر المتاح', 'danger');
                return;
            }
        }
        
        // Actualizar operación
        const updateRequest = store.put(updatedOperation);
        
        updateRequest.onsuccess = function() {
            // Actualizar eventos del calendario
            updateEventForOperation(updatedOperation);
            
            // Recargar operaciones
            loadOperations();
            
            // Mostrar mensaje de éxito
            showAlert('تم تحديث العملية بنجاح', 'success');
        };
        
        updateRequest.onerror = function(event) {
            console.error('Error al actualizar operación:', event.target.error);
            showAlert('حدث خطأ أثناء تحديث العملية', 'danger');
        };
    };
}

// Eliminar operación
function deleteOperation(id) {
    if (!db) return;
    
    // Mostrar confirmación
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) {
        return;
    }
    
    // Obtener operación para notificación
    const operation = operationsData.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    const investor = getInvestorById(operation.investorId);
    
    const transaction = db.transaction(['operations', 'events'], 'readwrite');
    const operationsStore = transaction.objectStore('operations');
    const eventsStore = transaction.objectStore('events');
    
    // Eliminar eventos asociados
    const eventsIndex = eventsStore.index('type');
    const eventsRequest = eventsIndex.openCursor(IDBKeyRange.only(operation.type));
    
    eventsRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const evt = cursor.value;
            if (evt.operationId === id) {
                eventsStore.delete(evt.id);
            }
            cursor.continue();
        }
    };
    
    // Eliminar operación
    const deleteRequest = operationsStore.delete(id);
    
    deleteRequest.onsuccess = function() {
        // Recargar operaciones
        loadOperations();
        
        // Agregar notificación
        const notification = {
            title: 'حذف عملية',
            message: `تم حذف ${operation.type === 'deposit' ? 'إيداع' : operation.type === 'withdrawal' ? 'سحب' : 'توزيع أرباح'} للمستثمر ${investor?.name || 'غير معروف'}`,
            type: 'danger',
            date: new Date().toISOString(),
            read: false
        };
        
        addNotification(notification);
        
        // Mostrar mensaje de éxito
        showAlert('تم حذف العملية بنجاح', 'success');
    };
    
    deleteRequest.onerror = function(event) {
        console.error('Error al eliminar operación:', event.target.error);
        showAlert('حدث خطأ أثناء حذف العملية', 'danger');
    };
}

// Eliminar ganancia
function deleteProfit(id) {
    // Las ganancias son operaciones de tipo 'profit'
    deleteOperation(id);
}

// Agregar notificación
function addNotification(notification) {
    if (!db) return;
    
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.add(notification);
    
    request.onsuccess = function() {
        // Actualizar lista de notificaciones
        loadNotifications();
        
        // Reproducir sonido de notificación si está disponible
        playNotificationSound();
    };
    
    request.onerror = function(event) {
        console.error('Error al agregar notificación:', event.target.error);
    };
}

// Reproducir sonido de notificación
function playNotificationSound() {
    try {
        const audio = new Audio('notification.mp3');
        audio.play().catch(error => {
            console.warn('No se pudo reproducir el sonido de notificación:', error);
        });
    } catch (error) {
        console.warn('No se pudo reproducir el sonido de notificación:', error);
    }
}

// Marcar notificación como leída/no leída
function toggleNotificationReadStatus(id) {
    if (!db) return;
    
    const notification = notificationsData.find(n => n.id === id);
    if (!notification) return;
    
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const updatedNotification = {
        ...notification,
        read: !notification.read
    };
    
    const request = store.put(updatedNotification);
    
    request.onsuccess = function() {
        // Actualizar lista de notificaciones
        loadNotifications();
    };
    
    request.onerror = function(event) {
        console.error('Error al actualizar notificación:', event.target.error);
    };
}

// Marcar todas las notificaciones como leídas
function markAllNotificationsAsRead() {
    if (!db) return;
    
    const transaction = db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.openCursor();
    
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const notification = cursor.value;
            if (!notification.read) {
                notification.read = true;
                store.put(notification);
            }
            cursor.continue();
        } else {
            // Actualizar lista de notificaciones
            loadNotifications();
            
            // Mostrar mensaje de éxito
            showAlert('تم تحديد جميع الإشعارات كمقروءة', 'success');
        }
    };
    
    request.onerror = function(event) {
        console.error('Error al marcar notificaciones como leídas:', event.target.error);
    };
}

// Actualizar contador de notificaciones
function updateNotificationBadge() {
    const unreadCount = notificationsData.filter(n => !n.read).length;
    
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    
    const menuBadge = document.querySelector('.menu-badge');
    if (menuBadge) {
        menuBadge.textContent = unreadCount;
        menuBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    
    // Actualizar favicon con contador si hay notificaciones no leídas
    updateFaviconBadge(unreadCount);
}

// Actualizar favicon con contador
function updateFaviconBadge(count) {
    if (count <= 0) return;
    
    try {
        // Código para actualizar favicon con contador (opcional)
    } catch (error) {
        console.warn('No se pudo actualizar el favicon:', error);
    }
}

// Actualizar panel de notificaciones
function updateNotificationsPanel() {
    const notificationsContainer = document.querySelector('#notifications .notifications-container');
    if (!notificationsContainer) return;
    
    // Ordenar notificaciones (no leídas primero, luego por fecha)
    const sortedNotifications = [...notificationsData].sort((a, b) => {
        if (a.read !== b.read) {
            return a.read ? 1 : -1;
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    if (sortedNotifications.length === 0) {
        notificationsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 10px;"></i>
                <div>لا توجد إشعارات</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    sortedNotifications.forEach(notification => {
        let iconClass = '';
        
        if (notification.type === 'success') {
            iconClass = 'notification-success';
        } else if (notification.type === 'danger') {
            iconClass = 'notification-danger';
        } else if (notification.type === 'warning') {
            iconClass = 'notification-warning';
        } else {
            iconClass = 'notification-info';
        }
        
        html += `
            <div class="notification-item" ${notification.read ? '' : 'style="background-color: rgba(114, 103, 239, 0.1);"'}>
                <div class="notification-icon ${iconClass}">
                    <i class="fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'danger' ? 'exclamation-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatRelativeTime(notification.date)}</div>
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${notification.id}">
                            ${notification.read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    notificationsContainer.innerHTML = html;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            toggleNotificationReadStatus(id);
        });
    });
}

// Agregar evento
function addEvent(event) {
    if (!db) return;
    
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    const request = store.add(event);
    
    request.onsuccess = function() {
        // Actualizar eventos del calendario
        loadEvents();
    };
    
    request.onerror = function(e) {
        console.error('Error al agregar evento:', e.target.error);
    };
}

// Actualizar evento para operación
function updateEventForOperation(operation) {
    if (!db) return;
    
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    // Buscar eventos asociados a la operación
    const index = store.index('type');
    const request = index.openCursor(IDBKeyRange.only(operation.type));
    
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const evt = cursor.value;
            if (evt.operationId === operation.id) {
                // Actualizar evento
                const investor = getInvestorById(operation.investorId);
                
                evt.title = `${operation.type === 'deposit' ? 'إيداع' : operation.type === 'withdrawal' ? 'سحب' : 'توزيع أرباح'}: ${investor?.name || 'غير معروف'}`;
                evt.date = operation.date;
                evt.amount = operation.amount;
                
                store.put(evt);
            }
            cursor.continue();
        } else {
            // Actualizar calendario
            loadEvents();
        }
    };
}

// Destacar el día de hoy en el calendario
function highlightToday() {
    const todayElement = document.querySelector('.calendar-day.today');
    if (!todayElement) return;
    
    const today = new Date();
    todayElement.innerHTML = `${today.getDate()}<div style="font-size: 10px;">اليوم</div>`;
}

// Actualizar eventos del calendario
function updateCalendarEvents() {
    // Limpiar marcadores de eventos
    document.querySelectorAll('.calendar-day.has-events').forEach(day => {
        day.classList.remove('has-events');
    });
    
    // Obtener fecha actual del calendario
    const calendarTitle = document.querySelector('.calendar-title');
    if (!calendarTitle) return;
    
    const [month, year] = calendarTitle.textContent.split(' ');
    const monthIndex = getMonthIndex(month);
    
    // Filtrar eventos por mes y año
    const filteredEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === monthIndex && eventDate.getFullYear() === parseInt(year);
    });
    
    // Marcar días con eventos
    filteredEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        
        const dayElement = document.querySelector(`.calendar-day:not(.other-month):nth-of-type(n+8):nth-child(${(7 + day) % 7 || 7}):nth-of-type(${Math.floor((6 + day) / 7) + 1})`);
        
        if (dayElement) {
            dayElement.classList.add('has-events');
        }
    });
    
    // Actualizar lista de eventos próximos
    updateUpcomingEvents();
}

// Actualizar lista de eventos próximos
function updateUpcomingEvents() {
    const upcomingEventsContainer = document.querySelector('#calendar .timeline');
    if (!upcomingEventsContainer) return;
    
    // Obtener fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrar eventos próximos (desde hoy hacia adelante)
    const upcomingEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });
    
    // Ordenar por fecha (más cercanos primero)
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Limitar a 5 eventos
    const limitedEvents = upcomingEvents.slice(0, 5);
    
    if (limitedEvents.length === 0) {
        upcomingEventsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                لا توجد أحداث قادمة
            </div>
        `;
        return;
    }
    
    let html = '';
    
    limitedEvents.forEach(event => {
        let iconColor = 'var(--primary-color)';
        
        if (event.type === 'deposit') {
            iconColor = 'var(--success-color)';
        } else if (event.type === 'withdrawal') {
            iconColor = 'var(--danger-color)';
        } else if (event.type === 'profit') {
            iconColor = 'var(--warning-color)';
        } else if (event.type === 'new_investor') {
            iconColor = 'var(--info-color)';
        }
        
        html += `
            <div class="timeline-item">
                <div class="timeline-dot" style="background-color: ${iconColor};"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${event.title}</div>
                    <div class="timeline-date">${formatDate(event.date)}</div>
                    <div>${event.amount ? formatCurrency(event.amount) : ''}</div>
                </div>
            </div>
        `;
    });
    
    upcomingEventsContainer.innerHTML = html;
}

// Navegar en el calendario
function navigateCalendar(direction) {
    const calendarTitle = document.querySelector('.calendar-title');
    if (!calendarTitle) return;
    
    const [month, year] = calendarTitle.textContent.split(' ');
    const monthIndex = getMonthIndex(month);
    
    let newMonthIndex = monthIndex + direction;
    let newYear = parseInt(year);
    
    if (newMonthIndex < 0) {
        newMonthIndex = 11;
        newYear--;
    } else if (newMonthIndex > 11) {
        newMonthIndex = 0;
        newYear++;
    }
    
    calendarTitle.textContent = `${getMonthName(newMonthIndex)} ${newYear}`;
    
    // Actualizar días del calendario
    updateCalendarDays(newMonthIndex, newYear);
    
    // Actualizar eventos
    updateCalendarEvents();
}

// Actualizar días del calendario
function updateCalendarDays(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convertir a formato de semana árabe (sábado = 0)
    
    const calendarDays = document.querySelectorAll('.calendar-day');
    if (!calendarDays.length) return;
    
    // Días del mes anterior
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
        const day = daysInPrevMonth - firstDayOfWeek + i + 1;
        calendarDays[i].textContent = day;
        calendarDays[i].className = 'calendar-day other-month';
    }
    
    // Días del mes actual
    const today = new Date();
    for (let i = 0; i < daysInMonth; i++) {
        const dayIndex = firstDayOfWeek + i;
        const day = i + 1;
        
        calendarDays[dayIndex].textContent = day;
        
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            calendarDays[dayIndex].className = 'calendar-day today';
        } else {
            calendarDays[dayIndex].className = 'calendar-day';
        }
    }
    
    // Días del mes siguiente
    const remainingCells = 42 - (firstDayOfWeek + daysInMonth);
    for (let i = 0; i < remainingCells; i++) {
        const dayIndex = firstDayOfWeek + daysInMonth + i;
        if (dayIndex < calendarDays.length) {
            calendarDays[dayIndex].textContent = i + 1;
            calendarDays[dayIndex].className = 'calendar-day other-month';
        }
    }
}

// ========================
// Actualización de Interfaz
// ========================

// Actualizar tabla de inversores
function updateInvestorsTable() {
    const tableBody = document.getElementById('investors-table-body');
    if (!tableBody) return;
    
    if (investorsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا يوجد مستثمرين</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    investorsData.forEach(investor => {
        const totalInvestment = calculateTotalInvestment(investor.id);
        const monthlyProfit = calculateMonthlyProfit(investor.id);
        
        html += `
            <tr>
                <td>${investor.name}</td>
                <td>${investor.phone}</td>
                <td>${investor.address || '-'}</td>
                <td>${investor.idCard}</td>
                <td>${formatCurrency(totalInvestment)}</td>
                <td>${formatCurrency(monthlyProfit)}</td>
                <td>
                    <div class="action-buttons">
                        <div class="action-btn view-btn" data-id="${investor.id}"><i class="fas fa-eye"></i></div>
                        <div class="action-btn edit-btn" data-id="${investor.id}"><i class="fas fa-edit"></i></div>
                        <div class="action-btn delete-btn" data-id="${investor.id}"><i class="fas fa-trash"></i></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Filtrar inversores
function filterInvestors(query) {
    const tableBody = document.getElementById('investors-table-body');
    if (!tableBody) return;
    
    if (!query) {
        updateInvestorsTable();
        return;
    }
    
    query = query.toLowerCase();
    
    const filteredInvestors = investorsData.filter(investor => {
        return (
            investor.name.toLowerCase().includes(query) ||
            investor.phone.toLowerCase().includes(query) ||
            investor.address?.toLowerCase().includes(query) ||
            investor.idCard.toLowerCase().includes(query) ||
            investor.email?.toLowerCase().includes(query)
        );
    });
    
    if (filteredInvestors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا توجد نتائج</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    filteredInvestors.forEach(investor => {
        const totalInvestment = calculateTotalInvestment(investor.id);
        const monthlyProfit = calculateMonthlyProfit(investor.id);
        
        html += `
            <tr>
                <td>${investor.name}</td>
                <td>${investor.phone}</td>
                <td>${investor.address || '-'}</td>
                <td>${investor.idCard}</td>
                <td>${formatCurrency(totalInvestment)}</td>
                <td>${formatCurrency(monthlyProfit)}</td>
                <td>
                    <div class="action-buttons">
                        <div class="action-btn view-btn" data-id="${investor.id}"><i class="fas fa-eye"></i></div>
                        <div class="action-btn edit-btn" data-id="${investor.id}"><i class="fas fa-edit"></i></div>
                        <div class="action-btn delete-btn" data-id="${investor.id}"><i class="fas fa-trash"></i></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Actualizar menú desplegable de inversores
function updateInvestorDropdown() {
    const dropdown = document.getElementById('operation-investor');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">اختر المستثمر</option>';
    
    investorsData.forEach(investor => {
        const option = document.createElement('option');
        option.value = investor.id;
        option.textContent = investor.name;
        dropdown.appendChild(option);
    });
}

// Actualizar tabla de operaciones
function updateOperationsTable() {
    const operationsTable = document.querySelector('#operations table tbody');
    if (!operationsTable) return;
    
    // Actualizar tabla principal de operaciones
    if (operationsData.length === 0) {
        operationsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا توجد عمليات</td>
            </tr>
        `;
    } else {
        let html = '';
        
        // Ordenar operaciones por fecha (más recientes primero)
        const sortedOperations = [...operationsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedOperations.forEach(operation => {
            const investor = getInvestorById(operation.investorId);
            if (!investor) return;
            
            let statusClass = '';
            let statusText = '';
            
            if (operation.type === 'deposit') {
                statusClass = 'status-deposit';
                statusText = 'إيداع';
            } else if (operation.type === 'withdrawal') {
                statusClass = 'status-withdrawal';
                statusText = 'سحب';
            } else if (operation.type === 'profit') {
                statusClass = 'status-profit';
                statusText = 'أرباح';
            }
            
            html += `
                <tr>
                    <td>${investor.name}</td>
                    <td><div class="status-pill ${statusClass}">${statusText}</div></td>
                    <td>${formatCurrency(operation.amount)}</td>
                    <td>${operation.type === 'deposit' ? '+' : operation.type === 'withdrawal' ? '-' : ''}${formatCurrency(operation.profit || calculateProfit(operation.amount))}</td>
                    <td>${formatDate(operation.date)}</td>
                    <td><div class="status-pill status-deposit">مكتمل</div></td>
                    <td>
                        <div class="action-buttons">
                            <div class="action-btn view-btn" data-id="${operation.id}"><i class="fas fa-eye"></i></div>
                            <div class="action-btn edit-btn" data-id="${operation.id}"><i class="fas fa-edit"></i></div>
                            <div class="action-btn delete-btn" data-id="${operation.id}"><i class="fas fa-trash"></i></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        operationsTable.innerHTML = html;
    }
    
    // Actualizar tabla del dashboard
    const dashboardTable = document.querySelector('#dashboard table tbody');
    if (!dashboardTable) return;
    
    if (operationsData.length === 0) {
        dashboardTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">لا توجد عمليات</td>
            </tr>
        `;
    } else {
        let html = '';
        
        // Mostrar solo las 4 operaciones más recientes en el dashboard
        const recentOperations = [...operationsData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
        
        recentOperations.forEach(operation => {
            const investor = getInvestorById(operation.investorId);
            if (!investor) return;
            
            let statusClass = '';
            let statusText = '';
            
            if (operation.type === 'deposit') {
                statusClass = 'status-deposit';
                statusText = 'إيداع';
            } else if (operation.type === 'withdrawal') {
                statusClass = 'status-withdrawal';
                statusText = 'سحب';
            } else if (operation.type === 'profit') {
                statusClass = 'status-profit';
                statusText = 'أرباح';
            }
            
            html += `
                <tr>
                    <td>${investor.name}</td>
                    <td><div class="status-pill ${statusClass}">${statusText}</div></td>
                    <td>${formatCurrency(operation.amount)}</td>
                    <td>${formatDate(operation.date)}</td>
                    <td><div class="status-pill status-deposit">مكتمل</div></td>
                    <td>
                        <div class="action-buttons">
                            <div class="action-btn view-btn" data-id="${operation.id}"><i class="fas fa-eye"></i></div>
                            <div class="action-btn edit-btn" data-id="${operation.id}"><i class="fas fa-edit"></i></div>
                            <div class="action-btn delete-btn" data-id="${operation.id}"><i class="fas fa-trash"></i></div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        dashboardTable.innerHTML = html;
    }
}

// Filtrar operaciones
function filterOperations(query) {
    const operationsTable = document.querySelector('#operations table tbody');
    if (!operationsTable) return;
    
    if (!query) {
        updateOperationsTable();
        return;
    }
    
    query = query.toLowerCase();
    
    const filteredOperations = operationsData.filter(operation => {
        const investor = getInvestorById(operation.investorId);
        if (!investor) return false;
        
        const operationType = operation.type === 'deposit' ? 'إيداع' : operation.type === 'withdrawal' ? 'سحب' : 'أرباح';
        
        return (
            investor.name.toLowerCase().includes(query) ||
            operationType.toLowerCase().includes(query) ||
            operation.amount.toString().includes(query) ||
            formatDate(operation.date).toLowerCase().includes(query) ||
            (operation.details || '').toLowerCase().includes(query)
        );
    });
    
    if (filteredOperations.length === 0) {
        operationsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا توجد نتائج</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...filteredOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOperations.forEach(operation => {
        const investor = getInvestorById(operation.investorId);
        if (!investor) return;
        
        let statusClass = '';
        let statusText = '';
        
        if (operation.type === 'deposit') {
            statusClass = 'status-deposit';
            statusText = 'إيداع';
        } else if (operation.type === 'withdrawal') {
            statusClass = 'status-withdrawal';
            statusText = 'سحب';
        } else if (operation.type === 'profit') {
            statusClass = 'status-profit';
            statusText = 'أرباح';
        }
        
        html += `
            <tr>
                <td>${investor.name}</td>
                <td><div class="status-pill ${statusClass}">${statusText}</div></td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${operation.type === 'deposit' ? '+' : operation.type === 'withdrawal' ? '-' : ''}${formatCurrency(operation.profit || calculateProfit(operation.amount))}</td>
                <td>${formatDate(operation.date)}</td>
                <td><div class="status-pill status-deposit">مكتمل</div></td>
                <td>
                    <div class="action-buttons">
                        <div class="action-btn view-btn" data-id="${operation.id}"><i class="fas fa-eye"></i></div>
                        <div class="action-btn edit-btn" data-id="${operation.id}"><i class="fas fa-edit"></i></div>
                        <div class="action-btn delete-btn" data-id="${operation.id}"><i class="fas fa-trash"></i></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    operationsTable.innerHTML = html;
}

// Actualizar tabla de ganancias
function updateProfitsTable() {
    const profitsTable = document.querySelector('#profits table tbody');
    if (!profitsTable) return;
    
    // Agrupar operaciones por inversor
    const investorOperations = {};
    
    operationsData.forEach(operation => {
        if (!investorOperations[operation.investorId]) {
            investorOperations[operation.investorId] = [];
        }
        
        investorOperations[operation.investorId].push(operation);
    });
    
    // Calcular ganancias para cada inversor
    const profits = [];
    
    Object.keys(investorOperations).forEach(investorId => {
        const investor = getInvestorById(parseInt(investorId));
        if (!investor) return;
        
        const operations = investorOperations[investorId];
        const totalInvestment = calculateTotalInvestment(parseInt(investorId));
        const monthlyProfit = calculateMonthlyProfit(parseInt(investorId));
        
        if (totalInvestment <= 0) return;
        
        // Obtener la fecha del depósito más antiguo
        const deposits = operations.filter(op => op.type === 'deposit');
        if (deposits.length === 0) return;
        
        const earliestDeposit = deposits.reduce((earliest, deposit) => {
            return new Date(deposit.date) < new Date(earliest.date) ? deposit : earliest;
        }, deposits[0]);
        
        const daysActive = calculateDaysActive(earliestDeposit.date);
        
        // Encontrar la última distribución de ganancia
        const lastProfit = operations.filter(op => op.type === 'profit').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        profits.push({
            investor,
            totalInvestment,
            monthlyProfit,
            earliestDeposit,
            daysActive,
            lastProfit
        });
    });
    
    if (profits.length === 0) {
        profitsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center;">لا يوجد أرباح</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Ordenar por monto total (mayor primero)
    profits.sort((a, b) => b.totalInvestment - a.totalInvestment);
    
    profits.forEach(profit => {
        html += `
            <tr>
                <td>${profit.investor.name}</td>
                <td>${formatCurrency(profit.totalInvestment)}</td>
                <td>${formatCurrency(profit.monthlyProfit)}</td>
                <td>${formatDate(profit.earliestDeposit.date)}</td>
                <td>${profit.daysActive}</td>
                <td>${profit.lastProfit ? formatDate(profit.lastProfit.date) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <div class="action-btn view-btn" data-id="${profit.investor.id}"><i class="fas fa-eye"></i></div>
                        <div class="action-btn edit-btn distribute-profit-btn" data-id="${profit.investor.id}"><i class="fas fa-money-bill-wave"></i></div>
                        <div class="action-btn delete-btn" data-id="${profit.investor.id}"><i class="fas fa-trash"></i></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    profitsTable.innerHTML = html;
    
    // Agregar eventos a los botones de distribución de ganancias
    document.querySelectorAll('.distribute-profit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            distributeProfit(id);
        });
    });
}

// Actualizar tabla de respaldos
function updateBackupsTable() {
    const backupsTable = document.querySelector('#backup table tbody');
    if (!backupsTable) return;
    
    if (backupsData.length === 0) {
        backupsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">لا توجد نسخ احتياطية</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    // Ordenar respaldos por fecha (más recientes primero)
    const sortedBackups = [...backupsData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedBackups.forEach(backup => {
        html += `
            <tr>
                <td>${backup.name}</td>
                <td>${formatDate(backup.date)}</td>
                <td>${backup.size} MB</td>
                <td>${backup.type === 'auto' ? 'تلقائي' : 'يدوي'}</td>
                <td>
                    <div class="action-buttons">
                        <div class="action-btn edit-btn download-backup-btn" data-id="${backup.id}"><i class="fas fa-download"></i></div>
                        <div class="action-btn view-btn restore-backup-btn" data-id="${backup.id}"><i class="fas fa-redo-alt"></i></div>
                        <div class="action-btn delete-btn" data-id="${backup.id}"><i class="fas fa-trash"></i></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    backupsTable.innerHTML = html;
    
    // Agregar eventos a los botones
    document.querySelectorAll('.download-backup-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            downloadBackup(id);
        });
    });
    
    document.querySelectorAll('.restore-backup-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            restoreBackup(id);
        });
    });
}

// Actualizar estadísticas del dashboard
function updateDashboardStats() {
    const statsElements = document.querySelectorAll('.dashboard-stats .stat-value');
    if (!statsElements.length) return;
    
    // Total de inversores
    statsElements[0].textContent = investorsData.length;
    
    // Total de inversiones
    let totalInvestments = 0;
    investorsData.forEach(investor => {
        totalInvestments += calculateTotalInvestment(investor.id);
    });
    statsElements[1].textContent = formatCurrency(totalInvestments, false);
    
    // Ganancias mensuales
    let totalMonthlyProfits = 0;
    investorsData.forEach(investor => {
        totalMonthlyProfits += calculateMonthlyProfit(investor.id);
    });
    statsElements[2].textContent = formatCurrency(totalMonthlyProfits, false);
    
    // Operaciones mensuales
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyOperations = operationsData.filter(operation => {
        const operationDate = new Date(operation.date);
        return operationDate >= firstDayOfMonth && operationDate <= lastDayOfMonth;
    });
    
    statsElements[3].textContent = monthlyOperations.length;
}

// Actualizar UI de configuración
function updateSettingsUI() {
    // Actualizar campos de formulario de configuración
    document.getElementById('interest-rate').value = settings.interestRate;
    document.getElementById('currency').value = settings.currency;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('primary-color').value = settings.primaryColor;
    document.getElementById('language').value = settings.language;
    document.getElementById('timezone').value = settings.timezone;
    document.getElementById('date-format').value = settings.dateFormat;
    document.getElementById('time-format').value = settings.timeFormat;
    document.getElementById('sidebar-mode').value = settings.sidebarMode;
    document.getElementById('font-size').value = settings.fontSize;
    document.getElementById('auto-logout').value = settings.autoLogout;
    document.getElementById('two-factor').value = settings.twoFactor;
    document.getElementById('user-activity').value = settings.userActivity;
    document.getElementById('auto-backup').value = settings.autoBackup;
    document.getElementById('profit-day').value = settings.profitDay;
    document.getElementById('proportional-profits').value = settings.proportionalProfits;
    
    // Aplicar configuración de tema
    applyThemeSettings();
}

// Aplicar configuración de tema
function applyThemeSettings() {
    // Aplicar tema (claro/oscuro)
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${settings.theme}`);
    
    // Aplicar color primario
    document.documentElement.style.setProperty('--primary-color', getPrimaryColor());
    document.documentElement.style.setProperty('--primary-light', getPrimaryLightColor());
    document.documentElement.style.setProperty('--primary-dark', getPrimaryDarkColor());
    
    // Aplicar tamaño de fuente
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);
    
    // Aplicar modo de barra lateral
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('expanded', 'collapsed');
    if (settings.sidebarMode !== 'auto') {
        sidebar.classList.add(settings.sidebarMode);
    }
}

// ========================
// Gráficos
// ========================

// Actualizar todos los gráficos
function updateAllCharts() {
    // Verificar si Chart.js está disponible
    if (!window.Chart) {
        console.warn('Chart.js no está disponible');
        return;
    }
    
    updateDashboardCharts();
    updateProfitsCharts();
    updateOperationsCharts();
    updateAnalyticsCharts();
}

// Actualizar gráficos del dashboard
function updateDashboardCharts() {
    // Gráfico de inversiones
    createInvestmentsChart();
}

// Crear gráfico de inversiones
function createInvestmentsChart() {
    const container = document.querySelector('#dashboard .chart-container');
    if (!container) return;
    
    if (operationsData.length === 0) {
        container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-muted);">لا توجد بيانات كافية لإنشاء الرسم البياني</div>';
        return;
    }
    
    // Eliminar canvas existente si lo hay
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
        container.removeChild(existingCanvas);
    }
    
    // Crear nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'investments-chart';
    container.appendChild(canvas);
    
    // Determinar tipo de gráfico activo
    const activeTab = document.querySelector('#dashboard .card-tab.active');
    const chartType = activeTab ? activeTab.getAttribute('data-chart') : 'monthly';
    
    // Preparar datos para el gráfico
    const chartData = prepareChartData(chartType);
    
    // Crear gráfico
    const ctx = canvas.getContext('2d');
    
    window.dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'الاستثمارات',
                    data: chartData.investments,
                    borderColor: 'rgb(114, 103, 239)',
                    backgroundColor: 'rgba(114, 103, 239, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'الأرباح',
                    data: chartData.profits,
                    borderColor: 'rgb(46, 204, 113)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'تحليل الاستثمارات والأرباح'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'الفترة'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'المبلغ'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Preparar datos para gráficos
function prepareChartData(chartType) {
    const data = {
        labels: [],
        investments: [],
        profits: []
    };
    
    if (operationsData.length === 0) {
        return data;
    }
    
    // Ordenar operaciones por fecha
    const sortedOperations = [...operationsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Fecha más temprana y más tardía
    const earliestDate = new Date(sortedOperations[0].date);
    const latestDate = new Date(sortedOperations[sortedOperations.length - 1].date);
    
    // Preparar datos según tipo de gráfico
    if (chartType === 'weekly') {
        // Datos semanales (últimas 12 semanas)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 12 * 7); // 12 semanas atrás
        
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(weekStart.getDate() + i * 7);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            // Formato de etiqueta
            const label = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
            data.labels.push(label);
            
            // Calcular inversiones y ganancias para esta semana
            let weeklyInvestment = 0;
            let weeklyProfit = 0;
            
            for (const operation of sortedOperations) {
                const operationDate = new Date(operation.date);
                
                if (operationDate >= weekStart && operationDate <= weekEnd) {
                    if (operation.type === 'deposit') {
                        weeklyInvestment += operation.amount;
                    } else if (operation.type === 'withdrawal') {
                        weeklyInvestment -= operation.amount;
                    } else if (operation.type === 'profit') {
                        weeklyProfit += operation.amount;
                    }
                }
            }
            
            data.investments.push(weeklyInvestment);
            data.profits.push(weeklyProfit);
        }
    } else if (chartType === 'monthly') {
        // Datos mensuales (últimos 12 meses)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 11); // 12 meses atrás incluyendo el actual
        
        for (let i = 0; i < 12; i++) {
            const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
            
            // Formato de etiqueta
            const label = `${getMonthName(monthStart.getMonth())} ${monthStart.getFullYear()}`;
            data.labels.push(label);
            
            // Calcular inversiones y ganancias para este mes
            let monthlyInvestment = 0;
            let monthlyProfit = 0;
            
            for (const operation of sortedOperations) {
                const operationDate = new Date(operation.date);
                
                if (operationDate >= monthStart && operationDate <= monthEnd) {
                    if (operation.type === 'deposit') {
                        monthlyInvestment += operation.amount;
                    } else if (operation.type === 'withdrawal') {
                        monthlyInvestment -= operation.amount;
                    } else if (operation.type === 'profit') {
                        monthlyProfit += operation.amount;
                    }
                }
            }
            
            data.investments.push(monthlyInvestment);
            data.profits.push(monthlyProfit);
        }
    } else if (chartType === 'yearly') {
        // Datos anuales (últimos 5 años)
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4; // 5 años incluyendo el actual
        
        for (let year = startYear; year <= currentYear; year++) {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);
            
            // Formato de etiqueta
            const label = `${year}`;
            data.labels.push(label);
            
            // Calcular inversiones y ganancias para este año
            let yearlyInvestment = 0;
            let yearlyProfit = 0;
            
            for (const operation of sortedOperations) {
                const operationDate = new Date(operation.date);
                
                if (operationDate.getFullYear() === year) {
                    if (operation.type === 'deposit') {
                        yearlyInvestment += operation.amount;
                    } else if (operation.type === 'withdrawal') {
                        yearlyInvestment -= operation.amount;
                    } else if (operation.type === 'profit') {
                        yearlyProfit += operation.amount;
                    }
                }
            }
            
            data.investments.push(yearlyInvestment);
            data.profits.push(yearlyProfit);
        }
    }
    
    return data;
}

// Actualizar gráfico según tipo
function updateChart(chartType) {
    const activePage = getActivePage();
    
    if (activePage === 'dashboard') {
        updateDashboardCharts();
    } else if (activePage === 'profits') {
        updateProfitsCharts();
    } else if (activePage === 'operations') {
        updateOperationsCharts();
    } else if (activePage === 'analytics') {
        updateAnalyticsCharts();
    }
}

// Actualizar gráficos de ganancias
function updateProfitsCharts() {
    const container = document.querySelector('#profits .chart-container');
    if (!container) return;
    
    if (operationsData.length === 0 || !operationsData.some(op => op.type === 'profit')) {
        container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-muted);">لا توجد بيانات كافية لإنشاء الرسم البياني</div>';
        return;
    }
    
    // Eliminar canvas existente si lo hay
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
        container.removeChild(existingCanvas);
    }
    
    // Crear nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'profits-chart';
    container.appendChild(canvas);
    
    // Preparar datos para el gráfico
    const profitOperations = operationsData.filter(op => op.type === 'profit');
    const sortedOperations = [...profitOperations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Agrupar por mes
    const monthlyData = {};
    
    sortedOperations.forEach(operation => {
        const date = new Date(operation.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: `${getMonthName(date.getMonth())} ${date.getFullYear()}`,
                total: 0
            };
        }
        
        monthlyData[monthKey].total += operation.amount;
    });
    
    // Convertir a arrays para el gráfico
    const months = [];
    const profits = [];
    
    Object.keys(monthlyData).sort().forEach(key => {
        months.push(monthlyData[key].month);
        profits.push(monthlyData[key].total);
    });
    
    // Crear gráfico
    const ctx = canvas.getContext('2d');
    
    window.profitsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'الأرباح الشهرية',
                data: profits,
                backgroundColor: 'rgba(255, 193, 7, 0.5)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'تحليل الأرباح'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'الشهر'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'إجمالي الأرباح'
                    },
                    beginAtZero: true
                }
            }
        }
    });
    
    // Actualizar estadísticas
    updateProfitStats();
}

// Actualizar estadísticas de ganancias
function updateProfitStats() {
    const analyticsItems = document.querySelectorAll('#profits .analytics-item .analytics-value');
    if (!analyticsItems.length) return;
    
    // Calcular estadísticas
    const profitOperations = operationsData.filter(op => op.type === 'profit');
    
    // Total de ganancias mensuales
    let totalMonthlyProfit = 0;
    investorsData.forEach(investor => {
        totalMonthlyProfit += calculateMonthlyProfit(investor.id);
    });
    
    // Ganancias anuales esperadas
    const yearlyProfit = totalMonthlyProfit * 12;
    
    // Promedio diario
    const dailyAverage = totalMonthlyProfit / 30;
    
    // Tasa de crecimiento (comparar con el mes anterior)
    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = now.getFullYear();
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthProfits = profitOperations.filter(op => {
        const date = new Date(op.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, op) => sum + op.amount, 0);
    
    const previousMonthProfits = profitOperations.filter(op => {
        const date = new Date(op.date);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    }).reduce((sum, op) => sum + op.amount, 0);
    
    let growthRate = 0;
    if (previousMonthProfits > 0) {
        growthRate = ((currentMonthProfits - previousMonthProfits) / previousMonthProfits) * 100;
    }
    
    // Actualizar valores
    analyticsItems[0].textContent = formatCurrency(totalMonthlyProfit, false);
    analyticsItems[1].textContent = formatCurrency(yearlyProfit, false);
    analyticsItems[2].textContent = formatCurrency(dailyAverage, false);
    analyticsItems[3].textContent = growthRate > 0 ? `+${growthRate.toFixed(1)}%` : `${growthRate.toFixed(1)}%`;
}

// Actualizar gráficos de operaciones
function updateOperationsCharts() {
    const container = document.querySelector('#operations .chart-container');
    if (!container) return;
    
    if (operationsData.length === 0) {
        container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-muted);">لا توجد بيانات كافية لإنشاء الرسم البياني</div>';
        return;
    }
    
    // Eliminar canvas existente si lo hay
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
        container.removeChild(existingCanvas);
    }
    
    // Crear nuevo canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'operations-chart';
    container.appendChild(canvas);
    
    // Preparar datos para el gráfico
    const deposits = operationsData.filter(op => op.type === 'deposit').length;
    const withdrawals = operationsData.filter(op => op.type === 'withdrawal').length;
    const profits = operationsData.filter(op => op.type === 'profit').length;
    
    // Crear gráfico
    const ctx = canvas.getContext('2d');
    
    window.operationsChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['إيداع', 'سحب', 'أرباح'],
            datasets: [{
                label: 'العمليات',
                data: [deposits, withdrawals, profits],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(255, 107, 107, 0.7)',
                    'rgba(255, 193, 7, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(255, 107, 107, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'توزيع العمليات'
                }
            }
        }
    });
    
    // Actualizar estadísticas
    updateOperationStats();
}

// Actualizar estadísticas de operaciones
function updateOperationStats() {
    const analyticsItems = document.querySelectorAll('#operations .analytics-item .analytics-value');
    if (!analyticsItems.length) return;
    
    // Calcular estadísticas
    const deposits = operationsData.filter(op => op.type === 'deposit').length;
    const withdrawals = operationsData.filter(op => op.type === 'withdrawal').length;
    const profits = operationsData.filter(op => op.type === 'profit').length;
    const total = operationsData.length;
    
    // Actualizar valores
    analyticsItems[0].textContent = deposits;
    analyticsItems[1].textContent = withdrawals;
    analyticsItems[2].textContent = profits;
    analyticsItems[3].textContent = total;
}

// Actualizar gráficos de análisis
function updateAnalyticsCharts() {
    // Actualizar gráfico de distribución de inversiones
    updateInvestmentDistributionChart();
    
    // Actualizar gráfico de distribución geográfica
    updateGeographicDistributionChart();
}

// Actualizar gráfico de distribución de inversiones
function updateInvestmentDistributionChart() {
    // Calcular distribución de inversiones por tamaño
    let largeInvestments = 0;
    let mediumInvestments = 0;
    let smallInvestments = 0;
    
    investorsData.forEach(investor => {
        const totalInvestment = calculateTotalInvestment(investor.id);
        
        if (totalInvestment >= 5000000) {
            largeInvestments += totalInvestment;
        } else if (totalInvestment >= 1000000) {
            mediumInvestments += totalInvestment;
        } else if (totalInvestment > 0) {
            smallInvestments += totalInvestment;
        }
    });
    
    const totalInvestments = largeInvestments + mediumInvestments + smallInvestments;
    
    if (totalInvestments === 0) return;
    
    // Calcular porcentajes
    const largePercentage = Math.round((largeInvestments / totalInvestments) * 100);
    const mediumPercentage = Math.round((mediumInvestments / totalInvestments) * 100);
    const smallPercentage = Math.round((smallInvestments / totalInvestments) * 100);
    
    // Actualizar barras de progreso
    const progressBars = document.querySelectorAll('#analytics .progress-fill');
    if (progressBars.length >= 3) {
        progressBars[0].style.width = `${largePercentage}%`;
        progressBars[1].style.width = `${mediumPercentage}%`;
        progressBars[2].style.width = `${smallPercentage}%`;
    }
    
    // Actualizar valores de porcentaje
    const progressValues = document.querySelectorAll('#analytics .progress-value');
    if (progressValues.length >= 3) {
        progressValues[0].textContent = `${largePercentage}%`;
        progressValues[1].textContent = `${mediumPercentage}%`;
        progressValues[2].textContent = `${smallPercentage}%`;
    }
}

// Actualizar gráfico de distribución geográfica
function updateGeographicDistributionChart() {
    // Agrupar inversores por ubicación
    const locationCounts = {};
    
    investorsData.forEach(investor => {
        const location = investor.address || 'غير محدد';
        
        // Extraer ciudad (primer parte de la dirección)
        const city = location.split(' - ')[0].split(',')[0];
        
        if (!locationCounts[city]) {
            locationCounts[city] = 0;
        }
        
        locationCounts[city]++;
    });
    
    // Encontrar las ubicaciones más comunes
    const locations = Object.keys(locationCounts);
    locations.sort((a, b) => locationCounts[b] - locationCounts[a]);
    
    // Tomar las 4 principales y agrupar el resto como "مناطق أخرى"
    const topLocations = locations.slice(0, 3);
    let othersCount = 0;
    
    for (let i = 3; i < locations.length; i++) {
        othersCount += locationCounts[locations[i]];
    }
    
    // Calcular porcentajes
    const totalInvestors = investorsData.length;
    
    if (totalInvestors === 0) return;
    
    const percentages = [];
    
    topLocations.forEach(location => {
        const percentage = Math.round((locationCounts[location] / totalInvestors) * 100);
        percentages.push(percentage);
    });
    
    const othersPercentage = Math.round((othersCount / totalInvestors) * 100);
    percentages.push(othersPercentage);
    
    // Actualizar barras de progreso
    const geoProgressBars = document.querySelectorAll('#analytics .progress-container:nth-of-type(n+5) .progress-fill');
    if (geoProgressBars.length >= 4) {
        for (let i = 0; i < 3 && i < topLocations.length; i++) {
            geoProgressBars[i].style.width = `${percentages[i]}%`;
        }
        geoProgressBars[3].style.width = `${othersPercentage}%`;
    }
    
    // Actualizar valores de porcentaje
    const geoProgressValues = document.querySelectorAll('#analytics .progress-container:nth-of-type(n+5) .progress-value');
    if (geoProgressValues.length >= 4) {
        for (let i = 0; i < 3 && i < topLocations.length; i++) {
            geoProgressValues[i].textContent = `${percentages[i]}%`;
        }
        geoProgressValues[3].textContent = `${othersPercentage}%`;
    }
    
    // Actualizar etiquetas de ubicación
    const geoProgressTitles = document.querySelectorAll('#analytics .progress-container:nth-of-type(n+5) .progress-title');
    if (geoProgressTitles.length >= 4) {
        for (let i = 0; i < 3 && i < topLocations.length; i++) {
            geoProgressTitles[i].textContent = topLocations[i];
        }
    }
}

// ========================
// Generación de Informes
// ========================

// Generar informe
function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const reportInvestor = document.getElementById('report-investor').value;
    const fromDate = document.getElementById('report-from').value;
    const toDate = document.getElementById('report-to').value;
    
    // Validar fechas
    if (!fromDate || !toDate) {
        showAlert('يرجى تحديد فترة التقرير', 'warning');
        return;
    }
    
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    
    if (fromDateObj > toDateObj) {
        showAlert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'danger');
        return;
    }
    
    // Mostrar cargador
    loaderOverlay.style.display = 'flex';
    
    // Filtrar operaciones por fecha e inversor
    let filteredOperations = operationsData.filter(operation => {
        const operationDate = new Date(operation.date);
        return operationDate >= fromDateObj && operationDate <= toDateObj;
    });
    
    // Filtrar por inversor si se especifica
    if (reportInvestor) {
        filteredOperations = filteredOperations.filter(operation => operation.investorId === parseInt(reportInvestor));
    }
    
    // Generar informe según tipo
    const reportResultsDiv = document.getElementById('report-results');
    reportResultsDiv.innerHTML = '';
    
    const reportCard = document.createElement('div');
    reportCard.className = 'card card-gradient-border';
    reportCard.style.marginTop = '20px';
    
    const reportCardHeader = document.createElement('div');
    reportCardHeader.className = 'card-header';
    reportCardHeader.innerHTML = `
        <div class="card-title">
            <i class="fas fa-file-alt"></i>
            نتيجة التقرير
        </div>
        <button class="btn btn-outline-primary btn-round print-report-btn">
            <i class="fas fa-print"></i>
            طباعة التقرير
        </button>
    `;
    
    reportCard.appendChild(reportCardHeader);
    
    const reportContent = document.createElement('div');
    reportContent.className = 'card-body';
    
    // Ocultar cargador
    loaderOverlay.style.display = 'none';
    
    if (filteredOperations.length === 0) {
        reportContent.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                لا توجد بيانات في الفترة المحددة
            </div>
        `;
        reportCard.appendChild(reportContent);
        reportResultsDiv.appendChild(reportCard);
        return;
    }
    
    let reportHtml = '';
    
    if (reportType === 'monthly') {
        reportHtml = generateMonthlyReport(filteredOperations, fromDateObj, toDateObj);
    } else if (reportType === 'investor') {
        reportHtml = generateInvestorReport(filteredOperations);
    } else if (reportType === 'operations') {
        reportHtml = generateOperationsReport(filteredOperations);
    } else if (reportType === 'profits') {
        reportHtml = generateProfitsReport(filteredOperations, fromDateObj, toDateObj);
    } else if (reportType === 'summary') {
        reportHtml = generateSummaryReport(filteredOperations);
    }
    
    reportContent.innerHTML = reportHtml;
    reportCard.appendChild(reportContent);
    reportResultsDiv.appendChild(reportCard);
    
    // Generar gráfico del informe si es necesario
    setTimeout(() => {
        if (reportType === 'monthly' || reportType === 'profits' || reportType === 'summary') {
            generateReportChart(reportType, filteredOperations);
        }
    }, 100);
    
    // Agregar funcionalidad de impresión
    const printButton = reportCard.querySelector('.print-report-btn');
    printButton.addEventListener('click', function() {
        printReport(reportType, fromDate, toDate, reportContent.innerHTML);
    });
    
    // Guardar informe en la base de datos
    saveReport(reportType, fromDate, toDate, reportContent.innerHTML);
}

// Generar informe mensual
function generateMonthlyReport(operations, fromDate, toDate) {
    // Agrupar operaciones por mes
    const monthlyOperations = {};
    
    operations.forEach(operation => {
        const operationDate = new Date(operation.date);
        const monthKey = `${operationDate.getFullYear()}-${operationDate.getMonth() + 1}`;
        
        if (!monthlyOperations[monthKey]) {
            monthlyOperations[monthKey] = {
                month: new Date(operationDate.getFullYear(), operationDate.getMonth(), 1),
                deposits: 0,
                withdrawals: 0,
                profits: 0
            };
        }
        
        if (operation.type === 'deposit') {
            monthlyOperations[monthKey].deposits += operation.amount;
        } else if (operation.type === 'withdrawal') {
            monthlyOperations[monthKey].withdrawals += operation.amount;
        } else if (operation.type === 'profit') {
            monthlyOperations[monthKey].profits += operation.amount;
        }
    });
    
    // Generar filas de la tabla
    let rows = '';
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalProfits = 0;
    
    Object.values(monthlyOperations).sort((a, b) => a.month - b.month).forEach(monthData => {
        const netInvestment = monthData.deposits - monthData.withdrawals;
        
        rows += `
            <tr>
                <td>${formatDate(monthData.month)}</td>
                <td>${formatCurrency(monthData.deposits)}</td>
                <td>${formatCurrency(monthData.withdrawals)}</td>
                <td>${formatCurrency(netInvestment)}</td>
                <td>${formatCurrency(monthData.profits)}</td>
            </tr>
        `;
        
        totalDeposits += monthData.deposits;
        totalWithdrawals += monthData.withdrawals;
        totalProfits += monthData.profits;
    });
    
    // Agregar fila de totales
    rows += `
        <tr style="font-weight: bold; background-color: rgba(114, 103, 239, 0.1);">
            <td>الإجمالي</td>
            <td>${formatCurrency(totalDeposits)}</td>
            <td>${formatCurrency(totalWithdrawals)}</td>
            <td>${formatCurrency(totalDeposits - totalWithdrawals)}</td>
            <td>${formatCurrency(totalProfits)}</td>
        </tr>
    `;
    
    return `
        <h3>تقرير شهري (${formatDate(fromDate)} - ${formatDate(toDate)})</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>الشهر</th>
                        <th>إجمالي الإيداعات</th>
                        <th>إجمالي السحوبات</th>
                        <th>صافي الاستثمار</th>
                        <th>إجمالي الأرباح</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        <div id="report-chart-container" style="height: 300px; margin-top: 20px;">
            <canvas id="report-chart"></canvas>
        </div>
    `;
}

// Generar informe de inversores
function generateInvestorReport(operations) {
    // Agrupar operaciones por inversor
    const investorOperations = {};
    
    operations.forEach(operation => {
        if (!investorOperations[operation.investorId]) {
            investorOperations[operation.investorId] = {
                investorId: operation.investorId,
                deposits: 0,
                withdrawals: 0,
                profits: 0
            };
        }
        
        if (operation.type === 'deposit') {
            investorOperations[operation.investorId].deposits += operation.amount;
        } else if (operation.type === 'withdrawal') {
            investorOperations[operation.investorId].withdrawals += operation.amount;
        } else if (operation.type === 'profit') {
            investorOperations[operation.investorId].profits += operation.amount;
        }
    });
    
    // Generar filas de la tabla
    let rows = '';
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalProfits = 0;
    
    Object.values(investorOperations).forEach(investorData => {
        const investor = getInvestorById(investorData.investorId);
        if (!investor) return;
        
        const netInvestment = investorData.deposits - investorData.withdrawals;
        
        rows += `
            <tr>
                <td>${investor.name}</td>
                <td>${formatCurrency(investorData.deposits)}</td>
                <td>${formatCurrency(investorData.withdrawals)}</td>
                <td>${formatCurrency(netInvestment)}</td>
                <td>${formatCurrency(investorData.profits)}</td>
            </tr>
        `;
        
        totalDeposits += investorData.deposits;
        totalWithdrawals += investorData.withdrawals;
        totalProfits += investorData.profits;
    });
    
    // Agregar fila de totales
    rows += `
        <tr style="font-weight: bold; background-color: rgba(114, 103, 239, 0.1);">
            <td>الإجمالي</td>
            <td>${formatCurrency(totalDeposits)}</td>
            <td>${formatCurrency(totalWithdrawals)}</td>
            <td>${formatCurrency(totalDeposits - totalWithdrawals)}</td>
            <td>${formatCurrency(totalProfits)}</td>
        </tr>
    `;
    
    return `
        <h3>تقرير المستثمرين</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>المستثمر</th>
                        <th>إجمالي الإيداعات</th>
                        <th>إجمالي السحوبات</th>
                        <th>صافي الاستثمار</th>
                        <th>إجمالي الأرباح</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Generar informe de operaciones
function generateOperationsReport(operations) {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Generar filas de la tabla
    let rows = '';
    
    sortedOperations.forEach(operation => {
        const investor = getInvestorById(operation.investorId);
        if (!investor) return;
        
        let typeText = '';
        let profitEffect = '';
        
        if (operation.type === 'deposit') {
            typeText = 'إيداع';
            profitEffect = `+${formatCurrency(operation.profit || calculateProfit(operation.amount))}`;
        } else if (operation.type === 'withdrawal') {
            typeText = 'سحب';
            profitEffect = `-${formatCurrency(operation.profit || calculateProfit(operation.amount))}`;
        } else if (operation.type === 'profit') {
            typeText = 'أرباح';
            profitEffect = `${formatCurrency(operation.amount)}`;
        }
        
        rows += `
            <tr>
                <td>${investor.name}</td>
                <td>${typeText}</td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td>${profitEffect}</td>
            </tr>
        `;
    });
    
    return `
        <h3>تقرير العمليات</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>المستثمر</th>
                        <th>نوع العملية</th>
                        <th>المبلغ</th>
                        <th>التاريخ</th>
                        <th>تأثير الربح</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Generar informe de ganancias
function generateProfitsReport(operations, fromDate, toDate) {
    // Filtrar operaciones de ganancia
    const profitOperations = operations.filter(op => op.type === 'profit');
    
    // Agrupar operaciones por inversor
    const investorOperations = {};
    
    profitOperations.forEach(operation => {
        if (!investorOperations[operation.investorId]) {
            investorOperations[operation.investorId] = {
                investorId: operation.investorId,
                totalInvestment: calculateTotalInvestment(operation.investorId),
                monthlyProfit: calculateMonthlyProfit(operation.investorId),
                periodProfit: 0
            };
        }
        
        investorOperations[operation.investorId].periodProfit += operation.amount;
    });
    
    // Calcular días en el período
    const daysInPeriod = calculateDaysDifference(fromDate, toDate);
    
    // Generar filas de la tabla
    let rows = '';
    let totalInvestment = 0;
    let totalMonthlyProfit = 0;
    let totalPeriodProfit = 0;
    
    Object.values(investorOperations).forEach(investorData => {
        const investor = getInvestorById(investorData.investorId);
        if (!investor) return;
        
        // Calcular tasa de ganancia
        const profitRate = investorData.totalInvestment > 0 ? (investorData.periodProfit / investorData.totalInvestment * 100).toFixed(2) : '0.00';
        
        rows += `
            <tr>
                <td>${investor.name}</td>
                <td>${formatCurrency(investorData.totalInvestment)}</td>
                <td>${formatCurrency(investorData.monthlyProfit)}</td>
                <td>${formatCurrency(investorData.periodProfit)}</td>
                <td>${profitRate}%</td>
            </tr>
        `;
        
        totalInvestment += investorData.totalInvestment;
        totalMonthlyProfit += investorData.monthlyProfit;
        totalPeriodProfit += investorData.periodProfit;
    });
    
    // Agregar fila de totales
    const totalProfitRate = totalInvestment > 0 ? (totalPeriodProfit / totalInvestment * 100).toFixed(2) : '0.00';
    
    rows += `
        <tr style="font-weight: bold; background-color: rgba(114, 103, 239, 0.1);">
            <td>الإجمالي</td>
            <td>${formatCurrency(totalInvestment)}</td>
            <td>${formatCurrency(totalMonthlyProfit)}</td>
            <td>${formatCurrency(totalPeriodProfit)}</td>
            <td>${totalProfitRate}%</td>
        </tr>
    `;
    
    return `
        <h3>تقرير الأرباح (${formatDate(fromDate)} - ${formatDate(toDate)})</h3>
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>المستثمر</th>
                        <th>المبلغ المستثمر</th>
                        <th>الربح الشهري</th>
                        <th>الربح خلالالفترة</th>
                        <th>نسبة الربح</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        <div id="report-chart-container" style="height: 300px; margin-top: 20px;">
            <canvas id="report-chart"></canvas>
        </div>
    `;
}

// Generar informe resumido
function generateSummaryReport(operations) {
    // Calcular estadísticas
    const totalInvestors = investorsData.length;
    let totalInvestments = 0;
    let totalMonthlyProfits = 0;
    
    investorsData.forEach(investor => {
        totalInvestments += calculateTotalInvestment(investor.id);
        totalMonthlyProfits += calculateMonthlyProfit(investor.id);
    });
    
    // Contar tipos de operaciones
    const deposits = operations.filter(op => op.type === 'deposit').length;
    const withdrawals = operations.filter(op => op.type === 'withdrawal').length;
    const profits = operations.filter(op => op.type === 'profit').length;
    
    // Calcular montos totales
    const totalDeposits = operations.filter(op => op.type === 'deposit').reduce((sum, op) => sum + op.amount, 0);
    const totalWithdrawals = operations.filter(op => op.type === 'withdrawal').reduce((sum, op) => sum + op.amount, 0);
    const totalProfits = operations.filter(op => op.type === 'profit').reduce((sum, op) => sum + op.amount, 0);
    
    return `
        <h3>تقرير ملخص</h3>
        <div class="analytics-summary">
            <div class="analytics-item">
                <div class="analytics-value">${totalInvestors}</div>
                <div class="analytics-label">إجمالي المستثمرين</div>
            </div>
            <div class="analytics-item">
                <div class="analytics-value">${formatCurrency(totalInvestments, false)}</div>
                <div class="analytics-label">إجمالي الاستثمارات</div>
            </div>
            <div class="analytics-item">
                <div class="analytics-value">${formatCurrency(totalMonthlyProfits, false)}</div>
                <div class="analytics-label">إجمالي الأرباح الشهرية</div>
            </div>
            <div class="analytics-item">
                <div class="analytics-value">${operations.length}</div>
                <div class="analytics-label">عدد العمليات</div>
            </div>
        </div>
        
        <div class="row" style="display: flex; flex-wrap: wrap; margin: 20px 0;">
            <div style="flex: 1; min-width: 300px; margin-bottom: 20px;">
                <h4>تحليل العمليات</h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>نوع العملية</th>
                                <th>العدد</th>
                                <th>إجمالي المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>إيداع</td>
                                <td>${deposits}</td>
                                <td>${formatCurrency(totalDeposits)}</td>
                            </tr>
                            <tr>
                                <td>سحب</td>
                                <td>${withdrawals}</td>
                                <td>${formatCurrency(totalWithdrawals)}</td>
                            </tr>
                            <tr>
                                <td>أرباح</td>
                                <td>${profits}</td>
                                <td>${formatCurrency(totalProfits)}</td>
                            </tr>
                            <tr style="font-weight: bold; background-color: rgba(114, 103, 239, 0.1);">
                                <td>الإجمالي</td>
                                <td>${operations.length}</td>
                                <td>${formatCurrency(totalDeposits + totalWithdrawals + totalProfits)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div style="flex: 1; min-width: 300px;">
                <div id="report-chart-container" style="height: 300px;">
                    <canvas id="report-chart"></canvas>
                </div>
            </div>
        </div>
    `;
}

// Generar gráfico para informe
function generateReportChart(reportType, operations) {
    const canvas = document.getElementById('report-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Eliminar gráfico existente si lo hay
    if (window.reportChart) {
        window.reportChart.destroy();
    }
    
    // Crear gráfico según tipo de informe
    if (reportType === 'monthly') {
        // Agrupar operaciones por mes
        const monthlyData = {};
        
        operations.forEach(operation => {
            const operationDate = new Date(operation.date);
            const monthKey = `${operationDate.getFullYear()}-${operationDate.getMonth() + 1}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: `${getMonthName(operationDate.getMonth())} ${operationDate.getFullYear()}`,
                    deposits: 0,
                    withdrawals: 0,
                    profits: 0
                };
            }
            
            if (operation.type === 'deposit') {
                monthlyData[monthKey].deposits += operation.amount;
            } else if (operation.type === 'withdrawal') {
                monthlyData[monthKey].withdrawals += operation.amount;
            } else if (operation.type === 'profit') {
                monthlyData[monthKey].profits += operation.amount;
            }
        });
        
        // Convertir a arrays para el gráfico
        const labels = [];
        const deposits = [];
        const withdrawals = [];
        const profits = [];
        
        Object.keys(monthlyData).sort().forEach(key => {
            labels.push(monthlyData[key].month);
            deposits.push(monthlyData[key].deposits);
            withdrawals.push(monthlyData[key].withdrawals);
            profits.push(monthlyData[key].profits);
        });
        
        window.reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'إيداعات',
                        data: deposits,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'سحوبات',
                        data: withdrawals,
                        backgroundColor: 'rgba(255, 107, 107, 0.7)',
                        borderColor: 'rgba(255, 107, 107, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'أرباح',
                        data: profits,
                        backgroundColor: 'rgba(255, 193, 7, 0.7)',
                        borderColor: 'rgba(255, 193, 7, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'تحليل العمليات الشهرية'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'الشهر'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'المبلغ'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    } else if (reportType === 'profits') {
        // Filtrar operaciones de ganancia
        const profitOperations = operations.filter(op => op.type === 'profit');
        
        // Agrupar por inversor
        const investorData = {};
        
        profitOperations.forEach(operation => {
            const investor = getInvestorById(operation.investorId);
            if (!investor) return;
            
            if (!investorData[investor.id]) {
                investorData[investor.id] = {
                    name: investor.name,
                    total: 0
                };
            }
            
            investorData[investor.id].total += operation.amount;
        });
        
        // Convertir a arrays para el gráfico
        const labels = [];
        const values = [];
        
        Object.values(investorData).forEach(data => {
            labels.push(data.name);
            values.push(data.total);
        });
        
        window.reportChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الأرباح',
                    data: values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'توزيع الأرباح حسب المستثمر'
                    }
                }
            }
        });
    } else if (reportType === 'summary') {
        // Contar tipos de operaciones
        const deposits = operations.filter(op => op.type === 'deposit').length;
        const withdrawals = operations.filter(op => op.type === 'withdrawal').length;
        const profits = operations.filter(op => op.type === 'profit').length;
        
        window.reportChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['إيداع', 'سحب', 'أرباح'],
                datasets: [{
                    label: 'العمليات',
                    data: [deposits, withdrawals, profits],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(255, 107, 107, 0.7)',
                        'rgba(255, 193, 7, 0.7)'
                    ],
                    borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(255, 107, 107, 1)',
                        'rgba(255, 193, 7, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'توزيع أنواع العمليات'
                    }
                }
            }
        });
    }
}

// Imprimir informe
function printReport(reportType, fromDate, toDate, content) {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تقرير نظام الاستثمار</title>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap');
                
                body {
                    font-family: 'Cairo', Arial, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    color: #1A202C;
                }
                
                h1, h3 {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #7267EF;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #7267EF;
                }
                
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #7267EF;
                }
                
                .date {
                    text-align: left;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                
                th, td {
                    padding: 10px;
                    border: 1px solid #ddd;
                    text-align: right;
                }
                
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                }
                
                .analytics-summary {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                
                .analytics-item {
                    flex: 1;
                    text-align: center;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    margin: 0 5px;
                }
                
                .analytics-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #7267EF;
                }
                
                .analytics-label {
                    font-size: 14px;
                    color: #666;
                }
                
                .row {
                    display: flex;
                    flex-wrap: wrap;
                    margin: 20px 0;
                }
                
                .col {
                    flex: 1;
                    min-width: 300px;
                    margin-bottom: 20px;
                }
                
                @media print {
                    body {
                        padding: 0;
                    }
                    
                    .print-btn {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">نظام إدارة الاستثمار</div>
                <div class="date">تاريخ التقرير: ${formatDate(new Date().toISOString())}</div>
            </div>
            
            <h1>
                ${reportType === 'monthly' ? 'التقرير الشهري' : 
                  reportType === 'investor' ? 'تقرير المستثمرين' : 
                  reportType === 'operations' ? 'تقرير العمليات' : 
                  reportType === 'profits' ? 'تقرير الأرباح' : 
                  'تقرير ملخص'}
            </h1>
            
            <div>
                <strong>الفترة:</strong> ${formatDate(fromDate)} - ${formatDate(toDate)}
            </div>
            
            ${content.replace(/<canvas.*?<\/canvas>/g, '')}
            
            <div class="footer">
                © ${new Date().getFullYear()} نظام إدارة الاستثمار - جميع الحقوق محفوظة
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Guardar informe en la base de datos
function saveReport(reportType, fromDate, toDate, content) {
    if (!db) return;
    
    const transaction = db.transaction(['reports'], 'readwrite');
    const store = transaction.objectStore('reports');
    
    const reportTypeLabel = reportType === 'monthly' ? 'تقرير شهري' : 
                          reportType === 'investor' ? 'تقرير مستثمرين' : 
                          reportType === 'operations' ? 'تقرير عمليات' : 
                          reportType === 'profits' ? 'تقرير أرباح' : 
                          'تقرير ملخص';
    
    const report = {
        name: `${reportTypeLabel} (${formatDate(fromDate)} - ${formatDate(toDate)})`,
        type: reportType,
        fromDate,
        toDate,
        content,
        createdAt: new Date().toISOString()
    };
    
    const request = store.add(report);
    
    request.onsuccess = function() {
        // Agregar notificación
        const notification = {
            title: 'تقرير جديد',
            message: `تم إنشاء ${reportTypeLabel} جديد`,
            type: 'info',
            date: new Date().toISOString(),
            read: false
        };
        
        addNotification(notification);
    };
    
    request.onerror = function(event) {
        console.error('Error al guardar informe:', event.target.error);
    };
}

// ========================
// Respaldo y Restauración
// ========================

// Crear respaldo
function createBackup() {
    exportData();
}

// Exportar datos
function exportData() {
    if (!db) {
        showAlert('قاعدة البيانات غير متوفرة', 'danger');
        return;
    }
    
    const exportFormat = document.getElementById('export-format').value;
    const exportInvestors = document.getElementById('export-investors').checked;
    const exportOperations = document.getElementById('export-operations').checked;
    const exportProfits = document.getElementById('export-profits').checked;
    const exportSettings = document.getElementById('export-settings').checked;
    
    if (!exportInvestors && !exportOperations && !exportProfits && !exportSettings) {
        showAlert('يرجى اختيار البيانات للتصدير', 'warning');
        return;
    }
    
    // Mostrar cargador
    loaderOverlay.style.display = 'flex';
    
    const data = {};
    let exportCount = 0;
    const totalExports = [exportInvestors, exportOperations, exportProfits, exportSettings].filter(Boolean).length;
    
    // Exportar inversores
    if (exportInvestors) {
        data.investors = investorsData;
        exportCount++;
        checkExportCompletion();
    }
    
    // Exportar operaciones
    if (exportOperations) {
        data.operations = operationsData;
        exportCount++;
        checkExportCompletion();
    }
    
    // Exportar ganancias
    if (exportProfits) {
        data.profits = profitsData;
        exportCount++;
        checkExportCompletion();
    }
    
    // Exportar configuración
    if (exportSettings) {
        data.settings = [{ id: 1, ...settings }];
        exportCount++;
        checkExportCompletion();
    }
    
    // Verificar finalización de exportación
    function checkExportCompletion() {
        if (exportCount === totalExports) {
            finalizeExport();
        }
    }
    
    // Finalizar exportación
    function finalizeExport() {
        // Ocultar cargador
        loaderOverlay.style.display = 'none';
        
        // Exportar datos según formato
        if (exportFormat === 'json') {
            exportJSON(data);
        } else if (exportFormat === 'csv') {
            exportCSV(data);
        } else if (exportFormat === 'excel') {
            exportExcel(data);
        }
        
        // Agregar registro de respaldo
        addBackupRecord(exportFormat);
        
        // Mostrar mensaje de éxito
        showAlert('تم تصدير البيانات بنجاح', 'success');
    }
}

// Exportar datos como JSON
function exportJSON(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `investment-system-backup-${formatDateForFilename(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Exportar datos como CSV
function exportCSV(data) {
    // Exportar inversores
    if (data.investors && data.investors.length > 0) {
        exportTableToCSV(data.investors, 'investors');
    }
    
    // Exportar operaciones
    if (data.operations && data.operations.length > 0) {
        exportTableToCSV(data.operations, 'operations');
    }
    
    // Exportar ganancias
    if (data.profits && data.profits.length > 0) {
        exportTableToCSV(data.profits, 'profits');
    }
}

// Exportar tabla a CSV
function exportTableToCSV(data, tableName) {
    if (!data || data.length === 0) return;
    
    // Obtener encabezados
    const headers = Object.keys(data[0]);
    
    // Generar contenido CSV
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const cell = row[header];
            
            // Convertir objetos a JSON
            const cellValue = typeof cell === 'object' ? JSON.stringify(cell) : cell;
            
            // Escapar comillas y agregar comillas a los valores
            return `"${String(cellValue).replace(/"/g, '""')}"`;
        });
        
        csvContent += values.join(',') + '\n';
    });
    
    // Crear archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `investment-system-${tableName}-${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Exportar datos como Excel
function exportExcel(data) {
    // Para simplificar, usaremos CSV como formato Excel
    exportCSV(data);
}

// Agregar registro de respaldo
function addBackupRecord(format) {
    if (!db) return;
    
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    
    const backup = {
        name: `backup-${formatDateForFilename(new Date())}-manual.${format}`,
        date: new Date().toISOString(),
        size: calculateBackupSize(),
        type: 'manual',
        format: format
    };
    
    const request = store.add(backup);
    
    request.onsuccess = function() {
        // Actualizar lista de respaldos
        loadBackups();
    };
    
    request.onerror = function(event) {
        console.error('Error al agregar registro de respaldo:', event.target.error);
    };
}

// Calcular tamaño de respaldo
function calculateBackupSize() {
    // Estimación simple del tamaño
    const investorsSize = JSON.stringify(investorsData).length;
    const operationsSize = JSON.stringify(operationsData).length;
    const profitsSize = JSON.stringify(profitsData).length;
    const settingsSize = JSON.stringify(settings).length;
    
    const totalSize = investorsSize + operationsSize + profitsSize + settingsSize;
    
    // Convertir a MB con un decimal
    return Math.round((totalSize / (1024 * 1024)) * 10) / 10;
}

// Descargar respaldo
function downloadBackup(id) {
    if (!db) return;
    
    const backup = backupsData.find(b => b.id === id);
    if (!backup) {
        showAlert('لم يتم العثور على النسخة الاحتياطية', 'danger');
        return;
    }
    
    // Simulamos la descarga de la copia de seguridad
    exportData();
}

// Restaurar respaldo
function restoreBackup(id) {
    if (!db) return;
    
    const backup = backupsData.find(b => b.id === id);
    if (!backup) {
        showAlert('لم يتم العثور على النسخة الاحتياطية', 'danger');
        return;
    }
    
    // Mostrar confirmación
    if (!confirm('سيؤدي استعادة النسخة الاحتياطية إلى استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) {
        return;
    }
    
    // Aquí solicitaríamos al usuario que seleccione el archivo de copia de seguridad
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = backup.format === 'json' ? '.json' : backup.format === 'csv' ? '.csv' : '.xlsx';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            importData(event.target.result);
        };
        
        reader.onerror = function() {
            showAlert('حدث خطأ أثناء قراءة الملف', 'danger');
        };
        
        reader.readAsText(file, 'UTF-8');
    };
    
    fileInput.click();
}

// Importar datos
function importData(jsonData) {
    try {
        // Mostrar cargador
        loaderOverlay.style.display = 'flex';
        
        const data = JSON.parse(jsonData);
        
        // Verificar si los datos son válidos
        if (!data.investors && !data.operations && !data.profits && !data.settings) {
            showAlert('الملف غير صالح أو لا يحتوي على بيانات', 'danger');
            loaderOverlay.style.display = 'none';
            return;
        }
        
        if (!db) {
            showAlert('قاعدة البيانات غير متوفرة', 'danger');
            loaderOverlay.style.display = 'none';
            return;
        }
        
        const transaction = db.transaction(['investors', 'operations', 'profits', 'settings'], 'readwrite');
        
        // Limpiar y importar inversores
        if (data.investors && data.investors.length > 0) {
            const investorsStore = transaction.objectStore('investors');
            const clearInvestorsRequest = investorsStore.clear();
            
            clearInvestorsRequest.onsuccess = function() {
                data.investors.forEach(investor => {
                    investorsStore.add(investor);
                });
            };
        }
        
        // Limpiar y importar operaciones
        if (data.operations && data.operations.length > 0) {
            const operationsStore = transaction.objectStore('operations');
            const clearOperationsRequest = operationsStore.clear();
            
            clearOperationsRequest.onsuccess = function() {
                data.operations.forEach(operation => {
                    operationsStore.add(operation);
                });
            };
        }
        
        // Limpiar y importar ganancias
        if (data.profits && data.profits.length > 0) {
            const profitsStore = transaction.objectStore('profits');
            const clearProfitsRequest = profitsStore.clear();
            
            clearProfitsRequest.onsuccess = function() {
                data.profits.forEach(profit => {
                    profitsStore.add(profit);
                });
            };
        }
        
        // Importar configuración
        if (data.settings && data.settings.length > 0) {
            const settingsStore = transaction.objectStore('settings');
            const clearSettingsRequest = settingsStore.clear();
            
            clearSettingsRequest.onsuccess = function() {
                data.settings.forEach(setting => {
                    settingsStore.put(setting);
                });
            };
        }
        
        transaction.oncomplete = function() {
            // Ocultar cargador
            loaderOverlay.style.display = 'none';
            
            // Recargar datos
            loadSettings();
            loadInvestors();
            loadOperations();
            loadProfits();
            
            // Mostrar mensaje de éxito
            showAlert('تم استيراد البيانات بنجاح', 'success');
        };
        
        transaction.onerror = function(event) {
            console.error('Error al importar datos:', event.target.error);
            loaderOverlay.style.display = 'none';
            showAlert('حدث خطأ أثناء استيراد البيانات', 'danger');
        };
    } catch (error) {
        console.error('Error al importar datos:', error);
        loaderOverlay.style.display = 'none';
        showAlert('الملف غير صالح أو تالف', 'danger');
    }
}

// ========================
// Ganancias Pendientes
// ========================

// Verificar ganancias pendientes
function checkPendingProfits() {
    if (!db) return;
    
    // Verificar si es día de distribución de ganancias
    const today = new Date();
    const dayOfMonth = today.getDate();
    const profitDay = settings.profitDay === 'last' ? getLastDayOfMonth(today) : parseInt(settings.profitDay);
    
    if (dayOfMonth !== profitDay) {
        return;
    }
    
    // Verificar si ya se distribuyeron ganancias este mes
    const month = today.getMonth();
    const year = today.getFullYear();
    
    const profitOperations = operationsData.filter(op => op.type === 'profit');
    const thisMonthProfits = profitOperations.filter(op => {
        const date = new Date(op.date);
        return date.getMonth() === month && date.getFullYear() === year;
    });
    
    if (thisMonthProfits.length > 0) {
        return;
    }
    
    // Mostrar notificación de ganancias pendientes
    showPendingProfitsNotification();
}

// Mostrar notificación de ganancias pendientes
function showPendingProfitsNotification() {
    // Calcular inversores con ganancias pendientes
    const pendingInvestors = [];
    
    investorsData.forEach(investor => {
        const totalInvestment = calculateTotalInvestment(investor.id);
        const monthlyProfit = calculateMonthlyProfit(investor.id);
        
        if (totalInvestment > 0 && monthlyProfit > 0) {
            pendingInvestors.push({
                investor,
                totalInvestment,
                monthlyProfit
            });
        }
    });
    
    if (pendingInvestors.length === 0) {
        return;
    }
    
    // Crear notificación
    const notification = {
        title: 'أرباح مستحقة للتوزيع',
        message: `يوجد ${pendingInvestors.length} مستثمر مستحق للأرباح هذا الشهر`,
        type: 'warning',
        date: new Date().toISOString(),
        read: false
    };
    
    addNotification(notification);
    
    // Crear modal de distribución de ganancias
    createDistributeProfitsModal(pendingInvestors);
}

// Crear modal de distribución de ganancias
function createDistributeProfitsModal(pendingInvestors) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('pending-profits-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Calcular totales
    let totalInvestment = 0;
    let totalProfit = 0;
    
    pendingInvestors.forEach(item => {
        totalInvestment += item.totalInvestment;
        totalProfit += item.monthlyProfit;
    });
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'pending-profits-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <div class="modal-title">أرباح مستحقة للتوزيع</div>
                    <span class="close-modal" id="pending-profits-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        يوجد ${pendingInvestors.length} مستثمر مستحق للأرباح هذا الشهر بإجمالي ${formatCurrency(totalProfit)}
                    </div>
                    
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>المستثمر</th>
                                    <th>المبلغ المستثمر</th>
                                    <th>الربح الشهري</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${generatePendingProfitsRows(pendingInvestors)}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: bold; background-color: rgba(114, 103, 239, 0.1);">
                                    <td>الإجمالي</td>
                                    <td>${formatCurrency(totalInvestment)}</td>
                                    <td>${formatCurrency(totalProfit)}</td>
                                    <td>
                                        <button class="btn btn-success btn-sm distribute-all-profits-btn">
                                            <i class="fas fa-money-bill-wave"></i>
                                            توزيع جميع الأرباح
                                        </button>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="pending-profits-close-btn">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos
    document.getElementById('pending-profits-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('pending-profits-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.querySelectorAll('.distribute-profit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            document.body.removeChild(modalOverlay);
            distributeProfit(id);
        });
    });
    
    document.querySelector('.distribute-all-profits-btn').addEventListener('click', function() {
        if (confirm('هل أنت متأكد من توزيع جميع الأرباح؟')) {
            document.body.removeChild(modalOverlay);
            distributeAllProfits(pendingInvestors);
        }
    });
}

// Generar filas de ganancias pendientes
function generatePendingProfitsRows(pendingInvestors) {
    let rows = '';
    
    pendingInvestors.forEach(item => {
        rows += `
            <tr>
                <td>${item.investor.name}</td>
                <td>${formatCurrency(item.totalInvestment)}</td>
                <td>${formatCurrency(item.monthlyProfit)}</td>
                <td>
                    <button class="btn btn-warning btn-sm distribute-profit-btn" data-id="${item.investor.id}">
                        <i class="fas fa-money-bill-wave"></i>
                        توزيع الربح
                    </button>
                </td>
            </tr>
        `;
    });
    
    return rows;
}

// Distribuir todas las ganancias
function distributeAllProfits(pendingInvestors) {
    // Mostrar cargador
    loaderOverlay.style.display = 'flex';
    
    // Fecha actual para todas las distribuciones
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    
    let processedCount = 0;
    
    // Procesar cada inversor
    pendingInvestors.forEach(item => {
        const profitOperation = {
            investorId: item.investor.id,
            type: 'profit',
            amount: item.monthlyProfit,
            date: formattedDate,
            details: 'توزيع الربح الشهري',
            createdAt: new Date().toISOString()
        };
        
        // Agregar operación de ganancia
        addDistributionOperation(profitOperation, () => {
            processedCount++;
            
            // Verificar si se han procesado todos
            if (processedCount === pendingInvestors.length) {
                // Ocultar cargador
                loaderOverlay.style.display = 'none';
                
                // Mostrar mensaje de éxito
                showAlert('تم توزيع جميع الأرباح بنجاح', 'success');
            }
        });
    });
}

// Agregar operación de distribución
function addDistributionOperation(operation, callback) {
    if (!db) {
        if (callback) callback();
        return;
    }
    
    const transaction = db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    
    const request = store.add(operation);
    
    request.onsuccess = function(event) {
        // Agregar evento al calendario
        const investor = getInvestorById(operation.investorId);
        if (investor) {
            const operationEvent = {
                title: `توزيع أرباح: ${investor.name}`,
                date: operation.date,
                type: 'profit',
                investorId: operation.investorId,
                operationId: event.target.result,
                amount: operation.amount,
                createdAt: new Date().toISOString()
            };
            
            addEvent(operationEvent);
        }
        
        if (callback) callback();
    };
    
    request.onerror = function(event) {
        console.error('Error al agregar operación de distribución:', event.target.error);
        if (callback) callback();
    };
}

// ========================
// Cron para tareas periódicas
// ========================

// Iniciar cron
function startCron() {
    // Verificar ganancias pendientes al inicio
    checkPendingProfits();
    
    // Verificar cada día si hay ganancias pendientes
    setInterval(checkPendingProfits, 24 * 60 * 60 * 1000);
    
    // Crear respaldo automático según configuración
    scheduleAutoBackup();
}

// Programar respaldo automático
function scheduleAutoBackup() {
    const autoBackupInterval = getAutoBackupInterval();
    
    if (autoBackupInterval > 0) {
        // Inicial backup after delay
        setTimeout(createAutoBackup, 60 * 1000);
        
        // Programar respaldos subsiguientes
        setInterval(createAutoBackup, autoBackupInterval);
    }
}

// Obtener intervalo de respaldo automático
function getAutoBackupInterval() {
    switch (settings.autoBackup) {
        case 'daily':
            return 24 * 60 * 60 * 1000;
        case 'weekly':
            return 7 * 24 * 60 * 60 * 1000;
        case 'monthly':
            return 30 * 24 * 60 * 60 * 1000;
        default:
            return 0;
    }
}

// Crear respaldo automático
function createAutoBackup() {
    // Verificar si está habilitado
    if (settings.autoBackup === 'disabled') {
        return;
    }
    
    // Crear respaldo de todos los datos
    const data = {
        investors: investorsData,
        operations: operationsData,
        profits: profitsData,
        settings: [{ id: 1, ...settings }],
        notifications: notificationsData,
        events: eventsData
    };
    
    // Guardar respaldo
    const dataStr = JSON.stringify(data, null, 2);
    
    // Agregar registro de respaldo automático
    addAutoBackupRecord(dataStr);
}

// Agregar registro de respaldo automático
function addAutoBackupRecord(dataStr) {
    if (!db) return;
    
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    
    const backup = {
        name: `backup-${formatDateForFilename(new Date())}-auto.json`,
        date: new Date().toISOString(),
        size: Math.round((dataStr.length / (1024 * 1024)) * 10) / 10,
        type: 'auto',
        format: 'json',
        data: dataStr
    };
    
    const request = store.add(backup);
    
    request.onsuccess = function() {
        console.log('Respaldo automático creado con éxito');
        
        // Limitar número de respaldos automáticos (mantener solo los 5 más recientes)
        limitAutoBackups();
    };
    
    request.onerror = function(event) {
        console.error('Error al crear respaldo automático:', event.target.error);
    };
}

// Limitar número de respaldos automáticos
function limitAutoBackups() {
    if (!db) return;
    
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    const index = store.index('type');
    const request = index.getAll(IDBKeyRange.only('auto'));
    
    request.onsuccess = function(event) {
        const autoBackups = event.target.result;
        
        // Ordenar por fecha (más antiguos primero)
        autoBackups.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Eliminar los más antiguos si hay más de 5
        if (autoBackups.length > 5) {
            const toDelete = autoBackups.slice(0, autoBackups.length - 5);
            
            toDelete.forEach(backup => {
                store.delete(backup.id);
            });
        }
        
        // Actualizar lista de respaldos
        loadBackups();
    };
}

// ========================
// Funciones de Utilidad
// ========================

// Obtener inversor por ID
function getInvestorById(id) {
    return investorsData.find(investor => investor.id === id);
}

// Calcular inversión total para un inversor
function calculateTotalInvestment(investorId) {
    const investorOperations = operationsData.filter(operation => operation.investorId === investorId);
    
    let total = 0;
    investorOperations.forEach(operation => {
        if (operation.type === 'deposit') {
            total += operation.amount;
        } else if (operation.type === 'withdrawal') {
            total -= operation.amount;
        }
    });
    
    return total;
}

// Calcular ganancia mensual para un inversor
function calculateMonthlyProfit(investorId) {
    const totalInvestment = calculateTotalInvestment(investorId);
    return calculateProfit(totalInvestment);
}

// Calcular ganancia para un monto
function calculateProfit(amount) {
    return amount * (settings.interestRate / 100);
}

// Calcular días activos desde la fecha de inversión
function calculateDaysActive(dateString) {
    const investmentDate = new Date(dateString);
    const currentDate = new Date();
    
    const differenceInTime = currentDate - investmentDate;
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
}

// Formatear moneda
function formatCurrency(amount, includeCurrency = true) {
    if (isNaN(amount)) amount = 0;
    
    return amount.toLocaleString('ar-IQ') + (includeCurrency ? ` ${settings.currency}` : '');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    
    if (settings.dateFormat === 'dd/mm/yyyy') {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } else if (settings.dateFormat === 'mm/dd/yyyy') {
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    } else if (settings.dateFormat === 'yyyy-mm-dd') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    return date.toLocaleDateString('ar-IQ');
}

// Formatear fecha para entrada de formulario
function formatDateForInput(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Formatear fecha para nombre de archivo
function formatDateForFilename(date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

// Formatear tiempo relativo
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    const differenceInSeconds = Math.floor((now - date) / 1000);
    
    if (differenceInSeconds < 60) {
        return 'منذ أقل من دقيقة';
    }
    
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    if (differenceInMinutes < 60) {
        return `منذ ${differenceInMinutes} دقيقة`;
    }
    
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    if (differenceInHours < 24) {
        return `منذ ${differenceInHours} ساعة`;
    }
    
    const differenceInDays = Math.floor(differenceInHours / 24);
    if (differenceInDays < 30) {
        return `منذ ${differenceInDays} يوم`;
    }
    
    const differenceInMonths = Math.floor(differenceInDays / 30);
    if (differenceInMonths < 12) {
        return `منذ ${differenceInMonths} شهر`;
    }
    
    const differenceInYears = Math.floor(differenceInMonths / 12);
    return `منذ ${differenceInYears} سنة`;
}

// Calcular días de diferencia entre fechas
function calculateDaysDifference(date1, date2) {
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    const differenceInTime = secondDate - firstDate;
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
}

// Calcular ganancia proporcional basada en días en el mes
function calculateProportionalProfit(amount, daysActive, daysInMonth) {
    const monthlyProfit = calculateProfit(amount);
    return (monthlyProfit * daysActive) / daysInMonth;
}

// Obtener días en el mes
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Obtener último día del mes
function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Obtener nombre del mes en árabe
function getMonthName(month) {
    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return monthNames[month];
}

// Obtener índice del mes por nombre
function getMonthIndex(monthName) {
    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return monthNames.indexOf(monthName);
}

// Validar fecha de inversión
function validateInvestmentDate(dateString) {
    const selectedDate = new Date(dateString);
    const currentDate = new Date();
    
    // No puede estar en el futuro
    if (selectedDate > currentDate) {
        return {
            valid: false,
            message: 'لا يمكن اختيار تاريخ في المستقبل'
        };
    }
    
    // Calcular días de diferencia
    const daysDifference = calculateDaysDifference(selectedDate, currentDate);
    
    return {
        valid: true,
        message: `عدد الأيام منذ الاستثمار: ${daysDifference} يوم`,
        days: daysDifference
    };
}

// Mostrar alerta
function showAlert(message, type = 'info') {
    // Crear elemento de alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.style.textAlign = 'center';
    alert.style.boxShadow = 'var(--shadow-lg)';
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Agregar a cuerpo
    document.body.appendChild(alert);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 500);
    }, 3000);
}

// Obtener color primario
function getPrimaryColor() {
    const colors = {
        purple: '#7267EF',
        blue: '#4361ee',
        green: '#2ECC71',
        red: '#e74c3c',
        orange: '#ff9800',
        teal: '#00cec9'
    };
    
    return colors[settings.primaryColor] || colors.purple;
}

// Obtener color primario claro
function getPrimaryLightColor() {
    const colors = {
        purple: '#9D96F5',
        blue: '#6E8EFF',
        green: '#6deca9',
        red: '#ff8f8f',
        orange: '#ffb74d',
        teal: '#67e8e3'
    };
    
    return colors[settings.primaryColor] || colors.purple;
}

// Obtener color primario oscuro
function getPrimaryDarkColor() {
    const colors = {
        purple: '#5549DD',
        blue: '#2c4cdf',
        green: '#27ae60',
        red: '#c0392b',
        orange: '#f57c00',
        teal: '#00a8a3'
    };
    
    return colors[settings.primaryColor] || colors.purple;
}

// ========================
// Inicialización
// ========================

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar aplicación
    initApp();
    
    // Iniciar cron para tareas periódicas
    startCron();
});

// ========================
// SOLUCIONES PARA LOS BOTONES
// ========================

// Función para arreglar todos los problemas de interactividad
function fixAllButtonIssues() {
    console.log("Iniciando reparación de botones e interactividad...");
    
    // Arreglar botón de notificaciones en la barra superior
    fixNotificationButton();
    
    // Arreglar botones en la tabla de inversores
    fixInvestorsTableButtons();
    
    // Arreglar botones en la tabla de ganancias
    fixProfitsTableButtons();
    
    // Arreglar botones en la tabla de operaciones
    fixOperationsTableButtons();
    
    // Arreglar botones en los análisis
    fixAnalyticsButtons();
    
    // Arreglar botones de impresión
    fixPrintButtons();
    
    // Arreglar botones de modales
    fixModalButtons();
    
    console.log("Reparación de botones completada");
}

// Arreglar botón de notificaciones en la barra superior
function fixNotificationButton() {
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        // Eliminar cualquier evento anterior para evitar duplicados
        notificationBtn.removeEventListener('click', toggleNotificationsPanel);
        
        // Agregar nuevo evento
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevenir propagación
            
            console.log("Botón de notificaciones clickeado");
            
            // Verificar si el panel ya está abierto
            const existingPanel = document.getElementById('notifications-panel');
            if (existingPanel) {
                document.body.removeChild(existingPanel);
                return;
            }
            
            // Crear panel de notificaciones manualmente
            createNotificationsPanelFixed();
        });
        
        console.log("Botón de notificaciones arreglado");
    }
}

// Crear panel de notificaciones (versión arreglada)
function createNotificationsPanelFixed() {
    // Cargar notificaciones primero
    if (!notificationsData || notificationsData.length === 0) {
        loadNotificationsFixed();
    }
    
    // Crear el panel físicamente
    const panel = document.createElement('div');
    panel.id = 'notifications-panel';
    panel.style.position = 'absolute';
    panel.style.top = '60px';
    panel.style.left = '20px';
    panel.style.width = '350px';
    panel.style.maxHeight = '500px';
    panel.style.overflow = 'auto';
    panel.style.backgroundColor = 'white';
    panel.style.boxShadow = 'var(--shadow-lg)';
    panel.style.borderRadius = 'var(--radius-lg)';
    panel.style.zIndex = '1000';
    panel.style.direction = 'rtl';
    
    // Ordenar notificaciones (no leídas primero, luego por fecha)
    const sortedNotifications = [...notificationsData].sort((a, b) => {
        if (a.read !== b.read) {
            return a.read ? 1 : -1;
        }
        return new Date(b.date) - new Date(a.date);
    });
    
    // Crear contenido
    let panelContent = `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; font-size: var(--font-lg);">الإشعارات</div>
            <div>
                <button class="btn btn-sm btn-outline-primary mark-all-read-btn">
                    <i class="fas fa-check-double"></i>
                    تحديد الكل كمقروء
                </button>
            </div>
        </div>
        <div class="notifications-container">
    `;
    
    if (sortedNotifications.length === 0) {
        panelContent += `
            <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                <i class="fas fa-bell-slash" style="font-size: 24px; margin-bottom: 10px;"></i>
                <div>لا توجد إشعارات</div>
            </div>
        `;
    } else {
        sortedNotifications.forEach(notification => {
            let iconClass = '';
            
            if (notification.type === 'success') {
                iconClass = 'notification-success';
            } else if (notification.type === 'danger') {
                iconClass = 'notification-danger';
            } else if (notification.type === 'warning') {
                iconClass = 'notification-warning';
            } else {
                iconClass = 'notification-info';
            }
            
            panelContent += `
                <div class="notification-item" ${notification.read ? '' : 'style="background-color: rgba(114, 103, 239, 0.1);"'}>
                    <div class="notification-icon ${iconClass}">
                        <i class="fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'danger' ? 'exclamation-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${formatRelativeTime(notification.date)}</div>
                        <div class="notification-actions">
                            <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${notification.id}">
                                ${notification.read ? 'تحديد كغير مقروء' : 'تحديد كمقروء'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    panelContent += `
        </div>
        <div style="padding: 10px; border-top: 1px solid var(--border-color); text-align: center;">
            <a href="#" class="show-all-notifications-btn" style="color: var(--primary-color); text-decoration: none;">عرض كل الإشعارات</a>
        </div>
    `;
    
    panel.innerHTML = panelContent;
    document.body.appendChild(panel);
    
    // Agregar manualmente eventos a los botones recién creados
    const markAllReadBtn = panel.querySelector('.mark-all-read-btn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllNotificationsAsRead();
            document.body.removeChild(panel);
        });
    }
    
    const markReadBtns = panel.querySelectorAll('.mark-read-btn');
    markReadBtns.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            toggleNotificationReadStatus(id);
            document.body.removeChild(panel);
        });
    });
    
    const showAllNotificationsBtn = panel.querySelector('.show-all-notifications-btn');
    if (showAllNotificationsBtn) {
        showAllNotificationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.removeChild(panel);
            
            // Navegar a la página de notificaciones
            const notificationsMenuItem = document.querySelector('[data-page="notifications"]');
            if (notificationsMenuItem) {
                notificationsMenuItem.click();
            }
        });
    }
    
    // Cerrar al hacer clic fuera del panel
    document.addEventListener('click', function closePanel(e) {
        if (panel && !panel.contains(e.target) && !document.querySelector('.notification-btn').contains(e.target)) {
            if (document.body.contains(panel)) {
                document.body.removeChild(panel);
            }
            document.removeEventListener('click', closePanel);
        }
    });
}

// Cargar notificaciones (versión arreglada)
function loadNotificationsFixed() {
    if (!db) {
        // Si la base de datos no está disponible, crear algunas notificaciones de ejemplo
        notificationsData = [
            {
                id: 1,
                title: 'مرحباً بك في نظام إدارة الاستثمار',
                message: 'نرحب بك في نظام إدارة الاستثمار. يمكنك البدء بإضافة المستثمرين وإدارة عملياتهم.',
                type: 'info',
                date: new Date().toISOString(),
                read: false
            },
            {
                id: 2,
                title: 'تذكير بتوزيع الأرباح',
                message: 'حان موعد توزيع الأرباح الشهرية للمستثمرين. يرجى مراجعة قائمة المستثمرين وتوزيع الأرباح.',
                type: 'warning',
                date: new Date().toISOString(),
                read: false
            }
        ];
        
        // Actualizar interfaz
        updateNotificationBadge();
        return;
    }
    
    try {
        const transaction = db.transaction(['notifications'], 'readonly');
        const store = transaction.objectStore('notifications');
        const request = store.getAll();
        
        request.onsuccess = function(event) {
            notificationsData = event.target.result;
            
            // Actualizar contador de notificaciones
            updateNotificationBadge();
            
            // Actualizar panel de notificaciones si estamos en esa página
            if (getActivePage() === 'notifications') {
                updateNotificationsPanel();
            }
        };
        
        request.onerror = function(event) {
            console.error('Error al cargar notificaciones:', event.target.error);
            // Crear notificaciones de ejemplo en caso de error
            notificationsData = [
                {
                    id: 1,
                    title: 'مرحباً بك في نظام إدارة الاستثمار',
                    message: 'نرحب بك في نظام إدارة الاستثمار. يمكنك البدء بإضافة المستثمرين وإدارة عملياتهم.',
                    type: 'info',
                    date: new Date().toISOString(),
                    read: false
                }
            ];
        };
    } catch (error) {
        console.error('Error al acceder a la base de datos de notificaciones:', error);
        // Crear notificaciones de ejemplo en caso de error
        notificationsData = [
            {
                id: 1,
                title: 'مرحباً بك في نظام إدارة الاستثمار',
                message: 'نرحب بك في نظام إدارة الاستثمار. يمكنك البدء بإضافة المستثمرين وإدارة عملياتهم.',
                type: 'info',
                date: new Date().toISOString(),
                read: false
            }
        ];
    }
}

// Arreglar botones en la tabla de inversores
function fixInvestorsTableButtons() {
    const investorsTable = document.getElementById('investors-table-body');
    if (!investorsTable) return;
    
    // Eliminar los eventos antiguos para evitar duplicados
    const oldButtons = investorsTable.querySelectorAll('.action-btn');
    oldButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    
    // Volver a agregar los eventListeners
    const viewButtons = investorsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Ver inversor con ID: ${id}`);
            viewInvestorFixed(id);
        });
    });
    
    const editButtons = investorsTable.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Editar inversor con ID: ${id}`);
            editInvestorFixed(id);
        });
    });
    
    const deleteButtons = investorsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Eliminar inversor con ID: ${id}`);
            deleteInvestorFixed(id);
        });
    });
    
    console.log("Botones de la tabla de inversores arreglados");
}

// Ver inversor (versión arreglada)
function viewInvestorFixed(id) {
    console.log(`Visualizando inversor: ${id}`);
    
    // Buscar el inversor en los datos
    const investor = investorsData.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    // Crear modal directamente
    createInvestorDetailsModalFixed(investor);
}

// Crear modal de detalles del inversor (versión arreglada)
function createInvestorDetailsModalFixed(investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('investor-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Calcular datos del inversor
    const totalInvestment = calculateTotalInvestment(investor.id);
    const monthlyProfit = calculateMonthlyProfit(investor.id);
    const investorOperations = operationsData.filter(op => op.investorId === investor.id);
    const daysActive = calculateDaysActive(investor.date);
    
    // Calcular totales
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalProfits = 0;
    
    investorOperations.forEach(op => {
        if (op.type === 'deposit') {
            totalDeposits += op.amount;
        } else if (op.type === 'withdrawal') {
            totalWithdrawals += op.amount;
        } else if (op.type === 'profit') {
            totalProfits += op.amount;
        }
    });
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'investor-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل المستثمر: ${investor.name}</div>
                    <span class="close-modal" id="investor-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 0 0 200px; text-align: center;">
                            <div style="width: 150px; height: 150px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white; font-size: 50px; font-weight: bold;">
                                ${investor.name.charAt(0)}
                            </div>
                        </div>
                        <div style="flex: 1; min-width: 300px;">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
                                <div>
                                    <div style="font-weight: bold;">الاسم الكامل</div>
                                    <div>${investor.name}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">رقم الهاتف</div>
                                    <div>${investor.phone}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">العنوان</div>
                                    <div>${investor.address || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">رقم البطاقة</div>
                                    <div>${investor.idCard}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">البريد الإلكتروني</div>
                                    <div>${investor.email || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">المهنة</div>
                                    <div>${investor.job || '-'}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">تاريخ الاستثمار</div>
                                    <div>${formatDate(investor.date)}</div>
                                </div>
                                <div>
                                    <div style="font-weight: bold;">عدد الأيام</div>
                                    <div>${daysActive} يوم</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-stats" style="margin-top: 20px;">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalInvestment)}</div>
                                <div class="stat-label">إجمالي الاستثمار</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--success-color), #6deca9);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(monthlyProfit)}</div>
                                <div class="stat-label">الربح الشهري</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--warning-color), #ffd54f);">
                                <i class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalProfits)}</div>
                                <div class="stat-label">إجمالي الأرباح المستلمة</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div class="card-title">
                                <i class="fas fa-exchange-alt"></i>
                                عمليات المستثمر
                            </div>
                            <div>
                                <button class="btn btn-success btn-round add-investor-deposit-btn" data-id="${investor.id}">
                                    <i class="fas fa-plus"></i>
                                    إيداع
                                </button>
                                <button class="btn btn-danger btn-round add-investor-withdrawal-btn" data-id="${investor.id}">
                                    <i class="fas fa-minus"></i>
                                    سحب
                                </button>
                                <button class="btn btn-warning btn-round distribute-profit-btn" data-id="${investor.id}">
                                    <i class="fas fa-money-bill-wave"></i>
                                    توزيع الربح
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>نوع العملية</th>
                                        <th>المبلغ</th>
                                        <th>التاريخ</th>
                                        <th>التفاصيل</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateInvestorOperationsRowsFixed(investorOperations)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-chart-bar"></i>
                            تحليل استثمارات ${investor.name}
                        </div>
                        <div id="investor-chart-container" style="height: 300px;">
                            <canvas id="investor-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="investor-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary edit-investor-btn" data-id="${investor.id}">تعديل</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos manualmente
    document.getElementById('investor-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('investor-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    // Botón de editar
    modalOverlay.querySelector('.edit-investor-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        editInvestorFixed(investor.id);
    });
    
    // Botón de agregar depósito
    modalOverlay.querySelector('.add-investor-deposit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        openAddDepositModalFixed(investor.id);
    });
    
    // Botón de agregar retiro
    modalOverlay.querySelector('.add-investor-withdrawal-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        openAddWithdrawalModalFixed(investor.id);
    });
    
    // Botón de distribuir ganancia
    modalOverlay.querySelector('.distribute-profit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        distributeProfitFixed(investor.id);
    });
    
    // Generar gráfico de inversor
    setTimeout(() => {
        generateInvestorChartFixed(investor.id);
    }, 100);
}

// Generar filas de operaciones para un inversor (versión arreglada)
function generateInvestorOperationsRowsFixed(operations) {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedOperations.length === 0) {
        return '<tr><td colspan="5" style="text-align: center;">لا توجد عمليات</td></tr>';
    }
    
    let rows = '';
    
    sortedOperations.forEach(operation => {
        let typeClass = '';
        let typeText = '';
        
        if (operation.type === 'deposit') {
            typeClass = 'status-deposit';
            typeText = 'إيداع';
        } else if (operation.type === 'withdrawal') {
            typeClass = 'status-withdrawal';
            typeText = 'سحب';
        } else if (operation.type === 'profit') {
            typeClass = 'status-profit';
            typeText = 'أرباح';
        }
        
        rows += `
            <tr>
                <td><div class="status-pill ${typeClass}">${typeText}</div></td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td>${operation.details || '-'}</td>
                <td><div class="status-pill status-deposit">مكتمل</div></td>
            </tr>
        `;
    });
    
    return rows;
}

// Generar gráfico para un inversor (versión arreglada)
function generateInvestorChartFixed(investorId) {
    const operations = operationsData.filter(op => op.investorId === investorId);
    
    if (operations.length === 0) {
        return;
    }
    
    // Ordenar operaciones por fecha
    const sortedOperations = [...operations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Preparar datos para el gráfico
    const dates = [];
    const investmentData = [];
    const profitData = [];
    
    let runningInvestment = 0;
    let runningProfit = 0;
    
    sortedOperations.forEach(operation => {
        const formattedDate = formatDate(operation.date);
        
        if (operation.type === 'deposit') {
            runningInvestment += operation.amount;
        } else if (operation.type === 'withdrawal') {
            runningInvestment -= operation.amount;
        } else if (operation.type === 'profit') {
            runningProfit += operation.amount;
        }
        
        dates.push(formattedDate);
        investmentData.push(runningInvestment);
        profitData.push(runningProfit);
    });
    
    // Crear gráfico
    const canvas = document.getElementById('investor-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Eliminar gráfico existente si lo hay
    if (window.investorChart) {
        window.investorChart.destroy();
    }
    
    if (window.Chart) {
        window.investorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'الاستثمار',
                        data: investmentData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'الأرباح المتراكمة',
                        data: profitData,
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'التاريخ'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'المبلغ'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'تطور الاستثمار والأرباح'
                    }
                }
            }
        });
    } else {
        console.error("La biblioteca Chart.js no está disponible");
        canvas.innerHTML = '<div style="text-align: center; padding: 20px;">لا يمكن إنشاء الرسم البياني</div>';
    }
}

// Editar inversor (versión arreglada)
function editInvestorFixed(id) {
    console.log(`Editando inversor: ${id}`);
    
    // Buscar el inversor en los datos
    const investor = investorsData.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    investorForm.reset();
    investorForm.setAttribute('data-mode', 'edit');
    investorForm.setAttribute('data-id', id);
    
    document.querySelector('#investor-modal .modal-title').textContent = 'تعديل بيانات المستثمر';
    
    // Llenar el formulario con los datos del inversor
    document.getElementById('investor-name').value = investor.name;
    document.getElementById('investor-phone').value = investor.phone;
    document.getElementById('investor-address').value = investor.address || '';
    document.getElementById('investor-id-card').value = investor.idCard;
    document.getElementById('investor-email').value = investor.email || '';
    document.getElementById('investor-job').value = investor.job || '';
    document.getElementById('investor-notes').value = investor.notes || '';
    
    // No permitir cambiar el monto inicial
    const amountInput = document.getElementById('investor-amount');
    amountInput.value = investor.amount;
    amountInput.disabled = true;
    
    // Establecer fecha
    investorDateInput.value = formatDateForInput(new Date(investor.date));
    
    // Validar fecha
    const validation = validateInvestmentDate(investor.date);
    investorDateMessage.textContent = validation.message;
    investorDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    investorModalOverlay.style.display = 'block';
    investorModal.style.display = 'block';
}

// Eliminar inversor (versión arreglada)
function deleteInvestorFixed(id) {
    console.log(`Eliminando inversor: ${id}`);
    
    // Mostrar confirmación
    if (!confirm('هل أنت متأكد من حذف هذا المستثمر؟ سيتم حذف جميع العمليات المرتبطة به.')) {
        return;
    }
    
    // Eliminar inversor directamente de los datos
    investorsData = investorsData.filter(inv => inv.id !== id);
    
    // Eliminar operaciones asociadas
    operationsData = operationsData.filter(op => op.investorId !== id);
    
    // Si tenemos acceso a la base de datos, también eliminar allí
    if (db) {
        try {
            const transaction = db.transaction(['investors', 'operations'], 'readwrite');
            const investorsStore = transaction.objectStore('investors');
            const operationsStore = transaction.objectStore('operations');
            
            // Eliminar inversor
            investorsStore.delete(id);
            
            // Eliminar operaciones (usando cursor)
            const operationsIndex = operationsStore.index('investorId');
            const operationsRequest = operationsIndex.openCursor(IDBKeyRange.only(id));
            
            operationsRequest.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    operationsStore.delete(cursor.value.id);
                    cursor.continue();
                }
            };
        } catch (error) {
            console.error('Error al eliminar inversor de la base de datos:', error);
        }
    }
    
    // Actualizar interfaz
    updateInvestorsTable();
    updateOperationsTable();
    updateProfitsTable();
    updateDashboardStats();
    
    // Mostrar mensaje de éxito
    showAlert('تم حذف المستثمر بنجاح', 'success');
}

// Abrir modal para agregar depósito (versión arreglada)
function openAddDepositModalFixed(investorId = null) {
    operationForm.reset();
    operationForm.removeAttribute('data-mode');
    operationForm.removeAttribute('data-id');
    
    operationTypeSelect.value = 'deposit';
    operationModalTitle.textContent = 'إضافة إيداع جديد';
    operationDateMessage.textContent = '';
    
    // Si se proporciona un ID de inversor, seleccionarlo en el formulario
    if (investorId !== null) {
        document.getElementById('operation-investor').value = investorId;
    }
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    operationDateInput.value = formattedDate;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
}

// Abrir modal para agregar retiro (versión arreglada)
function openAddWithdrawalModalFixed(investorId = null) {
    operationForm.reset();
    operationForm.removeAttribute('data-mode');
    operationForm.removeAttribute('data-id');
    
    operationTypeSelect.value = 'withdrawal';
    operationModalTitle.textContent = 'إضافة سحب جديد';
    operationDateMessage.textContent = '';
    
    // Si se proporciona un ID de inversor, seleccionarlo en el formulario
    if (investorId !== null) {
        document.getElementById('operation-investor').value = investorId;
    }
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    operationDateInput.value = formattedDate;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
}

// Distribuir ganancia a un inversor (versión arreglada)
function distributeProfitFixed(investorId) {
    console.log(`Distribuyendo ganancia al inversor: ${investorId}`);
    
    // Buscar el inversor en los datos
    const investor = investorsData.find(inv => inv.id === investorId);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    const totalInvestment = calculateTotalInvestment(investorId);
    const monthlyProfit = calculateMonthlyProfit(investorId);
    
    if (totalInvestment <= 0) {
        showAlert('لا يوجد استثمار نشط لتوزيع الأرباح', 'danger');
        return;
    }
    
    // Crear modal para distribución de ganancias
    createDistributeProfitModalFixed(investor, totalInvestment, monthlyProfit);
}

// Crear modal para distribución de ganancias (versión arreglada)
function createDistributeProfitModalFixed(investor, totalInvestment, monthlyProfit) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('profit-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Calcular valores
    const interestRate = settings.interestRate;
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'profit-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">توزيع الربح: ${investor.name}</div>
                    <span class="close-modal" id="profit-modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="profit-form">
                        <div class="form-group">
                            <label>المستثمر</label>
                            <input type="text" class="form-control" value="${investor.name}" disabled>
                            <input type="hidden" id="profit-investor-id" value="${investor.id}">
                        </div>
                        <div class="form-group">
                            <label>إجمالي الاستثمار</label>
                            <input type="text" class="form-control" value="${formatCurrency(totalInvestment)}" disabled>
                        </div>
                        <div class="form-group">
                            <label>نسبة الفائدة الشهرية</label>
                            <input type="text" class="form-control" value="${interestRate}%" disabled>
                        </div>
                        <div class="form-group">
                            <label>الربح الشهري <span style="color: var(--danger-color);">*</span></label>
                            <input type="number" class="form-control" id="profit-amount" value="${monthlyProfit}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>تاريخ التوزيع <span style="color: var(--danger-color);">*</span></label>
                            <input type="date" class="form-control" id="profit-date" required>
                        </div>
                        <div class="form-group">
                            <label>تفاصيل</label>
                            <textarea class="form-control" id="profit-details" rows="3">توزيع الربح الشهري</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-primary" id="profit-modal-cancel">إلغاء</button>
                    <button type="submit" class="btn btn-primary" id="profit-modal-submit">توزيع الربح</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    document.getElementById('profit-date').value = formatDateForInput(today);
    
    // Agregar eventos manualmente
    document.getElementById('profit-modal-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-modal-cancel').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-modal-submit').addEventListener('click', function(e) {
        e.preventDefault();
        
        const form = document.getElementById('profit-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const investorId = parseInt(document.getElementById('profit-investor-id').value);
        const amount = parseFloat(document.getElementById('profit-amount').value);
        const date = document.getElementById('profit-date').value;
        const details = document.getElementById('profit-details').value;
        
        if (!date) {
            showAlert('يرجى تحديد تاريخ التوزيع', 'danger');
            return;
        }
        
        // Crear operación de ganancia
        const profitOperation = {
            id: Date.now(), // ID temporal para uso sin base de datos
            investorId,
            type: 'profit',
            amount,
            date,
            details: details || 'توزيع الربح الشهري',
            createdAt: new Date().toISOString()
        };
        
        // Agregar a los datos locales
        operationsData.push(profitOperation);
        
        // Guardar en base de datos si está disponible
        if (db) {
            try {
                const transaction = db.transaction(['operations'], 'readwrite');
                const store = transaction.objectStore('operations');
                store.add(profitOperation);
            } catch (error) {
                console.error('Error al guardar operación en la base de datos:', error);
            }
        }
        
        // Actualizar interfaz
        updateOperationsTable();
        updateProfitsTable();
        updateDashboardStats();
        
        // Mostrar mensaje de éxito
        showAlert('تم توزيع الربح بنجاح', 'success');
        
        // Cerrar modal
        document.body.removeChild(modalOverlay);
    });
}

// Arreglar botones en la tabla de ganancias
function fixProfitsTableButtons() {
    const profitsTable = document.querySelector('#profits table tbody');
    if (!profitsTable) return;
    
    // Eliminar los eventos antiguos para evitar duplicados
    const oldButtons = profitsTable.querySelectorAll('.action-btn');
    oldButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    
    // Volver a agregar los eventListeners
    const viewButtons = profitsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Ver ganancia con ID: ${id}`);
            viewProfitFixed(id);
        });
    });
    
    const distributeButtons = profitsTable.querySelectorAll('.distribute-profit-btn');
    distributeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Distribuir ganancia al inversor con ID: ${id}`);
            distributeProfitFixed(id);
        });
    });
    
    const deleteButtons = profitsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Eliminar inversor con ID: ${id}`);
            deleteInvestorFixed(id);
        });
    });
    
    console.log("Botones de la tabla de ganancias arreglados");
}

// Ver detalle de ganancia (versión arreglada)
function viewProfitFixed(id) {
    console.log(`Visualizando ganancia del inversor: ${id}`);
    
    // Buscar el inversor en los datos
    const investor = investorsData.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    // Crear modal de detalle de ganancia
    createProfitDetailsModalFixed(investor);
}

// Crear modal de detalle de ganancia (versión arreglada)
function createProfitDetailsModalFixed(investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('profit-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    const totalInvestment = calculateTotalInvestment(investor.id);
    const monthlyProfit = calculateMonthlyProfit(investor.id);
    const yearlyProfit = monthlyProfit * 12;
    const yearlyProfitRate = (yearlyProfit / totalInvestment) * 100;
    
    // Obtener operaciones de ganancia
    const profitOperations = operationsData.filter(op => op.investorId === investor.id && op.type === 'profit');
    
    // Calcular total de ganancias recibidas
    let totalProfitsReceived = 0;
    profitOperations.forEach(op => {
        totalProfitsReceived += op.amount;
    });
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'profit-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل أرباح: ${investor.name}</div>
                    <span class="close-modal" id="profit-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalInvestment)}</div>
                                <div class="stat-label">إجمالي الاستثمار</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--success-color), #6deca9);">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(monthlyProfit)}</div>
                                <div class="stat-label">الربح الشهري</div>
                                <div class="stat-change positive">
                                    <i class="fas fa-percentage"></i>
                                    ${settings.interestRate}% شهرياً
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--warning-color), #ffd54f);">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(yearlyProfit)}</div>
                                <div class="stat-label">الربح السنوي المتوقع</div>
                                <div class="stat-change positive">
                                    <i class="fas fa-percentage"></i>
                                    ${yearlyProfitRate.toFixed(2)}% سنوياً
                                </div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: linear-gradient(135deg, var(--info-color), #67d4f5);">
                                <i class="fas fa-hand-holding-usd"></i>
                            </div>
                            <div class="stat-details">
                                <div class="stat-value">${formatCurrency(totalProfitsReceived)}</div>
                                <div class="stat-label">إجمالي الأرباح المستلمة</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div class="card-title">
                                <i class="fas fa-money-bill-wave"></i>
                                سجل توزيع الأرباح
                            </div>
                            <div>
                                <button class="btn btn-warning btn-round distribute-profit-btn" data-id="${investor.id}">
                                    <i class="fas fa-money-bill-wave"></i>
                                    توزيع الربح
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>المبلغ</th>
                                        <th>تاريخ التوزيع</th>
                                        <th>التفاصيل</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${generateProfitOperationsRowsFixed(profitOperations)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-chart-bar"></i>
                            تحليل أرباح ${investor.name}
                        </div>
                        <div id="profit-chart-container" style="height: 300px;">
                            <canvas id="profit-chart"></canvas>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <div class="card-title" style="margin-bottom: 15px;">
                            <i class="fas fa-calculator"></i>
                            تفاصيل حساب الربح
                        </div>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            يتم حساب الربح الشهري بضرب إجمالي الاستثمار (${formatCurrency(totalInvestment)}) بنسبة الفائدة الشهرية (${settings.interestRate}%) = ${formatCurrency(monthlyProfit)}
                        </div>
                        ${settings.proportionalProfits === 'enabled' ? `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            ملاحظة: تم تفعيل خاصية حساب الأرباح النسبية. في حالة إيداع أو سحب مبلغ خلال الشهر، سيتم حساب الربح بناءً على عدد أيام الاستثمار.
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="profit-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary view-investor-btn" data-id="${investor.id}">عرض المستثمر</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos manualmente
    document.getElementById('profit-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('profit-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    modalOverlay.querySelector('.view-investor-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        viewInvestorFixed(investor.id);
    });
    
    modalOverlay.querySelector('.distribute-profit-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        distributeProfitFixed(investor.id);
    });
    
    // Generar gráfico de ganancias
    setTimeout(() => {
        generateProfitChartFixed(investor.id);
    }, 100);
}

// Generar filas de operaciones de ganancia (versión arreglada)
function generateProfitOperationsRowsFixed(operations) {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedOperations.length === 0) {
        return '<tr><td colspan="4" style="text-align: center;">لا توجد عمليات توزيع أرباح</td></tr>';
    }
    
    let rows = '';
    
    sortedOperations.forEach(operation => {
        rows += `
            <tr>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td>${operation.details || '-'}</td>
                <td><div class="status-pill status-deposit">مكتمل</div></td>
            </tr>
        `;
    });
    
    return rows;
}

// Generar gráfico para ganancias (versión arreglada)
function generateProfitChartFixed(investorId) {
    const profitOperations = operationsData.filter(op => op.investorId === investorId && op.type === 'profit');
    
    if (profitOperations.length === 0) {
        const container = document.getElementById('profit-chart-container');
        if (container) {
            container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: var(--text-muted);">لا توجد بيانات كافية لإنشاء الرسم البياني</div>';
        }
        return;
    }
    
    // Ordenar operaciones por fecha
    const sortedOperations = [...profitOperations].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Preparar datos para el gráfico
    const dates = [];
    const profitData = [];
    const cumulativeProfitData = [];
    
    let cumulative = 0;
    
    sortedOperations.forEach(operation => {
        const formattedDate = formatDate(operation.date);
        cumulative += operation.amount;
        
        dates.push(formattedDate);
        profitData.push(operation.amount);
        cumulativeProfitData.push(cumulative);
    });
    
    // Crear gráfico
    const canvas = document.getElementById('profit-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Eliminar gráfico existente si lo hay
    if (window.profitChart) {
        window.profitChart.destroy();
    }
    
    if (window.Chart) {
        window.profitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'الربح الشهري',
                        data: profitData,
                        backgroundColor: 'rgba(255, 193, 7, 0.5)',
                        borderColor: 'rgba(255, 193, 7, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'الأرباح المتراكمة',
                        data: cumulativeProfitData,
                        type: 'line',
                        fill: false,
                        borderColor: 'rgb(54, 162, 235)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'التاريخ'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'الربح الشهري'
                        },
                        beginAtZero: true
                    },
                    y1: {
                        title: {
                            display: true,
                            text: 'الأرباح المتراكمة'
                        },
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'تحليل توزيع الأرباح'
                    }
                }
            }
        });
    } else {
        console.error("La biblioteca Chart.js no está disponible");
        canvas.innerHTML = '<div style="text-align: center; padding: 20px;">لا يمكن إنشاء الرسم البياني</div>';
    }
}

// Arreglar botones en la tabla de operaciones
function fixOperationsTableButtons() {
    const operationsTable = document.querySelector('#operations table tbody');
    if (!operationsTable) return;
    
    // Eliminar los eventos antiguos para evitar duplicados
    const oldButtons = operationsTable.querySelectorAll('.action-btn');
    oldButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    
    // Volver a agregar los eventListeners
    const viewButtons = operationsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Ver operación con ID: ${id}`);
            viewOperationFixed(id);
        });
    });
    
    const editButtons = operationsTable.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Editar operación con ID: ${id}`);
            editOperationFixed(id);
        });
    });
    
    const deleteButtons = operationsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`Eliminar operación con ID: ${id}`);
            deleteOperationFixed(id);
        });
    });
    
    console.log("Botones de la tabla de operaciones arreglados");
}

// Ver detalles de operación (versión arreglada)
function viewOperationFixed(id) {
    console.log(`Visualizando operación: ${id}`);
    
    // Buscar la operación en los datos
    const operation = operationsData.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    const investor = investorsData.find(inv => inv.id === operation.investorId);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر المرتبط', 'danger');
        return;
    }
    
    // Crear modal de detalles
    createOperationDetailsModalFixed(operation, investor);
}

// Crear modal de detalles de operación (versión arreglada)
function createOperationDetailsModalFixed(operation, investor) {
    // Eliminar modal existente si hay uno
    const existingModal = document.getElementById('operation-details-modal-overlay');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    let typeClass = '';
    let typeText = '';
    
    if (operation.type === 'deposit') {
        typeClass = 'status-deposit';
        typeText = 'إيداع';
    } else if (operation.type === 'withdrawal') {
        typeClass = 'status-withdrawal';
        typeText = 'سحب';
    } else if (operation.type === 'profit') {
        typeClass = 'status-profit';
        typeText = 'أرباح';
    }
    
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'operation-details-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'block';
    
    const modalContent = `
        <div class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">تفاصيل العملية</div>
                    <span class="close-modal" id="operation-details-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="stat-card" style="margin-bottom: 20px;">
                        <div class="stat-icon" style="background: linear-gradient(135deg, ${operation.type === 'deposit' ? 'var(--success-color), #6deca9' : operation.type === 'withdrawal' ? 'var(--danger-color), #ff8f8f' : 'var(--warning-color), #ffd54f'});">
                            <i class="fas fa-${operation.type === 'deposit' ? 'arrow-up' : operation.type === 'withdrawal' ? 'arrow-down' : 'money-bill-wave'}"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-value">${formatCurrency(operation.amount)}</div>
                            <div class="stat-label"><div class="status-pill ${typeClass}">${typeText}</div></div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                        <div>
                            <div style="font-weight: bold;">المستثمر</div>
                            <div>${investor.name}</div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">تاريخ العملية</div>
                            <div>${formatDate(operation.date)}</div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">حالة العملية</div>
                            <div><div class="status-pill status-deposit">مكتمل</div></div>
                        </div>
                        <div>
                            <div style="font-weight: bold;">تاريخ الإنشاء</div>
                            <div>${formatDate(operation.createdAt || operation.date)}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold;">تفاصيل العملية</div>
                        <div>${operation.details || '-'}</div>
                    </div>
                    
                    ${operation.type !== 'profit' ? `
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold;">تأثير على الربح الشهري</div>
                        <div>${operation.type === 'deposit' ? '+' : '-'}${formatCurrency(calculateProfit(operation.amount))}</div>
                    </div>
                    ` : ''}
                    
                    <div class="alert ${operation.type === 'deposit' ? 'alert-success' : operation.type === 'withdrawal' ? 'alert-danger' : 'alert-warning'}">
                        <i class="fas fa-info-circle"></i>
                        ${operation.type === 'deposit' ? 'تمت عملية الإيداع بنجاح وتمت إضافة المبلغ إلى رصيد المستثمر.' : operation.type === 'withdrawal' ? 'تمت عملية السحب بنجاح وتم خصم المبلغ من رصيد المستثمر.' : 'تم توزيع الربح بنجاح على المستثمر.'}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-primary" id="operation-details-close-btn">إغلاق</button>
                    <button class="btn btn-primary edit-operation-btn" data-id="${operation.id}">تعديل</button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.innerHTML = modalContent;
    document.body.appendChild(modalOverlay);
    
    // Agregar eventos
    document.getElementById('operation-details-close').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    document.getElementById('operation-details-close-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
    });
    
    modalOverlay.querySelector('.edit-operation-btn').addEventListener('click', function() {
        document.body.removeChild(modalOverlay);
        editOperationFixed(operation.id);
    });
}

// Editar operación (versión arreglada)
function editOperationFixed(id) {
    console.log(`Editando operación: ${id}`);
    
    // Buscar la operación en los datos
    const operation = operationsData.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    operationForm.reset();
    operationForm.setAttribute('data-mode', 'edit');
    operationForm.setAttribute('data-id', id);
    
    operationTypeSelect.value = operation.type;
    operationModalTitle.textContent = operation.type === 'deposit' ? 'تعديل إيداع' : operation.type === 'withdrawal' ? 'تعديل سحب' : 'تعديل ربح';
    
    // Llenar formulario
    document.getElementById('operation-investor').value = operation.investorId;
    document.getElementById('operation-amount').value = operation.amount;
    operationDateInput.value = formatDateForInput(new Date(operation.date));
    document.getElementById('operation-details').value = operation.details || '';
    
    // Validar fecha
    const validation = validateInvestmentDate(operation.date);
    operationDateMessage.textContent = validation.message;
    operationDateMessage.style.color = validation.valid ? 'green' : 'red';
    
    operationModalOverlay.style.display = 'block';
    operationModal.style.display = 'block';
    
    // Bloquear cambio de tipo y inversor en edición
    operationTypeSelect.disabled = true;
    document.getElementById('operation-investor').disabled = true;
}

// Eliminar operación (versión arreglada)
function deleteOperationFixed(id) {
    console.log(`Eliminando operación: ${id}`);
    
    // Mostrar confirmación
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) {
        return;
    }
    
    // Eliminar operación directamente de los datos
    operationsData = operationsData.filter(op => op.id !== id);
    
    // Si tenemos acceso a la base de datos, también eliminar allí
    if (db) {
        try {
            const transaction = db.transaction(['operations'], 'readwrite');
            const operationsStore = transaction.objectStore('operations');
            operationsStore.delete(id);
        } catch (error) {
            console.error('Error al eliminar operación de la base de datos:', error);
        }
    }
    
    // Actualizar interfaz
    updateOperationsTable();
    updateProfitsTable();
    updateDashboardStats();
    
    // Mostrar mensaje de éxito
    showAlert('تم حذف العملية بنجاح', 'success');
}

// Arreglar botones en análisis
function fixAnalyticsButtons() {
    // Arreglar botones de gráficos
    const chartTabs = document.querySelectorAll('.card-tab');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            const tabs = this.parentElement.querySelectorAll('.card-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            updateChartFixed(chartType);
        });
    });
    
    console.log("Botones de análisis arreglados");
}

// Actualizar gráfico según tipo (versión arreglada)
function updateChartFixed(chartType) {
    const activePage = getActivePage();
    
    if (activePage === 'dashboard') {
        updateDashboardCharts();
    } else if (activePage === 'profits') {
        updateProfitsCharts();
    } else if (activePage === 'operations') {
        updateOperationsCharts();
    } else if (activePage === 'analytics') {
        updateAnalyticsCharts();
    }
}

// Arreglar botones de impresión
function fixPrintButtons() {
    const printButtons = document.querySelectorAll('.btn-print, .print-report-btn');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Determinar qué imprimir según el contexto
            const page = getActivePage();
            if (page === 'investors') {
                printInvestors();
            } else if (page === 'profits') {
                printProfits();
            } else if (page === 'operations') {
                printOperations();
            } else if (page === 'reports') {
                printReport('monthly', new Date(), new Date(), document.querySelector('#report-results').innerHTML);
            } else {
                // Impresión genérica
                window.print();
            }
        });
    });
    
    console.log("Botones de impresión arreglados");
}

// Imprimir inversores
function printInvestors() {
    const printWindow = window.open('', '_blank');
    
    let tableContent = '<table border="1" style="width: 100%; border-collapse: collapse;">';
    tableContent += '<thead><tr><th>الاسم</th><th>رقم الهاتف</th><th>العنوان</th><th>رقم البطاقة</th><th>إجمالي الاستثمار</th><th>الربح الشهري</th></tr></thead>';
    tableContent += '<tbody>';
    
    investorsData.forEach(investor => {
        const totalInvestment = calculateTotalInvestment(investor.id);
        const monthlyProfit = calculateMonthlyProfit(investor.id);
        
        tableContent += `
            <tr>
                <td>${investor.name}</td>
                <td>${investor.phone}</td>
                <td>${investor.address || '-'}</td>
                <td>${investor.idCard}</td>
                <td>${formatCurrency(totalInvestment)}</td>
                <td>${formatCurrency(monthlyProfit)}</td>
            </tr>
        `;
    });
    
    tableContent += '</tbody></table>';
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>قائمة المستثمرين</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: right; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة المستثمرين</h1>
            ${tableContent}
            <div class="footer">
                © ${new Date().getFullYear()} نظام إدارة الاستثمار - تاريخ الطباعة: ${formatDate(new Date().toISOString())}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Imprimir ganancias
function printProfits() {
    const printWindow = window.open('', '_blank');
    
    let tableContent = '<table border="1" style="width: 100%; border-collapse: collapse;">';
    tableContent += '<thead><tr><th>المستثمر</th><th>المبلغ المستثمر</th><th>الربح الشهري</th><th>تاريخ الاستثمار</th><th>عدد الأيام</th><th>آخر توزيع</th></tr></thead>';
    tableContent += '<tbody>';
    
    // Agrupar operaciones por inversor
    const investorOperations = {};
    
    operationsData.forEach(operation => {
        if (!investorOperations[operation.investorId]) {
            investorOperations[operation.investorId] = [];
        }
        
        investorOperations[operation.investorId].push(operation);
    });
    
    // Calcular ganancias para cada inversor
    Object.keys(investorOperations).forEach(investorId => {
        const investor = getInvestorById(parseInt(investorId));
        if (!investor) return;
        
        const operations = investorOperations[investorId];
        const totalInvestment = calculateTotalInvestment(parseInt(investorId));
        const monthlyProfit = calculateMonthlyProfit(parseInt(investorId));
        
        if (totalInvestment <= 0) return;
        
        // Obtener la fecha del depósito más antiguo
        const deposits = operations.filter(op => op.type === 'deposit');
        if (deposits.length === 0) return;
        
        const earliestDeposit = deposits.reduce((earliest, deposit) => {
            return new Date(deposit.date) < new Date(earliest.date) ? deposit : earliest;
        }, deposits[0]);
        
        const daysActive = calculateDaysActive(earliestDeposit.date);
        
        // Encontrar la última distribución de ganancia
        const lastProfit = operations.filter(op => op.type === 'profit').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        tableContent += `
            <tr>
                <td>${investor.name}</td>
                <td>${formatCurrency(totalInvestment)}</td>
                <td>${formatCurrency(monthlyProfit)}</td>
                <td>${formatDate(earliestDeposit.date)}</td>
                <td>${daysActive}</td>
                <td>${lastProfit ? formatDate(lastProfit.date) : '-'}</td>
            </tr>
        `;
    });
    
    tableContent += '</tbody></table>';
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>قائمة الأرباح</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: right; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة الأرباح</h1>
            ${tableContent}
            <div class="footer">
                © ${new Date().getFullYear()} نظام إدارة الاستثمار - تاريخ الطباعة: ${formatDate(new Date().toISOString())}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Imprimir operaciones
function printOperations() {
    const printWindow = window.open('', '_blank');
    
    let tableContent = '<table border="1" style="width: 100%; border-collapse: collapse;">';
    tableContent += '<thead><tr><th>المستثمر</th><th>نوع العملية</th><th>المبلغ</th><th>تأثير الربح</th><th>التاريخ</th><th>الحالة</th></tr></thead>';
    tableContent += '<tbody>';
    
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...operationsData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOperations.forEach(operation => {
        const investor = getInvestorById(operation.investorId);
        if (!investor) return;
        
        let typeText = '';
        
        if (operation.type === 'deposit') {
            typeText = 'إيداع';
        } else if (operation.type === 'withdrawal') {
            typeText = 'سحب';
        } else if (operation.type === 'profit') {
            typeText = 'أرباح';
        }
        
        tableContent += `
            <tr>
                <td>${investor.name}</td>
                <td>${typeText}</td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${operation.type === 'deposit' ? '+' : operation.type === 'withdrawal' ? '-' : ''}${formatCurrency(operation.profit || calculateProfit(operation.amount))}</td>
                <td>${formatDate(operation.date)}</td>
                <td>مكتمل</td>
            </tr>
        `;
    });
    
    tableContent += '</tbody></table>';
    
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>قائمة العمليات</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                h1 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: right; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <h1>قائمة العمليات</h1>
            ${tableContent}
            <div class="footer">
                © ${new Date().getFullYear()} نظام إدارة الاستثمار - تاريخ الطباعة: ${formatDate(new Date().toISOString())}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Arreglar botones de modales
function fixModalButtons() {
    // Agregar evento a botón de modal de agregar inversor
    document.getElementById('add-investor-btn').addEventListener('click', function() {
        openAddInvestorModalFixed();
    });
    
    // Agregar evento a botón de modal de agregar depósito
    document.getElementById('add-deposit-btn').addEventListener('click', function() {
        openAddDepositModalFixed();
    });
    
    // Agregar evento a botón de modal de agregar retiro
    document.getElementById('add-withdrawal-btn').addEventListener('click', function() {
        openAddWithdrawalModalFixed();
    });
    
    console.log("Botones de modales arreglados");
}

// Abrir modal para agregar inversor (versión arreglada)
function openAddInvestorModalFixed() {
    investorForm.reset();
    investorForm.removeAttribute('data-mode');
    investorForm.removeAttribute('data-id');
    
    document.querySelector('#investor-modal .modal-title').textContent = 'إضافة مستثمر جديد';
    
    investorDateMessage.textContent = '';
    investorModalOverlay.style.display = 'block';
    investorModal.style.display = 'block';
    
    // Establecer fecha predeterminada a hoy
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    investorDateInput.value = formattedDate;
    
    // Habilitar campo de monto para nuevo inversor
    const amountInput = document.getElementById('investor-amount');
    amountInput.disabled = false;
    
    // Validar fecha predeterminada
    const validation = validateInvestmentDate(formattedDate);
    investorDateMessage.textContent = validation.message;
    investorDateMessage.style.color = validation.valid ? 'green' : 'red';
}

// Llamar a la función para arreglar todos los botones
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar datos de ejemplo si es necesario
    if (!investorsData || investorsData.length === 0) {
        investorsData = [
            {
                id: 1,
                name: 'أحمد محمد',
                phone: '07701234567',
                address: 'بغداد - الكرخ',
                idCard: '12345678',
                email: 'ahmed@example.com',
                job: 'مهندس',
                amount: 1000000,
                date: '2025-04-01',
                createdAt: '2025-04-01T10:00:00.000Z'
            },
            {
                id: 2,
                name: 'سارة علي',
                phone: '07709876543',
                address: 'بغداد - الرصافة',
                idCard: '87654321',
                email: 'sara@example.com',
                job: 'محاسبة',
                amount: 2500000,
                date: '2025-04-05',
                createdAt: '2025-04-05T11:30:00.000Z'
            },
            {
                id: 3,
                name: 'علي حسن',
                phone: '07702345678',
                address: 'البصرة',
                idCard: '23456789',
                email: 'ali@example.com',
                job: 'تاجر',
                amount: 3000000,
                date: '2025-04-10',
                createdAt: '2025-04-10T09:15:00.000Z'
            },
            {
                id: 4,
                name: 'محمد عبدالله',
                phone: '07703456789',
                address: 'أربيل',
                idCard: '34567890',
                email: 'mohammed@example.com',
                job: 'طبيب',
                amount: 10000000,
                date: '2025-04-15',
                createdAt: '2025-04-15T14:45:00.000Z'
            }
        ];
    }
    
    if (!operationsData || operationsData.length === 0) {
        operationsData = [
            {
                id: 1,
                investorId: 1,
                type: 'deposit',
                amount: 1000000,
                date: '2025-04-01',
                profit: 17500,
                details: 'إيداع أولي',
                createdAt: '2025-04-01T10:00:00.000Z'
            },
            {
                id: 2,
                investorId: 2,
                type: 'deposit',
                amount: 2500000,
                date: '2025-04-05',
                profit: 43750,
                details: 'إيداع أولي',
                createdAt: '2025-04-05T11:30:00.000Z'
            },
            {
                id: 3,
                investorId: 3,
                type: 'deposit',
                amount: 3000000,
                date: '2025-04-10',
                profit: 52500,
                details: 'إيداع أولي',
                createdAt: '2025-04-10T09:15:00.000Z'
            },
            {
                id: 4,
                investorId: 2,
                type: 'withdrawal',
                amount: 500000,
                date: '2025-04-15',
                profit: 8750,
                details: 'سحب جزئي',
                createdAt: '2025-04-15T13:20:00.000Z'
            },
            {
                id: 5,
                investorId: 4,
                type: 'deposit',
                amount: 10000000,
                date: '2025-04-15',
                profit: 175000,
                details: 'إيداع أولي',
                createdAt: '2025-04-15T14:45:00.000Z'
            },
            {
                id: 6,
                investorId: 4,
                type: 'profit',
                amount: 175000,
                date: '2025-05-01',
                details: 'توزيع الربح الشهري',
                createdAt: '2025-05-01T09:00:00.000Z'
            }
        ];
    }
    
    if (!notificationsData || notificationsData.length === 0) {
        notificationsData = [
            {
                id: 1,
                title: 'مستثمر جديد',
                message: 'تم إضافة مستثمر جديد: كريم جاسم',
                type: 'success',
                date: '2025-05-06T10:30:00.000Z',
                read: false
            },
            {
                id: 2,
                title: 'عملية سحب كبيرة',
                message: 'محمد عبدالله قام بسحب مبلغ 2,000,000 دينار',
                type: 'danger',
                date: '2025-05-06T08:45:00.000Z',
                read: false
            },
            {
                id: 3,
                title: 'تذكير بتوزيع الأرباح',
                message: 'موعد توزيع الأرباح الشهرية بعد 3 أيام',
                type: 'warning',
                date: '2025-05-06T06:15:00.000Z',
                read: false
            }
        ];
    }
    
    setTimeout(fixAllButtonIssues, 500);
});