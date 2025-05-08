// نظام بطاقة الاستثمار
// يتكامل مع نظام بطاقة المستثمر لإدارة تفاصيل الاستثمارات والمعاملات

// المتغيرات العامة
let investmentCardSettings = {
    enableInvestmentDetails: true,      // تفعيل تفاصيل الاستثمار
    enableProfitCalculator: true,       // تفعيل حاسبة الأرباح
    enableTransactionAlerts: true,      // تفعيل تنبيهات المعاملات
    enableDailyReport: true,            // تفعيل التقرير اليومي
    dailyReportTime: "18:00",           // وقت إرسال التقرير اليومي
    profitDisplayMode: "chart",         // طريقة عرض الأرباح (chart, table, both)
    dashboardLayout: "standard",        // تخطيط لوحة المعلومات (standard, compact, detailed)
    showPredictions: true               // عرض التوقعات المستقبلية
};

// تهيئة نظام بطاقة الاستثمار
function initInvestmentCardSystem() {
    // تحميل إعدادات بطاقة الاستثمار من localStorage
    const savedSettings = localStorage.getItem('investmentCardSettings');
    if (savedSettings) {
        investmentCardSettings = { ...investmentCardSettings, ...JSON.parse(savedSettings) };
    }
    
    // إضافة مستمعي الأحداث للتفاعل مع واجهة المستخدم
    addInvestmentCardEventListeners();
    
    // مزامنة البيانات مع Firebase إذا كانت المزامنة مفعلة
    if (syncActive && investmentCardSettings.enableTransactionAlerts) {
        setupInvestmentTransactionSync();
    }
    
    console.log("تم تهيئة نظام بطاقة الاستثمار");
}

// إضافة مستمعي الأحداث للتفاعل مع واجهة المستخدم
function addInvestmentCardEventListeners() {
    // الاستماع لتحديثات نظام الاستثمار
    document.addEventListener('investmentUpdated', handleInvestmentUpdate);
    document.addEventListener('operationAdded', handleOperationAdded);
    document.addEventListener('profitCalculated', handleProfitCalculated);
    
    // الاستماع لفتح بطاقة المستثمر لإضافة تفاصيل الاستثمار
    document.addEventListener('cardOpened', extendInvestorCard);
}

// إعداد مزامنة معاملات الاستثمار مع Firebase
function setupInvestmentTransactionSync() {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        console.warn("Firebase غير متاح للمزامنة");
        return;
    }
    
    // الاستماع للتغييرات في الاستثمارات
    window.firebaseApp.database().ref('investments').on('child_changed', (snapshot) => {
        const updatedInvestment = snapshot.val();
        handleInvestmentUpdate({ detail: { investment: updatedInvestment } });
    });
    
    // الاستماع للعمليات الجديدة
    window.firebaseApp.database().ref('operations').on('child_added', (snapshot) => {
        const newOperation = snapshot.val();
        if (newOperation.createdAt > (lastSyncTime || new Date(0).toISOString())) {
            handleOperationAdded({ detail: { operation: newOperation } });
        }
    });
}

// معالجة تحديث الاستثمار
function handleInvestmentUpdate(event) {
    const investment = event.detail.investment;
    
    // إذا كانت البطاقة مفتوحة، قم بتحديثها
    if (document.getElementById('investorCardModal')) {
        updateInvestmentDetails(investment.investorId);
    }
    
    // إذا كانت تنبيهات المعاملات مفعلة، أرسل تنبيهاً
    if (investmentCardSettings.enableTransactionAlerts) {
        sendInvestmentUpdateNotification(investment);
    }
}

// معالجة إضافة عملية جديدة
function handleOperationAdded(event) {
    const operation = event.detail.operation;
    
    // إذا كانت البطاقة مفتوحة، قم بتحديث سجل المعاملات
    if (document.getElementById('investorCardModal')) {
        updateTransactionHistory(operation.investorId);
    }
    
    // إذا كانت تنبيهات المعاملات مفعلة، أرسل تنبيهاً
    if (investmentCardSettings.enableTransactionAlerts) {
        sendOperationNotification(operation);
    }
}

// معالجة حساب الأرباح
function handleProfitCalculated(event) {
    const profitData = event.detail.profitData;
    
    // إذا كانت البطاقة مفتوحة، قم بتحديث عرض الأرباح
    if (document.getElementById('investorCardModal')) {
        updateProfitDisplay(profitData.investorId);
    }
}

// إرسال تنبيه بتحديث الاستثمار
function sendInvestmentUpdateNotification(investment) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investment.investorId);
    if (!investor) return;
    
    let message = '';
    
    if (investment.status === 'active') {
        message = `تم تحديث استثمارك بمبلغ ${formatCurrency(investment.amount)}`;
    } else if (investment.status === 'closed') {
        message = `تم إغلاق استثمارك بمبلغ ${formatCurrency(investment.amount)}`;
    }
    
    // إنشاء إشعار
    createNotification(
        'تحديث استثمار',
        message,
        'info',
        investment.id,
        'investment'
    );
    
    // إذا كانت الإشعارات المتقدمة مفعلة وكان لدى المستثمر بريد إلكتروني، أرسل إشعاراً بالبريد
    if (investmentCardSettings.enableTransactionAlerts && investor.email) {
        sendEmailNotification(investor.email, 'تحديث استثمار', message);
    }
}

// إرسال تنبيه بإضافة عملية جديدة
function sendOperationNotification(operation) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === operation.investorId);
    if (!investor) return;
    
    let title = '';
    let message = '';
    let type = 'info';
    
    switch (operation.type) {
        case 'investment':
            title = 'استثمار جديد';
            message = `تم إضافة استثمار جديد بمبلغ ${formatCurrency(operation.amount)}`;
            type = 'success';
            break;
        case 'withdrawal':
            title = 'عملية سحب';
            message = `تم ${operation.status === 'pending' ? 'طلب' : 'تنفيذ'} سحب بمبلغ ${formatCurrency(operation.amount)}`;
            type = operation.status === 'pending' ? 'warning' : 'info';
            break;
        case 'profit':
            title = 'دفع أرباح';
            message = `تم دفع أرباح بمبلغ ${formatCurrency(operation.amount)}`;
            type = 'success';
            break;
        default:
            title = 'عملية جديدة';
            message = `تم إضافة عملية جديدة بمبلغ ${formatCurrency(operation.amount)}`;
    }
    
    // إنشاء إشعار
    createNotification(
        title,
        message,
        type,
        operation.id,
        'operation'
    );
    
    // إذا كانت الإشعارات المتقدمة مفعلة وكان لدى المستثمر بريد إلكتروني، أرسل إشعاراً بالبريد
    if (investmentCardSettings.enableTransactionAlerts && investor.email) {
        sendEmailNotification(investor.email, title, message);
    }
}

// محاكاة إرسال بريد إلكتروني
function sendEmailNotification(email, subject, message) {
    // في تطبيق حقيقي، سنستخدم خدمة بريد إلكتروني لإرسال البريد
    // هنا نقوم فقط بمحاكاة العملية
    console.log(`Sending email to ${email}:`, { subject, message });
}

