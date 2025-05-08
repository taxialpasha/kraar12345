// نظام بطاقة المستثمر الإلكترونية
// يتيح هذا النظام إنشاء وإدارة بطاقات ماستر افتراضية للمستثمرين
// تحتوي على جميع معلوماتهم ومعاملاتهم مع رمز QR للوصول السريع

// استيراد مكتبة QRCode.js (يجب إضافتها في ملف HTML)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>

// المتغيرات العامة
let investorCards = {}; // كائن لتخزين جميع البطاقات المنشأة
let cardSettings = {
    cardColor: "#3498db", // اللون الافتراضي للبطاقة
    logoUrl: "", // شعار الشركة
    validThrough: 24, // صلاحية البطاقة بالشهور
    enableQrCode: true, // تفعيل رمز QR
    enableRealTimeUpdates: true, // تفعيل التحديثات الفورية
    showBalance: true, // إظهار الرصيد
    showProfits: true, // إظهار الأرباح
    enableTransactionHistory: true, // تفعيل سجل المعاملات
    cardDesign: "standard", // تصميم البطاقة (standard, premium, gold)
    enableDatabaseSync: true // تفعيل المزامنة مع قاعدة البيانات
};

// تهيئة نظام البطاقات
function initInvestorCardSystem() {
    // تحميل إعدادات البطاقة من localStorage
    const savedSettings = localStorage.getItem('investorCardSettings');
    if (savedSettings) {
        cardSettings = { ...cardSettings, ...JSON.parse(savedSettings) };
    }
    
    // تحميل شعار الشركة من الإعدادات العامة
    cardSettings.logoUrl = settings.companyLogo || '';
    
    // إضافة زر إنشاء البطاقة في صفحة المستثمرين
    addCreateCardButton();
    
    // تحميل البطاقات المحفوظة
    loadInvestorCards();
    
    // تهيئة مزامنة قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        initDatabaseSync();
    }
    
    console.log("تم تهيئة نظام بطاقات المستثمرين");
}

// تهيئة مزامنة قاعدة البيانات
function initDatabaseSync() {
    // تهيئة Firebase إذا لم تكن مهيأة بالفعل
    if (window.firebaseApp && typeof window.firebaseApp.init === 'function') {
        window.firebaseApp.init();
    }
    
    // تسجيل مستمع للتغييرات في قاعدة البيانات
    if (window.firebaseApp && window.firebaseApp.database) {
        const db = window.firebaseApp.database();
        
        // مستمع للتغييرات في البطاقات
        db.ref('investorCards').on('value', snapshot => {
            const dbCards = snapshot.val() || {};
            
            // تحديث البطاقات المحلية بالتغييرات من قاعدة البيانات
            // نقوم بالدمج بحيث نحتفظ بالتغييرات المحلية التي لم يتم تحديثها في قاعدة البيانات
            mergeCardsFromDatabase(dbCards);
            
            // تحديث واجهة المستخدم
            updateInvestorCardsUI();
        });
    }
}

// دمج البطاقات من قاعدة البيانات مع البطاقات المحلية
function mergeCardsFromDatabase(dbCards) {
    // لكل بطاقة في قاعدة البيانات
    for (const cardId in dbCards) {
        const dbCard = dbCards[cardId];
        
        // إذا لم تكن البطاقة موجودة محلياً أو تم تحديثها في قاعدة البيانات، نقوم بتحديثها محلياً
        if (!investorCards[dbCard.investorId] || 
            new Date(dbCard.updatedAt) > new Date(investorCards[dbCard.investorId].updatedAt)) {
            investorCards[dbCard.investorId] = dbCard;
        }
    }
    
    // حفظ البطاقات المحدثة في التخزين المحلي
    localStorage.setItem('investorCards', JSON.stringify(investorCards));
}

// تحميل البطاقات المحفوظة
function loadInvestorCards() {
    const savedCards = localStorage.getItem('investorCards');
    if (savedCards) {
        investorCards = JSON.parse(savedCards);
    }
    
    // تسجيل الاستماع للتغييرات في Firebase إذا كانت المزامنة مفعلة
    if (syncActive && cardSettings.enableRealTimeUpdates) {
        setupFirebaseCardsSync();
    }
}

// حفظ البطاقات
function saveInvestorCards() {
    localStorage.setItem('investorCards', JSON.stringify(investorCards));
    
    // مزامنة مع Firebase إذا كانت المزامنة مفعلة
    if (syncActive && cardSettings.enableRealTimeUpdates) {
        syncCardsToFirebase();
    }
}

// إعداد مزامنة البطاقات مع Firebase
function setupFirebaseCardsSync() {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        console.warn("Firebase غير متاح للمزامنة");
        return;
    }
    
    // الاستماع للتغييرات في بطاقات المستثمرين
    window.firebaseApp.database().ref('investorCards').on('value', (snapshot) => {
        const firebaseCards = snapshot.val() || {};
        
        // دمج البطاقات الجديدة مع البطاقات المحلية
        for (const cardId in firebaseCards) {
            if (!investorCards[cardId] || firebaseCards[cardId].updatedAt > investorCards[cardId].updatedAt) {
                investorCards[cardId] = firebaseCards[cardId];
            }
        }
        
        // حفظ البطاقات محلياً
        localStorage.setItem('investorCards', JSON.stringify(investorCards));
        
        // تحديث واجهة المستخدم
        updateInvestorCardsUI();
    });
}

// مزامنة البطاقات مع Firebase
function syncCardsToFirebase() {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        console.warn("Firebase غير متاح للمزامنة");
        return;
    }

    // تحديث البطاقات في Firebase
    window.firebaseApp.database().ref('investorCards').set(investorCards, (error) => {
        if (error) {
            console.error("حدث خطأ أثناء مزامنة البطاقات مع Firebase:", error);
        } else {
            console.log("تمت مزامنة البطاقات مع Firebase بنجاح");
        }
    });
}

// حفظ بطاقة جديدة في قاعدة البيانات
function saveCardToDatabase(card) {
    if (!cardSettings.enableDatabaseSync) {
        return Promise.resolve(card);
    }
    
    return new Promise((resolve, reject) => {
        if (!window.firebaseApp || !window.firebaseApp.database) {
            console.warn("Firebase غير متاح لحفظ البيانات");
            return resolve(card);
        }
    
        const cardRef = window.firebaseApp.database().ref(`investorCards/${card.id}`);
        
        // إضافة معلومات المستثمر الأساسية
        const investor = investors.find(inv => inv.id === card.investorId);
        if (investor) {
            card.investorName = investor.name;
            card.investorPhone = investor.phone;
            card.investorEmail = investor.email || '';
        }
        
        // إضافة إجمالي الاستثمار والأرباح للبطاقة
        const investorData = getInvestorData(card.investorId);
        if (investorData) {
            card.totalInvestment = investorData.totalInvestment;
            card.totalProfit = investorData.totalProfit;
            card.paidProfit = investorData.paidProfit;
            card.dueProfit = investorData.dueProfit;
        }
        
        // إضافة تاريخ آخر تحديث
        card.updatedAt = new Date().toISOString();
        
        // حفظ البطاقة في قاعدة البيانات
        cardRef.set(card, (error) => {
            if (error) {
                console.error("حدث خطأ أثناء حفظ البطاقة في قاعدة البيانات:", error);
                reject(error);
            } else {
                console.log(`تم حفظ البطاقة ${card.id} في قاعدة البيانات بنجاح`);
                resolve(card);
            }
        });
    });
}

// تحديث بطاقة في قاعدة البيانات
function updateCardInDatabase(card) {
    if (!cardSettings.enableDatabaseSync) {
        return Promise.resolve(card);
    }
    
    // تحديث تاريخ التحديث
    card.updatedAt = new Date().toISOString();
    
    // تحديث بيانات المستثمر والاستثمار
    return saveCardToDatabase(card);
}

// حذف بطاقة من قاعدة البيانات
function deleteCardFromDatabase(cardId) {
    if (!cardSettings.enableDatabaseSync) {
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        if (!window.firebaseApp || !window.firebaseApp.database) {
            console.warn("Firebase غير متاح لحذف البيانات");
            return resolve();
        }
    
        const cardRef = window.firebaseApp.database().ref(`investorCards/${cardId}`);
        cardRef.remove((error) => {
            if (error) {
                console.error("حدث خطأ أثناء حذف البطاقة من قاعدة البيانات:", error);
                reject(error);
            } else {
                console.log(`تم حذف البطاقة ${cardId} من قاعدة البيانات بنجاح`);
                resolve();
            }
        });
    });
}

// استرجاع بيانات البطاقة من قاعدة البيانات باستخدام الباركود
function fetchCardByBarcode(barcodeData, callback) {
    // يمكن أن يكون الباركود هو معرف المستثمر مباشرة أو معرف البطاقة أو بيانات JSON
    let cardId = barcodeData;
    
    try {
        // محاولة تحليل البيانات كـ JSON
        const parsedData = JSON.parse(barcodeData);
        if (parsedData.investorId) {
            cardId = parsedData.investorId;
        } else if (parsedData.cardId) {
            cardId = parsedData.cardId;
        }
    } catch (e) {
        // ليست بيانات JSON صالحة، استخدم البيانات الأصلية
    }
    
    // البحث عن البطاقة في الذاكرة المحلية أولاً
    if (investorCards[cardId]) {
        return callback(investorCards[cardId]);
    }
    
    // إذا لم تكن موجودة محلياً، ابحث في قاعدة البيانات
    fetchCardFromDatabase(cardId, callback);
}

