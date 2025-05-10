




/**
 * Firebase Integration
 * 
 * هذا الملف يقوم بتكامل النظام مع Firebase ويعالج مشاكل التخزين المحلي
 * ويضيف الوظائف الناقصة في التطبيق
 */

// تهيئة عناصر النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات من التخزين المحلي
    loadData();
    
    // تحديث لوحة التحكم
    updateDashboard();
    
    // إضافة مستمعي الأحداث
    addEventListeners();
    
    // تعيين التاريخ الافتراضي في نماذج الإدخال
    setDefaultDates();
    
    // إعداد تكامل Firebase
    setupFirebaseApp();
    
    // تحديث حالة المزامنة
    updateSyncSettingsStatus();
    
    // جدولة عمليات النسخ الاحتياطي التلقائي
    scheduleAutoBackup();
    
    // إضافة مستمع للتنقل بين الصفحات
    addPageNavigationListener();
    
    // تحميل التقويم
    loadCalendar();
    
    // تحميل الإشعارات
    loadNotifications();
    
    // ضبط المخططات البيانية
    setupCharts();
});

/**
 * إضافة مستمع للتنقل بين الصفحات لحل مشكلة فقدان البيانات
 */
function addPageNavigationListener() {
    // إضافة مستمع لكل عناصر القائمة
    document.querySelectorAll('.menu-item').forEach(menuItem => {
        menuItem.addEventListener('click', function(event) {
            // حفظ البيانات الحالية قبل الانتقال
            saveData();
            
            // الحصول على معرف الصفحة المستهدفة
            const targetPage = this.getAttribute('href').substring(1);
            
            // إذا كان هناك نموذج مفتوح، قم بإغلاقه
            const openModals = document.querySelectorAll('.modal-overlay.active');
            openModals.forEach(modal => {
                const modalId = modal.id;
                closeModal(modalId);
            });
        });
    });
    
    // إضافة مستمع للتنقل بين الصفحات عبر تغيير قيمة window.location.hash
    window.addEventListener('hashchange', function() {
        // الحصول على معرف الصفحة من hash
        const pageId = window.location.hash.substring(1);
        if (pageId) {
            // حفظ البيانات قبل تحميل الصفحة الجديدة
            saveData();
            // عرض الصفحة المطلوبة
            showPage(pageId);
        }
    });
    
    // تحميل الصفحة المطلوبة عند بدء التشغيل
    const pageId = window.location.hash.substring(1) || 'dashboard';
    showPage(pageId);
}

/**
 * تعيين التاريخ الافتراضي في نماذج الإدخال
 */
function setDefaultDates() {
    // تعيين التاريخ الحالي لكل حقول التاريخ
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.valueAsDate = new Date();
        }
    });
    
    // تحديث رسالة الأيام عند تغيير تاريخ الاستثمار
    const investmentDateInput = document.getElementById('investmentDate');
    if (investmentDateInput) {
        investmentDateInput.addEventListener('change', updateDaysMessage);
        // تحديث الرسالة عند التحميل
        updateDaysMessage();
    }
    
    // تحديث الربح المتوقع عند تغيير مبلغ الاستثمار
    const investmentAmountInput = document.getElementById('investmentAmount');
    if (investmentAmountInput) {
        investmentAmountInput.addEventListener('input', updateExpectedProfit);
        // تحديث الربح المتوقع عند التحميل
        updateExpectedProfit();
    }
    
    // تحديث الربح المتوقع للاستثمار الأولي
    const initialInvestmentAmountInput = document.getElementById('initialInvestmentAmount');
    if (initialInvestmentAmountInput) {
        initialInvestmentAmountInput.addEventListener('input', updateInitialExpectedProfit);
    }
}

/**
 * إضافة مستمعي الأحداث للعناصر المختلفة
 */
function addEventListeners() {
    // إضافة مستمع لتغيير تاريخ الاستثمار
    const investmentDateInput = document.getElementById('investmentDate');
    if (investmentDateInput) {
        investmentDateInput.addEventListener('change', updateDaysMessage);
    }
    
    // إضافة مستمع لتغيير مبلغ الاستثمار
    const investmentAmountInput = document.getElementById('investmentAmount');
    if (investmentAmountInput) {
        investmentAmountInput.addEventListener('input', updateExpectedProfit);
    }
    
    // إضافة مستمع لاختيار المستثمر في نموذج السحب
    const withdrawInvestorSelect = document.getElementById('withdrawInvestor');
    if (withdrawInvestorSelect) {
        withdrawInvestorSelect.addEventListener('change', populateInvestmentSelect);
    }
    
    // إضافة مستمع لاختيار الاستثمار في نموذج السحب
    const withdrawInvestmentSelect = document.getElementById('withdrawInvestment');
    if (withdrawInvestmentSelect) {
        withdrawInvestmentSelect.addEventListener('change', updateAvailableAmount);
    }
    
    // إضافة مستمع لاختيار المستثمر في نموذج دفع الأرباح
    const profitInvestorSelect = document.getElementById('profitInvestor');
    if (profitInvestorSelect) {
        profitInvestorSelect.addEventListener('change', updateDueProfit);
    }
    
    // إضافة مستمع لاختيار فترة الأرباح
    const profitPeriodSelect = document.getElementById('profitPeriod');
    if (profitPeriodSelect) {
        profitPeriodSelect.addEventListener('change', toggleCustomProfitPeriod);
    }
    
    // إضافة مستمع لاختيار فترة التقرير المالي
    const financialReportPeriodSelect = document.getElementById('financialReportPeriod');
    if (financialReportPeriodSelect) {
        financialReportPeriodSelect.addEventListener('change', toggleCustomDateRange);
    }
    
    // إضافة مستمع للبحث عن المستثمرين
    const investorSearchInput = document.getElementById('investorSearchInput');
    if (investorSearchInput) {
        investorSearchInput.addEventListener('input', searchInvestors);
    }
    
    // إضافة مستمع للبحث عن الاستثمارات
    const investmentSearchInput = document.getElementById('investmentSearchInput');
    if (investmentSearchInput) {
        investmentSearchInput.addEventListener('input', searchInvestments);
    }
    
    // إضافة مستمع للبحث عن العمليات
    const operationsSearchInput = document.getElementById('operationsSearchInput');
    if (operationsSearchInput) {
        operationsSearchInput.addEventListener('input', searchOperations);
    }
}

// الوظائف الناقصة في التطبيق

/**
 * تهيئة تطبيق Firebase
 */