// توسيع بطاقة المستثمر بإضافة تفاصيل الاستثمار
function extendInvestorCard(event) {
    const investorId = event.detail.investorId;
    
    // التحقق من وجود نافذة البطاقة
    const cardModal = document.getElementById('investorCardModal');
    if (!cardModal) return;
    
    // التحقق من وجود علامات التبويب
    const tabsContainer = cardModal.querySelector('.tabs');
    if (!tabsContainer) return;
    
    // البحث عن علامة تبويب "الرصيد والأرباح"
    const balanceTab = Array.from(tabsContainer.querySelectorAll('.tab')).find(tab => 
        tab.textContent === 'الرصيد والأرباح'
    );
    
    if (balanceTab && investmentCardSettings.enableInvestmentDetails) {
        // إضافة علامة تبويب تفاصيل الاستثمار
        const investmentDetailsTab = document.createElement('div');
        investmentDetailsTab.className = 'tab';
        investmentDetailsTab.textContent = 'تفاصيل الاستثمار';
        investmentDetailsTab.onclick = () => switchCardTab('investmentDetails');
        
        // إضافة العلامة بعد علامة "الرصيد والأرباح"
        balanceTab.insertAdjacentElement('afterend', investmentDetailsTab);
        
        // إضافة محتوى تفاصيل الاستثمار
        const modalBody = cardModal.querySelector('.modal-body');
        if (modalBody) {
            const investmentDetailsContent = document.createElement('div');
            investmentDetailsContent.className = 'card-tab-content';
            investmentDetailsContent.id = 'investmentDetails';
            investmentDetailsContent.innerHTML = createInvestmentDetailsHTML(investorId);
            
            modalBody.appendChild(investmentDetailsContent);
        }
    }
    
    if (investmentCardSettings.enableProfitCalculator) {
        // إضافة علامة تبويب حاسبة الأرباح
        const profitCalculatorTab = document.createElement('div');
        profitCalculatorTab.className = 'tab';
        profitCalculatorTab.textContent = 'حاسبة الأرباح';
        profitCalculatorTab.onclick = () => switchCardTab('profitCalculator');
        
        // إضافة العلامة في نهاية القائمة
        tabsContainer.appendChild(profitCalculatorTab);
        
        // إضافة محتوى حاسبة الأرباح
        const modalBody = cardModal.querySelector('.modal-body');
        if (modalBody) {
            const profitCalculatorContent = document.createElement('div');
            profitCalculatorContent.className = 'card-tab-content';
            profitCalculatorContent.id = 'profitCalculator';
            profitCalculatorContent.innerHTML = createProfitCalculatorHTML(investorId);
            
            modalBody.appendChild(profitCalculatorContent);
        }
    }
    
    if (investmentCardSettings.showPredictions) {
        // إضافة علامة تبويب التوقعات المستقبلية
        const predictionsTab = document.createElement('div');
        predictionsTab.className = 'tab';
        predictionsTab.textContent = 'التوقعات المستقبلية';
        predictionsTab.onclick = () => switchCardTab('predictions');
        
        // إضافة العلامة في نهاية القائمة
        tabsContainer.appendChild(predictionsTab);
        
        // إضافة محتوى التوقعات المستقبلية
        const modalBody = cardModal.querySelector('.modal-body');
        if (modalBody) {
            const predictionsContent = document.createElement('div');
            predictionsContent.className = 'card-tab-content';
            predictionsContent.id = 'predictions';
            predictionsContent.innerHTML = createPredictionsHTML(investorId);
            
            modalBody.appendChild(predictionsContent);
        }
    }
    
    // تحديث معلومات الاستثمار
    updateInvestmentDetails(investorId);
}

// إنشاء HTML لتفاصيل الاستثمار
function createInvestmentDetailsHTML(investorId) {
    return `
        <div class="table-container" style="box-shadow: none; padding: 0;">
            <div class="table-header">
                <div class="table-title">تفاصيل الاستثمارات</div>
                <div class="table-actions">
                    <button class="btn btn-sm btn-light" onclick="printInvestmentDetails('${investorId}')">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                </div>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المبلغ</th>
                        <th>تاريخ الاستثمار</th>
                        <th>الربح الشهري</th>
                        <th>إجمالي الأرباح</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody id="investmentDetailsTableBody">
                    <!-- سيتم تعبئته بواسطة JavaScript -->
                </tbody>
            </table>
        </div>
        
        <div id="investmentChart" style="height: 300px; width: 100%; margin-top: 20px;">
            <!-- سيتم تعبئته بواسطة JavaScript -->
        </div>
    `;
}