// استرجاع بيانات البطاقة من قاعدة البيانات باستخدام المعرف
function fetchCardFromDatabase(cardId, callback) {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        console.warn("Firebase غير متاح لاسترجاع البيانات");
        return callback(null);
    }

    let cardRef = window.firebaseApp.database().ref(`investorCards/${cardId}`);
    cardRef.once('value', (snapshot) => {
        const cardData = snapshot.val();
        if (cardData) {
            // حفظ البطاقة محلياً للاستخدام المستقبلي
            investorCards[cardData.investorId] = cardData;
            localStorage.setItem('investorCards', JSON.stringify(investorCards));
            
            callback(cardData);
        } else {
            // إذا لم نجد البطاقة بالمعرف المباشر، نبحث باستخدام معرف المستثمر
            cardRef = window.firebaseApp.database().ref('investorCards');
            cardRef.orderByChild('investorId').equalTo(cardId).once('value', (snapshot) => {
                const cards = snapshot.val();
                if (cards) {
                    // الحصول على أول بطاقة
                    const cardKey = Object.keys(cards)[0];
                    const cardData = cards[cardKey];
                    
                    // حفظ البطاقة محلياً
                    investorCards[cardData.investorId] = cardData;
                    localStorage.setItem('investorCards', JSON.stringify(investorCards));
                    
                    callback(cardData);
                } else {
                    console.warn("لم يتم العثور على بيانات البطاقة");
                    callback(null);
                }
            });
        }
    });
}

// تحديث معلومات الحساب والتعاملات في البطاقة
function updateCardAccountInfo(investorId) {
    const card = investorCards[investorId];
    if (!card) return null;
    
    // الحصول على بيانات المستثمر
    const investorData = getInvestorData(investorId);
    if (!investorData) return card;
    
    // تحديث المعلومات المالية
    card.totalInvestment = investorData.totalInvestment;
    card.totalProfit = investorData.totalProfit;
    card.paidProfit = investorData.paidProfit;
    card.dueProfit = investorData.dueProfit;
    
    // الحصول على آخر 5 عمليات
    const investorOperations = operations
        .filter(op => op.investorId === investorId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    // تحويل العمليات إلى تنسيق أبسط للتخزين
    card.recentOperations = investorOperations.map(op => ({
        id: op.id,
        type: op.type,
        amount: op.amount,
        date: op.date,
        status: op.status,
        notes: op.notes || ''
    }));
    
    // تحديث تاريخ التحديث
    card.updatedAt = new Date().toISOString();
    
    // حفظ البطاقة المحدثة
    investorCards[investorId] = card;
    saveInvestorCards();
    
    // تحديث البطاقة في قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        updateCardInDatabase(card);
    }
    
    return card;
}

// إضافة زر إنشاء البطاقة في صفحة المستثمرين
function addCreateCardButton() {
    // التحقق من وجود صفحة المستثمرين
    const investorsPage = document.getElementById('investors');
    if (!investorsPage) return;
    
    // التحقق من وجود زر الإجراءات
    const actionButtons = investorsPage.querySelector('.header-actions');
    if (!actionButtons) return;
    
    // إنشاء زر البطاقة
    const cardButton = document.createElement('button');
    cardButton.className = 'btn btn-info';
    cardButton.innerHTML = '<i class="fas fa-id-card"></i> بطاقات المستثمرين';
    cardButton.onclick = showInvestorCardsManager;
    
    // إضافة الزر قبل زر الإشعارات
    const notificationBtn = actionButtons.querySelector('.notification-btn');
    if (notificationBtn) {
        actionButtons.insertBefore(cardButton, notificationBtn);
    } else {
        actionButtons.appendChild(cardButton);
    }
    
    // إضافة زر البطاقة في نافذة عرض تفاصيل المستثمر
    document.addEventListener('click', function(e) {
        if (e.target && e.target.matches('.menu-item, .btn')) {
            setTimeout(addCardButtonToInvestorModal, 500);
        }
    });
}

// إضافة زر البطاقة في نافذة تفاصيل المستثمر
function addCardButtonToInvestorModal() {
    const viewInvestorModal = document.getElementById('viewInvestorModal');
    if (!viewInvestorModal) return;
    
    const modalFooter = viewInvestorModal.querySelector('.modal-footer');
    if (!modalFooter) return;
    
    // التحقق من وجود الزر مسبقاً
    if (modalFooter.querySelector('.btn-card')) return;
    
    // إنشاء زر البطاقة
    const cardButton = document.createElement('button');
    cardButton.className = 'btn btn-info btn-card';
    cardButton.innerHTML = '<i class="fas fa-id-card"></i> البطاقة الإلكترونية';
    cardButton.onclick = function() {
        const investorId = currentInvestorId;
        if (investorId) {
            openInvestorCard(investorId);
        }
    };
    
    // إضافة الزر
    modalFooter.insertBefore(cardButton, modalFooter.firstChild);
}

// عرض مدير بطاقات المستثمرين
function showInvestorCardsManager() {
    // إنشاء نافذة مدير البطاقات
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'investorCardsManagerModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">إدارة بطاقات المستثمرين</h2>
                <div class="modal-close" onclick="document.getElementById('investorCardsManagerModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-tabs">
                    <div class="modal-tab active" onclick="switchModalTab('cardsMain', 'investorCardsManagerModal')">البطاقات</div>
                    <div class="modal-tab" onclick="switchModalTab('cardsSettings', 'investorCardsManagerModal')">الإعدادات</div>
                    <div class="modal-tab" onclick="switchModalTab('cardsDatabase', 'investorCardsManagerModal')">قاعدة البيانات</div>
                </div>
                
                <div class="modal-tab-content active" id="cardsMain">
                    <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                        <div class="form-row">
                            <div class="form-group">
                                <button class="btn btn-primary" onclick="createCardsForAllInvestors()">
                                    <i class="fas fa-users"></i> إنشاء بطاقات لجميع المستثمرين
                                </button>
                            </div>
                            <div class="form-group">
                                <button class="btn btn-info" onclick="syncInvestorCardsWithFirebase()">
                                    <i class="fas fa-sync"></i> مزامنة البطاقات مع Firebase
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container" style="box-shadow: none; padding: 0;">
                        <div class="table-header">
                            <div class="table-title">بطاقات المستثمرين</div>
                            <div class="table-actions">
                                <button class="btn btn-light" onclick="printAllCards()">
                                    <i class="fas fa-print"></i> طباعة الكل
                                </button>
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>المستثمر</th>
                                    <th>رقم البطاقة</th>
                                    <th>تاريخ الإنشاء</th>
                                    <th>تاريخ الانتهاء</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="investorCardsTableBody">
                                <!-- سيتم تعبئته بواسطة JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="modal-tab-content" id="cardsSettings">
                    <div class="form-container" style="box-shadow: none; padding: 0;">
                        <form id="cardSettingsForm" onsubmit="saveCardSettings(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">لون البطاقة</label>
                                    <input type="color" class="form-control" id="cardColor" value="${cardSettings.cardColor}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">تصميم البطاقة</label>
                                    <select class="form-select" id="cardDesign">
                                        <option value="standard" ${cardSettings.cardDesign === 'standard' ? 'selected' : ''}>قياسي</option>
                                        <option value="premium" ${cardSettings.cardDesign === 'premium' ? 'selected' : ''}>متميز</option>
                                        <option value="gold" ${cardSettings.cardDesign === 'gold' ? 'selected' : ''}>ذهبي</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">صلاحية البطاقة (بالشهور)</label>
                                    <input type="number" class="form-control" id="validThrough" min="1" max="120" value="${cardSettings.validThrough}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">شعار الشركة</label>
                                    <input type="file" class="form-control" id="logoUpload" accept="image/*">
                                </div>
                            </div>
                            <div class="form-group">
                                <h3 class="form-subtitle">ميزات البطاقة</h3>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableQrCode" ${cardSettings.enableQrCode ? 'checked' : ''}>
                                    <label class="form-check-label" for="enableQrCode">تفعيل رمز QR</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableRealTimeUpdates" ${cardSettings.enableRealTimeUpdates ? 'checked' : ''}>
                                    <label class="form-check-label" for="enableRealTimeUpdates">تفعيل التحديثات الفورية</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="showBalance" ${cardSettings.showBalance ? 'checked' : ''}>
                                    <label class="form-check-label" for="showBalance">إظهار الرصيد</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="showProfits" ${cardSettings.showProfits ? 'checked' : ''}>
                                    <label class="form-check-label" for="showProfits">إظهار الأرباح</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableTransactionHistory" ${cardSettings.enableTransactionHistory ? 'checked' : ''}>
                                    <label class="form-check-label" for="enableTransactionHistory">تفعيل سجل المعاملات</label>
                                </div>
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="enableDatabaseSync" ${cardSettings.enableDatabaseSync ? 'checked' : ''}>
                                    <label class="form-check-label" for="enableDatabaseSync">تفعيل المزامنة مع قاعدة البيانات</label>
                                </div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> حفظ الإعدادات
                                </button>
                                <button type="button" class="btn btn-light" onclick="resetCardSettings()">
                                    <i class="fas fa-redo"></i> إعادة تعيين
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="modal-tab-content" id="cardsDatabase">
                    <div class="form-container" style="box-shadow: none; padding: 0;">
                        <div class="form-group">
                            <h3 class="form-subtitle">مزامنة قاعدة البيانات</h3>
                            <p>يمكنك مزامنة بطاقات المستثمرين مع قاعدة البيانات للوصول إليها من أي مكان عبر التطبيق.</p>
                        </div>
                        
                        <div class="form-group">
                            <button class="btn btn-primary" onclick="updateAllCardsInDatabase()">
                                <i class="fas fa-sync"></i> تحديث جميع البطاقات في قاعدة البيانات
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <button class="btn btn-info" onclick="refreshCardsFromDatabase()">
                                <i class="fas fa-cloud-download-alt"></i> تحديث البطاقات من قاعدة البيانات
                            </button>
                        </div>
                        
                        <div class="form-group">
                            <h3 class="form-subtitle">الوصول للبطاقات</h3>
                            <p>يمكن للمستثمرين الوصول إلى بياناتهم عبر التطبيق باستخدام رمز QR أو رقم البطاقة.</p>
                        </div>
                        
                        <div class="form-group">
                            <div class="alert alert-info">
                                <div class="alert-icon">
                                    <i class="fas fa-info-circle"></i>
                                </div>
                                <div class="alert-content">
                                    <div class="alert-title">معلومات المزامنة</div>
                                    <div class="alert-text">
                                        حالة المزامنة: <span id="syncStatus" class="status ${cardSettings.enableDatabaseSync ? 'active' : 'pending'}">${cardSettings.enableDatabaseSync ? 'مفعلة' : 'غير مفعلة'}</span><br>
                                        آخر مزامنة: <span id="lastSyncTime">${formatDate(new Date().toISOString())}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('investorCardsManagerModal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // تحديث جدول البطاقات
    updateInvestorCardsTable();
}

// تحديث جميع البطاقات في قاعدة البيانات
function updateAllCardsInDatabase() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    const cardsArray = Object.values(investorCards);
    if (cardsArray.length === 0) {
        createNotification('تنبيه', 'لا توجد بطاقات للتحديث', 'warning');
        return;
    }
    
    // تحديث جميع البطاقات
    let updatedCount = 0;
    let promises = [];
    
    cardsArray.forEach(card => {
        // تحديث معلومات الحساب والتعاملات
        updateCardAccountInfo(card.investorId);
        
        // تحديث البطاقة في قاعدة البيانات
        promises.push(
            updateCardInDatabase(card)
                .then(() => {
                    updatedCount++;
                })
                .catch(error => {
                    console.error(`فشل تحديث البطاقة ${card.id}:`, error);
                })
        );
    });
    
    Promise.all(promises)
        .then(() => {
            createNotification('نجاح', `تم تحديث ${updatedCount} بطاقة في قاعدة البيانات`, 'success');
        })
        .catch(error => {
            console.error('حدث خطأ أثناء تحديث البطاقات:', error);
            createNotification('خطأ', 'حدث خطأ أثناء تحديث البطاقات', 'danger');
        });
}

