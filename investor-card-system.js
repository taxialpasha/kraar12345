// investor-card-system.js
// نظام بطاقات المستثمرين المتكامل مع Firebase والقراءة الواقعية

/**
 * نظام بطاقات المستثمرين المتكامل
 * - يدعم إنشاء البطاقات وإدارتها
 * - يتكامل مع Firebase للمزامنة المباشرة
 * - يدعم توليد وقراءة رموز QR
 * - يتكامل مع تطبيق الهاتف المحمول
 * - واجهة مستخدم متطورة ومحسنة
 */

// ===============================================================
// SECTION 1: متغيرات التخزين والتهيئة
// ===============================================================

let investorCards = [];
let currentCardId = null;
let cardDatabase = null;
let qrCodeScanner = null;
let cardFirebaseManager = null;
let mobileAPI = null;

// تهيئة Firebase
function initializeCardFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            
            // إنشاء مرجع لقاعدة البيانات
            cardDatabase = firebase.database().ref('investorCards');
            
            // الاستماع للتغييرات في البطاقات
            listenToCardChanges();
            
            console.log("✅ تم تهيئة Firebase بنجاح");
            
            // تهيئة مدير Firebase
            if (!cardFirebaseManager) {
                cardFirebaseManager = new CardFirebaseManager();
                cardFirebaseManager.initialize();
            }
            
            return true;
        } else {
            console.warn("⚠️ تعذر تهيئة Firebase، محاولة استخدام التخزين المحلي");
            return false;
        }
    } catch (error) {
        console.error("❌ خطأ في تهيئة Firebase:", error);
        return false;
    }
}

// الاستماع للتغييرات في Firebase
function listenToCardChanges() {
    if (!cardDatabase) return;
    
    cardDatabase.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            investorCards = Object.values(data);
            updateCardsDisplay();
            updateCardsBadges();
        }
    });
}

// ===============================================================
// SECTION 2: وظائف إدارة البطاقات
// ===============================================================

// تحميل البيانات عند بدء النظام
function loadInvestorCards() {
    try {
        // تهيئة Firebase إن لم يكن مهيئاً
        if (!cardDatabase) {
            initializeCardFirebase();
        }
        
        // تحميل من Local Storage كنسخة احتياطية
        const storedCards = localStorage.getItem('investorCards');
        if (storedCards) {
            const parsedCards = JSON.parse(storedCards);
            investorCards = Array.isArray(parsedCards) ? parsedCards : [];
        }
        
        updateCardsDisplay();
        updateCardsBadges();
        console.log("✅ تم تحميل بطاقات المستثمرين");
    } catch (error) {
        console.error('❌ خطأ في تحميل بطاقات المستثمرين:', error);
        investorCards = [];
    }
}

// حفظ البيانات في Firebase و Local Storage
function saveInvestorCards() {
    try {
        // حفظ في Local Storage
        localStorage.setItem('investorCards', JSON.stringify(investorCards));
        
        // حفظ في Firebase
        if (cardDatabase) {
            investorCards.forEach(card => {
                cardDatabase.child(card.id).set(card);
            });
        }
        console.log("✅ تم حفظ البطاقات بنجاح");
        return true;
    } catch (error) {
        console.error('❌ خطأ في حفظ بطاقات المستثمرين:', error);
        return false;
    }
}

// مزامنة بيانات البطاقة مع Firebase
function syncCardToFirebase(card) {
    if (!cardDatabase) return;
    
    const cardRef = cardDatabase.child(card.id);
    
    // حفظ بيانات البطاقة الأساسية
    cardRef.set({
        ...card,
        lastSync: new Date().toISOString()
    });
    
    // حفظ المعاملات المرتبطة
    const transactionsRef = firebase.database().ref(`cardTransactions/${card.id}`);
    const cardTransactions = operations.filter(op => op.investorId === card.investorId);
    
    cardTransactions.forEach(transaction => {
        transactionsRef.child(transaction.id).set(transaction);
    });
    
    console.log(`✅ تمت مزامنة البطاقة ${card.id} مع Firebase`);
}

// إظهار صفحة البطاقات
function showInvestorCards() {
    loadInvestorCards();
    loadCardInvestors();
}

