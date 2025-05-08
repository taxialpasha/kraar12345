/**
 * نظام بطاقات المستثمرين - Investor Card System (النسخة المحدثة 3.0)
 * 
 * نظام متكامل لإنشاء وإدارة بطاقات المستثمرين
 * متوافق مع نظام إدارة الاستثمار
 */

// إضافة أنماط CSS للبطاقات
const cardStyles = `
    /* أنماط بطاقات المستثمرين */
    .investor-card {
        width: 390px;
        height: 245px;
        border-radius: 15px;
        background-color: #101a2c;
        color: white;
        padding: 25px;
        position: relative;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        margin: 0 auto 30px;
        overflow: hidden;
        transition: transform 0.3s ease;
        perspective: 1000px;
        cursor: pointer;
    }
    
    .investor-card:hover {
        transform: translateY(-5px);
    }
    
    .investor-card.flipped .card-inner {
        transform: rotateY(180deg);
    }
    
    .card-inner {
        width: 100%;
        height: 100%;
        position: relative;
        transition: transform 0.8s;
        transform-style: preserve-3d;
    }
    
    .card-front, .card-back {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        backface-visibility: hidden;
        border-radius: 15px;
    }
    
    .card-back {
        transform: rotateY(180deg);
        background-color: inherit;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    
    .card-brand {
        position: absolute;
        top: 20px;
        right: 25px;
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: 1px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .card-logo {
        position: absolute;
        top: 20px;
        left: 25px;
        display: flex;
        gap: 5px;
    }
    
    .card-logo-circle {
        width: 30px;
        height: 30px;
        border-radius: 50%;
    }
    
    .card-logo-circle.red {
        background: #eb001b;
    }
    
    .card-logo-circle.yellow {
        background: #f79e1b;
        opacity: 0.8;
        margin-right: -15px;
    }
    
    .card-chip {
        position: absolute;
        top: 80px;
        right: 50px;
        width: 50px;
        height: 40px;
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        overflow: hidden;
    }
    
    .chip-line {
        position: absolute;
        height: 1.5px;
        background-color: rgba(0, 0, 0, 0.3);
        width: 100%;
    }
    
    .chip-line:nth-child(1) { top: 8px; }
    .chip-line:nth-child(2) { top: 16px; }
    .chip-line:nth-child(3) { top: 24px; }
    .chip-line:nth-child(4) { top: 32px; }
    
    .chip-line:nth-child(5) {
        height: 100%;
        width: 1.5px;
        left: 12px;
    }
    
    .chip-line:nth-child(6) {
        height: 100%;
        width: 1.5px;
        left: 24px;
    }
    
    .chip-line:nth-child(7) {
        height: 100%;
        width: 1.5px;
        left: 36px;
    }
    
    .card-hologram {
        position: absolute;
        width: 60px;
        height: 60px;
        bottom: 50px;
        left: 40px;
        background: linear-gradient(45deg, 
            rgba(255,255,255,0.1) 0%, 
            rgba(255,255,255,0.3) 25%, 
            rgba(255,255,255,0.5) 50%, 
            rgba(255,255,255,0.3) 75%, 
            rgba(255,255,255,0.1) 100%);
        border-radius: 50%;
        animation: hologram-animation 3s infinite linear;
        opacity: 0.7;
    }
    
    @keyframes hologram-animation {
        0% { 
            background-position: 0% 0%;
        }
        100% { 
            background-position: 100% 100%;
        }
    }
    
    .card-qrcode {
        width: 80px;
        height: 80px;
        background-color: #f8f9fa;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 15px;
        margin-left: auto;
        overflow: hidden;
    }
    
    .card-qrcode img, .card-qrcode canvas {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    
    .card-number {
        position: absolute;
        bottom: 80px;
        width: 100%;
        left: 0;
        padding: 0 25px;
        font-size: 1.5rem;
        letter-spacing: 2px;
        text-align: center;
        color: white;
        font-family: 'Courier New', monospace;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .card-details {
        position: absolute;
        bottom: 25px;
        width: 100%;
        left: 0;
        padding: 0 25px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    
    .card-validity {
        font-size: 0.9rem;
        display: flex;
        flex-direction: column;
    }
    
    .card-valid-text {
        font-size: 0.7rem;
        opacity: 0.7;
        margin-bottom: 3px;
    }
    
    .card-name {
        font-size: 1rem;
        text-align: right;
        text-transform: uppercase;
        font-family: 'Arial', sans-serif;
        letter-spacing: 1px;
    }
    
    .card-back-strip {
        width: 100%;
        height: 40px;
        background-color: rgba(0, 0, 0, 0.8);
        margin: 20px 0;
        position: relative;
    }
    
    .card-cvv {
        position: absolute;
        right: 20px;
        bottom: -25px;
        background-color: white;
        color: black;
        padding: 5px 15px;
        border-radius: 4px;
        font-size: 0.9rem;
        font-family: 'Courier New', monospace;
    }
    
    .card-issuer-info {
        margin-top: 30px;
        font-size: 0.8rem;
        text-align: center;
        opacity: 0.7;
    }
    
    /* أنماط قائمة البطاقات */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
        padding: 1rem;
    }
    
    .card-item {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        overflow: hidden;
        transition: transform 0.3s ease;
        cursor: pointer;
    }
    
    .card-item:hover {
        transform: translateY(-5px);
    }
    
    .card-preview {
        width: 320px;
        height: 200px;
        border-radius: 12px;
        background-color: #101a2c;
        color: white;
        padding: 15px;
        position: relative;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transition: transform 0.3s ease;
        overflow: hidden;
        margin: 0 auto;
    }
    
    .card-preview:hover {
        transform: translateY(-3px);
    }
    
    .card-preview .card-brand {
        font-size: 1rem;
    }
    
    .card-preview .card-logo-circle {
        width: 20px;
        height: 20px;
    }
    
    .card-preview .card-number {
        font-size: 1rem;
        bottom: 50px;
    }
    
    .card-preview .card-details {
        bottom: 15px;
    }
    
    .card-preview .card-name {
        font-size: 0.8rem;
    }
    
    .card-preview .card-chip {
        width: 35px;
        height: 28px;
        top: 60px;
        right: 40px;
    }
    
    /* أنماط نموذج إنشاء البطاقة */
    .card-form-group {
        margin-bottom: 1.5rem;
    }
    
    .card-type-options {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 0.5rem;
    }
    
    .card-type-option {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        background-color: var(--gray-100);
        border: 2px solid transparent;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .card-type-option:hover {
        background-color: var(--gray-200);
    }
    
    .card-type-option.selected {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }
    
    .card-type-option input {
        margin-left: 0.5rem;
    }
    
    /* أنماط إحصائيات البطاقات */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        background: var(--white);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        box-shadow: var(--box-shadow);
        transition: transform 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--primary-color);
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: var(--gray-600);
    }
    
    /* أنماط الماسح الضوئي */
    .scanner-container {
        position: relative;
        width: 100%;
        height: 300px;
        overflow: hidden;
        border-radius: var(--border-radius);
        background-color: var(--gray-900);
        margin-bottom: 1.5rem;
    }
    
    .scanner-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .scan-region-highlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200px;
        height: 200px;
        transform: translate(-50%, -50%);
        border: 2px solid var(--primary-color);
        box-shadow: 0 0 0 5000px rgba(0, 0, 0, 0.3);
        border-radius: var(--border-radius-sm);
    }
    
    /* أنماط أنواع البطاقات */
    .card-type-platinum {
        background-color: #303030;
        color: #ffffff;
    }
    
    .card-type-gold {
        background-color: #D4AF37;
        color: #000000;
    }
    
    .card-type-premium {
        background-color: #1F3A5F;
        color: #ffffff;
    }
    
    .card-type-diamond {
        background-color: #16213E;
        color: #ffffff;
    }
    
    .card-type-islamic {
        background-color: #006B3C;
        color: #ffffff;
    }
    
    .card-type-custom {
        background-color: #3498db;
        color: #ffffff;
    }
`;

