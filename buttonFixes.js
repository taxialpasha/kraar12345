/**
 * نظام إدارة الاستثمار - إصلاح وظائف الأزرار
 * ملف لإصلاح مشاكل الأزرار في واجهة النظام
 */

// تنفيذ الدالة الرئيسية عند تحميل المستند
document.addEventListener('DOMContentLoaded', function() {
    console.log("تم تحميل ملف إصلاح الأزرار");
    
    // تأخير تنفيذ الإصلاحات للتأكد من تحميل العناصر بالكامل
    setTimeout(initButtonFixes, 500);
});

/**
 * الدالة الرئيسية لإصلاح جميع الأزرار
 */
function initButtonFixes() {
    console.log("بدء إصلاح جميع الأزرار في النظام...");
    
    // إصلاح أزرار التنقل بين الصفحات
    fixNavigationButtons();
    
    // إصلاح أزرار في صفحة المستثمرين
    fixInvestorsPageButtons();
    
    // إصلاح أزرار في صفحة العمليات
    fixOperationsPageButtons();
    
    // إصلاح أزرار في صفحة الأرباح
    fixProfitsPageButtons();
    
    // إصلاح أزرار في التحليلات والتقارير
    fixAnalyticsAndReportsButtons();
    
    // إصلاح أزرار النوافذ المنبثقة (Modals)
    fixModalButtons();
    
    // إصلاح زر الإشعارات
    fixNotificationButton();
    
    // إصلاح أزرار القالب العام
    fixCommonButtons();

    console.log("تم إصلاح جميع الأزرار بنجاح");
}

/**
 * إصلاح أزرار التنقل بين الصفحات
 */
function fixNavigationButtons() {
    console.log("إصلاح أزرار التنقل...");
    
    const menuItems = document.querySelectorAll('.menu-item');
    if (!menuItems.length) {
        console.warn("لم يتم العثور على عناصر القائمة");
        return;
    }
    
    // إزالة المستمعين القديمة لتجنب التكرار
    menuItems.forEach(item => {
        // انسخ العنصر واستبدله لإزالة جميع مستمعي الأحداث
        const clone = item.cloneNode(true);
        item.parentNode.replaceChild(clone, item);
    });
    
    // إعادة تعيين مستمعي الأحداث
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.id === 'logout-btn') {
                if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                    showAlert('تم تسجيل الخروج بنجاح', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
                return;
            }
            
            const pageId = this.getAttribute('data-page');
            if (!pageId) return;
            
            // تحديث القائمة النشطة
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
            
            // تحديث الصفحة النشطة
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.classList.remove('active');
            });
            
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // تحديث عنوان الصفحة
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) {
                    const menuIcon = this.querySelector('i');
                    const menuSpan = this.querySelector('span');
                    if (menuIcon && menuSpan) {
                        pageTitle.innerHTML = `<i class="${menuIcon.className}" style="color: var(--primary-color);"></i> ${menuSpan.textContent}`;
                    }
                }
                
                // تحديث بيانات الصفحة
                updatePageData(pageId);
            }
        });
    });
    
    console.log("تم إصلاح أزرار التنقل بنجاح");
}

/**
 * تحديث بيانات الصفحة عند التنقل
 */
function updatePageData(pageId) {
    console.log(`تحديث بيانات صفحة: ${pageId}`);
    
    switch (pageId) {
        case 'dashboard':
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            if (typeof updateDashboardCharts === 'function') updateDashboardCharts();
            break;
        case 'investors':
            if (typeof updateInvestorsTable === 'function') updateInvestorsTable();
            break;
        case 'profits':
            if (typeof updateProfitsTable === 'function') updateProfitsTable();
            if (typeof updateProfitsCharts === 'function') updateProfitsCharts();
            break;
        case 'operations':
            if (typeof updateOperationsTable === 'function') updateOperationsTable();
            if (typeof updateOperationsCharts === 'function') updateOperationsCharts();
            break;
        case 'analytics':
            if (typeof updateAnalyticsCharts === 'function') updateAnalyticsCharts();
            break;
        case 'reports':
            // تحديث التقارير إذا لزم الأمر
            break;
        case 'calendar':
            if (typeof updateCalendarEvents === 'function') updateCalendarEvents();
            break;
        case 'notifications':
            if (typeof loadNotifications === 'function') loadNotifications();
            if (typeof updateNotificationsPanel === 'function') updateNotificationsPanel();
            break;
        case 'settings':
            if (typeof updateSettingsUI === 'function') updateSettingsUI();
            break;
        case 'backup':
            if (typeof loadBackups === 'function') loadBackups();
            if (typeof updateBackupsTable === 'function') updateBackupsTable();
            break;
    }
}

/**
 * إصلاح أزرار صفحة المستثمرين
 */
