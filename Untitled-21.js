// Sistema de Gestión de Inversiones
// Archivo principal con todas las funcionalidades

// ============ Variables Globales ============
let investors = [];
let investments = [];
let operations = [];
let events = [];
let notifications = [];
let backupList = [];
let reports = [];
let settings = {
    monthlyProfitRate: 1.75, // Tasa de beneficio mensual por defecto 1.75%
    companyName: 'شركة الاستثمار العراقية', // Nombre de la empresa (Compañía de Inversión Iraquí)
    minInvestment: 1000000, // Inversión mínima
    profitDistributionPeriod: 'monthly', // Período de distribución de beneficios
    profitDistributionDay: 1, // Día de distribución de beneficios
    earlyWithdrawalFee: 0.5, // Comisión por retiro anticipado
    maxPartialWithdrawal: 50, // Porcentaje máximo de retiro parcial
    currency: 'IQD', // Moneda por defecto (Dinar iraquí)
    acceptedCurrencies: ['IQD', 'USD'], // Monedas aceptadas
    notificationSettings: {
        systemNotifications: true,
        loginNotifications: true,
        backupNotifications: true,
        newInvestorNotifications: true,
        newInvestmentNotifications: true,
        withdrawalNotifications: true,
        profitDistributionNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        startTime: '09:00',
        endTime: '18:00'
    }
};

let currentInvestorId = null;
let currentInvestmentId = null;
let currentOperationId = null;
let currentEventId = null;
let currentReportId = null;
let pendingDeleteId = null;
let pendingDeleteType = null;
let calendarCurrentMonth = new Date();
let calendarCurrentView = 'month';
let chartPeriod = 'monthly';
let syncActive = false;
let lastSyncTime = null;

// ============ Funciones de Utilidad ============

// Generar un ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generar ID de operación
function generateOperationId() {
    const year = new Date().getFullYear();
    const count = operations.length + 1;
    return `OP-${year}-${count.toString().padStart(3, '0')}`;
}

// Formatear número con comas
function formatNumber(num) {
    if (isNaN(num)) return "0";
    return parseFloat(num).toLocaleString('ar-IQ');
}

// Formatear moneda
function formatCurrency(amount) {
    return formatNumber(amount) + ' ' + settings.currency;
}

// Formatear fecha en formato local
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ');
}

// Formatear hora en formato local
function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

// Calcular diferencia de días entre dos fechas
function daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calcular beneficio mensual
function calculateMonthlyProfit(amount) {
    return (amount * settings.monthlyProfitRate) / 100;
}

// Calcular beneficio para un rango de fechas específico
function calculateProfit(amount, startDate, endDate) {
    if (!amount || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) return 0;
    
    const totalDays = daysDifference(startDate, endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    const days = end.getDate() - start.getDate();
    
    // Calcular beneficio mensual
    const monthlyProfit = calculateMonthlyProfit(amount);
    
    // Si es menos de un mes, calcular beneficio prorrateado
    if (months === 0) {
        const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        return (monthlyProfit * totalDays) / daysInMonth;
    } else {
        // Calcular beneficio de meses completos + días restantes
        const completeMonthsProfit = monthlyProfit * months;
        const daysInLastMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        const remainingDaysProfit = (monthlyProfit * days) / daysInLastMonth;
        
        return completeMonthsProfit + (days >= 0 ? remainingDaysProfit : 0);
    }
}

// Crear una notificación
function createNotification(title, message, type = 'info', entityId = null, entityType = null) {
    const notification = {
        id: generateId(),
        title,
        message,
        type,
        entityId,
        entityType,
        date: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    
    // Mantener solo las últimas 100 notificaciones
    if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
    }
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Guardar notificaciones
    saveNotifications();
    
    // Mostrar toast de notificación
    showNotificationToast(notification);
    
    // Devolver la notificación
    return notification;
}

// Mostrar toast de notificación
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${notification.type}`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.style.maxWidth = '500px';
    toast.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    
    toast.innerHTML = `
        <div class="alert-icon">
            <i class="fas fa-${notification.type === 'success' ? 'check-circle' : notification.type === 'danger' ? 'exclamation-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-title">${notification.title}</div>
            <div class="alert-text">${notification.message}</div>
        </div>
        <div class="modal-close" style="position: absolute; top: 10px; left: 10px; cursor: pointer;" onclick="this.parentNode.remove()">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Actualizar indicador de notificaciones
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Actualizar indicador principal de notificaciones
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
    
    // Actualizar indicador de notificaciones en el encabezado
    const notificationBadgeHeader = document.getElementById('notificationBadgeHeader');
    if (notificationBadgeHeader) {
        notificationBadgeHeader.textContent = unreadCount;
        notificationBadgeHeader.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
    
    // Actualizar indicador de operaciones
    const pendingOperations = operations.filter(op => op.status === 'pending').length;
    const operationsBadge = document.getElementById('operationsBadge');
    if (operationsBadge) {
        operationsBadge.textContent = pendingOperations;
        operationsBadge.style.display = pendingOperations > 0 ? 'inline-flex' : 'none';
    }
    
    // Actualizar texto de alerta en el dashboard
    updateDashboardAlert(unreadCount, pendingOperations);
}

// Actualizar alerta del dashboard
function updateDashboardAlert(unreadCount, pendingOperations) {
    const dashboardAlertText = document.getElementById('dashboardAlertText');
    if (!dashboardAlertText) return;
    
    if (unreadCount > 0 || pendingOperations > 0) {
        let message = 'Bienvenido al sistema. ';
        
        if (pendingOperations > 0) {
            message += `Hay ${pendingOperations} operaciones nuevas que requieren revisión${unreadCount > 0 ? ', y' : '.'}`;
        }
        
        if (unreadCount > 0) {
            message += `${pendingOperations > 0 ? '' : 'Hay '}${unreadCount} notificaciones nuevas.`;
        }
        
        dashboardAlertText.textContent = message;
    } else {
        dashboardAlertText.textContent = 'Bienvenido al sistema de gestión de inversiones. Haga clic en cualquier elemento del menú lateral para navegar.';
    }
}

// Obtener nombre del tipo de operación
function getOperationTypeName(type) {
    switch (type) {
        case 'investment':
            return 'Nueva inversión';
        case 'withdrawal':
            return 'Retiro';
        case 'profit':
            return 'Pago de beneficios';
        default:
            return type;
    }
}

// Obtener nombre del tipo de evento
function getEventTypeName(type) {
    switch (type) {
        case 'meeting':
            return 'Reunión';
        case 'payment':
            return 'Pago de beneficios';
        case 'withdrawal':
            return 'Retiro';
        case 'investment':
            return 'Inversión';
        case 'other':
            return 'Otro';
        default:
            return type;
    }
}

// Validar correo electrónico
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Validar teléfono
function validatePhone(phone) {
    // Validación básica para números de teléfono iraquíes
    const re = /^07\d{9}$/;
    return re.test(phone);
}

// Generar datos para gráficos
function generateChartData(period = 'monthly') {
    // Generar datos para gráficos según período (diario, mensual, anual)
    const chartData = [];
    const today = new Date();
    let startDate, endDate, dateFormat;
    
    switch (period) {
        case 'daily':
            // Últimos 30 días
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            endDate = today;
            dateFormat = 'DD/MM';
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const day = new Date(d);
                
                // Calcular inversiones totales para este día
                const dayInvestments = investments.filter(inv => 
                    new Date(inv.date).toDateString() === day.toDateString()
                ).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calcular beneficios totales hasta este día
                let dayProfits = 0;
                investments.forEach(inv => {
                    if (new Date(inv.date) <= day && (inv.status === 'active' || 
                        (inv.status === 'closed' && new Date(inv.closedDate) >= day))) {
                        dayProfits += calculateProfit(inv.amount, inv.date, day.toISOString());
                    }
                });
                
                chartData.push({
                    date: `${day.getDate()}/${day.getMonth() + 1}`,
                    investments: dayInvestments,
                    profits: dayProfits
                });
            }
            break;
            
        case 'monthly':
            // Últimos 12 meses
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 11);
            startDate.setDate(1);
            
            const monthNames = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            
            for (let m = 0; m < 12; m++) {
                const month = new Date(startDate);
                month.setMonth(month.getMonth() + m);
                
                const nextMonth = new Date(month);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                // Calcular inversiones totales para este mes
                const monthInvestments = investments.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === month.getMonth() && 
                           invDate.getFullYear() === month.getFullYear();
                }).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calcular beneficios totales hasta el final de este mes
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
                let monthProfits = 0;
                
                investments.forEach(inv => {
                    if (new Date(inv.date) <= monthEnd && (inv.status === 'active' || 
                        (inv.status === 'closed' && new Date(inv.closedDate) >= month))) {
                        monthProfits += calculateProfit(inv.amount, inv.date, monthEnd.toISOString());
                    }
                });
                
                chartData.push({
                    date: monthNames[month.getMonth()],
                    investments: monthInvestments,
                    profits: monthProfits
                });
            }
            break;
            
        case 'yearly':
            // Últimos 5 años
            startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 4);
            startDate.setMonth(0);
            startDate.setDate(1);
            
            for (let y = 0; y < 5; y++) {
                const year = startDate.getFullYear() + y;
                const yearStart = new Date(year, 0, 1);
                const yearEnd = new Date(year, 11, 31);
                
                // Calcular inversiones totales para este año
                const yearInvestments = investments.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getFullYear() === year;
                }).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calcular beneficios totales hasta el final de este año
                let yearProfits = 0;
                
                investments.forEach(inv => {
                    if (new Date(inv.date) <= yearEnd && (inv.status === 'active' || 
                        (inv.status === 'closed' && new Date(inv.closedDate) >= yearStart))) {
                        yearProfits += calculateProfit(inv.amount, inv.date, yearEnd.toISOString());
                    }
                });
                
                chartData.push({
                    date: year.toString(),
                    investments: yearInvestments,
                    profits: yearProfits
                });
            }
            break;
    }
    
    return chartData;
}

// Cargar gráfico
function loadChart(chartId, data, config = {}) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    // Limpiar gráfico anterior
    chartContainer.innerHTML = '';
    
    // Si no hay datos, mostrar marcador de posición
    if (!data || data.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--gray-600);">
                    <i class="fas fa-chart-line fa-3x" style="margin-bottom: 10px;"></i>
                    <p>No hay datos para mostrar</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Crear canvas para el gráfico
    const canvas = document.createElement('canvas');
    canvas.width = chartContainer.offsetWidth;
    canvas.height = chartContainer.offsetHeight;
    chartContainer.appendChild(canvas);
    
    // Obtener contexto
    const ctx = canvas.getContext('2d');
    
    // Crear gráfico
    new Chart(ctx, {
        type: config.type || 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: config.datasets || [
                {
                    label: 'Inversiones',
                    data: data.map(d => d.investments),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Beneficios',
                    data: data.map(d => d.profits),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

// ============ Funciones de la Interfaz de Usuario ============

// Alternar barra lateral
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Mostrar página específica
function showPage(pageId) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar la página seleccionada
    document.getElementById(pageId).classList.add('active');
    
    // Marcar el elemento de menú actual como activo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`.menu-item[href="#${pageId}"]`).classList.add('active');
    
    // Actualizar el contenido de la página si es necesario
    switch (pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'investors':
            loadInvestors();
            break;
        case 'investments':
            loadInvestments();
            break;
        case 'profits':
            loadProfits();
            break;
        case 'operations':
            loadOperations();
            break;
        case 'reports':
            populateReportInvestors();
            loadReports();
            break;
        case 'financial':
            loadFinancialData();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Alternar panel de notificaciones
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('active');
    
    // Cargar notificaciones si el panel está activo
    if (panel.classList.contains('active')) {
        loadNotifications();
    }
}

// Abrir modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Cambiar pestaña en modal
function switchModalTab(tabId, modalId) {
    // Ocultar todas las pestañas
    document.querySelectorAll(`#${modalId} .modal-tab-content`).forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Marcar la pestaña actual como activa
    document.querySelectorAll(`#${modalId} .modal-tab`).forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#${modalId} .modal-tab[onclick="switchModalTab('${tabId}', '${modalId}')"]`).classList.add('active');
}

// Cambiar pestaña de análisis
function switchAnalyticsTab(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.analytics-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(`analytics${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
    
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#analytics .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#analytics .tab[onclick="switchAnalyticsTab('${tabId}')"]`).classList.add('active');
    
    // Cargar datos de análisis para la pestaña
    loadAnalyticsForTab(tabId);
}

// Cambiar pestaña de inversiones
function switchInvestmentsTab(tabId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#investments .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#investments .tab[onclick="switchInvestmentsTab('${tabId}')"]`).classList.add('active');
    
    // Actualizar contenido de la tabla según la pestaña seleccionada
    if (tabId === 'active') {
        document.querySelector('#investments .table-title').textContent = 'Inversiones Activas';
        loadInvestments('active');
    } else if (tabId === 'closed') {
        document.querySelector('#investments .table-title').textContent = 'Inversiones Cerradas';
        loadInvestments('closed');
    } else {
        document.querySelector('#investments .table-title').textContent = 'Todas las Inversiones';
        loadInvestments('all');
    }
}

// Cambiar pestaña de beneficios
function switchProfitsTab(tabId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#profits .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#profits .tab[onclick="switchProfitsTab('${tabId}')"]`).classList.add('active');
    
    // Cargar datos de beneficios relevantes
    loadProfitsForTab(tabId);
}

// Cambiar pestaña de operaciones
function switchOperationsTab(tabId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#operations .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#operations .tab[onclick="switchOperationsTab('${tabId}')"]`).classList.add('active');
    
    // Actualizar contenido de la tabla según la pestaña seleccionada
    loadOperations(tabId);
}

// Cambiar pestaña de informes
function switchReportsTab(tabId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#reports .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#reports .tab[onclick="switchReportsTab('${tabId}')"]`).classList.add('active');
    
    // Cargar la pestaña de informes seleccionada
    loadReportsForTab(tabId);
}

// Cambiar pestaña financiera
function switchFinancialTab(tabId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#financial .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#financial .tab[onclick="switchFinancialTab('${tabId}')"]`).classList.add('active');
    
    // Cargar datos financieros para la pestaña
    loadFinancialForTab(tabId);
}

// Cambiar vista de calendario
function switchCalendarView(viewId) {
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#calendar .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#calendar .tab[onclick="switchCalendarView('${viewId}')"]`).classList.add('active');
    
    // Actualizar vista de calendario
    calendarCurrentView = viewId;
    loadCalendar();
}

// Cambiar pestaña de configuración
function switchSettingsTab(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(`${tabId}Settings`).classList.add('active');
    
    // Marcar la pestaña actual como activa
    document.querySelectorAll('#settings .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#settings .tab[onclick="switchSettingsTab('${tabId}')"]`).classList.add('active');
    
    // Caso especial para la pestaña de sincronización
    if (tabId === 'sync') {
        updateSyncSettingsStatus();
    }
}

// Actualizar mensaje de días cuando cambia la fecha de inversión
function updateDaysMessage() {
    const dateInput = document.getElementById('investmentDate');
    const messageDiv = document.getElementById('daysMessage');
    
    if (!dateInput || !messageDiv || !dateInput.value) return;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    
    // Resetear hora para comparar solo fechas
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        messageDiv.textContent = `Fecha anterior seleccionada (hace ${diffDays} días)`;
        messageDiv.style.color = 'var(--warning-color)';
    } else if (diffDays < 0) {
        messageDiv.textContent = `Fecha futura seleccionada (en ${Math.abs(diffDays)} días)`;
        messageDiv.style.color = 'var(--info-color)';
    } else {
        messageDiv.textContent = 'Fecha de hoy seleccionada';
        messageDiv.style.color = 'var(--success-color)';
    }
}

// Actualizar beneficio esperado cuando cambia el monto de inversión
function updateExpectedProfit() {
    const amountInput = document.getElementById('investmentAmount');
    const profitInput = document.getElementById('expectedProfit');
    
    if (!amountInput || !profitInput || !amountInput.value) {
        if (profitInput) profitInput.value = '';
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const monthlyProfit = calculateMonthlyProfit(amount);
    
    profitInput.value = formatCurrency(monthlyProfit.toFixed(2));
}

// Actualizar beneficio esperado para inversión inicial
function updateInitialExpectedProfit() {
    const amountInput = document.getElementById('initialInvestmentAmount');
    const profitInput = document.getElementById('initialExpectedProfit');
    
    if (!amountInput || !profitInput || !amountInput.value) {
        if (profitInput) profitInput.value = '';
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const monthlyProfit = calculateMonthlyProfit(amount);
    
    profitInput.value = formatCurrency(monthlyProfit.toFixed(2));
}

// Imprimir tabla
function printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>Imprimir</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: right;
                }
                th {
                    background-color: #f2f2f2;
                }
                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .date {
                    text-align: left;
                }
                .status {
                    padding: 5px 10px;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-align: center;
                    display: inline-block;
                }
                .status.active {
                    background: rgba(46, 204, 113, 0.1);
                    color: #2ecc71;
                }
                .status.pending {
                    background: rgba(243, 156, 18, 0.1);
                    color: #f39c12;
                }
                .status.closed {
                    background: rgba(231, 76, 60, 0.1);
                    color: #e74c3c;
                }
                @media print {
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>${settings.companyName}</h2>
                <div class="date">Fecha de impresión: ${new Date().toLocaleDateString('ar-IQ')}</div>
            </div>
            <h1>${document.querySelector('.page.active .page-title').textContent}</h1>
            ${table.outerHTML}
            <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir</button>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
}

// Alternar rango de fechas personalizado para informe financiero
function toggleCustomDateRange() {
    const periodSelect = document.getElementById('financialReportPeriod');
    const customDateRange = document.getElementById('customDateRange');
    
    if (!periodSelect || !customDateRange) return;
    
    if (periodSelect.value === 'custom') {
        customDateRange.style.display = 'grid';
    } else {
        customDateRange.style.display = 'none';
    }
}

// Alternar visibilidad de la clave API
function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
    } else {
        apiKeyInput.type = 'password';
    }
}

// Generar nueva clave API
function generateNewApiKey() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;
    
    // Generar clave API aleatoria
    const newKey = Array.from(Array(40), () => Math.floor(Math.random() * 36).toString(36)).join('');
    apiKeyInput.value = newKey;
    apiKeyInput.type = 'text';
    
    createNotification('Nueva clave API generada', 'Se ha generado correctamente una nueva clave API. Por favor, guarde la configuración para aplicar los cambios.', 'success');
    
    // Cambiar automáticamente de nuevo a tipo password después de 5 segundos
    setTimeout(() => {
        apiKeyInput.type = 'password';
    }, 5000);
}

// ============ Funciones de Gestión de Inversores ============

// Abrir modal para añadir inversor
function openAddInvestorModal() {
    // Resetear formulario
    document.getElementById('investorForm').reset();
    document.getElementById('initialInvestmentForm').reset();
    
    // Establecer fecha por defecto como hoy
    document.getElementById('initialInvestmentDate').valueAsDate = new Date();
    
    // Cambiar a primera pestaña
    switchModalTab('investorInfo', 'addInvestorModal');
    
    openModal('addInvestorModal');
}

// Abrir modal para nueva inversión
function openNewInvestmentModal(investorId = null) {
    // Resetear formulario
    document.getElementById('newInvestmentForm').reset();
    
    // Establecer fecha por defecto como hoy
    document.getElementById('investmentDate').valueAsDate = new Date();
    
    // Actualizar mensaje de días
    updateDaysMessage();
    
    // Llenar select de inversores
    populateInvestorSelect('investmentInvestor');
    
    // Si se proporciona ID de inversor, seleccionarlo
    if (investorId) {
        document.getElementById('investmentInvestor').value = investorId;
    }
    
    openModal('newInvestmentModal');
}

// Abrir modal de retiro
function openWithdrawModal(investmentId = null) {
    // Resetear formulario
    document.getElementById('withdrawForm').reset();
    
    // Establecer fecha por defecto como hoy
    document.getElementById('withdrawDate').valueAsDate = new Date();
    
    // Llenar select de inversores
    populateInvestorSelect('withdrawInvestor');
    
    // Si se proporciona ID de inversión, encontrar la inversión y seleccionar inversor e inversión
    if (investmentId) {
        const investment = investments.find(inv => inv.id === investmentId);
        if (investment) {
            document.getElementById('withdrawInvestor').value = investment.investorId;
            // Llenar select de inversiones
            populateInvestmentSelect();
            // Esperar a que se llene el select
            setTimeout(() => {
                document.getElementById('withdrawInvestment').value = investmentId;
                // Actualizar monto disponible
                updateAvailableAmount();
            }, 100);
        }
    }
    
    openModal('withdrawModal');
}

// Abrir modal de pago de beneficios
function openPayProfitModal(investorId = null) {
    // Resetear formulario
    document.getElementById('payProfitForm').reset();
    
    // Establecer fecha por defecto como hoy
    document.getElementById('profitDate').valueAsDate = new Date();
    
    // Ocultar campos de período personalizado
    document.getElementById('customProfitPeriod').style.display = 'none';
    
    // Llenar select de inversores
    populateInvestorSelect('profitInvestor');
    
    // Si se proporciona ID de inversor, seleccionarlo
    if (investorId) {
        document.getElementById('profitInvestor').value = investorId;
        // Actualizar beneficio debido
        updateDueProfit();
    }
    
    openModal('payProfitModal');
}

// Llenar select de inversores
function populateInvestorSelect(selectId) {
    const select = document.getElementById(selectId);
    
    if (!select) return;
    
    // Limpiar opciones anteriores
    select.innerHTML = '<option value="">Seleccionar inversor</option>';
    
    // Ordenar inversores por nombre
    const sortedInvestors = [...investors].sort((a, b) => a.name.localeCompare(b.name));
    
    // Añadir opciones de inversores
    sortedInvestors.forEach(investor => {
        const option = document.createElement('option');
        option.value = investor.id;
        option.textContent = investor.name;
        select.appendChild(option);
    });
}

// Llenar select de inversiones
function populateInvestmentSelect() {
    const investorId = document.getElementById('withdrawInvestor').value;
    const investmentSelect = document.getElementById('withdrawInvestment');
    
    // Limpiar opciones anteriores
    investmentSelect.innerHTML = '<option value="">Seleccionar inversión</option>';
    
    if (!investorId) return;
    
    // Encontrar inversiones activas para el inversor seleccionado
    const activeInvestments = investments.filter(
        inv => inv.investorId === investorId && inv.status === 'active'
    );
    
    activeInvestments.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.id;
        option.textContent = `${formatCurrency(inv.amount)} - ${formatDate(inv.date)}`;
        investmentSelect.appendChild(option);
    });
}

// Actualizar monto disponible
function updateAvailableAmount() {
    const investmentId = document.getElementById('withdrawInvestment').value;
    const availableInput = document.getElementById('availableAmount');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    
    if (!investmentId || !availableInput) return;
    
    const investment = investments.find(inv => inv.id === investmentId);
    if (investment) {
        availableInput.value = formatCurrency(investment.amount);
        
        // Establecer monto máximo de retiro
        if (withdrawAmountInput) {
            withdrawAmountInput.max = investment.amount;
            
            // Establecer valor por defecto como monto completo
            withdrawAmountInput.value = investment.amount;
        }
    }
}