// إضافة الأنماط إلى الصفحة
const styleElement = document.createElement('style');
styleElement.textContent = cardStyles;
document.head.appendChild(styleElement);

// تكوين أنواع البطاقات
const CARD_TYPES = {
    platinum: {
        name: 'بلاتينية',
        color: '#303030',
        textColor: '#ffffff',
        logoColor: '#ffffff',
        chipColor: '#FFD700',
        benefits: ['تأمين سفر', 'خدمة عملاء VIP', 'نقاط مضاعفة']
    },
    gold: {
        name: 'ذهبية',
        color: '#D4AF37',
        textColor: '#000000',
        logoColor: '#ffffff',
        chipColor: '#ffffff',
        benefits: ['نقاط مكافآت', 'خصومات خاصة', 'تأمين مشتريات']
    },
    premium: {
        name: 'بريميوم',
        color: '#1F3A5F',
        textColor: '#ffffff',
        logoColor: '#ffffff',
        chipColor: '#C0C0C0',
        benefits: ['مكافآت مشتريات', 'خدمة عملاء على مدار الساعة']
    },
    diamond: {
        name: 'ماسية',
        color: '#16213E',
        textColor: '#ffffff',
        logoColor: '#ffffff',
        chipColor: '#B9F2FF',
        benefits: ['امتيازات حصرية', 'خدمة شخصية', 'رصيد سفر سنوي']
    },
    islamic: {
        name: 'إسلامية',
        color: '#006B3C',
        textColor: '#ffffff',
        logoColor: '#ffffff',
        chipColor: '#F8C300',
        benefits: ['متوافقة مع الشريعة', 'مزايا عائلية']
    },
    custom: {
        name: 'مخصصة',
        color: '#3498db',
        textColor: '#ffffff',
        logoColor: '#ffffff',
        chipColor: '#C0C0C0',
        benefits: ['قابلة للتخصيص']
    }
};

// متغيرات النظام
let investorCards = JSON.parse(localStorage.getItem('investor_cards') || '[]');
let cardActivities = JSON.parse(localStorage.getItem('card_activities') || '[]');
let currentCardId = null;
let scanner = null;