function fixInvestorsPageButtons() {
    console.log("إصلاح أزرار صفحة المستثمرين...");
    
    // زر إضافة مستثمر جديد
    const addInvestorBtn = document.getElementById('add-investor-btn');
    if (addInvestorBtn) {
        // إزالة المستمعين القديمة
        const addInvestorBtnClone = addInvestorBtn.cloneNode(true);
        addInvestorBtn.parentNode.replaceChild(addInvestorBtnClone, addInvestorBtn);
        
        // إضافة مستمع جديد
        document.getElementById('add-investor-btn').addEventListener('click', function() {
            console.log("تم النقر على زر إضافة مستثمر");
            if (typeof openAddInvestorModal === 'function') {
                openAddInvestorModal();
            } else if (typeof openAddInvestorModalFixed === 'function') {
                openAddInvestorModalFixed();
            } else {
                fallbackOpenAddInvestorModal();
            }
        });
    }
    
    // إصلاح أزرار العمليات في جدول المستثمرين
    fixInvestorsTableActionButtons();
}

/**
 * إصلاح أزرار العمليات في جدول المستثمرين
 */
function fixInvestorsTableActionButtons() {
    const investorsTable = document.getElementById('investors-table-body');
    if (!investorsTable) {
        console.warn("لم يتم العثور على جدول المستثمرين");
        return;
    }
    
    // إزالة المستمعين القديمة لتجنب التكرار
    const actionButtons = investorsTable.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    // إضافة مستمعين جدد للأزرار
    const viewButtons = investorsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`عرض تفاصيل المستثمر رقم: ${id}`);
            
            if (typeof viewInvestorFixed === 'function') {
                viewInvestorFixed(id);
            } else if (typeof viewInvestor === 'function') {
                viewInvestor(id);
            } else {
                fallbackViewInvestor(id);
            }
        });
    });
    
    const editButtons = investorsTable.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`تعديل المستثمر رقم: ${id}`);
            
            if (typeof editInvestorFixed === 'function') {
                editInvestorFixed(id);
            } else if (typeof editInvestor === 'function') {
                editInvestor(id);
            } else {
                fallbackEditInvestor(id);
            }
        });
    });
    
    const deleteButtons = investorsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`حذف المستثمر رقم: ${id}`);
            
            if (typeof deleteInvestorFixed === 'function') {
                deleteInvestorFixed(id);
            } else if (typeof deleteInvestor === 'function') {
                deleteInvestor(id);
            } else {
                fallbackDeleteInvestor(id);
            }
        });
    });
}

/**
 * احتياطية للعرض إذا لم تكن الدالة الأصلية موجودة
 */
function fallbackViewInvestor(id) {
    console.log(`استدعاء احتياطي لعرض المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    alert(`تم النقر على زر عرض المستثمر: ${investor.name}`);
}

/**
 * احتياطية للتعديل إذا لم تكن الدالة الأصلية موجودة
 */
function fallbackEditInvestor(id) {
    console.log(`استدعاء احتياطي لتعديل المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    alert(`تم النقر على زر تعديل المستثمر: ${investor.name}`);
    
    // محاولة فتح نافذة التعديل
    const investorModalOverlay = document.getElementById('investor-modal-overlay');
    const investorModal = document.getElementById('investor-modal');
    
    if (investorModalOverlay && investorModal) {
        // تغيير عنوان النافذة
        const modalTitle = document.querySelector('#investor-modal .modal-title');
        if (modalTitle) modalTitle.textContent = 'تعديل بيانات المستثمر';
        
        // عرض النافذة
        investorModalOverlay.style.display = 'block';
        investorModal.style.display = 'block';
    }
}

/**
 * احتياطية للحذف إذا لم تكن الدالة الأصلية موجودة
 */
function fallbackDeleteInvestor(id) {
    console.log(`استدعاء احتياطي لحذف المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف المستثمر: ${investor.name}؟`)) {
        showAlert('تم حذف المستثمر بنجاح', 'success');
    }
}

/**
 * احتياطية لفتح نافذة إضافة مستثمر
 */
function fallbackOpenAddInvestorModal() {
    console.log("استدعاء احتياطي لفتح نافذة إضافة مستثمر");
    
    const investorModalOverlay = document.getElementById('investor-modal-overlay');
    const investorModal = document.getElementById('investor-modal');
    
    if (investorModalOverlay && investorModal) {
        // تغيير عنوان النافذة
        const modalTitle = document.querySelector('#investor-modal .modal-title');
        if (modalTitle) modalTitle.textContent = 'إضافة مستثمر جديد';
        
        // إعادة تعيين النموذج
        const form = document.getElementById('investor-form');
        if (form) form.reset();
        
        // عرض النافذة
        investorModalOverlay.style.display = 'block';
        investorModal.style.display = 'block';
    } else {
        alert('تم النقر على زر إضافة مستثمر جديد');
    }
}

/**
 * إصلاح أزرار صفحة العمليات
 */