// إنشاء HTML لحاسبة الأرباح
function createProfitCalculatorHTML(investorId) {
    return `
        <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
            <div class="form-header">
                <h2 class="form-title">حاسبة الأرباح</h2>
                <p class="form-subtitle">حساب الأرباح المتوقعة لاستثماراتك</p>
            </div>
            <form id="profitCalculatorForm" onsubmit="calculateProjectedProfit(event, '${investorId}')">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">مبلغ الاستثمار</label>
                        <input type="number" class="form-control" id="calculatorAmount" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">معدل الربح الشهري (%)</label>
                        <input type="number" class="form-control" id="calculatorRate" step="0.01" value="${settings.monthlyProfitRate}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">المدة (بالشهور)</label>
                        <input type="number" class="form-control" id="calculatorDuration" min="1" max="120" value="12" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تاريخ البدء</label>
                        <input type="date" class="form-control" id="calculatorStartDate" value="${new Date().toISOString().slice(0, 10)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-calculator"></i> حساب الأرباح
                    </button>
                    <button type="reset" class="btn btn-light">
                        <i class="fas fa-redo"></i> إعادة تعيين
                    </button>
                </div>
            </form>
        </div>
        
        <div id="calculatorResults" style="display: none;">
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي الاستثمار</div>
                            <div class="card-value" id="calculatorTotalInvestment">0 د.ع</div>
                        </div>
                        <div class="card-icon primary">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي الأرباح المتوقعة</div>
                            <div class="card-value" id="calculatorTotalProfit">0 د.ع</div>
                        </div>
                        <div class="card-icon success">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">المبلغ النهائي</div>
                            <div class="card-value" id="calculatorFinalAmount">0 د.ع</div>
                        </div>
                        <div class="card-icon info">
                            <i class="fas fa-coins"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="profitProjectionChart" style="height: 300px; width: 100%; margin-top: 20px;">
                <!-- سيتم تعبئته بواسطة JavaScript -->
            </div>
            
            <div class="table-container" style="box-shadow: none; padding: 0; margin-top: 20px;">
                <div class="table-header">
                    <div class="table-title">جدول الأرباح المتوقعة</div>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-light" onclick="printProfitProjection()">
                            <i class="fas fa-print"></i> طباعة
                        </button>
                    </div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>الشهر</th>
                            <th>التاريخ</th>
                            <th>الربح الشهري</th>
                            <th>إجمالي الأرباح</th>
                            <th>المبلغ المتراكم</th>
                        </tr>
                    </thead>
                    <tbody id="profitProjectionTableBody">
                        <!-- سيتم تعبئته بواسطة JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// إنشاء HTML للتوقعات المستقبلية
function createPredictionsHTML(investorId) {
    return `
        <div class="dashboard-cards">
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">الاستثمار بعد سنة</div>
                        <div class="card-value" id="yearlyPrediction">0 د.ع</div>
                        <div class="card-change up">
                            <i class="fas fa-arrow-up"></i>
                            <span id="yearlyPredictionChange">0%</span>
                        </div>
                    </div>
                    <div class="card-icon primary">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">الاستثمار بعد 3 سنوات</div>
                        <div class="card-value" id="threeYearsPrediction">0 د.ع</div>
                        <div class="card-change up">
                            <i class="fas fa-arrow-up"></i>
                            <span id="threeYearsPredictionChange">0%</span>
                        </div>
                    </div>
                    <div class="card-icon success">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">الاستثمار بعد 5 سنوات</div>
                        <div class="card-value" id="fiveYearsPrediction">0 د.ع</div>
                        <div class="card-change up">
                            <i class="fas fa-arrow-up"></i>
                            <span id="fiveYearsPredictionChange">0%</span>
                        </div>
                    </div>
                    <div class="card-icon warning">
                        <i class="fas fa-chart-line"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="chart-container" style="margin-top: 20px;">
            <div class="chart-header">
                <div class="chart-title">توقعات نمو الاستثمار</div>
            </div>
            <div id="investmentPredictionChart" style="height: 300px; width: 100%;">
                <!-- سيتم تعبئته بواسطة JavaScript -->
            </div>
        </div>
        
        <div class="form-container" style="box-shadow: none; padding: 0; margin-top: 20px;">
            <div class="form-header">
                <h3 class="form-title">خطة الاستثمار المقترحة</h3>
            </div>
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">تنويه</div>
                    <div class="alert-text">
                        هذه التوقعات مبنية على معدل الربح الحالي وقد تختلف النتائج الفعلية. يرجى استشارة مستشار مالي للحصول على نصائح استثمارية مخصصة.
                    </div>
                </div>
            </div>
            <div id="investmentPlan">
                <!-- سيتم تعبئته بواسطة JavaScript -->
            </div>
        </div>
    `;
}

// تحديث تفاصيل الاستثمار
function updateInvestmentDetails(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على استثمارات المستثمر
    const investorInvestments = investments.filter(inv => inv.investorId === investorId);
    
    // تحديث جدول تفاصيل الاستثمار
    const tbody = document.getElementById('investmentDetailsTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (investorInvestments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center;">لا توجد استثمارات</td>`;
            tbody.appendChild(row);
        } else {
            // ترتيب الاستثمارات حسب التاريخ (الأحدث أولاً)
            const sortedInvestments = [...investorInvestments].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedInvestments.forEach((investment, index) => {
                const monthlyProfit = calculateMonthlyProfit(investment.amount);
                
                // حساب إجمالي الربح
                const today = new Date();
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
                `;
                
                tbody.appendChild(row);
            });
        }
    }
    
    // تحديث الرسم البياني
    updateInvestmentChart(investorId);
    
    // تحديث التوقعات المستقبلية
    updatePredictions(investorId);
}

// تحديث الرسم البياني للاستثمار
function updateInvestmentChart(investorId) {
    const chartContainer = document.getElementById('investmentChart');
    if (!chartContainer) return;
    
    // الحصول على استثمارات المستثمر
    const investorInvestments = investments.filter(inv => inv.investorId === investorId && inv.status === 'active');
    
    if (investorInvestments.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--gray-600);">
                    <i class="fas fa-chart-line fa-3x" style="margin-bottom: 10px;"></i>
                    <p>لا توجد استثمارات نشطة لعرضها</p>
                </div>
            </div>
        `;
        return;
    }
    
    // إنشاء بيانات الرسم البياني
    const chartData = generateInvestmentGrowthData(investorId);
    
    // تنظيف الحاوية
    chartContainer.innerHTML = '';
    
    // إنشاء عنصر canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'investmentGrowthChart';
    chartContainer.appendChild(canvas);
    
    // رسم المخطط
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'قيمة الاستثمار',
                    data: chartData.investmentValues,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'الأرباح',
                    data: chartData.profitValues,
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
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
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
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'نمو الاستثمار والأرباح'
                }
            }
        }
    });
}

// إنشاء بيانات نمو الاستثمار
function generateInvestmentGrowthData(investorId) {
    // الحصول على استثمارات المستثمر النشطة
    const activeInvestments = investments.filter(inv => inv.investorId === investorId && inv.status === 'active');
    
    // تحديد التاريخ الأقدم للاستثمارات
    const dates = activeInvestments.map(inv => new Date(inv.date));
    const oldestDate = new Date(Math.min(...dates));
    
    // تحديد التاريخ الحالي
    const today = new Date();
    
    // إنشاء مصفوفة الشهور من أقدم استثمار حتى اليوم
    const months = [];
    const currentMonth = new Date(oldestDate);
    currentMonth.setDate(1); // ضبط إلى أول الشهر
    
    while (currentMonth <= today) {
        months.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // حساب قيمة الاستثمار والأرباح لكل شهر
    const investmentValues = [];
    const profitValues = [];
    const labels = [];
    
    months.forEach(month => {
        // حساب قيمة الاستثمار حتى هذا الشهر
        let investmentValue = 0;
        let profitValue = 0;
        
        activeInvestments.forEach(investment => {
            const investmentDate = new Date(investment.date);
            
            // إذا كان الاستثمار موجوداً في هذا الشهر
            if (investmentDate <= month) {
                investmentValue += investment.amount;
                profitValue += calculateProfit(investment.amount, investment.date, month.toISOString());
            }
        });
        
        investmentValues.push(investmentValue);
        profitValues.push(profitValue);
        
        // تنسيق التاريخ (الشهر/السنة)
        labels.push(`${month.getMonth() + 1}/${month.getFullYear()}`);
    });
    
    return {
        labels,
        investmentValues,
        profitValues
    };
}

// حساب الربح المتوقع
function calculateProjectedProfit(event, investorId) {
    event.preventDefault();
    
    // الحصول على قيم النموذج
    const amount = parseFloat(document.getElementById('calculatorAmount').value);
    const rate = parseFloat(document.getElementById('calculatorRate').value);
    const duration = parseInt(document.getElementById('calculatorDuration').value);
    const startDate = document.getElementById('calculatorStartDate').value;
    
    // التحقق من صحة القيم
    if (isNaN(amount) || isNaN(rate) || isNaN(duration) || !startDate) {
        createNotification('خطأ', 'يرجى إدخال جميع القيم المطلوبة بشكل صحيح', 'danger');
        return;
    }
    
    // حساب الأرباح
    const projectionData = calculateProfitProjection(amount, rate, duration, startDate);
    
    // عرض النتائج
    document.getElementById('calculatorResults').style.display = 'block';
    document.getElementById('calculatorTotalInvestment').textContent = formatCurrency(amount);
    document.getElementById('calculatorTotalProfit').textContent = formatCurrency(projectionData.totalProfit);
    document.getElementById('calculatorFinalAmount').textContent = formatCurrency(amount + projectionData.totalProfit);
    
    // تحديث جدول توقعات الأرباح
    updateProfitProjectionTable(projectionData.monthlyData);
    
    // تحديث رسم بياني توقعات الأرباح
    updateProfitProjectionChart(projectionData.monthlyData);
}

// حساب توقعات الأرباح
function calculateProfitProjection(amount, rate, duration, startDate) {
    const monthlyData = [];
    let totalProfit = 0;
    
    // تحويل معدل الربح الشهري إلى كسر عشري
    const monthlyRate = rate / 100;
    
    // تاريخ البدء
    const currentDate = new Date(startDate);
    
    // حساب الأرباح لكل شهر
    for (let month = 1; month <= duration; month++) {
        // زيادة تاريخ الشهر
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        // حساب الربح الشهري
        const monthlyProfit = amount * monthlyRate;
        
        // تحديث إجمالي الربح
        totalProfit += monthlyProfit;
        
        // إضافة بيانات الشهر
        monthlyData.push({
            month,
            date: new Date(currentDate),
            monthlyProfit,
            totalProfit,
            accumulatedAmount: amount + totalProfit
        });
    }
    
    return {
        totalProfit,
        monthlyData
    };
}

// تحديث جدول توقعات الأرباح
function updateProfitProjectionTable(monthlyData) {
    const tbody = document.getElementById('profitProjectionTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    monthlyData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.month}</td>
            <td>${formatDate(data.date.toISOString())}</td>
            <td>${formatCurrency(data.monthlyProfit.toFixed(2))}</td>
            <td>${formatCurrency(data.totalProfit.toFixed(2))}</td>
            <td>${formatCurrency(data.accumulatedAmount.toFixed(2))}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// تحديث رسم بياني توقعات الأرباح
function updateProfitProjectionChart(monthlyData) {
    const chartContainer = document.getElementById('profitProjectionChart');
    if (!chartContainer) return;
    
    // تنظيف الحاوية
    chartContainer.innerHTML = '';
    
    // إنشاء عنصر canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'projectionChart';
    chartContainer.appendChild(canvas);
    
    // إعداد بيانات الرسم البياني
    const labels = monthlyData.map(data => `الشهر ${data.month}`);
    const profitData = monthlyData.map(data => data.totalProfit);
    const amountData = monthlyData.map(data => data.accumulatedAmount);
    
    // رسم المخطط
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'إجمالي الأرباح',
                    data: profitData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'المبلغ المتراكم',
                    data: amountData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
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
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'توقعات نمو الاستثمار والأرباح'
                }
            }
        }
    });
}