// تحديث البطاقات من قاعدة البيانات
function refreshCardsFromDatabase() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    if (!window.firebaseApp || !window.firebaseApp.database) {
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    const db = window.firebaseApp.database();
    db.ref('investorCards').once('value')
        .then(snapshot => {
            const dbCards = snapshot.val() || {};
            
            // تحديث البطاقات المحلية بالبيانات من قاعدة البيانات
            mergeCardsFromDatabase(dbCards);
            
            // تحديث واجهة المستخدم
            updateInvestorCardsTable();
            
            createNotification('نجاح', 'تم تحديث البطاقات من قاعدة البيانات بنجاح', 'success');
        })
        .catch(error => {
            console.error('حدث خطأ أثناء تحديث البطاقات من قاعدة البيانات:', error);
            createNotification('خطأ', 'حدث خطأ أثناء تحديث البطاقات', 'danger');
        });
}

// تحديث جدول بطاقات المستثمرين
function updateInvestorCardsTable() {
    const tbody = document.getElementById('investorCardsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // تحويل كائن البطاقات إلى مصفوفة
    const cardsArray = Object.values(investorCards);
    
    if (cardsArray.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" style="text-align: center;">لا توجد بطاقات مستثمرين</td>`;
        tbody.appendChild(row);
        return;
    }
    
    // ترتيب البطاقات حسب تاريخ الإنشاء (الأحدث أولاً)
    cardsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    cardsArray.forEach((card, index) => {
        const investor = investors.find(inv => inv.id === card.investorId);
        if (!investor) return;
        
        const now = new Date();
        const expiryDate = new Date(card.expiryDate);
        const isExpired = expiryDate < now;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${investor.name}</td>
            <td>${card.cardNumber}</td>
            <td>${formatDate(card.createdAt)}</td>
            <td>${formatDate(card.expiryDate)}</td>
            <td><span class="status ${isExpired ? 'closed' : 'active'}">${isExpired ? 'منتهية' : 'فعالة'}</span></td>
            <td>
                <button class="btn btn-info btn-icon action-btn" onclick="openInvestorCard('${card.investorId}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-success btn-icon action-btn" onclick="printInvestorCard('${card.investorId}')">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-warning btn-icon action-btn" onclick="renewInvestorCard('${card.investorId}')">
                    <i class="fas fa-sync"></i>
                </button>
                <button class="btn btn-danger btn-icon action-btn" onclick="deleteInvestorCard('${card.investorId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// حفظ إعدادات البطاقة
function saveCardSettings(event) {
    event.preventDefault();
    
    // الحصول على قيم النموذج
    cardSettings.cardColor = document.getElementById('cardColor').value;
    cardSettings.cardDesign = document.getElementById('cardDesign').value;
    cardSettings.validThrough = parseInt(document.getElementById('validThrough').value);
    cardSettings.enableQrCode = document.getElementById('enableQrCode').checked;
    cardSettings.enableRealTimeUpdates = document.getElementById('enableRealTimeUpdates').checked;
    cardSettings.showBalance = document.getElementById('showBalance').checked;
    cardSettings.showProfits = document.getElementById('showProfits').checked;
    cardSettings.enableTransactionHistory = document.getElementById('enableTransactionHistory').checked;
    cardSettings.enableDatabaseSync = document.getElementById('enableDatabaseSync').checked;
    
    // التعامل مع تحميل الشعار
    const logoUpload = document.getElementById('logoUpload');
    if (logoUpload.files.length > 0) {
        const file = logoUpload.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            cardSettings.logoUrl = e.target.result;
            saveCardSettingsToStorage();
        };
        
        reader.readAsDataURL(file);
    } else {
        saveCardSettingsToStorage();
    }
}

// حفظ إعدادات البطاقة في التخزين المحلي
function saveCardSettingsToStorage() {
    localStorage.setItem('investorCardSettings', JSON.stringify(cardSettings));
    
    // إذا تم تغيير حالة مزامنة قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        // تهيئة مزامنة قاعدة البيانات
        initDatabaseSync();
    }
    
    // تحديث جميع البطاقات بالإعدادات الجديدة
    updateAllCards();
    
    // عرض إشعار نجاح
    createNotification('نجاح', 'تم حفظ إعدادات البطاقة بنجاح', 'success');
    
    // التبديل إلى علامة تبويب البطاقات
    switchModalTab('cardsMain', 'investorCardsManagerModal');
}

// إعادة تعيين إعدادات البطاقة
function resetCardSettings() {
    // إعادة تعيين إلى القيم الافتراضية
    cardSettings = {
        cardColor: "#3498db",
        logoUrl: "",
        validThrough: 24,
        enableQrCode: true,
        enableRealTimeUpdates: true,
        showBalance: true,
        showProfits: true,
        enableTransactionHistory: true,
        cardDesign: "standard",
        enableDatabaseSync: true
    };
    
    // تحميل شعار الشركة من الإعدادات العامة
    cardSettings.logoUrl = settings.companyLogo || '';
    
    // حفظ في التخزين المحلي
    localStorage.setItem('investorCardSettings', JSON.stringify(cardSettings));
    
    // تحديث النموذج
    document.getElementById('cardColor').value = cardSettings.cardColor;
    document.getElementById('cardDesign').value = cardSettings.cardDesign;
    document.getElementById('validThrough').value = cardSettings.validThrough;
    document.getElementById('enableQrCode').checked = cardSettings.enableQrCode;
    document.getElementById('enableRealTimeUpdates').checked = cardSettings.enableRealTimeUpdates;
    document.getElementById('showBalance').checked = cardSettings.showBalance;
    document.getElementById('showProfits').checked = cardSettings.showProfits;
    document.getElementById('enableTransactionHistory').checked = cardSettings.enableTransactionHistory;
    document.getElementById('enableDatabaseSync').checked = cardSettings.enableDatabaseSync;
    
    // عرض إشعار
    createNotification('نجاح', 'تم إعادة تعيين إعدادات البطاقة', 'success');
}

// إنشاء بطاقة لمستثمر
function createInvestorCard(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return null;
    }
    
    // التحقق مما إذا كانت البطاقة موجودة بالفعل
    if (investorCards[investorId]) {
        return investorCards[investorId];
    }
    
    // إنشاء رقم بطاقة فريد (محاكاة لنظام ماستر كارد)
    const cardNumber = generateCardNumber();
    
    // إنشاء تاريخ انتهاء الصلاحية
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + cardSettings.validThrough);
    
    // إنشاء CVV
    const cvv = generateCVV();
    
    // إنشاء بيانات البطاقة
    const card = {
        id: generateId(),
        investorId,
        investorName: investor.name,
        investorPhone: investor.phone,
        investorEmail: investor.email || '',
        cardNumber,
        expiryDate: expiryDate.toISOString(),
        cvv,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        design: cardSettings.cardDesign,
        status: 'active'
    };
    
    // إضافة بيانات المستثمر والاستثمار
    const investorData = getInvestorData(investorId);
    if (investorData) {
        card.totalInvestment = investorData.totalInvestment;
        card.totalProfit = investorData.totalProfit;
        card.paidProfit = investorData.paidProfit;
        card.dueProfit = investorData.dueProfit;
    }
    
    // الحصول على آخر 5 عمليات
    const investorOperations = operations
        .filter(op => op.investorId === investorId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    // تحويل العمليات إلى تنسيق أبسط للتخزين
    card.recentOperations = investorOperations.map(op => ({
        id: op.id,
        type: op.type,
        amount: op.amount,
        date: op.date,
        status: op.status,
        notes: op.notes || ''
    }));
    
    // تخزين البطاقة
    investorCards[investorId] = card;
    
    // حفظ البطاقات
    saveInvestorCards();
    
    // حفظ البطاقة في قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        saveCardToDatabase(card)
            .then(savedCard => {
                if (savedCard) {
                    console.log(`تم حفظ البطاقة ${savedCard.id} في قاعدة البيانات`);
                }
            })
            .catch(error => {
                console.error('حدث خطأ أثناء حفظ البطاقة في قاعدة البيانات:', error);
            });
    }
    
    // إنشاء نشاط
    createInvestorActivity(investorId, 'card', `تم إنشاء بطاقة إلكترونية للمستثمر`);
    
    // عرض إشعار
    createNotification('نجاح', `تم إنشاء بطاقة للمستثمر ${investor.name} بنجاح`, 'success', card.id, 'card');
    
    return card;
}