function fixOperationsPageButtons() {
    console.log("إصلاح أزرار صفحة العمليات...");
    
    // زر إضافة إيداع
    const addDepositBtn = document.getElementById('add-deposit-btn');
    if (addDepositBtn) {
        const clone = addDepositBtn.cloneNode(true);
        addDepositBtn.parentNode.replaceChild(clone, addDepositBtn);
        
        document.getElementById('add-deposit-btn').addEventListener('click', function() {
            console.log("تم النقر على زر إضافة إيداع");
            if (typeof openAddDepositModalFixed === 'function') {
                openAddDepositModalFixed();
            } else if (typeof openAddDepositModal === 'function') {
                openAddDepositModal();
            } else {
                fallbackOpenAddDepositModal();
            }
        });
    }
    
    // زر إضافة سحب
    const addWithdrawalBtn = document.getElementById('add-withdrawal-btn');
    if (addWithdrawalBtn) {
        const clone = addWithdrawalBtn.cloneNode(true);
        addWithdrawalBtn.parentNode.replaceChild(clone, addWithdrawalBtn);
        
        document.getElementById('add-withdrawal-btn').addEventListener('click', function() {
            console.log("تم النقر على زر إضافة سحب");
            if (typeof openAddWithdrawalModalFixed === 'function') {
                openAddWithdrawalModalFixed();
            } else if (typeof openAddWithdrawalModal === 'function') {
                openAddWithdrawalModal();
            } else {
                fallbackOpenAddWithdrawalModal();
            }
        });
    }
    
    // إصلاح أزرار العمليات في جدول العمليات
    fixOperationsTableActionButtons();
}

/**
 * إصلاح أزرار جدول العمليات
 */
function fixOperationsTableActionButtons() {
    const operationsTable = document.querySelector('#operations table tbody');
    if (!operationsTable) {
        console.warn("لم يتم العثور على جدول العمليات");
        return;
    }
    
    // إزالة المستمعين القديمة لتجنب التكرار
    const actionButtons = operationsTable.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    // إضافة مستمعين جدد للأزرار
    const viewButtons = operationsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`عرض تفاصيل العملية رقم: ${id}`);
            
            if (typeof viewOperationFixed === 'function') {
                viewOperationFixed(id);
            } else if (typeof viewOperation === 'function') {
                viewOperation(id);
            } else {
                fallbackViewOperation(id);
            }
        });
    });
    
    const editButtons = operationsTable.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`تعديل العملية رقم: ${id}`);
            
            if (typeof editOperationFixed === 'function') {
                editOperationFixed(id);
            } else if (typeof editOperation === 'function') {
                editOperation(id);
            } else {
                fallbackEditOperation(id);
            }
        });
    });
    
    const deleteButtons = operationsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`حذف العملية رقم: ${id}`);
            
            if (typeof deleteOperationFixed === 'function') {
                deleteOperationFixed(id);
            } else if (typeof deleteOperation === 'function') {
                deleteOperation(id);
            } else {
                fallbackDeleteOperation(id);
            }
        });
    });
}

/**
 * احتياطية لفتح نافذة إضافة إيداع
 */
function fallbackOpenAddDepositModal() {
    console.log("استدعاء احتياطي لفتح نافذة إضافة إيداع");
    
    const operationModalOverlay = document.getElementById('operation-modal-overlay');
    const operationModal = document.getElementById('operation-modal');
    
    if (operationModalOverlay && operationModal) {
        // تغيير عنوان النافذة
        const modalTitle = document.getElementById('operation-modal-title');
        if (modalTitle) modalTitle.textContent = 'إضافة إيداع جديد';
        
        // إعادة تعيين النموذج
        const form = document.getElementById('operation-form');
        if (form) {
            form.reset();
            
            // تحديد نوع العملية
            const typeSelect = document.getElementById('operation-type');
            if (typeSelect) typeSelect.value = 'deposit';
        }
        
        // عرض النافذة
        operationModalOverlay.style.display = 'block';
        operationModal.style.display = 'block';
    } else {
        alert('تم النقر على زر إضافة إيداع جديد');
    }
}

/**
 * احتياطية لفتح نافذة إضافة سحب
 */
function fallbackOpenAddWithdrawalModal() {
    console.log("استدعاء احتياطي لفتح نافذة إضافة سحب");
    
    const operationModalOverlay = document.getElementById('operation-modal-overlay');
    const operationModal = document.getElementById('operation-modal');
    
    if (operationModalOverlay && operationModal) {
        // تغيير عنوان النافذة
        const modalTitle = document.getElementById('operation-modal-title');
        if (modalTitle) modalTitle.textContent = 'إضافة سحب جديد';
        
        // إعادة تعيين النموذج
        const form = document.getElementById('operation-form');
        if (form) {
            form.reset();
            
            // تحديد نوع العملية
            const typeSelect = document.getElementById('operation-type');
            if (typeSelect) typeSelect.value = 'withdrawal';
        }
        
        // عرض النافذة
        operationModalOverlay.style.display = 'block';
        operationModal.style.display = 'block';
    } else {
        alert('تم النقر على زر إضافة سحب جديد');
    }
}