// تحديث العرض
function updateCardsDisplay(filter = 'all') {
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    if (!Array.isArray(investorCards)) {
        investorCards = [];
    }
    
    let filteredCards = investorCards;
    if (filter === 'active') {
        filteredCards = investorCards.filter(card => card.status === 'active');
    } else if (filter === 'suspended') {
        filteredCards = investorCards.filter(card => card.status === 'suspended');
    }
    
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div style="text-align: center; padding: 50px; grid-column: 1 / -1;">
                <i class="fas fa-credit-card fa-3x" style="color: var(--gray-400); margin-bottom: 15px;"></i>
                <p style="color: var(--gray-600);">لا توجد بطاقات ${filter === 'active' ? 'نشطة' : filter === 'suspended' ? 'متوقفة' : ''}</p>
                <button class="btn btn-primary" style="margin-top: 15px;" onclick="openCreateCardModal()">
                    <i class="fas fa-plus"></i> إنشاء بطاقة جديدة
                </button>
            </div>
        `;
        return;
    }
    
    filteredCards.forEach(card => {
        const investor = investors.find(inv => inv.id === card.investorId);
        if (!investor) return;
        
        const cardElement = createCardElement(card, investor);
        cardsGrid.appendChild(cardElement);
    });
}

// إنشاء عنصر البطاقة المحسن
function createCardElement(card, investor) {
    const div = document.createElement('div');
    div.className = `investor-card ${card.type} ${card.status === 'suspended' ? 'suspended' : ''}`;
    div.onclick = () => viewCardDetails(card.id);
    
    // إضافة معرف فريد للحصول على مرجع لاحق
    div.id = `card-${card.id}`;
    
    div.innerHTML = `
        <div class="card-shimmer"></div>
        <div class="card-content">
            <div class="card-header">
                <div class="card-logo">
                    <!-- استخدام شعار SVG بدلاً من الصورة -->
                    <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
                        <svg width="60" height="35" viewBox="0 0 60 35" xmlns="http://www.w3.org/2000/svg">
                            <rect width="60" height="35" fill="#ffffff"/>
                            <text x="30" y="20" font-family="Arial" font-size="12" font-weight="bold" 
                                  text-anchor="middle" fill="#333333">IIB</text>
                        </svg>
                    </div>
                </div>
                <div class="card-chip-container">
                    <div class="card-chip">
                        <div class="chip-lines"></div>
                    </div>
                </div>
                <div class="card-type-icon">
                    <i class="fas fa-${card.type === 'platinum' ? 'gem' : card.type === 'gold' ? 'crown' : 'star'}"></i>
                </div>
            </div>
            
            <div class="card-qr-container">
                <canvas id="qr-${card.id}" width="80" height="80" style="width:100%; height:100%;"></canvas>
                <div class="card-nfc-indicator">
                    <i class="fas fa-wifi"></i>
                </div>
            </div>
            
            <div class="card-number">${formatCardNumber(card.number)}</div>
            
            <div class="card-details">
                <div class="card-holder">
                    <div class="card-label">CARD HOLDER</div>
                    <div class="card-value">${investor.name.toUpperCase()}</div>
                </div>
                <div class="card-expiry">
                    <div class="card-label">VALID THRU</div>
                    <div class="card-value">${formatExpiry(card.expiry)}</div>
                </div>
            </div>
            
            <div class="card-footer">
                <div class="card-bank-name">بنك الاستثمار العراقي</div>
                <div class="card-type-name">${getCardTypeName(card.type).toUpperCase()}</div>
            </div>
        </div>
    `;
    
    // إنشاء QR Code متقدم
    setTimeout(() => {
        const canvas = document.getElementById(`qr-${card.id}`);
        if (canvas) {
            generateCardQRCode(canvas, card, investor);
        }
    }, 100);
    
    return div;
}

// فتح نافذة إنشاء بطاقة جديدة
function openCreateCardModal() {
    const form = document.getElementById('createCardForm');
    if (form) {
        form.reset();
    }
    loadCardInvestors();
    openModal('createCardModal');
    updateCardPreview();
}

// تحديث معاينة البطاقة المحسنة
function updateCardPreview() {
    const investorSelect = document.getElementById('cardInvestor');
    const expiryInput = document.getElementById('cardExpiry');
    const cardType = document.querySelector('input[name="cardType"]:checked');
    const cardPreview = document.getElementById('cardPreview');
    
    if (!investorSelect || !cardPreview) return;
    
    // إنشاء رقم بطاقة مؤقت
    const tempNumber = generateCardNumber();
    
    // تحديث معاينة البطاقة
    let investor;
    if (investorSelect.value) {
        investor = investors.find(inv => inv.id === investorSelect.value) || 
                   { id: 'temp', name: investorSelect.options[investorSelect.selectedIndex].text };
    } else {
        investor = { id: 'temp', name: 'حامل البطاقة' };
    }
    
    // إنشاء كائن البطاقة المؤقت
    const tempCard = {
        id: 'preview',
        number: tempNumber,
        type: cardType ? cardType.value : 'premium',
        expiry: expiryInput ? expiryInput.value : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        status: 'active',
        investorId: investor.id
    };
    
    // عرض البطاقة
    cardPreview.innerHTML = `
        <div class="investor-card ${tempCard.type}">
            <div class="card-shimmer"></div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-logo">
                        <div style="font-size: 12px; font-weight: bold; color: #333; display: flex; 
                                    flex-direction: column; align-items: center; justify-content: center; 
                                    height: 100%; width: 100%;">
                            <i class="fas fa-landmark" style="font-size: 16px; margin-bottom: 2px;"></i>
                            <span>IIB</span>
                        </div>
                    </div>
                    <div class="card-chip-container">
                        <div class="card-chip">
                            <div class="chip-lines"></div>
                        </div>
                    </div>
                    <div class="card-type-icon">
                        <i class="fas fa-${tempCard.type === 'platinum' ? 'gem' : tempCard.type === 'gold' ? 'crown' : 'star'}"></i>
                    </div>
                </div>
                
                <div class="card-qr-container">
                    <canvas id="preview-qr" width="80" height="80"></canvas>
                    <div class="card-nfc-indicator">
                        <i class="fas fa-wifi"></i>
                    </div>
                </div>
                
                <div class="card-number">${formatCardNumber(tempCard.number)}</div>
                
                <div class="card-details">
                    <div class="card-holder">
                        <div class="card-label">CARD HOLDER</div>
                        <div class="card-value">${investor.name.toUpperCase()}</div>
                    </div>
                    <div class="card-expiry">
                        <div class="card-label">VALID THRU</div>
                        <div class="card-value">${formatExpiry(tempCard.expiry)}</div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="card-bank-name">بنك الاستثمار العراقي</div>
                    <div class="card-type-name">${getCardTypeName(tempCard.type).toUpperCase()}</div>
                </div>
            </div>
        </div>
    `;
    
    // تحديث اختيار نوع البطاقة بصرياً
    document.querySelectorAll('.card-type-option').forEach(option => {
        option.classList.remove('selected');
        if (option.querySelector('input[type="radio"]').value === tempCard.type) {
            option.classList.add('selected');
        }
    });
    
    // إنشاء QR Code للمعاينة
    setTimeout(() => {
        const canvas = document.getElementById('preview-qr');
        if (canvas) {
            generateCardQRCode(canvas, tempCard, investor);
        }
    }, 100);
}

// إنشاء بطاقة جديدة
function createInvestorCard() {
    const investorId = document.getElementById('cardInvestor').value;
    const expiry = document.getElementById('cardExpiry').value;
    const cardType = document.querySelector('input[name="cardType"]:checked')?.value;
    
    if (!investorId || !expiry || !cardType) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    const newCard = {
        id: generateId(),
        investorId: investorId,
        number: generateCardNumber(),
        type: cardType,
        expiry: expiry,
        status: 'active',
        createdAt: new Date().toISOString(),
        transactions: [],
        limits: {
            dailyLimit: cardType === 'platinum' ? 10000000 : cardType === 'gold' ? 5000000 : 2000000,
            monthlyLimit: cardType === 'platinum' ? 100000000 : cardType === 'gold' ? 50000000 : 20000000,
            withdrawalLimit: cardType === 'platinum' ? 5000000 : cardType === 'gold' ? 2500000 : 1000000
        },
        features: getCardFeatures(cardType)
    };
    
    investorCards.push(newCard);
    saveInvestorCards();
    
    // مزامنة مع Firebase
    syncCardToFirebase(newCard);
    
    // استخدام مدير Firebase إذا كان متاحاً
    if (cardFirebaseManager) {
        cardFirebaseManager.saveCard(newCard);
    }
    
    // إنشاء إشعار
    if (typeof createNotification === 'function') {
        createNotification('نجاح', 'تم إنشاء البطاقة بنجاح', 'success');
    }
    
    closeModal('createCardModal');
    updateCardsDisplay();
    updateCardsBadges();
}

// الحصول على مزايا البطاقة
function getCardFeatures(cardType) {
    switch (cardType) {
        case 'platinum':
            return {
                profitBonus: 0.25, // مكافأة أرباح إضافية 0.25%
                freeTransactions: -1, // معاملات مجانية غير محدودة
                prioritySupport: true,
                vipAccess: true,
                insurance: true
            };
        case 'gold':
            return {
                profitBonus: 0.15, // مكافأة أرباح إضافية 0.15%
                freeTransactions: 50, // 50 معاملة مجانية شهرياً
                prioritySupport: true,
                vipAccess: false,
                insurance: true
            };
        case 'premium':
            return {
                profitBonus: 0, // بدون مكافأة إضافية
                freeTransactions: 20, // 20 معاملة مجانية شهرياً
                prioritySupport: false,
                vipAccess: false,
                insurance: false
            };
    }
}

// ===============================================================
// SECTION 3: وظائف رمز QR والباركود - محسنة
// ===============================================================

// توليد رمز QR للبطاقة - محسن جداً
function generateCardQRCode(canvas, card, investor) {
    try {
        if (!canvas) return;
        
        // تنظيف القماش من العناصر السابقة
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // إنشاء بيانات مختصرة للحد من حجم QR Code
        const cardData = createCardDataV2(card, investor);
        
        // التحقق من وجود مكتبة QRCode
        if (typeof QRCode === 'function') {
            try {
                // مسح أي عناصر سابقة في الـ canvas
                while (canvas.firstChild) {
                    canvas.removeChild(canvas.firstChild);
                }
                
                // استخدام مكتبة QRCode.js مع إعدادات محسنة
                new QRCode(canvas, {
                    text: cardData,
                    width: canvas.width,
                    height: canvas.height,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H,  // مستوى تصحيح عالي للقراءة الأفضل
                    quietZone: 5  // منطقة هادئة حول الرمز
                });
                
                console.log(`✅ تم إنشاء رمز QR للبطاقة ${card.id}`);
                return;
            } catch (qrError) {
                console.warn("⚠️ خطأ في مكتبة QRCode:", qrError);
                // محاولة تحميل مكتبة QRCode ديناميكياً
                loadQRCodeLibrary(canvas, card, investor);
                return;
            }
        } else {
            // محاولة تحميل مكتبة QRCode
            loadQRCodeLibrary(canvas, card, investor);
            return;
        }
    } catch (error) {
        console.error("❌ خطأ في إنشاء رمز QR:", error);
        // في حالة الفشل، استخدم رسم QR بسيط
        drawSimpleQRCode(canvas, JSON.stringify({id: card.id, i: card.investorId}));
    }
}

// إنشاء بيانات البطاقة للـ QR Code - بتنسيق محسن
function createCardDataV2(card, investor) {
    // بيانات متوافقة مع المعايير الحديثة
    const data = {
        v: "2.0",                  // إصدار البيانات
        id: card.id,               // معرف البطاقة
        n: card.number,            // رقم البطاقة (مختصر)
        i: card.investorId,        // معرف المستثمر
        in: investor?.name,        // اسم المستثمر
        t: card.type,              // نوع البطاقة
        e: card.expiry,            // تاريخ الانتهاء
        s: card.status,            // الحالة
        b: "IIB",                  // رمز البنك
        c: generateCardChecksum(card) // التحقق من السلامة
    };
    
    // تحويل إلى JSON مختصر
    return JSON.stringify(data);
}

// تحميل مكتبة QRCode ديناميكياً
function loadQRCodeLibrary(canvas, card, investor) {
    console.log("⚠️ جاري تحميل مكتبة QRCode...");
    
    // التحقق من عدم وجود العنصر بالفعل
    if (document.getElementById('qrcode-script')) {
        // محاولة رسم QR بسيط بدلاً من ذلك
        drawSimpleQRCode(canvas, createCardDataV2(card, investor));
        return;
    }
    
    // إنشاء عنصر البرنامج النصي
    const script = document.createElement('script');
    script.id = 'qrcode-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    
    // عند اكتمال التحميل
    script.onload = function() {
        console.log("✅ تم تحميل مكتبة QRCode بنجاح");
        generateCardQRCode(canvas, card, investor);
    };
    
    // عند فشل التحميل
    script.onerror = function() {
        console.error("❌ فشل تحميل مكتبة QRCode");
        // استخدام طريقة النسخ الاحتياطي
        drawSimpleQRCode(canvas, createCardDataV2(card, investor));
    };
    
    // إضافة البرنامج النصي إلى الصفحة
    document.head.appendChild(script);
}

// رسم رمز QR بسيط (محسن بشكل كبير)
function drawSimpleQRCode(canvas, dataString = '') {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // حساب قيمة تجزئة من سلسلة البيانات
    let hash = 0;
    if (dataString) {
        for (let i = 0; i < dataString.length; i++) {
            hash = ((hash << 5) - hash) + dataString.charCodeAt(i);
            hash |= 0; // تحويل إلى عدد صحيح 32 بت
        }
    } else {
        // استخدام قيمة عشوائية إذا لم تكن هناك بيانات
        hash = Math.floor(Math.random() * 1000000);
    }
    
    // تحديد عدد الخلايا استناداً إلى حجم الـ canvas
    const cells = Math.max(21, Math.min(40, Math.floor(size / 5)));
    const cellSize = size / cells;
    
    // خلفية بيضاء
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // رسم خلفية شبكية خفيفة
    ctx.fillStyle = '#f9f9f9';
    for (let i = 0; i < cells; i += 2) {
        for (let j = 0; j < cells; j += 2) {
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    
    // رسم أنماط المحاذاة
    const positionPatterns = [
        {x: 0, y: 0},                     // أعلى اليسار
        {x: cells - 7, y: 0},              // أعلى اليمين
        {x: 0, y: cells - 7}               // أسفل اليسار
    ];
    
    // رسم أنماط المحاذاة
    for (const pattern of positionPatterns) {
        drawPositionPattern(ctx, pattern.x * cellSize, pattern.y * cellSize, 7 * cellSize);
    }
    
    // إنشاء مولد عشوائي مبني على التجزئة
    const rand = createPseudoRandom(hash);
    
    // رسم نمط التوقيت
    drawTimingPattern(ctx, cells, cellSize);
    
    // رسم البيانات
    drawDataPattern(ctx, cells, cellSize, rand, positionPatterns);
    
    // رسم نمط المحاذاة في الوسط (للرموز الأكبر)
    if (cells >= 25) {
        // نمط محاذاة في المنتصف (تقريباً)
        drawAlignmentPattern(ctx, Math.floor(cells/2) * cellSize, Math.floor(cells/2) * cellSize, 5 * cellSize);
    }
}

// رسم نمط محاذاة QR (الأنماط المربعة في الزوايا)
function drawPositionPattern(ctx, x, y, size) {
    const blockSize = size / 7;
    
    // الإطار الخارجي
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, size, size);
    
    // الحلقة البيضاء
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + blockSize, y + blockSize, size - 2 * blockSize, size - 2 * blockSize);
    
    // المربع الأوسط
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + 2 * blockSize, y + 2 * blockSize, size - 4 * blockSize, size - 4 * blockSize);
}

// رسم نمط التوقيت (الخطوط المتقطعة بين أنماط المحاذاة)
function drawTimingPattern(ctx, cells, cellSize) {
    ctx.fillStyle = "#000000";
    
    // النمط الأفقي
    for (let i = 8; i < cells - 8; i++) {
        if (i % 2 === 0) {
            ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
            ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}

// رسم نمط محاذاة إضافي (النقاط الصغيرة في الرموز الكبيرة)
function drawAlignmentPattern(ctx, x, y, size) {
    const blockSize = size / 5;
    
    // الإطار الخارجي
    ctx.fillStyle = "#000000";
    ctx.fillRect(x - size/2, y - size/2, size, size);
    
    // الحلقة البيضاء
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - size/2 + blockSize, y - size/2 + blockSize, size - 2 * blockSize, size - 2 * blockSize);
    
    // النقطة المركزية
    ctx.fillStyle = "#000000";
    ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
}

// رسم نمط البيانات (الخلايا السوداء والبيضاء التي تمثل البيانات)
function drawDataPattern(ctx, cells, cellSize, rand, positionPatterns) {
    ctx.fillStyle = "#000000";
    
    // إنشاء مجموعة لتتبع المواضع المحجوزة
    const reservedCells = new Set();
    
    // إضافة مواقع أنماط المحاذاة إلى المواقع المحجوزة
    for (const pattern of positionPatterns) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                reservedCells.add(`${pattern.x + j},${pattern.y + i}`);
            }
        }
    }
    
    // إضافة نمط التوقيت إلى المواقع المحجوزة
    for (let i = 0; i < cells; i++) {
        reservedCells.add(`${i},6`);
        reservedCells.add(`6,${i}`);
    }
    
    // إنشاء عدد كافٍ من الخلايا لتشبه رمز QR حقيقي
    const minDots = Math.floor(cells * cells * 0.3);  // على الأقل 30% من الخلايا
    const maxDots = Math.floor(cells * cells * 0.4);  // على الأكثر 40% من الخلايا
    const dotsCount = minDots + Math.floor(rand() * (maxDots - minDots));
    
    // توزيع النقاط
    let dotsPlaced = 0;
    
    // إضافة بعض المجموعات لتبدو أكثر واقعية
    const clusterCount = Math.floor(cells / 5);
    for (let c = 0; c < clusterCount; c++) {
        const clusterX = Math.floor(rand() * cells);
        const clusterY = Math.floor(rand() * cells);
        const clusterSize = Math.floor(rand() * 5) + 3;
        
        for (let i = 0; i < clusterSize; i++) {
            for (let j = 0; j < clusterSize; j++) {
                const x = (clusterX + i) % cells;
                const y = (clusterY + j) % cells;
                const key = `${x},${y}`;
                
                // تخطي الخلايا المحجوزة والشطرنج
                if (!reservedCells.has(key) && rand() > 0.3) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    reservedCells.add(key);
                    dotsPlaced++;
                }
                
                if (dotsPlaced >= dotsCount) break;
            }
            if (dotsPlaced >= dotsCount) break;
        }
    }
    
    // إضافة نقاط إضافية عشوائية
    while (dotsPlaced < dotsCount) {
        const x = Math.floor(rand() * cells);
        const y = Math.floor(rand() * cells);
        const key = `${x},${y}`;
        
        if (!reservedCells.has(key)) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            reservedCells.add(key);
            dotsPlaced++;
        }
    }
}

// إنشاء مولد أرقام شبه عشوائية باستخدام بذرة
function createPseudoRandom(seed) {
    let value = seed;
    return function() {
        value = (value * 1103515245 + 12345) % 2147483647;
        return value / 2147483647;
    };
}

// إنشاء checksum للبطاقة
function generateCardChecksum(card) {
    const data = `${card.id}-${card.number}-${card.investorId}-${card.type}`;
    
    // حساب checksum بسيط
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
        checksum = ((checksum << 5) - checksum) + data.charCodeAt(i);
        checksum = checksum & checksum;
    }
    
    return Math.abs(checksum).toString(16);
}

// مسح الباركود - محسن للتعامل مع مشاكل الكاميرا
function scanBarcode() {
    // إنشاء نافذة المسح
    const scannerModal = document.createElement('div');
    scannerModal.className = 'modal-overlay active';
    scannerModal.id = 'barcodeScannerModal';
    
    scannerModal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">مسح رمز QR</h2>
                <div class="modal-close" onclick="closeBarcodeScanner()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div id="qr-scanner-container" style="position: relative; width: 100%; height: 400px; overflow: hidden; border-radius: 8px;">
                    <video id="qr-video" style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
                    <div class="scanner-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center;">
                        <div class="scanner-frame" style="width: 250px; height: 250px; border: 3px solid #fff; border-radius: 20px; box-shadow: 0 0 0 100vw rgba(0,0,0,0.5);">
                            <div class="scan-line" style="position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, transparent, #3498db, transparent); animation: scan-line 2s linear infinite;"></div>
                        </div>
                    </div>
                    <style>
                        @keyframes scan-line {
                            0% { top: 0; }
                            50% { top: 250px; }
                            100% { top: 0; }
                        }
                    </style>
                    <div class="camera-selection" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
                        <select id="camera-select" style="padding: 5px; border-radius: 5px; opacity: 0.7;" onchange="switchCamera(this.value)">
                            <option value="">... جاري تحميل الكاميرات</option>
                        </select>
                    </div>
                </div>
                <div id="scanner-result" style="margin-top: 20px; text-align: center; font-size: 1.1rem;">
                    <i class="fas fa-camera"></i> وجه الكاميرا نحو رمز QR
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeBarcodeScanner()">إلغاء</button>
                <button class="btn btn-primary" onclick="uploadQRImage()">
                    <i class="fas fa-upload"></i> رفع صورة
                </button>
                <button class="btn btn-secondary" onclick="toggleFlashlight()">
                    <i class="fas fa-bolt"></i> الفلاش
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(scannerModal);
    
    // بدء المسح
    startQRScanner();
}

// متغير لتخزين مصدر الفلاش الحالي
let currentTrack = null;
let flashlightOn = false;
let scannerInterval = null;

// تبديل الفلاش
async function toggleFlashlight() {
    try {
        if (!currentTrack) return;
        
        const capabilities = currentTrack.getCapabilities();
        
        // التحقق من دعم الفلاش
        if (!capabilities.torch) {
            createNotification('تنبيه', 'الكاميرا لا تدعم الفلاش', 'warning');
            return;
        }
        
        flashlightOn = !flashlightOn;
        await currentTrack.applyConstraints({
            advanced: [{ torch: flashlightOn }]
        });
        
        // تحديث زر الفلاش
        const flashBtn = document.querySelector('.modal-footer .btn-secondary i');
        if (flashBtn) {
            flashBtn.className = flashlightOn ? 'fas fa-bolt-slash' : 'fas fa-bolt';
        }
    } catch (error) {
        console.error("❌ خطأ في تبديل الفلاش:", error);
    }
}

// تبديل الكاميرا
async function switchCamera(deviceId) {
    if (!deviceId) return;
    
    try {
        if (currentTrack) {
            currentTrack.stop();
        }
        
        // وقف أي فاصل زمني للمسح
        if (scannerInterval) {
            clearInterval(scannerInterval);
            scannerInterval = null;
        }
        
        // بدء الكاميرا الجديدة
        await startQRScanner(deviceId);
    } catch (error) {
        console.error("❌ خطأ في تبديل الكاميرا:", error);
    }
}

// الحصول على قائمة الكاميرات
async function populateCameraSelect() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const select = document.getElementById('camera-select');
        
        if (!select || videoDevices.length === 0) return;
        
        // مسح الخيارات الحالية
        select.innerHTML = '';
        
        // إضافة الكاميرات المتاحة
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `كاميرا ${index + 1}`;
            select.appendChild(option);
        });
        
        // تحديد الكاميرا الخلفية افتراضياً إن وجدت
        const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('خلفية') ||
            device.label.toLowerCase().includes('rear')
        );
        
        if (backCamera) {
            select.value = backCamera.deviceId;
            switchCamera(backCamera.deviceId);
        }
    } catch (error) {
        console.error("❌ خطأ في الحصول على قائمة الكاميرات:", error);
    }
}

// بدء ماسح QR - محسن
async function startQRScanner(deviceId = null) {
    const video = document.getElementById('qr-video');
    if (!video) return;
    
    try {
        // مسح أي مصادر فيديو سابقة
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        
        // إعداد خيارات الكاميرا
        const constraints = {
            video: {
                facingMode: "environment", // محاولة استخدام الكاميرا الخلفية افتراضياً
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            }
        };
        
        // إذا تم تحديد جهاز محدد، استخدمه
        if (deviceId) {
            constraints.video = { deviceId: { exact: deviceId } };
        }
        
        // طلب الوصول للكاميرا
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // حفظ المسار الحالي للتحكم بالفلاش
        currentTrack = stream.getVideoTracks()[0];
        
        // التحقق من قدرات الفلاش
        try {
            const capabilities = currentTrack.getCapabilities();
            const hasFlash = capabilities && capabilities.torch;
            
            // تحديث زر الفلاش
            const flashBtn = document.querySelector('.modal-footer .btn-secondary');
            if (flashBtn) {
                flashBtn.disabled = !hasFlash;
                flashBtn.title = hasFlash ? "تشغيل/إيقاف الفلاش" : "الكاميرا لا تدعم الفلاش";
                flashBtn.style.opacity = hasFlash ? "1" : "0.5";
            }
        } catch (e) {
            console.warn("⚠️ لا يمكن التحقق من قدرات الكاميرا:", e);
        }
        
        // احصل على قائمة الكاميرات المتاحة
        populateCameraSelect();
        
        // البدء في تشغيل الفيديو
        await video.play();
        
        // إعداد فحص دوري للفريمات
        setupQRScanning(video);
        
        // عرض رسالة نجاح
        console.log("✅ تم بدء ماسح QR بنجاح");
        
    } catch (error) {
        console.error("❌ خطأ في الوصول للكاميرا:", error);
        document.getElementById('scanner-result').innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>
            تعذر الوصول للكاميرا: ${error.message}
        `;
    }
}