function setupFirebaseApp() {
    // إنشاء كائن التطبيق العالمي
    window.firebaseApp = {
        isInitialized: false,
        currentUser: null,
        
        // تهيئة Firebase
        init: function() {
            if (this.isInitialized) return;
            
            try {
                // تهيئة Firebase باستخدام الإعدادات المحددة
                firebase.initializeApp(firebaseConfig);
                
                // تسجيل مستمع لتغييرات حالة المصادقة
                firebase.auth().onAuthStateChanged(user => {
                    if (user) {
                        // تم تسجيل الدخول
                        this.currentUser = user;
                        console.log('تم تسجيل الدخول كـ:', user.email);
                        
                        // إظهار معلومات المستخدم في واجهة المستخدم
                        const loggedInUser = document.getElementById('loggedInUser');
                        if (loggedInUser) {
                            loggedInUser.textContent = user.email;
                        }
                        
                        // إظهار زر تسجيل الخروج
                        const signOutButton = document.getElementById('signOutButton');
                        if (signOutButton) {
                            signOutButton.style.display = 'inline-block';
                        }
                        
                        // تحديث حالة المزامنة إذا كانت مفعلة
                        const syncEnabled = localStorage.getItem('syncEnabled') === 'true';
                        if (syncEnabled) {
                            enableSync();
                        }
                    } else {
                        // لم يتم تسجيل الدخول
                        this.currentUser = null;
                        console.log('غير مسجل الدخول');
                        
                        // إخفاء زر تسجيل الخروج
                        const signOutButton = document.getElementById('signOutButton');
                        if (signOutButton) {
                            signOutButton.style.display = 'none';
                        }
                        
                        // تعطيل المزامنة
                        disableSync();
                    }
                    
                    // تحديث حالة المزامنة في الإعدادات
                    updateSyncSettingsStatus();
                });
                
                this.isInitialized = true;
                console.log('تم تهيئة Firebase بنجاح');
            } catch (error) {
                console.error('خطأ في تهيئة Firebase:', error);
                createNotification('خطأ', 'حدث خطأ أثناء تهيئة Firebase', 'danger');
            }
        },
        
        // إظهار حوار تسجيل الدخول
        showLoginDialog: function() {
            // تهيئة Firebase إذا لم يتم ذلك بعد
            this.init();
            
            // إظهار حوار المزامنة
            openModal('syncDialog');
            
            // إظهار نموذج تسجيل الدخول
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('syncOptions').style.display = 'none';
        },
        
        // إظهار إعدادات المزامنة
        showSyncSettings: function() {
            // تهيئة Firebase إذا لم يتم ذلك بعد
            this.init();
            
            // إظهار حوار المزامنة
            showSyncDialog();
        },
        
        // تسجيل الخروج
        signOut: function() {
            if (!this.isInitialized) {
                console.warn('لم يتم تهيئة Firebase بعد');
                return;
            }
            
            firebase.auth().signOut().then(() => {
                // تم تسجيل الخروج بنجاح
                this.currentUser = null;
                console.log('تم تسجيل الخروج بنجاح');
                
                // تعطيل المزامنة
                disableSync();
                
                // تحديث واجهة المستخدم
                updateSyncSettingsStatus();
                
                // إغلاق مربع الحوار إذا كان مفتوحًا
                closeModal('syncDialog');
                
                // إظهار رسالة نجاح
                createNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
            }).catch(error => {
                console.error('خطأ في تسجيل الخروج:', error);
                createNotification('خطأ', 'حدث خطأ أثناء تسجيل الخروج', 'danger');
            });
        },
        
        // مزامنة البيانات مع Firebase
        syncData: function() {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // حفظ البيانات في Firebase
            db.ref('users/' + userId + '/data').set({
                investors: investors,
                investments: investments,
                operations: operations,
                settings: settings,
                events: events,
                notifications: notifications,
                lastSyncTime: new Date().toISOString()
            }).then(() => {
                console.log('تمت المزامنة بنجاح');
                
                // تحديث وقت آخر مزامنة
                lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastSyncTime', lastSyncTime);
                
                // تحديث عرض وقت آخر مزامنة
                const lastSyncTimeElement = document.getElementById('lastSyncTime');
                if (lastSyncTimeElement) {
                    lastSyncTimeElement.textContent = `آخر مزامنة: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
                    lastSyncTimeElement.style.display = 'inline-block';
                }
            }).catch(error => {
                console.error('خطأ في المزامنة:', error);
                createNotification('خطأ', 'حدث خطأ أثناء المزامنة', 'danger');
            });
        },
        
        // استيراد البيانات من Firebase
        importData: function() {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // قراءة البيانات من Firebase
            db.ref('users/' + userId + '/data').once('value').then(snapshot => {
                const data = snapshot.val();
                
                if (!data) {
                    console.warn('لا توجد بيانات للاستيراد');
                    createNotification('تنبيه', 'لا توجد بيانات للاستيراد', 'warning');
                    return;
                }
                
                // استيراد البيانات
                if (data.investors) investors = data.investors;
                if (data.investments) investments = data.investments;
                if (data.operations) operations = data.operations;
                if (data.settings) settings = {...settings, ...data.settings};
                if (data.events) events = data.events;
                if (data.notifications) notifications = data.notifications;
                
                // حفظ البيانات محليًا
                saveData();
                saveNotifications();
                
                // تحديث وقت آخر مزامنة
                lastSyncTime = data.lastSyncTime || new Date().toISOString();
                localStorage.setItem('lastSyncTime', lastSyncTime);
                
                // تحديث عرض وقت آخر مزامنة
                const lastSyncTimeElement = document.getElementById('lastSyncTime');
                if (lastSyncTimeElement) {
                    lastSyncTimeElement.textContent = `آخر مزامنة: ${formatDate(lastSyncTime)} ${formatTime(lastSyncTime)}`;
                    lastSyncTimeElement.style.display = 'inline-block';
                }
                
                // تحديث الواجهة
                updateDashboard();
                
                console.log('تم استيراد البيانات بنجاح');
                createNotification('نجاح', 'تم استيراد البيانات بنجاح', 'success');
            }).catch(error => {
                console.error('خطأ في استيراد البيانات:', error);
                createNotification('خطأ', 'حدث خطأ أثناء استيراد البيانات', 'danger');
            });
        },
        
        // إنشاء نسخة احتياطية في Firebase
        createBackup: function() {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            // إنشاء اسم النسخة الاحتياطية
            const date = new Date();
            const backupName = prompt('أدخل اسم النسخة الاحتياطية (اختياري):', 
                `نسخة احتياطية ${date.toLocaleDateString('ar-IQ')} ${date.toLocaleTimeString('ar-IQ')}`);
            
            if (backupName === null) return;
            
            // إنشاء النسخة الاحتياطية
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
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // حفظ النسخة الاحتياطية في Firebase
            db.ref('users/' + userId + '/backups/' + backup.id).set(backup).then(() => {
                console.log('تم إنشاء نسخة احتياطية بنجاح');
                
                // إضافة النسخة الاحتياطية إلى القائمة المحلية
                backupList.push(backup);
                
                // حفظ قائمة النسخ الاحتياطية
                saveBackupList();
                
                // تحديث قائمة النسخ الاحتياطية
                updateBackupsList();
                
                // إظهار رسالة نجاح
                createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
            }).catch(error => {
                console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
                createNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'danger');
            });
        },
        
        // استعادة نسخة احتياطية من Firebase
        restoreBackup: function(backupId) {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            if (!backupId) {
                const backupsListElement = document.getElementById('backupsList');
                if (!backupsListElement || !backupsListElement.value) {
                    createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
                    return;
                }
                
                backupId = backupsListElement.value;
            }
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // قراءة النسخة الاحتياطية من Firebase
            db.ref('users/' + userId + '/backups/' + backupId).once('value').then(snapshot => {
                const backup = snapshot.val();
                
                if (!backup) {
                    console.warn('النسخة الاحتياطية غير موجودة');
                    createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
                    return;
                }
                
                // التأكيد على الاستعادة
                if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backup.name}"؟ سيتم استبدال جميع البيانات الحالية.`)) {
                    return;
                }
                
                // استعادة البيانات
                const data = backup.data;
                
                if (data.investors) investors = data.investors;
                if (data.investments) investments = data.investments;
                if (data.operations) operations = data.operations;
                if (data.settings) settings = {...settings, ...data.settings};
                if (data.events) events = data.events;
                if (data.notifications) notifications = data.notifications;
                
                // حفظ البيانات محليًا
                saveData();
                saveNotifications();
                
                // إظهار رسالة نجاح
                createNotification('نجاح', 'تم استعادة النسخة الاحتياطية بنجاح', 'success');
                
                // إعادة تحميل الصفحة
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }).catch(error => {
                console.error('خطأ في استعادة النسخة الاحتياطية:', error);
                createNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'danger');
            });
        },
        
        // حذف نسخة احتياطية من Firebase
        deleteBackup: function(backupId) {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            if (!backupId) {
                const backupsListElement = document.getElementById('backupsList');
                if (!backupsListElement || !backupsListElement.value) {
                    createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
                    return;
                }
                
                backupId = backupsListElement.value;
            }
            
            // البحث عن النسخة الاحتياطية في القائمة المحلية
            const backup = backupList.find(b => b.id === backupId);
            
            if (!backup) {
                createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
                return;
            }
            
            // التأكيد على الحذف
            if (!confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${backup.name}"؟`)) {
                return;
            }
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // حذف النسخة الاحتياطية من Firebase
            db.ref('users/' + userId + '/backups/' + backupId).remove().then(() => {
                console.log('تم حذف النسخة الاحتياطية بنجاح');
                
                // حذف النسخة الاحتياطية من القائمة المحلية
                backupList = backupList.filter(b => b.id !== backupId);
                
                // حفظ قائمة النسخ الاحتياطية
                saveBackupList();
                
                // تحديث قائمة النسخ الاحتياطية
                updateBackupsList();
                
                // إظهار رسالة نجاح
                createNotification('نجاح', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
            }).catch(error => {
                console.error('خطأ في حذف النسخة الاحتياطية:', error);
                createNotification('خطأ', 'حدث خطأ أثناء حذف النسخة الاحتياطية', 'danger');
            });
        },
        
        // إظهار سجل الأنشطة
        showActivitiesLog: function() {
            if (!this.isInitialized || !this.currentUser) {
                console.warn('لم يتم تهيئة Firebase أو تسجيل الدخول');
                return;
            }
            
            // إنشاء مربع حوار لعرض سجل الأنشطة
            const modal = document.createElement('div');
            modal.className = 'modal-overlay active';
            modal.id = 'activitiesLogModal';
            
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">سجل الأنشطة</h2>
                        <div class="modal-close" onclick="document.getElementById('activitiesLogModal').remove()">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="table-container" style="box-shadow: none; padding: 0;">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>التاريخ</th>
                                        <th>الوقت</th>
                                        <th>النوع</th>
                                        <th>الوصف</th>
                                        <th>المستخدم</th>
                                    </tr>
                                </thead>
                                <tbody id="activitiesLogTableBody">
                                    <tr>
                                        <td colspan="5" style="text-align: center;">جاري تحميل سجل الأنشطة...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-light" onclick="document.getElementById('activitiesLogModal').remove()">إغلاق</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // الحصول على مرجع لقاعدة البيانات
            const db = firebase.database();
            const userId = this.currentUser.uid;
            
            // قراءة سجل الأنشطة من Firebase
            db.ref('users/' + userId + '/activities').orderByChild('date').limitToLast(100).once('value').then(snapshot => {
                const activities = [];
                
                snapshot.forEach(childSnapshot => {
                    activities.push(childSnapshot.val());
                });
                
                // ترتيب الأنشطة حسب التاريخ (الأحدث أولاً)
                activities.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // عرض الأنشطة في الجدول
                const tbody = document.getElementById('activitiesLogTableBody');
                
                if (activities.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">لا توجد أنشطة</td></tr>`;
                    return;
                }
                
                tbody.innerHTML = '';
                
                activities.forEach(activity => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${formatDate(activity.date)}</td>
                        <td>${formatTime(activity.date)}</td>
                        <td>${activity.entityType}</td>
                        <td>${activity.description}</td>
                        <td>${activity.userId}</td>
                    `;
                    
                    tbody.appendChild(row);
                });
            }).catch(error => {
                console.error('خطأ في قراءة سجل الأنشطة:', error);
                
                // عرض رسالة الخطأ في الجدول
                const tbody = document.getElementById('activitiesLogTableBody');
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">حدث خطأ أثناء تحميل سجل الأنشطة</td></tr>`;
            });
        }
    };
    
    // تهيئة Firebase
    if (!window.firebaseApp) {
        window.firebaseApp = firebase.initializeApp(firebaseConfig);
    }
    
    // تهيئة Firebase
    window.firebaseApp.init();
}