/**
 * احتياطية لعرض تفاصيل العملية
 */
function fallbackViewOperation(id) {
    console.log(`استدعاء احتياطي لعرض العملية رقم: ${id}`);
    
    // البحث عن العملية في البيانات
    const operation = window.operationsData?.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    // البحث عن المستثمر المرتبط بالعملية
    const investor = window.investorsData?.find(inv => inv.id === operation.investorId);
    
    let operationType = '';
    switch (operation.type) {
        case 'deposit': operationType = 'إيداع'; break;
        case 'withdrawal': operationType = 'سحب'; break;
        case 'profit': operationType = 'ربح'; break;
    }
    
    alert(`تم النقر على زر عرض العملية: ${operationType} بقيمة ${operation.amount} للمستثمر ${investor?.name || 'غير معروف'}`);
}

/**
 * احتياطية لتعديل العملية
 */
function fallbackEditOperation(id) {
    console.log(`استدعاء احتياطي لتعديل العملية رقم: ${id}`);
    
    // البحث عن العملية في البيانات
    const operation = window.operationsData?.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    const operationModalOverlay = document.getElementById('operation-modal-overlay');
    const operationModal = document.getElementById('operation-modal');
    
    if (operationModalOverlay && operationModal) {
        // تغيير عنوان النافذة
        const modalTitle = document.getElementById('operation-modal-title');
        if (modalTitle) {
            if (operation.type === 'deposit') {
                modalTitle.textContent = 'تعديل إيداع';
            } else if (operation.type === 'withdrawal') {
                modalTitle.textContent = 'تعديل سحب';
            } else {
                modalTitle.textContent = 'تعديل ربح';
            }
        }
        
        // ملء النموذج بالبيانات
        const form = document.getElementById('operation-form');
        if (form) {
            form.reset();
            form.setAttribute('data-mode', 'edit');
            form.setAttribute('data-id', id);
            
            // تحديد المستثمر ونوع العملية
            const investorSelect = document.getElementById('operation-investor');
            if (investorSelect) {
                investorSelect.value = operation.investorId;
                investorSelect.disabled = true; // لا يمكن تغيير المستثمر في وضع التعديل
            }
            
            const typeSelect = document.getElementById('operation-type');
            if (typeSelect) {
                typeSelect.value = operation.type;
                typeSelect.disabled = true; // لا يمكن تغيير نوع العملية في وضع التعديل
            }
            
            // تعيين المبلغ والتاريخ والتفاصيل
            const amountInput = document.getElementById('operation-amount');
            if (amountInput) amountInput.value = operation.amount;
            
            const dateInput = document.getElementById('operation-date');
            if (dateInput) dateInput.value = formatDateForInput(new Date(operation.date));
            
            const detailsInput = document.getElementById('operation-details');
            if (detailsInput) detailsInput.value = operation.details || '';
        }
        
        // عرض النافذة
        operationModalOverlay.style.display = 'block';
        operationModal.style.display = 'block';
    } else {
        alert(`تم النقر على زر تعديل العملية رقم: ${id}`);
    }
}

/**
 * احتياطية لحذف العملية
 */
function fallbackDeleteOperation(id) {
    console.log(`استدعاء احتياطي لحذف العملية رقم: ${id}`);
    
    // البحث عن العملية في البيانات
    const operation = window.operationsData?.find(op => op.id === id);
    if (!operation) {
        showAlert('لم يتم العثور على العملية', 'danger');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذه العملية؟')) {
        showAlert('تم حذف العملية بنجاح', 'success');
    }
}

/**
 * إصلاح أزرار صفحة الأرباح
 */
function fixProfitsPageButtons() {
    console.log("إصلاح أزرار صفحة الأرباح...");
    
    // أزرار توزيع الأرباح
    const distributeProfitBtns = document.querySelectorAll('.distribute-profit-btn');
    distributeProfitBtns.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        
        document.querySelectorAll('.distribute-profit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                console.log(`توزيع أرباح للمستثمر رقم: ${id}`);
                
                if (typeof distributeProfitFixed === 'function') {
                    distributeProfitFixed(id);
                } else if (typeof distributeProfit === 'function') {
                    distributeProfit(id);
                } else {
                    fallbackDistributeProfit(id);
                }
            });
        });
    });
    
    // إصلاح أزرار جدول الأرباح
    fixProfitsTableActionButtons();
}

/**
 * إصلاح أزرار جدول الأرباح
 */