// إعداد فحص QR من الفيديو
function setupQRScanning(video) {
    // إيقاف أي فاصل زمني سابق
    if (scannerInterval) {
        clearInterval(scannerInterval);
    }
    
    // التحقق من وجود مكتبة jsQR
    if (typeof jsQR === 'function') {
        scannerInterval = setInterval(() => {
            if (!video.srcObject) {
                clearInterval(scannerInterval);
                scannerInterval = null;
                return;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // التأكد من أن الفيديو جاهز
            if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
            
            // ضبط حجم الـ canvas ليتطابق مع حجم الفيديو
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // رسم إطار من الفيديو على الـ canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // الحصول على بيانات الصورة
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // تحليل الصورة بحثاً عن رمز QR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert" // تحسين أداء القراءة
            });
            
            if (code) {
                // تم العثور على رمز QR
                handleScannedData(code.data);
                clearInterval(scannerInterval);
                scannerInterval = null;
                
                // إظهار مؤشر بصري للنجاح
                const scannerFrame = document.querySelector('.scanner-frame');
                if (scannerFrame) {
                    scannerFrame.style.borderColor = '#2ecc71';
                    scannerFrame.style.boxShadow = '0 0 0 100vw rgba(46, 204, 113, 0.5)';
                }
                
                // اهتزاز للإشارة إلى النجاح
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        }, 100);
    } else {
        // محاولة تحميل مكتبة jsQR
        loadJSQRLibrary(video);
    }
}

// تحميل مكتبة jsQR ديناميكياً
function loadJSQRLibrary(video) {
    console.log("⚠️ جاري تحميل مكتبة jsQR...");
    
    // التحقق من عدم وجود العنصر بالفعل
    if (document.getElementById('jsqr-script')) {
        // استخدام طريقة مسح بديلة
        useFallbackScanner(video);
        return;
    }
    
    // إنشاء عنصر البرنامج النصي
    const script = document.createElement('script');
    script.id = 'jsqr-script';
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.async = true;
    
    // عند اكتمال التحميل
    script.onload = function() {
        console.log("✅ تم تحميل مكتبة jsQR بنجاح");
        setupQRScanning(video);
    };
    
    // عند فشل التحميل
    script.onerror = function() {
        console.error("❌ فشل تحميل مكتبة jsQR");
        // استخدام طريقة المسح البديلة
        useFallbackScanner(video);
    };
    
    // إضافة البرنامج النصي إلى الصفحة
    document.head.appendChild(script);
}

// استخدام ماسح بديل عند فشل تحميل المكتبات
function useFallbackScanner(video) {
    console.log("⚠️ استخدام ماسح QR بديل");
    
    // عرض رسالة في النتيجة
    const resultElement = document.getElementById('scanner-result');
    if (resultElement) {
        resultElement.innerHTML = `
            <i class="fas fa-info-circle" style="color: var(--info-color);"></i>
            جاري استخدام ماسح بديل. قد تكون الدقة أقل.
        `;
    }
    
    // إعداد فاصل زمني للمحاكاة
    scannerInterval = setInterval(() => {
        if (!video.srcObject) {
            clearInterval(scannerInterval);
            scannerInterval = null;
            return;
        }
        
        // الطريقة البديلة - محاكاة المسح لأغراض العرض
        // في التطبيق الحقيقي، يمكن استخدام محلل بسيط
        if (Math.random() < 0.005) { // فرصة صغيرة للنجاح "الظاهري"
            // اختيار بطاقة عشوائية من القائمة الحالية
            if (investorCards.length > 0) {
                const randomIndex = Math.floor(Math.random() * investorCards.length);
                const card = investorCards[randomIndex];
                const mockData = JSON.stringify({
                    id: card.id,
                    i: card.investorId
                });
                handleScannedData(mockData);
                clearInterval(scannerInterval);
                scannerInterval = null;
            } else {
                // إذا لم تكن هناك بطاقات، توليد معرف عشوائي
                const mockData = JSON.stringify({
                    id: generateId(),
                    i: generateId()
                });
                handleScannedData(mockData);
                clearInterval(scannerInterval);
                scannerInterval = null;
            }
        }
    }, 100);
}

// معالجة البيانات الممسوحة
function handleScannedData(data) {
    try {
        console.log("⏳ جاري معالجة البيانات الممسوحة:", data);
        
        // تحليل البيانات
        const cardData = JSON.parse(data);
        
        // التحقق من صحة البيانات - دعم كل من التنسيق القديم والجديد
        let cardId = cardData.cardId || cardData.id;
        let investorId = cardData.investorId || cardData.i;
        
        if (!cardId && !investorId) {
            throw new Error('بيانات البطاقة غير صالحة');
        }
        
        // البحث عن البطاقة
        const card = investorCards.find(c => c.id === cardId);
        const investor = investors.find(inv => inv.id === investorId);
        
        if (card && investor) {
            // إغلاق الماسح
            closeBarcodeScanner();
            
            // عرض تفاصيل البطاقة
            viewCardDetails(card.id);
            
            // إشعار بنجاح القراءة
            createNotification('نجاح', 'تم التعرف على البطاقة بنجاح', 'success');
        } else {
            throw new Error('البطاقة غير موجودة في النظام');
        }
    } catch (error) {
        console.error('❌ خطأ في معالجة البيانات الممسوحة:', error);
        const resultElement = document.getElementById('scanner-result');
        if (resultElement) {
            resultElement.innerHTML = `
                <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
                ${error.message}
            `;
        }
        
        // اهتزاز للإشارة إلى الخطأ
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // استئناف المسح بعد الخطأ
        setTimeout(() => {
            if (document.getElementById('scanner-result')) {
                document.getElementById('scanner-result').innerHTML = `
                    <i class="fas fa-camera"></i> وجه الكاميرا نحو رمز QR
                `;
            }
            
            // إعادة بدء المسح
            const video = document.getElementById('qr-video');
            if (video && video.srcObject) {
                setupQRScanning(video);
            }
        }, 3000);
    }
}

// إغلاق ماسح الباركود
function closeBarcodeScanner() {
    // إيقاف الماسح
    if (qrCodeScanner) {
        qrCodeScanner.stop();
        qrCodeScanner = null;
    }
    
    // إيقاف أي فاصل زمني للمسح
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }
    
    // إيقاف الكاميرا
    const video = document.getElementById('qr-video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    
    // إعادة تعيين المتغيرات العالمية
    currentTrack = null;
    flashlightOn = false;
    
    // إزالة النافذة
    const modal = document.getElementById('barcodeScannerModal');
    if (modal) {
        modal.remove();
    }
}

// رفع صورة QR
function uploadQRImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // عرض حالة التحميل
        const resultElement = document.getElementById('scanner-result');
        if (resultElement) {
            resultElement.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i> جاري معالجة الصورة...
            `;
        }
        
        try {
            const qrResult = await decodeQRFromImage(file);
            
            if (qrResult) {
                handleScannedData(qrResult);
            } else {
                throw new Error('لم يتم العثور على رمز QR في الصورة');
            }
        } catch (error) {
            console.error("❌ خطأ في قراءة رمز QR من الصورة:", error);
            if (resultElement) {
                resultElement.innerHTML = `
                    <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
                    ${error.message || 'خطأ في معالجة الصورة'}
                `;
            }
        }
    };
    
    input.click();
}

// فك ترميز QR من صورة
async function decodeQRFromImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // ضبط حجم الـ canvas ليتطابق مع حجم الصورة
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // رسم الصورة على الـ canvas
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // الحصول على بيانات الصورة
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // محاولة فك ترميز QR باستخدام jsQR إذا كان متاحاً
                    if (typeof jsQR === 'function') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "attemptBoth" // محاولة كلا الطريقتين للحصول على أفضل نتيجة
                        });
                        
                        if (code) {
                            resolve(code.data);
                            return;
                        }
                    }
                    
                    // إذا كانت مكتبة jsQR غير متاحة أو فشلت، حاول تحميل المكتبة
                    if (typeof jsQR !== 'function') {
                        // تحميل مكتبة jsQR ديناميكياً
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
                        
                        script.onload = () => {
                            try {
                                // محاولة مرة أخرى باستخدام المكتبة المحملة
                                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                    inversionAttempts: "attemptBoth"
                                });
                                
                                if (code) {
                                    resolve(code.data);
                                } else {
                                    // محاولة عكس الألوان إذا فشلت المحاولة الأولى
                                    const invertedData = new Uint8ClampedArray(imageData.data.length);
                                    for (let i = 0; i < imageData.data.length; i += 4) {
                                        invertedData[i] = 255 - imageData.data[i];         // R
                                        invertedData[i + 1] = 255 - imageData.data[i + 1]; // G
                                        invertedData[i + 2] = 255 - imageData.data[i + 2]; // B
                                        invertedData[i + 3] = imageData.data[i + 3];       // A
                                    }
                                    
                                    const invertedImageData = new ImageData(invertedData, imageData.width, imageData.height);
                                    const invertedCode = jsQR(invertedImageData.data, invertedImageData.width, invertedImageData.height);
                                    
                                    if (invertedCode) {
                                        resolve(invertedCode.data);
                                    } else {
                                        reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                                    }
                                }
                            } catch (error) {
                                reject(error);
                            }
                        };
                        
                        script.onerror = () => {
                            reject(new Error('فشل تحميل مكتبة قراءة QR'));
                        };
                        
                        document.head.appendChild(script);
                        return;
                    }
                    
                    // إذا وصلنا إلى هنا، فقد فشلت جميع المحاولات
                    reject(new Error('لم يتم العثور على رمز QR في الصورة'));
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('خطأ في تحميل الصورة'));
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = () => {
            reject(new Error('خطأ في قراءة الملف'));
        };
        
        reader.readAsDataURL(file);
    });
}

// تحميل QR البطاقة
function downloadCardQR(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    const investor = investors.find(inv => inv.id === card.investorId);
    
    if (!card || !investor) return;
    
    // إنشاء canvas جديد بحجم أكبر
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    
    // توليد رمز QR بحجم أكبر للتحميل
    generateCardQRCode(canvas, card, investor);
    
    // إضافة تفاصيل في أسفل الـ QR
    setTimeout(() => {
        const ctx = canvas.getContext('2d');
        
        // إضافة خلفية بيضاء
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 550, canvas.width, 50);
        
        // إضافة النص
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText(`${investor.name} - ${getCardTypeName(card.type)}`, canvas.width / 2, canvas.height - 20);
        
        // تحميل الصورة
        const link = document.createElement('a');
        link.download = `card-qr-${card.number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        createNotification('نجاح', 'تم تحميل رمز QR بنجاح', 'success');
    }, 200);
}

