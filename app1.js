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