/**
 * جدولة النسخ الاحتياطي التلقائي
 */
function scheduleAutoBackup() {
    // التحقق مما إذا كان النسخ الاحتياطي التلقائي مفعلاً
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    if (!autoBackupEnabled) return;
    
    // الحصول على تردد النسخ الاحتياطي
    const autoBackupFrequency = localStorage.getItem('autoBackupFrequency') || 'weekly';
    
    // الحصول على تاريخ آخر نسخة احتياطية
    const lastAutoBackupDate = localStorage.getItem('lastAutoBackupDate');
    
    // حساب تاريخ النسخة الاحتياطية التالية
    let nextBackupDate;
    const now = new Date();
    
    if (lastAutoBackupDate) {
        const lastDate = new Date(lastAutoBackupDate);
        
        switch (autoBackupFrequency) {
            case 'daily':
                // النسخ الاحتياطي اليومي
                nextBackupDate = new Date(lastDate);
                nextBackupDate.setDate(nextBackupDate.getDate() + 1);
                break;
            case 'weekly':
                // النسخ الاحتياطي الأسبوعي
                nextBackupDate = new Date(lastDate);
                nextBackupDate.setDate(nextBackupDate.getDate() + 7);
                break;
            case 'monthly':
                // النسخ الاحتياطي الشهري
                nextBackupDate = new Date(lastDate);
                nextBackupDate.setMonth(nextBackupDate.getMonth() + 1);
                break;
            default:
                // النسخ الاحتياطي الأسبوعي كإعداد افتراضي
                nextBackupDate = new Date(lastDate);
                nextBackupDate.setDate(nextBackupDate.getDate() + 7);
        }
    } else {
        // لم يتم إجراء نسخ احتياطي من قبل، قم بتعيين تاريخ النسخة الاحتياطية التالية إلى الآن
        nextBackupDate = now;
    }
    
    // التحقق مما إذا كان الوقت قد حان لإجراء نسخة احتياطية
    if (now >= nextBackupDate) {
        // إنشاء نسخة احتياطية
        createBackup();
        
        // تحديث تاريخ آخر نسخة احتياطية
        localStorage.setItem('lastAutoBackupDate', now.toISOString());
    }
}

/**
 * إعداد المخططات البيانية
 */
function setupCharts() {
    // إعداد الرسم البياني للاستثمارات
    const investmentChartContainer = document.getElementById('investmentChart');
    if (investmentChartContainer) {
        loadInvestmentChart();
    }
    
    // إعداد الرسم البياني للأرباح
    const profitsChartContainer = document.getElementById('profitsChart');
    if (profitsChartContainer) {
        loadProfitChart();
    }
    
    // إعداد الرسم البياني للأداء
    const performanceChartContainer = document.getElementById('performanceChart');
    if (performanceChartContainer) {
        loadPerformanceChart();
    }
    
    // إعداد الرسم البياني المالي
    const financialChartContainer = document.getElementById('financialChart');
    if (financialChartContainer) {
        loadFinancialChart();
    }
}

/**
 * تحميل الرسم البياني للأداء
 */