// إنشاء بطاقات لجميع المستثمرين
function createCardsForAllInvestors() {
    if (investors.length === 0) {
        createNotification('تنبيه', 'لا يوجد مستثمرين لإنشاء بطاقات لهم', 'warning');
        return;
    }
    
    let createdCount = 0;
    let existingCount = 0;
    
    // إنشاء بطاقة لكل مستثمر
    investors.forEach(investor => {
        if (investorCards[investor.id]) {
            existingCount++;
        } else {
            createInvestorCard(investor.id);
            createdCount++;
        }
    });
    
    // تحديث جدول البطاقات
    updateInvestorCardsTable();
    
    // عرض إشعار
    if (createdCount > 0) {
        createNotification('نجاح', `تم إنشاء ${createdCount} بطاقة جديدة ${existingCount > 0 ? `(${existingCount} بطاقة موجودة مسبقاً)` : ''}`, 'success');
    } else {
        createNotification('معلومات', `جميع المستثمرين (${existingCount}) لديهم بطاقات بالفعل`, 'info');
    }
}

// فتح بطاقة المستثمر
function openInvestorCard(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // الحصول على بطاقة المستثمر أو إنشاء واحدة جديدة
    let card = investorCards[investorId];
    if (!card) {
        card = createInvestorCard(investorId);
        if (!card) return;
    }
    
    // تحديث معلومات البطاقة
    updateCardAccountInfo(investorId);
    
    // الحصول على بيانات المستثمر
    const investorData = getInvestorData(investorId);
    
    // إنشاء نافذة البطاقة
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'investorCardModal';
    
    // تحديد لون النص بناءً على تصميم البطاقة
    const textColor = card.design === 'gold' ? '#000' : '#fff';
    
    // تحديد خلفية البطاقة بناءً على التصميم
    let cardBackground;
    let cardClass;
    
    switch (card.design) {
        case 'premium':
            cardBackground = `linear-gradient(135deg, #614385 0%, #516395 100%)`;
            cardClass = 'premium-card';
            break;
        case 'gold':
            cardBackground = `linear-gradient(135deg, #FFD700 0%, #FFC107 100%)`;
            cardClass = 'gold-card';
            break;
        default:
            cardBackground = `linear-gradient(135deg, ${cardSettings.cardColor} 0%, ${adjustColor(cardSettings.cardColor, -30)} 100%)`;
            cardClass = 'standard-card';
    }
    
    // إنشاء URI لرمز QR
    const qrDataUri = generateQRCodeDataUri(investorId);
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">بطاقة المستثمر</h2>
                <div class="modal-close" onclick="document.getElementById('investorCardModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <!-- بطاقة المستثمر الأمامية -->
                <div class="investor-card ${cardClass}" style="background: ${cardBackground}; color: ${textColor}; width: 100%; max-width: 450px; height: 250px; border-radius: 12px; padding: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); margin: 0 auto 20px; position: relative; overflow: hidden;">
                    <div class="card-chip" style="width: 40px; height: 30px; background: #bdbdbd; border-radius: 5px; margin-bottom: 20px; position: relative; overflow: hidden;">
                        <div style="width: 80%; height: 50%; background: #a5a5a5; margin: 5px auto;"></div>
                    </div>
                    
                    <div class="card-number" style="font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 15px; font-weight: bold;">
                        ${formatCardNumber(card.cardNumber)}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">حامل البطاقة</div>
                            <div style="font-weight: bold;">${investor.name}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; opacity: 0.9;">تنتهي في</div>
                            <div style="font-weight: bold;">${formatExpiryDate(card.expiryDate)}</div>
                        </div>
                    </div>
                    
                    ${cardSettings.enableQrCode ? `
                        <div class="card-qr" style="position: absolute; bottom: 15px; right: 15px; width: 60px; height: 60px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                            <img src="${qrDataUri}" style="width: 55px; height: 55px;">
                        </div>
                    ` : ''}
                    
                    <div class="card-logo" style="position: absolute; top: 15px; right: 15px; font-size: 1.5rem; font-weight: bold;">
                        ${cardSettings.logoUrl ? `<img src="${cardSettings.logoUrl}" style="max-height: 40px;">` : settings.companyName || 'استثمار'}
                    </div>
                    
                    <div class="card-type" style="position: absolute; bottom: 15px; left: 15px; font-size: 1.2rem; font-weight: bold; font-style: italic;">
                        ${card.design === 'gold' ? 'GOLD' : card.design === 'premium' ? 'PREMIUM' : 'STANDARD'}
                    </div>
                </div>
                
                <div class="tabs">
                    <div class="tab active" onclick="switchCardTab('cardInfo')">معلومات البطاقة</div>
                    <div class="tab" onclick="switchCardTab('balanceInfo')">الرصيد والأرباح</div>
                    <div class="tab" onclick="switchCardTab('transactionHistory')">سجل المعاملات</div>
                    <div class="tab" onclick="switchCardTab('mobileAccess')">الوصول عبر التطبيق</div>
                </div>
                
                <div class="card-tab-content active" id="cardInfo">
                    <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">رقم البطاقة</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" value="${formatCardNumber(card.cardNumber)}" readonly>
                                    <button class="btn btn-light" onclick="copyToClipboard('${card.cardNumber}')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">تاريخ الانتهاء</label>
                                <input type="text" class="form-control" value="${formatExpiryDate(card.expiryDate)}" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">رمز CVV</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="cvvField" value="${card.cvv}" readonly>
                                    <button class="btn btn-light" onclick="toggleCVVVisibility()">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">حالة البطاقة</label>
                                <input type="text" class="form-control" value="${new Date(card.expiryDate) > new Date() ? 'فعالة' : 'منتهية'}" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">تاريخ الإنشاء</label>
                                <input type="text" class="form-control" value="${formatDate(card.createdAt)}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">آخر تحديث</label>
                                <input type="text" class="form-control" value="${formatDate(card.updatedAt)}" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="alert alert-info">
                            <div class="alert-icon">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <div class="alert-content">
                                <div class="alert-title">معلومات البطاقة</div>
                                <div class="alert-text">
                                    هذه بطاقة افتراضية تحتوي على معلومات المستثمر واستثماراته. يمكن للمستثمر استخدامها للوصول إلى بياناته عبر تطبيق الجوال.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card-tab-content" id="balanceInfo">
                    <div class="dashboard-cards">
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">إجمالي الاستثمارات</div>
                                    <div class="card-value">${formatCurrency(investorData.totalInvestment)}</div>
                                </div>
                                <div class="card-icon primary">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">إجمالي الأرباح</div>
                                    <div class="card-value">${formatCurrency(investorData.totalProfit.toFixed(2))}</div>
                                </div>
                                <div class="card-icon success">
                                    <i class="fas fa-hand-holding-usd"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">الأرباح المستحقة</div>
                                    <div class="card-value">${formatCurrency(investorData.dueProfit.toFixed(2))}</div>
                                </div>
                                <div class="card-icon warning">
                                    <i class="fas fa-clock"></i>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">الأرباح المدفوعة</div>
                                    <div class="card-value">${formatCurrency(investorData.paidProfit.toFixed(2))}</div>
                                </div>
                                <div class="card-icon info">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card-tab-content" id="transactionHistory">
                    <div class="table-container" style="box-shadow: none; padding: 0;">
                        <div class="table-header">
                            <div class="table-title">سجل المعاملات</div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>العملية</th>
                                    <th>المبلغ</th>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                    <th>ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody id="investorTransactionsBody">
                                ${getInvestorTransactionsHTML(investorId)}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="card-tab-content" id="mobileAccess">
                    <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                        <div class="form-group" style="text-align: center;">
                            <h3 class="form-subtitle">الوصول عبر تطبيق الجوال</h3>
                            <p>يمكن للمستثمر الوصول إلى بياناته عبر تطبيق الجوال باستخدام الطرق التالية:</p>
                        </div>
                        
                        <div class="form-group" style="text-align: center;">
                            <h4>مسح رمز QR</h4>
                            <div style="margin: 20px auto; width: 200px; height: 200px; background: white; padding: 10px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <img src="${qrDataUri}" style="width: 100%; height: 100%;">
                            </div>
                            <p>يمكن للمستثمر مسح رمز QR باستخدام تطبيق الجوال للوصول إلى بياناته بسهولة.</p>
                        </div>
                        
                        <div class="form-group">
                            <h4>إدخال بيانات البطاقة</h4>
                            <p>يمكن للمستثمر إدخال بيانات البطاقة التالية في التطبيق:</p>
                            <ul style="list-style-type: none; padding: 0;">
                                <li><strong>رقم البطاقة:</strong> ${formatCardNumber(card.cardNumber)}</li>
                                <li><strong>تاريخ الانتهاء:</strong> ${formatExpiryDate(card.expiryDate)}</li>
                                <li><strong>رمز CVV:</strong> ${card.cvv}</li>
                            </ul>
                        </div>
                        
                        <div class="form-group">
                            <div class="alert alert-warning">
                                <div class="alert-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="alert-content">
                                    <div class="alert-title">تنبيه أمني</div>
                                    <div class="alert-text">
                                        يرجى التأكيد على المستثمر بعدم مشاركة بيانات البطاقة مع أي شخص آخر للحفاظ على أمان بياناته.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group" style="text-align: center;">
                            <button class="btn btn-primary" onclick="printInvestorCardAccessInfo('${investorId}')">
                                <i class="fas fa-print"></i> طباعة معلومات الوصول
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('investorCardModal').remove()">إغلاق</button>
                <button class="btn btn-success" onclick="printInvestorCard('${investorId}')">
                    <i class="fas fa-print"></i> طباعة البطاقة
                </button>
                <button class="btn btn-primary" onclick="shareInvestorCard('${investorId}')">
                    <i class="fas fa-share-alt"></i> مشاركة
                </button>
                <button class="btn btn-warning" onclick="updateCardDetails('${investorId}')">
                    <i class="fas fa-sync"></i> تحديث البيانات
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إضافة أنماط CSS للبطاقة
    addCardStyles();
    
    // إطلاق حدث فتح البطاقة
    document.dispatchEvent(new CustomEvent('cardOpened', { detail: { investorId } }));
}