// طباعة جدول توقعات الأرباح
function printProfitProjection() {
    // الحصول على قيم النموذج
    const amount = parseFloat(document.getElementById('calculatorAmount').value);
    const rate = parseFloat(document.getElementById('calculatorRate').value);
    const duration = parseInt(document.getElementById('calculatorDuration').value);
    const startDate = document.getElementById('calculatorStartDate').value;
    
    // حساب الأرباح
    const projectionData = calculateProfitProjection(amount, rate, duration, startDate);
    
    // فتح نافذة الطباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>توقعات الأرباح</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    padding: 20px;
                }
                
                h1, h2 {
                    text-align: center;
                }
                
                .summary {
                    display: flex;
                    justify-content: space-around;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f7f9fc;
                    border-radius: 10px;
                }
                
                .summary-item {
                    text-align: center;
                }
                
                .summary-title {
                    font-size: 1rem;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .summary-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #333;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                
                table, th, td {
                    border: 1px solid #ddd;
                }
                
                th, td {
                    padding: 12px;
                    text-align: right;
                }
                
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 20px auto;
                    display: block;
                }
                
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>توقعات الأرباح</h1>
            <h2>تقرير مفصل</h2>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-title">مبلغ الاستثمار</div>
                    <div class="summary-value">${formatCurrency(amount)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-title">معدل الربح الشهري</div>
                    <div class="summary-value">${rate}%</div>
                </div>
                <div class="summary-item">
                    <div class="summary-title">مدة الاستثمار</div>
                    <div class="summary-value">${duration} شهر</div>
                </div>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-title">إجمالي الأرباح المتوقعة</div>
                    <div class="summary-value">${formatCurrency(projectionData.totalProfit)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-title">المبلغ النهائي</div>
                    <div class="summary-value">${formatCurrency(amount + projectionData.totalProfit)}</div>
                </div>
            </div>
            
            <h2>جدول توقعات الأرباح الشهرية</h2>
            
            <table>
                <thead>
                    <tr>
                        <th>الشهر</th>
                        <th>التاريخ</th>
                        <th>الربح الشهري</th>
                        <th>إجمالي الأرباح</th>
                        <th>المبلغ المتراكم</th>
                    </tr>
                </thead>
                <tbody>
                    ${projectionData.monthlyData.map(data => `
                        <tr>
                            <td>${data.month}</td>
                            <td>${formatDate(data.date.toISOString())}</td>
                            <td>${formatCurrency(data.monthlyProfit.toFixed(2))}</td>
                            <td>${formatCurrency(data.totalProfit.toFixed(2))}</td>
                            <td>${formatCurrency(data.accumulatedAmount.toFixed(2))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                هذا التقرير تم إنشاؤه بواسطة نظام إدارة الاستثمار - ${formatDate(new Date().toISOString())}
                <br>
                الأرباح المتوقعة هي تقديرات بناءً على معدل الربح الحالي وقد تختلف النتائج الفعلية.
            </div>
            
            <button class="btn no-print" onclick="window.print()">طباعة التقرير</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// تحديث التوقعات المستقبلية
function updatePredictions(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على استثمارات المستثمر النشطة
    const activeInvestments = investments.filter(inv => inv.investorId === investorId && inv.status === 'active');
    
    // حساب إجمالي الاستثمار
    const totalInvestment = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // إذا لم يكن هناك استثمارات نشطة، أعرض رسالة مناسبة
    if (totalInvestment === 0) {
        if (document.getElementById('investmentPlan')) {
            document.getElementById('investmentPlan').innerHTML = `
                <div class="alert alert-warning">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">لا توجد استثمارات نشطة</div>
                        <div class="alert-text">
                            يرجى البدء باستثمار جديد لعرض التوقعات المستقبلية والخطة الاستثمارية المقترحة.
                        </div>
                    </div>
                </div>
            `;
        }
        
        // إعادة تعيين قيم التوقعات
        if (document.getElementById('yearlyPrediction')) {
            document.getElementById('yearlyPrediction').textContent = formatCurrency(0);
            document.getElementById('yearlyPredictionChange').textContent = '0%';
        }
        
        if (document.getElementById('threeYearsPrediction')) {
            document.getElementById('threeYearsPrediction').textContent = formatCurrency(0);
            document.getElementById('threeYearsPredictionChange').textContent = '0%';
        }
        
        if (document.getElementById('fiveYearsPrediction')) {
            document.getElementById('fiveYearsPrediction').textContent = formatCurrency(0);
            document.getElementById('fiveYearsPredictionChange').textContent = '0%';
        }
        
        return;
    }
    
    // حساب التوقعات
    const monthlyRate = settings.monthlyProfitRate / 100;
    
    // توقع لمدة سنة
    const yearlyPrediction = calculateCompoundInterest(totalInvestment, monthlyRate, 12);
    const yearlyIncrease = ((yearlyPrediction - totalInvestment) / totalInvestment) * 100;
    
    // توقع لمدة 3 سنوات
    const threeYearsPrediction = calculateCompoundInterest(totalInvestment, monthlyRate, 36);
    const threeYearsIncrease = ((threeYearsPrediction - totalInvestment) / totalInvestment) * 100;
    
    // توقع لمدة 5 سنوات
    const fiveYearsPrediction = calculateCompoundInterest(totalInvestment, monthlyRate, 60);
    const fiveYearsIncrease = ((fiveYearsPrediction - totalInvestment) / totalInvestment) * 100;
    
    // تحديث البطاقات
    if (document.getElementById('yearlyPrediction')) {
        document.getElementById('yearlyPrediction').textContent = formatCurrency(yearlyPrediction);
        document.getElementById('yearlyPredictionChange').textContent = yearlyIncrease.toFixed(2) + '%';
    }
    
    if (document.getElementById('threeYearsPrediction')) {
        document.getElementById('threeYearsPrediction').textContent = formatCurrency(threeYearsPrediction);
        document.getElementById('threeYearsPredictionChange').textContent = threeYearsIncrease.toFixed(2) + '%';
    }
    
    if (document.getElementById('fiveYearsPrediction')) {
        document.getElementById('fiveYearsPrediction').textContent = formatCurrency(fiveYearsPrediction);
        document.getElementById('fiveYearsPredictionChange').textContent = fiveYearsIncrease.toFixed(2) + '%';
    }
    
    // تحديث الرسم البياني
    updatePredictionChart(totalInvestment, monthlyRate);
    
    // إنشاء خطة الاستثمار المقترحة
    createInvestmentPlan(investorId, totalInvestment);
}

// حساب الفائدة المركبة
function calculateCompoundInterest(principal, monthlyRate, months) {
    return principal * Math.pow(1 + monthlyRate, months);
}

// تحديث رسم بياني التوقعات
function updatePredictionChart(totalInvestment, monthlyRate) {
    const chartContainer = document.getElementById('investmentPredictionChart');
    if (!chartContainer) return;
    
    // تنظيف الحاوية
    chartContainer.innerHTML = '';
    
    // إنشاء عنصر canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'predictionChart';
    chartContainer.appendChild(canvas);
    
    // إنشاء البيانات
    const years = 10; // 10 سنوات
    const labels = [];
    const values = [];
    
    for (let year = 0; year <= years; year++) {
        labels.push(`السنة ${year}`);
        values.push(calculateCompoundInterest(totalInvestment, monthlyRate, year * 12));
    }
    
    // رسم المخطط
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'قيمة الاستثمار',
                    data: values,
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
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
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
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'توقعات نمو الاستثمار على مدى 10 سنوات'
                }
            }
        }
    });
}

// إنشاء خطة الاستثمار المقترحة
function createInvestmentPlan(investorId, totalInvestment) {
    const planContainer = document.getElementById('investmentPlan');
    if (!planContainer) return;
    
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // معدل النمو الشهري
    const monthlyRate = settings.monthlyProfitRate / 100;
    
    // حساب الاستثمار المثالي بناءً على الاستثمار الحالي
    const idealMonthlyInvestment = totalInvestment * 0.1; // 10% من الاستثمار الحالي
    
    // حساب تأثير الاستثمار الشهري المنتظم
    const regularInvestmentResults = calculateRegularInvestmentGrowth(totalInvestment, idealMonthlyInvestment, monthlyRate, 5 * 12); // 5 سنوات
    
    // إنشاء المحتوى
    planContainer.innerHTML = `
        <div class="alert alert-success">
            <div class="alert-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">خطة النمو الاستثماري المقترحة</div>
                <div class="alert-text">
                    <p>بناءً على استثمارك الحالي البالغ ${formatCurrency(totalInvestment)}، نقترح عليك:</p>
                    <ul>
                        <li>إضافة استثمار شهري منتظم بقيمة ${formatCurrency(idealMonthlyInvestment.toFixed(0))} لتعزيز النمو.</li>
                        <li>الاحتفاظ بالأرباح وإعادة استثمارها لتحقيق نمو مركب.</li>
                        <li>مراجعة استراتيجية الاستثمار كل 6 أشهر لتحسين العوائد.</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <h3 class="form-subtitle">تأثير الاستثمار المنتظم</h3>
            <p>مقارنة بين النمو بدون إضافات واستثمار شهري منتظم بقيمة ${formatCurrency(idealMonthlyInvestment.toFixed(0))}:</p>
            
            <div class="table-container" style="box-shadow: none; padding: 0; margin-top: 10px;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>السنة</th>
                            <th>بدون إضافات</th>
                            <th>مع استثمار شهري</th>
                            <th>الفرق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regularInvestmentResults.yearlyData.map((data, index) => {
                            const year = index + 1;
                            const withoutRegular = calculateCompoundInterest(totalInvestment, monthlyRate, year * 12);
                            const withRegular = data.finalAmount;
                            const difference = withRegular - withoutRegular;
                            const percentageDiff = (difference / withoutRegular) * 100;
                            
                            return `
                                <tr>
                                    <td>السنة ${year}</td>
                                    <td>${formatCurrency(withoutRegular)}</td>
                                    <td>${formatCurrency(withRegular)}</td>
                                    <td>${formatCurrency(difference)} <span style="color: var(--success-color);">(+${percentageDiff.toFixed(1)}%)</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="form-group" style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="createCustomInvestmentPlan('${investorId}')">
                <i class="fas fa-calculator"></i> إنشاء خطة استثمارية مخصصة
            </button>
        </div>
    `;
}

// حساب نمو الاستثمار المنتظم
function calculateRegularInvestmentGrowth(initialAmount, monthlyInvestment, monthlyRate, months) {
    const monthlyData = [];
    const yearlyData = [];
    
    let currentAmount = initialAmount;
    
    for (let month = 1; month <= months; month++) {
        // إضافة الاستثمار الشهري
        currentAmount += monthlyInvestment;
        
        // حساب الربح الشهري
        const monthlyProfit = currentAmount * monthlyRate;
        
        // تحديث المبلغ الحالي
        currentAmount += monthlyProfit;
        
        // تخزين البيانات الشهرية
        monthlyData.push({
            month,
            investment: monthlyInvestment,
            profit: monthlyProfit,
            finalAmount: currentAmount
        });
        
        // تخزين البيانات السنوية
        if (month % 12 === 0) {
            yearlyData.push({
                year: month / 12,
                finalAmount: currentAmount
            });
        }
    }
    
    return {
        monthlyData,
        yearlyData
    };
}

// إنشاء خطة استثمارية مخصصة
function createCustomInvestmentPlan(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء نافذة خطة استثمارية مخصصة
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'customInvestmentPlanModal';
    
    // الحصول على استثمارات المستثمر النشطة
    const activeInvestments = investments.filter(inv => inv.investorId === investorId && inv.status === 'active');
    const totalInvestment = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">خطة استثمارية مخصصة</h2>
                <div class="modal-close" onclick="document.getElementById('customInvestmentPlanModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <div class="form-header">
                        <h2 class="form-title">إنشاء خطة استثمارية مخصصة</h2>
                        <p class="form-subtitle">قم بتخصيص خطة استثمارية تناسب أهدافك المالية</p>
                    </div>
                    <form id="customPlanForm" onsubmit="calculateCustomPlan(event, '${investorId}')">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">الاستثمار الحالي</label>
                                <input type="number" class="form-control" id="currentInvestment" value="${totalInvestment}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">الهدف المالي</label>
                                <input type="number" class="form-control" id="financialGoal" value="${totalInvestment * 2}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">استثمار شهري منتظم</label>
                                <input type="number" class="form-control" id="monthlyInvestment" value="${(totalInvestment * 0.1).toFixed(0)}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">معدل الربح الشهري (%)</label>
                                <input type="number" class="form-control" id="customRate" step="0.01" value="${settings.monthlyProfitRate}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-calculator"></i> حساب الخطة
                            </button>
                            <button type="reset" class="btn btn-light">
                                <i class="fas fa-redo"></i> إعادة تعيين
                            </button>
                        </div>
                    </form>
                </div>
                
                <div id="customPlanResults" style="display: none;">
                    <div class="dashboard-cards">
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">المدة المتوقعة للوصول للهدف</div>
                                    <div class="card-value" id="goalTimeframe">0 شهر</div>
                                </div>
                                <div class="card-icon primary">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">إجمالي الاستثمار المضاف</div>
                                    <div class="card-value" id="totalAddedInvestment">0 د.ع</div>
                                </div>
                                <div class="card-icon success">
                                    <i class="fas fa-plus-circle"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">إجمالي الأرباح المتوقعة</div>
                                    <div class="card-value" id="goalTotalProfit">0 د.ع</div>
                                </div>
                                <div class="card-icon warning">
                                    <i class="fas fa-percentage"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="customPlanChart" style="height: 300px; width: 100%; margin-top: 20px;">
                        <!-- سيتم تعبئته بواسطة JavaScript -->
                    </div>
                    
                    <div class="form-group" style="margin-top: 20px;">
                        <button class="btn btn-success" onclick="saveCustomPlan('${investorId}')">
                            <i class="fas fa-save"></i> حفظ الخطة
                        </button>
                        <button class="btn btn-primary" onclick="printCustomPlan('${investorId}')">
                            <i class="fas fa-print"></i> طباعة الخطة
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('customInvestmentPlanModal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// إكمال نظام بطاقة الاستثمار - الجزء الثاني
// يحتوي على باقي الوظائف المتبقية من ملف investment-card-system.js

// حساب خطة استثمارية مخصصة - تكملة
function calculateCustomPlan(event, investorId) {
    event.preventDefault();
    
    // الحصول على قيم النموذج
    const currentInvestment = parseFloat(document.getElementById('currentInvestment').value);
    const financialGoal = parseFloat(document.getElementById('financialGoal').value);
    const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
    const monthlyRate = parseFloat(document.getElementById('customRate').value) / 100;
    
    // التحقق من صحة القيم
    if (isNaN(currentInvestment) || isNaN(financialGoal) || isNaN(monthlyInvestment) || isNaN(monthlyRate)) {
        createNotification('خطأ', 'يرجى إدخال جميع القيم المطلوبة بشكل صحيح', 'danger');
        return;
    }
    
    // التحقق من أن الهدف أكبر من الاستثمار الحالي
    if (financialGoal <= currentInvestment) {
        createNotification('خطأ', 'الهدف المالي يجب أن يكون أكبر من الاستثمار الحالي', 'danger');
        return;
    }
    
    // حساب المدة المطلوبة للوصول للهدف
    const results = calculateTimeToGoal(currentInvestment, financialGoal, monthlyInvestment, monthlyRate);
    
    // عرض النتائج
    document.getElementById('customPlanResults').style.display = 'block';
    document.getElementById('goalTimeframe').textContent = `${results.months} شهر (${(results.months / 12).toFixed(1)} سنة)`;
    document.getElementById('totalAddedInvestment').textContent = formatCurrency(results.totalAddedInvestment);
    document.getElementById('goalTotalProfit').textContent = formatCurrency(results.totalProfit);
    
    // تحديث الرسم البياني
    updateCustomPlanChart(results.growthData);
    
    // تخزين النتائج لاستخدامها في الطباعة
    window.customPlanResults = results;
}

// حساب المدة المطلوبة للوصول للهدف
function calculateTimeToGoal(currentInvestment, goal, monthlyInvestment, monthlyRate) {
    let totalAmount = currentInvestment;
    let months = 0;
    let totalAddedInvestment = 0;
    let totalProfit = 0;
    const growthData = [];
    
    // إضافة النقطة الأساسية
    growthData.push({
        month: 0,
        totalAmount: currentInvestment,
        investment: currentInvestment,
        profit: 0
    });
    
    // محاكاة النمو شهرياً حتى الوصول للهدف
    while (totalAmount < goal && months < 600) { // حد أقصى 50 سنة
        months++;
        
        // إضافة الاستثمار الشهري
        totalAmount += monthlyInvestment;
        totalAddedInvestment += monthlyInvestment;
        
        // حساب الربح الشهري
        const monthlyProfit = totalAmount * monthlyRate;
        totalProfit += monthlyProfit;
        
        // تحديث المبلغ الإجمالي
        totalAmount += monthlyProfit;
        
        // إضافة نقطة بيانات كل 3 أشهر لتقليل البيانات في الرسم البياني
        if (months % 3 === 0 || totalAmount >= goal) {
            growthData.push({
                month: months,
                totalAmount: totalAmount,
                investment: currentInvestment + totalAddedInvestment,
                profit: totalProfit
            });
        }
    }
    
    return {
        months,
        totalAddedInvestment,
        totalProfit,
        finalAmount: totalAmount,
        growthData
    };
}

// تحديث رسم بياني الخطة المخصصة
function updateCustomPlanChart(growthData) {
    const chartContainer = document.getElementById('customPlanChart');
    if (!chartContainer) return;
    
    // تنظيف الحاوية
    chartContainer.innerHTML = '';
    
    // إنشاء عنصر canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'customChart';
    chartContainer.appendChild(canvas);
    
    // إعداد بيانات الرسم البياني
    const labels = growthData.map(data => {
        if (data.month === 0) return 'البداية';
        const years = Math.floor(data.month / 12);
        const months = data.month % 12;
        if (years === 0) return `${months} شهر`;
        if (months === 0) return `${years} سنة`;
        return `${years} سنة ${months} شهر`;
    });
    
    const totalAmountData = growthData.map(data => data.totalAmount);
    const investmentData = growthData.map(data => data.investment);
    const profitData = growthData.map(data => data.profit);
    
    // رسم المخطط
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'المبلغ الإجمالي',
                    data: totalAmountData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'إجمالي الاستثمار',
                    data: investmentData,
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'إجمالي الأرباح',
                    data: profitData,
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
                    ticks: {
                        callback: function(value) {
                            return formatNumber(value);
                        }
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
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'نمو الاستثمار حتى الوصول للهدف'
                }
            }
        }
    });
}

// حفظ الخطة الاستثمارية المخصصة
function saveCustomPlan(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // التحقق من وجود نتائج الخطة
    if (!window.customPlanResults) {
        createNotification('خطأ', 'يرجى حساب الخطة أولاً', 'danger');
        return;
    }
    
    // إنشاء كائن الخطة
    const plan = {
        id: generateId(),
        investorId,
        createdAt: new Date().toISOString(),
        currentInvestment: parseFloat(document.getElementById('currentInvestment').value),
        financialGoal: parseFloat(document.getElementById('financialGoal').value),
        monthlyInvestment: parseFloat(document.getElementById('monthlyInvestment').value),
        monthlyRate: parseFloat(document.getElementById('customRate').value),
        results: window.customPlanResults
    };
    
    // حفظ الخطة في البيانات المحلية
    if (!investor.investmentPlans) {
        investor.investmentPlans = [];
    }
    
    investor.investmentPlans.push(plan);
    
    // حفظ البيانات
    saveData();
    
    // إنشاء إشعار
    createNotification('نجاح', 'تم حفظ الخطة الاستثمارية بنجاح', 'success');
    
    // إنشاء نشاط
    createInvestorActivity(investorId, 'plan', `تم إنشاء خطة استثمارية مخصصة`);
}

// طباعة الخطة الاستثمارية المخصصة
function printCustomPlan(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // التحقق من وجود نتائج الخطة
    if (!window.customPlanResults) {
        createNotification('خطأ', 'يرجى حساب الخطة أولاً', 'danger');
        return;
    }
    
    // الحصول على قيم النموذج
    const currentInvestment = parseFloat(document.getElementById('currentInvestment').value);
    const financialGoal = parseFloat(document.getElementById('financialGoal').value);
    const monthlyInvestment = parseFloat(document.getElementById('monthlyInvestment').value);
    const monthlyRate = parseFloat(document.getElementById('customRate').value);
    
    const results = window.customPlanResults;
    
    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>خطة استثمارية مخصصة - ${investor.name}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    padding: 30px;
                    max-width: 900px;
                    margin: 0 auto;
                }
                
                h1, h2 {
                    text-align: center;
                    color: #333;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 20px;
                }
                
                .company-name {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #3498db;
                    margin-bottom: 10px;
                }
                
                .summary {
                    display: flex;
                    justify-content: space-around;
                    flex-wrap: wrap;
                    margin: 30px 0;
                    padding: 20px;
                    background: #f7f9fc;
                    border-radius: 10px;
                }
                
                .summary-item {
                    text-align: center;
                    margin: 10px;
                    flex: 1;
                    min-width: 200px;
                }
                
                .summary-title {
                    font-size: 1rem;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .summary-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #333;
                }
                
                .plan-details {
                    margin: 30px 0;
                }
                
                .section-title {
                    font-size: 1.3rem;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #e0e0e0;
                    padding-bottom: 5px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                }
                
                .highlight {
                    background: #fff4e0;
                    border: 1px solid #ffa500;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 20px 0;
                }
                
                .timeline {
                    margin: 30px 0;
                }
                
                .timeline-item {
                    display: flex;
                    align-items: center;
                    padding: 15px 0;
                    border-left: 3px solid #3498db;
                    margin-left: 20px;
                    padding-left: 20px;
                    position: relative;
                }
                
                .timeline-marker {
                    width: 16px;
                    height: 16px;
                    background: #3498db;
                    border-radius: 50%;
                    position: absolute;
                    left: -9px;
                }
                
                .timeline-content {
                    flex: 1;
                }
                
                .recommendations {
                    margin: 30px 0;
                }
                
                .recommendation-item {
                    background: #f0f9ff;
                    border-right: 4px solid #3498db;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 4px;
                }
                
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                }
                
                .btn {
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 20px auto;
                    display: block;
                }
                
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${settings.companyName || 'شركة الاستثمار العراقية'}</div>
                <h1>خطة استثمارية مخصصة</h1>
                <h2>للمستثمر: ${investor.name}</h2>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-title">الهدف المالي</div>
                    <div class="summary-value">${formatCurrency(financialGoal)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-title">المدة المتوقعة</div>
                    <div class="summary-value">${results.months} شهر</div>
                </div>
                <div class="summary-item">
                    <div class="summary-title">العائد الكلي المتوقع</div>
                    <div class="summary-value">${formatCurrency(results.totalProfit)}</div>
                </div>
            </div>
            
            <div class="plan-details">
                <div class="section-title">تفاصيل الخطة الاستثمارية</div>
                
                <div class="info-row">
                    <span class="info-label">الاستثمار الحالي:</span>
                    <span class="info-value">${formatCurrency(currentInvestment)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">الاستثمار الشهري المطلوب:</span>
                    <span class="info-value">${formatCurrency(monthlyInvestment)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">معدل الربح الشهري:</span>
                    <span class="info-value">${monthlyRate}%</span>
                </div>
                <div class="info-row">
                    <span class="info-label">إجمالي الاستثمار الإضافي:</span>
                    <span class="info-value">${formatCurrency(results.totalAddedInvestment)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">القيمة النهائية المتوقعة:</span>
                    <span class="info-value">${formatCurrency(results.finalAmount)}</span>
                </div>
            </div>
            
            <div class="highlight">
                <div class="section-title">ملخص الخطة</div>
                <p>للوصول إلى هدفك المالي البالغ ${formatCurrency(financialGoal)}، ستحتاج إلى:</p>
                <ul>
                    <li>استثمار شهري منتظم بقيمة ${formatCurrency(monthlyInvestment)}</li>
                    <li>الاستمرار لمدة ${results.months} شهر (${(results.months / 12).toFixed(1)} سنة)</li>
                    <li>إجمالي استثمار إضافي بقيمة ${formatCurrency(results.totalAddedInvestment)}</li>
                </ul>
                <p>سيحقق هذا عائداً متوقعاً بقيمة ${formatCurrency(results.totalProfit)}</p>
            </div>
            
            <div class="timeline">
                <div class="section-title">المخطط الزمني للاستثمار</div>
                
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <strong>البداية:</strong>
                        <br>استثمار أولي: ${formatCurrency(currentInvestment)}
                    </div>
                </div>
                
                ${results.months >= 12 ? `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <strong>بعد سنة:</strong>
                            <br>إجمالي الاستثمار: ${formatCurrency(currentInvestment + (monthlyInvestment * 12))}
                            <br>القيمة المتوقعة: ${formatCurrency(calculateCompoundInterest(currentInvestment + (monthlyInvestment * 12), monthlyRate, 12))}
                        </div>
                    </div>
                ` : ''}
                
                ${results.months >= 36 ? `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <strong>بعد 3 سنوات:</strong>
                            <br>إجمالي الاستثمار: ${formatCurrency(currentInvestment + (monthlyInvestment * 36))}
                            <br>القيمة المتوقعة: ${formatCurrency(calculateCompoundInterest(currentInvestment + (monthlyInvestment * 36), monthlyRate, 36))}
                        </div>
                    </div>
                ` : ''}
                
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <strong>النهاية (${results.months} شهر):</strong>
                        <br>إجمالي الاستثمار: ${formatCurrency(currentInvestment + results.totalAddedInvestment)}
                        <br>القيمة النهائية: ${formatCurrency(results.finalAmount)}
                        <br>تحقيق الهدف: ${formatCurrency(financialGoal)}
                    </div>
                </div>
            </div>
            
            <div class="recommendations">
                <div class="section-title">توصيات ونصائح</div>
                
                <div class="recommendation-item">
                    <strong>الالتزام بالخطة:</strong>
                    الانتظام في الاستثمار الشهري هو العامل الأساسي لنجاح هذه الخطة.
                </div>
                
                <div class="recommendation-item">
                    <strong>المراجعة الدورية:</strong>
                    راجع خطتك كل 6 أشهر لتقييم التقدم وإجراء التعديلات اللازمة.
                </div>
                
                <div class="recommendation-item">
                    <strong>إعادة استثمار الأرباح:</strong>
                    للحصول على أفضل النتائج، يُنصح بإعادة استثمار الأرباح المحققة.
                </div>
                
                <div class="recommendation-item">
                    <strong>تنويع الاستثمارات:</strong>
                    فكر في تنويع استثماراتك لتقليل المخاطر وتحسين العوائد.
                </div>
            </div>
            
            <div class="footer">
                هذه الخطة تم إنشاؤها بواسطة نظام إدارة الاستثمار - ${formatDate(new Date().toISOString())}
                <br>
                تم الإعداد خصيصاً للمستثمر: ${investor.name}
                <br>
                الأرقام الواردة هي تقديرات بناءً على معدل الربح المحدد وقد تختلف النتائج الفعلية.
            </div>
            
            <button class="btn no-print" onclick="window.print()">طباعة الخطة</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// طباعة تفاصيل الاستثمار
function printInvestmentDetails(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على استثمارات المستثمر
    const investorInvestments = investments.filter(inv => inv.investorId === investorId);
    
    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>تفاصيل استثمارات - ${investor.name}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    padding: 20px;
                }
                
                h1, h2 {
                    text-align: center;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                
                table, th, td {
                    border: 1px solid #ddd;
                }
                
                th, td {
                    padding: 12px;
                    text-align: right;
                }
                
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                
                .status {
                    padding: 5px 10px;
                    border-radius: 50px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-align: center;
                    display: inline-block;
                }
                
                .status.active {
                    background: rgba(46, 204, 113, 0.1);
                    color: #2ecc71;
                }
                
                .status.closed {
                    background: rgba(231, 76, 60, 0.1);
                    color: #e74c3c;
                }
                
                .summary {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f7f9fc;
                    border-radius: 10px;
                }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 20px auto;
                    display: block;
                }
                
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <h1>تفاصيل استثمارات</h1>
            <h2>${investor.name}</h2>
            
            <div class="summary">
                <p>إجمالي عدد الاستثمارات: ${investorInvestments.length}</p>
                <p>إجمالي الاستثمارات النشطة: ${investorInvestments.filter(inv => inv.status === 'active').length}</p>
                <p>إجمالي مبلغ الاستثمار: ${formatCurrency(investorInvestments.reduce((sum, inv) => sum + inv.amount, 0))}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المبلغ</th>
                        <th>تاريخ الاستثمار</th>
                        <th>الربح الشهري</th>
                        <th>إجمالي الأرباح</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${investorInvestments.map((investment, index) => {
                        const monthlyProfit = calculateMonthlyProfit(investment.amount);
                        const today = new Date();
                        const totalProfit = investment.status === 'active' ? 
                            calculateProfit(investment.amount, investment.date, today.toISOString()) : 0;
                        
                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${formatCurrency(investment.amount)}</td>
                                <td>${formatDate(investment.date)}</td>
                                <td>${formatCurrency(monthlyProfit.toFixed(2))}</td>
                                <td>${formatCurrency(totalProfit.toFixed(2))}</td>
                                <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'نشط' : 'مغلق'}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                هذا التقرير تم إنشاؤه بواسطة نظام إدارة الاستثمار - ${formatDate(new Date().toISOString())}
            </div>
            
            <button class="btn no-print" onclick="window.print()">طباعة التقرير</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// تحديث سجل المعاملات
function updateTransactionHistory(investorId) {
    // البحث عن جدول المعاملات
    const tbody = document.getElementById('investorTransactionsBody');
    if (!tbody) return;
    
    // الحصول على عمليات المستثمر
    const investorOperations = operations.filter(op => op.investorId === investorId);
    
    if (investorOperations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">لا توجد معاملات</td></tr>`;
        return;
    }
    
    // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
    const sortedOperations = [...investorOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedOperations.map(op => `
        <tr>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
            <td>${op.notes || '-'}</td>
        </tr>
    `).join('');
}

// تحديث عرض الأرباح
function updateProfitDisplay(investorId) {
    // إعادة حساب وتحديث عرض الأرباح
    const investorData = getInvestorData(investorId);
    
    if (!investorData) return;
    
    // تحديث بطاقات الأرباح
    const totalProfitElement = document.querySelector('#balanceInfo .card:nth-child(2) .card-value');
    const dueProfitElement = document.querySelector('#balanceInfo .card:nth-child(3) .card-value');
    const paidProfitElement = document.querySelector('#balanceInfo .card:nth-child(4) .card-value');
    
    if (totalProfitElement) totalProfitElement.textContent = formatCurrency(investorData.totalProfit.toFixed(2));
    if (dueProfitElement) dueProfitElement.textContent = formatCurrency(investorData.dueProfit.toFixed(2));
    if (paidProfitElement) paidProfitElement.textContent = formatCurrency(investorData.paidProfit.toFixed(2));
}

// إنشاء تقرير يومي
function generateDailyReport() {
    // إذا كان التقرير اليومي غير مفعل، لا تفعل شيئاً
    if (!investmentCardSettings.enableDailyReport) return;
    
    const today = new Date();
    
    // حساب ملخص اليوم
    const summary = calculateDailySummary();
    
    // إنشاء إشعار بالتقرير اليومي
    createNotification(
        'التقرير اليومي',
        `إجمالي الاستثمارات: ${formatCurrency(summary.totalInvestments)}\nإجمالي الأرباح: ${formatCurrency(summary.totalProfits)}\nعدد المعاملات: ${summary.transactionCount}`,
        'info'
    );
    
    // إرسال التقرير بالبريد الإلكتروني لجميع المستثمرين إذا كانوا يملكون بريد إلكتروني
    investors.forEach(investor => {
        if (investor.email && investor.preferences?.receiveDailyReport) {
            sendDailyReportEmail(investor);
        }
    });
}

// حساب ملخص اليوم
function calculateDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // إجمالي الاستثمارات النشطة
    const totalInvestments = investments
        .filter(inv => inv.status === 'active')
        .reduce((sum, inv) => sum + inv.amount, 0);
    
    // إجمالي الأرباح
    let totalProfits = 0;
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            totalProfits += calculateProfit(inv.amount, inv.date, today.toISOString());
        });
    
    // عدد المعاملات اليوم
    const transactionCount = operations.filter(op => {
        const opDate = new Date(op.date);
        return opDate >= today && opDate < tomorrow;
    }).length;
    
    return {
        totalInvestments,
        totalProfits,
        transactionCount
    };
}

// إرسال التقرير اليومي بالبريد الإلكتروني
function sendDailyReportEmail(investor) {
    // محاكاة إرسال البريد الإلكتروني
    console.log(`Sending daily report to ${investor.email}`);
    
    // في تطبيق حقيقي، سنستخدم خدمة بريد إلكتروني حقيقية
}

// جدولة التقرير اليومي
function scheduleDailyReport() {
    if (!investmentCardSettings.enableDailyReport) return;
    
    const now = new Date();
    const reportTime = investmentCardSettings.dailyReportTime.split(':');
    const scheduledTime = new Date();
    scheduledTime.setHours(parseInt(reportTime[0]));
    scheduledTime.setMinutes(parseInt(reportTime[1]));
    scheduledTime.setSeconds(0);
    
    // إذا كان الوقت قد فات اليوم، جدول للغد
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // حساب الوقت المتبقي
    const timeUntilReport = scheduledTime - now;
    
    // جدولة التقرير
    setTimeout(() => {
        generateDailyReport();
        // جدولة تقرير الغد
        scheduleDailyReport();
    }, timeUntilReport);
}

// تحديث إعدادات بطاقة الاستثمار
function updateInvestmentCardSettings(newSettings) {
    investmentCardSettings = { ...investmentCardSettings, ...newSettings };
    
    // حفظ الإعدادات
    localStorage.setItem('investmentCardSettings', JSON.stringify(investmentCardSettings));
    
    // إعادة جدولة التقرير اليومي إذا تم تغيير الإعدادات
    if (investmentCardSettings.enableDailyReport) {
        scheduleDailyReport();
    }
}

// إضافة مستمع أحداث لتحميل النظام
document.addEventListener('DOMContentLoaded', () => {
    // تهيئة نظام بطاقة الاستثمار
    initInvestmentCardSystem();
    
    // جدولة التقرير اليومي
    scheduleDailyReport();
});

// إضافة أدوات التصدير العامة
window.investmentCardSystem = {
    updateSettings: updateInvestmentCardSettings,
    generateDailyReport: generateDailyReport,
    calculateProfitProjection: calculateProfitProjection,
    createCustomInvestmentPlan: createCustomInvestmentPlan
};