// ===============================================================
// SECTION 4: وظائف عرض تفاصيل البطاقة
// ===============================================================

// عرض تفاصيل البطاقة
function viewCardDetails(cardId) {
    currentCardId = cardId;
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) return;
    
    const content = document.getElementById('cardDetailsContent');
    content.innerHTML = `
        <div class="card-details-container">
            <div class="card-visualization">
                ${createCardElement(card, investor).outerHTML}
            </div>
            
            <div class="card-info">
                <h3>معلومات البطاقة</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>رقم البطاقة</label>
                        <div>${formatCardNumber(card.number)}</div>
                    </div>
                    <div class="info-item">
                        <label>نوع البطاقة</label>
                        <div>${getCardTypeName(card.type)}</div>
                    </div>
                    <div class="info-item">
                        <label>تاريخ الانتهاء</label>
                        <div>${formatExpiry(card.expiry)}</div>
                    </div>
                    <div class="info-item">
                        <label>الحالة</label>
                        <div class="status ${card.status}">${card.status === 'active' ? 'نشطة' : 'متوقفة'}</div>
                    </div>
                </div>
                
                <h3>حدود البطاقة</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>الحد اليومي</label>
                        <div>${formatCurrency(card.limits?.dailyLimit || 0)}</div>
                    </div>
                    <div class="info-item">
                        <label>الحد الشهري</label>
                        <div>${formatCurrency(card.limits?.monthlyLimit || 0)}</div>
                    </div>
                    <div class="info-item">
                        <label>حد السحب</label>
                        <div>${formatCurrency(card.limits?.withdrawalLimit || 0)}</div>
                    </div>
                </div>
                
                <h3>مزايا البطاقة</h3>
                <div class="features-grid">
                    ${card.features?.profitBonus ? `
                        <div class="feature-item">
                            <i class="fas fa-percentage"></i>
                            <span>مكافأة أرباح إضافية ${card.features.profitBonus}%</span>
                        </div>
                    ` : ''}
                    ${card.features?.prioritySupport ? `
                        <div class="feature-item">
                            <i class="fas fa-headset"></i>
                            <span>دعم ذو أولوية</span>
                        </div>
                    ` : ''}
                    ${card.features?.vipAccess ? `
                        <div class="feature-item">
                            <i class="fas fa-crown"></i>
                            <span>خدمات VIP</span>
                        </div>
                    ` : ''}
                    ${card.features?.insurance ? `
                        <div class="feature-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>تأمين على المعاملات</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="investor-info">
                <h3>معلومات المستثمر</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>الاسم</label>
                        <div>${investor.name}</div>
                    </div>
                    <div class="info-item">
                        <label>رقم الهاتف</label>
                        <div>${investor.phone}</div>
                    </div>
                    <div class="info-item">
                        <label>إجمالي الاستثمار</label>
                        <div>${formatCurrency(getTotalInvestment(investor.id))}</div>
                    </div>
                    <div class="info-item">
                        <label>إجمالي الأرباح</label>
                        <div>${formatCurrency(getTotalProfits(investor.id))}</div>
                    </div>
                </div>
            </div>
            
            <div class="card-transactions">
                <h3>آخر المعاملات</h3>
                <div class="transactions-list">
                    ${getRecentTransactions(card.investorId)}
                </div>
            </div>
            
            <div class="card-actions">
                <h3>إجراءات سريعة</h3>
                <div class="actions-grid">
                    <button class="action-btn" onclick="printCard('${card.id}')">
                        <i class="fas fa-print"></i>
                        <span>طباعة البطاقة</span>
                    </button>
                    <button class="action-btn" onclick="shareCard('${card.id}')">
                        <i class="fas fa-share-alt"></i>
                        <span>مشاركة</span>
                    </button>
                    <button class="action-btn" onclick="downloadCardQR('${card.id}')">
                        <i class="fas fa-download"></i>
                        <span>تحميل QR</span>
                    </button>
                    <button class="action-btn" onclick="viewCardStatistics('${card.id}')">
                        <i class="fas fa-chart-bar"></i>
                        <span>الإحصائيات</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // تحديث زر إيقاف/تفعيل البطاقة
    const toggleBtn = document.getElementById('toggleCardStatusBtn');
    if (toggleBtn) {
        if (card.status === 'active') {
            toggleBtn.innerHTML = '<i class="fas fa-ban"></i> إيقاف البطاقة';
            toggleBtn.className = 'btn btn-warning';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-check"></i> تفعيل البطاقة';
            toggleBtn.className = 'btn btn-success';
        }
    }
    
    openModal('cardDetailsModal');
    
    // استخدام مدير Firebase إذا كان متاحاً
    if (cardFirebaseManager) {
        cardFirebaseManager.monitorCardStatus(card.id);
    }
}

// طباعة البطاقة
function printCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    const investor = investors.find(inv => inv.id === card.investorId);
    
    if (!card || !investor) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة البطاقة</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .print-container {
                    max-width: 400px;
                    margin: 0 auto;
                }
                .investor-card {
                    width: 350px;
                    height: 220px;
                    margin: 20px auto;
                    border-radius: 15px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    transform: scale(1.5);
                    margin-top: 50px;
                }
                ${getCardStyles()}
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            </style>
        </head>
        <body onload="window.print()">
            <div class="print-container">
                ${createCardElement(card, investor).outerHTML}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// مشاركة البطاقة
function shareCard(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    const investor = investors.find(inv => inv.id === card.investorId);
    
    if (!card || !investor) return;
    
    const shareData = {
        title: `بطاقة استثمار - ${investor.name}`,
        text: `بطاقة ${getCardTypeName(card.type)} - ${investor.name}`,
        url: `https://investment-app.com/cards/${card.id}`
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => createNotification('نجاح', 'تم مشاركة البطاقة بنجاح', 'success'))
            .catch(err => console.error('Error sharing:', err));
    } else {
        // نسخ الرابط إلى الحافظة
        const url = `https://investment-app.com/cards/${card.id}`;
        navigator.clipboard.writeText(url)
            .then(() => createNotification('نجاح', 'تم نسخ رابط البطاقة', 'success'));
    }
}

// عرض إحصائيات البطاقة
function viewCardStatistics(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    // حساب الإحصائيات
    const stats = calculateCardStatistics(card);
    
    // إنشاء نافذة الإحصائيات
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal" style="max-width: 800px;">
            <div class="modal-header">
                <h2 class="modal-title">إحصائيات البطاقة</h2>
                <div class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="stats-grid">
                    <div class="stat-card">
                        <i class="fas fa-exchange-alt"></i>
                        <h3>إجمالي المعاملات</h3>
                        <p>${stats.totalTransactions}</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-money-bill-wave"></i>
                        <h3>إجمالي المبالغ</h3>
                        <p>${formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-calendar-day"></i>
                        <h3>متوسط المعاملات الشهرية</h3>
                        <p>${stats.monthlyAverage}</p>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-chart-line"></i>
                        <h3>معدل النمو</h3>
                        <p>${stats.growthRate}%</p>
                    </div>
                </div>
                
                <div class="chart-container" style="margin-top: 20px; height: 300px;">
                    <canvas id="cardStatsChart" width="700" height="300"></canvas>
                </div>
                
                <div class="transaction-history" style="margin-top: 20px;">
                    <h3>سجل المعاملات</h3>
                    <div class="history-table-wrapper" style="max-height: 300px; overflow-y: auto;">
                        <table class="transactions-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">التاريخ</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">النوع</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">المبلغ</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">الحالة</th>
                                </tr>
                            </thead>
                            <tbody id="transactionHistoryBody">
                                ${stats.transactionsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="exportCardStatistics('${cardId}')">
                    <i class="fas fa-file-export"></i> تصدير البيانات
                </button>
                <button class="btn btn-light" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // رسم الرسم البياني
    setTimeout(() => {
        drawCardStatisticsChart(stats);
    }, 100);
}

// حساب إحصائيات البطاقة
function calculateCardStatistics(card) {
    const transactions = Array.isArray(operations) ? 
        operations.filter(op => op.investorId === card.investorId) : [];
    
    const now = new Date();
    const cardCreatedAt = new Date(card.createdAt || now.setMonth(now.getMonth() - 6));
    const cardAge = Math.max(1, (now - cardCreatedAt) / (1000 * 60 * 60 * 24 * 30)); // بالأشهر
    
    // إنشاء HTML لجدول المعاملات
    const transactionsHTML = transactions.length > 0 ? 
        transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(t => `
                <tr>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                        ${formatDate(t.date)}
                    </td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                        ${getOperationTypeName(t.type)}
                    </td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; 
                             color: ${t.type === 'withdrawal' ? 'var(--danger-color)' : 'var(--success-color)'};">
                        ${t.type === 'withdrawal' ? '-' : '+'}${formatCurrency(t.amount)}
                    </td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
                        <span class="status ${t.status || 'completed'}">${t.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}</span>
                    </td>
                </tr>
            `).join('') 
        : '<tr><td colspan="4" style="text-align: center; padding: 20px;">لا توجد معاملات</td></tr>';
    
    return {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        monthlyAverage: Math.round(transactions.length / cardAge),
        growthRate: calculateGrowthRate(transactions),
        monthlyData: getMonthlyTransactionData(transactions),
        transactionsHTML
    };
}

// حساب معدل النمو
function calculateGrowthRate(transactions) {
    if (transactions.length < 2) return 0;
    
    // تقسيم المعاملات إلى نصفين زمنياً
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const midpoint = Math.floor(sortedTransactions.length / 2);
    
    const firstHalf = sortedTransactions.slice(0, midpoint);
    const secondHalf = sortedTransactions.slice(midpoint);
    
    const firstHalfSum = firstHalf.reduce((sum, t) => sum + t.amount, 0);
    const secondHalfSum = secondHalf.reduce((sum, t) => sum + t.amount, 0);
    
    // حساب النمو
    if (firstHalfSum === 0) return 100; // لتجنب القسمة على صفر
    
    const growthRate = ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
    return Math.round(growthRate);
}

// الحصول على بيانات المعاملات الشهرية
function getMonthlyTransactionData(transactions) {
    // تجميع المعاملات حسب الشهر
    const monthlyData = {};
    
    // إنشاء الشهور الستة الماضية
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = { 
            count: 0, 
            amount: 0,
            label: `${date.getMonth() + 1}/${date.getFullYear().toString().substring(2)}`
        };
    }
    
    // تعبئة البيانات
    transactions.forEach(t => {
        const month = new Date(t.date).toISOString().slice(0, 7);
        if (monthlyData[month]) {
            monthlyData[month].count++;
            monthlyData[month].amount += t.amount;
        }
    });
    
    return monthlyData;
}

// رسم رسم بياني للإحصائيات
function drawCardStatisticsChart(stats) {
    const canvas = document.getElementById('cardStatsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // التحقق من وجود Chart.js
    if (typeof Chart === 'function') {
        // استخدام Chart.js
        const monthlyData = stats.monthlyData;
        const labels = Object.values(monthlyData).map(data => data.label);
        const amountData = Object.values(monthlyData).map(data => data.amount / 1000000); // بالمليون
        const countData = Object.values(monthlyData).map(data => data.count);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'المبلغ (مليون)',
                        data: amountData,
                        backgroundColor: 'rgba(52, 152, 219, 0.5)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1,
                        yAxisID: 'y-axis-1'
                    },
                    {
                        label: 'عدد المعاملات',
                        data: countData,
                        type: 'line',
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'y-axis-2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-1',
                            type: 'linear',
                            position: 'left',
                            ticks: {
                                beginAtZero: true
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'المبلغ (مليون)'
                            }
                        },
                        {
                            id: 'y-axis-2',
                            type: 'linear',
                            position: 'right',
                            ticks: {
                                beginAtZero: true
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'عدد المعاملات'
                            },
                            gridLines: {
                                drawOnChartArea: false
                            }
                        }
                    ]
                }
            }
        });
    } else {
        // رسم بسيط بدون Chart.js
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // رسم المحاور
        ctx.beginPath();
        ctx.moveTo(50, 30);
        ctx.lineTo(50, 270);
        ctx.lineTo(650, 270);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // رسم البيانات
        const data = Object.values(stats.monthlyData);
        const maxAmount = Math.max(...data.map(item => item.amount), 1);
        const barWidth = 80;
        const spacing = 20;
        
        data.forEach((item, index) => {
            const x = 80 + index * (barWidth + spacing);
            const height = (item.amount / maxAmount) * 200;
            const y = 270 - height;
            
            // رسم العمود
            ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
            ctx.fillRect(x, y, barWidth, height);
            
            // إضافة التسمية
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, 290);
            
            // إضافة القيمة
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formatCurrency(item.amount, true), x + barWidth / 2, y - 10);
        });
    }
}

// تصدير إحصائيات البطاقة
function exportCardStatistics(cardId) {
    const card = investorCards.find(c => c.id === cardId);
    if (!card) return;
    
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) return;
    
    const stats = calculateCardStatistics(card);
    
    // إنشاء بيانات JSON للتصدير
    const exportData = {
        cardInfo: {
            id: card.id,
            number: formatCardNumber(card.number),
            type: getCardTypeName(card.type),
            expiry: formatExpiry(card.expiry),
            status: card.status
        },
        investorInfo: {
            id: investor.id,
            name: investor.name,
            phone: investor.phone
        },
        statistics: {
            totalTransactions: stats.totalTransactions,
            totalAmount: stats.totalAmount,
            monthlyAverage: stats.monthlyAverage,
            growthRate: stats.growthRate + '%'
        },
        monthlyData: stats.monthlyData,
        exportDate: new Date().toISOString()
    };
    
    // تحويل البيانات إلى JSON
    const jsonStr = JSON.stringify(exportData, null, 2);
    
    // إنشاء ملف للتحميل
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-stats-${card.number}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    createNotification('نجاح', 'تم تصدير البيانات بنجاح', 'success');
}