// Actualizar beneficio debido
function updateDueProfit() {
    const investorId = document.getElementById('profitInvestor').value;
    const dueProfitInput = document.getElementById('dueProfit');
    
    if (!investorId || !dueProfitInput) return;
    
    // Calcular beneficio total para el inversor
    let totalProfit = 0;
    
    // Encontrar inversiones activas para el inversor seleccionado
    const activeInvestments = investments.filter(
        inv => inv.investorId === investorId && inv.status === 'active'
    );
    
    const today = new Date();
    
    activeInvestments.forEach(inv => {
        const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
        totalProfit += profit;
    });
    
    // Obtener beneficio total pagado
    const profitPaid = operations
        .filter(op => op.investorId === investorId && op.type === 'profit')
        .reduce((total, op) => total + op.amount, 0);
    
    // Calcular beneficio debido
    const dueProfit = Math.max(0, totalProfit - profitPaid);
    
    dueProfitInput.value = formatCurrency(dueProfit.toFixed(2));
    
    // Actualizar monto de beneficio
    const profitAmountInput = document.getElementById('profitAmount');
    if (profitAmountInput) {
        profitAmountInput.value = dueProfit.toFixed(0);
    }
}

// Alternar período de beneficio personalizado
function toggleCustomProfitPeriod() {
    const periodSelect = document.getElementById('profitPeriod');
    const customPeriod = document.getElementById('customProfitPeriod');
    
    if (!periodSelect || !customPeriod) return;
    
    if (periodSelect.value === 'custom') {
        customPeriod.style.display = 'grid';
    } else {
        customPeriod.style.display = 'none';
    }
}