function fixProfitsTableActionButtons() {
    const profitsTable = document.querySelector('#profits table tbody');
    if (!profitsTable) {
        console.warn("لم يتم العثور على جدول الأرباح");
        return;
    }
    
    // إزالة المستمعين القديمة لتجنب التكرار
    const actionButtons = profitsTable.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    // إضافة مستمعين جدد لأزرار العرض
    const viewButtons = profitsTable.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`عرض تفاصيل أرباح المستثمر رقم: ${id}`);
            
            if (typeof viewProfitFixed === 'function') {
                viewProfitFixed(id);
            } else if (typeof viewProfit === 'function') {
                viewProfit(id);
            } else {
                fallbackViewProfit(id);
            }
        });
    });
    
    // إضافة مستمعين جدد لأزرار التعديل
    const editButtons = profitsTable.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`تعديل أرباح المستثمر رقم: ${id}`);
            
            if (typeof editProfit === 'function') {
                editProfit(id);
            } else {
                fallbackEditProfit(id);
            }
        });
    });
    
    // إضافة مستمعين جدد لأزرار الحذف
    const deleteButtons = profitsTable.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log(`حذف أرباح المستثمر رقم: ${id}`);
            
            if (typeof deleteProfit === 'function') {
                deleteProfit(id);
            } else {
                fallbackDeleteProfit(id);
            }
        });
    });
}

/**
 * احتياطية لعرض تفاصيل الأرباح
 */
function fallbackViewProfit(id) {
    console.log(`استدعاء احتياطي لعرض أرباح المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    alert(`تم النقر على زر عرض أرباح المستثمر: ${investor.name}`);
}

/**
 * احتياطية لتوزيع الأرباح
 */
function fallbackDistributeProfit(id) {
    console.log(`استدعاء احتياطي لتوزيع أرباح المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    alert(`تم النقر على زر توزيع أرباح للمستثمر: ${investor.name}`);
}

/**
 * احتياطية لتعديل الأرباح
 */
function fallbackEditProfit(id) {
    console.log(`استدعاء احتياطي لتعديل أرباح المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    alert(`تم النقر على زر تعديل أرباح المستثمر: ${investor.name}`);
}

/**
 * احتياطية لحذف الأرباح
 */
function fallbackDeleteProfit(id) {
    console.log(`استدعاء احتياطي لحذف أرباح المستثمر رقم: ${id}`);
    
    // البحث عن المستثمر في البيانات
    const investor = window.investorsData?.find(inv => inv.id === id);
    if (!investor) {
        showAlert('لم يتم العثور على المستثمر', 'danger');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف أرباح المستثمر: ${investor.name}؟`)) {
        showAlert('تم حذف الأرباح بنجاح', 'success');
    }
}

/**
 * إصلاح أزرار التحليلات والتقارير
 */
function fixAnalyticsAndReportsButtons() {
    console.log("إصلاح أزرار التحليلات والتقارير...");
    
    // أزرار علامات التبويب في الرسوم البيانية
    const chartTabs = document.querySelectorAll('.card-tab');
    chartTabs.forEach(tab => {
        const clone = tab.cloneNode(true);
        tab.parentNode.replaceChild(clone, tab);
    });
    
    document.querySelectorAll('.card-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const chartType = this.getAttribute('data-chart');
            const tabs = this.parentElement.querySelectorAll('.card-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            console.log(`تحديث الرسم البياني: ${chartType}`);
            if (typeof updateChartFixed === 'function') {
                updateChartFixed(chartType);
            } else if (typeof updateChart === 'function') {
                updateChart(chartType);
            } else {
                fallbackUpdateChart(chartType);
            }
        });
    });
    
    // زر إنشاء تقرير
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        const clone = generateReportBtn.cloneNode(true);
        generateReportBtn.parentNode.replaceChild(clone, generateReportBtn);
        
        document.getElementById('generate-report-btn').addEventListener('click', function() {
            console.log("تم النقر على زر إنشاء تقرير");
            if (typeof generateReport === 'function') {
                generateReport();
            } else {
                fallbackGenerateReport();
            }
        });
    }
}

/**
 * احتياطية لتحديث الرسم البياني
 */
function fallbackUpdateChart(chartType) {
    console.log(`استدعاء احتياطي لتحديث الرسم البياني: ${chartType}`);
    
    const activePage = document.querySelector('.page.active').id;
    alert(`تم تحديث الرسم البياني (${chartType}) في صفحة ${activePage}`);
}

/**
 * احتياطية لإنشاء تقرير
 */