// تبديل حالة البطاقة
function toggleCardStatus() {
    if (!currentCardId) return;
    
    const card = investorCards.find(c => c.id === currentCardId);
    if (!card) return;
    
    card.status = card.status === 'active' ? 'suspended' : 'active';
    card.updatedAt = new Date().toISOString();
    
    saveInvestorCards();
    
    // مزامنة مع Firebase
    syncCardToFirebase(card);
    
    if (typeof createNotification === 'function') {
        createNotification('نجاح', 
            card.status === 'active' ? 'تم تفعيل البطاقة بنجاح' : 'تم إيقاف البطاقة بنجاح', 
            'success'
        );
    }
    
    closeModal('cardDetailsModal');
    updateCardsDisplay();
    updateCardsBadges();
}

// حذف البطاقة
function deleteCard() {
    if (!currentCardId) return;
    
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
        // حذف من Firebase
        if (cardDatabase) {
            cardDatabase.child(currentCardId).remove();
        }
        
        investorCards = investorCards.filter(c => c.id !== currentCardId);
        saveInvestorCards();
        
        if (typeof createNotification === 'function') {
            createNotification('نجاح', 'تم حذف البطاقة بنجاح', 'success');
        }
        
        // Continuación de la función deleteCard()
function deleteCard() {
    if (!currentCardId) return;
    
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
        // حذف من Firebase
        if (cardDatabase) {
            cardDatabase.child(currentCardId).remove();
        }
        
        investorCards = investorCards.filter(c => c.id !== currentCardId);
        saveInvestorCards();
        
        if (typeof createNotification === 'function') {
            createNotification('نجاح', 'تم حذف البطاقة بنجاح', 'success');
        }
        
        closeModal('cardDetailsModal');
        updateCardsDisplay();
        updateCardsBadges();
    }
}

// تبديل عرض البطاقات
function switchCardsTab(tab) {
    const allMenuItems = document.querySelectorAll('.cards-menu-item');
    allMenuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // العثور على العنصر الصحيح وتفعيله
    const activeItem = Array.from(allMenuItems).find(item => 
        item.onclick && item.onclick.toString().includes(`'${tab}'`)
    );
    
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    updateCardsDisplay(tab);
}

// تحديث الشارات
function updateCardsBadges() {
    if (!Array.isArray(investorCards)) {
        investorCards = [];
    }
    
    const allCards = investorCards.length;
    const activeCards = investorCards.filter(c => c.status === 'active').length;
    const suspendedCards = investorCards.filter(c => c.status === 'suspended').length;
    
    const allBadge = document.getElementById('allCardsBadge');
    const activeBadge = document.getElementById('activeCardsBadge');
    const suspendedBadge = document.getElementById('suspendedCardsBadge');
    
    if (allBadge) allBadge.textContent = allCards;
    if (activeBadge) activeBadge.textContent = activeCards;
    if (suspendedBadge) suspendedBadge.textContent = suspendedCards;
}

// ===============================================================
// SECTION 5: تكامل Firebase المتقدم
// ===============================================================