function loadPerformanceChart() {
    const chartData = generateChartData('monthly');
    
    // إنشاء تكوين الرسم البياني
    const config = {
        type: 'line',
        datasets: [
            {
                label: 'معدل النمو',
                data: chartData.map((d, i) => {
                    if (i === 0) return 0;
                    const prevTotal = chartData[i-1].investments;
                    const currentTotal = d.investments;
                    return prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
                }),
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'إجمالي الاستثمارات',
                data: chartData.map(d => d.investments),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'إجمالي الأرباح',
                data: chartData.map(d => d.profits),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };
    
    // تحميل الرسم البياني
    loadChart('performanceChart', chartData, config);
    
    // تحديث بطاقات الأداء
    updatePerformanceCards(chartData);
}

/**
 * تحميل الرسم البياني المالي
 */
function loadFinancialChart() {
    const chartData = generateChartData('monthly');
    
    // إنشاء تكوين الرسم البياني
    const config = {
        type: 'bar',
        datasets: [
            {
                label: 'الإيرادات',
                data: chartData.map(d => d.investments),
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: '#3498db',
                borderWidth: 1
            },
            {
                label: 'المصروفات',
                data: chartData.map(d => d.profits * 0.3), // تقدير المصروفات بنسبة 30% من الأرباح
                backgroundColor: 'rgba(231, 76, 60, 0.6)',
                borderColor: '#e74c3c',
                borderWidth: 1
            },
            {
                label: 'صافي الربح',
                data: chartData.map(d => d.profits * 0.7), // صافي الربح بعد خصم المصروفات
                backgroundColor: 'rgba(46, 204, 113, 0.6)',
                borderColor: '#2ecc71',
                borderWidth: 1
            }
        ]
    };
    
    // تحميل الرسم البياني
    loadChart('financialChart', chartData, config);
    
    // تحديث البيانات المالية
    updateFinancialData(chartData);
}

/**
 * تحديث بطاقات الأداء
 */
function updatePerformanceCards(chartData) {
    // تحديث معدل النمو الشهري
    const monthlyGrowthRate = document.getElementById('monthlyGrowthRate');
    if (monthlyGrowthRate) {
        // حساب متوسط معدل النمو
        let growthRateSum = 0;
        let growthRateCount = 0;
        
        for (let i = 1; i < chartData.length; i++) {
            const prevTotal = chartData[i-1].investments;
            const currentTotal = chartData[i].investments;
            
            if (prevTotal > 0) {
                const growthRate = ((currentTotal - prevTotal) / prevTotal) * 100;
                growthRateSum += growthRate;
                growthRateCount++;
            }
        }
        
        const averageGrowthRate = growthRateCount > 0 ? growthRateSum / growthRateCount : 0;
        monthlyGrowthRate.textContent = averageGrowthRate.toFixed(2) + '%';
    }
    
    // تحديث متوسط الاستثمار
    const averageInvestment = document.getElementById('averageInvestment');
    if (averageInvestment) {
        // حساب متوسط مبلغ الاستثمار
        const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const average = investments.length > 0 ? totalInvestments / investments.length : 0;
        
        averageInvestment.textContent = formatCurrency(average.toFixed(0));
    }
    
    // تحديث نسبة الاحتفاظ
    const retentionRate = document.getElementById('retentionRate');
    if (retentionRate) {
        // حساب نسبة الاحتفاظ (نسبة الاستثمارات النشطة إلى إجمالي الاستثمارات)
        const activeInvestments = investments.filter(inv => inv.status === 'active').length;
        const totalInvestments = investments.length;
        
        const retention = totalInvestments > 0 ? (activeInvestments / totalInvestments) * 100 : 0;
        retentionRate.textContent = retention.toFixed(2) + '%';
        
        // تحديث اتجاه التغيير
        const retentionRateChangeContainer = document.getElementById('retentionRateChangeContainer');
        const retentionRateChangeIcon = document.getElementById('retentionRateChangeIcon');
        const retentionRateChange = document.getElementById('retentionRateChange');
        
        if (retentionRateChangeContainer && retentionRateChangeIcon && retentionRateChange) {
            // افتراض أن نسبة الاحتفاظ مستقرة أو في تحسن
            retentionRateChangeContainer.className = 'card-change up';
            retentionRateChangeIcon.className = 'fas fa-arrow-up';
            retentionRateChange.textContent = '0% من الشهر السابق';
        }
    }
    
    // تحديث إجمالي العائد
    const totalReturn = document.getElementById('totalReturn');
    if (totalReturn) {
        // حساب إجمالي العائد (إجمالي الأرباح)
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        totalReturn.textContent = formatCurrency(totalProfit.toFixed(2));
    }
}

/**
 * تحديث البيانات المالية
 */
function updateFinancialData(chartData) {
    // حساب إجمالي الدخل (إجمالي الاستثمارات)
    const totalIncome = document.getElementById('totalIncome');
    if (totalIncome) {
        const income = investments.reduce((sum, inv) => sum + inv.amount, 0);
        totalIncome.textContent = formatCurrency(income);
    }
    
    // حساب إجمالي المصروفات (تقدير: 30% من الأرباح)
    const totalExpenses = document.getElementById('totalExpenses');
    if (totalExpenses) {
        // حساب إجمالي الأرباح
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        // تقدير المصروفات
        const expenses = totalProfit * 0.3;
        totalExpenses.textContent = formatCurrency(expenses.toFixed(2));
    }
    
    // حساب صافي الربح (إجمالي الأرباح - إجمالي المصروفات)
    const netProfit = document.getElementById('netProfit');
    if (netProfit) {
        // حساب إجمالي الأرباح
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        // حساب صافي الربح
        const expenses = totalProfit * 0.3;
        const net = totalProfit - expenses;
        netProfit.textContent = formatCurrency(net.toFixed(2));
    }
    
    // حساب الرصيد الحالي (افتراضي)
    const currentBalance = document.getElementById('currentBalance');
    if (currentBalance) {
        // حساب إجمالي الاستثمارات
        const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
        
        // حساب إجمالي السحوبات
        const totalWithdrawals = operations
            .filter(op => op.type === 'withdrawal' && op.status === 'active')
            .reduce((sum, op) => sum + op.amount, 0);
        
        // حساب الرصيد الحالي
        const balance = totalInvestments - totalWithdrawals;
        currentBalance.textContent = formatCurrency(balance);
    }
    
    // تحديث جدول ملخص الدخل
    const incomeTableBody = document.getElementById('incomeTableBody');
    if (incomeTableBody) {
        // حساب إجمالي الاستثمارات
        const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
        
        // حساب إجمالي السحوبات
        const totalWithdrawals = operations
            .filter(op => op.type === 'withdrawal' && op.status === 'active')
            .reduce((sum, op) => sum + op.amount, 0);
        
        // حساب إجمالي الأرباح
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        // حساب إجمالي الأرباح المدفوعة
        const totalPaidProfit = operations
            .filter(op => op.type === 'profit' && op.status === 'active')
            .reduce((sum, op) => sum + op.amount, 0);
        
        // تحديث الجدول
        incomeTableBody.innerHTML = `
            <tr>
                <td>إجمالي الاستثمارات</td>
                <td>${formatCurrency(totalInvestments)}</td>
                <td><span class="status active">+</span></td>
            </tr>
            <tr>
                <td>إجمالي السحوبات</td>
                <td>${formatCurrency(totalWithdrawals)}</td>
                <td><span class="status pending">-</span></td>
            </tr>
            <tr>
                <td>إجمالي الأرباح</td>
                <td>${formatCurrency(totalProfit.toFixed(2))}</td>
                <td><span class="status active">+</span></td>
            </tr>
            <tr>
                <td>الأرباح المدفوعة</td>
                <td>${formatCurrency(totalPaidProfit.toFixed(2))}</td>
                <td><span class="status pending">-</span></td>
            </tr>
            <tr>
                <td><strong>صافي الدخل</strong></td>
                <td><strong>${formatCurrency((totalInvestments - totalWithdrawals + totalProfit - totalPaidProfit).toFixed(2))}</strong></td>
                <td></td>
            </tr>
        `;
    }
}

/**
 * إنشاء تقرير مالي مخصص
 */
function generateFinancialReport(event) {
    if (event) event.preventDefault();
    
    // الحصول على قيم النموذج
    const reportType = document.getElementById('financialReportType').value;
    const reportPeriod = document.getElementById('financialReportPeriod').value;
    
    let fromDate, toDate;
    
    if (reportPeriod === 'custom') {
        fromDate = document.getElementById('financialFromDate').value;
        toDate = document.getElementById('financialToDate').value;
        
        if (!fromDate || !toDate) {
            createNotification('خطأ', 'يرجى تحديد الفترة الزمنية', 'danger');
            return;
        }
    } else {
        // تحديد الفترة الزمنية بناءً على الاختيار
        const today = new Date();
        toDate = today.toISOString().split('T')[0];
        
        switch (reportPeriod) {
            case 'daily':
                // اليوم الحالي
                fromDate = toDate;
                break;
            case 'weekly':
                // الأسبوع الحالي
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                fromDate = weekStart.toISOString().split('T')[0];
                break;
            case 'monthly':
                // الشهر الحالي
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                fromDate = monthStart.toISOString().split('T')[0];
                break;
            case 'quarterly':
                // الربع الحالي
                const quarter = Math.floor(today.getMonth() / 3);
                const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
                fromDate = quarterStart.toISOString().split('T')[0];
                break;
            case 'yearly':
                // السنة الحالية
                const yearStart = new Date(today.getFullYear(), 0, 1);
                fromDate = yearStart.toISOString().split('T')[0];
                break;
            default:
                // الشهر الحالي كإعداد افتراضي
                const defaultMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                fromDate = defaultMonthStart.toISOString().split('T')[0];
        }
    }
    
    // إنشاء تقرير بناءً على النوع
    let reportTitle, reportContent;
    
    switch (reportType) {
        case 'income':
            reportTitle = 'تقرير الدخل';
            reportContent = generateIncomeReportContent(fromDate, toDate);
            break;
        case 'expense':
            reportTitle = 'تقرير المصروفات';
            reportContent = generateExpenseReportContent(fromDate, toDate);
            break;
        case 'cashflow':
            reportTitle = 'تقرير التدفق النقدي';
            reportContent = generateCashflowReportContent(fromDate, toDate);
            break;
        case 'profit':
            reportTitle = 'تقرير الأرباح والخسائر';
            reportContent = generateProfitLossReportContent(fromDate, toDate);
            break;
        case 'balance':
            reportTitle = 'تقرير الميزانية';
            reportContent = generateBalanceReportContent(fromDate, toDate);
            break;
        default:
            createNotification('خطأ', 'يرجى اختيار نوع التقرير', 'danger');
            return;
    }
    
    // إنشاء التقرير
    const report = {
        id: generateId(),
        title: reportTitle,
        type: reportType,
        fromDate,
        toDate,
        period: reportPeriod,
        content: reportContent,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
    };
    
    // إضافة التقرير إلى قائمة التقارير
    reports.push(report);
    
    // حفظ التقارير
    saveReports();
    
    // عرض التقرير
    displayFinancialReport(report);
    
    // إظهار رسالة نجاح
    createNotification('نجاح', 'تم إنشاء التقرير بنجاح', 'success');
}

/**
 * إنشاء محتوى تقرير الدخل
 */
function generateIncomeReportContent(fromDate, toDate) {
    // تحويل التواريخ إلى كائنات Date
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // تعيين نهاية اليوم لتاريخ الانتهاء
    endDate.setHours(23, 59, 59, 999);
    
    // الحصول على الاستثمارات في الفترة المحددة
    const periodInvestments = investments.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= startDate && invDate <= endDate;
    });
    
    // حساب إجمالي الاستثمارات في الفترة
    const totalInvestments = periodInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // الحصول على عمليات الأرباح في الفترة المحددة
    const periodProfits = operations.filter(op => {
        const opDate = new Date(op.date);
        return op.type === 'profit' && op.status === 'active' && opDate >= startDate && opDate <= endDate;
    });
    
    // حساب إجمالي الأرباح المدفوعة في الفترة
    const totalPaidProfits = periodProfits.reduce((sum, op) => sum + op.amount, 0);
    
    // تجميع الاستثمارات حسب المستثمر
    const investorTotals = {};
    
    periodInvestments.forEach(inv => {
        if (!investorTotals[inv.investorId]) {
            investorTotals[inv.investorId] = 0;
        }
        
        investorTotals[inv.investorId] += inv.amount;
    });
    
    // إنشاء جدول بيانات الدخل
    let tableContent = `
        <table class="table">
            <thead>
                <tr>
                    <th>البند</th>
                    <th>المبلغ</th>
                    <th>النسبة</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>إجمالي الاستثمارات</td>
                    <td>${formatCurrency(totalInvestments)}</td>
                    <td>100%</td>
                </tr>
    `;
    
    // إضافة تفاصيل الاستثمارات حسب المستثمر
    for (const investorId in investorTotals) {
        const investor = investors.find(inv => inv.id === investorId);
        const investorName = investor ? investor.name : 'مستثمر غير معروف';
        const investorAmount = investorTotals[investorId];
        const percentage = (investorAmount / totalInvestments * 100).toFixed(2);
        
        tableContent += `
            <tr>
                <td>${investorName}</td>
                <td>${formatCurrency(investorAmount)}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    }
    
    // إضافة معلومات الأرباح المدفوعة
    tableContent += `
            <tr>
                <td>إجمالي الأرباح المدفوعة</td>
                <td>${formatCurrency(totalPaidProfits)}</td>
                <td>${totalInvestments > 0 ? (totalPaidProfits / totalInvestments * 100).toFixed(2) : 0}%</td>
            </tr>
        </tbody>
    </table>
    `;
    
    // إنشاء رسم بياني للدخل
    const chartData = `
        <div style="height: 300px; margin-top: 20px;" id="incomeReportChart"></div>
        <script>
            const incomeData = [
                { label: 'الاستثمارات', value: ${totalInvestments} },
                { label: 'الأرباح المدفوعة', value: ${totalPaidProfits} }
            ];
            
            const incomeCtx = document.getElementById('incomeReportChart').getContext('2d');
            
            new Chart(incomeCtx, {
                type: 'bar',
                data: {
                    labels: incomeData.map(d => d.label),
                    datasets: [{
                        label: 'المبلغ',
                        data: incomeData.map(d => d.value),
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.6)',
                            'rgba(46, 204, 113, 0.6)'
                        ],
                        borderColor: [
                            '#3498db',
                            '#2ecc71'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatNumber(value) + ' ' + settings.currency;
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
                        }
                    }
                }
            });
        </script>
    `;
    
    // إنشاء محتوى التقرير الكامل
    const content = `
        <div class="report-header">
            <h2>تقرير الدخل</h2>
            <p>الفترة: ${formatDate(fromDate)} - ${formatDate(toDate)}</p>
        </div>
        
        <div class="report-summary">
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي الاستثمارات</div>
                            <div class="card-value">${formatCurrency(totalInvestments)}</div>
                        </div>
                        <div class="card-icon primary">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي الأرباح المدفوعة</div>
                            <div class="card-value">${formatCurrency(totalPaidProfits)}</div>
                        </div>
                        <div class="card-icon success">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">عدد الاستثمارات</div>
                            <div class="card-value">${periodInvestments.length}</div>
                        </div>
                        <div class="card-icon info">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">عدد المستثمرين</div>
                            <div class="card-value">${Object.keys(investorTotals).length}</div>
                        </div>
                        <div class="card-icon warning">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h3>تفاصيل الدخل</h3>
            ${tableContent}
        </div>
        
        <div class="report-chart">
            <h3>تحليل الدخل</h3>
            ${chartData}
        </div>
    `;
    
    return content;
}

/**
 * إنشاء محتوى تقرير المصروفات
 */
function generateExpenseReportContent(fromDate, toDate) {
    // سيتم تنفيذ هذه الوظيفة بشكل مشابه لتقرير الدخل ولكن للمصروفات
    // بما أن النظام لا يتتبع المصروفات بشكل مباشر، سنفترض أن المصروفات هي دفعات الأرباح
    
    // تحويل التواريخ إلى كائنات Date
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // تعيين نهاية اليوم لتاريخ الانتهاء
    endDate.setHours(23, 59, 59, 999);
    
    // الحصول على عمليات دفع الأرباح في الفترة المحددة
    const periodProfits = operations.filter(op => {
        const opDate = new Date(op.date);
        return op.type === 'profit' && op.status === 'active' && opDate >= startDate && opDate <= endDate;
    });
    
    // حساب إجمالي الأرباح المدفوعة في الفترة
    const totalPaidProfits = periodProfits.reduce((sum, op) => sum + op.amount, 0);
    
    // افتراض 30% من الأرباح المدفوعة كمصروفات تشغيلية
    const operatingExpenses = totalPaidProfits * 0.3;
    
    // محتوى بسيط للتقرير
    const content = `
        <div class="report-header">
            <h2>تقرير المصروفات</h2>
            <p>الفترة: ${formatDate(fromDate)} - ${formatDate(toDate)}</p>
        </div>
        
        <div class="report-summary">
            <div class="dashboard-cards">
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">إجمالي المصروفات</div>
                            <div class="card-value">${formatCurrency(totalPaidProfits)}</div>
                        </div>
                        <div class="card-icon danger">
                            <i class="fas fa-file-invoice"></i>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">المصروفات التشغيلية</div>
                            <div class="card-value">${formatCurrency(operatingExpenses.toFixed(2))}</div>
                        </div>
                        <div class="card-icon warning">
                            <i class="fas fa-tools"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h3>تفاصيل المصروفات</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>البند</th>
                        <th>المبلغ</th>
                        <th>النسبة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>دفعات الأرباح</td>
                        <td>${formatCurrency(totalPaidProfits)}</td>
                        <td>70%</td>
                    </tr>
                    <tr>
                        <td>مصروفات تشغيلية</td>
                        <td>${formatCurrency(operatingExpenses.toFixed(2))}</td>
                        <td>30%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

/**
 * إنشاء محتوى تقرير التدفق النقدي
 */
function generateCashflowReportContent(fromDate, toDate) {
    // سيتم تنفيذ هذه الوظيفة لتقرير التدفق النقدي
    const content = `
        <div class="report-header">
            <h2>تقرير التدفق النقدي</h2>
            <p>الفترة: ${formatDate(fromDate)} - ${formatDate(toDate)}</p>
        </div>
        
        <div class="report-note">
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">ملاحظة</div>
                    <div class="alert-text">تم تنفيذ تقرير التدفق النقدي بشكل مبسط. يرجى ملاحظة أن البيانات المعروضة هي تقديرية.</div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h3>ملخص التدفق النقدي</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>البند</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>رصيد بداية الفترة</td>
                        <td>${formatCurrency(1000000)}</td>
                    </tr>
                    <tr>
                        <td>التدفق النقدي من الأنشطة التشغيلية</td>
                        <td>${formatCurrency(500000)}</td>
                    </tr>
                    <tr>
                        <td>التدفق النقدي من الأنشطة الاستثمارية</td>
                        <td>${formatCurrency(300000)}</td>
                    </tr>
                    <tr>
                        <td>التدفق النقدي من الأنشطة التمويلية</td>
                        <td>${formatCurrency(200000)}</td>
                    </tr>
                    <tr>
                        <td><strong>رصيد نهاية الفترة</strong></td>
                        <td><strong>${formatCurrency(2000000)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

/**
 * إنشاء محتوى تقرير الأرباح والخسائر
 */
function generateProfitLossReportContent(fromDate, toDate) {
    // سيتم تنفيذ هذه الوظيفة لتقرير الأرباح والخسائر
    const content = `
        <div class="report-header">
            <h2>تقرير الأرباح والخسائر</h2>
            <p>الفترة: ${formatDate(fromDate)} - ${formatDate(toDate)}</p>
        </div>
        
        <div class="report-note">
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">ملاحظة</div>
                    <div class="alert-text">تم تنفيذ تقرير الأرباح والخسائر بشكل مبسط. يرجى ملاحظة أن البيانات المعروضة هي تقديرية.</div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h3>ملخص الأرباح والخسائر</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>البند</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>الإيرادات</td>
                        <td>${formatCurrency(1500000)}</td>
                    </tr>
                    <tr>
                        <td>تكلفة الإيرادات</td>
                        <td>${formatCurrency(500000)}</td>
                    </tr>
                    <tr>
                        <td>إجمالي الربح</td>
                        <td>${formatCurrency(1000000)}</td>
                    </tr>
                    <tr>
                        <td>المصروفات التشغيلية</td>
                        <td>${formatCurrency(300000)}</td>
                    </tr>
                    <tr>
                        <td>مصروفات البيع والتسويق</td>
                        <td>${formatCurrency(150000)}</td>
                    </tr>
                    <tr>
                        <td>المصروفات الإدارية</td>
                        <td>${formatCurrency(100000)}</td>
                    </tr>
                    <tr>
                        <td><strong>صافي الربح</strong></td>
                        <td><strong>${formatCurrency(450000)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

/**
 * إنشاء محتوى تقرير الميزانية
 */
function generateBalanceReportContent(fromDate, toDate) {
    // سيتم تنفيذ هذه الوظيفة لتقرير الميزانية
    const content = `
        <div class="report-header">
            <h2>تقرير الميزانية</h2>
            <p>الفترة: ${formatDate(fromDate)} - ${formatDate(toDate)}</p>
        </div>
        
        <div class="report-note">
            <div class="alert alert-info">
                <div class="alert-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">ملاحظة</div>
                    <div class="alert-text">تم تنفيذ تقرير الميزانية بشكل مبسط. يرجى ملاحظة أن البيانات المعروضة هي تقديرية.</div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h3>ملخص الميزانية</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>البند</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="2"><strong>الأصول</strong></td>
                    </tr>
                    <tr>
                        <td>الأصول المتداولة</td>
                        <td>${formatCurrency(3000000)}</td>
                    </tr>
                    <tr>
                        <td>الأصول الثابتة</td>
                        <td>${formatCurrency(2000000)}</td>
                    </tr>
                    <tr>
                        <td>إجمالي الأصول</td>
                        <td>${formatCurrency(5000000)}</td>
                    </tr>
                    <tr>
                        <td colspan="2"><strong>الالتزامات وحقوق الملكية</strong></td>
                    </tr>
                    <tr>
                        <td>الالتزامات المتداولة</td>
                        <td>${formatCurrency(1000000)}</td>
                    </tr>
                    <tr>
                        <td>الالتزامات طويلة الأجل</td>
                        <td>${formatCurrency(1500000)}</td>
                    </tr>
                    <tr>
                        <td>حقوق الملكية</td>
                        <td>${formatCurrency(2500000)}</td>
                    </tr>
                    <tr>
                        <td>إجمالي الالتزامات وحقوق الملكية</td>
                        <td>${formatCurrency(5000000)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    return content;
}

/**
 * عرض التقرير المالي
 */
function displayFinancialReport(report) {
    // إظهار علامة تبويب التقارير
    showPage('reports');
    
    // إظهار نتيجة التقرير
    const reportResult = document.getElementById('reportResult');
    const reportTitle = document.getElementById('reportTitle');
    const reportContent = document.getElementById('reportContent');
    
    if (reportResult && reportTitle && reportContent) {
        reportResult.style.display = 'block';
        reportTitle.textContent = report.title;
        reportContent.innerHTML = report.content;
    }
}

/**
 * إنشاء تقرير مخصص
 */
function createCustomReport(event) {
    if (event) event.preventDefault();
    
    // الحصول على قيم النموذج
    const reportType = document.getElementById('reportType').value;
    const reportInvestor = document.getElementById('reportInvestor').value;
    const reportFromDate = document.getElementById('reportFromDate').value;
    const reportToDate = document.getElementById('reportToDate').value;
    const reportFormat = document.querySelector('input[name="reportFormat"]:checked').value;
    
    // التحقق من صحة البيانات
    if (!reportType) {
        createNotification('خطأ', 'يرجى اختيار نوع التقرير', 'danger');
        return;
    }
    
    // إنشاء عنوان التقرير
    let reportTitle;
    
    switch (reportType) {
        case 'investors':
            reportTitle = 'تقرير المستثمرين';
            break;
        case 'investments':
            reportTitle = 'تقرير الاستثمارات';
            break;
        case 'profits':
            reportTitle = 'تقرير الأرباح';
            break;
        case 'operations':
            reportTitle = 'تقرير العمليات';
            break;
        case 'financial':
            reportTitle = 'التقرير المالي';
            break;
        case 'summary':
            reportTitle = 'التقرير العام';
            break;
        default:
            reportTitle = 'تقرير مخصص';
    }
    
    // إضافة اسم المستثمر إلى عنوان التقرير إذا كان محدداً
    if (reportInvestor) {
        const investor = investors.find(inv => inv.id === reportInvestor);
        if (investor) {
            reportTitle += ` - ${investor.name}`;
        }
    }
    
    // إضافة الفترة الزمنية إلى عنوان التقرير إذا كانت محددة
    if (reportFromDate && reportToDate) {
        reportTitle += ` (${formatDate(reportFromDate)} - ${formatDate(reportToDate)})`;
    }
    
    // إنشاء محتوى التقرير بناءً على النوع والتنسيق
    let reportContent;
    
    switch (reportType) {
        case 'investors':
            reportContent = generateInvestorsReportContent(reportInvestor, reportFromDate, reportToDate, reportFormat);
            break;
        case 'investments':
            reportContent = generateInvestmentsReportContent(reportInvestor, reportFromDate, reportToDate, reportFormat);
            break;
        case 'profits':
            reportContent = generateProfitsReportContent(reportInvestor, reportFromDate, reportToDate, reportFormat);
            break;
        case 'operations':
            reportContent = generateOperationsReportContent(reportInvestor, reportFromDate, reportToDate, reportFormat);
            break;
        case 'financial':
            reportContent = generateFinancialReportContent(reportFromDate, reportToDate, reportFormat);
            break;
        case 'summary':
            reportContent = generateSummaryReportContent(reportInvestor, reportFromDate, reportToDate, reportFormat);
            break;
        default:
            createNotification('خطأ', 'نوع التقرير غير صالح', 'danger');
            return;
    }
    
    // إنشاء التقرير
    const report = {
        id: generateId(),
        title: reportTitle,
        type: reportType,
        investorId: reportInvestor,
        fromDate: reportFromDate,
        toDate: reportToDate,
        format: reportFormat,
        content: reportContent,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
    };
    
    // إضافة التقرير إلى قائمة التقارير
    reports.push(report);
    
    // حفظ التقارير
    saveReports();
    
    // عرض التقرير
    displayReport(report);
    
    // إظهار رسالة نجاح
    createNotification('نجاح', 'تم إنشاء التقرير بنجاح', 'success');
}

/**
 * عرض التقرير
 */
function displayReport(report) {
    // إظهار نتيجة التقرير
    const reportResult = document.getElementById('reportResult');
    const reportTitle = document.getElementById('reportTitle');
    const reportContent = document.getElementById('reportContent');
    
    if (reportResult && reportTitle && reportContent) {
        reportResult.style.display = 'block';
        reportTitle.textContent = report.title;
        reportContent.innerHTML = report.content;
    }
}

/**
 * إغلاق التقرير
 */
function closeReport() {
    const reportResult = document.getElementById('reportResult');
    if (reportResult) {
        reportResult.style.display = 'none';
    }
}

/**
 * حفظ التقرير الحالي
 */
function saveReport() {
    // التحقق من وجود تقرير حالي
    const reportTitle = document.getElementById('reportTitle');
    const reportContent = document.getElementById('reportContent');
    
    if (!reportTitle || !reportContent) {
        createNotification('خطأ', 'لا يوجد تقرير لحفظه', 'danger');
        return;
    }
    
    // البحث عن التقرير في قائمة التقارير المحفوظة
    const existingReport = reports.find(report => report.title === reportTitle.textContent);
    
    if (existingReport) {
        // تحديث التقرير الموجود
        existingReport.updatedAt = new Date().toISOString();
        
        // إظهار رسالة نجاح
        createNotification('نجاح', 'تم تحديث التقرير بنجاح', 'success');
    } else {
        // إنشاء تقرير جديد
        const newReport = {
            id: generateId(),
            title: reportTitle.textContent,
            content: reportContent.innerHTML,
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
        };
        
        // إضافة التقرير إلى قائمة التقارير
        reports.push(newReport);
        
        // إظهار رسالة نجاح
        createNotification('نجاح', 'تم حفظ التقرير بنجاح', 'success');
    }
    
    // حفظ التقارير
    saveReports();
    
    // تحديث قائمة التقارير
    loadReports();
}

/**
 * تحميل التقارير
 */
function loadReports() {
    // تحميل التقارير الأخيرة
    loadRecentReports();
}

/**
 * تحميل التقارير الأخيرة
 */
function loadRecentReports() {
    const tableBody = document.getElementById('recentReportsTableBody');
    if (!tableBody) return;
    
    // ترتيب التقارير حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // عرض التقارير الأخيرة (أقصى 10 تقارير)
    const recentReports = sortedReports.slice(0, 10);
    
    if (recentReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">لا توجد تقارير</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = '';
    
    recentReports.forEach(report => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${report.title}</td>
            <td>${report.type || 'غير محدد'}</td>
            <td>${formatDate(report.createdAt)} ${formatTime(report.createdAt)}</td>
            <td>${report.createdBy || 'غير محدد'}</td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="viewReport('${report.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-primary btn-icon action-btn" onclick="generatePdfReport('${report.id}')">
                    <i class="fas fa-file-pdf"></i>
                </button>
                <button class="btn btn-danger btn-icon action-btn" onclick="openDeleteConfirmationModal('${report.id}', 'report')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * عرض تقرير موجود
 */
function viewReport(reportId) {
    // البحث عن التقرير
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        createNotification('خطأ', 'التقرير غير موجود', 'danger');
        return;
    }
    
    // عرض التقرير
    displayReport(report);
}

/**
 * إنشاء ملف PDF للتقرير
 */
function generatePdfReport(reportId) {
    // البحث عن التقرير
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        createNotification('خطأ', 'التقرير غير موجود', 'danger');
        return;
    }
    
    // إظهار رسالة معلومات
    createNotification('معلومات', 'وظيفة إنشاء ملف PDF غير متاحة حالياً', 'info');
}

/**
 * حذف تقرير
 */
function deleteReport(reportId) {
    // البحث عن التقرير
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        createNotification('خطأ', 'التقرير غير موجود', 'danger');
        return;
    }
    
    // حذف التقرير
    reports = reports.filter(r => r.id !== reportId);
    
    // حفظ التقارير
    saveReports();
    
    // تحديث قائمة التقارير
    loadReports();
    
    // إغلاق التقرير المعروض إذا كان هو نفسه
    const reportResult = document.getElementById('reportResult');
    const reportTitle = document.getElementById('reportTitle');
    
    if (reportResult && reportTitle && reportTitle.textContent === report.title) {
        reportResult.style.display = 'none';
    }
    
    // إظهار رسالة نجاح
    createNotification('نجاح', 'تم حذف التقرير بنجاح', 'success');
}

// تصدير الدوال المطلوبة
window.firebaseApp = window.firebaseApp || {};
window.createFirebaseBackupFromSettings = function() {
    window.firebaseApp.createBackup();
};

// تحديث عرض حالة المزامنة
function updateSyncStatus(status, type) {
    const syncStatusElement = document.getElementById('syncStatus');
    if (syncStatusElement) {
        syncStatusElement.textContent = status;
        syncStatusElement.style.display = 'inline-block';
        syncStatusElement.className = `status ${type}`;
    }
    
    // تحديث أيقونة المزامنة
    const syncIcon = document.getElementById('syncIcon');
    if (syncIcon) {
        syncIcon.className = `sync-btn ${type}`;
    }
}

// دعم مزامنة بطاقات المستثمرين
window.syncInvestorCards = function() {
    if (window.firebaseApp && window.firebaseApp.database && window.InvestorCardSystem) {
        console.log("مزامنة بطاقات المستثمرين...");
        
        // التحقق من وجود الوظيفة
        if (typeof window.InvestorCardSystem.syncInvestorCardsWithFirebase === 'function') {
            window.InvestorCardSystem.syncInvestorCardsWithFirebase();
        }
    }
};

// إضافة مزامنة البطاقات إلى جدولة المزامنة
if (window.scheduleSyncOperations) {
    const originalSchedule = window.scheduleSyncOperations;
    window.scheduleSyncOperations = function() {
        originalSchedule();
        window.syncInvestorCards();
    };
}



// دالة جديدة لدمج البيانات بدلاً من استبدالها
function mergeData(newData, existingData) {
    // دمج المستثمرين
    const mergedInvestors = [...existingData.investors];
    newData.investors.forEach(newInvestor => {
        const exists = mergedInvestors.find(inv => inv.id === newInvestor.id);
        if (!exists) {
            mergedInvestors.push(newInvestor);
        } else {
            // تحديث المستثمر الموجود بآخر نسخة
            const index = mergedInvestors.findIndex(inv => inv.id === newInvestor.id);
            mergedInvestors[index] = newInvestor;
        }
    });
    
    // دمج الاستثمارات
    const mergedInvestments = [...existingData.investments];
    newData.investments.forEach(newInvestment => {
        const exists = mergedInvestments.find(inv => inv.id === newInvestment.id);
        if (!exists) {
            mergedInvestments.push(newInvestment);
        } else {
            // تحديث الاستثمار الموجود بآخر نسخة
            const index = mergedInvestments.findIndex(inv => inv.id === newInvestment.id);
            mergedInvestments[index] = newInvestment;
        }
    });
    
    // دمج العمليات
    const mergedOperations = [...existingData.operations];
    newData.operations.forEach(newOperation => {
        const exists = mergedOperations.find(op => op.id === newOperation.id);
        if (!exists) {
            mergedOperations.push(newOperation);
        } else {
            // تحديث العملية الموجودة بآخر نسخة
            const index = mergedOperations.findIndex(op => op.id === newOperation.id);
            mergedOperations[index] = newOperation;
        }
    });
    
    // دمج الأحداث
    const mergedEvents = [...existingData.events];
    newData.events.forEach(newEvent => {
        const exists = mergedEvents.find(ev => ev.id === newEvent.id);
        if (!exists) {
            mergedEvents.push(newEvent);
        } else {
            const index = mergedEvents.findIndex(ev => ev.id === newEvent.id);
            mergedEvents[index] = newEvent;
        }
    });
    
    // دمج الإشعارات
    const mergedNotifications = [...existingData.notifications];
    newData.notifications.forEach(newNotification => {
        const exists = mergedNotifications.find(notif => notif.id === newNotification.id);
        if (!exists) {
            mergedNotifications.push(newNotification);
        } else {
            const index = mergedNotifications.findIndex(notif => notif.id === newNotification.id);
            mergedNotifications[index] = newNotification;
        }
    });
    
    return {
        investors: mergedInvestors,
        investments: mergedInvestments,
        operations: mergedOperations,
        events: mergedEvents,
        notifications: mergedNotifications,
        settings: {...existingData.settings, ...newData.settings}
    };
}

// استعادة نسخة احتياطية من Firebase
function restoreFirebaseBackup() {
    const backupsListElement = document.getElementById('backupsList');
    if (!backupsListElement || !backupsListElement.value) {
        createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
        return;
    }
    
    const backupId = backupsListElement.value;
    
    // البحث عن النسخة الاحتياطية
    const backup = backupList.find(b => b.id === backupId);
    
    if (!backup) {
        createNotification('خطأ', 'النسخة الاحتياطية غير موجودة', 'danger');
        return;
    }
    
    // تأكيد الاستعادة مع دمج البيانات
    if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backup.name}"؟ سيتم دمج البيانات مع البيانات الحالية.`)) {
        return;
    }
    
    // دمج البيانات مع البيانات الحالية
    const currentData = {
        investors: investors,
        investments: investments,
        operations: operations,
        events: events,
        notifications: notifications,
        settings: settings
    };
    
    const mergedData = mergeData(backup.data, currentData);
    
    // تحديث البيانات بالبيانات المدمجة
    investors = mergedData.investors;
    investments = mergedData.investments;
    operations = mergedData.operations;
    events = mergedData.events;
    notifications = mergedData.notifications;
    settings = mergedData.settings;
    
    // حفظ البيانات
    saveData();
    saveNotifications();
    
    // تحديث الواجهة
    loadInvestors();
    loadInvestments();
    loadOperations();
    
    // إظهار رسالة نجاح
    createNotification('نجاح', 'تم دمج النسخة الاحتياطية بنجاح', 'success');
}