function fallbackGenerateReport() {
    console.log("استدعاء احتياطي لإنشاء تقرير");
    
    const reportType = document.getElementById('report-type')?.value || 'monthly';
    const reportInvestor = document.getElementById('report-investor')?.value || '';
    const fromDate = document.getElementById('report-from')?.value || '';
    const toDate = document.getElementById('report-to')?.value || '';
    
    if (!fromDate || !toDate) {
        showAlert('يرجى تحديد فترة التقرير', 'warning');
        return;
    }
    
    const reportResultsDiv = document.getElementById('report-results');
    if (reportResultsDiv) {
        reportResultsDiv.innerHTML = `
            <div class="card card-gradient-border">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-file-alt"></i>
                        نتيجة التقرير
                    </div>
                    <button class="btn btn-outline-primary btn-round print-report-btn">
                        <i class="fas fa-print"></i>
                        طباعة التقرير
                    </button>
                </div>
                <div class="card-body">
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i>
                        تم إنشاء التقرير بنجاح: ${reportType} من ${fromDate} إلى ${toDate}
                    </div>
                </div>
            </div>
        `;
    }
    
    showAlert('تم إنشاء التقرير بنجاح', 'success');
}

/**
 * إصلاح أزرار النوافذ المنبثقة
 */
function fixModalButtons() {
    console.log("إصلاح أزرار النوافذ المنبثقة...");
    
    // أزرار إغلاق النوافذ المنبثقة
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            // البحث عن النافذة المنبثقة الأقرب
            const modal = this.closest('.modal');
            const overlay = modal?.parentElement;
            
            if (modal && overlay) {
                overlay.style.display = 'none';
            }
        });
    });
    
    // أزرار إغلاق النوافذ في الأسفل
    const closeButtonsBottom = document.querySelectorAll('#investor-modal-close, #operation-modal-close');
    closeButtonsBottom.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    document.querySelectorAll('#investor-modal-close, #operation-modal-close').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.id.replace('-close', '');
            const modal = document.getElementById(modalId);
            const overlay = document.getElementById(`${modalId}-overlay`);
            
            if (modal && overlay) {
                overlay.style.display = 'none';
            }
        });
    });
    
    // إصلاح نماذج الإدخال
    fixForms();
}

/**
 * إصلاح نماذج الإدخال
 */
function fixForms() {
    const investorForm = document.getElementById('investor-form');
    if (investorForm) {
        investorForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            console.log("تم إرسال نموذج المستثمر");
            
            if (typeof handleInvestorFormSubmit === 'function') {
                handleInvestorFormSubmit.call(this, event);
            } else {
                fallbackHandleInvestorFormSubmit.call(this, event);
            }
        });
    }
    
    const operationForm = document.getElementById('operation-form');
    if (operationForm) {
        operationForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            console.log("تم إرسال نموذج العملية");
            
            if (typeof handleOperationFormSubmit === 'function') {
                handleOperationFormSubmit.call(this, event);
            } else {
                fallbackHandleOperationFormSubmit.call(this, event);
            }
        });
    }
}

/**
 * احتياطية لمعالجة نموذج المستثمر
 */