// دوال مساعدة
function generateCardNumber() {
    // توليد رقم بطاقة يتوافق مع خوارزمية لون
    let cardNumber = '5'; // بداية ماستر كارد
    
    // توليد 14 رقم عشوائي
    for (let i = 0; i < 14; i++) {
        cardNumber += Math.floor(Math.random() * 10).toString();
    }
    
    // حساب رقم التحقق
    const checkDigit = calculateLuhnCheckDigit(cardNumber);
    cardNumber += checkDigit;
    
    // تنسيق الرقم
    return cardNumber.match(/.{1,4}/g).join(' ');
}

function calculateLuhnCheckDigit(partialNumber) {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = partialNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(partialNumber.charAt(i));
        
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return ((Math.floor(sum / 10) + 1) * 10 - sum) % 10;
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

function saveCards() {
    localStorage.setItem('investor_cards', JSON.stringify(investorCards));
}

function saveActivities() {
    localStorage.setItem('card_activities', JSON.stringify(cardActivities));
}

function addActivity(cardId, action, details = {}) {
    const activity = {
        id: generateId(),
        cardId,
        action,
        details,
        timestamp: new Date().toISOString()
    };
    
    cardActivities.unshift(activity);
    if (cardActivities.length > 100) {
        cardActivities = cardActivities.slice(0, 100);
    }
    
    saveActivities();
    return activity;
}

// إنشاء صفحات بطاقات المستثمرين
function createInvestorCardsPages() {
    // صفحة البطاقات الرئيسية
    const mainCardsPage = document.createElement('div');
    mainCardsPage.id = 'investor-cards';
    mainCardsPage.className = 'page';
    mainCardsPage.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <i class="fas fa-credit-card"></i>
                <span>بطاقات المستثمرين</span>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary" onclick="openNewCardModal()">
                    <i class="fas fa-plus"></i>
                    <span>إنشاء بطاقة جديدة</span>
                </button>
            </div>
        </div>
        
        <div class="page-content">
            <div class="search-section">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="بحث عن بطاقة..." id="cardSearchInput" onkeyup="searchCards()">
                </div>
                
                <div class="filter-group">
                    <select id="cardTypeFilter" onchange="filterCards()">
                        <option value="">جميع الأنواع</option>
                        <option value="platinum">بلاتينية</option>
                        <option value="gold">ذهبية</option>
                        <option value="premium">بريميوم</option>
                        <option value="diamond">ماسية</option>
                        <option value="islamic">إسلامية</option>
                        <option value="custom">مخصصة</option>
                    </select>
                    
                    <select id="cardStatusFilter" onchange="filterCards()">
                        <option value="">جميع الحالات</option>
                        <option value="active">نشطة</option>
                        <option value="inactive">موقوفة</option>
                        <option value="expired">منتهية</option>
                    </select>
                </div>
            </div>
            
            <div class="cards-grid" id="cardsContainer">
                <!-- سيتم ملؤها بالبطاقات -->
            </div>
            
            <div class="empty-state" id="noCardsMessage" style="display: none;">
                <i class="fas fa-credit-card"></i>
                <p>لا توجد بطاقات متاحة</p>
                <button class="btn btn-primary" onclick="openNewCardModal()">
                    <i class="fas fa-plus"></i>
                    <span>إنشاء بطاقة جديدة</span>
                </button>
            </div>
        </div>
    `;
    
    // صفحة مسح الباركود
    const scannerPage = document.createElement('div');
    scannerPage.id = 'card-scanner';
    scannerPage.className = 'page';
    scannerPage.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <i class="fas fa-qrcode"></i>
                <span>مسح باركود البطاقة</span>
            </div>
        </div>
        
        <div class="page-content">
            <div class="scanner-container" id="scannerContainer">
                <video id="scannerVideo"></video>
                <div class="scan-region-highlight"></div>
            </div>
            
            <div class="scanner-controls">
                <button class="btn btn-primary" id="startScanBtn" onclick="startScanner()">
                    <i class="fas fa-play"></i>
                    <span>بدء المسح</span>
                </button>
                
                <button class="btn btn-secondary" id="stopScanBtn" onclick="stopScanner()" disabled>
                    <i class="fas fa-stop"></i>
                    <span>إيقاف المسح</span>
                </button>
            </div>
            
            <div class="scan-result" id="scanResult" style="display: none;">
                <h3>نتيجة المسح</h3>
                <div id="scanResultData"></div>
                <button class="btn btn-primary" onclick="viewScannedCard()">
                    <i class="fas fa-eye"></i>
                    <span>عرض البطاقة</span>
                </button>
            </div>
        </div>
    `;
    
    // صفحة إحصائيات البطاقات
    const statsPage = document.createElement('div');
    statsPage.id = 'card-stats';
    statsPage.className = 'page';
    statsPage.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <i class="fas fa-chart-pie"></i>
                <span>إحصائيات البطاقات</span>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" onclick="exportCardStats()">
                    <i class="fas fa-download"></i>
                    <span>تصدير التقرير</span>
                </button>
            </div>
        </div>
        
        <div class="page-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalCardsCount">0</div>
                    <div class="stat-label">إجمالي البطاقات</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="activeCardsCount">0</div>
                    <div class="stat-label">البطاقات النشطة</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="expiredCardsCount">0</div>
                    <div class="stat-label">البطاقات المنتهية</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="avgCardAge">0</div>
                    <div class="stat-label">متوسط عمر البطاقة (يوم)</div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-card">
                    <h3>توزيع أنواع البطاقات</h3>
                    <canvas id="cardTypesChart"></canvas>
                </div>
                
                <div class="chart-card">
                    <h3>حالة البطاقات</h3>
                    <canvas id="cardStatusChart"></canvas>
                </div>
            </div>
            
            <div class="recent-activities">
                <h3>آخر الأنشطة</h3>
                <div id="recentActivitiesContainer">
                    <!-- سيتم ملؤها بالأنشطة -->
                </div>
            </div>
        </div>
    `;
    
    // إضافة الصفحات إلى الحاوية الرئيسية
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(mainCardsPage);
        mainContent.appendChild(scannerPage);
        mainContent.appendChild(statsPage);
    }
}

// إضافة روابط التنقل في الشريط الجانبي
function addCardSystemNavigation() {
    const sidebar = document.querySelector('.sidebar-menu');
    if (!sidebar) return;
    
    // إنشاء مجموعة بطاقات المستثمرين
    const cardSystemGroup = document.createElement('div');
    cardSystemGroup.className = 'menu-group';
    cardSystemGroup.innerHTML = `
        <div class="menu-group-title">بطاقات المستثمرين</div>
        <ul class="menu-items">
            <li>
                <a href="#" class="menu-item" data-page="investor-cards">
                    <div class="menu-icon">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <span>إدارة البطاقات</span>
                </a>
            </li>
            <li>
                <a href="#" class="menu-item" data-page="card-scanner">
                    <div class="menu-icon">
                        <i class="fas fa-qrcode"></i>
                    </div>
                    <span>مسح الباركود</span>
                </a>
            </li>
            <li>
                <a href="#" class="menu-item" data-page="card-stats">
                    <div class="menu-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <span>إحصائيات البطاقات</span>
                </a>
            </li>
        </ul>
    `;
    
    // إضافة المجموعة قبل الإعدادات
    const settingsItem = sidebar.querySelector('[data-page="settings"]')?.parentElement?.parentElement;
    if (settingsItem) {
        sidebar.insertBefore(cardSystemGroup, settingsItem);
    } else {
        sidebar.appendChild(cardSystemGroup);
    }
}

// عرض البطاقات
function loadCards() {
    const container = document.getElementById('cardsContainer');
    const noCardsMessage = document.getElementById('noCardsMessage');
    
    if (!container) return;
    
    const cards = getFilteredCards();
    
    if (cards.length === 0) {
        container.style.display = 'none';
        if (noCardsMessage) noCardsMessage.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    if (noCardsMessage) noCardsMessage.style.display = 'none';
    
    container.innerHTML = cards.map(card => createCardPreview(card)).join('');
}

// إنشاء معاينة البطاقة
function createCardPreview(card) {
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) return '';
    
    const expiryDate = new Date(card.expiryDate);
    const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const expiryYear = expiryDate.getFullYear().toString().slice(-2);
    
    const cardType = CARD_TYPES[card.cardType] || CARD_TYPES.custom;
    
    return `
        <div class="card-item" onclick="viewCardDetails('${card.id}')">
            <div class="card-preview card-type-${card.cardType}" style="background-color: ${cardType.color}; color: ${cardType.textColor};">
                <div class="card-brand">${cardType.name}</div>
                <div class="card-logo">
                    <div class="card-logo-circle red"></div>
                    <div class="card-logo-circle yellow"></div>
                </div>
                
                <div class="card-chip"></div>
                
                <div class="card-number">${card.cardNumber.slice(-4).padStart(16, '*').match(/.{1,4}/g).join(' ')}</div>
                
                <div class="card-details">
                    <div class="card-validity">
                        <div class="card-valid-text">VALID THRU</div>
                        <div>${expiryMonth}/${expiryYear}</div>
                    </div>
                    <div class="card-name">${investor.name}</div>
                </div>
            </div>
            
            <div class="card-info">
                <h4>${investor.name}</h4>
                <p>الحالة: ${getCardStatusBadge(card)}</p>
            </div>
        </div>
    `;
}

// فتح نافذة إنشاء بطاقة جديدة
function openNewCardModal() {
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-header">
            <h2>إنشاء بطاقة جديدة</h2>
            <button class="close-btn" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body">
            <form id="newCardForm" onsubmit="createNewCard(event)">
                <div class="form-group">
                    <label>المستثمر</label>
                    <select name="investorId" required>
                        <option value="">اختر المستثمر</option>
                        ${getInvestorsWithoutActiveCards().map(investor => `
                            <option value="${investor.id}">${investor.name}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>نوع البطاقة</label>
                    <div class="card-type-options">
                        ${Object.entries(CARD_TYPES).map(([type, info]) => `
                            <label class="card-type-option" data-type="${type}">
                                <input type="radio" name="cardType" value="${type}" ${type === 'platinum' ? 'checked' : ''}>
                                <span>${info.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>تاريخ الانتهاء</label>
                    <input type="date" name="expiryDate" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="enablePin"> 
                        تفعيل رمز PIN
                    </label>
                </div>
                
                <div class="form-group" id="pinGroup" style="display: none;">
                    <label>رمز PIN (4 أرقام)</label>
                    <input type="password" name="pin" pattern="[0-9]{4}" maxlength="4">
                </div>
                
                <div class="form-group">
                    <label>ميزات إضافية</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="enableQRCode" checked>
                            تفعيل رمز QR
                        </label>
                        <label>
                            <input type="checkbox" name="enableChip" checked>
                            تفعيل الشريحة
                        </label>
                        <label>
                            <input type="checkbox" name="enableHologram" checked>
                            تفعيل الهولوجرام
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">إنشاء البطاقة</button>
                </div>
            </form>
        </div>
    `;
    
    // إضافة مستمعات الأحداث
    const form = document.getElementById('newCardForm');
    const pinCheckbox = form.querySelector('input[name="enablePin"]');
    const pinGroup = document.getElementById('pinGroup');
    
    pinCheckbox.addEventListener('change', (e) => {
        pinGroup.style.display = e.target.checked ? 'block' : 'none';
    });
    
    // تحديث الخيار المحدد
    form.querySelectorAll('.card-type-option').forEach(option => {
        option.addEventListener('click', () => {
            form.querySelectorAll('.card-type-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            option.querySelector('input').checked = true;
        });
    });
}

// إنشاء بطاقة جديدة
function createNewCard(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const investorId = formData.get('investorId');
    const investor = investors.find(inv => inv.id === investorId);
    
    if (!investor) {
        showNotification('خطأ', 'المستثمر غير موجود', 'error');
        return;
    }
    
    const cardData = {
        id: generateId(),
        investorId: investorId,
        cardType: formData.get('cardType'),
        cardNumber: generateCardNumber(),
        cvv: generateCVV(),
        expiryDate: formData.get('expiryDate'),
        status: 'active',
        createdAt: new Date().toISOString(),
        features: {
            enablePin: formData.get('enablePin') ? true : false,
            enableQRCode: formData.get('enableQRCode') ? true : false,
            enableChip: formData.get('enableChip') ? true : false,
            enableHologram: formData.get('enableHologram') ? true : false
        }
    };
    
    if (cardData.features.enablePin) {
        const pin = formData.get('pin');
        if (pin && pin.length === 4) {
            cardData.pin = pin;
        } else {
            showNotification('خطأ', 'رمز PIN يجب أن يتكون من 4 أرقام', 'error');
            return;
        }
    }
    
    investorCards.push(cardData);
    saveCards();
    
    // إضافة نشاط
    addActivity(cardData.id, 'create', {
        investorName: investor.name,
        cardType: cardData.cardType
    });
    
    closeModal();
    loadCards();
    showNotification('نجاح', 'تم إنشاء البطاقة بنجاح', 'success');
}

// عرض تفاصيل البطاقة
function viewCardDetails(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) return;
    
    const modal = createModal();
    const cardType = CARD_TYPES[card.cardType] || CARD_TYPES.custom;
    
    modal.innerHTML = `
        <div class="modal-header">
            <h2>تفاصيل البطاقة</h2>
            <button class="close-btn" onclick="closeModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body">
            <div class="card-details-container">
                <div class="investor-card card-type-${card.cardType}" style="background-color: ${cardType.color}; color: ${cardType.textColor};">
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="card-brand">${cardType.name}</div>
                            <div class="card-logo">
                                <div class="card-logo-circle red"></div>
                                <div class="card-logo-circle yellow"></div>
                            </div>
                            
                            ${card.features.enableChip ? '<div class="card-chip"><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div></div>' : ''}
                            
                            ${card.features.enableHologram ? '<div class="card-hologram"></div>' : ''}
                            
                            ${card.features.enableQRCode ? `<div class="card-qrcode"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.id}" alt="QR Code"></div>` : ''}
                            
                            <div class="card-number">${card.cardNumber}</div>
                            
                            <div class="card-details">
                                <div class="card-validity">
                                    <div class="card-valid-text">VALID THRU</div>
                                    <div>${formatCardExpiry(card.expiryDate)}</div>
                                </div>
                                <div class="card-name">${investor.name}</div>
                            </div>
                        </div>
                        
                        <div class="card-back">
                            <div class="card-back-strip"></div>
                            <div class="card-cvv">CVV: ${card.cvv}</div>
                            <div class="card-issuer-info">
                                ${settings.companyName}<br>
                                بطاقة المستثمر
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-primary" onclick="flipCard(this.closest('.card-details-container').querySelector('.investor-card'))">
                        <i class="fas fa-sync-alt"></i>
                        <span>قلب البطاقة</span>
                    </button>
                    
                    <button class="btn btn-secondary" onclick="printCard('${card.id}')">
                        <i class="fas fa-print"></i>
                        <span>طباعة</span>
                    </button>
                    
                    <button class="btn btn-secondary" onclick="shareCard('${card.id}')">
                        <i class="fas fa-share-alt"></i>
                        <span>مشاركة</span>
                    </button>
                    
                    ${card.status === 'active' ? `
                        <button class="btn btn-danger" onclick="deactivateCard('${card.id}')">
                            <i class="fas fa-ban"></i>
                            <span>إيقاف البطاقة</span>
                        </button>
                    ` : `
                        <button class="btn btn-success" onclick="activateCard('${card.id}')">
                            <i class="fas fa-check-circle"></i>
                            <span>تفعيل البطاقة</span>
                        </button>
                    `}
                </div>
                
                <div class="card-info-section">
                    <h3>معلومات المستثمر</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">الاسم:</span>
                            <span class="value">${investor.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">رقم الهاتف:</span>
                            <span class="value">${investor.phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">البريد الإلكتروني:</span>
                            <span class="value">${investor.email || '-'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">تاريخ الإصدار:</span>
                            <span class="value">${formatDate(card.createdAt)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">تاريخ الانتهاء:</span>
                            <span class="value">${formatDate(card.expiryDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">الحالة:</span>
                            <span class="value">${getCardStatusBadge(card)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-activities">
                    <h3>سجل النشاط</h3>
                    <div class="activities-list">
                        ${getCardActivities(card.id).map(activity => `
                            <div class="activity-item">
                                <i class="${getActivityIcon(activity.action)}"></i>
                                <div class="activity-info">
                                    <span class="activity-action">${getActivityText(activity.action)}</span>
                                    <span class="activity-time">${formatDateTime(activity.timestamp)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // إضافة نشاط المشاهدة
    addActivity(card.id, 'view');
}

// دوال المسح الضوئي
function startScanner() {
    const video = document.getElementById('scannerVideo');
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                video.srcObject = stream;
                scanner = stream;
                startBtn.disabled = true;
                stopBtn.disabled = false;
                
                // بدء فحص الباركود
                scanBarcode();
            })
            .catch(err => {
                console.error('Error accessing camera:', err);
                showNotification('خطأ', 'لا يمكن الوصول إلى الكاميرا', 'error');
            });
    } else {
        showNotification('خطأ', 'المتصفح لا يدعم الوصول إلى الكاميرا', 'error');
    }
}

function stopScanner() {
    if (scanner) {
        scanner.getTracks().forEach(track => track.stop());
        scanner = null;
        
        const video = document.getElementById('scannerVideo');
        const startBtn = document.getElementById('startScanBtn');
        const stopBtn = document.getElementById('stopScanBtn');
        
        video.srcObject = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function scanBarcode() {
    // هنا يجب دمج مكتبة لمسح الباركود مثل QuaggaJS أو ZXing
    // لتبسيط المثال، سنستخدم مسح وهمي
    if (!scanner) return;
    
    // محاكاة مسح الباركود
    setTimeout(() => {
        if (scanner) {
            // محاكاة العثور على بطاقة
            const demoCardId = investorCards[0]?.id;
            if (demoCardId) {
                onBarcodeDetected(demoCardId);
            }
            
            // متابعة المسح
            scanBarcode();
        }
    }, 2000);
}

function onBarcodeDetected(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) return;
    
    stopScanner();
    
    const scanResult = document.getElementById('scanResult');
    const scanResultData = document.getElementById('scanResultData');
    
    scanResult.style.display = 'block';
    scanResultData.innerHTML = `
        <div class="scan-result-card">
            <h4>${investor.name}</h4>
            <p>نوع البطاقة: ${CARD_TYPES[card.cardType]?.name}</p>
            <p>رقم البطاقة: ${card.cardNumber}</p>
            <p>الحالة: ${getCardStatusBadge(card)}</p>
        </div>
    `;
    
    currentCardId = cardId;
    addActivity(cardId, 'scan');
}

function viewScannedCard() {
    if (currentCardId) {
        viewCardDetails(currentCardId);
    }
}

// دوال الإحصائيات
function loadCardStats() {
    updateStatsCards();
    createChartsIfNeeded();
    updateCharts();
    loadRecentActivities();
}

function updateStatsCards() {
    const totalCards = investorCards.length;
    const activeCards = investorCards.filter(card => card.status === 'active').length;
    const expiredCards = investorCards.filter(card => new Date(card.expiryDate) < new Date()).length;
    
    // حساب متوسط عمر البطاقة
    const avgAge = investorCards.reduce((sum, card) => {
        const age = Math.floor((new Date() - new Date(card.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + age;
    }, 0) / totalCards || 0;
    
    document.getElementById('totalCardsCount').textContent = totalCards;
    document.getElementById('activeCardsCount').textContent = activeCards;
    document.getElementById('expiredCardsCount').textContent = expiredCards;
    document.getElementById('avgCardAge').textContent = Math.round(avgAge);
}

function createChartsIfNeeded() {
    if (!window.cardChartsCreated) {
        createCardTypeChart();
        createCardStatusChart();
        window.cardChartsCreated = true;
    }
}

function createCardTypeChart() {
    const ctx = document.getElementById('cardTypesChart');
    if (!ctx) return;
    
    const typeData = {};
    Object.keys(CARD_TYPES).forEach(type => {
        typeData[type] = investorCards.filter(card => card.cardType === type).length;
    });
    
    window.cardTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(CARD_TYPES).map(type => CARD_TYPES[type].name),
            datasets: [{
                data: Object.values(typeData),
                backgroundColor: Object.keys(CARD_TYPES).map(type => CARD_TYPES[type].color)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createCardStatusChart() {
    const ctx = document.getElementById('cardStatusChart');
    if (!ctx) return;
    
    const now = new Date();
    const active = investorCards.filter(card => card.status === 'active' && new Date(card.expiryDate) > now).length;
    const expired = investorCards.filter(card => new Date(card.expiryDate) <= now).length;
    const inactive = investorCards.filter(card => card.status === 'inactive').length;
    
    window.cardStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['نشطة', 'منتهية الصلاحية', 'موقوفة'],
            datasets: [{
                data: [active, expired, inactive],
                backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateCharts() {
    if (window.cardTypeChart) {
        const typeData = {};
        Object.keys(CARD_TYPES).forEach(type => {
            typeData[type] = investorCards.filter(card => card.cardType === type).length;
        });
        
        window.cardTypeChart.data.datasets[0].data = Object.values(typeData);
        window.cardTypeChart.update();
    }
    
    if (window.cardStatusChart) {
        const now = new Date();
        const active = investorCards.filter(card => card.status === 'active' && new Date(card.expiryDate) > now).length;
        const expired = investorCards.filter(card => new Date(card.expiryDate) <= now).length;
        const inactive = investorCards.filter(card => card.status === 'inactive').length;
        
        window.cardStatusChart.data.datasets[0].data = [active, expired, inactive];
        window.cardStatusChart.update();
    }
}

function loadRecentActivities() {
    const container = document.getElementById('recentActivitiesContainer');
    if (!container) return;
    
    const recentActivities = cardActivities.slice(0, 10);
    
    container.innerHTML = recentActivities.map(activity => {
        const card = investorCards.find(c => c.id === activity.cardId);
        const investor = card ? investors.find(inv => inv.id === card.investorId) : null;
        
        return `
            <div class="activity-item">
                <i class="${getActivityIcon(activity.action)}"></i>
                <div class="activity-info">
                    <div class="activity-title">
                        ${getActivityText(activity.action)}
                        ${investor ? `- ${investor.name}` : ''}
                    </div>
                    <div class="activity-time">${formatDateTime(activity.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// دوال مساعدة إضافية
function getInvestorsWithoutActiveCards() {
    return investors.filter(investor => {
        const hasActiveCard = investorCards.some(card => 
            card.investorId === investor.id && 
            card.status === 'active' && 
            new Date(card.expiryDate) > new Date()
        );
        return !hasActiveCard;
    });
}

function getFilteredCards() {
    let filtered = [...investorCards];
    
    // فلترة حسب البحث
    const searchTerm = document.getElementById('cardSearchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(card => {
            const investor = investors.find(inv => inv.id === card.investorId);
            return investor && (
                investor.name.toLowerCase().includes(searchTerm) ||
                card.cardNumber.includes(searchTerm)
            );
        });
    }
    
    // فلترة حسب النوع
    const typeFilter = document.getElementById('cardTypeFilter')?.value;
    if (typeFilter) {
        filtered = filtered.filter(card => card.cardType === typeFilter);
    }
    
    // فلترة حسب الحالة
    const statusFilter = document.getElementById('cardStatusFilter')?.value;
    if (statusFilter) {
        const now = new Date();
        switch (statusFilter) {
            case 'active':
                filtered = filtered.filter(card => card.status === 'active' && new Date(card.expiryDate) > now);
                break;
            case 'inactive':
                filtered = filtered.filter(card => card.status === 'inactive');
                break;
            case 'expired':
                filtered = filtered.filter(card => new Date(card.expiryDate) <= now);
                break;
        }
    }
    
    return filtered;
}

function getCardStatusBadge(card) {
    const now = new Date();
    const expiryDate = new Date(card.expiryDate);
    
    if (card.status === 'inactive') {
        return '<span class="status inactive">موقوفة</span>';
    } else if (expiryDate <= now) {
        return '<span class="status expired">منتهية</span>';
    } else {
        return '<span class="status active">نشطة</span>';
    }
}

function formatCardExpiry(dateStr) {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
}

function getCardActivities(cardId) {
    return cardActivities.filter(activity => activity.cardId === cardId);
}

function getActivityIcon(action) {
    const icons = {
        create: 'fas fa-plus-circle',
        view: 'fas fa-eye',
        scan: 'fas fa-qrcode',
        deactivate: 'fas fa-ban',
        activate: 'fas fa-check-circle',
        print: 'fas fa-print',
        share: 'fas fa-share-alt'
    };
    return icons[action] || 'fas fa-info-circle';
}

function getActivityText(action) {
    const texts = {
        create: 'إنشاء بطاقة',
        view: 'عرض البطاقة',
        scan: 'مسح الباركود',
        deactivate: 'إيقاف البطاقة',
        activate: 'تفعيل البطاقة',
        print: 'طباعة البطاقة',
        share: 'مشاركة البطاقة'
    };
    return texts[action] || action;
}

function searchCards() {
    loadCards();
}

function filterCards() {
    loadCards();
}

function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function printCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    // فتح نافذة طباعة جديدة
    const printWindow = window.open('', 'Print Card', 'width=600,height=400');
    
    // إنشاء محتوى الطباعة
    const investor = investors.find(inv => inv.id === card.investorId);
    const cardType = CARD_TYPES[card.cardType] || CARD_TYPES.custom;
    
    const printContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>طباعة بطاقة</title>
            <style>
                ${cardStyles}
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background: #f5f5f5;
                }
                @media print {
                    body {
                        padding: 0;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
                .print-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="investor-card card-type-${card.cardType}" style="background-color: ${cardType.color}; color: ${cardType.textColor};">
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="card-brand">${cardType.name}</div>
                            <div class="card-logo">
                                <div class="card-logo-circle red"></div>
                                <div class="card-logo-circle yellow"></div>
                            </div>
                            ${card.features.enableChip ? '<div class="card-chip"><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div><div class="chip-line"></div></div>' : ''}
                            <div class="card-number">${card.cardNumber}</div>
                            <div class="card-details">
                                <div class="card-validity">
                                    <div class="card-valid-text">VALID THRU</div>
                                    <div>${formatCardExpiry(card.expiryDate)}</div>
                                </div>
                                <div class="card-name">${investor.name}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">طباعة البطاقة</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // تشغيل الطباعة بعد تحميل المحتوى
    printWindow.onload = function() {
        printWindow.print();
    };
    
    // إضافة نشاط الطباعة
    addActivity(cardId, 'print');
}

function shareCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    const investor = investors.find(inv => inv.id === card.investorId);
    
    // إنشاء نص للمشاركة
    const shareText = `
بطاقة المستثمر: ${investor.name}
نوع البطاقة: ${CARD_TYPES[card.cardType]?.name}
رقم البطاقة: ${card.cardNumber}
    `.trim();
    
    // نسخ إلى الحافظة
    navigator.clipboard.writeText(shareText).then(() => {
        showNotification('نجاح', 'تم نسخ معلومات البطاقة', 'success');
    });
    
    // إضافة نشاط المشاركة
    addActivity(cardId, 'share');
}

function deactivateCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    if (confirm('هل أنت متأكد من إيقاف هذه البطاقة؟')) {
        card.status = 'inactive';
        saveCards();
        
        addActivity(cardId, 'deactivate');
        
        closeModal();
        loadCards();
        showNotification('نجاح', 'تم إيقاف البطاقة', 'success');
    }
}

function activateCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    card.status = 'active';
    saveCards();
    
    addActivity(cardId, 'activate');
    
    closeModal();
    loadCards();
    showNotification('نجاح', 'تم تفعيل البطاقة', 'success');
}

function exportCardStats() {
    const stats = {
        totalCards: investorCards.length,
        activeCards: investorCards.filter(card => card.status === 'active').length,
        expiredCards: investorCards.filter(card => new Date(card.expiryDate) < new Date()).length,
        cardsByType: {},
        exportDate: new Date().toISOString()
    };
    
    // إحصائيات حسب النوع
    Object.keys(CARD_TYPES).forEach(type => {
        stats.cardsByType[type] = investorCards.filter(card => card.cardType === type).length;
    });
    
    // تنزيل الملف
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card_statistics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// دمج مع النظام الرئيسي
function initCardSystem() {
    console.log('تهيئة نظام بطاقات المستثمرين...');
    
    // إنشاء الصفحات
    createInvestorCardsPages();
    
    // إضافة التنقل
    addCardSystemNavigation();
    
    // تحميل البطاقات عند التنقل إلى صفحة البطاقات
    document.addEventListener('click', function(e) {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
            const page = menuItem.getAttribute('data-page');
            
            // إخفاء جميع الصفحات
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            // إظهار الصفحة المطلوبة
            const targetPage = document.getElementById(page);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // تحميل البيانات حسب الصفحة
                switch (page) {
                    case 'investor-cards':
                        loadCards();
                        break;
                    case 'card-stats':
                        loadCardStats();
                        break;
                }
            }
            
            // تحديث العنصر النشط في القائمة
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            menuItem.classList.add('active');
        }
    });
}

// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initCardSystem();
});

// تصدير الدوال العامة
window.investorCardSystem = {
    openNewCardModal,
    viewCardDetails,
    searchCards,
    filterCards,
    startScanner,
    stopScanner,
    exportCardStats
};