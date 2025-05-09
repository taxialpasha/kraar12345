/**
 * ملف لربط نظام بطاقات المستثمرين بالواجهة الرئيسية
 */

document.addEventListener('DOMContentLoaded', function() {
    // 1. إضافة زر في القائمة الجانبية
    addCardSystemToSidebar();
    
    // 2. إضافة أيقونة في الشريط العلوي
    addCardIconToHeader();
    
    // 3. إضافة نافذة منبثقة لعرض بطاقات المستثمرين بالضغط السريع
    setupQuickCardView();
});

/**
 * إضافة زر في القائمة الجانبية
 */
function addCardSystemToSidebar() {
    // البحث عن مكان مناسب في القائمة
    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (!sidebarMenu) return;
    
    // البحث عن قسم "إدارة الاستثمار" في القائمة
    const investmentSection = Array.from(sidebarMenu.querySelectorAll('.menu-category')).find(
        cat => cat.textContent.includes('إدارة الاستثمار')
    );
    
    if (investmentSection) {
        // إنشاء عنصر القائمة الجديد
        const menuItem = document.createElement('a');
        menuItem.href = "#investorCards";
        menuItem.className = 'menu-item';
        menuItem.onclick = () => showPage('investorCards');
        menuItem.innerHTML = `
            <span class="menu-icon"><i class="fas fa-credit-card"></i></span>
            <span>بطاقات المستثمرين</span>
        `;
        
        // إضافة العنصر بعد "المستثمرين"
        const investorsLink = sidebarMenu.querySelector('a[href="#investors"]');
        if (investorsLink && investorsLink.nextSibling) {
            sidebarMenu.insertBefore(menuItem, investorsLink.nextSibling);
        } else {
            investmentSection.insertAdjacentElement('afterend', menuItem);
        }
        
        console.log('تمت إضافة بطاقات المستثمرين إلى القائمة الجانبية');
    }
}

/**
 * إضافة أيقونة سريعة في الشريط العلوي
 */
function addCardIconToHeader() {
    // إضافة أيقونة في الشريط العلوي لجميع الصفحات
    const headerActions = document.querySelectorAll('.header-actions');
    
    headerActions.forEach(headerAction => {
        if (headerAction.querySelector('.card-quick-btn')) return; // تجنب التكرار
        
        // إنشاء زر الأيقونة
        const cardBtn = document.createElement('div');
        cardBtn.className = 'card-quick-btn';
        cardBtn.innerHTML = `<i class="fas fa-credit-card"></i>`;
        cardBtn.title = "عرض بطاقات المستثمرين";
        cardBtn.onclick = showQuickCardModal;
        
        // إضافة الزر بعد زر البحث
        const searchBar = headerAction.querySelector('.search-bar');
        if (searchBar) {
            searchBar.insertAdjacentElement('afterend', cardBtn);
        } else {
            headerAction.prepend(cardBtn);
        }
    });
    
    // إضافة الأنماط CSS للزر
    addQuickButtonStyles();
}

/**
 * إضافة الأنماط CSS لزر العرض السريع
 */
function addQuickButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .card-quick-btn {
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
        }
        
        .card-quick-btn:hover {
            transform: scale(1.1);
            background-color: var(--info-color);
        }
        
        .quick-card-modal {
            position: fixed;
            top: 60px;
            right: 20px;
            width: 400px;
            max-width: 90vw;
            max-height: 80vh;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            overflow: hidden;
            display: none;
            flex-direction: column;
            animation: slideDown 0.3s ease;
        }
        
        .quick-card-modal.active {
            display: flex;
        }
        
        .quick-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid var(--gray-200);
        }
        
        .quick-card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--gray-800);
        }
        
        .quick-card-close {
            cursor: pointer;
            color: var(--gray-600);
            transition: color 0.2s;
        }
        
        .quick-card-close:hover {
            color: var(--danger-color);
        }
        
        .quick-card-body {
            padding: 15px;
            overflow-y: auto;
            max-height: calc(80vh - 60px);
        }
        
        .quick-card-footer {
            padding: 10px 15px;
            border-top: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
        }
        
        .quick-card-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999;
            display: none;
        }
        
        .quick-card-overlay.active {
            display: block;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .mini-card {
            display: flex;
            margin-bottom: 15px;
            background: var(--gray-100);
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .mini-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .mini-card-preview {
            width: 120px;
            height: 70px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 8px;
            color: white;
            position: relative;
        }
        
        .mini-card-preview.card-platinum {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }
        
        .mini-card-preview.card-gold {
            background: linear-gradient(135deg, #532100 0%, #90712b 100%);
        }
        
        .mini-card-preview.card-premium {
            background: linear-gradient(135deg, #192f6a 0%, #3b5998 100%);
        }
        
        .mini-card-number {
            font-size: 0.55rem;
            letter-spacing: 0.5px;
        }
        
        .mini-card-info {
            padding: 10px;
            flex: 1;
        }
        
        .mini-card-investor {
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 3px;
        }
        
        .mini-card-status {
            font-size: 0.7rem;
            display: inline-block;
            padding: 2px 6px;
            border-radius: 20px;
            background-color: rgba(46, 204, 113, 0.1);
            color: #2ecc71;
        }
        
        .mini-card-status.suspended {
            background-color: rgba(231, 76, 60, 0.1);
            color: #e74c3c;
        }
        
        .no-cards-message {
            text-align: center;
            padding: 20px;
            color: var(--gray-600);
        }
        
        .no-cards-message i {
            font-size: 2rem;
            margin-bottom: 10px;
            color: var(--gray-400);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * إعداد نافذة منبثقة لعرض البطاقات
 */
function setupQuickCardView() {
    // إنشاء العناصر اللازمة للنافذة المنبثقة
    const overlay = document.createElement('div');
    overlay.className = 'quick-card-overlay';
    overlay.onclick = hideQuickCardModal;
    
    const modal = document.createElement('div');
    modal.className = 'quick-card-modal';
    modal.innerHTML = `
        <div class="quick-card-header">
            <div class="quick-card-title">بطاقات المستثمرين</div>
            <div class="quick-card-close" onclick="hideQuickCardModal()">
                <i class="fas fa-times"></i>
            </div>
        </div>
        <div class="quick-card-body" id="quickCardBody">
            <!-- سيتم تحميل البطاقات هنا -->
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i> جاري تحميل البطاقات...
            </div>
        </div>
        <div class="quick-card-footer">
            <button class="btn btn-light btn-sm" onclick="hideQuickCardModal()">إغلاق</button>
            <button class="btn btn-primary btn-sm" onclick="viewAllCards()">عرض جميع البطاقات</button>
        </div>
    `;
    
    // إضافة العناصر للصفحة
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // تعريف الدوال العالمية للتعامل مع النافذة
    window.showQuickCardModal = showQuickCardModal;
    window.hideQuickCardModal = hideQuickCardModal;
    window.viewAllCards = viewAllCards;
    window.viewCardFromMini = viewCardFromMini;
}

/**
 * عرض النافذة المنبثقة للبطاقات
 */
function showQuickCardModal() {
    const overlay = document.querySelector('.quick-card-overlay');
    const modal = document.querySelector('.quick-card-modal');
    
    if (overlay) overlay.classList.add('active');
    if (modal) modal.classList.add('active');
    
    // تحميل البطاقات النشطة
    loadActiveCardsForQuickView();
}

/**
 * إخفاء النافذة المنبثقة للبطاقات
 */
function hideQuickCardModal() {
    const overlay = document.querySelector('.quick-card-overlay');
    const modal = document.querySelector('.quick-card-modal');
    
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
}

/**
 * الانتقال إلى صفحة جميع البطاقات
 */
function viewAllCards() {
    hideQuickCardModal();
    showPage('investorCards');
}

/**
 * عرض تفاصيل بطاقة من البطاقة المصغرة
 */
function viewCardFromMini(cardId) {
    hideQuickCardModal();
    
    // التحقق من وجود دالة عرض تفاصيل البطاقة
    if (window.investorCardSystem && typeof window.investorCardSystem.viewCardDetails === 'function') {
        window.investorCardSystem.viewCardDetails(cardId);
    } else {
        console.error('لم يتم العثور على دالة عرض تفاصيل البطاقة');
    }
}

/**
 * تحميل البطاقات النشطة للعرض السريع
 */
function loadActiveCardsForQuickView() {
    const cardBody = document.getElementById('quickCardBody');
    if (!cardBody) return;
    
    // عرض تحميل
    cardBody.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin"></i> جاري تحميل البطاقات...
        </div>
    `;
    
    // التحقق من وجود نظام البطاقات
    if (!window.investorCardSystem || !window.investorCardSystem.getCards) {
        cardBody.innerHTML = `
            <div class="no-cards-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>لم يتم العثور على نظام البطاقات</p>
            </div>
        `;
        return;
    }
    
    // الحصول على البطاقات النشطة
    setTimeout(() => {
        const cards = window.investorCardSystem.getCards();
        const activeCards = cards.filter(card => card.status === 'active');
        
        if (activeCards.length === 0) {
            cardBody.innerHTML = `
                <div class="no-cards-message">
                    <i class="fas fa-credit-card"></i>
                    <p>لا توجد بطاقات نشطة</p>
                    <button class="btn btn-primary btn-sm" onclick="hideQuickCardModal(); openCreateCardModal();">
                        <i class="fas fa-plus"></i> إنشاء بطاقة جديدة
                    </button>
                </div>
            `;
            return;
        }
        
        // ترتيب البطاقات (الأحدث أولاً)
        activeCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // عرض البطاقات
        cardBody.innerHTML = activeCards.map(card => {
            // تنسيق رقم البطاقة للعرض
            const formattedNumber = `${card.cardNumber.slice(0, 4)} **** **** ${card.cardNumber.slice(-4)}`;
            
            return `
                <div class="mini-card" onclick="viewCardFromMini('${card.id}')">
                    <div class="mini-card-preview card-${card.type}">
                        <div class="mini-card-label">MASTERCARD</div>
                        <div class="mini-card-number">${formattedNumber}</div>
                    </div>
                    <div class="mini-card-info">
                        <div class="mini-card-investor">${card.investorName}</div>
                        <div class="mini-card-status ${card.status}">
                            ${card.status === 'active' ? 'نشطة' : 'متوقفة'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }, 300); // تأخير قصير لإظهار التحميل
}
