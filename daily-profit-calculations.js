/**
 * ملف إضافي لتحسين حساب الأرباح في نظام إدارة الاستثمار
 * يتم تحسين حساب الأرباح بحيث يقوم بالحساب الدقيق بناءً على تاريخ الاستثمار
 */

// تحسين دالة حساب الأرباح للفترة المحددة
function calculateProfitImproved(amount, startDate, endDate) {
    if (!amount || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // تأكد من أن تاريخ البداية قبل تاريخ النهاية
    if (end < start) return 0;
    
    // احتساب عدد الأيام بين التاريخين
    const totalDays = daysDifference(startDate, endDate);
    
    // الحصول على المعدل اليومي للربح
    const monthlyProfitRate = settings.monthlyProfitRate || 1.75; // النسبة الشهرية (الافتراضية 1.75%)
    const dailyProfitRate = monthlyProfitRate / getDaysInMonth(start);
    
    // حساب مجموع الأرباح لكل يوم بين التاريخين
    let totalProfit = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
        // حساب الربح اليومي
        const dailyProfit = (amount * dailyProfitRate) / 100;
        totalProfit += dailyProfit;
        
        // الانتقال إلى اليوم التالي
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return totalProfit;
}

// الحصول على عدد الأيام في الشهر
function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// حساب الأرباح المستحقة لمستثمر معين في فترة محددة
function calculateInvestorProfitForPeriod(investorId, startDate, endDate) {
    if (!investorId || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // الحصول على جميع استثمارات المستثمر النشطة
    const investorInvestments = investments.filter(inv => 
        inv.investorId === investorId && 
        (inv.status === 'active' || 
         (inv.status === 'closed' && new Date(inv.closedDate) >= start))
    );
    
    // حساب إجمالي الأرباح لجميع الاستثمارات
    let totalProfit = 0;
    
    investorInvestments.forEach(investment => {
        // تحديد تاريخ بداية حساب الربح (إما تاريخ الاستثمار أو بداية الفترة المحددة، أيهما أحدث)
        const investmentStart = new Date(investment.date);
        const profitStartDate = investmentStart > start ? investmentStart : start;
        
        // تحديد تاريخ نهاية حساب الربح (إما تاريخ إغلاق الاستثمار أو نهاية الفترة المحددة، أيهما أقدم)
        let profitEndDate;
        if (investment.status === 'closed') {
            const closedDate = new Date(investment.closedDate);
            profitEndDate = closedDate < end ? closedDate : end;
        } else {
            profitEndDate = end;
        }
        
        // حساب الربح لهذا الاستثمار خلال الفترة المحددة
        const profit = calculateProfitImproved(investment.amount, profitStartDate, profitEndDate);
        totalProfit += profit;
    });
    
    return totalProfit;
}

// حساب الأرباح للشهر الحالي
function calculateCurrentMonthProfit(investorId) {
    // تحديد أول يوم في الشهر الحالي
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // حساب الأرباح من بداية الشهر حتى اليوم
    return calculateInvestorProfitForPeriod(investorId, firstDayOfMonth, today);
}

// حساب الأرباح للشهر السابق
function calculatePreviousMonthProfit(investorId) {
    // تحديد أول وآخر يوم في الشهر السابق
    const today = new Date();
    const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const firstDayOfPrevMonth = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), 1);
    
    // حساب الأرباح للشهر السابق
    return calculateInvestorProfitForPeriod(investorId, firstDayOfPrevMonth, lastDayOfPrevMonth);
}

