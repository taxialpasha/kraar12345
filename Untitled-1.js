// Global Variables
let investors = [];
let investments = [];
let operations = [];
let events = [];
let notifications = [];
let backupList = [];
let reports = [];
let settings = {
    monthlyProfitRate: 1.75, // Default 1.75% monthly
    companyName: 'شركة الاستثمار العراقية',
    minInvestment: 1000000,
    profitDistributionPeriod: 'monthly',
    profitDistributionDay: 1,
    earlyWithdrawalFee: 0.5,
    maxPartialWithdrawal: 50,
    currency: 'IQD',
    acceptedCurrencies: ['IQD', 'USD'],
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

// ============ Utility Functions ============

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Generate Operation ID
function generateOperationId() {
    const year = new Date().getFullYear();
    const count = operations.length + 1;
    return `OP-${year}-${count.toString().padStart(3, '0')}`;
}

// Format number with commas
function formatNumber(num) {
    if (isNaN(num)) return "0";
    return parseFloat(num).toLocaleString('ar-IQ');
}

// Format currency
function formatCurrency(amount) {
    return formatNumber(amount) + ' ' + settings.currency;
}

// Format date to local format
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ');
}

// Format time to local format
function formatTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
}

// Calculate days difference between two dates
function daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate monthly profit
function calculateMonthlyProfit(amount) {
    return (amount * settings.monthlyProfitRate) / 100;
}

// Calculate profit for a specific date range
function calculateProfit(amount, startDate, endDate) {
    if (!amount || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) return 0;
    
    const totalDays = daysDifference(startDate, endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    const days = end.getDate() - start.getDate();
    
    // Calculate monthly profit
    const monthlyProfit = calculateMonthlyProfit(amount);
    
    // If less than a month, calculate pro-rated profit
    if (months === 0) {
        const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        return (monthlyProfit * totalDays) / daysInMonth;
    } else {
        // Calculate complete months profit + remaining days
        const completeMonthsProfit = monthlyProfit * months;
        const daysInLastMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
        const remainingDaysProfit = (monthlyProfit * days) / daysInLastMonth;
        
        return completeMonthsProfit + (days >= 0 ? remainingDaysProfit : 0);
    }
}

// Create a notification
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
    
    // Keep only the last 100 notifications
    if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
    }
    
    // Update notification badge
    updateNotificationBadge();
    
    // Save notifications
    saveNotifications();
    
    // Show notification toast
    showNotificationToast(notification);
    
    // Return the notification
    return notification;
}

// Show notification toast
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

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update main notification badge
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
    
    // Update header notification badge
    const notificationBadgeHeader = document.getElementById('notificationBadgeHeader');
    if (notificationBadgeHeader) {
        notificationBadgeHeader.textContent = unreadCount;
        notificationBadgeHeader.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
    
    // Update operations badge
    const pendingOperations = operations.filter(op => op.status === 'pending').length;
    const operationsBadge = document.getElementById('operationsBadge');
    if (operationsBadge) {
        operationsBadge.textContent = pendingOperations;
        operationsBadge.style.display = pendingOperations > 0 ? 'inline-flex' : 'none';
    }
    
    // Update dashboard alert text
    updateDashboardAlert(unreadCount, pendingOperations);
}

// Update dashboard alert
function updateDashboardAlert(unreadCount, pendingOperations) {
    const dashboardAlertText = document.getElementById('dashboardAlertText');
    if (!dashboardAlertText) return;
    
    if (unreadCount > 0 || pendingOperations > 0) {
        let message = 'مرحباً بك في النظام. ';
        
        if (pendingOperations > 0) {
            message += `يوجد هناك ${pendingOperations} عمليات جديدة تحتاج للمراجعة${unreadCount > 0 ? '، و' : '.'}`;
        }
        
        if (unreadCount > 0) {
            message += `${pendingOperations > 0 ? '' : 'يوجد هناك '}${unreadCount} إشعارات جديدة.`;
        }
        
        dashboardAlertText.textContent = message;
    } else {
        dashboardAlertText.textContent = 'مرحباً بك في نظام إدارة الاستثمار. اضغط على أي عنصر من القائمة الجانبية للتنقل.';
    }
}

// Get operation type name
function getOperationTypeName(type) {
    switch (type) {
        case 'investment':
            return 'استثمار جديد';
        case 'withdrawal':
            return 'سحب';
        case 'profit':
            return 'دفع أرباح';
        default:
            return type;
    }
}

// Get event type name
function getEventTypeName(type) {
    switch (type) {
        case 'meeting':
            return 'اجتماع';
        case 'payment':
            return 'دفع أرباح';
        case 'withdrawal':
            return 'سحب';
        case 'investment':
            return 'استثمار';
        case 'other':
            return 'أخرى';
        default:
            return type;
    }
}

// Validate email
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Validate phone
function validatePhone(phone) {
    // Basic validation for Iraqi phone numbers
    const re = /^07\d{9}$/;
    return re.test(phone);
}

// Generate chart data
function generateChartData(period = 'monthly') {
    // Generate chart data based on period (daily, monthly, yearly)
    const chartData = [];
    const today = new Date();
    let startDate, endDate, dateFormat;
    
    switch (period) {
        case 'daily':
            // Last 30 days
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            endDate = today;
            dateFormat = 'DD/MM';
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const day = new Date(d);
                
                // Calculate total investments for this day
                const dayInvestments = investments.filter(inv => 
                    new Date(inv.date).toDateString() === day.toDateString()
                ).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calculate total profits up to this day
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
            // Last 12 months
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 11);
            startDate.setDate(1);
            
            const monthNames = [
                'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
            ];
            
            for (let m = 0; m < 12; m++) {
                const month = new Date(startDate);
                month.setMonth(month.getMonth() + m);
                
                const nextMonth = new Date(month);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                // Calculate total investments for this month
                const monthInvestments = investments.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === month.getMonth() && 
                           invDate.getFullYear() === month.getFullYear();
                }).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calculate total profits up to the end of this month
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
            // Last 5 years
            startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 4);
            startDate.setMonth(0);
            startDate.setDate(1);
            
            for (let y = 0; y < 5; y++) {
                const year = startDate.getFullYear() + y;
                const yearStart = new Date(year, 0, 1);
                const yearEnd = new Date(year, 11, 31);
                
                // Calculate total investments for this year
                const yearInvestments = investments.filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getFullYear() === year;
                }).reduce((sum, inv) => sum + inv.amount, 0);
                
                // Calculate total profits up to the end of this year
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