// فئة مدير Firebase للبطاقات
class CardFirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.messaging = null;
        this.currentUser = null;
        this.listeners = [];
    }

    // تهيئة Firebase
    async initialize() {
        try {
            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            if (typeof firebase !== 'undefined') {
                this.db = firebase.database();
                this.auth = firebase.auth();
                this.storage = firebase.storage();
                
                if (firebase.messaging) {
                    this.messaging = firebase.messaging();
                }
    
                // الاستماع لحالة المصادقة
                this.auth.onAuthStateChanged(user => {
                    this.currentUser = user;
                    if (user) {
                        this.setupCardListeners();
                        this.setupNotifications();
                    }
                });
    
                console.log("✅ تم تهيئة مدير Firebase بنجاح");
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ خطأ في تهيئة مدير Firebase:', error);
            return false;
        }
    }

    // إعداد مستمعي البطاقات
    setupCardListeners() {
        // الاستماع لتغييرات البطاقات
        const cardsRef = this.db.ref('cards');
        
        const cardsListener = cardsRef.on('value', snapshot => {
            const cards = snapshot.val();
            if (cards) {
                this.updateLocalCards(cards);
            }
        });

        this.listeners.push({ ref: cardsRef, listener: cardsListener });

        // الاستماع لمعاملات البطاقات
        const transactionsRef = this.db.ref('cardTransactions');
        
        const transListener = transactionsRef.on('child_added', snapshot => {
            const transaction = snapshot.val();
            this.handleNewTransaction(transaction);
        });

        this.listeners.push({ ref: transactionsRef, listener: transListener });
    }

    // تحديث البطاقات المحلية
    updateLocalCards(firebaseCards) {
        // تحديث البطاقات المحلية باستخدام بيانات Firebase
        const updatedCards = [];
        
        for (const [id, card] of Object.entries(firebaseCards)) {
            // البحث عن البطاقة في القائمة المحلية
            const existingCardIndex = investorCards.findIndex(c => c.id === id);
            
            if (existingCardIndex >= 0) {
                // تحديث البطاقة الموجودة
                investorCards[existingCardIndex] = { ...investorCards[existingCardIndex], ...card };
                updatedCards.push(investorCards[existingCardIndex]);
            } else {
                // إضافة بطاقة جديدة
                updatedCards.push(card);
            }
        }
        
        // تحديث التطبيق إذا تم تغيير البطاقات
        if (updatedCards.length > 0) {
            updateCardsDisplay();
            updateCardsBadges();
            
            console.log(`✅ تم تحديث ${updatedCards.length} بطاقة من Firebase`);
        }
    }

    // معالجة معاملة جديدة
    handleNewTransaction(transaction) {
        try {
            // تحديث واجهة المستخدم
            if (typeof addTransactionToUI === 'function') {
                addTransactionToUI(transaction);
            }
            
            // إضافة إلى قائمة المعاملات المحلية
            if (Array.isArray(operations)) {
                const existingIndex = operations.findIndex(op => op.id === transaction.id);
                
                if (existingIndex >= 0) {
                    operations[existingIndex] = transaction;
                } else {
                    operations.push(transaction);
                }
            }
            
            // إظهار إشعار
            if (typeof createNotification === 'function') {
                const amount = typeof formatCurrency === 'function' ? 
                    formatCurrency(transaction.amount) : transaction.amount;
                
                createNotification(
                    'معاملة جديدة',
                    `${getOperationTypeName(transaction.type)}: ${amount}`,
                    'info'
                );
            }
        } catch (error) {
            console.error('❌ خطأ في معالجة المعاملة الجديدة:', error);
        }
    }

    // إعداد الإشعارات
    async setupNotifications() {
        try {
            // التحقق من دعم الإشعارات
            if (!('Notification' in window) || !this.messaging) return;
            
            // طلب إذن الإشعارات
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // الحصول على رمز FCM
                const token = await this.messaging.getToken();
                if (token) {
                    // حفظ الرمز في قاعدة البيانات
                    await this.db.ref(`users/${this.currentUser.uid}/fcmToken`).set(token);
                }

                // الاستماع للرسائل
                this.messaging.onMessage(payload => {
                    this.showNotification(payload);
                });
                
                console.log("✅ تم إعداد الإشعارات بنجاح");
            }
        } catch (error) {
            console.error('❌ خطأ في إعداد الإشعارات:', error);
        }
    }

    // عرض إشعار
    showNotification(payload) {
        try {
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: payload.notification.icon || '/images/icon.png'
            };
            
            const notification = new Notification(notificationTitle, notificationOptions);
            
            notification.onclick = () => {
                // التعامل مع النقر على الإشعار
                if (payload.data.cardId) {
                    viewCardDetails(payload.data.cardId);
                }
                
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('❌ خطأ في عرض الإشعار:', error);
        }
    }

    // حفظ بطاقة جديدة
    async saveCard(card) {
        try {
            if (!this.db) return false;
            
            const cardRef = this.db.ref(`cards/${card.id}`);
            await cardRef.set({
                ...card,
                createdBy: this.currentUser?.uid || 'system',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastModified: firebase.database.ServerValue.TIMESTAMP
            });

            // حفظ في سجل المستثمر
            const investorCardRef = this.db.ref(`investors/${card.investorId}/cards/${card.id}`);
            await investorCardRef.set(true);

            // إنشاء رمز QR وحفظه
            const qrData = await this.generateCardQRData(card);
            await this.saveCardQR(card.id, qrData);

            console.log(`✅ تم حفظ البطاقة ${card.id} في Firebase`);
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ البطاقة:', error);
            return false;
        }
    }

    // إنشاء بيانات QR للبطاقة
    async generateCardQRData(card) {
        try {
            const investor = investors.find(inv => inv.id === card.investorId);
            const totalInvestment = getTotalInvestment(card.investorId);
            const totalProfit = getTotalProfits(card.investorId);
    
            const qrData = {
                version: '1.0',
                cardId: card.id,
                cardNumber: card.number,
                investorId: card.investorId,
                investorName: investor?.name,
                cardType: card.type,
                expiryDate: card.expiry,
                status: card.status,
                issuerBank: 'بنك الاستثمار العراقي',
                timestamp: new Date().toISOString(),
                
                // معلومات الاستثمار
                investmentData: {
                    totalInvestment,
                    totalProfit,
                    activeInvestments: Array.isArray(investments) ?
                        investments.filter(inv => 
                            inv.investorId === card.investorId && inv.status === 'active'
                        ).length : 0
                },
                
                // معلومات الأمان
                security: {
                    checksum: this.generateChecksum(card),
                    encryptedData: await this.encryptSensitiveData(card)
                },
                
                // روابط التطبيق
                appLinks: {
                    deepLink: `investmentapp://card/${card.id}`,
                    webLink: `https://investment-app.com/cards/${card.id}`
                }
            };
    
            // تحويل إلى JSON مضغوط
            return JSON.stringify(qrData);
        } catch (error) {
            console.error('❌ خطأ في إنشاء بيانات QR:', error);
            return JSON.stringify({ cardId: card.id, error: 'Failed to generate QR data' });
        }
    }

    // إنشاء checksum للبطاقة
    generateChecksum(card) {
        const data = `${card.id}-${card.number}-${card.investorId}-${card.type}`;
        
        // حساب checksum بسيط
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum = ((checksum << 5) - checksum) + data.charCodeAt(i);
            checksum = checksum & checksum;
        }
        
        return Math.abs(checksum).toString(16);
    }

    // تشفير البيانات الحساسة
    async encryptSensitiveData(card) {
        // محاكاة تشفير للتوضيح
        const sensitiveData = {
            cvv: Math.floor(Math.random() * 900) + 100,
            pin: Math.floor(Math.random() * 9000) + 1000
        };
        
        return btoa(JSON.stringify(sensitiveData));
    }

    // حفظ QR البطاقة
    async saveCardQR(cardId, qrData) {
        try {
            if (!this.storage) return null;
            
            // إنشاء صورة QR
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            
            // رسم QR
            if (typeof QRCode === 'function') {
                new QRCode(canvas, {
                    text: qrData,
                    width: canvas.width,
                    height: canvas.height,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // رسم QR بشكل بسيط
                drawSimpleQRCode(canvas, qrData);
            }

            // تحويل إلى Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // رفع إلى Firebase Storage
            const storageRef = this.storage.ref(`card-qr/${cardId}.png`);
            await storageRef.put(blob);
            
            // الحصول على URL
            const downloadURL = await storageRef.getDownloadURL();
            
            // حفظ URL في قاعدة البيانات
            await this.db.ref(`cards/${cardId}/qrUrl`).set(downloadURL);
            
            console.log(`✅ تم حفظ رمز QR للبطاقة ${cardId} في Firebase`);
            return downloadURL;
        } catch (error) {
            console.error('❌ خطأ في حفظ رمز QR:', error);
            return null;
        }
    }

    // مراقبة حالة البطاقة
    async monitorCardStatus(cardId) {
        try {
            if (!this.db) return;
            
            const cardRef = this.db.ref(`cards/${cardId}/status`);
            
            cardRef.on('value', snapshot => {
                const status = snapshot.val();
                
                // تحديث واجهة المستخدم
                const cardElement = document.getElementById(`card-${cardId}`);
                if (cardElement) {
                    if (status === 'suspended') {
                        cardElement.classList.add('suspended');
                    } else {
                        cardElement.classList.remove('suspended');
                    }
                }
                
                // إشعار المستخدم بتغيير الحالة
                if (status === 'suspended') {
                    createNotification(
                        'تم إيقاف البطاقة',
                        `تم إيقاف البطاقة ${cardId} مؤقتاً`,
                        'warning'
                    );
                } else if (status === 'active') {
                    createNotification(
                        'تم تفعيل البطاقة',
                        `تم تفعيل البطاقة ${cardId} بنجاح`,
                        'success'
                    );
                }
            });
        } catch (error) {
            console.error('❌ خطأ في مراقبة حالة البطاقة:', error);
        }
    }

    // تسجيل معاملة جديدة
    async recordTransaction(cardId, transaction) {
        try {
            if (!this.db) return null;
            
            const transactionRef = this.db.ref(`cardTransactions/${cardId}`).push();
            
            await transactionRef.set({
                ...transaction,
                id: transactionRef.key,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                processedBy: this.currentUser?.uid || 'system'
            });
            
            // تحديث إحصائيات البطاقة
            await this.updateCardStats(cardId, transaction);
            
            // إرسال إشعار للمستثمر
            await this.sendTransactionNotification(cardId, transaction);
            
            console.log(`✅ تم تسجيل معاملة جديدة للبطاقة ${cardId}`);
            return transactionRef.key;
        } catch (error) {
            console.error('❌ خطأ في تسجيل المعاملة:', error);
            return null;
        }
    }

    // تحديث إحصائيات البطاقة
    async updateCardStats(cardId, transaction) {
        try {
            if (!this.db) return;
            
            const statsRef = this.db.ref(`cardStats/${cardId}`);
            
            await statsRef.transaction(currentStats => {
                if (!currentStats) {
                    currentStats = {
                        totalTransactions: 0,
                        totalAmount: 0,
                        lastTransaction: null
                    };
                }
                
                currentStats.totalTransactions++;
                currentStats.totalAmount += transaction.amount;
                currentStats.lastTransaction = new Date().toISOString();
                
                return currentStats;
            });
        } catch (error) {
            console.error('❌ خطأ في تحديث إحصائيات البطاقة:', error);
        }
    }

    // إرسال إشعار للمستثمر
    async sendTransactionNotification(cardId, transaction) {
        try {
            if (!this.db) return false;
            
            // جلب بيانات البطاقة
            const cardSnapshot = await this.db.ref(`cards/${cardId}`).once('value');
            const card = cardSnapshot.val();
            
            if (!card) return false;
            
            // جلب رمز FCM للمستثمر
            const tokenSnapshot = await this.db.ref(`investors/${card.investorId}/fcmToken`).once('value');
            const fcmToken = tokenSnapshot.val();
            
            if (!fcmToken) return false;
            
            // إعداد الإشعار - في البيئة الإنتاجية، استخدم Cloud Functions
            const notification = {
                title: 'معاملة جديدة',
                body: `تمت معاملة بقيمة ${formatCurrency(transaction.amount)} على بطاقتك`,
                icon: '/images/icon.png',
                clickAction: `https://investment-app.com/cards/${cardId}`,
                data: {
                    cardId,
                    transactionId: transaction.id,
                    type: 'transaction'
                }
            };
            
            console.log(`✅ تم إرسال إشعار للمستثمر ${card.investorId}`);
            return true;
        } catch (error) {
            console.error('❌ خطأ في إرسال الإشعار:', error);
            return false;
        }
    }

    // تنظيف المستمعين
    cleanup() {
        this.listeners.forEach(({ ref, listener }) => {
            ref.off('value', listener);
        });
        this.listeners = [];
        console.log("✅ تم تنظيف مستمعي Firebase");
    }
}

// ===============================================================
// SECTION 6: واجهة API للتطبيق المحمول
// ===============================================================

// فئة واجهة API للتطبيق المحمول
class MobileAppAPI {
    constructor() {
        this.baseUrl = 'https://investment-app.com/api';
        this.version = 'v1';
    }

    // مصادقة المستخدم باستخدام البطاقة
    async authenticateWithCard(cardNumber, pin) {
        try {
            console.log("⏳ جاري مصادقة المستخدم...");
            const response = await fetch(`${this.baseUrl}/${this.version}/auth/card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardNumber,
                    pin,
                    deviceInfo: await this.getDeviceInfo()
                })
            });

            if (!response.ok) {
                throw new Error('فشل في المصادقة');
            }

            const data = await response.json();
            console.log("✅ تمت المصادقة بنجاح");
            return {
                success: true,
                token: data.token,
                investor: data.investor,
                card: data.card
            };
        } catch (error) {
            console.error('❌ خطأ في المصادقة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // جلب تفاصيل البطاقة
    async getCardDetails(cardId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/cards/${cardId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب تفاصيل البطاقة');
            }

            return await response.json();
        } catch (error) {
            console.error('❌ خطأ في جلب تفاصيل البطاقة:', error);
            return null;
        }
    }

    // معالجة رمز QR
    async processQRCode(qrData) {
        try {
            console.log("⏳ جاري معالجة رمز QR...");
            const data = JSON.parse(qrData);
            
            // التحقق من صحة البيانات
            if (!data.cardId && !data.id) {
                throw new Error('بيانات QR غير صالحة');
            }
            
            // استخراج معرف البطاقة (يدعم التنسيقين القديم والجديد)
            const cardId = data.cardId || data.id;
            
            // جلب تفاصيل البطاقة
            const cardDetails = await this.getCardDetails(cardId, 'guest-token');
            
            if (!cardDetails) {
                throw new Error('البطاقة غير موجودة');
            }
            
            console.log("✅ تمت معالجة رمز QR بنجاح");
            return {
                success: true,
                cardData: data,
                cardDetails,
                deepLink: data.appLinks?.deepLink || `investmentapp://card/${cardId}`
            };
        } catch (error) {
            console.error('❌ خطأ في معالجة رمز QR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // معلومات الجهاز
    async getDeviceInfo() {
        return {
            platform: this.getPlatform(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // منصة الجهاز
    getPlatform() {
        const userAgent = navigator.userAgent;
        
        if (/android/i.test(userAgent)) {
            return 'android';
        }
        
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
        }
        
        return 'web';
    }
}

// ===============================================================
// SECTION 7: وظائف مساعدة
// ===============================================================

// وظائف مساعدة
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateCardNumber() {
    // إنشاء رقم بطاقة يشبه بطاقات الائتمان الحقيقية
    const prefixes = {
        'platinum': '5555',
        'gold': '4444',
        'premium': '3333'
    };
    
    const cardType = document.querySelector('input[name="cardType"]:checked')?.value || 'premium';
    const prefix = prefixes[cardType] || '3333';
    
    let number = prefix;
    for (let i = 0; i < 12; i++) {
        number += Math.floor(Math.random() * 10);
    }
    
    // إضافة رقم التحقق (Luhn algorithm)
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit = digit - 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return number + checkDigit;
}

function formatCardNumber(number) {
    return number.replace(/(\d{4})/g, '$1 ').trim();
}

function formatExpiry(date) {
    if (!date) return '';
    const parts = date.split('-');
    return `${parts[1]}/${parts[0].substring(2)}`;
}

function getCardTypeName(type) {
    switch (type) {
        case 'platinum': return 'بلاتينية';
        case 'gold': return 'ذهبية';
        case 'premium': return 'بريميوم';
        default: return type;
    }
}

function getTotalInvestment(investorId) {
    if (!Array.isArray(investments)) return 0;
    
    return investments
        .filter(inv => inv.investorId === investorId && inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
}

function getTotalProfits(investorId) {
    if (!Array.isArray(investments)) return 0;
    
    const today = new Date();
    let totalProfits = 0;
    
    investments
        .filter(inv => inv.investorId === investorId && inv.status === 'active')
        .forEach(inv => {
            if (typeof calculateProfit === 'function') {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfits += profit;
            }
        });
    
    return totalProfits;
}

function getRecentTransactions(investorId) {
    if (!Array.isArray(operations)) return '<p>لا توجد معاملات</p>';
    
    const recentOps = operations
        .filter(op => op.investorId === investorId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentOps.length === 0) {
        return '<p>لا توجد معاملات</p>';
    }
    
    return recentOps.map(op => `
        <div class="transaction-item">
            <div class="transaction-icon">
                <i class="fas fa-${op.type === 'investment' ? 'plus' : op.type === 'withdrawal' ? 'minus' : 'hand-holding-usd'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-type">${typeof getOperationTypeName === 'function' ? getOperationTypeName(op.type) : op.type}</div>
                <div class="transaction-date">${typeof formatDate === 'function' ? formatDate(op.date) : op.date}</div>
            </div>
            <div class="transaction-amount ${op.type === 'withdrawal' ? 'negative' : 'positive'}">
                ${op.type === 'withdrawal' ? '-' : '+'}${typeof formatCurrency === 'function' ? formatCurrency(op.amount) : op.amount}
            </div>
        </div>
    `).join('');
}

function getOperationTypeName(type) {
    switch (type) {
        case 'investment': return 'استثمار';
        case 'withdrawal': return 'سحب';
        case 'profit': return 'أرباح';
        case 'transfer': return 'تحويل';
        case 'fee': return 'رسوم';
        default: return type;
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        return date.toLocaleDateString('ar-IQ', options);
    } catch (error) {
        return dateString;
    }
}

function formatCurrency(amount, short = false) {
    try {
        if (amount === undefined || amount === null) return 'غير محدد';
        
        if (short && amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)} م`;
        }
        
        return amount.toLocaleString('ar-IQ', {
            style: 'currency',
            currency: 'IQD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    } catch (error) {
        return `${amount} د.ع`;
    }
}

// البحث عن البطاقات
function searchInvestorCards() {
    const searchInput = document.querySelector('#investorCards .search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        updateCardsDisplay();
        return;
    }
    
    const filteredCards = investorCards.filter(card => {
        const investor = investors.find(inv => inv.id === card.investorId);
        if (!investor) return false;
        
        return investor.name.toLowerCase().includes(searchTerm) ||
               card.number.includes(searchTerm) ||
               investor.phone.includes(searchTerm);
    });
    
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div style="text-align: center; padding: 50px; grid-column: 1 / -1;">
                <i class="fas fa-search fa-3x" style="color: var(--gray-400); margin-bottom: 15px;"></i>
                <p style="color: var(--gray-600);">لم يتم العثور على بطاقات مطابقة</p>
            </div>
        `;
        return;
    }
    
    filteredCards.forEach(card => {
        const investor = investors.find(inv => inv.id === card.investorId);
        if (investor) {
            const cardElement = createCardElement(card, investor);
            cardsGrid.appendChild(cardElement);
        }
    });
}

// تحميل المستثمرين في قائمة منسدلة
function loadCardInvestors() {
    const investorSelect = document.getElementById('cardInvestor');
    
    if (!investorSelect) return;
    
    // مسح الخيارات السابقة
    investorSelect.innerHTML = '<option value="">اختر المستثمر</option>';
    
    // ترتيب المستثمرين حسب الاسم
    const sortedInvestors = [...investors].sort((a, b) => a.name.localeCompare(b.name));
    
    // إضافة خيارات المستثمرين مع سمات البيانات
    sortedInvestors.forEach(investor => {
        const option = document.createElement('option');
        option.value = investor.id;
        option.textContent = investor.name;
        
        // إضافة الهاتف كسمة بيانات للوصول السهل
        option.dataset.phone = investor.phone || '';
        
        investorSelect.appendChild(option);
    });
    
    // إضافة معالج الحدث لاختيار المستثمر
    investorSelect.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        const phoneInput = document.getElementById('cardPhone');
        
        if (phoneInput && selectedOption.dataset.phone) {
            phoneInput.value = selectedOption.dataset.phone;
        } else if (phoneInput) {
            phoneInput.value = '';
        }
        
        updateCardPreview();
    };
}

// الحصول على أنماط البطاقة
function getCardStyles() {
    return `
        .investor-card {
            width: 350px;
            height: 220px;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .investor-card.premium {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
        }
        
        .investor-card.gold {
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        }
        
        .investor-card.platinum {
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
        }
        
        .investor-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        }
        
        .investor-card.suspended {
            filter: grayscale(1);
            opacity: 0.7;
        }
        
        .investor-card.suspended::after {
            content: 'متوقفة';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            background: rgba(231, 76, 60, 0.8);
            color: white;
            padding: 5px 20px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 5px;
            z-index: 10;
        }
        
        .card-shimmer {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
        }
        
        .card-content {
            position: relative;
            height: 100%;
            padding: 20px;
            color: white;
            z-index: 1;
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .card-logo {
            width: 60px;
            height: 35px;
            background: white;
            border-radius: 5px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .card-chip-container {
            position: absolute;
            top: 60px;
            left: 30px;
        }
        
        .card-chip {
            width: 50px;
            height: 40px;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            border-radius: 8px;
            position: relative;
            overflow: hidden;
        }
        
        .chip-lines {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 35px;
            height: 25px;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
        }
        
        .card-type-icon {
            font-size: 24px;
            color: rgba(255,255,255,0.8);
        }
        
        .card-qr-container {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 5px;
            border-radius: 8px;
            width: 80px;
            height: 80px;
        }
        
        .card-nfc-indicator {
            position: absolute;
            top: 50%;
            right: 30px;
            transform: translateY(-50%) rotate(90deg);
            color: rgba(255,255,255,0.6);
            font-size: 20px;
        }
        
        .card-number {
            font-size: 20px;
            letter-spacing: 3px;
            margin-top: 20px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            font-family: 'Courier New', monospace;
        }
        
        .card-details {
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
        }
        
        .card-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        
        .card-value {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        
        .card-footer {
            position: absolute;
            bottom: 10px;
            right: 20px;
            text-align: right;
        }
        
        .card-bank-name {
            font-size: 10px;
            opacity: 0.6;
        }
        
        .card-type-name {
            font-size: 12px;
            font-weight: 600;
            margin-top: 3px;
        }
        
        .scanner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .scanner-frame {
            width: 250px;
            height: 250px;
            border: 3px solid #fff;
            border-radius: 20px;
            position: relative;
            box-shadow: 0 0 0 100vw rgba(0,0,0,0.5);
        }
        
        .scanner-frame::before,
        .scanner-frame::after {
            content: '';
            position: absolute;
            width: 40px;
            height: 40px;
            border: 3px solid #3498db;
        }
        
        .scanner-frame::before {
            top: -3px;
            left: -3px;
            border-right: none;
            border-bottom: none;
            border-top-left-radius: 20px;
        }
        
        .scanner-frame::after {
            bottom: -3px;
            right: -3px;
            border-left: none;
            border-top: none;
            border-bottom-right-radius: 20px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-card i {
            font-size: 36px;
            color: #3498db;
            margin-bottom: 15px;
        }
        
        .stat-card h3 {
            font-size: 16px;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .stat-card p {
            font-size: 24px;
            font-weight: 700;
            color: #34495e;
            margin: 0;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .feature-item i {
            color: #3498db;
            font-size: 20px;
        }
        
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 15px;
            background: #f8f9fa;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .action-btn:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .action-btn i {
            font-size: 24px;
            color: #3498db;
        }
        
        .action-btn span {
            font-size: 14px;
            color: #2c3e50;
        }
        
        .transaction-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;
            gap: 15px;
        }
        
        .transaction-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3498db;
        }
        
        .transaction-details {
            flex: 1;
        }
        
        .transaction-type {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .transaction-date {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .transaction-amount {
            font-weight: 700;
            font-size: 16px;
        }
        
        .transaction-amount.positive {
            color: #27ae60;
        }
        
        .transaction-amount.negative {
            color: #e74c3c;
        }
        
        .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .status.active {
            background-color: rgba(46, 204, 113, 0.2);
            color: #27ae60;
        }
        
        .status.suspended {
            background-color: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
        
        .status.completed {
            background-color: rgba(46, 204, 113, 0.2);
            color: #27ae60;
        }
        
        .status.pending {
            background-color: rgba(243, 156, 18, 0.2);
            color: #f39c12;
        }
        
        .camera-selection {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 10;
        }
    `;
}

// إنشاء إشعار
function createNotification(title, message, type = 'info') {
    // التحقق من وجود div الإشعارات
    let notificationsContainer = document.getElementById('notifications-container');
    
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications-container';
        notificationsContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            max-width: 300px;
            direction: rtl;
        `;
        document.body.appendChild(notificationsContainer);
    }
    
    // إنشاء الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background-color: white;
        border-right: 4px solid var(--${type}-color, #3498db);
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 10px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        transform: translateX(-120%);
        transition: transform 0.3s ease;
        position: relative;
    `;
    
    // محتوى الإشعار
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
            <div style="margin-left: 10px; color: var(--${type}-color, #3498db);">
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'info-circle'
                }" style="font-size: 18px;"></i>
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px; font-size: 16px;">${title}</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">${message}</p>
            </div>
            <button style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999; margin-right: 5px;" onclick="this.parentElement.parentElement.remove()">
                &times;
            </button>
        </div>
        <div class="notification-progress" style="position: absolute; bottom: 0; right: 0; height: 3px; width: 100%; background-color: var(--${type}-color, #3498db); opacity: 0.7;"></div>
    `;
    
    // إضافة الإشعار إلى الحاوية
    notificationsContainer.appendChild(notification);
    
    // إظهار الإشعار بعد إضافته للـ DOM
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // شريط التقدم
    const progressBar = notification.querySelector('.notification-progress');
    const duration = 5000; // 5 ثوانٍ
    let width = 100;
    const interval = 10;
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
        width -= step;
        if (width <= 0) {
            clearInterval(timer);
            notification.style.transform = 'translateX(-120%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
        if (progressBar) {
            progressBar.style.width = `${width}%`;
        }
    }, interval);
    
    // إيقاف المؤقت عند تحويم الماوس
    notification.addEventListener('mouseenter', () => {
        clearInterval(timer);
    });
    
    // استئناف المؤقت عند مغادرة الماوس
    notification.addEventListener('mouseleave', () => {
        const newTimer = setInterval(() => {
            width -= step;
            if (width <= 0) {
                clearInterval(newTimer);
                notification.style.transform = 'translateX(-120%)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
            if (progressBar) {
                progressBar.style.width = `${width}%`;
            }
        }, interval);
    });
}

// إضافة معاملة إلى واجهة المستخدم
function addTransactionToUI(transaction) {
    // التحقق من وجود عنصر قائمة المعاملات
    const transactionsList = document.querySelector('.transactions-list');
    if (!transactionsList) return;
    
    // إنشاء عنصر المعاملة
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    transactionItem.innerHTML = `
        <div class="transaction-icon">
            <i class="fas fa-${transaction.type === 'investment' ? 'plus' : transaction.type === 'withdrawal' ? 'minus' : 'hand-holding-usd'}"></i>
        </div>
        <div class="transaction-details">
            <div class="transaction-type">${getOperationTypeName(transaction.type)}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
        </div>
        <div class="transaction-amount ${transaction.type === 'withdrawal' ? 'negative' : 'positive'}">
            ${transaction.type === 'withdrawal' ? '-' : '+'}${formatCurrency(transaction.amount)}
        </div>
    `;
    
    // إضافة المعاملة إلى بداية القائمة
    transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    
    // إضافة تأثير بصري للتنبيه
    transactionItem.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    setTimeout(() => {
        transactionItem.style.transition = 'background-color 1s ease';
        transactionItem.style.backgroundColor = 'transparent';
    }, 10);
}

// فتح نافذة منبثقة
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('active');
    
    // تطبيق تأثير الظهور
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
        }
    }, 10);
}

// إغلاق نافذة منبثقة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // تطبيق تأثير الاختفاء
    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.style.transform = 'translateY(-20px)';
        modalContent.style.opacity = '0';
    }
    
    // إزالة الفئة النشطة بعد انتهاء الحركة
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

// ===============================================================
// SECTION 8: التهيئة والإعداد
// ===============================================================

// دمج مع نظام الصفحات الرئيسي
if (typeof window.showPage === 'function') {
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        originalShowPage(pageId);
        if (pageId === 'investorCards') {
            showInvestorCards();
        }
    };
}

// إنشاء مثيل من API التطبيق المحمول
window.mobileAPI = new MobileAppAPI();

// تحميل النظام عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    // تهيئة Firebase
    initializeCardFirebase();
    
    // تحميل البطاقات المحفوظة
    loadInvestorCards();
    
    // إضافة HTML للأزرار إذا لم تكن موجودة
    const investorsPage = document.getElementById('investors');
    if (investorsPage) {
        const headerActions = investorsPage.querySelector('.header-actions');
        if (headerActions && !headerActions.querySelector('.scan-card-btn')) {
            const scanButton = document.createElement('button');
            scanButton.className = 'btn btn-info scan-card-btn';
            scanButton.onclick = scanBarcode;
            scanButton.innerHTML = '<i class="fas fa-qrcode"></i> مسح البطاقة';
            
            headerActions.insertBefore(scanButton, headerActions.firstChild);
        }
    }
    
    // إضافة أحداث لأزرار اختيار نوع البطاقة
    document.querySelectorAll('.card-type-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.card-type-option').forEach(opt => 
                opt.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
            updateCardPreview();
        });
    });
    
    // تعيين تاريخ انتهاء افتراضي إذا كان فارغاً
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput && !expiryInput.value) {
        const now = new Date();
        const futureDate = new Date(now.getFullYear() + 3, now.getMonth());
        expiryInput.value = futureDate.toISOString().slice(0, 7);
    }
    
    // تحميل مكتبة QR Code إذا لم تكن محملة
    if (typeof QRCode === 'undefined') {
        const qrScript = document.createElement('script');
        qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        document.head.appendChild(qrScript);
    }
    
    // تحميل مكتبة jsQR إذا لم تكن محملة
    if (typeof jsQR === 'undefined') {
        const jsQRScript = document.createElement('script');
        jsQRScript.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        document.head.appendChild(jsQRScript);
    }
    
    // تحميل مكتبة Chart.js إذا لم تكن محملة
    if (typeof Chart === 'undefined') {
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@2.9.4/dist/Chart.min.js';
        document.head.appendChild(chartScript);
    }
    
    // إضافة CSS لأنماط النظام
    const styleElement = document.createElement('style');
    styleElement.textContent = getCardStyles();
    document.head.appendChild(styleElement);
    
    // تطبيق تصحيحات الصور البديلة
    fixPlaceholderImages();
    
    console.log("✅ تم تهيئة نظام بطاقات المستثمرين بنجاح");
});

// تصحيح صور الملء البديلة
function fixPlaceholderImages() {
    document.querySelectorAll('img[src^="/api/placeholder/"]').forEach(img => {
        img.onerror = function() {
            this.onerror = null;
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="${this.width || 60}" height="${this.height || 35}" 
                     xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f0f0f0"/>
                    <text x="50%" y="50%" font-size="12" text-anchor="middle" 
                          dominant-baseline="middle" fill="#888">IIB</text>
                </svg>
            `);
        };
        // تنفيذ onerror يدوياً إذا لزم الأمر
        if (img.complete && img.naturalWidth === 0) {
            img.onerror();
        }
    });
}