// الحصول على تفاصيل أرباح الاستثمارات لمستثمر معين
function getInvestmentProfitDetails(investorId, startDate, endDate) {
    if (!investorId || !startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // الحصول على جميع استثمارات المستثمر النشطة
    const investorInvestments = investments.filter(inv => 
        inv.investorId === investorId && 
        (inv.status === 'active' || 
         (inv.status === 'closed' && new Date(inv.closedDate) >= start))
    );
    
    // إنشاء مصفوفة لتفاصيل الأرباح
    const profitDetails = [];
    
    investorInvestments.forEach(investment => {
        // تحديد تاريخ بداية حساب الربح
        const investmentStart = new Date(investment.date);
        const profitStartDate = investmentStart > start ? investmentStart : start;
        
        // تحديد تاريخ نهاية حساب الربح
        let profitEndDate;
        if (investment.status === 'closed') {
            const closedDate = new Date(investment.closedDate);
            profitEndDate = closedDate < end ? closedDate : end;
        } else {
            profitEndDate = end;
        }
        
        // حساب عدد الأيام النشطة
        const activeDays = daysDifference(profitStartDate, profitEndDate);
        
        // حساب عدد الأيام في الفترة
        const periodDays = daysDifference(start, end);
        
        // حساب النسبة المئوية للفترة النشطة
        const activePercentage = (activeDays / periodDays) * 100;
        
        // حساب الربح لهذا الاستثمار
        const profit = calculateProfitImproved(investment.amount, profitStartDate, profitEndDate);
        
        // إضافة التفاصيل إلى المصفوفة
        profitDetails.push({
            investmentId: investment.id,
            amount: investment.amount,
            startDate: profitStartDate.toISOString(),
            endDate: profitEndDate.toISOString(),
            activeDays: activeDays,
            totalDays: periodDays,
            activePercentage: activePercentage,
            profit: profit
        });
    });
    
    return profitDetails;
}

// تحديث وظيفة دفع الأرباح
function enhancePayProfitModal() {
    // الحصول على المستثمر المحدد
    const investorId = document.getElementById('profitInvestor').value;
    if (!investorId) return;
    
    // الحصول على الفترة المحددة
    const periodType = document.getElementById('profitPeriod').value;
    
    let startDate, endDate, periodProfit;
    
    // تحديد الفترة بناءً على النوع المحدد
    if (periodType === 'current') {
        // الشهر الحالي
        const today = new Date();
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        periodProfit = calculateCurrentMonthProfit(investorId);
    } else if (periodType === 'previous') {
        // الشهر السابق
        const today = new Date();
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        periodProfit = calculatePreviousMonthProfit(investorId);
    } else if (periodType === 'custom') {
        // فترة مخصصة
        startDate = new Date(document.getElementById('profitFromDate').value);
        endDate = new Date(document.getElementById('profitToDate').value);
        
        if (!startDate || !endDate) {
            createNotification('خطأ', 'يرجى تحديد الفترة الزمنية بشكل صحيح', 'danger');
            return;
        }
        
        periodProfit = calculateInvestorProfitForPeriod(investorId, startDate, endDate);
    }
    
    // تحديث المبلغ المستحق في النموذج
    const dueProfitInput = document.getElementById('dueProfit');
    if (dueProfitInput) {
        dueProfitInput.value = formatCurrency(periodProfit.toFixed(2));
    }
    
    // تحديث المبلغ المراد دفعه
    const profitAmountInput = document.getElementById('profitAmount');
    if (profitAmountInput) {
        profitAmountInput.value = Math.floor(periodProfit); // تقريب المبلغ للأسفل
    }
    
    // عرض تفاصيل حساب الأرباح (اختياري)
    const profitDetails = getInvestmentProfitDetails(investorId, startDate, endDate);
    displayProfitCalculationDetails(profitDetails);
}

// عرض تفاصيل حساب الأرباح (يمكن إضافة هذه الوظيفة إلى واجهة المستخدم)
function displayProfitCalculationDetails(profitDetails) {
    // إنشاء عنصر لعرض تفاصيل حساب الأرباح
    const detailsContainer = document.getElementById('profitCalculationDetails');
    
    // إذا لم يكن العنصر موجودًا، قم بإنشائه
    if (!detailsContainer) {
        // إنشاء عنصر جديد بعد نموذج دفع الأرباح
        const form = document.getElementById('payProfitForm');
        const newContainer = document.createElement('div');
        newContainer.id = 'profitCalculationDetails';
        newContainer.className = 'profit-details';
        newContainer.style.marginTop = '20px';
        
        // إضافة العنصر إلى النموذج
        form.parentNode.insertBefore(newContainer, form.nextSibling);
        
        displayDetails(newContainer, profitDetails);
    } else {
        // استخدام العنصر الموجود
        displayDetails(detailsContainer, profitDetails);
    }
    
    // عرض التفاصيل في العنصر
    function displayDetails(container, details) {
        if (!details || details.length === 0) {
            container.innerHTML = '<div class="alert alert-info">لا توجد استثمارات نشطة خلال الفترة المحددة.</div>';
            return;
        }
        
        // إنشاء HTML لعرض التفاصيل
        let html = `
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <div class="table-header">
                    <div class="table-title">تفاصيل حساب الأرباح</div>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>المبلغ</th>
                            <th>تاريخ البداية</th>
                            <th>تاريخ النهاية</th>
                            <th>عدد الأيام النشطة</th>
                            <th>النسبة المئوية</th>
                            <th>الربح</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // إضافة صفوف الجدول
        details.forEach(detail => {
            html += `
                <tr>
                    <td>${formatCurrency(detail.amount)}</td>
                    <td>${formatDate(detail.startDate)}</td>
                    <td>${formatDate(detail.endDate)}</td>
                    <td>${detail.activeDays} / ${detail.totalDays}</td>
                    <td>${detail.activePercentage.toFixed(2)}%</td>
                    <td>${formatCurrency(detail.profit.toFixed(2))}</td>
                </tr>
            `;
        });
        
        // حساب المجموع
        const totalProfit = details.reduce((sum, detail) => sum + detail.profit, 0);
        
        html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="5">المجموع</th>
                            <th>${formatCurrency(totalProfit.toFixed(2))}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
}

// ربط وظيفة تحديث حساب الأرباح مع نموذج دفع الأرباح
function initProfitCalculationEnhancements() {
    // إضافة مستمع للتغيير في المستثمر المحدد
    const investorSelect = document.getElementById('profitInvestor');
    if (investorSelect) {
        investorSelect.addEventListener('change', enhancePayProfitModal);
    }
    
    // إضافة مستمع للتغيير في نوع الفترة
    const periodSelect = document.getElementById('profitPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            toggleCustomProfitPeriod();
            enhancePayProfitModal();
        });
    }
    
    // إضافة مستمعين للتغيير في تواريخ الفترة المخصصة
    const fromDateInput = document.getElementById('profitFromDate');
    const toDateInput = document.getElementById('profitToDate');
    
    if (fromDateInput && toDateInput) {
        fromDateInput.addEventListener('change', enhancePayProfitModal);
        toDateInput.addEventListener('change', enhancePayProfitModal);
    }
}

// استبدال وظيفة updateDueProfit الحالية بوظيفة محسنة
function updateDueProfit() {
    const investorId = document.getElementById('profitInvestor').value;
    if (!investorId) return;
    
    // استدعاء الوظيفة المحسنة
    enhancePayProfitModal();
}

// بدء تنفيذ التحسينات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق التحسينات على نظام حساب الأرباح
    initProfitCalculationEnhancements();
    
    console.log('تم تحميل تحسينات حساب الأرباح بنجاح.');
});

// استبدال وظيفة calculateProfit الأصلية بالوظيفة المحسنة
// لضمان استخدام الحساب الدقيق في جميع أنحاء النظام
const originalCalculateProfit = calculateProfit;
calculateProfit = calculateProfitImproved;

console.log('تم تحسين نظام حساب الأرباح بنجاح.');