// Buscar inversores
function searchInvestors() {
    const searchTerm = document.getElementById('investorSearchInput').value.toLowerCase();
    const tbody = document.getElementById('investorsTableBody');
    
    if (!tbody) return;
    
    // Si el término de búsqueda está vacío, restablecer la tabla
    if (!searchTerm) {
        loadInvestors();
        return;
    }
    
    // Obtener todas las filas de inversores
    const rows = tbody.querySelectorAll('tr');
    
    // Filtrar filas
    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const phone = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const address = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        const idCard = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
        
        // Mostrar fila si algún campo coincide con el término de búsqueda
        if (name.includes(searchTerm) || phone.includes(searchTerm) || 
            address.includes(searchTerm) || idCard.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Buscar inversiones
function searchInvestments() {
    const searchTerm = document.getElementById('investmentSearchInput').value.toLowerCase();
    const tbody = document.getElementById('investmentsTableBody');
    
    if (!tbody) return;
    
    // Si el término de búsqueda está vacío, restablecer la tabla
    if (!searchTerm) {
        const activeTab = document.querySelector('#investments .tab.active');
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadInvestments(tabId);
        return;
    }
    
    // Obtener todas las filas de inversiones
    const rows = tbody.querySelectorAll('tr');
    
    // Filtrar filas
    rows.forEach(row => {
        const investor = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const amount = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const date = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        // Mostrar fila si algún campo coincide con el término de búsqueda
        if (investor.includes(searchTerm) || amount.includes(searchTerm) || date.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Buscar operaciones
function searchOperations() {
    const searchTerm = document.getElementById('operationsSearchInput').value.toLowerCase();
    const tbody = document.getElementById('operationsTableBody');
    
    if (!tbody) return;
    
    // Si el término de búsqueda está vacío, restablecer la tabla
    if (!searchTerm) {
        const activeTab = document.querySelector('#operations .tab.active');
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadOperations(tabId);
        return;
    }
    
    // Obtener todas las filas de operaciones
    const rows = tbody.querySelectorAll('tr');
    
    // Filtrar filas
    rows.forEach(row => {
        const id = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const investor = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const type = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const amount = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        // Mostrar fila si algún campo coincide con el término de búsqueda
        if (id.includes(searchTerm) || investor.includes(searchTerm) || 
            type.includes(searchTerm) || amount.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Abrir modal de confirmación de eliminación
function openDeleteConfirmationModal(id, type) {
    pendingDeleteId = id;
    pendingDeleteType = type;
    
    // Establecer mensaje de confirmación
    const messageElement = document.getElementById('deleteConfirmationMessage');
    
    switch (type) {
        case 'investor':
            const investor = investors.find(inv => inv.id === id);
            if (investor) {
                messageElement.textContent = `¿Está seguro de que desea eliminar al inversor "${investor.name}"? Se eliminarán todos sus datos y transacciones.`;
            } else {
                messageElement.textContent = "¿Está seguro de que desea eliminar a este inversor? Se eliminarán todos sus datos y transacciones.";
            }
            break;
        case 'investment':
            messageElement.textContent = "¿Está seguro de que desea eliminar esta inversión? Esta acción no se puede deshacer.";
            break;
        case 'operation':
            messageElement.textContent = "¿Está seguro de que desea eliminar esta operación? Esta acción no se puede deshacer.";
            break;
        case 'event':
            messageElement.textContent = "¿Está seguro de que desea eliminar este evento? Esta acción no se puede deshacer.";
            break;
        case 'report':
            messageElement.textContent = "¿Está seguro de que desea eliminar este informe? Esta acción no se puede deshacer.";
            break;
        case 'backup':
            messageElement.textContent = "¿Está seguro de que desea eliminar esta copia de seguridad? Esta acción no se puede deshacer.";
            break;
        default:
            messageElement.textContent = "¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.";
    }
    
    openModal('deleteConfirmationModal');
}

// Confirmar eliminación
function confirmDelete() {
    if (!pendingDeleteId || !pendingDeleteType) {
        closeModal('deleteConfirmationModal');
        return;
    }
    
    switch (pendingDeleteType) {
        case 'investor':
            deleteInvestor(pendingDeleteId);
            break;
        case 'investment':
            deleteInvestment(pendingDeleteId);
            break;
        case 'operation':
            deleteOperation(pendingDeleteId);
            break;
        case 'event':
            deleteEvent(pendingDeleteId);
            break;
        case 'report':
            deleteReport(pendingDeleteId);
            break;
        case 'backup':
            deleteSelectedBackup(pendingDeleteId);
            break;
    }
    
    // Resetear eliminación pendiente
    pendingDeleteId = null;
    pendingDeleteType = null;
    
    // Cerrar modal
    closeModal('deleteConfirmationModal');
}

// Ver detalles del inversor
function viewInvestor(id) {
    // Establecer ID de inversor actual
    currentInvestorId = id;
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Llenar pestaña de detalles del inversor
    const detailsTab = document.getElementById('investorDetails');
    
    // Calcular inversión total para este inversor
    const totalInvestment = investments
        .filter(inv => inv.investorId === investor.id && inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    // Calcular beneficio total para este inversor
    const today = new Date();
    let totalProfit = 0;
    
    investments
        .filter(inv => inv.investorId === investor.id && inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfit += profit;
        });
    
    detailsTab.innerHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="width: 120px; height: 120px; background: var(--gray-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--gray-600); font-size: 3rem;">
                <i class="fas fa-user"></i>
            </div>
            <div style="flex: 1; min-width: 250px;">
                <h2 style="margin-bottom: 10px; color: var(--gray-800);">${investor.name}</h2>
                <p style="margin-bottom: 5px;"><i class="fas fa-phone" style="width: 20px; color: var(--gray-600);"></i> ${investor.phone}</p>
                <p style="margin-bottom: 5px;"><i class="fas fa-map-marker-alt" style="width: 20px; color: var(--gray-600);"></i> ${investor.address || 'No especificado'}</p>
                <p style="margin-bottom: 5px;"><i class="fas fa-id-card" style="width: 20px; color: var(--gray-600);"></i> ${investor.idCard || 'No especificado'}</p>
                <p style="margin-bottom: 5px;"><i class="fas fa-calendar-alt" style="width: 20px; color: var(--gray-600);"></i> Fecha de ingreso: ${formatDate(investor.joinDate)}</p>
            </div>
            <div style="min-width: 200px;">
                <div class="card" style="margin-bottom: 10px; border-right: 4px solid var(--primary-color);">
                    <div style="font-size: 0.9rem; color: var(--gray-600);">Inversión total</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatCurrency(totalInvestment)}</div>
                </div>
                <div class="card" style="border-right: 4px solid var(--warning-color);">
                    <div style="font-size: 0.9rem; color: var(--gray-600);">Beneficios totales</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatCurrency(totalProfit.toFixed(2))}</div>
                </div>
            </div>
        </div>
        <div style="background: var(--gray-100); border-radius: var(--border-radius); padding: 15px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px; color: var(--gray-700);">Información adicional</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">Correo electrónico</div>
                    <div>${investor.email || 'No especificado'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">Fecha de nacimiento</div>
                    <div>${investor.birthdate ? formatDate(investor.birthdate) : 'No especificado'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">Ciudad</div>
                    <div>${investor.city || 'No especificado'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">Ocupación</div>
                    <div>${investor.occupation || 'No especificado'}</div>
                </div>
            </div>
        </div>
        <div>
            <h3 style="margin-bottom: 10px; color: var(--gray-700);">Notas</h3>
            <p style="background: white; border-radius: var(--border-radius); padding: 15px; border: 1px solid var(--gray-200);">${investor.notes || 'No hay notas'}</p>
        </div>
    `;
    
    // Llenar pestaña de inversiones del inversor
    const investmentsTab = document.getElementById('investorInvestments');
    
    // Obtener inversiones del inversor
    const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
    
    if (investorInvestments.length === 0) {
        investmentsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">No hay inversiones</div>
                    <div class="alert-text">No hay inversiones para este inversor. Puede añadir una nueva inversión haciendo clic en el botón "Nueva inversión".</div>
                </div>
            </div>
        `;
    } else {
        investmentsTab.innerHTML = `
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Monto</th>
                            <th>Fecha de inversión</th>
                            <th>Beneficio mensual</th>
                            <th>Beneficios totales</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="investorInvestmentsBody"></tbody>
                </table>
            </div>
        `;
        
        const tbody = document.getElementById('investorInvestmentsBody');
        
        investorInvestments.forEach((investment, index) => {
            const monthlyProfit = calculateMonthlyProfit(investment.amount);
            const totalProfit = investment.status === 'active' ? 
                calculateProfit(investment.amount, investment.date, today.toISOString()) : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatCurrency(investment.amount)}</td>
                <td>${formatDate(investment.date)}</td>
                <td>${formatCurrency(monthlyProfit.toFixed(2))}</td>
                <td>${formatCurrency(totalProfit.toFixed(2))}</td>
                <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'Activa' : 'Cerrada'}</span></td>
                <td>
                    <button class="btn btn-info btn-icon action-btn" onclick="viewInvestment('${investment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${investment.status === 'active' ? `
                        <button class="btn btn-warning btn-icon action-btn" onclick="openWithdrawModal('${investment.id}')">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investor.id}')">
                            <i class="fas fa-money-bill"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Llenar pestaña de operaciones del inversor
    const operationsTab = document.getElementById('investorOperations');
    
    // Obtener operaciones del inversor
    const investorOperations = operations.filter(op => op.investorId === investor.id);
    
    if (investorOperations.length === 0) {
        operationsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">No hay operaciones</div>
                    <div class="alert-text">No hay operaciones para este inversor.</div>
                </div>
            </div>
        `;
    } else {
        operationsTab.innerHTML = `
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID Operación</th>
                            <th>Tipo de operación</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody id="investorOperationsBody"></tbody>
                </table>
            </div>
        `;
        
        const tbody = document.getElementById('investorOperationsBody');
        
        // Ordenar operaciones por fecha (más recientes primero)
        const sortedOperations = [...investorOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedOperations.forEach((operation) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${operation.id}</td>
                <td>${getOperationTypeName(operation.type)}</td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'Pendiente' : 'Completada'}</span></td>
                <td>${operation.notes || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Llenar pestaña de beneficios del inversor
    const profitsTab = document.getElementById('investorProfits');
    
    // Obtener inversiones activas para este inversor
    const activeInvestments = investments.filter(inv => inv.investorId === investor.id && inv.status === 'active');
    
    if (activeInvestments.length === 0) {
        profitsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">No hay inversiones activas</div>
                    <div class="alert-text">No hay inversiones activas para este inversor para calcular beneficios.</div>
                </div>
            </div>
        `;
    } else {
        // Obtener operaciones de pago de beneficios
        const profitPayments = operations.filter(op => op.investorId === investor.id && op.type === 'profit');
        
        // Calcular beneficio total pagado
        const totalProfitPaid = profitPayments.reduce((total, op) => total + op.amount, 0);
        
        profitsTab.innerHTML = `
            <div class="dashboard-cards" style="margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Beneficios totales</div>
                            <div class="card-value">${formatCurrency(totalProfit.toFixed(2))}</div>
                        </div>
                        <div class="card-icon primary">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Beneficios pagados</div>
                            <div class="card-value">${formatCurrency(totalProfitPaid.toFixed(2))}</div>
                        </div>
                        <div class="card-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">Beneficios pendientes</div>
                            <div class="card-value">${formatCurrency((totalProfit - totalProfitPaid).toFixed(2))}</div>
                        </div>
                        <div class="card-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <div class="table-header">
                    <div class="table-title">Historial de pagos de beneficios</div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID Operación</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody id="investorProfitsBody"></tbody>
                </table>
            </div>
        `;
        
        const tbody = document.getElementById('investorProfitsBody');
        
        if (profitPayments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" style="text-align: center;">No hay operaciones de pago de beneficios</td>
            `;
            tbody.appendChild(row);
        } else {
            // Ordenar pagos de beneficios por fecha (más recientes primero)
            const sortedPayments = [...profitPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedPayments.forEach((payment) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${payment.id}</td>
                    <td>${formatCurrency(payment.amount)}</td>
                    <td>${formatDate(payment.date)}</td>
                    <td>${payment.notes || '-'}</td>
                `;
                
                tbody.appendChild(row);
            });
        }
    }
    
    // Llenar pestaña de documentos del inversor
    const documentsTab = document.getElementById('investorDocuments');
    
    documentsTab.innerHTML = `
        <div class="alert alert-info">
            <div class="alert-icon">
                <i class="fas fa-info"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">Documentos</div>
                <div class="alert-text">Puede gestionar los documentos del inversor aquí.</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-id-card"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">Imagen de tarjeta de identidad</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'idCard')">
                    <i class="fas fa-upload"></i> Subir
                </button>
            </div>
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">Contrato de inversión</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'contract')">
                    <i class="fas fa-upload"></i> Subir
                </button>
            </div>
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">Documentos adicionales</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'other')">
                    <i class="fas fa-upload"></i> Subir
                </button>
            </div>
        </div>
    `;
    
    openModal('viewInvestorModal');
}

// Ver detalles de inversión
function viewInvestment(id) {
    // Encontrar inversión
    const investment = investments.find(inv => inv.id === id);
    
    if (!investment) {
        createNotification('Error', 'Inversión no encontrada', 'danger');
        return;
    }
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investment.investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Calcular beneficio mensual
    const monthlyProfit = calculateMonthlyProfit(investment.amount);
    
    // Calcular beneficio total
    const today = new Date();
    const totalProfit = investment.status === 'active' ? 
        calculateProfit(investment.amount, investment.date, today.toISOString()) : 0;
    
    // Crear popup de detalles de inversión
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'viewInvestmentModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Detalles de la inversión</h2>
                <div class="modal-close" onclick="document.getElementById('viewInvestmentModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <div class="dashboard-cards">
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Monto</div>
                                    <div class="card-value">${formatCurrency(investment.amount)}</div>
                                </div>
                                <div class="card-icon primary">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Beneficio mensual</div>
                                    <div class="card-value">${formatCurrency(monthlyProfit.toFixed(2))}</div>
                                </div>
                                <div class="card-icon success">
                                    <i class="fas fa-percentage"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Beneficios totales</div>
                                    <div class="card-value">${formatCurrency(totalProfit.toFixed(2))}</div>
                                </div>
                                <div class="card-icon warning">
                                    <i class="fas fa-hand-holding-usd"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Inversor</label>
                            <input type="text" class="form-control" value="${investor.name}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de inversión</label>
                            <input type="text" class="form-control" value="${formatDate(investment.date)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Estado</label>
                            <input type="text" class="form-control" value="${investment.status === 'active' ? 'Activa' : 'Cerrada'}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duración de la inversión</label>
                            <input type="text" class="form-control" value="${daysDifference(investment.date, today.toISOString())} días" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Tasa de beneficio mensual</label>
                            <input type="text" class="form-control" value="${settings.monthlyProfitRate}%" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Método de pago</label>
                            <input type="text" class="form-control" value="${getPaymentMethodName(investment.method || 'cash')}" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-control" rows="3" readonly>${investment.notes || 'No hay notas'}</textarea>
                    </div>
                </div>
                
                <div class="table-container" style="box-shadow: none; padding: 0;">
                    <div class="table-header">
                        <div class="table-title">Operaciones relacionadas</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID Operación</th>
                                <th>Tipo de operación</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody id="investmentOperationsBody">
                            ${getInvestmentOperationsHTML(investment.id)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('viewInvestmentModal').remove()">Cerrar</button>
                ${investment.status === 'active' ? `
                    <button class="btn btn-warning" onclick="document.getElementById('viewInvestmentModal').remove(); openWithdrawModal('${investment.id}')">
                        <i class="fas fa-minus"></i> Retirar
                    </button>
                    <button class="btn btn-primary" onclick="document.getElementById('viewInvestmentModal').remove(); openPayProfitModal('${investor.id}')">
                        <i class="fas fa-money-bill"></i> Pagar beneficios
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Obtener HTML de operaciones de inversión
function getInvestmentOperationsHTML(investmentId) {
    const relatedOperations = operations.filter(op => op.investmentId === investmentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (relatedOperations.length === 0) {
        return `<tr><td colspan="5" style="text-align: center;">No hay operaciones relacionadas</td></tr>`;
    }
    
    return relatedOperations.map(op => `
        <tr>
            <td>${op.id}</td>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'Pendiente' : 'Completada'}</span></td>
        </tr>
    `).join('');
}

// Obtener nombre del método de pago
function getPaymentMethodName(method) {
    switch (method) {
        case 'cash':
            return 'Efectivo';
        case 'check':
            return 'Cheque';
        case 'transfer':
            return 'Transferencia bancaria';
        default:
            return method;
    }
}

// Ver detalles de operación
function viewOperation(id) {
    // Encontrar operación
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('Error', 'Operación no encontrada', 'danger');
        return;
    }
    
    // Almacenar ID de operación actual
    currentOperationId = id;
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === operation.investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Encontrar inversión si es aplicable
    const investment = operation.investmentId ? 
        investments.find(inv => inv.id === operation.investmentId) : null;
    
    // Crear popup de detalles de operación
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'viewOperationModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Detalles de la operación</h2>
                <div class="modal-close" onclick="document.getElementById('viewOperationModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="alert alert-${operation.status === 'pending' ? 'warning' : 'success'}">
                    <div class="alert-icon">
                        <i class="fas fa-${operation.status === 'pending' ? 'exclamation-triangle' : 'check-circle'}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">Estado de la operación: ${operation.status === 'pending' ? 'Pendiente' : 'Completada'}</div>
                        <div class="alert-text">${operation.status === 'pending' ? 'Esta operación está pendiente y requiere aprobación.' : 'Esta operación se ha completado con éxito.'}</div>
                    </div>
                </div>
                
                <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID Operación</label>
                            <input type="text" class="form-control" value="${operation.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de operación</label>
                            <input type="text" class="form-control" value="${getOperationTypeName(operation.type)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Inversor</label>
                            <input type="text" class="form-control" value="${investor.name}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Monto</label>
                            <input type="text" class="form-control" value="${formatCurrency(operation.amount)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de operación</label>
                            <input type="text" class="form-control" value="${formatDate(operation.date)}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hora de operación</label>
                            <input type="text" class="form-control" value="${formatTime(operation.date)}" readonly>
                        </div>
                    </div>
                    ${investment ? `
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Inversión relacionada</label>
                                <input type="text" class="form-control" value="${formatCurrency(investment.amount)} - ${formatDate(investment.date)}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Estado de la inversión</label>
                                <input type="text" class="form-control" value="${investment.status === 'active' ? 'Activa' : 'Cerrada'}" readonly>
                            </div>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-control" rows="3" readonly>${operation.notes || 'No hay notas'}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('viewOperationModal').remove()">Cerrar</button>
                ${operation.status === 'pending' ? `
                    <button class="btn btn-success" onclick="approveOperation('${operation.id}')">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn btn-danger" onclick="openDeleteConfirmationModal('${operation.id}', 'operation')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Editar inversor
function editInvestor(id) {
    currentInvestorId = id;
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Cerrar modal de vista si está abierto
    const viewModal = document.getElementById('viewInvestorModal');
    if (viewModal) {
        closeModal('viewInvestorModal');
    }
    
    // Crear modal de edición de inversor
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editInvestorModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">Editar datos del inversor</h2>
                <div class="modal-close" onclick="document.getElementById('editInvestorModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <form id="editInvestorForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre completo</label>
                            <input type="text" class="form-control" id="editInvestorName" value="${investor.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono</label>
                            <input type="text" class="form-control" id="editInvestorPhone" value="${investor.phone}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Correo electrónico</label>
                            <input type="email" class="form-control" id="editInvestorEmail" value="${investor.email || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de nacimiento</label>
                            <input type="date" class="form-control" id="editInvestorBirthdate" value="${investor.birthdate || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-control" id="editInvestorAddress" value="${investor.address || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ciudad</label>
                            <input type="text" class="form-control" id="editInvestorCity" value="${investor.city || ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Número de tarjeta de identidad</label>
                            <input type="text" class="form-control" id="editInvestorIdCard" value="${investor.idCard || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de emisión de tarjeta</label>
                            <input type="date" class="form-control" id="editInvestorIdCardDate" value="${investor.idCardDate || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Ocupación</label>
                            <input type="text" class="form-control" id="editInvestorOccupation" value="${investor.occupation || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notas</label>
                            <textarea class="form-control" id="editInvestorNotes" rows="3">${investor.notes || ''}</textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('editInvestorModal').remove()">Cancelar</button>
                <button class="btn btn-primary" onclick="updateInvestor()">Guardar cambios</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Actualizar inversor
function updateInvestor() {
    // Add missing closing brace for the function
}
function markNotificationAsRead(id) {/ * ... * /}
estors.find(inv => inv.id === currentInvestorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Obtener valores del formulario
    const name = document.getElementById('editInvestorName').value;
    const phone = document.getElementById('editInvestorPhone').value;
    const email = document.getElementById('editInvestorEmail').value;
    const birthdate = document.getElementById('editInvestorBirthdate').value;
    const address = document.getElementById('editInvestorAddress').value;
    const city = document.getElementById('editInvestorCity').value;
    const idCard = document.getElementById('editInvestorIdCard').value;
    const idCardDate = document.getElementById('editInvestorIdCardDate').value;
    const occupation = document.getElementById('editInvestorOccupation').value;
    const notes = document.getElementById('editInvestorNotes').value;
    
    // Validar campos requeridos
    if (!name || !phone || !address || !city || !idCard) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Validar teléfono
    if (!validatePhone(phone)) {
        createNotification('Error', 'Número de teléfono no válido', 'danger');
        return;
    }
    
    // Validar correo electrónico si se proporciona
    if (email && !validateEmail(email)) {
        createNotification('Error', 'Correo electrónico no válido', 'danger');
        return;
    }
    
    // Actualizar inversor
    investor.name = name;
    investor.phone = phone;
    investor.email = email;
    investor.birthdate = birthdate;
    investor.address = address;
    investor.city = city;
    investor.idCard = idCard;
    investor.idCardDate = idCardDate;
    investor.occupation = occupation;
    investor.notes = notes;
    investor.updatedAt = new Date().toISOString();
    
    // Guardar datos
    saveData();
    
    // Crear actividad de actualización
    createInvestorActivity(investor.id, 'update', 'Se actualizaron los datos del inversor');
    
    // Cerrar modal
    document.getElementById('editInvestorModal').remove();
    
    // Actualizar tabla de inversores
    loadInvestors();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Datos del inversor actualizados con éxito', 'success');
    // Continuación del Sistema de Gestión de Inversiones
// Funciones adicionales

// ============ Operaciones con Inversores ============

// Eliminar inversor
function deleteInvestor(id) {
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Verificar si el inversor tiene inversiones activas
    const hasActiveInvestments = investments.some(
        inv => inv.investorId === id && inv.status === 'active'
    );
    
    if (hasActiveInvestments) {
        createNotification('Error', 'No se puede eliminar el inversor porque tiene inversiones activas', 'danger');
        return;
    }
    
    // Eliminar inversor
    investors = investors.filter(inv => inv.id !== id);
    
    // Eliminar inversiones del inversor
    investments = investments.filter(inv => inv.investorId !== id);
    
    // Eliminar operaciones del inversor
    operations = operations.filter(op => op.investorId !== id);
    
    // Eliminar eventos del inversor
    events = events.filter(event => event.investorId !== id);
    
    // Guardar datos
    saveData();
    
    // Crear actividad de eliminación
    createActivity('investor', 'delete', `Se eliminó al inversor ${investor.name}`);
    
    // Actualizar tabla de inversores
    loadInvestors();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', `Inversor ${investor.name} eliminado con éxito`, 'success');
}

// Eliminar inversión
function deleteInvestment(id) {
    // Encontrar inversión
    const investment = investments.find(inv => inv.id === id);
    
    if (!investment) {
        createNotification('Error', 'Inversión no encontrada', 'danger');
        return;
    }
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investment.investorId);
    
    // Eliminar inversión
    investments = investments.filter(inv => inv.id !== id);
    
    // Eliminar operaciones relacionadas
    operations = operations.filter(op => op.investmentId !== id);
    
    // Guardar datos
    saveData();
    
    // Crear actividad de eliminación
    const activityMessage = investor ? 
        `Se eliminó la inversión del inversor ${investor.name} por un monto de ${formatCurrency(investment.amount)}` :
        `Se eliminó la inversión por un monto de ${formatCurrency(investment.amount)}`;
    
    createActivity('investment', 'delete', activityMessage);
    
    // Actualizar tabla de inversiones
    loadInvestments();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Inversión eliminada con éxito', 'success');
}

// Eliminar operación
function deleteOperation(id) {
    // Encontrar operación
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('Error', 'Operación no encontrada', 'danger');
        return;
    }
    
    // Eliminar operación
    operations = operations.filter(op => op.id !== id);
    
    // Guardar datos
    saveData();
    
    // Crear actividad de eliminación
    createActivity('operation', 'delete', `Se eliminó la operación ${operation.id}`);
    
    // Cerrar modal de operación si está abierto
    const operationModal = document.getElementById('viewOperationModal');
    if (operationModal) {
        operationModal.remove();
    }
    
    // Actualizar tabla de operaciones
    loadOperations();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Operación eliminada con éxito', 'success');
}

// Aprobar operación
function approveOperation(id) {
    // Encontrar operación
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('Error', 'Operación no encontrada', 'danger');
        return;
    }
    
    // Actualizar estado de la operación
    operation.status = 'active';
    operation.approvedAt = new Date().toISOString();
    
    // Si es una operación de retiro, actualizar la inversión
    if (operation.type === 'withdrawal' && operation.investmentId) {
        const investment = investments.find(inv => inv.id === operation.investmentId);
        
        if (investment) {
            // Actualizar monto o estado de la inversión
            if (operation.amount === investment.amount) {
                investment.status = 'closed';
                investment.closedDate = operation.date;
                
                // Crear notificación
                createNotification(
                    'Inversión cerrada',
                    `Se cerró la inversión por un monto de ${formatCurrency(investment.amount)}`,
                    'info',
                    investment.id,
                    'investment'
                );
            } else {
                investment.amount -= operation.amount;
                
                // Crear notificación
                createNotification(
                    'Retiro parcial realizado',
                    `Se retiró un monto de ${formatCurrency(operation.amount)} de la inversión`,
                    'info',
                    investment.id,
                    'investment'
                );
            }
        }
    }
    
    // Guardar datos
    saveData();
    
    // Crear actividad de aprobación
    createActivity('operation', 'approve', `Se aprobó la operación ${operation.id}`);
    
    // Cerrar modal de operación si está abierto
    const operationModal = document.getElementById('viewOperationModal');
    if (operationModal) {
        operationModal.remove();
    }
    
    // Actualizar tabla de operaciones
    loadOperations();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Operación aprobada con éxito', 'success');
}

// Subir documento
function uploadDocument(investorId, type) {
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Crear modal de documento
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'uploadDocumentModal';
    
    let title, icon;
    switch (type) {
        case 'idCard':
            title = 'Subir imagen de tarjeta de identidad';
            icon = 'id-card';
            break;
        case 'contract':
            title = 'Subir contrato de inversión';
            icon = 'file-contract';
            break;
        case 'other':
            title = 'Subir documentos adicionales';
            icon = 'file-alt';
            break;
        default:
            title = 'Subir documento';
            icon = 'file';
    }
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <div class="modal-close" onclick="document.getElementById('uploadDocumentModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-container" style="box-shadow: none; padding: 0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 4rem; color: var(--primary-color); margin-bottom: 10px;">
                            <i class="fas fa-${icon}"></i>
                        </div>
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">
                            ${title} para el inversor ${investor.name}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Documento</label>
                        <input type="file" class="form-control" id="documentFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" id="documentDescription" rows="3" placeholder="Descripción opcional del documento"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('uploadDocumentModal').remove()">Cancelar</button>
                <button class="btn btn-primary" onclick="saveDocument('${investorId}', '${type}')">
                    <i class="fas fa-upload"></i> Subir documento
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Guardar documento
function saveDocument(investorId, type) {
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Obtener valores del formulario
    const fileInput = document.getElementById('documentFile');
    const description = document.getElementById('documentDescription').value;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        createNotification('Error', 'Por favor, seleccione un archivo', 'danger');
        return;
    }
    
    const file = fileInput.files[0];
    
    // En una aplicación real, subiríamos el archivo a un servidor o Firebase storage
    // Por ahora, simularemos una carga exitosa
    
    // Actualizar inversor con información del documento
    if (!investor.documents) {
        investor.documents = [];
    }
    
    const documentId = generateId();
    const document = {
        id: documentId,
        type,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        description,
        uploadDate: new Date().toISOString()
    };
    
    investor.documents.push(document);
    
    // Guardar datos
    saveData();
    
    // Crear actividad
    createInvestorActivity(investor.id, 'document', `Se subió el documento ${file.name}`);
    
    // Cerrar modal
    document.getElementById('uploadDocumentModal').remove();
    
    // Actualizar pestaña de documentos del inversor si está abierta
    if (document.getElementById('investorDocuments')) {
        viewInvestor(investorId);
        // Cambiar a la pestaña de documentos
        setTimeout(() => {
            switchModalTab('investorDocuments', 'viewInvestorModal');
        }, 100);
    }
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Documento subido con éxito', 'success');
}

// ============ Operaciones CRUD ============

// Guardar inversor
function saveInvestor() {
    // Obtener valores del formulario
    const name = document.getElementById('investorName').value;
    const phone = document.getElementById('investorPhone').value;
    const email = document.getElementById('investorEmail').value;
    const birthdate = document.getElementById('investorBirthdate').value;
    const address = document.getElementById('investorAddress').value;
    const city = document.getElementById('investorCity').value;
    const idCard = document.getElementById('investorIdCard').value;
    const idCardDate = document.getElementById('investorIdCardDate').value;
    const occupation = document.getElementById('investorOccupation').value;
    const notes = document.getElementById('investorNotes').value;
    
    // Validar campos requeridos
    if (!name || !phone || !address || !city || !idCard) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Validar teléfono
    if (!validatePhone(phone)) {
        createNotification('Error', 'Número de teléfono no válido', 'danger');
        return;
    }
    
    // Validar correo electrónico si se proporciona
    if (email && !validateEmail(email)) {
        createNotification('Error', 'Correo electrónico no válido', 'danger');
        return;
    }
    
    // Crear nuevo inversor
    const newInvestor = {
        id: generateId(),
        name,
        phone,
        email,
        birthdate,
        address,
        city,
        idCard,
        idCardDate,
        occupation,
        notes,
        joinDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Añadir inversor al array
    investors.push(newInvestor);
    
    // Crear actividad
    createActivity('investor', 'create', `Se añadió un nuevo inversor: ${name}`);
    
    // Verificar si hay una inversión inicial
    const initialAmount = document.getElementById('initialInvestmentAmount').value;
    const initialDate = document.getElementById('initialInvestmentDate').value;
    
    if (initialAmount && initialDate) {
        const amount = parseFloat(initialAmount);
        
        // Validar inversión mínima
        if (amount < settings.minInvestment) {
            createNotification('Error', `La inversión mínima es ${formatNumber(settings.minInvestment)} ${settings.currency}`, 'danger');
            return;
        }
        
        const method = document.getElementById('initialInvestmentMethod').value;
        const reference = document.getElementById('initialInvestmentReference').value;
        const investmentNotes = document.getElementById('initialInvestmentNotes').value;
        
        // Crear nueva inversión
        const newInvestment = {
            id: generateId(),
            investorId: newInvestor.id,
            amount,
            date: initialDate,
            method,
            reference,
            notes: investmentNotes,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Añadir inversión al array
        investments.push(newInvestment);
        
        // Crear operación
        const newOperation = {
            id: generateOperationId(),
            investorId: newInvestor.id,
            type: 'investment',
            amount,
            date: new Date().toISOString(),
            investmentId: newInvestment.id,
            notes: 'Nueva inversión',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Añadir operación al array
        operations.push(newOperation);
        
        // Crear actividad
        createInvestorActivity(newInvestor.id, 'investment', `Se añadió una nueva inversión por un monto de ${formatCurrency(amount)}`);
    }
    
    // Guardar datos
    saveData();
    
    // Cerrar modal
    closeModal('addInvestorModal');
    
    // Actualizar tabla de inversores
    loadInvestors();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Inversor añadido con éxito', 'success', newInvestor.id, 'investor');
}

// Guardar inversión
function saveInvestment() {
    // Obtener valores del formulario
    const investorId = document.getElementById('investmentInvestor').value;
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const date = document.getElementById('investmentDate').value;
    const method = document.getElementById('investmentMethod').value;
    const reference = document.getElementById('investmentReference').value;
    const notes = document.getElementById('investmentNotes').value;
    
    // Validar campos requeridos
    if (!investorId || !amount || !date) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Validar monto
    if (amount <= 0) {
        createNotification('Error', 'El monto debe ser mayor que cero', 'danger');
        return;
    }
    
    // Validar inversión mínima
    if (amount < settings.minInvestment) {
        createNotification('Error', `La inversión mínima es ${formatNumber(settings.minInvestment)} ${settings.currency}`, 'danger');
        return;
    }
    
    // Crear nueva inversión
    const newInvestment = {
        id: generateId(),
        investorId,
        amount,
        date,
        method,
        reference,
        notes,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Añadir inversión al array
    investments.push(newInvestment);
    
    // Crear operación
    const newOperation = {
        id: generateOperationId(),
        investorId,
        type: 'investment',
        amount,
        date: new Date().toISOString(),
        investmentId: newInvestment.id,
        notes: notes || 'Nueva inversión',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Añadir operación al array
    operations.push(newOperation);
    
    // Crear actividad
    createInvestorActivity(investorId, 'investment', `Se añadió una nueva inversión por un monto de ${formatCurrency(amount)}`);
    
    // Guardar datos
    saveData();
    
    // Cerrar modal
    closeModal('newInvestmentModal');
    
    // Actualizar tabla de inversiones
    loadInvestments();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Inversión añadida con éxito', 'success', newInvestment.id, 'investment');
}

// Guardar retiro
function saveWithdrawal() {
    // Obtener valores del formulario
    const investmentId = document.getElementById('withdrawInvestment').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const date = document.getElementById('withdrawDate').value;
    const method = document.getElementById('withdrawMethod').value;
    const notes = document.getElementById('withdrawNotes').value;
    
    // Validar campos requeridos
    if (!investmentId || !amount || !date) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Encontrar inversión
    const investment = investments.find(inv => inv.id === investmentId);
    
    if (!investment) {
        createNotification('Error', 'Inversión no encontrada', 'danger');
        return;
    }
    
    // Validar monto
    if (amount <= 0 || amount > investment.amount) {
        createNotification('Error', 'Monto no válido', 'danger');
        return;
    }
    
    // Verificar si se permite retiro parcial
    if (amount < investment.amount && (amount / investment.amount) * 100 > settings.maxPartialWithdrawal) {
        createNotification('Error', `El retiro parcial máximo es ${settings.maxPartialWithdrawal}% del monto`, 'danger');
        return;
    }
    
    // Crear operación
    const newOperation = {
        id: generateOperationId(),
        investorId: investment.investorId,
        type: 'withdrawal',
        amount,
        date: new Date().toISOString(),
        investmentId,
        notes: notes || 'Retiro',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Añadir operación al array
    operations.push(newOperation);
    
    // Crear actividad
    createInvestorActivity(investment.investorId, 'withdrawal', `Se registró una solicitud de retiro por un monto de ${formatCurrency(amount)}`);
    
    // Guardar datos
    saveData();
    
    // Cerrar modal
    closeModal('withdrawModal');
    
    // Actualizar tabla de operaciones
    loadOperations();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Solicitud de retiro registrada con éxito', 'success', newOperation.id, 'operation');
}

// Guardar pago de beneficios
function savePayProfit() {
    // Obtener valores del formulario
    const investorId = document.getElementById('profitInvestor').value;
    const amount = parseFloat(document.getElementById('profitAmount').value);
    const date = document.getElementById('profitDate').value;
    const method = document.getElementById('profitMethod').value;
    const notes = document.getElementById('profitNotes').value;
    const period = document.getElementById('profitPeriod').value;
    
    // Obtener fechas de período personalizado si está seleccionado
    let fromDate, toDate;
    if (period === 'custom') {
        fromDate = document.getElementById('profitFromDate').value;
        toDate = document.getElementById('profitToDate').value;
        
        if (!fromDate || !toDate) {
            createNotification('Error', 'Por favor, especifique el período', 'danger');
            return;
        }
    }
    
    // Validar campos requeridos
    if (!investorId || !amount || !date) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Encontrar inversor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('Error', 'Inversor no encontrado', 'danger');
        return;
    }
    
    // Validar monto
    if (amount <= 0) {
        createNotification('Error', 'Monto no válido', 'danger');
        return;
    }
    
    // Crear operación
    const newOperation = {
        id: generateOperationId(),
        investorId,
        type: 'profit',
        amount,
        date: new Date().toISOString(),
        method,
        notes: notes || 'Pago de beneficios',
        status: 'active',
        period,
        fromDate,
        toDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Añadir operación al array
    operations.push(newOperation);
    
    // Crear actividad
    createInvestorActivity(investorId, 'profit', `Se pagaron beneficios por un monto de ${formatCurrency(amount)}`);
    
    // Guardar datos
    saveData();
    
    // Cerrar modal
    closeModal('payProfitModal');
    
    // Actualizar tabla de operaciones
    loadOperations();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Pago de beneficios registrado con éxito', 'success', newOperation.id, 'operation');
}

// Crear actividad
function createActivity(entityType, action, description) {
    const activity = {
        id: generateId(),
        entityType,
        action,
        description,
        date: new Date().toISOString(),
        userId: 'admin' // En una aplicación real, esto sería el ID del usuario actual
    };
    
    // En una aplicación real, guardaríamos esto en una base de datos o Firebase
    console.log('Actividad:', activity);
    
    return activity;
}

// Crear actividad de inversor
function createInvestorActivity(investorId, action, description) {
    const activity = createActivity('investor', action, description);
    activity.investorId = investorId;
    return activity;
}

// ============ Funciones de Carga de Datos ============

// Cargar datos desde localStorage
function loadData() {
    try {
        const storedInvestors = localStorage.getItem('investors');
        const storedInvestments = localStorage.getItem('investments');
        const storedOperations = localStorage.getItem('operations');
        const storedSettings = localStorage.getItem('settings');
        const storedEvents = localStorage.getItem('events');
        const storedNotifications = localStorage.getItem('notifications');
        const storedBackupList = localStorage.getItem('backupList');
        const storedReports = localStorage.getItem('reports');
        
        if (storedInvestors) {
            investors = JSON.parse(storedInvestors);
        }
        
        if (storedInvestments) {
            investments = JSON.parse(storedInvestments);
        }
        
        if (storedOperations) {
            operations = JSON.parse(storedOperations);
        }
        
        if (storedSettings) {
            settings = {...settings, ...JSON.parse(storedSettings)};
        }
        
        if (storedEvents) {
            events = JSON.parse(storedEvents);
        }
        
        if (storedNotifications) {
            notifications = JSON.parse(storedNotifications);
        }
        
        if (storedBackupList) {
            backupList = JSON.parse(storedBackupList);
        }
        
        if (storedReports) {
            reports = JSON.parse(storedReports);
        }
        
        // Actualizar indicador de notificaciones
        updateNotificationBadge();
    } catch (error) {
        console.error('Error al cargar datos:', error);
        createNotification('Error', 'Error al cargar datos', 'danger');
    }
}

// Guardar datos en localStorage
function saveData() {
    try {
        localStorage.setItem('investors', JSON.stringify(investors));
        localStorage.setItem('investments', JSON.stringify(investments));
        localStorage.setItem('operations', JSON.stringify(operations));
        localStorage.setItem('settings', JSON.stringify(settings));
        localStorage.setItem('events', JSON.stringify(events));
        
        // Si la sincronización está activa, sincronizar con Firebase
        if (syncActive) {
            syncData();
        }
    } catch (error) {
        console.error('Error al guardar datos:', error);
        createNotification('Error', 'Error al guardar datos', 'danger');
    }
}

// Guardar notificaciones
function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error al guardar notificaciones:', error);
    }
}

// Guardar informes
function saveReports() {
    try {
        localStorage.setItem('reports', JSON.stringify(reports));
    } catch (error) {
        console.error('Error al guardar informes:', error);
    }
}

// Guardar lista de copias de seguridad
function saveBackupList() {
    try {
        localStorage.setItem('backupList', JSON.stringify(backupList));
    } catch (error) {
        console.error('Error al guardar lista de copias de seguridad:', error);
    }
}

// Actualizar dashboard
function updateDashboard() {
    // Calcular total de inversores
    document.getElementById('totalInvestors').textContent = investors.length;
    
    // Calcular total de inversiones
    const totalInvestmentAmount = investments
        .filter(inv => inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    document.getElementById('totalInvestments').textContent = formatCurrency(totalInvestmentAmount);
    
    // Calcular total de beneficios
    const today = new Date();
    let totalProfits = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfits += profit;
        });
    
    document.getElementById('totalProfits').textContent = formatCurrency(totalProfits.toFixed(2));
    
    // Calcular total de transacciones
    document.getElementById('totalTransactions').textContent = operations.length;
    
    // Calcular cambios desde el mes pasado
    calculateChanges();
    
    // Cargar transacciones recientes
    loadRecentTransactions();
    
    // Cargar inversores recientes
    loadRecentInvestors();
    
    // Cargar gráfico de inversiones
    loadInvestmentChart();
}

// Calcular cambios desde el mes pasado
function calculateChanges() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = today.getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Calcular cambio de inversores
    const currentMonthInvestors = investors.filter(inv => {
        const joinDate = new Date(inv.joinDate);
        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
    }).length;
    
    const lastMonthInvestors = investors.filter(inv => {
        const joinDate = new Date(inv.joinDate);
        return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear;
    }).length;
    
    const investorsChange = lastMonthInvestors === 0 ? 100 : ((currentMonthInvestors - lastMonthInvestors) / lastMonthInvestors) * 100;
    
    // Actualizar cambio de inversores
    const investorsChangeElement = document.getElementById('investorsChangeText');
    const investorsChangeIcon = investorsChangeElement.previousElementSibling;
    
    if (investorsChange > 0) {
        investorsChangeElement.textContent = `${investorsChange.toFixed(0)}% desde el mes pasado`;
        investorsChangeIcon.className = 'fas fa-arrow-up';
        investorsChangeElement.parentElement.className = 'card-change up';
    } else if (investorsChange < 0) {
        investorsChangeElement.textContent = `${Math.abs(investorsChange).toFixed(0)}% desde el mes pasado`;
        investorsChangeIcon.className = 'fas fa-arrow-down';
        investorsChangeElement.parentElement.className = 'card-change down';
    } else {
        investorsChangeElement.textContent = `0% desde el mes pasado`;
        investorsChangeIcon.className = 'fas fa-minus';
        investorsChangeElement.parentElement.className = 'card-change';
    }
    
    // Calcular cambio de inversiones
    const currentMonthInvestments = investments.filter(inv => {
        const investDate = new Date(inv.date);
        return investDate.getMonth() === currentMonth && investDate.getFullYear() === currentYear;
    }).reduce((total, inv) => total + inv.amount, 0);
    
    const lastMonthInvestments = investments.filter(inv => {
        const investDate = new Date(inv.date);
        return investDate.getMonth() === lastMonth && investDate.getFullYear() === lastMonthYear;
    }).reduce((total, inv) => total + inv.amount, 0);
    
    const investmentsChange = lastMonthInvestments === 0 ? 100 : ((currentMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100;
    
    // Actualizar cambio de inversiones
    const investmentsChangeElement = document.getElementById('investmentsChangeText');
    const investmentsChangeIcon = investmentsChangeElement.previousElementSibling;
    
    if (investmentsChange > 0) {
        investmentsChangeElement.textContent = `${investmentsChange.toFixed(0)}% desde el mes pasado`;
        investmentsChangeIcon.className = 'fas fa-arrow-up';
        investmentsChangeElement.parentElement.className = 'card-change up';
    } else if (investmentsChange < 0) {
        investmentsChangeElement.textContent = `${Math.abs(investmentsChange).toFixed(0)}% desde el mes pasado`;
        investmentsChangeIcon.className = 'fas fa-arrow-down';
        investmentsChangeElement.parentElement.className = 'card-change down';
    } else {
        investmentsChangeElement.textContent = `0% desde el mes pasado`;
        investmentsChangeIcon.className = 'fas fa-minus';
        investmentsChangeElement.parentElement.className = 'card-change';
    }
    
    // Cálculos similares para beneficios y transacciones
    // Para beneficios
    const profitsChangeElement = document.getElementById('profitsChangeText');
    const profitsChangeIcon = profitsChangeElement.previousElementSibling;
    profitsChangeElement.textContent = `12% desde el mes pasado`;
    
    // Para transacciones
    const transactionsChangeElement = document.getElementById('transactionsChangeText');
    const transactionsChangeIcon = transactionsChangeElement.previousElementSibling;
    transactionsChangeElement.textContent = `5% desde el mes pasado`;
}

// Cargar transacciones recientes
function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Obtener operaciones recientes (máx. 5)
    const recentOps = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recentOps.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">No hay transacciones recientes</td>`;
        tbody.appendChild(row);
        return;
    }
    
    recentOps.forEach(op => {
        const investor = investors.find(inv => inv.id === op.investorId);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${investor ? investor.name : 'Desconocido'}</td>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'Pendiente' : 'Completada'}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Cargar inversores recientes
function loadRecentInvestors() {
    const tbody = document.getElementById('recentInvestorsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Obtener inversores recientes (máx. 4)
    const recentInvestors = [...investors].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 4);
    
    if (recentInvestors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" style="text-align: center;">No hay inversores recientes</td>`;
        tbody.appendChild(row);
        return;
    }
    
    recentInvestors.forEach(investor => {
        // Obtener última inversión para este inversor
        const latestInvestment = [...investments]
            .filter(inv => inv.investorId === investor.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${investor.name}</td>
            <td>${latestInvestment ? formatCurrency(latestInvestment.amount) : '-'}</td>
            <td>${latestInvestment ? formatDate(latestInvestment.date) : formatDate(investor.joinDate)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Cargar gráfico de inversiones
function loadInvestmentChart() {
    // Generar datos para el gráfico
    const chartData = generateChartData(chartPeriod);
    
    // Cargar gráfico
    loadChart('investmentChart', chartData);
}

// Cambiar período del gráfico
function switchChartPeriod(period) {
    chartPeriod = period;
    
    // Actualizar estados de los botones
    document.getElementById('dailyChartBtn').className = period === 'daily' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    document.getElementById('monthlyChartBtn').className = period === 'monthly' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    document.getElementById('yearlyChartBtn').className = period === 'yearly' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    
    // Recargar gráfico
    loadInvestmentChart();
}

// Cargar inversores
function loadInvestors() {
    const tbody = document.getElementById('investorsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (investors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">No hay inversores</td>`;
        tbody.appendChild(row);
        return;
    }
    
    investors.forEach((investor, index) => {
        // Calcular inversión total para este inversor
        const totalInvestment = investments
            .filter(inv => inv.investorId === investor.id && inv.status === 'active')
            .reduce((total, inv) => total + inv.amount, 0);
        
        // Calcular beneficio total para este inversor
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.investorId === investor.id && inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${investor.name}</td>
            <td>${investor.phone}</td>
            <td>${investor.address || '-'}</td>
            <td>${investor.idCard || '-'}</td>
            <td>${formatCurrency(totalInvestment)}</td>
            <td>${formatCurrency(totalProfit.toFixed(2))}</td>
            <td>${formatDate(investor.joinDate)}</td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="viewInvestor('${investor.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning btn-icon action-btn" onclick="editInvestor('${investor.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${investor.id}', 'investor')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Cargar inversiones
function loadInvestments(status = 'active') {
    const tbody = document.getElementById('investmentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filtrar inversiones por estado
    let filteredInvestments = investments;
    if (status === 'active') {
        filteredInvestments = investments.filter(inv => inv.status === 'active');
    } else if (status === 'closed') {
        filteredInvestments = investments.filter(inv => inv.status === 'closed');
    }
    
    if (filteredInvestments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align: center;">No hay inversiones ${status === 'active' ? 'activas' : status === 'closed' ? 'cerradas' : ''}</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Ordenar inversiones por fecha (más recientes primero)
    filteredInvestments = [...filteredInvestments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredInvestments.forEach((investment, index) => {
        const investor = investors.find(inv => inv.id === investment.investorId);
        
        if (!investor) return;
        
        const monthlyProfit = calculateMonthlyProfit(investment.amount);
        
        // Calcular beneficio total
        const today = new Date();
        const totalProfit = investment.status === 'active' ? 
            calculateProfit(investment.amount, investment.date, today.toISOString()) : 0;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${investor.name}</td>
            <td>${formatCurrency(investment.amount)}</td>
            <td>${formatDate(investment.date)}</td>
            <td>${formatCurrency(monthlyProfit.toFixed(2))}</td>
            <td>${formatCurrency(totalProfit.toFixed(2))}</td>
            <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'Activa' : 'Cerrada'}</span></td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="viewInvestment('${investment.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${investment.status === 'active' ? `
                    <button class="btn btn-warning btn-icon action-btn" onclick="openWithdrawModal('${investment.id}')">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investment.investorId}')">
                        <i class="fas fa-money-bill"></i>
                    </button>
                ` : ''}
                <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${investment.id}', 'investment')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Cargar beneficios
function loadProfits() {
    const tbody = document.getElementById('profitsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Actualizar tarjetas de beneficios
    updateProfitCards();
    
    // Agrupar inversiones por inversor
    const investorProfits = {};
    
    investments.filter(inv => inv.status === 'active').forEach(investment => {
        const investorId = investment.investorId;
        
        if (!investorProfits[investorId]) {
            investorProfits[investorId] = {
                investments: [],
                totalInvestment: 0,
                totalProfit: 0,
                paidProfit: 0,
                dueProfit: 0
            };
        }
        
        investorProfits[investorId].investments.push(investment);
        investorProfits[investorId].totalInvestment += investment.amount;
        
        // Calcular beneficio para esta inversión
        const today = new Date();
        const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
        investorProfits[investorId].totalProfit += profit;
    });
    
    // Calcular beneficio pagado para cada inversor
    operations.filter(op => op.type === 'profit' && op.status === 'active').forEach(operation => {
        const investorId = operation.investorId;
        
        if (investorProfits[investorId]) {
            investorProfits[investorId].paidProfit += operation.amount;
        }
    });
    
    // Calcular beneficio debido
    Object.keys(investorProfits).forEach(investorId => {
        investorProfits[investorId].dueProfit = Math.max(0, 
            investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
        );
    });
    
    // Si no hay inversores con inversiones activas
    if (Object.keys(investorProfits).length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">No hay inversiones activas</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Ordenar inversores por beneficio total (más alto primero)
    const sortedInvestors = Object.keys(investorProfits).sort((a, b) => 
        investorProfits[b].totalProfit - investorProfits[a].totalProfit
    );
    
    sortedInvestors.forEach((investorId, index) => {
        const investor = investors.find(inv => inv.id === investorId);
        
        if (!investor) return;
        
        const profitData = investorProfits[investorId];
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${investor.name}</td>
            <td>${formatCurrency(profitData.totalInvestment)}</td>
            <td>${formatDate(profitData.investments[0].date)}</td>
            <td>${formatCurrency(calculateMonthlyProfit(profitData.totalInvestment).toFixed(2))}</td>
            <td>${formatCurrency(profitData.totalProfit.toFixed(2))}</td>
            <td>${formatCurrency(profitData.paidProfit.toFixed(2))}</td>
            <td>${formatCurrency(profitData.dueProfit.toFixed(2))}</td>
            <td>
                <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investor.id}')">
                    <i class="fas fa-money-bill"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Cargar gráfico de beneficios
    loadProfitChart();
}

// Actualizar tarjetas de beneficios
function updateProfitCards() {
    // Calcular beneficios totales
    const today = new Date();
    let totalProfits = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfits += profit;
        });
    
    // Calcular beneficios pagados totales
    const totalPaidProfits = operations
        .filter(op => op.type === 'profit' && op.status === 'active')
        .reduce((total, op) => total + op.amount, 0);
    
    // Calcular beneficios debidos
    const dueProfits = Math.max(0, totalProfits - totalPaidProfits);
    
    // Actualizar tarjetas
    document.getElementById('profitsTotal').textContent = formatCurrency(totalProfits.toFixed(2));
    document.getElementById('profitsPaid').textContent = formatCurrency(totalPaidProfits.toFixed(2));
    document.getElementById('profitsDue').textContent = formatCurrency(dueProfits.toFixed(2));
    document.getElementById('profitsMonthlyAverage').textContent = settings.monthlyProfitRate + '%';
}

// Cargar beneficios para pestaña
function loadProfitsForTab(tabId) {
    // Actualizar tarjetas de beneficios (ya se hace en loadProfits)
    
    // Cargar contenido apropiado según la pestaña
    switch (tabId) {
        case 'summary':
            // Ya se carga en loadProfits
            break;
        case 'paid':
            loadPaidProfits();
            break;
        case 'due':
            loadDueProfits();
            break;
        case 'projections':
            loadProfitProjections();
            break;
    }
}

// Cargar beneficios pagados
function loadPaidProfits() {
    // Esto se implementaría para mostrar una tabla de todos los beneficios pagados
    console.log('Cargar beneficios pagados');
}

// Cargar beneficios debidos
function loadDueProfits() {
    // Esto se implementaría para mostrar una tabla de todos los beneficios debidos
    console.log('Cargar beneficios debidos');
}

// Cargar proyecciones de beneficios
function loadProfitProjections() {
    // Esto se implementaría para mostrar proyecciones de beneficios
    console.log('Cargar proyecciones de beneficios');
}

// Cargar gráfico de beneficios
function loadProfitChart() {
    // Esto se implementaría para mostrar un gráfico de beneficios a lo largo del tiempo
    // Por ahora, usaremos la misma función de gráfico con datos diferentes
    const chartData = generateChartData('monthly');
    
    // Crear configuración con solo conjunto de datos de beneficios
    const config = {
        datasets: [
            {
                label: 'Beneficios',
                data: chartData.map(d => d.profits),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };
    
    loadChart('profitsChart', chartData, config);
}

// Cambiar gráfico de análisis de beneficios
function switchProfitsAnalysisChart(period) {
    // Actualizar estados de los botones
    document.querySelectorAll('#profits .chart-actions button').forEach(btn => {
        btn.className = 'btn btn-sm btn-light';
    });
    
    document.querySelector(`#profits .chart-actions button[onclick="switchProfitsAnalysisChart('${period}')"]`).className = 'btn btn-sm btn-primary';
    
    // Generar datos para el gráfico
    const chartData = generateChartData(period);
    
    // Crear configuración con solo conjunto de datos de beneficios
    const config = {
        datasets: [
            {
                label: 'Beneficios',
                data: chartData.map(d => d.profits),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };
    
    // Cargar gráfico
    loadChart('profitsChart', chartData, config);
}

// Cargar operaciones
function loadOperations(type = 'all') {
    const tbody = document.getElementById('operationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filtrar operaciones por tipo
    let filteredOperations = operations;
    if (type === 'investments') {
        filteredOperations = operations.filter(op => op.type === 'investment');
    } else if (type === 'withdrawals') {
        filteredOperations = operations.filter(op => op.type === 'withdrawal');
    } else if (type === 'profits') {
        filteredOperations = operations.filter(op => op.type === 'profit');
    } else if (type === 'pending') {
        filteredOperations = operations.filter(op => op.status === 'pending');
    }
    
    if (filteredOperations.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">No hay operaciones ${
            type === 'investments' ? 'de inversión' : 
            type === 'withdrawals' ? 'de retiro' : 
            type === 'profits' ? 'de beneficios' : 
            type === 'pending' ? 'pendientes' : ''
        }</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...filteredOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOperations.forEach((operation) => {
        const investor = investors.find(inv => inv.id === operation.investorId);
        
        if (!investor) return;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${operation.id}</td>
            <td>${investor.name}</td>
            <td>${getOperationTypeName(operation.type)}</td>
            <td>${formatCurrency(operation.amount)}</td>
            <td>${formatDate(operation.date)}</td>
            <td>${formatTime(operation.date)}</td>
            <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'Pendiente' : 'Completada'}</span></td>
            <td>${operation.notes || '-'}</td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="viewOperation('${operation.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${operation.status === 'pending' ? `
                    <button class="btn btn-success btn-icon action-btn" onclick="approveOperation('${operation.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${operation.id}', 'operation')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Cargar notificaciones
function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-title">No hay notificaciones</div>
                    <div class="notification-text">No hay notificaciones actualmente.</div>
                </div>
            </div>
        `;
        return;
    }
    
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? 'read' : ''}`;
        
        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${
                    notification.type === 'success' ? 'check-circle' : 
                    notification.type === 'danger' ? 'exclamation-circle' :
                    notification.type === 'warning' ? 'exclamation-triangle' :
                    'info-circle'
                }"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-text">${notification.message}</div>
                <div class="notification-time">${formatDate(notification.date)} ${formatTime(notification.date)}</div>
            </div>
            <div class="notification-actions">
                ${!notification.read ? `
                    <button class="btn btn-sm btn-light" onclick="markNotificationAsRead('${notification.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                ${notification.entityId && notification.entityType ? `
                    <button class="btn btn-sm btn-info" onclick="viewNotificationEntity('${notification.entityId}', '${notification.entityType}')">
                        <i class="fas fa-eye"></i>
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deleteNotification('${notification.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        notificationList.appendChild(item);
    });
}

// Marcar notificación como leída
function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    notification.read = true;
    
    // Guardar notificaciones
    saveNotifications();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Recargar notificaciones
    loadNotifications();
}

// Eliminar notificación
function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    
    // Guardar notificaciones
    saveNotifications();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Recargar notificaciones
    loadNotifications();
}

// Ver entidad de notificación
function viewNotificationEntity(entityId, entityType) {
    switch (entityType) {
        case 'investor':
            viewInvestor(entityId);
            break;
        case 'investment':
            viewInvestment(entityId);
            break;
        case 'operation':
            viewOperation(entityId);
            break;
        case 'event':
            viewEvent(entityId);
            break;
    }
}

// Marcar todas las notificaciones como leídas
function markAllAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    
    // Guardar notificaciones
    saveNotifications();
    
    // Actualizar indicador de notificaciones
    updateNotificationBadge();
    
    // Recargar notificaciones
    loadNotifications();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Todas las notificaciones marcadas como leídas', 'success');
}

// ============ Funciones de Calendario ============

// Cargar calendario
function loadCalendar() {
    // Actualizar visualización del mes actual
    updateCalendarMonth();
    
    // Generar cuadrícula del calendario
    generateCalendarGrid();
    
    // Cargar próximos eventos
    loadUpcomingEvents();
}

// Actualizar visualización del mes del calendario
function updateCalendarMonth() {
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const monthElement = document.getElementById('currentMonth');
    if (!monthElement) return;
    
    monthElement.textContent = `${monthNames[calendarCurrentMonth.getMonth()]} ${calendarCurrentMonth.getFullYear()}`;
}

// Generar cuadrícula del calendario
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Obtener primer día del mes
    const firstDay = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth(), 1);
    
    // Obtener último día del mes
    const lastDay = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() + 1, 0);
    
    // Obtener primer día de la cuadrícula (días del mes anterior)
    const firstDayOfGrid = new Date(firstDay);
    firstDayOfGrid.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Crear celdas de la cuadrícula
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 35; i++) {
        const currentDate = new Date(firstDayOfGrid);
        currentDate.setDate(firstDayOfGrid.getDate() + i);
        
        const isCurrentMonth = currentDate.getMonth() === calendarCurrentMonth.getMonth();
        const isToday = currentDate.toDateString() === today.toDateString();
        
        const dayCell = document.createElement('div');
        dayCell.className = `calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}`;
        dayCell.style.background = isCurrentMonth ? 'var(--gray-100)' : 'var(--gray-200)';
        dayCell.style.borderRadius = 'var(--border-radius-sm)';
        dayCell.style.padding = '10px';
        dayCell.style.minHeight = '100px';
        dayCell.style.position = 'relative';
        
        // Obtener eventos para este día
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === currentDate.toDateString();
        });
        
        dayCell.innerHTML = `
            <div class="day-number" style="font-weight: 600;">${currentDate.getDate()}</div>
            <div class="day-events">
                ${dayEvents.map(event => `
                    <div class="event" style="background: ${getEventTypeColor(event.type)}; color: white; padding: 5px; border-radius: 4px; margin-top: 5px; font-size: 0.8rem; cursor: pointer;" onclick="viewEvent('${event.id}')">
                        ${event.title}
                    </div>
                `).join('')}
            </div>
            <div class="day-add" style="position: absolute; bottom: 5px; right: 5px; cursor: pointer;" onclick="addEventForDate('${currentDate.toISOString()}')">
                <i class="fas fa-plus-circle" style="color: var(--primary-color);"></i>
            </div>
        `;
        
        calendarGrid.appendChild(dayCell);
    }
}

// Obtener color del tipo de evento
function getEventTypeColor(type) {
    switch (type) {
        case 'meeting':
            return 'var(--primary-color)';
        case 'payment':
            return 'var(--success-color)';
        case 'withdrawal':
            return 'var(--warning-color)';
        case 'investment':
            return 'var(--info-color)';
        default:
            return 'var(--gray-600)';
    }
}

// Navegar al mes anterior
function prevMonth() {
    calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() - 1);
    loadCalendar();
}

// Navegar al mes siguiente
function nextMonth() {
    calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() + 1);
    loadCalendar();
}

// Cargar próximos eventos
function loadUpcomingEvents() {
    const tbody = document.getElementById('upcomingEventsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Obtener próximos eventos (próximos 30 días)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= thirtyDaysLater;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (upcomingEvents.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">No hay próximos eventos</td>`;
        tbody.appendChild(row);
        return;
    }
    
    upcomingEvents.forEach(event => {
        const investor = event.investorId ? investors.find(inv => inv.id === event.investorId) : null;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${event.title}</td>
            <td>${formatDate(event.date)}</td>
            <td>${event.time}</td>
            <td>${getEventTypeName(event.type)}</td>
            <td>${event.notes || '-'}</td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="viewEvent('${event.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-warning btn-icon action-btn" onclick="editEvent('${event.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${event.id}', 'event')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Añadir evento
function addEvent() {
    // Resetear formulario
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.reset();
    
    // Establecer fecha por defecto como hoy
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) eventDateInput.valueAsDate = new Date();
    
    // Establecer hora por defecto como hora actual (redondeada a la hora más cercana)
    const now = new Date();
    now.setMinutes(0, 0, 0);
    
    const eventTimeInput = document.getElementById('eventTime');
    if (eventTimeInput) eventTimeInput.value = now.toTimeString().substr(0, 5);
    
    // Establecer título
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'Añadir nuevo evento';
    
    // Ocultar botón de eliminar
    const deleteEventButton = document.getElementById('deleteEventButton');
    if (deleteEventButton) deleteEventButton.style.display = 'none';
    
    // Mostrar botón de guardar
    const saveEventButton = document.getElementById('saveEventButton');
    if (saveEventButton) saveEventButton.style.display = 'inline-block';
    
    // Limpiar ID de evento
    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput) eventIdInput.value = '';
    
    // Llenar select de inversores
    populateInvestorSelect('eventInvestor');
    
    // Abrir modal
    openModal('eventModal');
}

// Añadir evento para una fecha específica
function addEventForDate(dateString) {
    // Llamar a añadir evento
    addEvent();
    
    // Establecer la fecha
    const eventDate = document.getElementById('eventDate');
    if (eventDate) eventDate.value = dateString.substring(0, 10);
}

// Guardar evento
function saveEvent() {
    // Obtener valores del formulario
    const title = document.getElementById('eventTitle').value;
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const investorId = document.getElementById('eventInvestor').value || null;
    const duration = document.getElementById('eventDuration').value;
    const reminder = document.getElementById('eventReminder').value;
    const notes = document.getElementById('eventNotes').value;
    const eventId = document.getElementById('eventId').value;
    
    // Validar campos requeridos
    if (!title || !date || !time) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Verificar si se está editando un evento existente
    if (eventId) {
        // Encontrar evento
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex !== -1) {
            // Actualizar evento
            events[eventIndex] = {
                ...events[eventIndex],
                title,
                type,
                date,
                time,
                investorId,
                duration,
                reminder,
                notes,
                updatedAt: new Date().toISOString()
            };
            
            // Mostrar notificación de éxito
            createNotification('Éxito', 'Evento actualizado con éxito', 'success');
        } else {
            createNotification('Error', 'Evento no encontrado', 'danger');
            return;
        }
    } else {
        // Crear nuevo evento
        const newEvent = {
            id: generateId(),
            title,
            type,
            date,
            time,
            investorId,
            duration,
            reminder,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Añadir evento al array
        events.push(newEvent);
        
        // Mostrar notificación de éxito
        createNotification('Éxito', 'Evento añadido con éxito', 'success');
    }
    
    // Guardar datos
    localStorage.setItem('events', JSON.stringify(events));
    
    // Cerrar modal
    closeModal('eventModal');
    
    // Recargar calendario
    loadCalendar();
}

// Ver evento
function viewEvent(id) {
    // Encontrar evento
    const event = events.find(e => e.id === id);
    
    if (!event) {
        createNotification('Error', 'Evento no encontrado', 'danger');
        return;
    }
    
    // Resetear formulario
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.reset();
    
    // Llenar formulario con datos del evento
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventDuration').value = event.duration;
    document.getElementById('eventReminder').value = event.reminder;
    document.getElementById('eventNotes').value = event.notes || '';
    document.getElementById('eventId').value = event.id;
    
    // Llenar select de inversores y seleccionar inversor si es aplicable
    populateInvestorSelect('eventInvestor');
    if (event.investorId) {
        document.getElementById('eventInvestor').value = event.investorId;
    }
    
    // Establecer título
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'Detalles del evento';
    
    // Mostrar botón de eliminar
    const deleteEventButton = document.getElementById('deleteEventButton');
    if (deleteEventButton) deleteEventButton.style.display = 'inline-block';
    
    // Mostrar botón de guardar
    const saveEventButton = document.getElementById('saveEventButton');
    if (saveEventButton) saveEventButton.style.display = 'inline-block';
    
    // Abrir modal
    openModal('eventModal');
}

// Editar evento
function editEvent(id) {
    // Ver evento llenará el formulario
    viewEvent(id);
    
    // Establecer título
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'Editar evento';
}

// Eliminar evento
function deleteEvent() {
    const eventId = document.getElementById('eventId').value;
    
    if (!eventId) {
        createNotification('Error', 'Evento no encontrado', 'danger');
        return;
    }
    
    // Encontrar evento
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
        createNotification('Error', 'Evento no encontrado', 'danger');
        return;
    }
    
    // Eliminar evento
    events.splice(eventIndex, 1);
    
    // Guardar datos
    localStorage.setItem('events', JSON.stringify(events));
    
    // Cerrar modal
    closeModal('eventModal');
    
    // Recargar calendario
    loadCalendar();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Evento eliminado con éxito', 'success');
}

// ============ Funciones de Configuración ============

// Cargar configuración
function loadSettings() {
    // Cargar configuración general
    document.getElementById('companyName').value = settings.companyName || 'شركة الاستثمار العراقية';
    document.getElementById('companyAddress').value = settings.companyAddress || 'Al Hillah, Babil, Iraq';
    document.getElementById('companyPhone').value = settings.companyPhone || '07701234567';
    document.getElementById('companyEmail').value = settings.companyEmail || 'info@iraqinvest.com';
    document.getElementById('companyWebsite').value = settings.companyWebsite || 'www.iraqinvest.com';
    document.getElementById('language').value = settings.language || 'ar';
    document.getElementById('timezone').value = settings.timezone || 'Asia/Baghdad';
    
    // Cargar configuración de inversión
    document.getElementById('monthlyProfitRate').value = settings.monthlyProfitRate || 1.75;
    document.getElementById('minInvestment').value = settings.minInvestment || 1000000;
    document.getElementById('profitDistributionPeriod').value = settings.profitDistributionPeriod || 'monthly';
    document.getElementById('profitDistributionDay').value = settings.profitDistributionDay || 1;
    document.getElementById('earlyWithdrawalFee').value = settings.earlyWithdrawalFee || 0.5;
    document.getElementById('maxPartialWithdrawal').value = settings.maxPartialWithdrawal || 50;
    document.getElementById('currency').value = settings.currency || 'IQD';
    
    // Cargar casillas de verificación de monedas
    const acceptIQD = document.getElementById('acceptIQD');
    const acceptUSD = document.getElementById('acceptUSD');
    
    if (acceptIQD) acceptIQD.checked = settings.acceptedCurrencies?.includes('IQD') ?? true;
    if (acceptUSD) acceptUSD.checked = settings.acceptedCurrencies?.includes('USD') ?? true;
    
    // Cargar configuración de notificaciones
    if (settings.notificationSettings) {
        const ns = settings.notificationSettings;
        
        // Notificaciones del sistema
        document.getElementById('systemNotifications').checked = ns.systemNotifications ?? true;
        document.getElementById('loginNotifications').checked = ns.loginNotifications ?? true;
        document.getElementById('backupNotifications').checked = ns.backupNotifications ?? true;
        
        // Notificaciones de inversión
        document.getElementById('newInvestorNotifications').checked = ns.newInvestorNotifications ?? true;
        document.getElementById('newInvestmentNotifications').checked = ns.newInvestmentNotifications ?? true;
        document.getElementById('withdrawalNotifications').checked = ns.withdrawalNotifications ?? true;
        document.getElementById('profitDistributionNotifications').checked = ns.profitDistributionNotifications ?? true;
        
        // Métodos de notificación
        document.getElementById('emailNotifications').checked = ns.emailNotifications ?? true;
        document.getElementById('smsNotifications').checked = ns.smsNotifications ?? false;
        document.getElementById('pushNotifications').checked = ns.pushNotifications ?? true;
        
        // Temporización de notificaciones
        document.getElementById('notificationStartTime').value = ns.startTime ?? '09:00';
        document.getElementById('notificationEndTime').value = ns.endTime ?? '18:00';
    }
    
    // Cargar copias de seguridad anteriores
    loadPreviousBackups();
}

// Cargar copias de seguridad anteriores
function loadPreviousBackups() {
    const backupsSelect = document.getElementById('previousBackups');
    if (!backupsSelect) return;
    
    backupsSelect.innerHTML = '';
    
    if (backupList.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay copias de seguridad anteriores';
        option.disabled = true;
        backupsSelect.appendChild(option);
        return;
    }
    
    backupList.forEach(backup => {
        const option = document.createElement('option');
        option.value = backup.id;
        option.textContent = `${formatDate(backup.date)} - ${formatTime(backup.date)}`;
        backupsSelect.appendChild(option);
    });
}

// Guardar configuración general
function saveGeneralSettings(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyPhone = document.getElementById('companyPhone').value;
    const companyEmail = document.getElementById('companyEmail').value;
    const companyWebsite = document.getElementById('companyWebsite').value;
    const language = document.getElementById('language').value;
    const timezone = document.getElementById('timezone').value;
    
    // Validar campos requeridos
    if (!companyName || !companyAddress || !companyPhone) {
        createNotification('Error', 'Por favor, complete todos los campos requeridos', 'danger');
        return;
    }
    
    // Validar correo electrónico
    if (companyEmail && !validateEmail(companyEmail)) {
        createNotification('Error', 'Correo electrónico no válido', 'danger');
        return;
    }
    
    // Actualizar configuración
    settings.companyName = companyName;
    settings.companyAddress = companyAddress;
    settings.companyPhone = companyPhone;
    settings.companyEmail = companyEmail;
    settings.companyWebsite = companyWebsite;
    settings.language = language;
    settings.timezone = timezone;
    
    // Guardar configuración
    saveData();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Configuración general guardada con éxito', 'success');
}

// Guardar configuración de inversión
function saveInvestmentSettings(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const monthlyProfitRate = parseFloat(document.getElementById('monthlyProfitRate').value);
    const minInvestment = parseFloat(document.getElementById('minInvestment').value);
    const profitDistributionPeriod = document.getElementById('profitDistributionPeriod').value;
    const profitDistributionDay = parseInt(document.getElementById('profitDistributionDay').value);
    const earlyWithdrawalFee = parseFloat(document.getElementById('earlyWithdrawalFee').value);
    const maxPartialWithdrawal = parseFloat(document.getElementById('maxPartialWithdrawal').value);
    const currency = document.getElementById('currency').value;
    
    // Obtener monedas aceptadas
    const acceptIQD = document.getElementById('acceptIQD').checked;
    const acceptUSD = document.getElementById('acceptUSD').checked;
    
    const acceptedCurrencies = [];
    if (acceptIQD) acceptedCurrencies.push('IQD');
    if (acceptUSD) acceptedCurrencies.push('USD');
    
    // Validar campos requeridos
    if (isNaN(monthlyProfitRate) || isNaN(minInvestment) || isNaN(profitDistributionDay) || 
        isNaN(earlyWithdrawalFee) || isNaN(maxPartialWithdrawal)) {
        createNotification('Error', 'Por favor, complete todos los campos correctamente', 'danger');
        return;
    }
    
    // Validar valores
    if (monthlyProfitRate <= 0) {
        createNotification('Error', 'La tasa de beneficio mensual debe ser mayor que cero', 'danger');
        return;
    }
    
    if (minInvestment <= 0) {
        createNotification('Error', 'La inversión mínima debe ser mayor que cero', 'danger');
        return;
    }
    
    if (profitDistributionDay < 1 || profitDistributionDay > 31) {
        createNotification('Error', 'El día de distribución de beneficios debe estar entre 1 y 31', 'danger');
        return;
    }
    
    if (earlyWithdrawalFee < 0 || earlyWithdrawalFee > 100) {
        createNotification('Error', 'La comisión por retiro anticipado debe estar entre 0 y 100', 'danger');
        return;
    }
    
    if (maxPartialWithdrawal <= 0 || maxPartialWithdrawal > 100) {
        createNotification('Error', 'El retiro parcial máximo debe estar entre 0 y 100', 'danger');
        return;
    }
    
    if (acceptedCurrencies.length === 0) {
        createNotification('Error', 'Debe seleccionar al menos una moneda', 'danger');
        return;
    }
    
    // Actualizar configuración
    settings.monthlyProfitRate = monthlyProfitRate;
    settings.minInvestment = minInvestment;
    settings.profitDistributionPeriod = profitDistributionPeriod;
    settings.profitDistributionDay = profitDistributionDay;
    settings.earlyWithdrawalFee = earlyWithdrawalFee;
    settings.maxPartialWithdrawal = maxPartialWithdrawal;
    settings.currency = currency;
    settings.acceptedCurrencies = acceptedCurrencies;
    
    // Guardar configuración
    saveData();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Configuración de inversión guardada con éxito', 'success');
}

// Guardar configuración de perfil
function saveProfileSettings(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const userFullName = document.getElementById('userFullName').value;
    const userEmail = document.getElementById('userEmail').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar campos requeridos
    if (!userFullName || !userEmail) {
        createNotification('Error', 'Por favor, complete el nombre y el correo electrónico', 'danger');
        return;
    }
    
    // Validar correo electrónico
    if (!validateEmail(userEmail)) {
        createNotification('Error', 'Correo electrónico no válido', 'danger');
        return;
    }
    
    // Verificar si se está cambiando la contraseña
    if (newPassword) {
        // Validar contraseña actual
        if (!currentPassword) {
            createNotification('Error', 'Por favor, ingrese la contraseña actual', 'danger');
            return;
        }
        
        // Validar nueva contraseña
        if (newPassword.length < 6) {
            createNotification('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }
        
        // Validar confirmación de contraseña
        if (newPassword !== confirmPassword) {
            createNotification('Error', 'La nueva contraseña y su confirmación no coinciden', 'danger');
            return;
        }
        
        // En una aplicación real, verificaríamos la contraseña actual contra el hash almacenado
        // y actualizaríamos la contraseña en la base de datos
        createNotification('Éxito', 'Contraseña cambiada con éxito', 'success');
    }
    
    // Guardar información del usuario
    // En una aplicación real, actualizaríamos la información del usuario en la base de datos
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Configuración de perfil guardada con éxito', 'success');
}

// Guardar configuración de notificaciones
function saveNotificationSettings(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const systemNotifications = document.getElementById('systemNotifications').checked;
    const loginNotifications = document.getElementById('loginNotifications').checked;
    const backupNotifications = document.getElementById('backupNotifications').checked;
    
    const newInvestorNotifications = document.getElementById('newInvestorNotifications').checked;
    const newInvestmentNotifications = document.getElementById('newInvestmentNotifications').checked;
    const withdrawalNotifications = document.getElementById('withdrawalNotifications').checked;
    const profitDistributionNotifications = document.getElementById('profitDistributionNotifications').checked;
    
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const smsNotifications = document.getElementById('smsNotifications').checked;
    const pushNotifications = document.getElementById('pushNotifications').checked;
    
    const notificationStartTime = document.getElementById('notificationStartTime').value;
    const notificationEndTime = document.getElementById('notificationEndTime').value;
    
    // Actualizar configuración
    settings.notificationSettings = {
        systemNotifications,
        loginNotifications,
        backupNotifications,
        newInvestorNotifications,
        newInvestmentNotifications,
        withdrawalNotifications,
        profitDistributionNotifications,
        emailNotifications,
        smsNotifications,
        pushNotifications,
        startTime: notificationStartTime,
        endTime: notificationEndTime
    };
    
    // Guardar configuración
    saveData();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Configuración de notificaciones guardada con éxito', 'success');
}

// Guardar configuración del sistema
function saveSystemSettings(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const darkMode = document.getElementById('darkMode').checked;
    const compactMode = document.getElementById('compactMode').checked;
    const fontSize = document.getElementById('fontSize').value;
    const primaryColor = document.getElementById('primaryColor').value;
    
    const enableAnimations = document.getElementById('enableAnimations').checked;
    const enableAutoSave = document.getElementById('enableAutoSave').checked;
    const autoSaveInterval = parseInt(document.getElementById('autoSaveInterval').value);
    
    const enableTwoFactor = document.getElementById('enableTwoFactor').checked;
    const sessionDuration = parseInt(document.getElementById('sessionDuration').value);
    const passwordPolicy = document.getElementById('passwordPolicy').value;
    
    const enableApiAccess = document.getElementById('enableApiAccess').checked;
    const apiKey = document.getElementById('apiKey').value;
    
    // Actualizar configuración
    settings.systemSettings = {
        darkMode,
        compactMode,
        fontSize,
        primaryColor,
        enableAnimations,
        enableAutoSave,
        autoSaveInterval,
        enableTwoFactor,
        sessionDuration,
        passwordPolicy,
        enableApiAccess,
        apiKey
    };
    
    // Aplicar configuración
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    if (compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    // Guardar configuración
    saveData();
    
    // Mostrar notificación de éxito
    createNotification('Éxito', 'Configuración del sistema guardada con éxito', 'success');
}

// ============ Integración con Firebase ============

// Alternar sincronización
function toggleSync(enabled) {
    if (enabled) {
        document.getElementById('connectionInfo').style.display = 'block';
        
        // Verificar si el usuario ha iniciado sesión
        if (window.currentUser) {
            document.getElementById('signOutButton').style.display = 'block';

            // Continuación del Sistema de Gestión de Inversiones (Parte 3)
// Completando la funcionalidad

// ============ Integración con Firebase (continuación) ============
enableSync();
} else {
    // Deshabilitar sincronización si el usuario no ha iniciado sesión
    document.getElementById('syncEnabled').checked = false;
}
} else {
document.getElementById('connectionInfo').style.display = 'none';
disableSync();
}
}

// Habilitar sincronización
function enableSync() {
syncActive = true;
localStorage.setItem('syncEnabled', 'true');

// Actualizar estado de sincronización
updateSyncStatus('Conectado', 'success');

// Mostrar hora de última sincronización
const lastSyncTimeElement = document.getElementById('lastSyncTime');
if (lastSyncTimeElement) {
lastSyncTimeElement.style.display = 'inline-block';
if (lastSyncTime) {
    lastSyncTimeElement.textContent = `Última sincronización: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
} else {
    lastSyncTimeElement.textContent = 'No sincronizado aún';
}
}

// Sincronización inicial
syncData();

// Iniciar intervalo de sincronización
startSyncInterval();
}

// Deshabilitar sincronización
function disableSync() {
syncActive = false;
localStorage.setItem('syncEnabled', 'false');

// Actualizar estado de sincronización
updateSyncStatus('Desconectado', 'info');

// Ocultar hora de última sincronización
const lastSyncTimeElement = document.getElementById('lastSyncTime');
if (lastSyncTimeElement) {
lastSyncTimeElement.style.display = 'none';
}

// Detener intervalo de sincronización
stopSyncInterval();
}

// Actualizar estado de sincronización
function updateSyncStatus(status, type) {
const syncStatusElement = document.getElementById('syncStatus');
if (syncStatusElement) {
syncStatusElement.textContent = status;
syncStatusElement.style.display = 'inline-block';
syncStatusElement.className = `status ${type}`;
}

// Actualizar icono de sincronización
const syncIcon = document.getElementById('syncIcon');
if (syncIcon) {
syncIcon.className = `sync-btn ${type}`;
}

// Actualizar estado en el diálogo de sincronización
const syncStatusAlert = document.getElementById('syncStatusAlert');
const syncStatusText = document.getElementById('syncStatusText');
if (syncStatusAlert && syncStatusText) {
syncStatusAlert.className = `alert alert-${type}`;
syncStatusText.textContent = type === 'success' ? 'La sincronización está activa y conectada.' : 'La sincronización está detenida actualmente.';
}

// Actualizar botones de sincronización
const startSyncButton = document.getElementById('startSyncButton');
const stopSyncButton = document.getElementById('stopSyncButton');
if (startSyncButton && stopSyncButton) {
if (type === 'success') {
    startSyncButton.style.display = 'none';
    stopSyncButton.style.display = 'inline-block';
} else {
    startSyncButton.style.display = 'inline-block';
    stopSyncButton.style.display = 'none';
}
}
}

// Iniciar intervalo de sincronización
function startSyncInterval() {
// Sincronizar cada 5 minutos
window.syncInterval = setInterval(syncData, 5 * 60 * 1000);
}

// Detener intervalo de sincronización
function stopSyncInterval() {
clearInterval(window.syncInterval);
}

// Sincronizar datos
function syncData() {
// En una aplicación real, sincronizaríamos datos con Firebase
console.log('Sincronizando datos con Firebase...');

// Actualizar hora de última sincronización
lastSyncTime = new Date().toISOString();
localStorage.setItem('lastSyncTime', lastSyncTime);

// Actualizar visualización de hora de última sincronización
const lastSyncTimeElement = document.getElementById('lastSyncTime');
if (lastSyncTimeElement) {
lastSyncTimeElement.textContent = `Última sincronización: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
}
}

// Iniciar sesión en Firebase
function loginToFirebase(event) {
event.preventDefault();

// Obtener valores del formulario
const email = document.getElementById('loginEmail').value;
const password = document.getElementById('loginPassword').value;

// En una aplicación real, autenticaríamos con Firebase
// Por ahora, simularemos un inicio de sesión exitoso

// Simular usuario actual
window.currentUser = {
email,
displayName: email.split('@')[0]
};

// Mostrar usuario conectado
const loggedInUser = document.getElementById('loggedInUser');
if (loggedInUser) {
loggedInUser.textContent = window.currentUser.email;
}

// Ocultar formulario de inicio de sesión y mostrar opciones de sincronización
document.getElementById('loginForm').style.display = 'none';
document.getElementById('syncOptions').style.display = 'block';

// Mostrar botón de cierre de sesión
document.getElementById('signOutButton').style.display = 'inline-block';

// Mostrar notificación de éxito
createNotification('Éxito', 'Inicio de sesión exitoso', 'success');
}

// Iniciar sincronización
function startSync() {
// Habilitar sincronización
enableSync();

// Mostrar notificación de éxito
createNotification('Éxito', 'Sincronización activada con éxito', 'success');
}

// Detener sincronización
function stopSync() {
// Deshabilitar sincronización
disableSync();

// Mostrar notificación de información
createNotification('Información', 'Sincronización detenida', 'info');
}

// Mostrar diálogo de sincronización
function showSyncDialog() {
// Verificar si el usuario ha iniciado sesión
if (window.currentUser) {
// Mostrar opciones de sincronización
document.getElementById('loginForm').style.display = 'none';
document.getElementById('syncOptions').style.display = 'block';

// Mostrar usuario conectado
const loggedInUser = document.getElementById('loggedInUser');
if (loggedInUser) {
    loggedInUser.textContent = window.currentUser.email;
}
} else {
// Mostrar formulario de inicio de sesión
document.getElementById('loginForm').style.display = 'block';
document.getElementById('syncOptions').style.display = 'none';
}

// Abrir diálogo
openModal('syncDialog');
}

// Cerrar diálogo de sincronización
function closeSyncDialog() {
closeModal('syncDialog');
}

// Actualizar estado de configuración de sincronización
function updateSyncSettingsStatus() {
// Verificar si la sincronización está habilitada
const syncEnabled = localStorage.getItem('syncEnabled') === 'true';
document.getElementById('syncEnabled').checked = syncEnabled;

// Cargar configuración de copia de seguridad automática
const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
const autoBackupFrequency = localStorage.getItem('autoBackupFrequency') || 'weekly';
const activityLoggingEnabled = localStorage.getItem('activityLoggingEnabled') !== 'false';

document.getElementById('autoBackupEnabled').checked = autoBackupEnabled;
document.getElementById('autoBackupFrequency').value = autoBackupFrequency;
document.getElementById('activityLoggingEnabled').checked = activityLoggingEnabled;

// Mostrar/ocultar información de conexión
document.getElementById('connectionInfo').style.display = syncEnabled ? 'block' : 'none';

// Verificar si el usuario ha iniciado sesión
if (window.currentUser) {
document.getElementById('signOutButton').style.display = syncEnabled ? 'inline-block' : 'none';

// Actualizar información de conexión
const connectionAlert = document.querySelector('#connectionInfo .alert');
connectionAlert.className = 'alert alert-success';
connectionAlert.querySelector('.alert-icon i').className = 'fas fa-check-circle';
connectionAlert.querySelector('.alert-title').textContent = 'Conectado';
connectionAlert.querySelector('.alert-text').textContent = `Correo electrónico: ${window.currentUser.email}`;
}
}

// Crear copia de seguridad en Firebase
function createFirebaseBackup() {
// Crear nombre de copia de seguridad
const date = new Date();
const backupName = prompt('Ingrese un nombre para la copia de seguridad (opcional):', 
`Copia de seguridad ${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX')}`);

if (backupName === null) return;

// Crear copia de seguridad
const backup = {
id: generateId(),
name: backupName,
date: date.toISOString(),
data: {
    investors,
    investments,
    operations,
    settings,
    events,
    notifications
}
};

// En una aplicación real, guardaríamos esto en Firebase
// Por ahora, lo añadiremos a la lista de copias de seguridad
backupList.push(backup);

// Guardar lista de copias de seguridad
saveBackupList();

// Actualizar lista de copias de seguridad
updateBackupsList();

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad creada con éxito', 'success');
}

// Actualizar lista de copias de seguridad
function updateBackupsList() {
const backupsListElement = document.getElementById('backupsList');
if (!backupsListElement) return;

backupsListElement.innerHTML = '';

if (backupList.length === 0) {
const option = document.createElement('option');
option.value = '';
option.textContent = 'No hay copias de seguridad';
option.disabled = true;
backupsListElement.appendChild(option);
return;
}

// Ordenar copias de seguridad por fecha (más recientes primero)
const sortedBackups = [...backupList].sort((a, b) => new Date(b.date) - new Date(a.date));

sortedBackups.forEach(backup => {
const option = document.createElement('option');
option.value = backup.id;
option.textContent = `${backup.name} - ${formatDate(backup.date)} ${formatTime(backup.date)}`;
backupsListElement.appendChild(option);
});
}

// Restaurar copia de seguridad de Firebase
function restoreFirebaseBackup() {
const backupsListElement = document.getElementById('backupsList');
if (!backupsListElement || !backupsListElement.value) {
createNotification('Error', 'Por favor, seleccione una copia de seguridad', 'danger');
return;
}

const backupId = backupsListElement.value;

// Encontrar copia de seguridad
const backup = backupList.find(b => b.id === backupId);

if (!backup) {
createNotification('Error', 'Copia de seguridad no encontrada', 'danger');
return;
}

// Confirmar restauración
if (!confirm(`¿Está seguro de restaurar la copia de seguridad "${backup.name}"? Se reemplazarán todos los datos actuales.`)) {
return;
}

// Restaurar datos
const data = backup.data;

if (data.investors) investors = data.investors;
if (data.investments) investments = data.investments;
if (data.operations) operations = data.operations;
if (data.settings) settings = {...settings, ...data.settings};
if (data.events) events = data.events;
if (data.notifications) notifications = data.notifications;

// Guardar datos
saveData();
saveNotifications();

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad restaurada con éxito', 'success');

// Recargar página
setTimeout(() => {
window.location.reload();
}, 2000);
}

// Eliminar copia de seguridad de Firebase
function deleteFirebaseBackup() {
const backupsListElement = document.getElementById('backupsList');
if (!backupsListElement || !backupsListElement.value) {
createNotification('Error', 'Por favor, seleccione una copia de seguridad', 'danger');
return;
}

const backupId = backupsListElement.value;

// Encontrar copia de seguridad
const backup = backupList.find(b => b.id === backupId);

if (!backup) {
createNotification('Error', 'Copia de seguridad no encontrada', 'danger');
return;
}

// Confirmar eliminación
if (!confirm(`¿Está seguro de eliminar la copia de seguridad "${backup.name}"?`)) {
return;
}

// Eliminar copia de seguridad de la lista
backupList = backupList.filter(b => b.id !== backupId);

// Guardar lista de copias de seguridad
saveBackupList();

// Actualizar lista de copias de seguridad
updateBackupsList();

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad eliminada con éxito', 'success');
}

// ============ Funciones de Copia de Seguridad ============

// Crear copia de seguridad
function createBackup() {
// Crear datos de copia de seguridad
const backup = {
id: generateId(),
name: `Copia de seguridad ${formatDate(new Date().toISOString())}`,
date: new Date().toISOString(),
data: {
    investors,
    investments,
    operations,
    settings,
    events,
    notifications
}
};

// Descargar archivo de copia de seguridad
const data = JSON.stringify(backup, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

// Añadir copia de seguridad a la lista
backupList.push(backup);

// Guardar lista de copias de seguridad
saveBackupList();

// Actualizar lista de copias de seguridad
loadPreviousBackups();

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad creada con éxito', 'success');
}

// Restaurar copia de seguridad
function restoreBackup() {
const fileInput = document.getElementById('restoreFile');

if (!fileInput || !fileInput.files.length) {
createNotification('Error', 'Por favor, seleccione un archivo', 'danger');
return;
}

if (!confirm('Se reemplazarán todos los datos actuales con los datos de la copia de seguridad. ¿Está seguro de continuar?')) {
return;
}

const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = function(event) {
try {
    const backup = JSON.parse(event.target.result);
    
    if (backup.data && backup.data.investors && backup.data.investments && backup.data.operations) {
        // Restaurar datos
        investors = backup.data.investors;
        investments = backup.data.investments;
        operations = backup.data.operations;
        
        if (backup.data.settings) {
            settings = {...settings, ...backup.data.settings};
        }
        
        if (backup.data.events) {
            events = backup.data.events;
        }
        
        if (backup.data.notifications) {
            notifications = backup.data.notifications;
        }
        
        // Guardar datos
        saveData();
        saveNotifications();
        
        // Mostrar notificación de éxito
        createNotification('Éxito', 'Copia de seguridad restaurada con éxito', 'success');
        
        // Recargar página
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } else {
        createNotification('Error', 'Archivo de copia de seguridad no válido', 'danger');
    }
} catch (error) {
    console.error('Error al restaurar copia de seguridad:', error);
    createNotification('Error', 'Error al restaurar copia de seguridad', 'danger');
}
};

reader.readAsText(file);
}

// Descargar copia de seguridad seleccionada
function downloadSelectedBackup() {
const select = document.getElementById('previousBackups');

if (!select || !select.value) {
createNotification('Error', 'Por favor, seleccione una copia de seguridad', 'danger');
return;
}

const backupId = select.value;

// Encontrar copia de seguridad
const backup = backupList.find(b => b.id === backupId);

if (!backup) {
createNotification('Error', 'Copia de seguridad no encontrada', 'danger');
return;
}

// Descargar archivo de copia de seguridad
const data = JSON.stringify(backup, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `backup_${new Date(backup.date).toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad descargada con éxito', 'success');
}

// Restaurar copia de seguridad seleccionada
function restoreSelectedBackup() {
const select = document.getElementById('previousBackups');

if (!select || !select.value) {
createNotification('Error', 'Por favor, seleccione una copia de seguridad', 'danger');
return;
}

const backupId = select.value;

// Encontrar copia de seguridad
const backup = backupList.find(b => b.id === backupId);

if (!backup) {
createNotification('Error', 'Copia de seguridad no encontrada', 'danger');
return;
}

// Confirmar restauración
if (!confirm('Se reemplazarán todos los datos actuales con los datos de la copia de seguridad. ¿Está seguro de continuar?')) {
return;
}

// Restaurar datos
if (backup.data) {
if (backup.data.investors) investors = backup.data.investors;
if (backup.data.investments) investments = backup.data.investments;
if (backup.data.operations) operations = backup.data.operations;
if (backup.data.settings) settings = {...settings, ...backup.data.settings};
if (backup.data.events) events = backup.data.events;
if (backup.data.notifications) notifications = backup.data.notifications;

// Guardar datos
saveData();
saveNotifications();

// Mostrar notificación de éxito
createNotification('Éxito', 'Copia de seguridad restaurada con éxito', 'success');

// Recargar página
setTimeout(() => {
    window.location.reload();
}, 2000);
} else {
createNotification('Error', 'Copia de seguridad no válida', 'danger');
}
}

// Eliminar copia de seguridad seleccionada
function deleteSelectedBackup() {
const select = document.getElementById('previousBackups');

if (!select || !select.value) {
createNotification('Error', 'Por favor, seleccione una copia de seguridad', 'danger');
return;
}

const backupId = select.value;

// Abrir modal de confirmación de eliminación
openDeleteConfirmationModal(backupId, 'backup');
}

// ============ Funciones de Importación/Exportación ============

// Exportar inversores
function exportInvestors() {
if (investors.length === 0) {
createNotification('Advertencia', 'No hay inversores para exportar', 'warning');
return;
}

const data = JSON.stringify(investors, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `investors_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

createNotification('Éxito', 'Inversores exportados con éxito', 'success');
}

// Importar inversores
function importInvestors() {
// Crear modal de importación
const modal = document.createElement('div');
modal.className = 'modal-overlay active';
modal.id = 'importInvestorsModal';

modal.innerHTML = `
<div class="modal">
    <div class="modal-header">
        <h2 class="modal-title">Importar Inversores</h2>
        <div class="modal-close" onclick="document.getElementById('importInvestorsModal').remove()">
            <i class="fas fa-times"></i>
        </div>
    </div>
    <div class="modal-body">
        <div class="alert alert-info">
            <div class="alert-icon">
                <i class="fas fa-info"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">Información</div>
                <div class="alert-text">Cargue un archivo JSON que contenga datos de inversores. El archivo debe tener el mismo formato que el archivo de exportación.</div>
            </div>
        </div>
        <form id="importInvestorsForm">
            <div class="form-group">
                <label class="form-label">Archivo de inversores (JSON)</label>
                <input type="file" class="form-control" id="importInvestorsFile" accept=".json" required>
            </div>
            <div class="form-group">
                <div class="form-check">
                    <input type="radio" class="form-check-input" id="importModeAppend" name="importMode" value="append" checked>
                    <label class="form-check-label" for="importModeAppend">Añadir a la lista actual</label>
                </div>
                <div class="form-check">
                    <input type="radio" class="form-check-input" id="importModeReplace" name="importMode" value="replace">
                    <label class="form-check-label" for="importModeReplace">Reemplazar la lista actual</label>
                </div>
            </div>
        </form>
    </div>
    <div class="modal-footer">
        <button class="btn btn-light" onclick="document.getElementById('importInvestorsModal').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="processImportInvestors()">Importar</button>
    </div>
</div>
`;

document.body.appendChild(modal);
}

// Procesar importación de inversores
function processImportInvestors() {
const fileInput = document.getElementById('importInvestorsFile');
const importMode = document.querySelector('input[name="importMode"]:checked').value;

if (!fileInput.files.length) {
createNotification('Error', 'Por favor, seleccione un archivo', 'danger');
return;
}

const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = function(event) {
try {
    const importedInvestors = JSON.parse(event.target.result);
    
    if (!Array.isArray(importedInvestors)) {
        createNotification('Error', 'Archivo importado no válido', 'danger');
        return;
    }
    
    if (importMode === 'replace') {
        // Verificar si hay inversiones activas
        const hasActiveInvestments = investments.some(inv => inv.status === 'active');
        
        if (hasActiveInvestments) {
            if (!confirm('Hay inversiones activas para los inversores actuales. ¿Está seguro de reemplazar todos los inversores?')) {
                return;
            }
        }
        
        investors = importedInvestors;
    } else {
        // Modo de anexar
        importedInvestors.forEach(investor => {
            // Verificar si el inversor ya existe
            const existingInvestor = investors.find(inv => inv.id === investor.id);
            
            if (!existingInvestor) {
                investors.push(investor);
            }
        });
    }
    
    // Guardar datos
    saveData();
    
    // Actualizar tabla de inversores
    loadInvestors();
    
    // Cerrar modal
    document.getElementById('importInvestorsModal').remove();
    
    createNotification('Éxito', `${importedInvestors.length} inversores importados con éxito`, 'success');
} catch (error) {
    console.error('Error al importar inversores:', error);
    createNotification('Error', 'Error al importar inversores', 'danger');
}
};

reader.readAsText(file);
}

// Exportar inversiones
function exportInvestments() {
if (investments.length === 0) {
createNotification('Advertencia', 'No hay inversiones para exportar', 'warning');
return;
}

const data = JSON.stringify(investments, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `investments_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

createNotification('Éxito', 'Inversiones exportadas con éxito', 'success');
}

// Exportar operaciones
function exportOperations() {
if (operations.length === 0) {
createNotification('Advertencia', 'No hay operaciones para exportar', 'warning');
return;
}

const data = JSON.stringify(operations, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `operations_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

createNotification('Éxito', 'Operaciones exportadas con éxito', 'success');
}

// Exportar beneficios
function exportProfits() {
// Agrupar inversiones por inversor
const investorProfits = {};

investments.filter(inv => inv.status === 'active').forEach(investment => {
const investorId = investment.investorId;
const investor = investors.find(inv => inv.id === investorId);

if (!investor) return;

if (!investorProfits[investorId]) {
    investorProfits[investorId] = {
        investor: investor.name,
        investments: [],
        totalInvestment: 0,
        totalProfit: 0,
        paidProfit: 0,
        dueProfit: 0
    };
}

investorProfits[investorId].investments.push(investment);
investorProfits[investorId].totalInvestment += investment.amount;

// Calcular beneficio para esta inversión
const today = new Date();
const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
investorProfits[investorId].totalProfit += profit;
});

// Calcular beneficio pagado para cada inversor
operations.filter(op => op.type === 'profit').forEach(operation => {
const investorId = operation.investorId;

if (investorProfits[investorId]) {
    investorProfits[investorId].paidProfit += operation.amount;
}
});

// Calcular beneficio debido
Object.keys(investorProfits).forEach(investorId => {
investorProfits[investorId].dueProfit = Math.max(0, 
    investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
);
});

// Convertir a array
const profitsArray = Object.keys(investorProfits).map(investorId => ({
...investorProfits[investorId],
investorId
}));

// Verificar si hay beneficios para exportar
if (profitsArray.length === 0) {
createNotification('Advertencia', 'No hay beneficios para exportar', 'warning');
return;
}

const data = JSON.stringify(profitsArray, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `profits_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

createNotification('Éxito', 'Beneficios exportados con éxito', 'success');
}

// Exportar informes
function exportReports() {
if (reports.length === 0) {
createNotification('Advertencia', 'No hay informes para exportar', 'warning');
return;
}

const data = JSON.stringify(reports, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `reports_${new Date().toISOString().slice(0, 10)}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

createNotification('Éxito', 'Informes exportados con éxito', 'success');
}

// ============ Funciones de Informes ============

// Cargar informes
function loadReports() {
// Implementación para cargar informes guardados
const recentReportsBody = document.getElementById('recentReportsTableBody');
if (!recentReportsBody) return;

recentReportsBody.innerHTML = '';

if (reports.length === 0) {
const row = document.createElement('tr');
row.innerHTML = `<td colspan="5" style="text-align: center;">No hay informes recientes</td>`;
recentReportsBody.appendChild(row);
return;
}

// Ordenar informes por fecha (más recientes primero)
const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));

sortedReports.forEach(report => {
const row = document.createElement('tr');

row.innerHTML = `
    <td>${report.title}</td>
    <td>${report.type === 'investors' ? 'Inversores' : 
         report.type === 'investments' ? 'Inversiones' :
         report.type === 'profits' ? 'Beneficios' :
         report.type === 'operations' ? 'Operaciones' :
         report.type === 'financial' ? 'Financiero' : 'Resumen'}</td>
    <td>${formatDate(report.date)}</td>
    <td>${report.createdBy || 'Admin'}</td>
    <td>
        <button class="btn btn-info btn-icon action-btn" onclick="viewReport('${report.id}')">
            <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-light btn-icon action-btn" onclick="downloadReport('${report.id}')">
            <i class="fas fa-download"></i>
        </button>
        <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${report.id}', 'report')">
            <i class="fas fa-trash"></i>
        </button>
    </td>
`;

recentReportsBody.appendChild(row);
});
}

// Cargar informes para pestaña
function loadReportsForTab(tabId) {
switch (tabId) {
case 'recent':
    // Ya cargado en loadReports
    break;
case 'saved':
    loadSavedReports();
    break;
case 'scheduled':
    loadScheduledReports();
    break;
}
}

// Cargar informes guardados
function loadSavedReports() {
// Implementación para cargar informes guardados
console.log('Cargar informes guardados');
}

// Cargar informes programados
function loadScheduledReports() {
// Implementación para cargar informes programados
console.log('Cargar informes programados');
}

// Llenar select de inversores para informes
function populateReportInvestors() {
const select = document.getElementById('reportInvestor');
if (!select) return;

// Limpiar opciones anteriores
select.innerHTML = '<option value="">Todos los inversores</option>';

// Ordenar inversores por nombre
const sortedInvestors = [...investors].sort((a, b) => a.name.localeCompare(b.name));

// Añadir opciones de inversores
sortedInvestors.forEach(investor => {
const option = document.createElement('option');
option.value = investor.id;
option.textContent = investor.name;
select.appendChild(option);
});
}

// Crear informe personalizado
function createCustomReport(event) {
event.preventDefault();

// Obtener valores del formulario
const reportType = document.getElementById('reportType').value;
const investorId = document.getElementById('reportInvestor').value;
const fromDate = document.getElementById('reportFromDate').value;
const toDate = document.getElementById('reportToDate').value;
const reportFormat = document.querySelector('input[name="reportFormat"]:checked').value;

// Validar tipo de informe
if (!reportType) {
createNotification('Error', 'Por favor, seleccione un tipo de informe', 'danger');
return;
}

// Generar título de informe
let title = '';
switch (reportType) {
case 'investors':
    title = 'Informe de Inversores';
    break;
case 'investments':
    title = 'Informe de Inversiones';
    break;
case 'profits':
    title = 'Informe de Beneficios';
    break;
case 'operations':
    title = 'Informe de Operaciones';
    break;
case 'financial':
    title = 'Informe Financiero';
    break;
case 'summary':
    title = 'Informe de Resumen';
    break;
}

// Añadir inversor al título si se especifica
if (investorId) {
const investor = investors.find(inv => inv.id === investorId);
if (investor) {
    title += ` - ${investor.name}`;
}
}

// Añadir fechas al título si se especifican
if (fromDate && toDate) {
title += ` (${formatDate(fromDate)} - ${formatDate(toDate)})`;
} else if (fromDate) {
title += ` (Desde ${formatDate(fromDate)})`;
} else if (toDate) {
title += ` (Hasta ${formatDate(toDate)})`;
}

// Generar contenido del informe
const reportContent = generateReportContent(reportType, investorId, fromDate, toDate, reportFormat);

// Mostrar el informe
showReportResult(title, reportContent, reportFormat);

// Crear objeto de informe
currentReportId = generateId();
const report = {
id: currentReportId,
title,
type: reportType,
investorId,
fromDate,
toDate,
format: reportFormat,
content: reportContent,
date: new Date().toISOString(),
createdBy: 'Admin'
};

// Guardar informe temporalmente
window.tempReport = report;
}

// Generar contenido del informe
function generateReportContent(type, investorId, fromDate, toDate, format) {
// Filtrar datos según parámetros
let filteredInvestors = investors;
let filteredInvestments = investments;
let filteredOperations = operations;

// Filtrar por inversor si se especifica
if (investorId) {
filteredInvestors = filteredInvestors.filter(inv => inv.id === investorId);
filteredInvestments = filteredInvestments.filter(inv => inv.investorId === investorId);
filteredOperations = filteredOperations.filter(op => op.investorId === investorId);
}

// Convertir fechas de cadena a objetos Date
const fromDateObj = fromDate ? new Date(fromDate) : null;
const toDateObj = toDate ? new Date(toDate) : null;

// Filtrar por fecha si se especifica
if (fromDateObj || toDateObj) {
// Filtrar inversiones por fecha
filteredInvestments = filteredInvestments.filter(inv => {
    const invDate = new Date(inv.date);
    if (fromDateObj && toDateObj) {
        return invDate >= fromDateObj && invDate <= toDateObj;
    } else if (fromDateObj) {
        return invDate >= fromDateObj;
    } else if (toDateObj) {
        return invDate <= toDateObj;
    }
    return true;
});

// Filtrar operaciones por fecha
filteredOperations = filteredOperations.filter(op => {
    const opDate = new Date(op.date);
    if (fromDateObj && toDateObj) {
        return opDate >= fromDateObj && opDate <= toDateObj;
    } else if (fromDateObj) {
        return opDate >= fromDateObj;
    } else if (toDateObj) {
        return opDate <= toDateObj;
    }
    return true;
});
}

// Generar contenido específico según el tipo de informe
let content = '';

switch (type) {
case 'investors':
    content = generateInvestorsReport(filteredInvestors, filteredInvestments, format);
    break;
case 'investments':
    content = generateInvestmentsReport(filteredInvestments, filteredInvestors, format);
    break;
case 'profits':
    content = generateProfitsReport(filteredInvestments, filteredInvestors, filteredOperations, format);
    break;
case 'operations':
    content = generateOperationsReport(filteredOperations, filteredInvestors, format);
    break;
case 'financial':
    content = generateFinancialReport(filteredInvestments, filteredOperations, format);
    break;
case 'summary':
    content = generateSummaryReport(filteredInvestors, filteredInvestments, filteredOperations, format);
    break;
}

return content;
}

// Generar informe de inversores
function generateInvestorsReport(filteredInvestors, filteredInvestments, format) {
if (format === 'table') {
let tableContent = `
    <table class="table" id="reportTable">
        <thead>
            <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Total de Inversiones</th>
                <th>Inversiones Activas</th>
                <th>Fecha de Ingreso</th>
            </tr>
        </thead>
        <tbody>
`;

if (filteredInvestors.length === 0) {
    tableContent += `<tr><td colspan="7" style="text-align: center;">No hay inversores que coincidan con los criterios</td></tr>`;
} else {
    filteredInvestors.forEach((investor, index) => {
        // Calcular inversión total para este inversor
        const investorInvestments = filteredInvestments.filter(inv => inv.investorId === investor.id);
        const totalInvestment = investorInvestments.reduce((total, inv) => total + inv.amount, 0);
        const activeInvestments = investorInvestments.filter(inv => inv.status === 'active').length;
        
        tableContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${investor.name}</td>
                <td>${investor.phone}</td>
                <td>${investor.address || '-'}</td>
                <td>${formatCurrency(totalInvestment)}</td>
                <td>${activeInvestments}</td>
                <td>${formatDate(investor.joinDate)}</td>
            </tr>
        `;
    });
}

tableContent += `
        </tbody>
    </table>
`;

return tableContent;
} else if (format === 'chart') {
// Para formato de gráfico, preparamos los datos
return `
    <div id="reportChart" style="height: 400px; width: 100%;">
        <!-- El gráfico se renderizará aquí -->
        <canvas id="investorsChart"></canvas>
    </div>
    <script>
        // Datos para el gráfico
        const investorsData = ${JSON.stringify(prepareInvestorsChartData(filteredInvestors, filteredInvestments))};
        
        // Renderizar gráfico
        const ctx = document.getElementById('investorsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: investorsData.map(d => d.name),
                datasets: [{
                    label: 'Total de Inversiones',
                    data: investorsData.map(d => d.totalInvestment),
                    backgroundColor: 'rgba(52, 152, 219, 0.5)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
`;
} else {
// Para formato PDF, preparamos una versión simplificada
return `<p>Informe PDF no disponible en la vista previa. Haga clic en "Guardar Informe" para generar el PDF.</p>`;
}
}

// Preparar datos del gráfico de inversores
function prepareInvestorsChartData(filteredInvestors, filteredInvestments) {
return filteredInvestors.map(investor => {
const investorInvestments = filteredInvestments.filter(inv => inv.investorId === investor.id);
const totalInvestment = investorInvestments.reduce((total, inv) => total + inv.amount, 0);

return {
    name: investor.name,
    totalInvestment,
    activeInvestments: investorInvestments.filter(inv => inv.status === 'active').length
};
});
}

// Generar informe de inversiones
function generateInvestmentsReport(filteredInvestments, filteredInvestors, format) {
// Implementación similar a generateInvestorsReport pero para inversiones
if (format === 'table') {
let tableContent = `
    <table class="table" id="reportTable">
        <thead>
            <tr>
                <th>#</th>
                <th>Inversor</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Beneficio Mensual</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
`;

if (filteredInvestments.length === 0) {
    tableContent += `<tr><td colspan="6" style="text-align: center;">No hay inversiones que coincidan con los criterios</td></tr>`;
} else {
    // Ordenar inversiones por fecha (más recientes primero)
    const sortedInvestments = [...filteredInvestments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedInvestments.forEach((investment, index) => {
        const investor = filteredInvestors.find(inv => inv.id === investment.investorId);
        
        if (!investor) return;
        
        const monthlyProfit = calculateMonthlyProfit(investment.amount);
        
        tableContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${investor.name}</td>
                <td>${formatCurrency(investment.amount)}</td>
                <td>${formatDate(investment.date)}</td>
                <td>${formatCurrency(monthlyProfit.toFixed(2))}</td>
                <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'Activa' : 'Cerrada'}</span></td>
            </tr>
        `;
    });
}

tableContent += `
        </tbody>
    </table>
`;

return tableContent;
} else if (format === 'chart') {
// Para formato de gráfico, preparamos los datos
return `
    <div id="reportChart" style="height: 400px; width: 100%;">
        <!-- El gráfico se renderizará aquí -->
        <canvas id="investmentsChart"></canvas>
    </div>
    <script>
        // Datos para el gráfico
        const investmentsData = ${JSON.stringify(prepareInvestmentsChartData(filteredInvestments))};
        
        // Renderizar gráfico
        const ctx = document.getElementById('investmentsChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: investmentsData.dates,
                datasets: [{
                    label: 'Monto Total de Inversiones',
                    data: investmentsData.amounts,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
`;
} else {
// Para formato PDF, preparamos una versión simplificada
return `<p>Informe PDF no disponible en la vista previa. Haga clic en "Guardar Informe" para generar el PDF.</p>`;
}
}

// Preparar datos del gráfico de inversiones
function prepareInvestmentsChartData(filteredInvestments) {
// Ordenar inversiones por fecha (más antiguas primero)
const sortedInvestments = [...filteredInvestments].sort((a, b) => new Date(a.date) - new Date(b.date));

// Extraer fechas y montos para el gráfico de línea
const dates = sortedInvestments.map(inv => formatDate(inv.date));
let runningTotal = 0;
const amounts = sortedInvestments.map(inv => {
if (inv.status === 'active') {
    runningTotal += inv.amount;
}
return runningTotal;
});

return {
dates,
amounts
};
}

// Generar informe de beneficios
function generateProfitsReport(filteredInvestments, filteredInvestors, filteredOperations, format) {
// Implementación similar para informes de beneficios
if (format === 'table') {
let tableContent = `
    <table class="table" id="reportTable">
        <thead>
            <tr>
                <th>#</th>
                <th>Inversor</th>
                <th>Inversión Total</th>
                <th>Beneficio Mensual</th>
                <th>Beneficio Total</th>
                <th>Beneficio Pagado</th>
                <th>Beneficio Pendiente</th>
            </tr>
        </thead>
        <tbody>
`;

// Agrupar inversiones por inversor
const investorProfits = {};

filteredInvestments.filter(inv => inv.status === 'active').forEach(investment => {
    const investorId = investment.investorId;
    
    if (!investorProfits[investorId]) {
        investorProfits[investorId] = {
            investments: [],
            totalInvestment: 0,
            totalProfit: 0,
            paidProfit: 0,
            dueProfit: 0
        };
    }
    
    investorProfits[investorId].investments.push(investment);
    investorProfits[investorId].totalInvestment += investment.amount;
    
    // Calcular beneficio para esta inversión
    const today = new Date();
    const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
    investorProfits[investorId].totalProfit += profit;
});

// Calcular beneficio pagado para cada inversor
filteredOperations.filter(op => op.type === 'profit' && op.status === 'active').forEach(operation => {
    const investorId = operation.investorId;
    
    if (investorProfits[investorId]) {
        investorProfits[investorId].paidProfit += operation.amount;
    }
});

// Calcular beneficio debido
Object.keys(investorProfits).forEach(investorId => {
    investorProfits[investorId].dueProfit = Math.max(0, 
        investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
    );
});

if (Object.keys(investorProfits).length === 0) {
    tableContent += `<tr><td colspan="7" style="text-align: center;">No hay datos de beneficios que coincidan con los criterios</td></tr>`;
} else {
    // Ordenar inversores por beneficio total (más alto primero)
    const sortedInvestors = Object.keys(investorProfits).sort((a, b) => 
        investorProfits[b].totalProfit - investorProfits[a].totalProfit
    );
    
    sortedInvestors.forEach((investorId, index) => {
        const investor = filteredInvestors.find(inv => inv.id === investorId);
        
        if (!investor) return;
        
        const profitData = investorProfits[investorId];
        
        tableContent += `
            <tr>
                <td>${index + 1}</td>
                <td>${investor.name}</td>
                <td>${formatCurrency(profitData.totalInvestment)}</td>
                <td>${formatCurrency(calculateMonthlyProfit(profitData.totalInvestment).toFixed(2))}</td>
                <td>${formatCurrency(profitData.totalProfit.toFixed(2))}</td>
                <td>${formatCurrency(profitData.paidProfit.toFixed(2))}</td>
                <td>${formatCurrency(profitData.dueProfit.toFixed(2))}</td>
            </tr>
        `;
    });
}

tableContent += `
        </tbody>
    </table>
`;

return tableContent;
} else if (format === 'chart') {
// Para formato de gráfico, preparamos los datos
return `
    <div id="reportChart" style="height: 400px; width: 100%;">
        <!-- El gráfico se renderizará aquí -->
        <canvas id="profitsChart"></canvas>
    </div>
    <script>
        // Datos para el gráfico
        const profitsData = ${JSON.stringify(prepareProfitsChartData(filteredInvestments, filteredInvestors, filteredOperations))};
        
        // Renderizar gráfico
        const ctx = document.getElementById('profitsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: profitsData.labels,
                datasets: [
                    {
                        label: 'Beneficio Total',
                        data: profitsData.totalProfits,
                        backgroundColor: 'rgba(46, 204, 113, 0.5)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Beneficio Pagado',
                        data: profitsData.paidProfits,
                        backgroundColor: 'rgba(52, 152, 219, 0.5)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
`;
} else {
// Para formato PDF, preparamos una versión simplificada
return `<p>Informe PDF no disponible en la vista previa. Haga clic en "Guardar Informe" para generar el PDF.</p>`;
}
}

// Preparar datos del gráfico de beneficios
function prepareProfitsChartData(filteredInvestments, filteredInvestors, filteredOperations) {
// Agrupar por inversor
const investorProfits = {};

filteredInvestments.filter(inv => inv.status === 'active').forEach(investment => {
const investorId = investment.investorId;
const investor = filteredInvestors.find(inv => inv.id === investorId);

if (!investor) return;

if (!investorProfits[investorId]) {
    investorProfits[investorId] = {
        name: investor.name,
        totalProfit: 0,
        paidProfit: 0
    };
}

// Calcular beneficio para esta inversión
const today = new Date();
const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
investorProfits[investorId].totalProfit += profit;
});

// Añadir beneficios pagados
filteredOperations.filter(op => op.type === 'profit' && op.status === 'active').forEach(operation => {
const investorId = operation.investorId;

if (investorProfits[investorId]) {
    investorProfits[investorId].paidProfit += operation.amount;
}
});

// Convertir a arrays para el gráfico
const sortedInvestors = Object.keys(investorProfits).sort((a, b) => 
investorProfits[b].totalProfit - investorProfits[a].totalProfit
);

return {
labels: sortedInvestors.map(id => investorProfits[id].name),
totalProfits: sortedInvestors.map(id => investorProfits[id].totalProfit),
paidProfits: sortedInvestors.map(id => investorProfits[id].paidProfit)
};
}

// Generar informe de operaciones
function generateOperationsReport(filteredOperations, filteredInvestors, format) {
// Implementación similar para informes de operaciones
if (format === 'table') {
let tableContent = `
    <table class="table" id="reportTable">
        <thead>
            <tr>
                <th>ID Operación</th>
                <th>Inversor</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Notas</th>
            </tr>
        </thead>
        <tbody>
`;

if (filteredOperations.length === 0) {
    tableContent += `<tr><td colspan="7" style="text-align: center;">No hay operaciones que coincidan con los criterios</td></tr>`;
} else {
    // Ordenar operaciones por fecha (más recientes primero)
    const sortedOperations = [...filteredOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOperations.forEach(operation => {
        const investor = filteredInvestors.find(inv => inv.id === operation.investorId);
        
        if (!investor) return;
        
        tableContent += `
            <tr>
                <td>${operation.id}</td>
                <td>${investor.name}</td>
                <td>${getOperationTypeName(operation.type)}</td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'Pendiente' : 'Completada'}</span></td>
                <td>${operation.notes || '-'}</td>
            </tr>
        `;
    });
}

tableContent += `
        </tbody>
    </table>
`;

return tableContent;
} else if (format === 'chart') {
// Para formato de gráfico, preparamos los datos
return `
    <div id="reportChart" style="height: 400px; width: 100%;">
        <!-- El gráfico se renderizará aquí -->
        <canvas id="operationsChart"></canvas>
    </div>
    <script>
        // Datos para el gráfico
        const operationsData = ${JSON.stringify(prepareOperationsChartData(filteredOperations))};
        
        // Renderizar gráfico
        const ctx = document.getElementById('operationsChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: operationsData.labels,
                datasets: [{
                    data: operationsData.values,
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(231, 76, 60, 0.7)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
`;
} else {
// Para formato PDF, preparamos una versión simplificada
return `<p>Informe PDF no disponible en la vista previa. Haga clic en "Guardar Informe" para generar el PDF.</p>`;
}
}

// Preparar datos del gráfico de operaciones
function prepareOperationsChartData(filteredOperations) {
// Contar operaciones por tipo
const operationCounts = {};

filteredOperations.forEach(operation => {
const type = operation.type;
if (!operationCounts[type]) {
    operationCounts[type] = 0;
}
operationCounts[type]++;
});

// Preparar etiquetas y valores
const types = Object.keys(operationCounts);
const typeLabels = types.map(type => getOperationTypeName(type));
const values = types.map(type => operationCounts[type]);

return {
labels: typeLabels,
values
};
}

// Generar informe financiero
function generateFinancialReport(filteredInvestments, filteredOperations, format) {
// Implementación similar para informes financieros
// ...
return `<p>Informe financiero: Este tipo de informe es más complejo y requiere acceso a datos financieros completos.</p>`;
}

// Generar informe de resumen
function generateSummaryReport(filteredInvestors, filteredInvestments, filteredOperations, format) {
// Implementación para informe de resumen
if (format === 'table') {
// Calcular estadísticas resumidas
const totalInvestors = filteredInvestors.length;
const totalInvestments = filteredInvestments.length;
const activeInvestments = filteredInvestments.filter(inv => inv.status === 'active').length;
const totalInvestmentAmount = filteredInvestments.reduce((total, inv) => total + inv.amount, 0);

const totalOperations = filteredOperations.length;
const pendingOperations = filteredOperations.filter(op => op.status === 'pending').length;

// Calcular beneficios
const today = new Date();
let totalProfits = 0;

filteredInvestments.filter(inv => inv.status === 'active').forEach(inv => {
    const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
    totalProfits += profit;
});

// Calcular beneficios pagados
const totalPaidProfits = filteredOperations
    .filter(op => op.type === 'profit' && op.status === 'active')
    .reduce((total, op) => total + op.amount, 0);

// Construir tabla de resumen
let tableContent = `
    <div class="summary-stats" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Total de Inversores</div>
                    <div class="card-value">${totalInvestors}</div>
                </div>
                <div class="card-icon primary">
                    <i class="fas fa-users"></i>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Inversiones Activas</div>
                    <div class="card-value">${activeInvestments}</div>
                </div>
                <div class="card-icon success">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Total Invertido</div>
                    <div class="card-value">${formatCurrency(totalInvestmentAmount)}</div>
                </div>
                <div class="card-icon info">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Beneficios Generados</div>
                    <div class="card-value">${formatCurrency(totalProfits.toFixed(2))}</div>
                </div>
                <div class="card-icon warning">
                    <i class="fas fa-hand-holding-usd"></i>
                </div>
            </div>
        </div>
    </div>
    
    <h3>Resumen de Operaciones</h3>
    <table class="table" id="reportTable">
        <thead>
            <tr>
                <th>Tipo de Operación</th>
                <th>Cantidad</th>
                <th>Monto Total</th>
            </tr>
        </thead>
        <tbody>
`;

// Agrupar operaciones por tipo
const operationsByType = {};

filteredOperations.forEach(operation => {
    const type = operation.type;
    if (!operationsByType[type]) {
        operationsByType[type] = {
            count: 0,
            amount: 0
        };
    }
    operationsByType[type].count++;
    operationsByType[type].amount += operation.amount;
});

if (Object.keys(operationsByType).length === 0) {
    tableContent += `<tr><td colspan="3" style="text-align: center;">No hay operaciones que coincidan con los criterios</td></tr>`;
} else {
    Object.keys(operationsByType).forEach(type => {
        tableContent += `
            <tr>
                <td>${getOperationTypeName(type)}</td>
                <td>${operationsByType[type].count}</td>
                <td>${formatCurrency(operationsByType[type].amount)}</td>
            </tr>
        `;
    });
}

tableContent += `
        </tbody>
    </table>
`;

return tableContent;
} else if (format === 'chart') {
// Para formato de gráfico, preparamos los datos
return `
    <div id="reportChart" style="height: 400px; width: 100%;">
        <!-- El gráfico se renderizará aquí -->
        <canvas id="summaryChart"></canvas>
    </div>
    <script>
        // Datos para el gráfico
        const summaryData = ${JSON.stringify(prepareSummaryChartData(filteredInvestments, filteredOperations))};
        
        // Renderizar gráfico
        const ctx = document.getElementById('summaryChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: summaryData.labels,
                datasets: [{
                    label: 'Montos',
                    data: summaryData.values,
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(241, 196, 15, 0.7)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(241, 196, 15, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
`;
} else {
// Para formato PDF, preparamos una versión simplificada
return `<p>Informe PDF no disponible en la vista previa. Haga clic en "Guardar Informe" para generar el PDF.</p>`;
}
}

// Preparar datos del gráfico de resumen
function prepareSummaryChartData(filteredInvestments, filteredOperations) {
// Calcular montos por categoría
const totalInvestmentAmount = filteredInvestments.reduce((total, inv) => total + inv.amount, 0);

const today = new Date();
let totalProfits = 0;

filteredInvestments.filter(inv => inv.status === 'active').forEach(inv => {
const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
totalProfits += profit;
});

const investmentOperations = filteredOperations
.filter(op => op.type === 'investment')
.reduce((total, op) => total + op.amount, 0);

const withdrawalOperations = filteredOperations
.filter(op => op.type === 'withdrawal')
.reduce((total, op) => total + op.amount, 0);

const profitOperations = filteredOperations
.filter(op => op.type === 'profit')
.reduce((total, op) => total + op.amount, 0);

return {
labels: ['Total Invertido', 'Beneficios Generados', 'Beneficios Pagados', 'Retiros'],
values: [totalInvestmentAmount, totalProfits, profitOperations, withdrawalOperations]
};
}

// Mostrar resultado del informe
function showReportResult(title, content, format) {
const reportTitle = document.getElementById('reportTitle');
const reportContent = document.getElementById('reportContent');
const reportResult = document.getElementById('reportResult');

if (!reportTitle || !reportContent || !reportResult) return;

reportTitle.textContent = title;
reportContent.innerHTML = content;
reportResult.style.display = 'block';
}

// Cerrar informe
function closeReport() {
const reportResult = document.getElementById('reportResult');
if (reportResult) {
reportResult.style.display = 'none';
}
}

// Guardar informe
function saveReport() {
// Verificar si hay un informe temporal
if (!window.tempReport) {
createNotification('Error', 'No hay informe para guardar', 'danger');
return;
}

// Añadir informe a la lista
reports.push(window.tempReport);

// Guardar informes
saveReports();

// Actualizar lista de informes
loadReports();

// Mostrar notificación de éxito
createNotification('Éxito', 'Informe guardado con éxito', 'success');

// Limpiar informe temporal
window.tempReport = null;
}

// Ver informe
function viewReport(id) {
// Encontrar informe
const report = reports.find(r => r.id === id);

if (!report) {
createNotification('Error', 'Informe no encontrado', 'danger');
return;
}

// Mostrar informe
showReportResult(report.title, report.content, report.format);

// Almacenar ID del informe actual
currentReportId = report.id;

// No hay necesidad de guardar un informe temporal aquí ya que estamos viendo un informe existente
window.tempReport = null;
}

// Descargar informe
function downloadReport(id) {
// Encontrar informe
const report = reports.find(r => r.id === id);

if (!report) {
createNotification('Error', 'Informe no encontrado', 'danger');
return;
}

// En una aplicación real, generaríamos un PDF o documento para descargar
// Por ahora, simularemos con un archivo JSON

const data = JSON.stringify(report, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);

const a = document.createElement('a');
a.href = url;
a.download = `report_${report.id}.json`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);

// Mostrar notificación de éxito
createNotification('Éxito', 'Informe descargado con éxito', 'success');
}

// Eliminar informe
function deleteReport(id) {
// Encontrar informe
const report = reports.find(r => r.id === id);

if (!report) {
createNotification('Error', 'Informe no encontrado', 'danger');
return;
}

// Eliminar informe
reports = reports.filter(r => r.id !== id);

// Guardar informes
saveReports();

// Actualizar lista de informes
loadReports();

// Mostrar notificación de éxito
createNotification('Éxito', 'Informe eliminado con éxito', 'success');
}

// ============ Funciones de Análisis ============

// Cargar análisis
function loadAnalytics() {
// Cargar análisis general
loadAnalyticsOverview();

// El resto se cargará según la pestaña seleccionada
}

// Cargar análisis para pestaña específica
function loadAnalyticsForTab(tabId) {
switch (tabId) {
case 'overview':
    loadAnalyticsOverview();
    break;
case 'investments':
    loadAnalyticsInvestments();
    break;
case 'profits':
    loadAnalyticsProfits();
    break;
case 'investors':
    loadAnalyticsInvestors();
    break;
case 'trends':
    loadAnalyticsTrends();
    break;
}
}

// Cargar visión general de análisis
function loadAnalyticsOverview() {
// Calcular tasa de crecimiento mensual
const today = new Date();
const currentMonth = today.getMonth();
const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const currentYear = today.getFullYear();
const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

// Calcular inversiones del mes actual
const currentMonthInvestments = investments.filter(inv => {
const invDate = new Date(inv.date);
return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
}).reduce((total, inv) => total + inv.amount, 0);

// Calcular inversiones del mes pasado
const lastMonthInvestments = investments.filter(inv => {
const invDate = new Date(inv.date);
return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
}).reduce((total, inv) => total + inv.amount, 0);

// Calcular tasa de crecimiento
const growthRate = lastMonthInvestments === 0 ? 100 : ((currentMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100;

// Actualizar elementos
document.getElementById('monthlyGrowthRate').textContent = `${growthRate.toFixed(1)}%`;

// Actualizar cambio
const monthlyGrowthChange = document.getElementById('monthlyGrowthChange');
const monthlyGrowthChangeIcon = monthlyGrowthChange.previousElementSibling;

if (growthRate > 0) {
monthlyGrowthChange.textContent = `${growthRate.toFixed(1)}% desde el mes pasado`;
monthlyGrowthChangeIcon.className = 'fas fa-arrow-up';
monthlyGrowthChange.parentElement.className = 'card-change up';
} else if (growthRate < 0) {
monthlyGrowthChange.textContent = `${Math.abs(growthRate).toFixed(1)}% desde el mes pasado`;
monthlyGrowthChangeIcon.className = 'fas fa-arrow-down';
monthlyGrowthChange.parentElement.className = 'card-change down';
} else {
monthlyGrowthChange.textContent = `Sin cambios desde el mes pasado`;
monthlyGrowthChangeIcon.className = 'fas fa-minus';
monthlyGrowthChange.parentElement.className = 'card-change';
}

// Calcular inversión promedio
const totalInvestmentAmount = investments.reduce((total, inv) => total + inv.amount, 0);
const averageInvestment = investments.length === 0 ? 0 : totalInvestmentAmount / investments.length;

document.getElementById('averageInvestment').textContent = formatCurrency(averageInvestment.toFixed(0));

// Calcular otros indicadores
// ...

// Cargar gráfico de rendimiento
loadPerformanceChart('monthly');
}

// Cargar gráfico de rendimiento
function loadPerformanceChart(period = 'monthly') {
// Generar datos de rendimiento basados en el período
const chartData = generateChartData(period);

// Configurar conjuntos de datos
const config = {
datasets: [
    {
        label: 'Inversiones',
        data: chartData.map(d => d.investments),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        fill: true,
        yAxisID: 'y'
    },
    {
        label: 'Beneficios',
        data: chartData.map(d => d.profits),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderWidth: 2,
        fill: true,
        yAxisID: 'y1'
    }
]
};

// Cargar gráfico
loadChart('performanceChart', chartData, config);
}

// Cambiar período del gráfico de rendimiento
function switchPerformanceChartPeriod(period) {
// Actualizar estados de los botones
document.querySelectorAll('#analyticsOverview .chart-actions button').forEach(btn => {
btn.className = 'btn btn-sm btn-light';
});

document.querySelector(`#analyticsOverview .chart-actions button[onclick="switchPerformanceChartPeriod('${period}')"]`).className = 'btn btn-sm btn-primary';

// Cargar gráfico
loadPerformanceChart(period);
}

// Cargar análisis de inversiones
function loadAnalyticsInvestments() {
// Implementar análisis de inversiones
// Ejemplo: distribución de inversiones por tamaño, por mes, etc.

// ...
}

// Cargar análisis de beneficios
function loadAnalyticsProfits() {
// Implementar análisis de beneficios
// Ejemplo: tendencias de beneficios, comparación con objetivos, etc.

// ...
}

// Cargar análisis de inversores
function loadAnalyticsInvestors() {
// Implementar análisis de inversores
// Ejemplo: demografía, tasa de retención, etc.

// ...
}

// Cargar análisis de tendencias
function loadAnalyticsTrends() {
// Implementar análisis de tendencias
// Ejemplo: predicciones, tendencias a largo plazo, etc.

// ...
}

// ============ Funciones para Datos Financieros ============

// Cargar datos financieros
function loadFinancialData() {
// Cargar resumen financiero
loadFinancialSummary();

// El resto se cargará según la pestaña seleccionada
}

// Cargar datos financieros para pestaña
function loadFinancialForTab(tabId) {
switch (tabId) {
case 'summary':
    loadFinancialSummary();
    break;
case 'income':
    loadFinancialIncome();
    break;
case 'cashflow':
    loadFinancialCashflow();
    break;
case 'projections':
    loadFinancialProjections();
    break;
}
}

// Cargar resumen financiero
function loadFinancialSummary() {
// Cargar datos financieros resumidos
// Ejemplo: ingresos, gastos, beneficios, etc.

// ...

// Cargar gráfico financiero
loadFinancialChart('monthly');
}

// Cargar gráfico financiero
function loadFinancialChart(period = 'monthly') {
// Generar datos financieros basados en el período
const chartData = generateFinancialChartData(period);

// Cargar gráfico
loadChart('financialChart', chartData);
}

// Generar datos para gráfico financiero
function generateFinancialChartData(period = 'monthly') {
// Simular datos financieros
const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const data = [];

const today = new Date();
const currentMonth = today.getMonth();

for (let i = 0; i < 12; i++) {
const month = (currentMonth - 11 + i + 12) % 12;
const year = today.getFullYear() + Math.floor((currentMonth - 11 + i) / 12);

// Calcular inversiones para este mes
const monthInvestments = investments.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getMonth() === month && invDate.getFullYear() === year;
}).reduce((total, inv) => total + inv.amount, 0);

// Calcular retiros para este mes
const monthWithdrawals = operations.filter(op => {
    const opDate = new Date(op.date);
    return opDate.getMonth() === month && opDate.getFullYear() === year && op.type === 'withdrawal';
}).reduce((total, op) => total + op.amount, 0);

// Calcular beneficios pagados para este mes
const monthProfits = operations.filter(op => {
    const opDate = new Date(op.date);
    return opDate.getMonth() === month && opDate.getFullYear() === year && op.type === 'profit';
}).reduce((total, op) => total + op.amount, 0);

data.push({
    date: `${months[month]} ${year}`,
    income: monthInvestments,
    expenses: monthWithdrawals + monthProfits,
    profit: monthInvestments - (monthWithdrawals + monthProfits)
});
}

return data;
}

// Cambiar período del gráfico financiero
function switchFinancialChartPeriod(period) {
// Actualizar estados de los botones
document.querySelectorAll('#financial .chart-actions button').forEach(btn => {
btn.className = 'btn btn-sm btn-light';
});

document.querySelector(`#financial .chart-actions button[onclick="switchFinancialChartPeriod('${period}')"]`).className = 'btn btn-sm btn-primary';

// Cargar gráfico
loadFinancialChart(period);
}

// Cargar informe de ingresos
function loadFinancialIncome() {
// Implementar carga de datos de ingresos
// ...
}

// Cargar informe de flujo de efectivo
function loadFinancialCashflow() {
// Implementar carga de datos de flujo de efectivo
// ...
}

// Cargar proyecciones financieras
function loadFinancialProjections() {
// Implementar carga de proyecciones financieras
// ...
}

// Generar informe financiero
function generateFinancialReport(event) {
event.preventDefault();

// Obtener valores del formulario
const reportType = document.getElementById('financialReportType').value;
const period = document.getElementById('financialReportPeriod').value;
let fromDate = null;
let toDate = null;

if (period === 'custom') {
fromDate = document.getElementById('financialFromDate').value;
toDate = document.getElementById('financialToDate').value;

if (!fromDate || !toDate) {
    createNotification('Error', 'Por favor, especifique el período', 'danger');
    return;
}
} else {
// Establecer fechas basadas en el período
const today = new Date();
toDate = today.toISOString().slice(0, 10);

switch (period) {
    case 'daily':
        // Último día
        fromDate = toDate;
        break;
    case 'weekly':
        // Última semana
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        fromDate = lastWeek.toISOString().slice(0, 10);
        break;
    case 'monthly':
        // Último mes
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        fromDate = lastMonth.toISOString().slice(0, 10);
        break;
    case 'quarterly':
        // Último trimestre
        const lastQuarter = new Date();
        lastQuarter.setMonth(lastQuarter.getMonth() - 3);
        fromDate = lastQuarter.toISOString().slice(0, 10);
        break;
    case 'yearly':
        // Último año
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        fromDate = lastYear.toISOString().slice(0, 10);
        break;
}
}

// Generar título del informe
let title = '';
switch (reportType) {
case 'income':
    title = 'Informe de Ingresos';
    break;
case 'expense':
    title = 'Informe de Gastos';
    break;
case 'cashflow':
    title = 'Informe de Flujo de Efectivo';
    break;
// Continuando desde donde se quedó:
case 'profit':
    title = 'Informe de Beneficios y Pérdidas';
    break;
case 'summary':
    title = 'Informe Financiero Resumido';
    break;
}

// Añadir periodo al título si se especifica
if (period !== 'custom') {
    switch (period) {
        case 'daily':
            title += ' - Diario';
            break;
        case 'weekly':
            title += ' - Semanal';
            break;
        case 'monthly':
            title += ' - Mensual';
            break;
        case 'quarterly':
            title += ' - Trimestral';
            break;
        case 'yearly':
            title += ' - Anual';
            break;
    }
} else if (fromDate && toDate) {
    title += ` (${formatDate(fromDate)} - ${formatDate(toDate)})`;
}

// Generar contenido del informe
const reportContent = generateFinancialReportContent(reportType, fromDate, toDate);

// Crear objeto de informe
const report = {
    id: generateId(),
    title,
    type: 'financial',
    reportType,
    period,
    fromDate,
    toDate,
    content: reportContent,
    format: 'table',
    date: new Date().toISOString(),
    createdBy: 'Admin'
};

// Guardar informe
reports.push(report);
saveReports();

// Mostrar notificación de éxito
createNotification('Éxito', 'Informe financiero generado con éxito', 'success');

// Mostrar el informe
viewReport(report.id);
}

// Generar contenido del informe financiero
function generateFinancialReportContent(reportType, fromDate, toDate) {
// Filtrar operaciones por fecha
const fromDateObj = fromDate ? new Date(fromDate) : null;
const toDateObj = toDate ? new Date(toDate) : null;

// Filtrar operaciones por fecha
let filteredOperations = operations;
if (fromDateObj || toDateObj) {
    filteredOperations = filteredOperations.filter(op => {
        const opDate = new Date(op.date);
        if (fromDateObj && toDateObj) {
            return opDate >= fromDateObj && opDate <= toDateObj;
        } else if (fromDateObj) {
            return opDate >= fromDateObj;
        } else if (toDateObj) {
            return opDate <= toDateObj;
        }
        return true;
    });
}

// Preparar datos según tipo de informe
let tableContent = '';
switch (reportType) {
    case 'income':
        tableContent = generateIncomeReportContent(filteredOperations);
        break;
    case 'expense':
        tableContent = generateExpenseReportContent(filteredOperations);
        break;
    case 'cashflow':
        tableContent = generateCashflowReportContent(filteredOperations);
        break;
    case 'profit':
        tableContent = generateProfitReportContent(filteredOperations);
        break;
    case 'summary':
        tableContent = generateSummaryFinancialReportContent(filteredOperations);
        break;
}

return tableContent;
}

// Generar contenido del informe de ingresos
function generateIncomeReportContent(filteredOperations) {
// Filtrar operaciones de ingresos (inversiones)
const incomeOperations = filteredOperations.filter(op => op.type === 'investment');

// Agrupar por mes
const incomeByMonth = {};

incomeOperations.forEach(op => {
    const date = new Date(op.date);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!incomeByMonth[monthYear]) {
        incomeByMonth[monthYear] = 0;
    }
    
    incomeByMonth[monthYear] += op.amount;
});

// Ordenar meses
const sortedMonths = Object.keys(incomeByMonth).sort((a, b) => {
    const [aMonth, aYear] = a.split('/').map(Number);
    const [bMonth, bYear] = b.split('/').map(Number);
    
    if (aYear !== bYear) {
        return aYear - bYear;
    }
    
    return aMonth - bMonth;
});

// Calcular total
const totalIncome = incomeOperations.reduce((total, op) => total + op.amount, 0);

// Generar tabla
let tableContent = `
<div class="report-summary">
    <div class="report-total">
        <span>Total de Ingresos:</span>
        <span>${formatCurrency(totalIncome)}</span>
    </div>
</div>

<table class="table" id="reportTable">
    <thead>
        <tr>
            <th>Mes</th>
            <th>Monto Total</th>
            <th>Número de Operaciones</th>
            <th>Promedio</th>
        </tr>
    </thead>
    <tbody>
`;

if (incomeOperations.length === 0) {
    tableContent += `<tr><td colspan="4" style="text-align: center;">No hay operaciones de ingresos en el período seleccionado</td></tr>`;
} else {
    sortedMonths.forEach(month => {
        const [monthNum, year] = month.split('/').map(Number);
        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
        
        const monthOperations = incomeOperations.filter(op => {
            const date = new Date(op.date);
            return date.getMonth() + 1 === monthNum && date.getFullYear() === year;
        });
        
        const monthTotal = incomeByMonth[month];
        const monthCount = monthOperations.length;
        const monthAverage = monthCount > 0 ? monthTotal / monthCount : 0;
        
        tableContent += `
        <tr>
            <td>${monthName} ${year}</td>
            <td>${formatCurrency(monthTotal)}</td>
            <td>${monthCount}</td>
            <td>${formatCurrency(monthAverage.toFixed(2))}</td>
        </tr>
        `;
    });
}

tableContent += `
    </tbody>
</table>

<div class="report-chart" style="height: 300px; margin-top: 30px;">
    <canvas id="incomeChart"></canvas>
</div>
<script>
    // Renderizar gráfico
    const ctx = document.getElementById('incomeChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(sortedMonths.map(month => {
                const [monthNum, year] = month.split('/').map(Number);
                const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
                return `${monthName} ${year}`;
            }))},
            datasets: [{
                label: 'Ingresos',
                data: ${JSON.stringify(sortedMonths.map(month => incomeByMonth[month]))},
                backgroundColor: 'rgba(46, 204, 113, 0.5)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
</script>
`;

return tableContent;
}

// Generar contenido del informe de gastos
function generateExpenseReportContent(filteredOperations) {
// Filtrar operaciones de gastos (retiros y pagos de beneficios)
const expenseOperations = filteredOperations.filter(op => op.type === 'withdrawal' || op.type === 'profit');

// Agrupar por tipo y mes
const expensesByTypeAndMonth = {};

expenseOperations.forEach(op => {
    const date = new Date(op.date);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!expensesByTypeAndMonth[op.type]) {
        expensesByTypeAndMonth[op.type] = {};
    }
    
    if (!expensesByTypeAndMonth[op.type][monthYear]) {
        expensesByTypeAndMonth[op.type][monthYear] = 0;
    }
    
    expensesByTypeAndMonth[op.type][monthYear] += op.amount;
});

// Ordenar meses
const allMonths = new Set();
Object.values(expensesByTypeAndMonth).forEach(typeMonths => {
    Object.keys(typeMonths).forEach(month => allMonths.add(month));
});

const sortedMonths = Array.from(allMonths).sort((a, b) => {
    const [aMonth, aYear] = a.split('/').map(Number);
    const [bMonth, bYear] = b.split('/').map(Number);
    
    if (aYear !== bYear) {
        return aYear - bYear;
    }
    
    return aMonth - bMonth;
});

// Calcular totales por tipo
const totalsByType = {};
Object.keys(expensesByTypeAndMonth).forEach(type => {
    totalsByType[type] = Object.values(expensesByTypeAndMonth[type]).reduce((sum, amount) => sum + amount, 0);
});

// Calcular total general
const totalExpenses = expenseOperations.reduce((total, op) => total + op.amount, 0);

// Generar tabla
let tableContent = `
<div class="report-summary">
    <div class="report-total">
        <span>Total de Gastos:</span>
        <span>${formatCurrency(totalExpenses)}</span>
    </div>
    <div class="report-breakdown">
        <span>Retiros:</span>
        <span>${formatCurrency(totalsByType['withdrawal'] || 0)}</span>
    </div>
    <div class="report-breakdown">
        <span>Pagos de Beneficios:</span>
        <span>${formatCurrency(totalsByType['profit'] || 0)}</span>
    </div>
</div>

<table class="table" id="reportTable">
    <thead>
        <tr>
            <th>Mes</th>
            <th>Retiros</th>
            <th>Pagos de Beneficios</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
`;

if (expenseOperations.length === 0) {
    tableContent += `<tr><td colspan="4" style="text-align: center;">No hay operaciones de gastos en el período seleccionado</td></tr>`;
} else {
    sortedMonths.forEach(month => {
        const [monthNum, year] = month.split('/').map(Number);
        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
        
        const withdrawals = expensesByTypeAndMonth['withdrawal']?.[month] || 0;
        const profits = expensesByTypeAndMonth['profit']?.[month] || 0;
        const total = withdrawals + profits;
        
        tableContent += `
        <tr>
            <td>${monthName} ${year}</td>
            <td>${formatCurrency(withdrawals)}</td>
            <td>${formatCurrency(profits)}</td>
            <td>${formatCurrency(total)}</td>
        </tr>
        `;
    });
}

tableContent += `
    </tbody>
</table>

<div class="report-chart" style="height: 300px; margin-top: 30px;">
    <canvas id="expenseChart"></canvas>
</div>
<script>
    // Renderizar gráfico
    const ctx = document.getElementById('expenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(sortedMonths.map(month => {
                const [monthNum, year] = month.split('/').map(Number);
                const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
                return `${monthName} ${year}`;
            }))},
            datasets: [
                {
                    label: 'Retiros',
                    data: ${JSON.stringify(sortedMonths.map(month => expensesByTypeAndMonth['withdrawal']?.[month] || 0))},
                    backgroundColor: 'rgba(231, 76, 60, 0.5)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Pagos de Beneficios',
                    data: ${JSON.stringify(sortedMonths.map(month => expensesByTypeAndMonth['profit']?.[month] || 0))},
                    backgroundColor: 'rgba(241, 196, 15, 0.5)',
                    borderColor: 'rgba(241, 196, 15, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    stacked: false
                }
            }
        }
    });
</script>
`;

return tableContent;
}

// Generar contenido del informe de flujo de efectivo
function generateCashflowReportContent(filteredOperations) {
// Agrupar operaciones por mes
const operationsByMonth = {};

filteredOperations.forEach(op => {
    const date = new Date(op.date);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!operationsByMonth[monthYear]) {
        operationsByMonth[monthYear] = {
            income: 0,
            expense: 0,
            total: 0
        };
    }
    
    if (op.type === 'investment') {
        operationsByMonth[monthYear].income += op.amount;
        operationsByMonth[monthYear].total += op.amount;
    } else if (op.type === 'withdrawal' || op.type === 'profit') {
        operationsByMonth[monthYear].expense += op.amount;
        operationsByMonth[monthYear].total -= op.amount;
    }
});

// Ordenar meses
const sortedMonths = Object.keys(operationsByMonth).sort((a, b) => {
    const [aMonth, aYear] = a.split('/').map(Number);
    const [bMonth, bYear] = b.split('/').map(Number);
    
    if (aYear !== bYear) {
        return aYear - bYear;
    }
    
    return aMonth - bMonth;
});

// Calcular acumulado
let accumulated = 0;
sortedMonths.forEach(month => {
    accumulated += operationsByMonth[month].total;
    operationsByMonth[month].accumulated = accumulated;
});

// Calcular totales
const totalIncome = filteredOperations
    .filter(op => op.type === 'investment')
    .reduce((total, op) => total + op.amount, 0);

const totalExpense = filteredOperations
    .filter(op => op.type === 'withdrawal' || op.type === 'profit')
    .reduce((total, op) => total + op.amount, 0);

const netCashflow = totalIncome - totalExpense;

// Generar tabla
let tableContent = `
<div class="report-summary">
    <div class="report-total">
        <span>Flujo de Efectivo Neto:</span>
        <span class="${netCashflow >= 0 ? 'positive' : 'negative'}">${formatCurrency(netCashflow)}</span>
    </div>
    <div class="report-breakdown">
        <span>Total de Ingresos:</span>
        <span>${formatCurrency(totalIncome)}</span>
    </div>
    <div class="report-breakdown">
        <span>Total de Egresos:</span>
        <span>${formatCurrency(totalExpense)}</span>
    </div>
</div>

<table class="table" id="reportTable">
    <thead>
        <tr>
            <th>Mes</th>
            <th>Ingresos</th>
            <th>Egresos</th>
            <th>Neto</th>
            <th>Acumulado</th>
        </tr>
    </thead>
    <tbody>
`;

if (sortedMonths.length === 0) {
    tableContent += `<tr><td colspan="5" style="text-align: center;">No hay operaciones en el período seleccionado</td></tr>`;
} else {
    sortedMonths.forEach(month => {
        const [monthNum, year] = month.split('/').map(Number);
        const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
        const monthData = operationsByMonth[month];
        
        tableContent += `
        <tr>
            <td>${monthName} ${year}</td>
            <td>${formatCurrency(monthData.income)}</td>
            <td>${formatCurrency(monthData.expense)}</td>
            <td class="${monthData.total >= 0 ? 'positive' : 'negative'}">${formatCurrency(monthData.total)}</td>
            <td class="${monthData.accumulated >= 0 ? 'positive' : 'negative'}">${formatCurrency(monthData.accumulated)}</td>
        </tr>
        `;
    });
}

tableContent += `
    </tbody>
</table>

<div class="report-chart" style="height: 300px; margin-top: 30px;">
    <canvas id="cashflowChart"></canvas>
</div>
<script>
    // Renderizar gráfico
    const ctx = document.getElementById('cashflowChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ${JSON.stringify(sortedMonths.map(month => {
                const [monthNum, year] = month.split('/').map(Number);
                const monthName = new Date(year, monthNum - 1, 1).toLocaleString('es-ES', { month: 'long' });
                return `${monthName} ${year}`;
            }))},
            datasets: [
                {
                    label: 'Ingresos',
                    data: ${JSON.stringify(sortedMonths.map(month => operationsByMonth[month].income))},
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Egresos',
                    data: ${JSON.stringify(sortedMonths.map(month => operationsByMonth[month].expense))},
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Acumulado',
                    data: ${JSON.stringify(sortedMonths.map(month => operationsByMonth[month].accumulated))},
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
</script>
`;

return tableContent;
}

// Generar contenido del informe de beneficios y pérdidas
function generateProfitReportContent(filteredOperations) {
// Periodo del informe
const fromDate = new Date(Math.min(...filteredOperations.map(op => new Date(op.date).getTime())));
const toDate = new Date(Math.max(...filteredOperations.map(op => new Date(op.date).getTime())));

// Ingresos
const totalInvestments = filteredOperations
    .filter(op => op.type === 'investment')
    .reduce((total, op) => total + op.amount, 0);

// Egresos
const totalWithdrawals = filteredOperations
    .filter(op => op.type === 'withdrawal')
    .reduce((total, op) => total + op.amount, 0);

const totalProfitPayments = filteredOperations
    .filter(op => op.type === 'profit')
    .reduce((total, op) => total + op.amount, 0);

// Calcular beneficios generados
const activeInvestments = investments.filter(inv => inv.status === 'active');
let totalProfitsGenerated = 0;

activeInvestments.forEach(inv => {
    const profit = calculateProfit(inv.amount, inv.date, toDate.toISOString());
    totalProfitsGenerated += profit;
});

// Resultados
const netProfit = totalProfitsGenerated - totalProfitPayments;
const profitRatio = totalInvestments > 0 ? (totalProfitsGenerated / totalInvestments) * 100 : 0;

// Generar tabla
let tableContent = `
<div class="report-summary">
    <div class="report-period">
        <span>Período:</span>
        <span>${formatDate(fromDate.toISOString())} - ${formatDate(toDate.toISOString())}</span>
    </div>
    <div class="report-total">
        <span>Beneficio Neto:</span>
        <span class="${netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(netProfit)}</span>
    </div>
    <div class="report-breakdown">
        <span>Ratio de Beneficio:</span>
        <span>${profitRatio.toFixed(2)}%</span>
    </div>
</div>

<table class="table" id="reportTable">
    <thead>
        <tr>
            <th>Concepto</th>
            <th>Monto</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Ingresos</strong></td>
            <td></td>
        </tr>
        <tr>
            <td>Inversiones</td>
            <td>${formatCurrency(totalInvestments)}</td>
        </tr>
        <tr>
            <td><strong>Beneficios</strong></td>
            <td></td>
        </tr>
        <tr>
            <td>Beneficios Generados</td>
            <td>${formatCurrency(totalProfitsGenerated)}</td>
        </tr>
        <tr>
            <td>Beneficios Pagados</td>
            <td>${formatCurrency(totalProfitPayments)}</td>
        </tr>
        <tr>
            <td>Beneficios Pendientes</td>
            <td>${formatCurrency(totalProfitsGenerated - totalProfitPayments)}</td>
        </tr>
        <tr>
            <td><strong>Retiros</strong></td>
            <td></td>
        </tr>
        <tr>
            <td>Retiros de Capital</td>
            <td>${formatCurrency(totalWithdrawals)}</td>
        </tr>
        <tr class="total-row">
            <td><strong>Beneficio Neto</strong></td>
            <td><strong>${formatCurrency(netProfit)}</strong></td>
        </tr>
    </tbody>
</table>

<div class="report-chart" style="height: 300px; margin-top: 30px;">
    <canvas id="profitLossChart"></canvas>
</div>
<script>
    // Renderizar gráfico
    const ctx = document.getElementById('profitLossChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Inversiones', 'Beneficios Generados', 'Beneficios Pagados', 'Retiros'],
            datasets: [{
                data: [${totalInvestments}, ${totalProfitsGenerated}, ${totalProfitPayments}, ${totalWithdrawals}],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
</script>
`;

return tableContent;
}

// Generar contenido del informe financiero resumido
function generateSummaryFinancialReportContent(filteredOperations) {
// Calcular estadísticas generales
const totalInvestors = investors.length;
const totalInvestments = investments.length;
const activeInvestments = investments.filter(inv => inv.status === 'active').length;
const closedInvestments = investments.filter(inv => inv.status === 'closed').length;

// Calcular montos
const totalInvestmentAmount = investments.reduce((total, inv) => total + inv.amount, 0);
const activeInvestmentAmount = investments
    .filter(inv => inv.status === 'active')
    .reduce((total, inv) => total + inv.amount, 0);

// Calcular beneficios
const today = new Date();
let totalProfits = 0;

investments
    .filter(inv => inv.status === 'active')
    .forEach(inv => {
        const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
        totalProfits += profit;
    });

// Calcular beneficios pagados
const totalPaidProfits = operations
    .filter(op => op.type === 'profit')
    .reduce((total, op) => total + op.amount, 0);

// Calcular beneficios pendientes
const pendingProfits = totalProfits - totalPaidProfits;

// Generar tabla
let tableContent = `
<div class="summary-stats" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px;">
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Total de Inversores</div>
                <div class="card-value">${totalInvestors}</div>
            </div>
            <div class="card-icon primary">
                <i class="fas fa-users"></i>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Inversiones Activas</div>
                <div class="card-value">${activeInvestments}</div>
            </div>
            <div class="card-icon success">
                <i class="fas fa-money-bill-wave"></i>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Total Invertido</div>
                <div class="card-value">${formatCurrency(totalInvestmentAmount)}</div>
            </div>
            <div class="card-icon info">
                <i class="fas fa-chart-line"></i>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">Beneficios Generados</div>
                <div class="card-value">${formatCurrency(totalProfits.toFixed(2))}</div>
            </div>
            <div class="card-icon warning">
                <i class="fas fa-hand-holding-usd"></i>
            </div>
        </div>
    </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
    <div>
        <h3>Resumen de Inversiones</h3>
        <table class="table">
            <tbody>
                <tr>
                    <td>Total Inversiones</td>
                    <td>${totalInvestments}</td>
                </tr>
                <tr>
                    <td>Inversiones Activas</td>
                    <td>${activeInvestments}</td>
                </tr>
                <tr>
                    <td>Inversiones Cerradas</td>
                    <td>${closedInvestments}</td>
                </tr>
                <tr>
                    <td>Monto Total Invertido</td>
                    <td>${formatCurrency(totalInvestmentAmount)}</td>
                </tr>
                <tr>
                    <td>Monto en Inversiones Activas</td>
                    <td>${formatCurrency(activeInvestmentAmount)}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div>
        <h3>Resumen de Beneficios</h3>
        <table class="table">
            <tbody>
                <tr>
                    <td>Tasa de Beneficio Mensual</td>
                    <td>${settings.monthlyProfitRate}%</td>
                </tr>
                <tr>
                    <td>Beneficios Generados</td>
                    <td>${formatCurrency(totalProfits.toFixed(2))}</td>
                </tr>
                <tr>
                    <td>Beneficios Pagados</td>
                    <td>${formatCurrency(totalPaidProfits.toFixed(2))}</td>
                </tr>
                <tr>
                    <td>Beneficios Pendientes</td>
                    <td>${formatCurrency(pendingProfits.toFixed(2))}</td>
                </tr>
                <tr>
                    <td>Rendimiento</td>
                    <td>${(totalProfits / activeInvestmentAmount * 100).toFixed(2)}%</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<div class="report-chart" style="height: 300px; margin-top: 30px;">
    <canvas id="summaryFinancialChart"></canvas>
</div>
<script>
    // Renderizar gráfico
    const ctx = document.getElementById('summaryFinancialChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Invertido', 'Inversiones Activas', 'Beneficios Generados', 'Beneficios Pagados', 'Beneficios Pendientes'],
            datasets: [{
                label: 'Resumen Financiero',
                data: [${totalInvestmentAmount}, ${activeInvestmentAmount}, ${totalProfits}, ${totalPaidProfits}, ${pendingProfits}],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(231, 76, 60, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
</script>
`;

return tableContent;
}

// ============ Función de inicialización ============

// Función de inicialización al cargar la página
function init() {
// Cargar datos guardados
loadData();

// Mostrar página de dashboard por defecto
showPage('dashboard');

// Inicializar sincronización si está habilitada
const syncEnabled = localStorage.getItem('syncEnabled') === 'true';
if (syncEnabled) {
    enableSync();
}

// Inicializar tema oscuro si está guardado
const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) {
    document.body.classList.add('dark-mode');
}

// Cargar última hora de sincronización si existe
lastSyncTime = localStorage.getItem('lastSyncTime');

// Crear notificación de bienvenida
setTimeout(() => {
    createNotification('Bienvenido', `Bienvenido al sistema de gestión de inversiones de ${settings.companyName}`, 'info');
}, 1000);
}

// Iniciar la aplicación cuando se carga el documento
document.addEventListener('DOMContentLoaded', init);