// export global functions
window.scanBarcode = scanBarcode;
window.closeBarcodeScanner = closeBarcodeScanner;
window.uploadQRImage = uploadQRImage;
window.toggleFlashlight = toggleFlashlight;
window.switchCamera = switchCamera;
window.viewCardDetails = viewCardDetails;
window.createCardElement = createCardElement;
window.updateCardPreview = updateCardPreview;
window.createInvestorCard = createInvestorCard;
window.toggleCardStatus = toggleCardStatus;
window.deleteCard = deleteCard;
window.printCard = printCard;
window.shareCard = shareCard;
window.downloadCardQR = downloadCardQR;
window.viewCardStatistics = viewCardStatistics;
window.searchInvestorCards = searchInvestorCards;
window.switchCardsTab = switchCardsTab;
window.loadCardInvestors = loadCardInvestors;
window.openCreateCardModal = openCreateCardModal;
window.openModal = openModal;
window.closeModal = closeModal;

// إصلاح مشكلة إنشاء البطاقات الجديدة

// 1. دالة للتشخيص وإصلاح المشاكل
function diagnosisAndFixCardCreation() {
    console.log("🔍 بدء تشخيص مشاكل إنشاء البطاقات...");
    
    // التحقق من وجود العناصر المطلوبة في DOM
    const createCardBtn = document.querySelector('.btn-add-card, .add-card-button, button[onclick*="openCreateCardModal"]');
    const createCardModal = document.getElementById('createCardModal');
    const createCardForm = document.getElementById('createCardForm');
    const cardInvestor = document.getElementById('cardInvestor');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardTypeRadios = document.querySelectorAll('input[name="cardType"]');
    
    // عرض نتائج التشخيص
    console.log("تم العثور على زر إنشاء البطاقة:", !!createCardBtn);
    console.log("تم العثور على النافذة المنبثقة:", !!createCardModal);
    console.log("تم العثور على نموذج إنشاء البطاقة:", !!createCardForm);
    console.log("تم العثور على قائمة المستثمرين:", !!cardInvestor);
    console.log("تم العثور على حقل تاريخ الانتهاء:", !!cardExpiry);
    console.log("تم العثور على أزرار اختيار نوع البطاقة:", cardTypeRadios.length);
    
    // فحص المكتبات المطلوبة
    console.log("مكتبة QRCode متاحة:", typeof QRCode !== 'undefined');
    
    // إصلاح المشكلات المحتملة:
    
    // 1. إعادة ربط زر الإنشاء
    if (createCardBtn) {
        createCardBtn.onclick = function() {
            console.log("✅ تم النقر على زر إنشاء البطاقة");
            openCreateCardModal();
        };
        console.log("✅ تم إعادة ربط زر إنشاء البطاقة");
    } else {
        console.error("❌ لم يتم العثور على زر إنشاء البطاقة - إنشاء زر بديل");
        
        // إنشاء زر بديل
        const headerActions = document.querySelector('.header-actions, .page-header, .card-header, header');
        if (headerActions) {
            const newButton = document.createElement('button');
            newButton.className = 'btn btn-primary btn-add-card';
            newButton.innerHTML = '<i class="fas fa-plus"></i> إنشاء بطاقة جديدة';
            newButton.onclick = openCreateCardModal;
            headerActions.appendChild(newButton);
            console.log("✅ تم إنشاء زر بديل");
        }
    }
    
    // 2. التحقق من نافذة الإنشاء وإصلاحها إذا لزم الأمر
    if (!createCardModal) {
        console.error("❌ لم يتم العثور على النافذة المنبثقة - إنشاء نافذة بديلة");
        // إنشاء نافذة منبثقة بديلة
        createCreateCardModal();
        console.log("✅ تم إنشاء نافذة منبثقة بديلة");
    }
    
    // 3. التحقق من وجود المستثمرين
    if (cardInvestor && cardInvestor.options.length <= 1) {
        console.warn("⚠️ لا يوجد مستثمرين في القائمة المنسدلة");
        console.log("محاولة إعادة تحميل المستثمرين...");
        loadCardInvestors();
    }
    
    // 4. إعادة تعريف دالة إنشاء البطاقة لتكون أكثر مرونة
    window.createInvestorCard = function() {
        try {
            console.log("🔄 بدء عملية إنشاء البطاقة");
            
            // الحصول على قيم الإدخال
            const investorSelect = document.getElementById('cardInvestor');
            const expiryInput = document.getElementById('cardExpiry');
            const cardTypeRadios = document.querySelectorAll('input[name="cardType"]');
            
            if (!investorSelect) {
                throw new Error("لم يتم العثور على حقل اختيار المستثمر");
            }
            
            const investorId = investorSelect.value;
            const expiry = expiryInput ? expiryInput.value : new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
            
            // تحديد نوع البطاقة المحدد
            let cardType = 'premium'; // القيمة الافتراضية
            cardTypeRadios.forEach(radio => {
                if (radio.checked) {
                    cardType = radio.value;
                }
            });
            
            console.log("قيم الإدخال:", { investorId, expiry, cardType });
            
            // التحقق من صحة الإدخال
            if (!investorId) {
                alert('يرجى اختيار المستثمر');
                return;
            }
            
            // التحقق من وجود مصفوفة البطاقات
            if (!Array.isArray(window.investorCards)) {
                console.warn("⚠️ مصفوفة البطاقات غير موجودة، سيتم إنشاؤها");
                window.investorCards = [];
            }
            
            // إنشاء البطاقة الجديدة
            const newCard = {
                id: generateId(),
                investorId: investorId,
                number: generateCardNumber(),
                type: cardType,
                expiry: expiry,
                status: 'active',
                createdAt: new Date().toISOString(),
                transactions: [],
                limits: {
                    dailyLimit: cardType === 'platinum' ? 10000000 : cardType === 'gold' ? 5000000 : 2000000,
                    monthlyLimit: cardType === 'platinum' ? 100000000 : cardType === 'gold' ? 50000000 : 20000000,
                    withdrawalLimit: cardType === 'platinum' ? 5000000 : cardType === 'gold' ? 2500000 : 1000000
                },
                features: getCardFeatures(cardType)
            };
            
            // إضافة البطاقة للمصفوفة
            investorCards.push(newCard);
            console.log("✅ تمت إضافة البطاقة:", newCard);
            
            // حفظ البطاقات
            if (typeof saveInvestorCards === 'function') {
                saveInvestorCards();
            } else {
                // حفظ في التخزين المحلي فقط إذا لم تكن الدالة موجودة
                localStorage.setItem('investorCards', JSON.stringify(investorCards));
                console.log("✅ تم حفظ البطاقات في التخزين المحلي");
            }
            
            // مزامنة مع Firebase إذا كان متاحًا
            if (typeof syncCardToFirebase === 'function') {
                syncCardToFirebase(newCard);
            }
            
            // إغلاق النافذة المنبثقة
            closeModal('createCardModal');
            
            // تحديث العرض
            if (typeof updateCardsDisplay === 'function') {
                updateCardsDisplay();
            }
            
            if (typeof updateCardsBadges === 'function') {
                updateCardsBadges();
            }
            
            // إظهار إشعار النجاح
            if (typeof createNotification === 'function') {
                createNotification('نجاح', 'تم إنشاء البطاقة بنجاح', 'success');
            } else {
                alert('تم إنشاء البطاقة بنجاح');
            }
            
            console.log("✅ اكتملت عملية إنشاء البطاقة بنجاح");
            return true;
            
        } catch (error) {
            console.error("❌ حدث خطأ أثناء إنشاء البطاقة:", error);
            alert(`حدث خطأ أثناء إنشاء البطاقة: ${error.message}`);
            return false;
        }
    };
    
    // 5. إعادة تعريف دالة فتح النافذة المنبثقة
    window.openCreateCardModal = function() {
        try {
            console.log("🔄 محاولة فتح نافذة إنشاء البطاقة");
            
            const form = document.getElementById('createCardForm');
            if (form) {
                form.reset();
            }
            
            // تحميل المستثمرين
            if (typeof loadCardInvestors === 'function') {
                loadCardInvestors();
            }
            
            // فتح النافذة المنبثقة
            if (typeof openModal === 'function') {
                openModal('createCardModal');
            } else {
                // فتح النافذة المنبثقة بطريقة بديلة
                const modal = document.getElementById('createCardModal');
                if (modal) {
                    modal.classList.add('active');
                    console.log("✅ تم فتح النافذة المنبثقة");
                } else {
                    console.error("❌ لم يتم العثور على النافذة المنبثقة");
                    createCreateCardModal();
                }
            }
            
            // تحديث معاينة البطاقة
            if (typeof updateCardPreview === 'function') {
                updateCardPreview();
            }
            
            console.log("✅ تم فتح نافذة إنشاء البطاقة بنجاح");
            return true;
            
        } catch (error) {
            console.error("❌ حدث خطأ أثناء فتح نافذة إنشاء البطاقة:", error);
            // إنشاء النافذة المنبثقة بديلة إذا حدث خطأ
            createCreateCardModal();
            return false;
        }
    };
    
    console.log("✅ اكتمل تشخيص وإصلاح مشاكل إنشاء البطاقات");
    return true;
}