// تحديث بيانات البطاقة
function updateCardDetails(investorId) {
    // تحديث معلومات البطاقة
    updateCardAccountInfo(investorId);
    
    // تحديث واجهة المستخدم
    const cardModal = document.getElementById('investorCardModal');
    if (cardModal) {
        // إغلاق النافذة الحالية
        document.body.removeChild(cardModal);
        
        // إعادة فتح البطاقة بالبيانات المحدثة
        openInvestorCard(investorId);
    }
    
    // عرض إشعار
    createNotification('نجاح', 'تم تحديث بيانات البطاقة بنجاح', 'success');
}

// طباعة معلومات الوصول للبطاقة
function printInvestorCardAccessInfo(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // إنشاء URI لرمز QR
    const qrDataUri = generateQRCodeDataUri(investorId);
    
    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>معلومات الوصول لبطاقة المستثمر - ${investor.name}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    background: #f4f6f9;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    margin-bottom: 5px;
                }
                
                .header p {
                    color: #666;
                }
                
                .qr-container {
                    margin: 20px auto;
                    width: 200px;
                    height: 200px;
                    background: white;
                    padding: 10px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .card-details {
                    margin: 20px auto;
                    max-width: 500px;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .card-details h2 {
                    margin-top: 0;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                }
                
                .card-details .detail {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .card-details .detail .label {
                    font-weight: bold;
                }
                
                .warning {
                    margin: 20px auto;
                    max-width: 500px;
                    background: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .warning h2 {
                    margin-top: 0;
                    color: #856404;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    background: #3498db;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                }
                
                @media print {
                    body {
                        background: white;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .qr-container, .card-details, .warning {
                        box-shadow: none;
                        border: 1px solid #ddd;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>معلومات الوصول لبطاقة المستثمر</h1>
                <p>${investor.name}</p>
            </div>
            
            <div style="text-align: center;">
                <h2>مسح رمز QR</h2>
                <p>يمكنك مسح رمز QR أدناه باستخدام تطبيق الجوال للوصول إلى بياناتك بسهولة.</p>
                
                <div class="qr-container">
                    <img src="${qrDataUri}" style="width: 100%; height: 100%;">
                </div>
            </div>
            
            <div class="card-details">
                <h2>بيانات البطاقة</h2>
                <p>يمكنك إدخال بيانات البطاقة التالية في التطبيق للوصول إلى حسابك:</p>
                
                <div class="detail">
                    <div class="label">رقم البطاقة</div>
                    <div class="value">${formatCardNumber(card.cardNumber)}</div>
                </div>
                
                <div class="detail">
                    <div class="label">تاريخ الانتهاء</div>
                    <div class="value">${formatExpiryDate(card.expiryDate)}</div>
                </div>
                
                <div class="detail">
                    <div class="label">رمز CVV</div>
                    <div class="value">${card.cvv}</div>
                </div>
            </div>
            
            <div class="warning">
                <h2>تنبيه أمني</h2>
                <p>يرجى الاحتفاظ بهذه المعلومات بشكل آمن وعدم مشاركتها مع أي شخص آخر للحفاظ على أمان بياناتك.</p>
            </div>
            
            <div class="footer">
                تم إنشاؤه بواسطة نظام إدارة الاستثمار - ${formatDate(new Date().toISOString())}
            </div>
            
            <div style="text-align: center;">
                <button class="btn no-print" onclick="window.print();">طباعة</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// الحصول على سجل معاملات المستثمر
function getInvestorTransactionsHTML(investorId) {
    // الحصول على عمليات المستثمر
    const investorOperations = operations.filter(op => op.investorId === investorId);
    
    if (investorOperations.length === 0) {
        return `<tr><td colspan="5" style="text-align: center;">لا توجد معاملات</td></tr>`;
    }
    
    // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
    const sortedOperations = [...investorOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return sortedOperations.map(op => `
        <tr>
            <td>${getOperationTypeName(op.type)}</td>
            <td>${formatCurrency(op.amount)}</td>
            <td>${formatDate(op.date)}</td>
            <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
            <td>${op.notes || '-'}</td>
        </tr>
    `).join('');
}

// الحصول على بيانات المستثمر
function getInvestorData(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return null;
    
    // حساب إجمالي الاستثمار
    const totalInvestment = investments
        .filter(inv => inv.investorId === investorId && inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    // حساب إجمالي الربح
    const today = new Date();
    let totalProfit = 0;
    
    investments
        .filter(inv => inv.investorId === investorId && inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfit += profit;
        });
    
    // حساب الأرباح المدفوعة
    const paidProfit = operations
        .filter(op => op.investorId === investorId && op.type === 'profit' && op.status === 'active')
        .reduce((total, op) => total + op.amount, 0);
    
    // حساب الأرباح المستحقة
    const dueProfit = Math.max(0, totalProfit - paidProfit);
    
    return {
        investor,
        totalInvestment,
        totalProfit,
        paidProfit,
        dueProfit
    };
}

// الحصول على اسم نوع العملية
function getOperationTypeName(type) {
    switch (type) {
        case 'deposit':
        case 'investment':
            return 'إيداع';
        case 'withdrawal':
            return 'سحب';
        case 'profit':
            return 'أرباح';
        default:
            return type;
    }
}

// طباعة بطاقة المستثمر
function printInvestorCard(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // الحصول على بيانات المستثمر
    const investorData = getInvestorData(investorId);
    
    // تحديد لون النص بناءً على تصميم البطاقة
    const textColor = card.design === 'gold' ? '#000' : '#fff';
    
    // تحديد خلفية البطاقة بناءً على التصميم
    let cardBackground;
    let cardClass;
    
    switch (card.design) {
        case 'premium':
            cardBackground = `linear-gradient(135deg, #614385 0%, #516395 100%)`;
            cardClass = 'premium-card';
            break;
        case 'gold':
            cardBackground = `linear-gradient(135deg, #FFD700 0%, #FFC107 100%)`;
            cardClass = 'gold-card';
            break;
        default:
            cardBackground = `linear-gradient(135deg, ${cardSettings.cardColor} 0%, ${adjustColor(cardSettings.cardColor, -30)} 100%)`;
            cardClass = 'standard-card';
    }
    
    // إنشاء URI لرمز QR
    const qrDataUri = generateQRCodeDataUri(investorId);
    
    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>بطاقة المستثمر - ${investor.name}</title>
            <style>
                @media print {
                    body {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .card-container {
                        width: 90mm;
                        height: 50mm;
                        page-break-after: always;
                    }
                    
                    .card-back {
                        page-break-before: always;
                    }
                    
                    .no-print {
                        display: none;
                    }
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    background: #f4f6f9;
                }
                
                .card-container {
                    width: 90mm;
                    height: 50mm;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .investor-card {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    padding: 20px;
                    box-sizing: border-box;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
                    position: relative;
                    overflow: hidden;
                }
                
                .card-back {
                    margin-top: 20px;
                }
                
                .card-chip {
                    width: 40px;
                    height: 30px;
                    background: #bdbdbd;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .card-chip::before {
                    content: '';
                    position: absolute;
                    width: 80%;
                    height: 50%;
                    background: #a5a5a5;
                    top: 5px;
                    left: 4px;
                }
                
                .card-number {
                    font-size: 1.2rem;
                    letter-spacing: 2px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }
                
                .magnetic-strip {
                    width: 100%;
                    height: 40px;
                    background: #000;
                    margin: 20px 0;
                }
                
                .signature-strip {
                    width: 80%;
                    height: 30px;
                    background: #f0f0f0;
                    margin: 10px 0;
                    padding: 5px;
                    font-size: 0.8rem;
                    color: #333;
                    position: relative;
                }
                
                .card-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .card-info div {
                    width: 48%;
                }
                
                .info-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .info-value {
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    background: #3498db;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                }
                
                @keyframes rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="card-container">
                <div class="investor-card" style="background: ${cardBackground}; color: ${textColor};">
                    <div class="card-chip"></div>
                    
                    <div class="card-number">
                        ${formatCardNumber(card.cardNumber)}
                    </div>
                    
                    <div class="card-info">
                        <div>
                            <div class="info-label">حامل البطاقة</div>
                            <div class="info-value">${investor.name}</div>
                        </div>
                        <div>
                            <div class="info-label">تنتهي في</div>
                            <div class="info-value">${formatExpiryDate(card.expiryDate)}</div>
                        </div>
                    </div>
                    
                    ${cardSettings.enableQrCode ? `
                        <div style="position: absolute; bottom: 15px; right: 15px; width: 50px; height: 50px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                            <img src="${qrDataUri}" style="width: 45px; height: 45px;">
                        </div>
                    ` : ''}
                    
                    <div style="position: absolute; top: 15px; right: 15px; font-size: 1.2rem; font-weight: bold;">
                        ${settings.companyName || 'استثمار'}
                    </div>
                    
                    <div style="position: absolute; bottom: 15px; left: 15px; font-size: 1rem; font-weight: bold; font-style: italic;">
                        ${card.design === 'gold' ? 'GOLD' : card.design === 'premium' ? 'PREMIUM' : 'STANDARD'}
                    </div>
                </div>
            </div>
            
            <div class="card-container card-back">
                <div class="investor-card" style="background: #333; color: #fff;">
                    <div class="magnetic-strip"></div>
                    
                    <div style="padding: 0 10px;">
                        <div class="signature-strip">
                            ${investor.name}
                            <div style="position: absolute; top: 5px; right: 5px; font-weight: bold; color: #000;">CVV: ${card.cvv}</div>
                        </div>
                        
                        <div style="font-size: 0.8rem; margin-top: 10px;">
                            <div>الرصيد الحالي: ${formatCurrency(investorData.totalInvestment)}</div>
                            <div>إجمالي الأرباح: ${formatCurrency(investorData.totalProfit.toFixed(2))}</div>
                        </div>
                    </div>
                    
                    <div style="position: absolute; bottom: 15px; left: 15px; font-size: 0.8rem; opacity: 0.7;">
                        تم الإصدار: ${formatDate(card.createdAt)}
                    </div>
                    
                    <div style="position: absolute; bottom: 15px; right: 15px; font-size: 0.8rem; opacity: 0.7;">
                        ${settings.companyPhone || ''}
                    </div>
                </div>
            </div>
            
            <button class="btn no-print" onclick="window.print();">طباعة البطاقة</button>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// مشاركة بطاقة المستثمر
function shareInvestorCard(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء قائمة بخيارات المشاركة
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'shareCardModal';
    
    modal.innerHTML = `
        <div class="modal" style="max-width: 450px;">
            <div class="modal-header">
                <h2 class="modal-title">مشاركة بطاقة المستثمر</h2>
                <div class="modal-close" onclick="document.getElementById('shareCardModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-container" style="box-shadow: none; padding: 0;">
                    <h3>مشاركة بطاقة ${investor.name}</h3>
                    
                    <div class="form-group">
                        <button class="btn btn-primary btn-block" onclick="shareCardByEmail('${investorId}')">
                            <i class="fas fa-envelope"></i> إرسال بالبريد الإلكتروني
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn btn-success btn-block" onclick="shareCardByWhatsApp('${investorId}')">
                            <i class="fab fa-whatsapp"></i> مشاركة عبر واتساب
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn btn-info btn-block" onclick="shareCardQRCode('${investorId}')">
                            <i class="fas fa-qrcode"></i> مشاركة رمز QR
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn btn-warning btn-block" onclick="shareCardLink('${investorId}')">
                            <i class="fas fa-link"></i> نسخ رابط البطاقة
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('shareCardModal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// مشاركة البطاقة عبر البريد الإلكتروني
function shareCardByEmail(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء نموذج البريد الإلكتروني
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'emailCardModal';
    
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h2 class="modal-title">إرسال البطاقة بالبريد الإلكتروني</h2>
                <div class="modal-close" onclick="document.getElementById('emailCardModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-container" style="box-shadow: none; padding: 0;">
                    <formid="emailCardForm" onsubmit="sendCardEmail(event, '${investorId}')">
                        <div class="form-group">
                            <label class="form-label">البريد الإلكتروني للمستثمر</label>
                            <input type="email" class="form-control" id="emailCardTo" value="${investor.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">الموضوع</label>
                            <input type="text" class="form-control" id="emailCardSubject" value="بطاقة المستثمر الإلكترونية - ${settings.companyName || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">الرسالة</label>
                            <textarea class="form-control" id="emailCardMessage" rows="5" required>عزيزي المستثمر ${investor.name}،

يسعدنا أن نرسل لك بطاقة المستثمر الإلكترونية الخاصة بك. يمكنك استخدام هذه البطاقة للاطلاع على معلومات حسابك ومعاملاتك الاستثمارية في أي وقت.

تفاصيل الوصول للتطبيق:
- رقم البطاقة: ${card.cardNumber}
- تاريخ الانتهاء: ${formatExpiryDate(card.expiryDate)}
- رمز الأمان: ${card.cvv}

يمكنك أيضاً مسح رمز QR المرفق للوصول المباشر إلى حسابك.

مع تحيات،
${settings.companyName || 'فريق الاستثمار'}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> إرسال
                            </button>
                            <button type="button" class="btn btn-light" onclick="document.getElementById('emailCardModal').remove()">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إغلاق نافذة المشاركة
    document.getElementById('shareCardModal').remove();
}

// إرسال البطاقة بالبريد الإلكتروني
function sendCardEmail(event, investorId) {
    event.preventDefault();
    
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على قيم النموذج
    const toEmail = document.getElementById('emailCardTo').value;
    const subject = document.getElementById('emailCardSubject').value;
    const message = document.getElementById('emailCardMessage').value;
    
    // في تطبيق حقيقي، سنرسل البريد الإلكتروني من خلال API
    // هنا سنقوم بمحاكاة ذلك
    
    // تسجيل إرسال البريد الإلكتروني
    console.log('Sending email to:', toEmail);
    console.log('Subject:', subject);
    console.log('Message:', message);
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'email', `تم إرسال بطاقة المستثمر بالبريد الإلكتروني إلى ${toEmail}`);
    
    // عرض إشعار نجاح
    createNotification('نجاح', `تم إرسال البطاقة إلى ${toEmail} بنجاح`, 'success');
    
    // إغلاق نافذة البريد الإلكتروني
    document.getElementById('emailCardModal').remove();
}

// مشاركة البطاقة عبر واتساب
function shareCardByWhatsApp(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // إنشاء نص الرسالة
    const message = `عزيزي المستثمر ${investor.name}،

هذه بطاقة المستثمر الإلكترونية الخاصة بك من ${settings.companyName || 'شركة الاستثمار'}.

تفاصيل الوصول للتطبيق:
- رقم البطاقة: ${card.cardNumber}
- تاريخ الانتهاء: ${formatExpiryDate(card.expiryDate)}
- رمز الأمان: ${card.cvv}

يمكنك استخدام هذه البيانات للوصول إلى حسابك في تطبيق الجوال.

مع تحيات،
${settings.companyName || 'فريق الاستثمار'}`;
    
    // فتح واتساب مع الرسالة
    const whatsappUrl = `https://wa.me/${investor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'whatsapp', `تم مشاركة بطاقة المستثمر عبر واتساب`);
    
    // عرض إشعار نجاح
    createNotification('نجاح', 'تم فتح واتساب لمشاركة البطاقة', 'success');
    
    // إغلاق نافذة المشاركة
    document.getElementById('shareCardModal').remove();
}

// مشاركة رمز QR للبطاقة
function shareCardQRCode(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء URI لرمز QR
    const qrDataUri = generateQRCodeDataUri(investorId);
    
    // إنشاء نافذة لعرض رمز QR
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'qrCodeModal';
    
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h2 class="modal-title">رمز QR للبطاقة</h2>
                <div class="modal-close" onclick="document.getElementById('qrCodeModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body" style="text-align: center;">
                <div style="margin-bottom: 20px;">
                    <h3>بطاقة ${investor.name}</h3>
                    <p>امسح الرمز للوصول إلى بطاقة المستثمر</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
                    <img src="${qrDataUri}" style="width: 200px; height: 200px;">
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="downloadQRCode('${investorId}')">
                        <i class="fas fa-download"></i> تنزيل رمز QR
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('qrCodeModal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إغلاق نافذة المشاركة
    document.getElementById('shareCardModal').remove();
}

// تنزيل رمز QR
function downloadQRCode(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء URI لرمز QR
    const qrDataUri = generateQRCodeDataUri(investorId);
    
    // إنشاء رابط تنزيل
    const a = document.createElement('a');
    a.href = qrDataUri;
    a.download = `investor_card_qr_${investor.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'qr', `تم تنزيل رمز QR للبطاقة`);
    
    // عرض إشعار نجاح
    createNotification('نجاح', 'تم تنزيل رمز QR بنجاح', 'success');
}

// مشاركة رابط البطاقة
function shareCardLink(investorId) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // الحصول على بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // إنشاء بيانات مشفرة للبطاقة
    const cardData = {
        id: card.id,
        investorId: card.investorId,
        investorName: investor.name,
        cardNumber: card.cardNumber,
        expiryDate: formatExpiryDate(card.expiryDate)
    };
    
    // تحويل البيانات إلى سلسلة JSON
    const cardDataString = JSON.stringify(cardData);
    
    // تشفير البيانات لجعلها آمنة للمشاركة (في تطبيق حقيقي)
    // هنا نستخدم تشفير بسيط لأغراض العرض فقط
    const encodedData = btoa(encodeURIComponent(cardDataString));
    
    // إنشاء رابط البطاقة
    const cardLink = `${window.location.origin}/investor-card/${encodedData}`;
    
    // نسخ الرابط إلى الحافظة
    copyToClipboard(cardLink);
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'link', `تم نسخ رابط البطاقة إلى الحافظة`);
    
    // عرض إشعار نجاح
    createNotification('نجاح', 'تم نسخ رابط البطاقة إلى الحافظة', 'success');
    
    // إغلاق نافذة المشاركة
    document.getElementById('shareCardModal').remove();
}

// نسخ إلى الحافظة
function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

// تبديل رؤية CVV
function toggleCVVVisibility() {
    const cvvField = document.getElementById('cvvField');
    cvvField.type = cvvField.type === 'password' ? 'text' : 'password';
}

// تجديد بطاقة المستثمر
function renewInvestorCard(investorId) {
    // البحث عن بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // تأكيد التجديد
    if (!confirm('هل أنت متأكد من تجديد البطاقة؟')) return;
    
    // إنشاء تاريخ انتهاء جديد
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + cardSettings.validThrough);
    
    // تحديث بيانات البطاقة
    card.expiryDate = expiryDate.toISOString();
    card.updatedAt = now.toISOString();
    
    // حفظ البطاقات
    saveInvestorCards();
    
    // تحديث البطاقة في قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        updateCardInDatabase(card);
    }
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'card', `تم تجديد بطاقة المستثمر`);
    
    // تحديث جدول البطاقات
    updateInvestorCardsTable();
    
    // عرض إشعار
    createNotification('نجاح', 'تم تجديد البطاقة بنجاح', 'success');
}

// حذف بطاقة المستثمر
function deleteInvestorCard(investorId) {
    // البحث عن بطاقة المستثمر
    const card = investorCards[investorId];
    if (!card) return;
    
    // تأكيد الحذف
    if (!confirm('هل أنت متأكد من حذف البطاقة؟')) return;
    
    // حذف البطاقة
    delete investorCards[investorId];
    
    // حفظ البطاقات
    saveInvestorCards();
    
    // حذف البطاقة من قاعدة البيانات
    if (cardSettings.enableDatabaseSync) {
        deleteCardFromDatabase(card.id);
    }
    
    // إنشاء نشاط للمستثمر
    createInvestorActivity(investorId, 'card', `تم حذف بطاقة المستثمر`);
    
    // تحديث جدول البطاقات
    updateInvestorCardsTable();
    
    // عرض إشعار
    createNotification('نجاح', 'تم حذف البطاقة بنجاح', 'success');
}

// إنشاء رقم بطاقة فريد
function generateCardNumber() {
    // محاكاة نظام أرقام ماستر كارد
    // يبدأ بـ 5 متبوعاً بـ 15 رقم عشوائي
    let cardNumber = '5';
    for (let i = 0; i < 15; i++) {
        cardNumber += Math.floor(Math.random() * 10);
    }
    return cardNumber;
}

// إنشاء CVV
function generateCVV() {
    // رقم عشوائي من 3 أرقام
    return Math.floor(Math.random() * 900 + 100).toString();
}

// تنسيق رقم البطاقة
function formatCardNumber(cardNumber) {
    return cardNumber.match(/.{1,4}/g).join(' ');
}

// تنسيق تاريخ انتهاء الصلاحية
function formatExpiryDate(dateString) {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
}

// إنشاء نشاط للمستثمر
function createInvestorActivity(investorId, activityType, description) {
    // البحث عن المستثمر
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) return;
    
    // إنشاء نشاط جديد
    const activity = {
        id: generateId(),
        investorId,
        investorName: investor.name,
        type: activityType,
        description,
        date: new Date().toISOString(),
        userId: 'admin' // يمكن تغييره لاستخدام المستخدم الحالي
    };
    
    // إضافة النشاط إلى قائمة الأنشطة في localStorage أو Firebase
    if (window.firebaseApp && window.firebaseApp.database && cardSettings.enableDatabaseSync) {
        const db = window.firebaseApp.database();
        db.ref(`activities/${activity.id}`).set(activity);
    }
    
    // يمكن إضافة النشاط أيضاً إلى localStorage
    const activities = JSON.parse(localStorage.getItem('investorActivities') || '[]');
    activities.push(activity);
    localStorage.setItem('investorActivities', JSON.stringify(activities));
    
    return activity;
}

// إنشاء URI لرمز QR
function generateQRCodeDataUri(investorId) {
    try {
        // التحقق من وجود مكتبة QRCode
        if (typeof qrcode === 'undefined') {
            return '';
        }
        
        // الحصول على بطاقة المستثمر
        const card = investorCards[investorId];
        if (!card) return '';
        
        // إنشاء بيانات لتضمينها في QR
        const qrData = JSON.stringify({
            type: 'investor-card',
            id: card.id,
            investorId: card.investorId,
            cardNumber: card.cardNumber,
            expiryDate: formatExpiryDate(card.expiryDate),
            companyId: settings.companyId || '',
            timestamp: new Date().getTime()
        });
        
        // إنشاء كائن QR
        const qr = qrcode(0, 'L');
        qr.addData(qrData);
        qr.make();
        
        return qr.createDataURL(4, 0);
    } catch (error) {
        console.error('Error generating QR code:', error);
        return '';
    }
}

// تعديل لون
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// طباعة جميع البطاقات
function printAllCards() {
    // التحقق من وجود بطاقات
    const cardsArray = Object.values(investorCards);
    if (cardsArray.length === 0) {
        createNotification('تنبيه', 'لا توجد بطاقات للطباعة', 'warning');
        return;
    }
    
    // فتح نافذة طباعة
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <title>طباعة بطاقات المستثمرين</title>
            <style>
                @media print {
                    body {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .card-container {
                        width: 90mm;
                        height: 50mm;
                        page-break-after: always;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    background: #f4f6f9;
                }
                
                .card-container {
                    width: 90mm;
                    height: 50mm;
                    margin: 0 auto 30px;
                    position: relative;
                }
                
                .investor-card {
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    padding: 20px;
                    box-sizing: border-box;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
                    position: relative;
                    overflow: hidden;
                }
                
                .card-chip {
                    width: 40px;
                    height: 30px;
                    background: #bdbdbd;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .card-chip::before {
                    content: '';
                    position: absolute;
                    width: 80%;
                    height: 50%;
                    background: #a5a5a5;
                    top: 5px;
                    left: 4px;
                }
                
                .card-number {
                    font-size: 1.2rem;
                    letter-spacing: 2px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }
                
                .magnetic-strip {
                    width: 100%;
                    height: 40px;
                    background: #000;
                    margin: 20px 0;
                }
                
                .signature-strip {
                    width: 80%;
                    height: 30px;
                    background: #f0f0f0;
                    margin: 10px 0;
                    padding: 5px;
                    font-size: 0.8rem;
                    color: #333;
                    position: relative;
                }
                
                .card-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .card-info div {
                    width: 48%;
                }
                
                .info-label {
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .info-value {
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    background: #3498db;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                }
                
                h1 {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .investor-name {
                    text-align: center;
                    margin-bottom: 10px;
                    font-size: 1.2rem;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1 class="no-print">بطاقات المستثمرين</h1>
            
            ${cardsArray.map((card, index) => {
                const investor = investors.find(inv => inv.id === card.investorId);
                if (!investor) return '';
                
                // تحديد لون النص بناءً على تصميم البطاقة
                const textColor = card.design === 'gold' ? '#000' : '#fff';
                
                // تحديد خلفية البطاقة بناءً على التصميم
                let cardBackground;
                
                switch (card.design) {
                    case 'premium':
                        cardBackground = `linear-gradient(135deg, #614385 0%, #516395 100%)`;
                        break;
                    case 'gold':
                        cardBackground = `linear-gradient(135deg, #FFD700 0%, #FFC107 100%)`;
                        break;
                    default:
                        cardBackground = `linear-gradient(135deg, ${cardSettings.cardColor} 0%, ${adjustColor(cardSettings.cardColor, -30)} 100%)`;
                }
                
                // إنشاء URI لرمز QR
                const qrDataUri = generateQRCodeDataUri(card.investorId);
                
                return `
                    <div class="investor-name">${investor.name}</div>
                    <div class="card-container">
                        <div class="investor-card" style="background: ${cardBackground}; color: ${textColor};">
                            <div class="card-chip"></div>
                            
                            <div class="card-number">
                                ${formatCardNumber(card.cardNumber)}
                            </div>
                            
                            <div class="card-info">
                                <div>
                                    <div class="info-label">حامل البطاقة</div>
                                    <div class="info-value">${investor.name}</div>
                                </div>
                                <div>
                                    <div class="info-label">تنتهي في</div>
                                    <div class="info-value">${formatExpiryDate(card.expiryDate)}</div>
                                </div>
                            </div>
                            
                            ${cardSettings.enableQrCode ? `
                                <div style="position: absolute; bottom: 15px; right: 15px; width: 50px; height: 50px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                                    <img src="${qrDataUri}" style="width: 45px; height: 45px;">
                                </div>
                            ` : ''}
                            
                            <div style="position: absolute; top: 15px; right: 15px; font-size: 1.2rem; font-weight: bold;">
                                ${settings.companyName || 'استثمار'}
                            </div>
                            
                            <div style="position: absolute; bottom: 15px; left: 15px; font-size: 1rem; font-weight: bold; font-style: italic;">
                                ${card.design === 'gold' ? 'GOLD' : card.design === 'premium' ? 'PREMIUM' : 'STANDARD'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="page-break"></div>
                    
                    <div class="investor-name">معلومات الوصول للتطبيق - ${investor.name}</div>
                    <div class="card-container" style="background: white; height: auto; padding: 20px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 10px 0;">الوصول إلى تطبيق المستثمر</h3>
                            <p style="margin: 0;">يمكنك الوصول إلى بياناتك عبر تطبيق المستثمر باستخدام:</p>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; margin-bottom: 5px;">بيانات البطاقة:</div>
                                <div>رقم البطاقة: ${formatCardNumber(card.cardNumber)}</div>
                                <div>تاريخ الانتهاء: ${formatExpiryDate(card.expiryDate)}</div>
                                <div>رمز الأمان: ${card.cvv}</div>
                            </div>
                            
                            <div style="text-align: center; width: 100px;">
                                <div style="font-weight: bold; margin-bottom: 5px;">مسح الرمز:</div>
                                <div style="width: 80px; height: 80px; background: white; padding: 5px; border-radius: 5px; margin: 0 auto;">
                                    <img src="${qrDataUri}" style="width: 100%; height: 100%;">
                                </div>
                            </div>
                        </div>
                        
                        <div style="font-size: 0.8rem; color: #666; text-align: center; margin-top: 10px;">
                            تنبيه: الرجاء الحفاظ على سرية هذه المعلومات وعدم مشاركتها مع أي شخص.
                        </div>
                    </div>
                    
                    ${index < cardsArray.length - 1 ? '<div class="page-break"></div>' : ''}
                `;
            }).join('')}
            
            <div class="no-print" style="text-align: center;">
                <button class="btn" onclick="window.print();">طباعة البطاقات</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// مزامنة بطاقات المستثمرين مع Firebase
function syncInvestorCardsWithFirebase() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    if (!window.firebaseApp || !window.firebaseApp.database) {
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    // تحديث جميع البطاقات في قاعدة البيانات
    updateAllCardsInDatabase();
}

// واجهة برمجة التطبيق للوصول من تطبيق الجوال

/**
 * الوصول إلى بطاقة المستثمر عبر معرف
 * يتم استدعاء هذه الدالة من تطبيق الجوال
 */
function getInvestorCardById(cardId, callback) {
    fetchCardFromDatabase(cardId, callback);
}

/**
 * الوصول إلى بطاقة المستثمر عبر رقم البطاقة
 * يتم استدعاء هذه الدالة من تطبيق الجوال
 */
function getInvestorCardByCardNumber(cardNumber, callback) {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        return callback(null);
    }
    
    const db = window.firebaseApp.database();
    
    // البحث في كل البطاقات
    db.ref('investorCards').once('value', snapshot => {
        const cards = snapshot.val() || {};
        
        // البحث عن البطاقة بواسطة رقم البطاقة
        for (const cardId in cards) {
            const card = cards[cardId];
            if (card.cardNumber === cardNumber) {
                return callback(card);
            }
        }
        
        // لم يتم العثور على البطاقة
        callback(null);
    });
}

/**
 * التحقق من صحة بطاقة المستثمر
 * يتم استدعاء هذه الدالة من تطبيق الجوال
 */
function validateInvestorCard(cardNumber, expiryDate, cvv, callback) {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        return callback(false);
    }
    
    const db = window.firebaseApp.database();
    
    // البحث في كل البطاقات
    db.ref('investorCards').once('value', snapshot => {
        const cards = snapshot.val() || {};
        
        // البحث عن البطاقة المطابقة
        for (const cardId in cards) {
            const card = cards[cardId];
            if (card.cardNumber === cardNumber && 
                formatExpiryDate(card.expiryDate) === expiryDate && 
                card.cvv === cvv) {
                
                // فحص صلاحية البطاقة
                const expiryDateObj = new Date(card.expiryDate);
                const now = new Date();
                
                if (expiryDateObj > now) {
                    // البطاقة صالحة
                    return callback(true, card);
                } else {
                    // البطاقة منتهية الصلاحية
                    return callback(false, { error: 'البطاقة منتهية الصلاحية' });
                }
            }
        }
        
        // لم يتم العثور على البطاقة
        callback(false, { error: 'بيانات البطاقة غير صحيحة' });
    });
}

/**
 * الحصول على معاملات المستثمر
 * يتم استدعاء هذه الدالة من تطبيق الجوال
 */
function getInvestorTransactions(investorId, callback) {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        return callback([]);
    }
    
    const db = window.firebaseApp.database();
    
    // البحث عن عمليات المستثمر
    db.ref('operations').orderByChild('investorId').equalTo(investorId).once('value', snapshot => {
        const operations = snapshot.val() || {};
        
        // تحويل الكائن إلى مصفوفة
        const operationsArray = Object.values(operations);
        
        // ترتيب العمليات حسب التاريخ (الأحدث أولاً)
        operationsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        callback(operationsArray);
    });
}

/**
 * الحصول على المعلومات المالية للمستثمر
 * يتم استدعاء هذه الدالة من تطبيق الجوال
 */
function getInvestorFinancialInfo(investorId, callback) {
    if (!window.firebaseApp || !window.firebaseApp.database) {
        return callback(null);
    }
    
    // إنشاء المعلومات المالية
    const financialInfo = {
        totalInvestment: 0,
        totalProfit: 0,
        paidProfit: 0,
        dueProfit: 0,
        lastUpdateDate: new Date().toISOString()
    };
    
    const db = window.firebaseApp.database();
    
    // الحصول على الاستثمارات النشطة
    db.ref('investments').orderByChild('investorId').equalTo(investorId).once('value', investmentsSnapshot => {
        const investments = investmentsSnapshot.val() || {};
        
        // حساب إجمالي الاستثمار
        for (const investmentId in investments) {
            const investment = investments[investmentId];
            if (investment.status === 'active') {
                financialInfo.totalInvestment += investment.amount;
            }
        }
        
        // حساب إجمالي الربح
        const today = new Date();
        let totalProfit = 0;
        
        for (const investmentId in investments) {
            const investment = investments[investmentId];
            if (investment.status === 'active') {
                const profit = calculateProfit(investment.amount, investment.date, today.toISOString());
                totalProfit += profit;
            }
        }
        
        financialInfo.totalProfit = totalProfit;
        
        // الحصول على عمليات الأرباح
        db.ref('operations').orderByChild('investorId').equalTo(investorId).once('value', operationsSnapshot => {
            const operations = operationsSnapshot.val() || {};
            
            // حساب الأرباح المدفوعة
            for (const operationId in operations) {
                const operation = operations[operationId];
                if (operation.type === 'profit' && operation.status === 'active') {
                    financialInfo.paidProfit += operation.amount;
                }
            }
            
            // حساب الأرباح المستحقة
            financialInfo.dueProfit = Math.max(0, financialInfo.totalProfit - financialInfo.paidProfit);
            
            callback(financialInfo);
        });
    });
}

// تحديث واجهة المستخدم للبطاقات
function updateInvestorCardsUI() {
    // تحديث جدول البطاقات إذا كان موجوداً
    if (document.getElementById('investorCardsTableBody')) {
        updateInvestorCardsTable();
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initInvestorCardSystem);

// إنشاء API للوصول العام
window.InvestorCardAPI = {
    getInvestorCardById,
    getInvestorCardByCardNumber,
    validateInvestorCard,
    getInvestorTransactions,
    getInvestorFinancialInfo
};