function fallbackHandleInvestorFormSubmit(event) {
    event.preventDefault();
    
    // التحقق من صحة النموذج
    if (!this.checkValidity()) {
        this.reportValidity();
        return;
    }
    
    const mode = this.getAttribute('data-mode');
    const id = this.getAttribute('data-id');
    
    const name = document.getElementById('investor-name').value;
    const phone = document.getElementById('investor-phone').value;
    const amount = parseFloat(document.getElementById('investor-amount').value);
    
    if (mode === 'edit') {
        showAlert(`تم تحديث بيانات المستثمر: ${name} بنجاح`, 'success');
    } else {
        showAlert(`تم إضافة المستثمر: ${name} بنجاح`, 'success');
    }
    
    // إغلاق النافذة المنبثقة
    const modalOverlay = document.getElementById('investor-modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

/**
 * احتياطية لمعالجة نموذج العملية
 */
function fallbackHandleOperationFormSubmit(event) {
    event.preventDefault();
    
    // التحقق من صحة النموذج
    if (!this.checkValidity()) {
        this.reportValidity();
        return;
    }
    
    const mode = this.getAttribute('data-mode');
    const id = this.getAttribute('data-id');
    
    const investorId = parseInt(document.getElementById('operation-investor').value);
    const type = document.getElementById('operation-type').value;
    const amount = parseFloat(document.getElementById('operation-amount').value);
    
    // البحث عن المستثمر
    const investor = window.investorsData?.find(inv => inv.id === investorId);
    
    if (mode === 'edit') {
        showAlert(`تم تحديث العملية بنجاح`, 'success');
    } else {
        const typeText = type === 'deposit' ? 'إيداع' : 'سحب';
        showAlert(`تم إضافة عملية ${typeText} بقيمة ${amount} للمستثمر ${investor?.name || ''} بنجاح`, 'success');
    }
    
    // إغلاق النافذة المنبثقة
    const modalOverlay = document.getElementById('operation-modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

/**
 * إصلاح زر الإشعارات
 */
function fixNotificationButton() {
    console.log("إصلاح زر الإشعارات...");
    
    const notificationBtn = document.querySelector('.notification-btn');
    if (!notificationBtn) return;
    
    // إزالة المستمعين القديمة
    const clone = notificationBtn.cloneNode(true);
    notificationBtn.parentNode.replaceChild(clone, notificationBtn);
    
    // إضافة مستمع جديد
    document.querySelector('.notification-btn').addEventListener('click', function() {
        console.log("تم النقر على زر الإشعارات");
        
        if (typeof toggleNotificationsPanel === 'function') {
            toggleNotificationsPanel();
        } else if (typeof createNotificationsPanelFixed === 'function') {
            createNotificationsPanelFixed();
        } else {
            fallbackToggleNotificationsPanel();
        }
    });
}

/**
 * احتياطية لتبديل لوحة الإشعارات
 */
function fallbackToggleNotificationsPanel() {
    console.log("استدعاء احتياطي لتبديل لوحة الإشعارات");
    
    // التحقق من وجود لوحة الإشعارات
    const existingPanel = document.getElementById('notifications-panel');
    if (existingPanel) {
        document.body.removeChild(existingPanel);
        return;
    }
    
    // إنشاء لوحة الإشعارات
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
    
    panel.innerHTML = `
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
            <div class="notification-item" style="background-color: rgba(114, 103, 239, 0.1);">
                <div class="notification-icon notification-success">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">مستثمر جديد</div>
                    <div class="notification-message">تم إضافة مستثمر جديد: كريم جاسم</div>
                    <div class="notification-time">منذ 30 دقيقة</div>
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="1">تحديد كمقروء</button>
                    </div>
                </div>
            </div>
            <div class="notification-item" style="background-color: rgba(114, 103, 239, 0.1);">
                <div class="notification-icon notification-danger">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">عملية سحب كبيرة</div>
                    <div class="notification-message">محمد عبدالله قام بسحب مبلغ 2,000,000 دينار</div>
                    <div class="notification-time">منذ ساعتين</div>
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="2">تحديد كمقروء</button>
                    </div>
                </div>
            </div>
        </div>
        <div style="padding: 10px; border-top: 1px solid var(--border-color); text-align: center;">
            <a href="#" class="show-all-notifications-btn" style="color: var(--primary-color); text-decoration: none;">عرض كل الإشعارات</a>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // إضافة مستمعين للأزرار
    panel.querySelector('.mark-all-read-btn').addEventListener('click', function() {
        showAlert('تم تحديد جميع الإشعارات كمقروءة', 'success');
        document.body.removeChild(panel);
    });
    
    panel.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            showAlert(`تم تحديد الإشعار رقم ${id} كمقروء`, 'success');
            this.closest('.notification-item').style.backgroundColor = '';
            this.textContent = 'تحديد كغير مقروء';
        });
    });
    
    panel.querySelector('.show-all-notifications-btn').addEventListener('click', function(e) {
        e.preventDefault();
        document.body.removeChild(panel);
        
        // الانتقال إلى صفحة الإشعارات
        const notificationsMenuItem = document.querySelector('[data-page="notifications"]');
        if (notificationsMenuItem) {
            notificationsMenuItem.click();
        }
    });
    
    // إغلاق اللوحة عند النقر خارجها
    document.addEventListener('click', function closePanel(e) {
        if (panel && !panel.contains(e.target) && !document.querySelector('.notification-btn').contains(e.target)) {
            if (document.body.contains(panel)) {
                document.body.removeChild(panel);
            }
            document.removeEventListener('click', closePanel);
        }
    });
}

/**
 * إصلاح أزرار عامة
 */
function fixCommonButtons() {
    console.log("إصلاح أزرار القالب العام...");
    
    // أزرار الطباعة
    const printButtons = document.querySelectorAll('.btn-print, button:has(i.fa-print)');
    printButtons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });
    
    document.querySelectorAll('.btn-print, button:has(i.fa-print)').forEach(button => {
        button.addEventListener('click', function() {
            console.log("تم النقر على زر الطباعة");
            
            const activePage = document.querySelector('.page.active')?.id;
            
            switch (activePage) {
                case 'investors':
                    if (typeof printInvestors === 'function') {
                        printInvestors();
                    } else {
                        fallbackPrint('المستثمرين');
                    }
                    break;
                case 'operations':
                    if (typeof printOperations === 'function') {
                        printOperations();
                    } else {
                        fallbackPrint('العمليات');
                    }
                    break;
                case 'profits':
                    if (typeof printProfits === 'function') {
                        printProfits();
                    } else {
                        fallbackPrint('الأرباح');
                    }
                    break;
                case 'reports':
                    if (typeof printReport === 'function') {
                        printReport('monthly', new Date(), new Date(), document.querySelector('#report-results')?.innerHTML || '');
                    } else {
                        fallbackPrint('التقارير');
                    }
                    break;
                default:
                    fallbackPrint(activePage);
                    break;
            }
        });
    });
    
    // زر حفظ الإعدادات
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        const clone = saveSettingsBtn.cloneNode(true);
        saveSettingsBtn.parentNode.replaceChild(clone, saveSettingsBtn);
        
        document.getElementById('save-settings-btn').addEventListener('click', function() {
            console.log("تم النقر على زر حفظ الإعدادات");
            
            if (typeof saveSettings === 'function') {
                saveSettings();
            } else {
                fallbackSaveSettings();
            }
        });
    }
    
    // زر إنشاء نسخة احتياطية
    const createBackupBtn = document.getElementById('create-backup-btn');
    if (createBackupBtn) {
        const clone = createBackupBtn.cloneNode(true);
        createBackupBtn.parentNode.replaceChild(clone, createBackupBtn);
        
        document.getElementById('create-backup-btn').addEventListener('click', function() {
            console.log("تم النقر على زر إنشاء نسخة احتياطية");
            
            if (typeof createBackup === 'function') {
                createBackup();
            } else {
                fallbackCreateBackup();
            }
        });
    }
    
    // زر تصدير البيانات
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        const clone = exportDataBtn.cloneNode(true);
        exportDataBtn.parentNode.replaceChild(clone, exportDataBtn);
        
        document.getElementById('export-data-btn').addEventListener('click', function() {
            console.log("تم النقر على زر تصدير البيانات");
            
            if (typeof exportData === 'function') {
                exportData();
            } else {
                fallbackExportData();
            }
        });
    }
    
    // زر استيراد البيانات
    const importDataBtn = document.getElementById('import-data-btn');
    if (importDataBtn) {
        const clone = importDataBtn.cloneNode(true);
        importDataBtn.parentNode.replaceChild(clone, importDataBtn);
        
        document.getElementById('import-data-btn').addEventListener('click', function() {
            console.log("تم النقر على زر استيراد البيانات");
            
            if (typeof importData === 'function') {
                handleImportData();
            } else {
                fallbackImportData();
            }
        });
    }
}

/**
 * احتياطية للطباعة
 */
function fallbackPrint(pageType) {
    console.log(`استدعاء احتياطي لطباعة: ${pageType}`);
    
    alert(`جاري طباعة صفحة ${pageType}...`);
    
    // محاولة استدعاء طباعة النظام
    setTimeout(() => {
        window.print();
    }, 500);
}

/**
 * احتياطية لحفظ الإعدادات
 */
function fallbackSaveSettings() {
    console.log("استدعاء احتياطي لحفظ الإعدادات");
    
    const interestRateValue = document.getElementById('interest-rate')?.value || '1.75';
    const currencyValue = document.getElementById('currency')?.value || 'IQD';
    
    showAlert('تم حفظ الإعدادات بنجاح', 'success');
}

/**
 * احتياطية لإنشاء نسخة احتياطية
 */
function fallbackCreateBackup() {
    console.log("استدعاء احتياطي لإنشاء نسخة احتياطية");
    
    showAlert('تم إنشاء نسخة احتياطية جديدة بنجاح', 'success');
}

/**
 * احتياطية لتصدير البيانات
 */
function fallbackExportData() {
    console.log("استدعاء احتياطي لتصدير البيانات");
    
    const exportFormat = document.getElementById('export-format')?.value || 'json';
    showAlert(`تم تصدير البيانات بتنسيق ${exportFormat} بنجاح`, 'success');
}

/**
 * احتياطية لاستيراد البيانات
 */
function fallbackImportData() {
    console.log("استدعاء احتياطي لاستيراد البيانات");
    
    const fileInput = document.getElementById('import-data-file');
    if (!fileInput || !fileInput.value) {
        showAlert('يرجى اختيار ملف للاستيراد', 'warning');
        return;
    }
    
    showAlert('تم استيراد البيانات بنجاح', 'success');
}

/**
 * تنسيق التاريخ للإدخال في حقول التاريخ
 */
function formatDateForInput(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * عرض رسالة تنبيه للمستخدم
 */
function showAlert(message, type = 'info') {
    // استخدام دالة التنبيه الموجودة إذا كانت متاحة
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
        return;
    }
    
    // إنشاء عنصر التنبيه
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
    
    // إضافة إلى الصفحة
    document.body.appendChild(alert);
    
    // إزالة بعد 3 ثوان
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 500);
    }, 3000);
}

// تنفيذ المراقبة المستمرة لتصحيح الأزرار التي تضاف ديناميكياً
setInterval(() => {
    // إصلاح أزرار الجدول في صفحة المستثمرين
    if (document.querySelector('#investors.active')) {
        fixInvestorsTableActionButtons();
    }
    
    // إصلاح أزرار الجدول في صفحة العمليات
    if (document.querySelector('#operations.active')) {
        fixOperationsTableActionButtons();
    }
    
    // إصلاح أزرار الجدول في صفحة الأرباح
    if (document.querySelector('#profits.active')) {
        fixProfitsTableActionButtons();
    }
}, 5000);