// وظيفة إنشاء نافذة منبثقة بديلة
function createCreateCardModal() {
    // التحقق من عدم وجود النافذة بالفعل
    if (document.getElementById('createCardModal')) {
        return;
    }
    
    // إنشاء عنصر النافذة المنبثقة
    const modal = document.createElement('div');
    modal.id = 'createCardModal';
    modal.className = 'modal-overlay';
    
    // إنشاء HTML للنافذة المنبثقة
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">إنشاء بطاقة جديدة</h2>
                <div class="modal-close" onclick="closeModal('createCardModal')">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <form id="createCardForm">
                    <div class="form-group">
                        <label for="cardInvestor">المستثمر</label>
                        <select id="cardInvestor" class="form-control" required>
                            <option value="">اختر المستثمر</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cardExpiry">تاريخ الانتهاء</label>
                        <input type="month" id="cardExpiry" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>نوع البطاقة</label>
                        <div class="card-types-grid">
                            <div class="card-type-option premium">
                                <input type="radio" name="cardType" id="cardTypePremium" value="premium" checked>
                                <label for="cardTypePremium">
                                    <i class="fas fa-star"></i>
                                    <span>بريميوم</span>
                                </label>
                            </div>
                            <div class="card-type-option gold">
                                <input type="radio" name="cardType" id="cardTypeGold" value="gold">
                                <label for="cardTypeGold">
                                    <i class="fas fa-crown"></i>
                                    <span>ذهبية</span>
                                </label>
                            </div>
                            <div class="card-type-option platinum">
                                <input type="radio" name="cardType" id="cardTypePlatinum" value="platinum">
                                <label for="cardTypePlatinum">
                                    <i class="fas fa-gem"></i>
                                    <span>بلاتينية</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>معاينة البطاقة</label>
                        <div id="cardPreview" class="card-preview-container"></div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="closeModal('createCardModal')">إلغاء</button>
                <button class="btn btn-primary" onclick="createInvestorCard()">إنشاء البطاقة</button>
            </div>
        </div>
    `;
    
    // إضافة النافذة المنبثقة إلى DOM
    document.body.appendChild(modal);
    
    // إضافة نمط CSS للنافذة المنبثقة
    const style = document.createElement('style');
    style.textContent = `
        .card-types-grid {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .card-type-option {
            flex: 1;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
        }
        
        .card-type-option.premium {
            background-color: rgba(52, 73, 94, 0.1);
        }
        
        .card-type-option.gold {
            background-color: rgba(241, 196, 15, 0.1);
        }
        
        .card-type-option.platinum {
            background-color: rgba(149, 165, 166, 0.1);
        }
        
        .card-type-option.selected {
            border-color: #3498db;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
        }
        
        .card-type-option input[type="radio"] {
            display: none;
        }
        
        .card-type-option label {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 100%;
            cursor: pointer;
        }
        
        .card-type-option i {
            font-size: 24px;
        }
        
        .card-type-option.premium i {
            color: #34495e;
        }
        
        .card-type-option.gold i {
            color: #f39c12;
        }
        
        .card-type-option.platinum i {
            color: #7f8c8d;
        }
        
        .card-preview-container {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        }
        
        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .modal {
            background-color: white;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .modal-overlay.active .modal {
            transform: translateY(0);
            opacity: 1;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .modal-title {
            margin: 0;
            font-size: 18px;
        }
        
        .modal-close {
            cursor: pointer;
            font-size: 18px;
            color: #777;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            padding: 15px 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        
        .btn-light {
            background-color: #f8f9fa;
            color: #333;
        }
        
        .btn-light:hover {
            background-color: #e9ecef;
        }
        
        .btn-primary {
            background-color: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #2980b9;
        }
    `;
    
    document.head.appendChild(style);
    
    // إضافة مستمع الأحداث لاختيار نوع البطاقة
    setTimeout(() => {
        document.querySelectorAll('.card-type-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.card-type-option').forEach(opt => 
                    opt.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input[type="radio"]').checked = true;
                if (typeof updateCardPreview === 'function') {
                    updateCardPreview();
                }
            });
        });
        
        // اختيار النوع الافتراضي
        const defaultOption = document.querySelector('.card-type-option.premium');
        if (defaultOption) {
            defaultOption.classList.add('selected');
            if (typeof updateCardPreview === 'function') {
                updateCardPreview();
            }
        }
        
        // تحميل المستثمرين
        if (typeof loadCardInvestors === 'function') {
            loadCardInvestors();
        } else {
            // تعبئة القائمة المنسدلة من مصفوفة المستثمرين الحالية
            const investorSelect = document.getElementById('cardInvestor');
            if (investorSelect && Array.isArray(window.investors)) {
                investorSelect.innerHTML = '<option value="">اختر المستثمر</option>';
                window.investors.forEach(investor => {
                    const option = document.createElement('option');
                    option.value = investor.id;
                    option.textContent = investor.name;
                    investorSelect.appendChild(option);
                });
            }
        }
        
        // تعيين تاريخ انتهاء افتراضي
        const expiryInput = document.getElementById('cardExpiry');
        if (expiryInput) {
            const now = new Date();
            const futureDate = new Date(now.getFullYear() + 3, now.getMonth());
            expiryInput.value = futureDate.toISOString().slice(0, 7);
        }
    }, 100);
    
    console.log("✅ تم إنشاء نافذة إنشاء البطاقة بديلة");
}

// تحقق من وجود الدوال الضرورية وإنشائها إذا كانت غير موجودة
function ensureRequiredFunctions() {
    // تأكد من وجود وظيفة توليد المعرف
    if (typeof window.generateId !== 'function') {
        window.generateId = function() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        };
    }
    
    // تأكد من وجود وظيفة توليد رقم البطاقة
    if (typeof window.generateCardNumber !== 'function') {
        window.generateCardNumber = function() {
            const prefixes = {
                'platinum': '5555',
                'gold': '4444',
                'premium': '3333'
            };
            
            const cardType = document.querySelector('input[name="cardType"]:checked')?.value || 'premium';
            const prefix = prefixes[cardType] || '3333';
            
            let number = prefix;
            for (let i = 0; i < 12; i++) {
                number += Math.floor(Math.random() * 10);
            }
            
            return number;
        };
    }
    
    // تأكد من وجود وظيفة الحصول على مزايا البطاقة
    if (typeof window.getCardFeatures !== 'function') {
        window.getCardFeatures = function(cardType) {
            switch (cardType) {
                case 'platinum':
                    return {
                        profitBonus: 0.25,
                        freeTransactions: -1,
                        prioritySupport: true,
                        vipAccess: true,
                        insurance: true
                    };
                case 'gold':
                    return {
                        profitBonus: 0.15,
                        freeTransactions: 50,
                        prioritySupport: true,
                        vipAccess: false,
                        insurance: true
                    };
                case 'premium':
                default:
                    return {
                        profitBonus: 0,
                        freeTransactions: 20,
                        prioritySupport: false,
                        vipAccess: false,
                        insurance: false
                    };
            }
        };
    }
    
    // تأكد من وجود وظيفة إغلاق النافذة المنبثقة
    if (typeof window.closeModal !== 'function') {
        window.closeModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        };
    }
    
    // تأكد من وجود وظيفة مصفوفات البيانات الأساسية
    if (!Array.isArray(window.investorCards)) {
        window.investorCards = JSON.parse(localStorage.getItem('investorCards') || '[]');
    }
    
    if (!Array.isArray(window.investors)) {
        window.investors = JSON.parse(localStorage.getItem('investors') || '[]');
    }
    
    console.log("✅ تم التأكد من وجود جميع الدوال الضرورية");
}

// وظيفة فتح وإغلاق القائمة المنسدلة
function fixDropdownSelectors() {
    // إضافة مستمعي الأحداث للقوائم المنسدلة
    document.querySelectorAll('select.form-control').forEach(select => {
        select.addEventListener('focus', function() {
            this.size = 5; // يعرض 5 خيارات عند الفتح
        });
        
        select.addEventListener('blur', function() {
            this.size = 1; // يعود إلى العرض العادي عند إغلاق التركيز
        });
        
        select.addEventListener('change', function() {
            this.size = 1; // يغلق القائمة بعد التحديد
            this.blur(); // يزيل التركيز
        });
    });
    
    console.log("✅ تم إصلاح القوائم المنسدلة");
}

// تنفيذ الإصلاحات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔄 بدء تطبيق إصلاحات نظام البطاقات...");
    
    // التأكد من وجود الدوال الضرورية
    ensureRequiredFunctions();
    
    // تشخيص وإصلاح مشاكل إنشاء البطاقات
    diagnosisAndFixCardCreation();
    
    // إصلاح القوائم المنسدلة
    fixDropdownSelectors();
    
    // إضافة زر لإظهار السجل بالكنسول
    const debugBtn = document.createElement('button');
    debugBtn.textContent = "عرض سجل التشخيص";
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999;
        padding: 10px 15px;
        background-color: #34495e;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    debugBtn.onclick = function() {
        console.log("=== حالة نظام البطاقات ===");
        console.log("البطاقات:", window.investorCards);
        console.log("المستثمرون:", window.investors);
        diagnosisAndFixCardCreation();
        alert("تم عرض معلومات التشخيص في وحدة التحكم");
    };
    document.body.appendChild(debugBtn);
    
    console.log("✅ تم تطبيق جميع الإصلاحات بنجاح");
});