// Load chart
function loadChart(chartId, data, config = {}) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    // Clear previous chart
    chartContainer.innerHTML = '';
    
    // If no data, show placeholder
    if (!data || data.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--gray-600);">
                    <i class="fas fa-chart-line fa-3x" style="margin-bottom: 10px;"></i>
                    <p>لا توجد بيانات لعرضها</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Create chart canvas
    const canvas = document.createElement('canvas');
    canvas.width = chartContainer.offsetWidth;
    canvas.height = chartContainer.offsetHeight;
    chartContainer.appendChild(canvas);
    
    // Get context
    const ctx = canvas.getContext('2d');
    
    // Create chart
    new Chart(ctx, {
        type: config.type || 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: config.datasets || [
                {
                    label: 'الاستثمارات',
                    data: data.map(d => d.investments),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'الأرباح',
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

// ============ UI Functions ============

// Toggle sidebar
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// Show specific page
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active');
    
    // Mark the current menu item as active
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`.menu-item[href="#${pageId}"]`).classList.add('active');
    
    // Update the page content if needed
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

// Toggle notification panel
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('active');
    
    // Load notifications if panel is active
    if (panel.classList.contains('active')) {
        loadNotifications();
    }
}

// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Switch tab in modal
function switchModalTab(tabId, modalId) {
    // Hide all tabs
    document.querySelectorAll(`#${modalId} .modal-tab-content`).forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Mark the current tab as active
    document.querySelectorAll(`#${modalId} .modal-tab`).forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#${modalId} .modal-tab[onclick="switchModalTab('${tabId}', '${modalId}')"]`).classList.add('active');
}

// Switch analytics tab
function switchAnalyticsTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.analytics-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab
    document.getElementById(`analytics${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
    
    // Mark the current tab as active
    document.querySelectorAll('#analytics .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#analytics .tab[onclick="switchAnalyticsTab('${tabId}')"]`).classList.add('active');
    
    // Load analytics data for the tab
    loadAnalyticsForTab(tabId);
}

// Switch investments tab
function switchInvestmentsTab(tabId) {
    // Mark the current tab as active
    document.querySelectorAll('#investments .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#investments .tab[onclick="switchInvestmentsTab('${tabId}')"]`).classList.add('active');
    
    // Update table content based on selected tab
    if (tabId === 'active') {
        document.querySelector('#investments .table-title').textContent = 'الاستثمارات النشطة';
        loadInvestments('active');
    } else if (tabId === 'closed') {
        document.querySelector('#investments .table-title').textContent = 'الاستثمارات المغلقة';
        loadInvestments('closed');
    } else {
        document.querySelector('#investments .table-title').textContent = 'جميع الاستثمارات';
        loadInvestments('all');
    }
}

// Switch profits tab
function switchProfitsTab(tabId) {
    // Mark the current tab as active
    document.querySelectorAll('#profits .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#profits .tab[onclick="switchProfitsTab('${tabId}')"]`).classList.add('active');
    
    // Load relevant profit data
    loadProfitsForTab(tabId);
}

// Switch operations tab
function switchOperationsTab(tabId) {
    // Mark the current tab as active
    document.querySelectorAll('#operations .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#operations .tab[onclick="switchOperationsTab('${tabId}')"]`).classList.add('active');
    
    // Update table content based on selected tab
    loadOperations(tabId);
}

// Switch reports tab
function switchReportsTab(tabId) {
    // Mark the current tab as active
    document.querySelectorAll('#reports .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#reports .tab[onclick="switchReportsTab('${tabId}')"]`).classList.add('active');
    
    // Load the selected reports tab
    loadReportsForTab(tabId);
}

// Switch financial tab
function switchFinancialTab(tabId) {
    // Mark the current tab as active
    document.querySelectorAll('#financial .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#financial .tab[onclick="switchFinancialTab('${tabId}')"]`).classList.add('active');
    
    // Load financial data for the tab
    loadFinancialForTab(tabId);
}

// Switch calendar view
function switchCalendarView(viewId) {
    // Mark the current tab as active
    document.querySelectorAll('#calendar .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#calendar .tab[onclick="switchCalendarView('${viewId}')"]`).classList.add('active');
    
    // Update calendar view
    calendarCurrentView = viewId;
    loadCalendar();
}

// Switch settings tab
function switchSettingsTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab
    document.getElementById(`${tabId}Settings`).classList.add('active');
    
    // Mark the current tab as active
    document.querySelectorAll('#settings .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`#settings .tab[onclick="switchSettingsTab('${tabId}')"]`).classList.add('active');
    
    // Special case for sync tab
    if (tabId === 'sync') {
        updateSyncSettingsStatus();
    }
}

// Update days message when investment date changes
function updateDaysMessage() {
    const dateInput = document.getElementById('investmentDate');
    const messageDiv = document.getElementById('daysMessage');
    
    if (!dateInput || !messageDiv || !dateInput.value) return;
    
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    
    // Reset time to compare only dates
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        messageDiv.textContent = `تم اختيار تاريخ سابق (منذ ${diffDays} يوم)`;
        messageDiv.style.color = 'var(--warning-color)';
    } else if (diffDays < 0) {
        messageDiv.textContent = `تم اختيار تاريخ مستقبلي (بعد ${Math.abs(diffDays)} يوم)`;
        messageDiv.style.color = 'var(--info-color)';
    } else {
        messageDiv.textContent = 'تم اختيار تاريخ اليوم';
        messageDiv.style.color = 'var(--success-color)';
    }
}

// Update expected profit when investment amount changes
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

// Update expected profit for initial investment
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

// Print table
function printTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة</title>
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
                <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')}</div>
            </div>
            <h1>${document.querySelector('.page.active .page-title').textContent}</h1>
            ${table.outerHTML}
            <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">طباعة</button>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
}

// Toggle custom date range for financial report
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

// Toggle API key visibility
function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;
    
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
    } else {
        apiKeyInput.type = 'password';
    }
}

// Generate new API key
function generateNewApiKey() {
    const apiKeyInput = document.getElementById('apiKey');
    if (!apiKeyInput) return;
    
    // Generate random API key
    const newKey = Array.from(Array(40), () => Math.floor(Math.random() * 36).toString(36)).join('');
    apiKeyInput.value = newKey;
    apiKeyInput.type = 'text';
    
    createNotification('تم إنشاء مفتاح API جديد', 'تم إنشاء مفتاح API جديد بنجاح. يرجى حفظ الإعدادات لتطبيق التغييرات.', 'success');
    
    // Auto-switch back to password type after 5 seconds
    setTimeout(() => {
        apiKeyInput.type = 'password';
    }, 5000);
}

// Open add investor modal
function openAddInvestorModal() {
    // Reset form
    document.getElementById('investorForm').reset();
    document.getElementById('initialInvestmentForm').reset();
    
    // Set default date to today
    document.getElementById('initialInvestmentDate').valueAsDate = new Date();
    
    // Switch to first tab
    switchModalTab('investorInfo', 'addInvestorModal');
    
    openModal('addInvestorModal');
}

// Open new investment modal
function openNewInvestmentModal(investorId = null) {
    // Reset form
    document.getElementById('newInvestmentForm').reset();
    
    // Set default date to today
    document.getElementById('investmentDate').valueAsDate = new Date();
    
    // Update days message
    updateDaysMessage();
    
    // Populate investor select
    populateInvestorSelect('investmentInvestor');
    
    // If investor ID is provided, select it
    if (investorId) {
        document.getElementById('investmentInvestor').value = investorId;
    }
    
    openModal('newInvestmentModal');
}

// Open withdraw modal
function openWithdrawModal(investmentId = null) {
    // Reset form
    document.getElementById('withdrawForm').reset();
    
    // Set default date to today
    document.getElementById('withdrawDate').valueAsDate = new Date();
    
    // Populate investor select
    populateInvestorSelect('withdrawInvestor');
    
    // If investment ID is provided, find the investment and select investor and investment
    if (investmentId) {
        const investment = investments.find(inv => inv.id === investmentId);
        if (investment) {
            document.getElementById('withdrawInvestor').value = investment.investorId;
            // Populate investment select
            populateInvestmentSelect();
            // Wait for select to be populated
            setTimeout(() => {
                document.getElementById('withdrawInvestment').value = investmentId;
                // Update available amount
                updateAvailableAmount();
            }, 100);
        }
    }
    
    openModal('withdrawModal');
}

// Open pay profit modal
function openPayProfitModal(investorId = null) {
    // Reset form
    document.getElementById('payProfitForm').reset();
    
    // Set default date to today
    document.getElementById('profitDate').valueAsDate = new Date();
    
    // Hide custom period fields
    document.getElementById('customProfitPeriod').style.display = 'none';
    
    // Populate investor select
    populateInvestorSelect('profitInvestor');
    
    // If investor ID is provided, select it
    if (investorId) {
        document.getElementById('profitInvestor').value = investorId;
        // Update due profit
        updateDueProfit();
    }
    
    openModal('payProfitModal');
}

// Populate investor select
function populateInvestorSelect(selectId) {
    const select = document.getElementById(selectId);
    
    if (!select) return;
    
    // Clear previous options
    select.innerHTML = '<option value="">اختر المستثمر</option>';
    
    // Sort investors by name
    const sortedInvestors = [...investors].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add investor options
    sortedInvestors.forEach(investor => {
        const option = document.createElement('option');
        option.value = investor.id;
        option.textContent = investor.name;
        select.appendChild(option);
    });
}

// Populate investment select
function populateInvestmentSelect() {
    const investorId = document.getElementById('withdrawInvestor').value;
    const investmentSelect = document.getElementById('withdrawInvestment');
    
    // Clear previous options
    investmentSelect.innerHTML = '<option value="">اختر الاستثمار</option>';
    
    if (!investorId) return;
    
    // Find active investments for the selected investor
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

// Update available amount
function updateAvailableAmount() {
    const investmentId = document.getElementById('withdrawInvestment').value;
    const availableInput = document.getElementById('availableAmount');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    
    if (!investmentId || !availableInput) return;
    
    const investment = investments.find(inv => inv.id === investmentId);
    if (investment) {
        availableInput.value = formatCurrency(investment.amount);
        
        // Set maximum withdrawal amount
        if (withdrawAmountInput) {
            withdrawAmountInput.max = investment.amount;
            
            // Set default value to full amount
            withdrawAmountInput.value = investment.amount;
        }
    }
}

// Update due profit
function updateDueProfit() {
    const investorId = document.getElementById('profitInvestor').value;
    const dueProfitInput = document.getElementById('dueProfit');
    
    if (!investorId || !dueProfitInput) return;
    
    // Calculate total profit for the investor
    let totalProfit = 0;
    
    // Find active investments for the selected investor
    const activeInvestments = investments.filter(
        inv => inv.investorId === investorId && inv.status === 'active'
    );
    
    const today = new Date();
    
    activeInvestments.forEach(inv => {
        const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
        totalProfit += profit;
    });
    
    // Get total profit paid
    const profitPaid = operations
        .filter(op => op.investorId === investorId && op.type === 'profit')
        .reduce((total, op) => total + op.amount, 0);
    
    // Calculate due profit
    const dueProfit = Math.max(0, totalProfit - profitPaid);
    
    dueProfitInput.value = formatCurrency(dueProfit.toFixed(2));
    
    // Update profit amount
    const profitAmountInput = document.getElementById('profitAmount');
    if (profitAmountInput) {
        profitAmountInput.value = dueProfit.toFixed(0);
    }
}

// Toggle custom profit period
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

// Search investors
function searchInvestors() {
    const searchTerm = document.getElementById('investorSearchInput').value.toLowerCase();
    const tbody = document.getElementById('investorsTableBody');
    
    if (!tbody) return;
    
    // If search term is empty, reset the table
    if (!searchTerm) {
        loadInvestors();
        return;
    }
    
    // Get all investor rows
    const rows = tbody.querySelectorAll('tr');
    
    // Filter rows
    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const phone = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const address = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        const idCard = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
        
        // Show row if any field matches search term
        if (name.includes(searchTerm) || phone.includes(searchTerm) || 
            address.includes(searchTerm) || idCard.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search investments
function searchInvestments() {
    const searchTerm = document.getElementById('investmentSearchInput').value.toLowerCase();
    const tbody = document.getElementById('investmentsTableBody');
    
    if (!tbody) return;
    
    // If search term is empty, reset the table
    if (!searchTerm) {
        const activeTab = document.querySelector('#investments .tab.active');
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadInvestments(tabId);
        return;
    }
    
    // Get all investment rows
    const rows = tbody.querySelectorAll('tr');
    
    // Filter rows
    rows.forEach(row => {
        const investor = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const amount = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const date = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        // Show row if any field matches search term
        if (investor.includes(searchTerm) || amount.includes(searchTerm) || date.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search operations
function searchOperations() {
    const searchTerm = document.getElementById('operationsSearchInput').value.toLowerCase();
    const tbody = document.getElementById('operationsTableBody');
    
    if (!tbody) return;
    
    // If search term is empty, reset the table
    if (!searchTerm) {
        const activeTab = document.querySelector('#operations .tab.active');
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadOperations(tabId);
        return;
    }
    
    // Get all operation rows
    const rows = tbody.querySelectorAll('tr');
    
    // Filter rows
    rows.forEach(row => {
        const id = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const investor = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const type = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const amount = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        // Show row if any field matches search term
        if (id.includes(searchTerm) || investor.includes(searchTerm) || 
            type.includes(searchTerm) || amount.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Open delete confirmation modal
function openDeleteConfirmationModal(id, type) {
    pendingDeleteId = id;
    pendingDeleteType = type;
    
    // Set confirmation message
    const messageElement = document.getElementById('deleteConfirmationMessage');
    
    switch (type) {
        case 'investor':
            const investor = investors.find(inv => inv.id === id);
            if (investor) {
                messageElement.textContent = `هل أنت متأكد من حذف المستثمر "${investor.name}"؟ سيتم حذف جميع بياناته ومعاملاته.`;
            } else {
                messageElement.textContent = "هل أنت متأكد من حذف هذا المستثمر؟ سيتم حذف جميع بياناته ومعاملاته.";
            }
            break;
        case 'investment':
            messageElement.textContent = "هل أنت متأكد من حذف هذا الاستثمار؟ لا يمكن التراجع عن هذا الإجراء.";
            break;
        case 'operation':
            messageElement.textContent = "هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.";
            break;
        case 'event':
            messageElement.textContent = "هل أنت متأكد من حذف هذا الحدث؟ لا يمكن التراجع عن هذا الإجراء.";
            break;
        case 'report':
            messageElement.textContent = "هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.";
            break;
        case 'backup':
            messageElement.textContent = "هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.";
            break;
        default:
            messageElement.textContent = "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.";
    }
    
    openModal('deleteConfirmationModal');
}

// Confirm delete
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
    
    // Reset pending delete
    pendingDeleteId = null;
    pendingDeleteType = null;
    
    // Close modal
    closeModal('deleteConfirmationModal');
}

// View investor details
function viewInvestor(id) {
    // Set current investor ID
    currentInvestorId = id;
    
    // Find investor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Populate investor details tab
    const detailsTab = document.getElementById('investorDetails');
    
    // Calculate total investment for this investor
    const totalInvestment = investments
        .filter(inv => inv.investorId === investor.id && inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    // Calculate total profit for this investor
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
                <p style="margin-bottom: 5px;"><i class="fas fa-map-marker-alt" style="width: 20px; color: var(--gray-600);"></i> ${investor.address || 'غير محدد'}</p>
                <p style="margin-bottom: 5px;"><i class="fas fa-id-card" style="width: 20px; color: var(--gray-600);"></i> ${investor.idCard || 'غير محدد'}</p>
                <p style="margin-bottom: 5px;"><i class="fas fa-calendar-alt" style="width: 20px; color: var(--gray-600);"></i> تاريخ الانضمام: ${formatDate(investor.joinDate)}</p>
            </div>
            <div style="min-width: 200px;">
                <div class="card" style="margin-bottom: 10px; border-right: 4px solid var(--primary-color);">
                    <div style="font-size: 0.9rem; color: var(--gray-600);">إجمالي الاستثمار</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatCurrency(totalInvestment)}</div>
                </div>
                <div class="card" style="border-right: 4px solid var(--warning-color);">
                    <div style="font-size: 0.9rem; color: var(--gray-600);">إجمالي الأرباح</div>
                    <div style="font-size: 1.5rem; font-weight: 700;">${formatCurrency(totalProfit.toFixed(2))}</div>
                </div>
            </div>
        </div>
        <div style="background: var(--gray-100); border-radius: var(--border-radius); padding: 15px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px; color: var(--gray-700);">معلومات إضافية</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">البريد الإلكتروني</div>
                    <div>${investor.email || 'غير محدد'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">تاريخ الميلاد</div>
                    <div>${investor.birthdate ? formatDate(investor.birthdate) : 'غير محدد'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">المدينة</div>
                    <div>${investor.city || 'غير محدد'}</div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--gray-600);">المهنة</div>
                    <div>${investor.occupation || 'غير محدد'}</div>
                </div>
            </div>
        </div>
        <div>
            <h3 style="margin-bottom: 10px; color: var(--gray-700);">ملاحظات</h3>
            <p style="background: white; border-radius: var(--border-radius); padding: 15px; border: 1px solid var(--gray-200);">${investor.notes || 'لا توجد ملاحظات'}</p>
        </div>
    `;
    
// Populate investor investments tab
    const investmentsTab = document.getElementById('investorInvestments');
    
    // Get investor investments
    const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
    
    if (investorInvestments.length === 0) {
        investmentsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">لا توجد استثمارات</div>
                    <div class="alert-text">لا توجد استثمارات لهذا المستثمر. يمكنك إضافة استثمار جديد من خلال الضغط على زر "استثمار جديد".</div>
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
                            <th>المبلغ</th>
                            <th>تاريخ الاستثمار</th>
                            <th>الربح الشهري</th>
                            <th>إجمالي الأرباح</th>
                            <th>الحالة</th>
                            <th>إجراءات</th>
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
                <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'نشط' : 'مغلق'}</span></td>
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
    
    // Populate investor operations tab
    const operationsTab = document.getElementById('investorOperations');
    
    // Get investor operations
    const investorOperations = operations.filter(op => op.investorId === investor.id);
    
    if (investorOperations.length === 0) {
        operationsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">لا توجد عمليات</div>
                    <div class="alert-text">لا توجد عمليات لهذا المستثمر.</div>
                </div>
            </div>
        `;
    } else {
        operationsTab.innerHTML = `
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم العملية</th>
                            <th>نوع العملية</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>الحالة</th>
                            <th>ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody id="investorOperationsBody"></tbody>
                </table>
            </div>
        `;
        
        const tbody = document.getElementById('investorOperationsBody');
        
        // Sort operations by date (newest first)
        const sortedOperations = [...investorOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedOperations.forEach((operation) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${operation.id}</td>
                <td>${getOperationTypeName(operation.type)}</td>
                <td>${formatCurrency(operation.amount)}</td>
                <td>${formatDate(operation.date)}</td>
                <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                <td>${operation.notes || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Populate investor profits tab
    const profitsTab = document.getElementById('investorProfits');
    
    // Get active investments for this investor
    const activeInvestments = investments.filter(inv => inv.investorId === investor.id && inv.status === 'active');
    
    if (activeInvestments.length === 0) {
        profitsTab.innerHTML = `
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">لا توجد استثمارات نشطة</div>
                    <div class="alert-text">لا توجد استثمارات نشطة لهذا المستثمر لحساب الأرباح.</div>
                </div>
            </div>
        `;
    } else {
        // Get profit payment operations
        const profitPayments = operations.filter(op => op.investorId === investor.id && op.type === 'profit');
        
        // Calculate total profit paid
        const totalProfitPaid = profitPayments.reduce((total, op) => total + op.amount, 0);
        
        profitsTab.innerHTML = `
            <div class="dashboard-cards" style="margin-bottom: 20px;">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي الأرباح</div>
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
                            <div class="card-title">الأرباح المدفوعة</div>
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
                            <div class="card-title">الأرباح المستحقة</div>
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
                    <div class="table-title">سجل دفع الأرباح</div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم العملية</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>ملاحظات</th>
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
                <td colspan="4" style="text-align: center;">لا توجد عمليات دفع أرباح</td>
            `;
            tbody.appendChild(row);
        } else {
            // Sort profit payments by date (newest first)
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
    
    // Populate investor documents tab
    const documentsTab = document.getElementById('investorDocuments');
    
    documentsTab.innerHTML = `
        <div class="alert alert-info">
            <div class="alert-icon">
                <i class="fas fa-info"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">المستندات</div>
                <div class="alert-text">يمكنك إدارة مستندات المستثمر من هنا.</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-id-card"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">صورة البطاقة الشخصية</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'idCard')">
                    <i class="fas fa-upload"></i> تحميل
                </button>
            </div>
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">عقد الاستثمار</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'contract')">
                    <i class="fas fa-upload"></i> تحميل
                </button>
            </div>
            <div class="card" style="padding: 15px; text-align: center;">
                <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div style="font-weight: 600; margin-bottom: 5px;">مستندات إضافية</div>
                <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'other')">
                    <i class="fas fa-upload"></i> تحميل
                </button>
            </div>
        </div>
    `;
    
    openModal('viewInvestorModal');
}

// View investment details
function viewInvestment(id) {
    // Find investment
    const investment = investments.find(inv => inv.id === id);
    
    if (!investment) {
        createNotification('خطأ', 'الاستثمار غير موجود', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investment.investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Calculate monthly profit
    const monthlyProfit = calculateMonthlyProfit(investment.amount);
    
    // Calculate total profit
    const today = new Date();
    const totalProfit = investment.status === 'active' ? 
        calculateProfit(investment.amount, investment.date, today.toISOString()) : 0;
    
    // Create investment details popup
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'viewInvestmentModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">تفاصيل الاستثمار</h2>
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
                                    <div class="card-title">المبلغ</div>
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
                                    <div class="card-title">الربح الشهري</div>
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
                                    <div class="card-title">إجمالي الأرباح</div>
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
                            <label class="form-label">المستثمر</label>
                            <input type="text" class="form-control" value="${investor.name}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تاريخ الاستثمار</label>
                            <input type="text" class="form-control" value="${formatDate(investment.date)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">الحالة</label>
                            <input type="text" class="form-control" value="${investment.status === 'active' ? 'نشط' : 'مغلق'}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">مدة الاستثمار</label>
                            <input type="text" class="form-control" value="${daysDifference(investment.date, today.toISOString())} يوم" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">نسبة الربح الشهرية</label>
                            <input type="text" class="form-control" value="${settings.monthlyProfitRate}%" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">طريقة الدفع</label>
                            <input type="text" class="form-control" value="${getPaymentMethodName(investment.method || 'cash')}" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">ملاحظات</label>
                        <textarea class="form-control" rows="3" readonly>${investment.notes || 'لا توجد ملاحظات'}</textarea>
                    </div>
                </div>
                
                <div class="table-container" style="box-shadow: none; padding: 0;">
                    <div class="table-header">
                        <div class="table-title">العمليات المرتبطة</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم العملية</th>
                                <th>نوع العملية</th>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody id="investmentOperationsBody">
                            ${getInvestmentOperationsHTML(investment.id)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('viewInvestmentModal').remove()">إغلاق</button>
                ${investment.status === 'active' ? `
                    <button class="btn btn-warning" onclick="document.getElementById('viewInvestmentModal').remove(); openWithdrawModal('${investment.id}')">
                        <i class="fas fa-minus"></i> سحب
                    </button>
                    <button class="btn btn-primary" onclick="document.getElementById('viewInvestmentModal').remove(); openPayProfitModal('${investor.id}')">
                        <i class="fas fa-money-bill"></i> دفع أرباح
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Get investment operations HTML
function getInvestmentOperationsHTML(investmentId) {
    const relatedOperations = operations.filter(op => op.investmentId === investmentId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (relatedOperations.length === 0) {
        return `<tr><td colspan="5" style="text-align: center;">لا توجد عمليات مرتبطة</td></tr>`;
    }
    
    return relatedOperations.map(op => `
        <tr>
            <td>${op.id}</td>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
        </tr>
    `).join('');
}

// Get payment method name
function getPaymentMethodName(method) {
    switch (method) {
        case 'cash':
            return 'نقداً';
        case 'check':
            return 'شيك';
        case 'transfer':
            return 'حوالة بنكية';
        default:
            return method;
    }
}

// View operation details
function viewOperation(id) {
    // Find operation
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('خطأ', 'العملية غير موجودة', 'danger');
        return;
    }
    
    // Store current operation ID
    currentOperationId = id;
    
    // Find investor
    const investor = investors.find(inv => inv.id === operation.investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Find investment if applicable
    const investment = operation.investmentId ? 
        investments.find(inv => inv.id === operation.investmentId) : null;
    
    // Create operation details popup
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'viewOperationModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">تفاصيل العملية</h2>
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
                        <div class="alert-title">حالة العملية: ${operation.status === 'pending' ? 'معلقة' : 'مكتملة'}</div>
                        <div class="alert-text">${operation.status === 'pending' ? 'هذه العملية معلقة وتحتاج إلى موافقة.' : 'تم تنفيذ هذه العملية بنجاح.'}</div>
                    </div>
                </div>
                
                <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">رقم العملية</label>
                            <input type="text" class="form-control" value="${operation.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">نوع العملية</label>
                            <input type="text" class="form-control" value="${getOperationTypeName(operation.type)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">المستثمر</label>
                            <input type="text" class="form-control" value="${investor.name}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">المبلغ</label>
                            <input type="text" class="form-control" value="${formatCurrency(operation.amount)}" readonly>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">تاريخ العملية</label>
                            <input type="text" class="form-control" value="${formatDate(operation.date)}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">وقت العملية</label>
                            <input type="text" class="form-control" value="${formatTime(operation.date)}" readonly>
                        </div>
                    </div>
                    ${investment ? `
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">الاستثمار المرتبط</label>
                                <input type="text" class="form-control" value="${formatCurrency(investment.amount)} - ${formatDate(investment.date)}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">حالة الاستثمار</label>
                                <input type="text" class="form-control" value="${investment.status === 'active' ? 'نشط' : 'مغلق'}" readonly>
                            </div>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <label class="form-label">ملاحظات</label>
                        <textarea class="form-control" rows="3" readonly>${operation.notes || 'لا توجد ملاحظات'}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('viewOperationModal').remove()">إغلاق</button>
                ${operation.status === 'pending' ? `
                    <button class="btn btn-success" onclick="approveOperation('${operation.id}')">
                        <i class="fas fa-check"></i> موافقة
                    </button>
                    <button class="btn btn-danger" onclick="openDeleteConfirmationModal('${operation.id}', 'operation')">
                        <i class="fas fa-times"></i> رفض
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Edit investor
function editInvestor(id) {
    currentInvestorId = id;
    
    // Find investor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Close view modal if open
    const viewModal = document.getElementById('viewInvestorModal');
    if (viewModal) {
        closeModal('viewInvestorModal');
    }
    
    // Create edit investor modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'editInvestorModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">تعديل بيانات المستثمر</h2>
                <div class="modal-close" onclick="document.getElementById('editInvestorModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <form id="editInvestorForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">الاسم الكامل</label>
                            <input type="text" class="form-control" id="editInvestorName" value="${investor.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">رقم الهاتف</label>
                            <input type="text" class="form-control" id="editInvestorPhone" value="${investor.phone}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="editInvestorEmail" value="${investor.email || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">تاريخ الميلاد</label>
                            <input type="date" class="form-control" id="editInvestorBirthdate" value="${investor.birthdate || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">العنوان</label>
                            <input type="text" class="form-control" id="editInvestorAddress" value="${investor.address || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">المدينة</label>
                            <input type="text" class="form-control" id="editInvestorCity" value="${investor.city || ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">رقم البطاقة الشخصية</label>
                            <input type="text" class="form-control" id="editInvestorIdCard" value="${investor.idCard || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تاريخ إصدار البطاقة</label>
                            <input type="date" class="form-control" id="editInvestorIdCardDate" value="${investor.idCardDate || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">المهنة</label>
                            <input type="text" class="form-control" id="editInvestorOccupation" value="${investor.occupation || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ملاحظات</label>
                            <textarea class="form-control" id="editInvestorNotes" rows="3">${investor.notes || ''}</textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('editInvestorModal').remove()">إلغاء</button>
                <button class="btn btn-primary" onclick="updateInvestor()">حفظ التغييرات</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Update investor
function updateInvestor() {
    // Find investor
    const investor = investors.find(inv => inv.id === currentInvestorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Get form values
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
    
    // Validate required fields
    if (!name || !phone || !address || !city || !idCard) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Validate phone
    if (!validatePhone(phone)) {
        createNotification('خطأ', 'رقم الهاتف غير صالح', 'danger');
        return;
    }
    
    // Validate email if provided
    if (email && !validateEmail(email)) {
        createNotification('خطأ', 'البريد الإلكتروني غير صالح', 'danger');
        return;
    }
    
    // Update investor
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
    
    // Save data
    saveData();
    
    // Create update activity
    createInvestorActivity(investor.id, 'update', 'تم تحديث بيانات المستثمر');
    
    // Close modal
    document.getElementById('editInvestorModal').remove();
    
    // Refresh investors table
    loadInvestors();
    
    // Show success notification
    createNotification('نجاح', 'تم تحديث بيانات المستثمر بنجاح', 'success');
}

// Delete investor
function deleteInvestor(id) {
    // Find investor
    const investor = investors.find(inv => inv.id === id);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Check if investor has active investments
    const hasActiveInvestments = investments.some(
        inv => inv.investorId === id && inv.status === 'active'
    );
    
    if (hasActiveInvestments) {
        createNotification('خطأ', 'لا يمكن حذف المستثمر لأن لديه استثمارات نشطة', 'danger');
        return;
    }
    
    // Remove investor
    investors = investors.filter(inv => inv.id !== id);
    
    // Remove investor investments
    investments = investments.filter(inv => inv.investorId !== id);
    
    // Remove investor operations
    operations = operations.filter(op => op.investorId !== id);
    
    // Remove investor events
    events = events.filter(event => event.investorId !== id);
    
    // Save data
    saveData();
    
    // Create delete activity
    createActivity('investor', 'delete', `تم حذف المستثمر ${investor.name}`);
    
    // Refresh investors table
    loadInvestors();
    
    // Show success notification
    createNotification('نجاح', `تم حذف المستثمر ${investor.name} بنجاح`, 'success');
}

// Delete investment
function deleteInvestment(id) {
    // Find investment
    const investment = investments.find(inv => inv.id === id);
    
    if (!investment) {
        createNotification('خطأ', 'الاستثمار غير موجود', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investment.investorId);
    
    // Remove investment
    investments = investments.filter(inv => inv.id !== id);
    
    // Remove related operations
    operations = operations.filter(op => op.investmentId !== id);
    
    // Save data
    saveData();
    
    // Create delete activity
    const activityMessage = investor ? 
        `تم حذف استثمار للمستثمر ${investor.name} بمبلغ ${formatCurrency(investment.amount)}` :
        `تم حذف استثمار بمبلغ ${formatCurrency(investment.amount)}`;
    
    createActivity('investment', 'delete', activityMessage);
    
    // Refresh investments table
    loadInvestments();
    
    // Show success notification
    createNotification('نجاح', 'تم حذف الاستثمار بنجاح', 'success');
}

// Delete operation
function deleteOperation(id) {
    // Find operation
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('خطأ', 'العملية غير موجودة', 'danger');
        return;
    }
    
    // Remove operation
    operations = operations.filter(op => op.id !== id);
    
    // Save data
    saveData();
    
    // Create delete activity
    createActivity('operation', 'delete', `تم حذف العملية ${operation.id}`);
    
    // Close operation modal if open
    const operationModal = document.getElementById('viewOperationModal');
    if (operationModal) {
        operationModal.remove();
    }
    
    // Refresh operations table
    loadOperations();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Show success notification
    createNotification('نجاح', 'تم حذف العملية بنجاح', 'success');
}

// Approve operation
function approveOperation(id) {
    // Find operation
    const operation = operations.find(op => op.id === id);
    
    if (!operation) {
        createNotification('خطأ', 'العملية غير موجودة', 'danger');
        return;
    }
    
    // Update operation status
    operation.status = 'active';
    operation.approvedAt = new Date().toISOString();
    
    // If withdrawal operation, update investment
    if (operation.type === 'withdrawal' && operation.investmentId) {
        const investment = investments.find(inv => inv.id === operation.investmentId);
        
        if (investment) {
            // Update investment amount or status
            if (operation.amount === investment.amount) {
                investment.status = 'closed';
                investment.closedDate = operation.date;
                
                // Create notification
                createNotification(
                    'تم إغلاق استثمار',
                    `تم إغلاق استثمار بمبلغ ${formatCurrency(investment.amount)}`,
                    'info',
                    investment.id,
                    'investment'
                );
            } else {
                investment.amount -= operation.amount;
                
                // Create notification
                createNotification(
                    'تم سحب مبلغ من استثمار',
                    `تم سحب مبلغ ${formatCurrency(operation.amount)} من استثمار`,
                    'info',
                    investment.id,
                    'investment'
                );
            }
        }
    }
    
    // Save data
    saveData();
    
    // Create approve activity
    createActivity('operation', 'approve', `تم الموافقة على العملية ${operation.id}`);
    
    // Close operation modal if open
    const operationModal = document.getElementById('viewOperationModal');
    if (operationModal) {
        operationModal.remove();
    }
    
    // Refresh operations table
    loadOperations();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Show success notification
    createNotification('نجاح', 'تمت الموافقة على العملية بنجاح', 'success');
}

// Upload document
function uploadDocument(investorId, type) {
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Create document modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'uploadDocumentModal';
    
    let title, icon;
    switch (type) {
        case 'idCard':
            title = 'تحميل صورة البطاقة الشخصية';
            icon = 'id-card';
            break;
        case 'contract':
            title = 'تحميل عقد الاستثمار';
            icon = 'file-contract';
            break;
        case 'other':
            title = 'تحميل مستندات إضافية';
            icon = 'file-alt';
            break;
        default:
            title = 'تحميل مستند';
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
                            ${title} للمستثمر ${investor.name}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">المستند</label>
                        <input type="file" class="form-control" id="documentFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">الوصف</label>
                        <textarea class="form-control" id="documentDescription" rows="3" placeholder="وصف اختياري للمستند"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('uploadDocumentModal').remove()">إلغاء</button>
                <button class="btn btn-primary" onclick="saveDocument('${investorId}', '${type}')">
                    <i class="fas fa-upload"></i> تحميل المستند
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save document
function saveDocument(investorId, type) {
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Get form values
    const fileInput = document.getElementById('documentFile');
    const description = document.getElementById('documentDescription').value;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        createNotification('خطأ', 'يرجى اختيار ملف', 'danger');
        return;
    }
    
    const file = fileInput.files[0];
    
    // In a real app, we would upload the file to a server or Firebase storage
    // For now, we'll just simulate a successful upload
    
    // Update investor with document info
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
    
    // Save data
    saveData();
    
    // Create activity
    createInvestorActivity(investor.id, 'document', `تم تحميل مستند ${file.name}`);
    
    // Close modal
    document.getElementById('uploadDocumentModal').remove();
    
    // Refresh investor documents tab if open
    if (document.getElementById('investorDocuments')) {
        viewInvestor(investorId);
        // Switch to documents tab
        setTimeout(() => {
            switchModalTab('investorDocuments', 'viewInvestorModal');
        }, 100);
    }
    
    // Show success notification
    createNotification('نجاح', 'تم تحميل المستند بنجاح', 'success');
}

// ============ CRUD Operations ============

// Save investor
function saveInvestor() {
    // Get form values
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
    
    // Validate required fields
    if (!name || !phone || !address || !city || !idCard) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Validate phone
    if (!validatePhone(phone)) {
        createNotification('خطأ', 'رقم الهاتف غير صالح', 'danger');
        return;
    }
    
    // Validate email if provided
    if (email && !validateEmail(email)) {
        createNotification('خطأ', 'البريد الإلكتروني غير صالح', 'danger');
        return;
    }
    
    // Create new investor
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
    
    // Add investor to array
    investors.push(newInvestor);
    
    // Create activity
    createActivity('investor', 'create', `تم إضافة مستثمر جديد: ${name}`);
    
    // Check if there's an initial investment
    const initialAmount = document.getElementById('initialInvestmentAmount').value;
    const initialDate = document.getElementById('initialInvestmentDate').value;
    
    if (initialAmount && initialDate) {
        const amount = parseFloat(initialAmount);
        
        // Validate minimum investment
        if (amount < settings.minInvestment) {
            createNotification('خطأ', `الحد الأدنى للاستثمار هو ${formatNumber(settings.minInvestment)} ${settings.currency}`, 'danger');
            return;
        }
        
        const method = document.getElementById('initialInvestmentMethod').value;
        const reference = document.getElementById('initialInvestmentReference').value;
        const investmentNotes = document.getElementById('initialInvestmentNotes').value;
        
        // Create new investment
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
        
        // Add investment to array
        investments.push(newInvestment);
        
        // Create operation
        const newOperation = {
            id: generateOperationId(),
            investorId: newInvestor.id,
            type: 'investment',
            amount,
            date: new Date().toISOString(),
            investmentId: newInvestment.id,
            notes: 'استثمار جديد',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add operation to array
        operations.push(newOperation);
        
        // Create activity
        createInvestorActivity(newInvestor.id, 'investment', `تم إضافة استثمار جديد بمبلغ ${formatCurrency(amount)}`);
    }
    
    // Save data
    saveData();
    
    // Close modal
    closeModal('addInvestorModal');
    
    // Refresh investors table
    loadInvestors();
    
    // Show success notification
    createNotification('نجاح', 'تم إضافة المستثمر بنجاح', 'success', newInvestor.id, 'investor');
}

// Save investment
function saveInvestment() {
    // Get form values
    const investorId = document.getElementById('investmentInvestor').value;
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const date = document.getElementById('investmentDate').value;
    const method = document.getElementById('investmentMethod').value;
    const reference = document.getElementById('investmentReference').value;
    const notes = document.getElementById('investmentNotes').value;
    
    // Validate required fields
    if (!investorId || !amount || !date) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Validate amount
    if (amount <= 0) {
        createNotification('خطأ', 'المبلغ يجب أن يكون أكبر من صفر', 'danger');
        return;
    }
    
    // Validate minimum investment
    if (amount < settings.minInvestment) {
        createNotification('خطأ', `الحد الأدنى للاستثمار هو ${formatNumber(settings.minInvestment)} ${settings.currency}`, 'danger');
        return;
    }
    
    // Create new investment
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
    
    // Add investment to array
    investments.push(newInvestment);
    
    // Create operation
    const newOperation = {
        id: generateOperationId(),
        investorId,
        type: 'investment',
        amount,
        date: new Date().toISOString(),
        investmentId: newInvestment.id,
        notes: notes || 'استثمار جديد',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add operation to array
    operations.push(newOperation);
    
    // Create activity
    createInvestorActivity(investorId, 'investment', `تم إضافة استثمار جديد بمبلغ ${formatCurrency(amount)}`);
    
    // Save data
    saveData();
    
    // Close modal
    closeModal('newInvestmentModal');
    
    // Refresh investments table
    loadInvestments();
    
    // Show success notification
    createNotification('نجاح', 'تم إضافة الاستثمار بنجاح', 'success', newInvestment.id, 'investment');
}

// Save withdrawal
function saveWithdrawal() {
    // Get form values
    const investmentId = document.getElementById('withdrawInvestment').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const date = document.getElementById('withdrawDate').value;
    const method = document.getElementById('withdrawMethod').value;
    const notes = document.getElementById('withdrawNotes').value;
    
    // Validate required fields
    if (!investmentId || !amount || !date) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Find investment
    const investment = investments.find(inv => inv.id === investmentId);
    
    if (!investment) {
        createNotification('خطأ', 'الاستثمار غير موجود', 'danger');
        return;
    }
    
    // Validate amount
    if (amount <= 0 || amount > investment.amount) {
        createNotification('خطأ', 'المبلغ غير صحيح', 'danger');
        return;
    }
    
    // Check if partial withdrawal is allowed
    if (amount < investment.amount && (amount / investment.amount) * 100 > settings.maxPartialWithdrawal) {
        createNotification('خطأ', `الحد الأقصى للسحب الجزئي هو ${settings.maxPartialWithdrawal}% من المبلغ`, 'danger');
        return;
    }
    
    // Create operation
    const newOperation = {
        id: generateOperationId(),
        investorId: investment.investorId,
        type: 'withdrawal',
        amount,
        date: new Date().toISOString(),
        investmentId,
        notes: notes || 'سحب',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add operation to array
    operations.push(newOperation);
    
    // Create activity
    createInvestorActivity(investment.investorId, 'withdrawal', `تم تسجيل طلب سحب بمبلغ ${formatCurrency(amount)}`);
    
    // Save data
    saveData();
    
    // Close modal
    closeModal('withdrawModal');
    
    // Refresh operations table
    loadOperations();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Show success notification
    createNotification('نجاح', 'تم تسجيل طلب السحب بنجاح', 'success', newOperation.id, 'operation');
}

// Save pay profit
function savePayProfit() {
    // Get form values
    const investorId = document.getElementById('profitInvestor').value;
    const amount = parseFloat(document.getElementById('profitAmount').value);
    const date = document.getElementById('profitDate').value;
    const method = document.getElementById('profitMethod').value;
    const notes = document.getElementById('profitNotes').value;
    const period = document.getElementById('profitPeriod').value;
    
    // Get custom period dates if selected
    let fromDate, toDate;
    if (period === 'custom') {
        fromDate = document.getElementById('profitFromDate').value;
        toDate = document.getElementById('profitToDate').value;
        
        if (!fromDate || !toDate) {
            createNotification('خطأ', 'يرجى تحديد الفترة الزمنية', 'danger');
            return;
        }
    }
    
    // Validate required fields
    if (!investorId || !amount || !date) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Validate amount
    if (amount <= 0) {
        createNotification('خطأ', 'المبلغ غير صحيح', 'danger');
        return;
    }
    
    // Create operation
    const newOperation = {
        id: generateOperationId(),
        investorId,
        type: 'profit',
        amount,
        date: new Date().toISOString(),
        method,
        notes: notes || 'دفع أرباح',
        status: 'active',
        period,
        fromDate,
        toDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add operation to array
    operations.push(newOperation);
    
    // Create activity
    createInvestorActivity(investorId, 'profit', `تم دفع أرباح بمبلغ ${formatCurrency(amount)}`);
    
    // Save data
    saveData();
    
    // Close modal
    closeModal('payProfitModal');
    
    // Refresh operations table
    loadOperations();
    
    // Show success notification
    createNotification('نجاح', 'تم تسجيل دفع الأرباح بنجاح', 'success', newOperation.id, 'operation');
}

// Create activity
function createActivity(entityType, action, description) {
    const activity = {
        id: generateId(),
        entityType,
        action,
        description,
        date: new Date().toISOString(),
        userId: 'admin' // In a real app, this would be the current user's ID
    };
    
    // In a real app, we would save this to a database or Firebase
    console.log('Activity:', activity);
    
    return activity;
}

// Create investor activity
function createInvestorActivity(investorId, action, description) {
    const activity = createActivity('investor', action, description);
    activity.investorId = investorId;
    return activity;
}

// ============ Data Loading Functions ============

// Load data from localStorage
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
        
        // Update notification badge
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading data:', error);
        createNotification('خطأ', 'حدث خطأ أثناء تحميل البيانات', 'danger');
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('investors', JSON.stringify(investors));
        localStorage.setItem('investments', JSON.stringify(investments));
        localStorage.setItem('operations', JSON.stringify(operations));
        localStorage.setItem('settings', JSON.stringify(settings));
        localStorage.setItem('events', JSON.stringify(events));
        
        // If sync is active, sync with Firebase
        if (syncActive) {
            syncData();
        }
    } catch (error) {
        console.error('Error saving data:', error);
        createNotification('خطأ', 'حدث خطأ أثناء حفظ البيانات', 'danger');
    }
}

// Save notifications
function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

// Save reports
function saveReports() {
    try {
        localStorage.setItem('reports', JSON.stringify(reports));
    } catch (error) {
        console.error('Error saving reports:', error);
    }
}

// Save backup list
function saveBackupList() {
    try {
        localStorage.setItem('backupList', JSON.stringify(backupList));
    } catch (error) {
        console.error('Error saving backup list:', error);
    }
}

// Update dashboard
function updateDashboard() {
    // Calculate total investors
    document.getElementById('totalInvestors').textContent = investors.length;
    
    // Calculate total investments
    const totalInvestmentAmount = investments
        .filter(inv => inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    document.getElementById('totalInvestments').textContent = formatCurrency(totalInvestmentAmount);
    
    // Calculate total profits
    const today = new Date();
    let totalProfits = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfits += profit;
        });
    
    document.getElementById('totalProfits').textContent = formatCurrency(totalProfits.toFixed(2));
    
    // Calculate total transactions
    document.getElementById('totalTransactions').textContent = operations.length;
    
    // Calculate changes from last month
    calculateChanges();
    
    // Load recent transactions
    loadRecentTransactions();
    
    // Load recent investors
    loadRecentInvestors();
    
    // Load investment chart
    loadInvestmentChart();
}

// Calculate changes from last month
function calculateChanges() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = today.getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Calculate investors change
    const currentMonthInvestors = investors.filter(inv => {
        const joinDate = new Date(inv.joinDate);
        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
    }).length;
    
    const lastMonthInvestors = investors.filter(inv => {
        const joinDate = new Date(inv.joinDate);
        return joinDate.getMonth() === lastMonth && joinDate.getFullYear() === lastMonthYear;
    }).length;
    
    const investorsChange = lastMonthInvestors === 0 ? 100 : ((currentMonthInvestors - lastMonthInvestors) / lastMonthInvestors) * 100;
    
    // Update investors change
    const investorsChangeElement = document.getElementById('investorsChangeText');
    const investorsChangeIcon = investorsChangeElement.previousElementSibling;
    
    if (investorsChange > 0) {
        investorsChangeElement.textContent = `${investorsChange.toFixed(0)}% منذ الشهر الماضي`;
        investorsChangeIcon.className = 'fas fa-arrow-up';
        investorsChangeElement.parentElement.className = 'card-change up';
    } else if (investorsChange < 0) {
        investorsChangeElement.textContent = `${Math.abs(investorsChange).toFixed(0)}% منذ الشهر الماضي`;
        investorsChangeIcon.className = 'fas fa-arrow-down';
        investorsChangeElement.parentElement.className = 'card-change down';
    } else {
        investorsChangeElement.textContent = `0% منذ الشهر الماضي`;
        investorsChangeIcon.className = 'fas fa-minus';
        investorsChangeElement.parentElement.className = 'card-change';
    }
    
    // Calculate investments change
    const currentMonthInvestments = investments.filter(inv => {
        const investDate = new Date(inv.date);
        return investDate.getMonth() === currentMonth && investDate.getFullYear() === currentYear;
    }).reduce((total, inv) => total + inv.amount, 0);
    
    const lastMonthInvestments = investments.filter(inv => {
        const investDate = new Date(inv.date);
        return investDate.getMonth() === lastMonth && investDate.getFullYear() === lastMonthYear;
    }).reduce((total, inv) => total + inv.amount, 0);
    
    const investmentsChange = lastMonthInvestments === 0 ? 100 : ((currentMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100;
    
    // Update investments change
    const investmentsChangeElement = document.getElementById('investmentsChangeText');
    const investmentsChangeIcon = investmentsChangeElement.previousElementSibling;
    
    if (investmentsChange > 0) {
        investmentsChangeElement.textContent = `${investmentsChange.toFixed(0)}% منذ الشهر الماضي`;
        investmentsChangeIcon.className = 'fas fa-arrow-up';
        investmentsChangeElement.parentElement.className = 'card-change up';
    } else if (investmentsChange < 0) {
        investmentsChangeElement.textContent = `${Math.abs(investmentsChange).toFixed(0)}% منذ الشهر الماضي`;
        investmentsChangeIcon.className = 'fas fa-arrow-down';
        investmentsChangeElement.parentElement.className = 'card-change down';
    } else {
        investmentsChangeElement.textContent = `0% منذ الشهر الماضي`;
        investmentsChangeIcon.className = 'fas fa-minus';
        investmentsChangeElement.parentElement.className = 'card-change';
    }
    
    // Similar calculations for profits and transactions
    // For profits
    const profitsChangeElement = document.getElementById('profitsChangeText');
    const profitsChangeIcon = profitsChangeElement.previousElementSibling;
    profitsChangeElement.textContent = `12% منذ الشهر الماضي`;
    
    // For transactions
    const transactionsChangeElement = document.getElementById('transactionsChangeText');
    const transactionsChangeIcon = transactionsChangeElement.previousElementSibling;
    transactionsChangeElement.textContent = `5% منذ الشهر الماضي`;
}

// Load recent transactions
function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get recent operations (max 5)
    const recentOps = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recentOps.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">لا توجد معاملات حديثة</td>`;
        tbody.appendChild(row);
        return;
    }
    
    recentOps.forEach(op => {
        const investor = investors.find(inv => inv.id === op.investorId);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${investor ? investor.name : 'غير معروف'}</td>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Load recent investors
function loadRecentInvestors() {
    const tbody = document.getElementById('recentInvestorsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get recent investors (max 4)
    const recentInvestors = [...investors].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 4);
    
    if (recentInvestors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" style="text-align: center;">لا يوجد مستثمرين حديثين</td>`;
        tbody.appendChild(row);
        return;
    }
    
    recentInvestors.forEach(investor => {
        // Get latest investment for this investor
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

// Load investment chart
function loadInvestmentChart() {
    // Generate chart data
    const chartData = generateChartData(chartPeriod);
    
    // Load chart
    loadChart('investmentChart', chartData);
}

// Switch chart period
function switchChartPeriod(period) {
    chartPeriod = period;
    
    // Update button states
    document.getElementById('dailyChartBtn').className = period === 'daily' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    document.getElementById('monthlyChartBtn').className = period === 'monthly' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    document.getElementById('yearlyChartBtn').className = period === 'yearly' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-light';
    
    // Reload chart
    loadInvestmentChart();
}

// Load investors
function loadInvestors() {
    const tbody = document.getElementById('investorsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (investors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">لا يوجد مستثمرين</td>`;
        tbody.appendChild(row);
        return;
    }
    
    investors.forEach((investor, index) => {
        // Calculate total investment for this investor
        const totalInvestment = investments
            .filter(inv => inv.investorId === investor.id && inv.status === 'active')
            .reduce((total, inv) => total + inv.amount, 0);
        
        // Calculate total profit for this investor
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

// Load investments
function loadInvestments(status = 'active') {
    const tbody = document.getElementById('investmentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filter investments by status
    let filteredInvestments = investments;
    if (status === 'active') {
        filteredInvestments = investments.filter(inv => inv.status === 'active');
    } else if (status === 'closed') {
        filteredInvestments = investments.filter(inv => inv.status === 'closed');
    }
    
    if (filteredInvestments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align: center;">لا توجد استثمارات ${status === 'active' ? 'نشطة' : status === 'closed' ? 'مغلقة' : ''}</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Sort investments by date (newest first)
    filteredInvestments = [...filteredInvestments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredInvestments.forEach((investment, index) => {
        const investor = investors.find(inv => inv.id === investment.investorId);
        
        if (!investor) return;
        
        const monthlyProfit = calculateMonthlyProfit(investment.amount);
        
        // Calculate total profit
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
            <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'نشط' : 'مغلق'}</span></td>
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

// Load profits
function loadProfits() {
    const tbody = document.getElementById('profitsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Update profit cards
    updateProfitCards();
    
    // Group investments by investor
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
        
        // Calculate profit for this investment
        const today = new Date();
        const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
        investorProfits[investorId].totalProfit += profit;
    });
    
    // Calculate paid profit for each investor
    operations.filter(op => op.type === 'profit' && op.status === 'active').forEach(operation => {
        const investorId = operation.investorId;
        
        if (investorProfits[investorId]) {
            investorProfits[investorId].paidProfit += operation.amount;
        }
    });
    
    // Calculate due profit
    Object.keys(investorProfits).forEach(investorId => {
        investorProfits[investorId].dueProfit = Math.max(0, 
            investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
        );
    });
    
    // If no investors with active investments
    if (Object.keys(investorProfits).length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">لا توجد استثمارات نشطة</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Sort investors by total profit (highest first)
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
    
    // Load profit chart
    loadProfitChart();
}

// Update profit cards
function updateProfitCards() {
    // Calculate total profits
    const today = new Date();
    let totalProfits = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfits += profit;
        });
    
    // Calculate total paid profits
    const totalPaidProfits = operations
        .filter(op => op.type === 'profit' && op.status === 'active')
        .reduce((total, op) => total + op.amount, 0);
    
    // Calculate due profits
    const dueProfits = Math.max(0, totalProfits - totalPaidProfits);
    
    // Update cards
    document.getElementById('profitsTotal').textContent = formatCurrency(totalProfits.toFixed(2));
    document.getElementById('profitsPaid').textContent = formatCurrency(totalPaidProfits.toFixed(2));
    document.getElementById('profitsDue').textContent = formatCurrency(dueProfits.toFixed(2));
    document.getElementById('profitsMonthlyAverage').textContent = settings.monthlyProfitRate + '%';
}

// Load profits for tab
function loadProfitsForTab(tabId) {
    // Update profit cards (already done in loadProfits)
    
    // Load appropriate content based on tab
    switch (tabId) {
        case 'summary':
            // Already loaded in loadProfits
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

// Load paid profits
function loadPaidProfits() {
    // This would be implemented to show a table of all paid profits
    console.log('Load paid profits');
}

// Load due profits
function loadDueProfits() {
    // This would be implemented to show a table of all due profits
    console.log('Load due profits');
}

// Load profit projections
function loadProfitProjections() {
    // This would be implemented to show profit projections
    console.log('Load profit projections');
}

// Load profit chart
function loadProfitChart() {
    // This would be implemented to show a chart of profits over time
    // For now, we'll use the same chart function with different data
    const chartData = generateChartData('monthly');
    
    // Create config with only profits dataset
    const config = {
        datasets: [
            {
                label: 'الأرباح',
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

// Switch profits analysis chart
function switchProfitsAnalysisChart(period) {
    // Update button states
    document.querySelectorAll('#profits .chart-actions button').forEach(btn => {
        btn.className = 'btn btn-sm btn-light';
    });
    
    document.querySelector(`#profits .chart-actions button[onclick="switchProfitsAnalysisChart('${period}')"]`).className = 'btn btn-sm btn-primary';
    
    // Generate chart data
    const chartData = generateChartData(period);
    
    // Create config with only profits dataset
    const config = {
        datasets: [
            {
                label: 'الأرباح',
                data: chartData.map(d => d.profits),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };
    
    // Load chart
    loadChart('profitsChart', chartData, config);
}

// Load operations
function loadOperations(type = 'all') {
    const tbody = document.getElementById('operationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Filter operations by type
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
        row.innerHTML = `<td colspan="9" style="text-align: center;">لا توجد عمليات ${
            type === 'investments' ? 'استثمار' : 
            type === 'withdrawals' ? 'سحب' : 
            type === 'profits' ? 'أرباح' : 
            type === 'pending' ? 'معلقة' : ''
        }</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // Sort operations by date (newest first)
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
            <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
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

// Load notifications
function loadNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-title">لا توجد إشعارات</div>
                    <div class="notification-text">لا توجد إشعارات حالياً.</div>
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

// Mark notification as read
function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    
    notification.read = true;
    
    // Save notifications
    saveNotifications();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Reload notifications
    loadNotifications();
}

// Delete notification
function deleteNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    
    // Save notifications
    saveNotifications();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Reload notifications
    loadNotifications();
}

// View notification entity
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

// Mark all notifications as read
function markAllAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    
    // Save notifications
    saveNotifications();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Reload notifications
    loadNotifications();
    
    // Show success notification
    createNotification('نجاح', 'تم تعيين جميع الإشعارات كمقروءة', 'success');
}

// Load calendar
function loadCalendar() {
    // Update current month display
    updateCalendarMonth();
    
    // Generate calendar grid
    generateCalendarGrid();
    
    // Load upcoming events
    loadUpcomingEvents();
}

// Update calendar month display
function updateCalendarMonth() {
    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const monthElement = document.getElementById('currentMonth');
    if (!monthElement) return;
    
    monthElement.textContent = `${monthNames[calendarCurrentMonth.getMonth()]} ${calendarCurrentMonth.getFullYear()}`;
}

// Generate calendar grid
function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    // Get first day of month
    const firstDay = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth(), 1);
    
    // Get last day of month
    const lastDay = new Date(calendarCurrentMonth.getFullYear(), calendarCurrentMonth.getMonth() + 1, 0);
    
    // Get first day of grid (previous month days)
    const firstDayOfGrid = new Date(firstDay);
    firstDayOfGrid.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Create grid cells
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
        
        // Get events for this day
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

// Get event type color
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

// Navigate to previous month
function prevMonth() {
    calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() - 1);
    loadCalendar();
}

// Navigate to next month
function nextMonth() {
    calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() + 1);
    loadCalendar();
}

// Load upcoming events
function loadUpcomingEvents() {
    const tbody = document.getElementById('upcomingEventsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get upcoming events (next 30 days)
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
        row.innerHTML = `<td colspan="6" style="text-align: center;">لا توجد أحداث قادمة</td>`;
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

// Add event
function addEvent() {
    // Reset form
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.reset();
    
    // Set default date to today
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) eventDateInput.valueAsDate = new Date();
    
    // Set default time to current time (rounded to nearest hour)
    const now = new Date();
    now.setMinutes(0, 0, 0);
    
    const eventTimeInput = document.getElementById('eventTime');
    if (eventTimeInput) eventTimeInput.value = now.toTimeString().substr(0, 5);
    
    // Set title
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'إضافة حدث جديد';
    
    // Hide delete button
    const deleteEventButton = document.getElementById('deleteEventButton');
    if (deleteEventButton) deleteEventButton.style.display = 'none';
    
    // Show save button
    const saveEventButton = document.getElementById('saveEventButton');
    if (saveEventButton) saveEventButton.style.display = 'inline-block';
    
    // Clear event ID
    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput) eventIdInput.value = '';
    
    // Populate investor select
    populateInvestorSelect('eventInvestor');
    
    // Open modal
    openModal('eventModal');
}

// Add event for specific date
function addEventForDate(dateString) {
    // Call add event
    addEvent();
    
    // Set the date
    const eventDate = document.getElementById('eventDate');
    if (eventDate) eventDate.value = dateString.substring(0, 10);
}

// Save event
function saveEvent() {
    // Get form values
    const title = document.getElementById('eventTitle').value;
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const investorId = document.getElementById('eventInvestor').value || null;
    const duration = document.getElementById('eventDuration').value;
    const reminder = document.getElementById('eventReminder').value;
    const notes = document.getElementById('eventNotes').value;
    const eventId = document.getElementById('eventId').value;
    
    // Validate required fields
    if (!title || !date || !time) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Check if editing existing event
    if (eventId) {
        // Find event
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex !== -1) {
            // Update event
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
            
            // Show success notification
            createNotification('نجاح', 'تم تحديث الحدث بنجاح', 'success');
        } else {
            createNotification('خطأ', 'الحدث غير موجود', 'danger');
            return;
        }
    } else {
        // Create new event
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
        
        // Add event to array
        events.push(newEvent);
        
        // Show success notification
        createNotification('نجاح', 'تم إضافة الحدث بنجاح', 'success');
    }
    
    // Save data
    localStorage.setItem('events', JSON.stringify(events));
    
    // Close modal
    closeModal('eventModal');
    
    // Reload calendar
    loadCalendar();
}

// View event
function viewEvent(id) {
    // Find event
    const event = events.find(e => e.id === id);
    
    if (!event) {
        createNotification('خطأ', 'الحدث غير موجود', 'danger');
        return;
    }
    
    // Reset form
    const eventForm = document.getElementById('eventForm');
    if (eventForm) eventForm.reset();
    
    // Fill form with event data
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventDuration').value = event.duration;
    document.getElementById('eventReminder').value = event.reminder;
    document.getElementById('eventNotes').value = event.notes || '';
    document.getElementById('eventId').value = event.id;
    
    // Populate investor select and select investor if applicable
    populateInvestorSelect('eventInvestor');
    if (event.investorId) {
        document.getElementById('eventInvestor').value = event.investorId;
    }
    
    // Set title
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'تفاصيل الحدث';
    
    // Show delete button
    const deleteEventButton = document.getElementById('deleteEventButton');
    if (deleteEventButton) deleteEventButton.style.display = 'inline-block';
    
    // Show save button
    const saveEventButton = document.getElementById('saveEventButton');
    if (saveEventButton) saveEventButton.style.display = 'inline-block';
    
    // Open modal
    openModal('eventModal');
}

// Edit event
function editEvent(id) {
    // View event will fill the form
    viewEvent(id);
    
    // Set title
    const eventModalTitle = document.getElementById('eventModalTitle');
    if (eventModalTitle) eventModalTitle.textContent = 'تعديل الحدث';
}

// Delete event
function deleteEvent() {
    const eventId = document.getElementById('eventId').value;
    
    if (!eventId) {
        createNotification('خطأ', 'الحدث غير موجود', 'danger');
        return;
    }
    
    // Find event
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
        createNotification('خطأ', 'الحدث غير موجود', 'danger');
        return;
    }
    
    // Remove event
    events.splice(eventIndex, 1);
    
    // Save data
    localStorage.setItem('events', JSON.stringify(events));
    
    // Close modal
    closeModal('eventModal');
    
    // Reload calendar
    loadCalendar();
    
    // Show success notification
    createNotification('نجاح', 'تم حذف الحدث بنجاح', 'success');
}

// Load settings
function loadSettings() {
    // Load general settings
    document.getElementById('companyName').value = settings.companyName || 'شركة الاستثمار العراقية';
    document.getElementById('companyAddress').value = settings.companyAddress || 'الحلة، بابل، العراق';
    document.getElementById('companyPhone').value = settings.companyPhone || '07701234567';
    document.getElementById('companyEmail').value = settings.companyEmail || 'info@iraqinvest.com';
    document.getElementById('companyWebsite').value = settings.companyWebsite || 'www.iraqinvest.com';
    document.getElementById('language').value = settings.language || 'ar';
    document.getElementById('timezone').value = settings.timezone || 'Asia/Baghdad';
    
    // Load investment settings
    document.getElementById('monthlyProfitRate').value = settings.monthlyProfitRate || 1.75;
    document.getElementById('minInvestment').value = settings.minInvestment || 1000000;
    document.getElementById('profitDistributionPeriod').value = settings.profitDistributionPeriod || 'monthly';
    document.getElementById('profitDistributionDay').value = settings.profitDistributionDay || 1;
    document.getElementById('earlyWithdrawalFee').value = settings.earlyWithdrawalFee || 0.5;
    document.getElementById('maxPartialWithdrawal').value = settings.maxPartialWithdrawal || 50;
    document.getElementById('currency').value = settings.currency || 'IQD';
    
    // Load currency checkboxes
    const acceptIQD = document.getElementById('acceptIQD');
    const acceptUSD = document.getElementById('acceptUSD');
    
    if (acceptIQD) acceptIQD.checked = settings.acceptedCurrencies?.includes('IQD') ?? true;
    if (acceptUSD) acceptUSD.checked = settings.acceptedCurrencies?.includes('USD') ?? true;
    
    // Load notification settings
    if (settings.notificationSettings) {
        const ns = settings.notificationSettings;
        
        // System notifications
        document.getElementById('systemNotifications').checked = ns.systemNotifications ?? true;
        document.getElementById('loginNotifications').checked = ns.loginNotifications ?? true;
        document.getElementById('backupNotifications').checked = ns.backupNotifications ?? true;
        
        // Investment notifications
        document.getElementById('newInvestorNotifications').checked = ns.newInvestorNotifications ?? true;
        document.getElementById('newInvestmentNotifications').checked = ns.newInvestmentNotifications ?? true;
        document.getElementById('withdrawalNotifications').checked = ns.withdrawalNotifications ?? true;
        document.getElementById('profitDistributionNotifications').checked = ns.profitDistributionNotifications ?? true;
        
        // Notification methods
        document.getElementById('emailNotifications').checked = ns.emailNotifications ?? true;
        document.getElementById('smsNotifications').checked = ns.smsNotifications ?? false;
        document.getElementById('pushNotifications').checked = ns.pushNotifications ?? true;
        
        // Notification timing
        document.getElementById('notificationStartTime').value = ns.startTime ?? '09:00';
        document.getElementById('notificationEndTime').value = ns.endTime ?? '18:00';
    }
    
    // Load previous backups
    loadPreviousBackups();
}

// Load previous backups
function loadPreviousBackups() {
    const backupsSelect = document.getElementById('previousBackups');
    if (!backupsSelect) return;
    
    backupsSelect.innerHTML = '';
    
    if (backupList.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'لا توجد نسخ احتياطية سابقة';
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

// Save general settings
function saveGeneralSettings(event) {
    event.preventDefault();
    
    // Get form values
    const companyName = document.getElementById('companyName').value;
    const companyAddress = document.getElementById('companyAddress').value;
    const companyPhone = document.getElementById('companyPhone').value;
    const companyEmail = document.getElementById('companyEmail').value;
    const companyWebsite = document.getElementById('companyWebsite').value;
    const language = document.getElementById('language').value;
    const timezone = document.getElementById('timezone').value;
    
    // Validate required fields
    if (!companyName || !companyAddress || !companyPhone) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Validate email
    if (companyEmail && !validateEmail(companyEmail)) {
        createNotification('خطأ', 'البريد الإلكتروني غير صالح', 'danger');
        return;
    }
    
    // Update settings
    settings.companyName = companyName;
    settings.companyAddress = companyAddress;
    settings.companyPhone = companyPhone;
    settings.companyEmail = companyEmail;
    settings.companyWebsite = companyWebsite;
    settings.language = language;
    settings.timezone = timezone;
    
    // Save settings
    saveData();
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ الإعدادات العامة بنجاح', 'success');
}

// Save investment settings
function saveInvestmentSettings(event) {
    event.preventDefault();
    
    // Get form values
    const monthlyProfitRate = parseFloat(document.getElementById('monthlyProfitRate').value);
    const minInvestment = parseFloat(document.getElementById('minInvestment').value);
    const profitDistributionPeriod = document.getElementById('profitDistributionPeriod').value;
    const profitDistributionDay = parseInt(document.getElementById('profitDistributionDay').value);
    const earlyWithdrawalFee = parseFloat(document.getElementById('earlyWithdrawalFee').value);
    const maxPartialWithdrawal = parseFloat(document.getElementById('maxPartialWithdrawal').value);
    const currency = document.getElementById('currency').value;
    
    // Get accepted currencies
    const acceptIQD = document.getElementById('acceptIQD').checked;
    const acceptUSD = document.getElementById('acceptUSD').checked;
    
    const acceptedCurrencies = [];
    if (acceptIQD) acceptedCurrencies.push('IQD');
    if (acceptUSD) acceptedCurrencies.push('USD');
    
    // Validate required fields
    if (isNaN(monthlyProfitRate) || isNaN(minInvestment) || isNaN(profitDistributionDay) || 
        isNaN(earlyWithdrawalFee) || isNaN(maxPartialWithdrawal)) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'danger');
        return;
    }
    
    // Validate values
    if (monthlyProfitRate <= 0) {
        createNotification('خطأ', 'نسبة الربح الشهرية يجب أن تكون أكبر من صفر', 'danger');
        return;
    }
    
    if (minInvestment <= 0) {
        createNotification('خطأ', 'الحد الأدنى للاستثمار يجب أن يكون أكبر من صفر', 'danger');
        return;
    }
    
    if (profitDistributionDay < 1 || profitDistributionDay > 31) {
        createNotification('خطأ', 'يوم توزيع الأرباح يجب أن يكون بين 1 و 31', 'danger');
        return;
    }
    
    if (earlyWithdrawalFee < 0 || earlyWithdrawalFee > 100) {
        createNotification('خطأ', 'رسوم السحب المبكر يجب أن تكون بين 0 و 100', 'danger');
        return;
    }
    
    if (maxPartialWithdrawal <= 0 || maxPartialWithdrawal > 100) {
        createNotification('خطأ', 'الحد الأقصى للسحب الجزئي يجب أن يكون بين 0 و 100', 'danger');
        return;
    }
    
    if (acceptedCurrencies.length === 0) {
        createNotification('خطأ', 'يجب اختيار عملة واحدة على الأقل', 'danger');
        return;
    }
    
    // Update settings
    settings.monthlyProfitRate = monthlyProfitRate;
    settings.minInvestment = minInvestment;
    settings.profitDistributionPeriod = profitDistributionPeriod;
    settings.profitDistributionDay = profitDistributionDay;
    settings.earlyWithdrawalFee = earlyWithdrawalFee;
    settings.maxPartialWithdrawal = maxPartialWithdrawal;
    settings.currency = currency;
    settings.acceptedCurrencies = acceptedCurrencies;
    
    // Save settings
    saveData();
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ إعدادات الاستثمار بنجاح', 'success');
}

// Save profile settings
function saveProfileSettings(event) {
    event.preventDefault();
    
    // Get form values
    const userFullName = document.getElementById('userFullName').value;
    const userEmail = document.getElementById('userEmail').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate required fields
    if (!userFullName || !userEmail) {
        createNotification('خطأ', 'يرجى ملء الاسم والبريد الإلكتروني', 'danger');
        return;
    }
    
    // Validate email
    if (!validateEmail(userEmail)) {
        createNotification('خطأ', 'البريد الإلكتروني غير صالح', 'danger');
        return;
    }
    
    // Check if changing password
    if (newPassword) {
        // Validate current password
        if (!currentPassword) {
            createNotification('خطأ', 'يرجى إدخال كلمة المرور الحالية', 'danger');
            return;
        }
        
        // Validate new password
        if (newPassword.length < 6) {
            createNotification('خطأ', 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف', 'danger');
            return;
        }
        
        // Validate password confirmation
        if (newPassword !== confirmPassword) {
            createNotification('خطأ', 'كلمة المرور الجديدة وتأكيدها غير متطابقين', 'danger');
            return;
        }
        
        // In a real app, we would verify the current password against the stored hash
        // and update the password in the database
        createNotification('نجاح', 'تم تغيير كلمة المرور بنجاح', 'success');
    }
    
    // Save user info
    // In a real app, we would update the user info in the database
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ إعدادات الملف الشخصي بنجاح', 'success');
}

// Save notification settings
function saveNotificationSettings(event) {
    event.preventDefault();
    
    // Get form values
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
    
    // Update settings
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
    
    // Save settings
    saveData();
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ إعدادات الإشعارات بنجاح', 'success');
}

// Save system settings
function saveSystemSettings(event) {
    event.preventDefault();
    
    // Get form values
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
    
    // Update settings
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
    
    // Apply settings
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
    
    // Save settings
    saveData();
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ إعدادات النظام بنجاح', 'success');
}

// ============ Firebase Integration ============

// Toggle sync
function toggleSync(enabled) {
    if (enabled) {
        document.getElementById('connectionInfo').style.display = 'block';
        
        // Check if user is logged in
        if (window.currentUser) {
            document.getElementById('signOutButton').style.display = 'block';
            enableSync();
        } else {
            // Disable sync if user is not logged in
            document.getElementById('syncEnabled').checked = false;
        }
    } else {
        document.getElementById('connectionInfo').style.display = 'none';
        disableSync();
    }
}

// Enable sync
function enableSync() {
    syncActive = true;
    localStorage.setItem('syncEnabled', 'true');
    
    // Update sync status
    updateSyncStatus('متصل', 'success');
    
    // Show last sync time
    const lastSyncTimeElement = document.getElementById('lastSyncTime');
    if (lastSyncTimeElement) {
        lastSyncTimeElement.style.display = 'inline-block';
        if (lastSyncTime) {
            lastSyncTimeElement.textContent = `آخر مزامنة: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
        } else {
            lastSyncTimeElement.textContent = 'لم تتم المزامنة بعد';
        }
    }
    
    // Initial sync
    syncData();
    
    // Start sync interval
    startSyncInterval();
}

// Disable sync
function disableSync() {
    syncActive = false;
    localStorage.setItem('syncEnabled', 'false');
    
    // Update sync status
    updateSyncStatus('غير متصل', 'info');
    
    // Hide last sync time
    const lastSyncTimeElement = document.getElementById('lastSyncTime');
    if (lastSyncTimeElement) {
        lastSyncTimeElement.style.display = 'none';
    }
    
    // Stop sync interval
    stopSyncInterval();
}

// Update sync status
function updateSyncStatus(status, type) {
    const syncStatusElement = document.getElementById('syncStatus');
    if (syncStatusElement) {
        syncStatusElement.textContent = status;
        syncStatusElement.style.display = 'inline-block';
        syncStatusElement.className = `status ${type}`;
    }
    
    // Update sync icon
    const syncIcon = document.getElementById('syncIcon');
    if (syncIcon) {
        syncIcon.className = `sync-btn ${type}`;
    }
    
    // Update status in sync dialog
    const syncStatusAlert = document.getElementById('syncStatusAlert');
    const syncStatusText = document.getElementById('syncStatusText');
    if (syncStatusAlert && syncStatusText) {
        syncStatusAlert.className = `alert alert-${type}`;
        syncStatusText.textContent = type === 'success' ? 'المزامنة نشطة ومتصلة.' : 'المزامنة متوقفة حالياً.';
    }
    
    // Update sync buttons
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

// Start sync interval
function startSyncInterval() {
    // Sync every 5 minutes
    window.syncInterval = setInterval(syncData, 5 * 60 * 1000);
}

// Stop sync interval
function stopSyncInterval() {
    clearInterval(window.syncInterval);
}

// Sync data
function syncData() {
    // In a real app, we would sync data with Firebase
    console.log('Syncing data with Firebase...');
    
    // Update last sync time
    lastSyncTime = new Date().toISOString();
    localStorage.setItem('lastSyncTime', lastSyncTime);
    
    // Update last sync time display
    const lastSyncTimeElement = document.getElementById('lastSyncTime');
    if (lastSyncTimeElement) {
        lastSyncTimeElement.textContent = `آخر مزامنة: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
    }
}

// Login to Firebase
function loginToFirebase(event) {
    event.preventDefault();
    
    // Get form values
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // In a real app, we would authenticate with Firebase
    // For now, we'll simulate a successful login
    
    // Simulate current user
    window.currentUser = {
        email,
        displayName: email.split('@')[0]
    };
    
    // Show logged in user
    const loggedInUser = document.getElementById('loggedInUser');
    if (loggedInUser) {
        loggedInUser.textContent = window.currentUser.email;
    }
    
    // Hide login form and show sync options
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('syncOptions').style.display = 'block';
    
    // Show sign out button
    document.getElementById('signOutButton').style.display = 'inline-block';
    
    // Show success notification
    createNotification('نجاح', 'تم تسجيل الدخول بنجاح', 'success');
}

// Start sync
function startSync() {
    // Enable sync
    enableSync();
    
    // Show success notification
    createNotification('نجاح', 'تم تفعيل المزامنة بنجاح', 'success');
}

// Stop sync
function stopSync() {
    // Disable sync
    disableSync();
    
    // Show info notification
    createNotification('معلومات', 'تم إيقاف المزامنة', 'info');
}

// Show sync dialog
function showSyncDialog() {
    // Check if user is logged in
    if (window.currentUser) {
        // Show sync options
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('syncOptions').style.display = 'block';
        
        // Show logged in user
        const loggedInUser = document.getElementById('loggedInUser');
        if (loggedInUser) {
            loggedInUser.textContent = window.currentUser.email;
        }
    } else {
        // Show login form
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('syncOptions').style.display = 'none';
    }
    
    // Open dialog
    openModal('syncDialog');
}

// Close sync dialog
function closeSyncDialog() {
    closeModal('syncDialog');
}

// Update sync settings status
function updateSyncSettingsStatus() {
    // Check if sync is enabled
    const syncEnabled = localStorage.getItem('syncEnabled') === 'true';
    document.getElementById('syncEnabled').checked = syncEnabled;
    
    // Load auto backup settings
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    const autoBackupFrequency = localStorage.getItem('autoBackupFrequency') || 'weekly';
    const activityLoggingEnabled = localStorage.getItem('activityLoggingEnabled') !== 'false';
    
    document.getElementById('autoBackupEnabled').checked = autoBackupEnabled;
    document.getElementById('autoBackupFrequency').value = autoBackupFrequency;
    document.getElementById('activityLoggingEnabled').checked = activityLoggingEnabled;
    
    // Show/hide connection info
    document.getElementById('connectionInfo').style.display = syncEnabled ? 'block' : 'none';
    
    // Check if user is logged in
    if (window.currentUser) {
        document.getElementById('signOutButton').style.display = syncEnabled ? 'inline-block' : 'none';
        
        // Update connection info
        const connectionAlert = document.querySelector('#connectionInfo .alert');
        connectionAlert.className = 'alert alert-success';
        connectionAlert.querySelector('.alert-icon i').className = 'fas fa-check-circle';
        connectionAlert.querySelector('.alert-title').textContent = 'متصل';
        connectionAlert.querySelector('.alert-text').textContent = `البريد الإلكتروني: ${window.currentUser.email}`;
    }
}

// Create Firebase backup
function createFirebaseBackup() {
    // Create backup name
    const date = new Date();
    const backupName = prompt('أدخل اسم النسخة الاحتياطية (اختياري):', 
        `نسخة احتياطية ${date.toLocaleDateString('ar-IQ')} ${date.toLocaleTimeString('ar-IQ')}`);
    
    if (backupName === null) return;
    
    // Create backup
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
    
    // In a real app, we would save this to Firebase
    // For now, we'll add it to the backup list
    backupList.push(backup);
    
    // Save backup list
    saveBackupList();
    
    // Update backups list
    updateBackupsList();
    
    // Show success notification
    createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
}

// Update backups list
function updateBackupsList() {
    const backupsListElement = document.getElementById('backupsList');
    if (!backupsListElement) return;
    
    backupsListElement.innerHTML = '';
    
    if (backupList.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'لا توجد نسخ احتياطية';
        option.disabled = true;
        backupsListElement.appendChild(option);
        return;
    }
    
    // Sort backups by date (newest first)
    const sortedBackups = [...backupList].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedBackups.forEach(backup => {
        const option = document.createElement('option');
        option.value = backup.id;
        option.textContent = `${backup.name} - ${formatDate(backup.date)} ${formatTime(backup.date)}`;
        backupsListElement.appendChild(option);
    });
}

// Restore Firebase backup
function restoreFirebaseBackup() {
    const backupsListElement = document.getElementById('backupsList');
    if (!backupsListElement || !backupsListElement.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = backupsListElement.value;
    
    // Find backup
    const backup = backupList.find(b => b.id === backupId);
    
    if (!backup) {
        createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
        return;
    }
    
    // Confirm restoration
    if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backup.name}"؟ سيتم استبدال جميع البيانات الحالية.`)) {
        return;
    }
    
    // Restore data
    const data = backup.data;
    
    if (data.investors) investors = data.investors;
    if (data.investments) investments = data.investments;
    if (data.operations) operations = data.operations;
    if (data.settings) settings = {...settings, ...data.settings};
    if (data.events) events = data.events;
    if (data.notifications) notifications = data.notifications;
    
    // Save data
    saveData();
    saveNotifications();
    
    // Show success notification
    createNotification('نجاح', 'تم استعادة النسخة الاحتياطية بنجاح', 'success');
    
    // Reload page
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

// Delete Firebase backup
function deleteFirebaseBackup() {
    const backupsListElement = document.getElementById('backupsList');
    if (!backupsListElement || !backupsListElement.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = backupsListElement.value;
    
    // Find backup
    const backup = backupList.find(b => b.id === backupId);
    
    if (!backup) {
        createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
        return;
    }
    
    // Confirm deletion
    if (!confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${backup.name}"؟`)) {
        return;
    }
    
    // Remove backup from list
    backupList = backupList.filter(b => b.id !== backupId);
    
    // Save backup list
    saveBackupList();
    
    // Update backups list
    updateBackupsList();
    
    // Show success notification
    createNotification('نجاح', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
}

// Save sync settings
function saveSyncSettings() {
    // Get form values
    const syncEnabled = document.getElementById('syncEnabled').checked;
    const autoBackupEnabled = document.getElementById('autoBackupEnabled').checked;
    const autoBackupFrequency = document.getElementById('autoBackupFrequency').value;
    const activityLoggingEnabled = document.getElementById('activityLoggingEnabled').checked;
    
    // Save settings to localStorage
    localStorage.setItem('syncEnabled', syncEnabled.toString());
    localStorage.setItem('autoBackupEnabled', autoBackupEnabled.toString());
    localStorage.setItem('autoBackupFrequency', autoBackupFrequency);
    localStorage.setItem('activityLoggingEnabled', activityLoggingEnabled.toString());
    
    // Enable or disable sync
    if (syncEnabled) {
        if (window.currentUser) {
            enableSync();
        } else {
            document.getElementById('syncEnabled').checked = false;
            createNotification('خطأ', 'يرجى تسجيل الدخول لتفعيل المزامنة', 'danger');
            return;
        }
    } else {
        disableSync();
    }
    
    // Show success notification
    createNotification('نجاح', 'تم حفظ إعدادات المزامنة بنجاح', 'success');
}

// Create backup
function createBackup() {
    // Create backup data
    const backup = {
        id: generateId(),
        name: `نسخة احتياطية ${formatDate(new Date().toISOString())}`,
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
    
    // Download backup file
    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Add backup to list
    backupList.push(backup);
    
    // Save backup list
    saveBackupList();
    
    // Update backups list
    loadPreviousBackups();
    
    // Show success notification
    createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
}

// Restore backup
function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    
    if (!fileInput || !fileInput.files.length) {
        createNotification('خطأ', 'يرجى اختيار ملف', 'danger');
        return;
    }
    
    if (!confirm('سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد من المتابعة؟')) {
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (backup.data && backup.data.investors && backup.data.investments && backup.data.operations) {
                // Restore data
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
                
                // Save data
                saveData();
                saveNotifications();
                
                // Show success notification
                createNotification('نجاح', 'تمت استعادة النسخة الاحتياطية بنجاح', 'success');
                
                // Reload page
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                createNotification('خطأ', 'ملف النسخة الاحتياطية غير صالح', 'danger');
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            createNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'danger');
        }
    };
    
    reader.readAsText(file);
}

// Download selected backup
function downloadSelectedBackup() {
    const select = document.getElementById('previousBackups');
    
    if (!select || !select.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = select.value;
    
    // Find backup
    const backup = backupList.find(b => b.id === backupId);
    
    if (!backup) {
        createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
        return;
    }
    
    // Download backup file
    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date(backup.date).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show success notification
    createNotification('نجاح', 'تم تنزيل النسخة الاحتياطية بنجاح', 'success');
}

// Restore selected backup
function restoreSelectedBackup() {
    const select = document.getElementById('previousBackups');
    
    if (!select || !select.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = select.value;
    
    // Find backup
    const backup = backupList.find(b => b.id === backupId);
    
    if (!backup) {
        createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
        return;
    }
    
    // Confirm restoration
    if (!confirm('سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد من المتابعة؟')) {
        return;
    }
    
    // Restore data
    if (backup.data) {
        if (backup.data.investors) investors = backup.data.investors;
        if (backup.data.investments) investments = backup.data.investments;
        if (backup.data.operations) operations = backup.data.operations;
        if (backup.data.settings) settings = {...settings, ...backup.data.settings};
        if (backup.data.events) events = backup.data.events;
        if (backup.data.notifications) notifications = backup.data.notifications;
        
        // Save data
        saveData();
        saveNotifications();
        
        // Show success notification
        createNotification('نجاح', 'تمت استعادة النسخة الاحتياطية بنجاح', 'success');
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } else {
        createNotification('خطأ', 'النسخة الاحتياطية غير صالحة', 'danger');
    }
}

// Delete selected backup
function deleteSelectedBackup() {
    const select = document.getElementById('previousBackups');
    
    if (!select || !select.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = select.value;
    
    // Open delete confirmation modal
    openDeleteConfirmationModal(backupId, 'backup');
}

// ============ Import/Export Functions ============

// Export investors
function exportInvestors() {
    if (investors.length === 0) {
        createNotification('تنبيه', 'لا يوجد مستثمرين للتصدير', 'warning');
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
    
    createNotification('نجاح', 'تم تصدير المستثمرين بنجاح', 'success');
}

// Import investors
function importInvestors() {
    // Create import modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'importInvestorsModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">استيراد المستثمرين</h2>
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
                        <div class="alert-title">معلومات</div>
                        <div class="alert-text">قم بتحميل ملف JSON الذي يحتوي على بيانات المستثمرين. يجب أن يكون الملف بنفس تنسيق ملف التصدير.</div>
                    </div>
                </div>
                <form id="importInvestorsForm">
                    <div class="form-group">
                        <label class="form-label">ملف المستثمرين (JSON)</label>
                        <input type="file" class="form-control" id="importInvestorsFile" accept=".json" required>
                    </div>
                    <div class="form-group">
                        <div class="form-check">
                            <input type="radio" class="form-check-input" id="importModeAppend" name="importMode" value="append" checked>
                            <label class="form-check-label" for="importModeAppend">إضافة إلى القائمة الحالية</label>
                        </div>
                        <div class="form-check">
                            <input type="radio" class="form-check-input" id="importModeReplace" name="importMode" value="replace">
                            <label class="form-check-label" for="importModeReplace">استبدال القائمة الحالية</label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('importInvestorsModal').remove()">إلغاء</button>
                <button class="btn btn-primary" onclick="processImportInvestors()">استيراد</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Process import investors
function processImportInvestors() {
    const fileInput = document.getElementById('importInvestorsFile');
    const importMode = document.querySelector('input[name="importMode"]:checked').value;
    
    if (!fileInput.files.length) {
        createNotification('خطأ', 'يرجى اختيار ملف', 'danger');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importedInvestors = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedInvestors)) {
                createNotification('خطأ', 'الملف المستورد غير صالح', 'danger');
                return;
            }
            
            if (importMode === 'replace') {
                // Check if there are active investments
                const hasActiveInvestments = investments.some(inv => inv.status === 'active');
                
                if (hasActiveInvestments) {
                    if (!confirm('هناك استثمارات نشطة للمستثمرين الحاليين. هل أنت متأكد من استبدال جميع المستثمرين؟')) {
                        return;
                    }
                }
                
                investors = importedInvestors;
            } else {
                // Append mode
                importedInvestors.forEach(investor => {
                    // Check if investor already exists
                    const existingInvestor = investors.find(inv => inv.id === investor.id);
                    
                    if (!existingInvestor) {
                        investors.push(investor);
                    }
                });
            }
            
            // Save data
            saveData();
            
            // Refresh investors table
            loadInvestors();
            
            // Close modal
            document.getElementById('importInvestorsModal').remove();
            
            createNotification('نجاح', `تم استيراد ${importedInvestors.length} مستثمر بنجاح`, 'success');
        } catch (error) {
            console.error('Error importing investors:', error);
            createNotification('خطأ', 'حدث خطأ أثناء استيراد المستثمرين', 'danger');
        }
    };
    
    reader.readAsText(file);
}

// Export investments
function exportInvestments() {
    if (investments.length === 0) {
        createNotification('تنبيه', 'لا يوجد استثمارات للتصدير', 'warning');
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
    
    createNotification('نجاح', 'تم تصدير الاستثمارات بنجاح', 'success');
}

// Export operations
function exportOperations() {
    if (operations.length === 0) {
        createNotification('تنبيه', 'لا يوجد عمليات للتصدير', 'warning');
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
    
    createNotification('نجاح', 'تم تصدير العمليات بنجاح', 'success');
}

// Export profits
function exportProfits() {
    // Group investments by investor
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
        
        // Calculate profit for this investment
        const today = new Date();
        const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
        investorProfits[investorId].totalProfit += profit;
    });
    
    // Calculate paid profit for each investor
    operations.filter(op => op.type === 'profit').forEach(operation => {
        const investorId = operation.investorId;
        
        if (investorProfits[investorId]) {
            investorProfits[investorId].paidProfit += operation.amount;
        }
    });
    
    // Calculate due profit
    Object.keys(investorProfits).forEach(investorId => {
        investorProfits[investorId].dueProfit = Math.max(0, 
            investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
        );
    });
    
    // Convert to array
    const profitsArray = Object.keys(investorProfits).map(investorId => ({
        ...investorProfits[investorId],
        investorId
    }));
    
    // Check if there are profits to export
    if (profitsArray.length === 0) {
        createNotification('تنبيه', 'لا يوجد أرباح للتصدير', 'warning');
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
    
    createNotification('نجاح', 'تم تصدير الأرباح بنجاح', 'success');
}

// Export reports
function exportReports() {
    if (reports.length === 0) {
        createNotification('تنبيه', 'لا يوجد تقارير للتصدير', 'warning');
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
    
    createNotification('نجاح', 'تم تصدير التقارير بنجاح', 'success');
}