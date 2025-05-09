/**
 * Investor Card System
 * This file contains all functions related to the investor card system
 * It integrates with the main application and Firebase database
 */

// Initialize the investor card system when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initInvestorCardSystem();
});

let investorCardSystem = {
    cards: [],
    currentCardId: null,
    cardTypes: {
        platinum: {
            name: "بلاتينية",
            bgColor: "#1e293b",
            textColor: "white",
            maxTransactions: "غير محدودة",
            dailyLimit: 10000000,
            profitBonus: 0.25,
            features: ["معاملات مجانية غير محدودة", "حد يومي: 10,000,000 د.ع", "مكافأة أرباح +0.25%", "خدمات VIP حصرية"]
        },
        gold: {
            name: "ذهبية",
            bgColor: "#854d0e",
            textColor: "white",
            maxTransactions: 50,
            dailyLimit: 5000000,
            profitBonus: 0.15,
            features: ["50 معاملة مجانية شهرياً", "حد يومي: 5,000,000 د.ع", "مكافأة أرباح +0.15%", "دعم ذو أولوية"]
        },
        premium: {
            name: "بريميوم",
            bgColor: "#1e40af",
            textColor: "white",
            maxTransactions: 20,
            dailyLimit: 2000000,
            profitBonus: 0,
            features: ["20 معاملة مجانية شهرياً", "حد يومي: 2,000,000 د.ع", "تأمين أساسي"]
        }
    }
};

/**
 * Initialize the investor card system
 */
function initInvestorCardSystem() {
    // Check if investor-cards page exists
    if (document.getElementById('investorCards')) {
        // Load cards from Firebase
        loadCardsFromFirebase();
        
        // Setup event listeners for card actions
        setupCardEventListeners();
    }
}

/**
 * Load investor cards from Firebase
 */
function loadCardsFromFirebase() {
    // Check if Firebase is initialized and we're logged in
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
            const db = firebase.database();
            const cardsRef = db.ref('investorCards');
            
            cardsRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    investorCardSystem.cards = [];
                    snapshot.forEach((childSnapshot) => {
                        const card = childSnapshot.val();
                        card.id = childSnapshot.key;
                        investorCardSystem.cards.push(card);
                    });
                    
                    // Update card counts
                    updateCardCounts();
                    
                    // Display cards
                    displayCards('all');
                } else {
                    investorCardSystem.cards = [];
                    updateCardCounts();
                    displayCards('all');
                }
            });
        } catch (error) {
            console.error("Error loading cards from Firebase:", error);
            createNotification('خطأ', 'حدث خطأ أثناء تحميل البطاقات', 'danger');
        }
    } else {
        console.log("Firebase not initialized, using local storage as fallback");
        
        // Fallback to localStorage
        const savedCards = localStorage.getItem('investorCards');
        if (savedCards) {
            investorCardSystem.cards = JSON.parse(savedCards);
        }
        
        // Update card counts
        updateCardCounts();
        
        // Display cards
        displayCards('all');
    }
}

/**
 * Save cards to Firebase
 */
function saveCardsToFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
            const db = firebase.database();
            const cardsRef = db.ref('investorCards');
            
            // Create an object with card IDs as keys
            const cardsToSave = {};
            investorCardSystem.cards.forEach(card => {
                const cardId = card.id;
                // Create a copy without the id field to avoid duplication
                const cardData = {...card};
                delete cardData.id;
                cardsToSave[cardId] = cardData;
            });
            
            cardsRef.set(cardsToSave);
        } catch (error) {
            console.error("Error saving cards to Firebase:", error);
            createNotification('خطأ', 'حدث خطأ أثناء حفظ البطاقات', 'danger');
            
            // Fallback to localStorage
            localStorage.setItem('investorCards', JSON.stringify(investorCardSystem.cards));
        }
    } else {
        // Save to localStorage as fallback
        localStorage.setItem('investorCards', JSON.stringify(investorCardSystem.cards));
    }
}

/**
 * Update card counts in UI
 */
function updateCardCounts() {
    const allCards = investorCardSystem.cards.length;
    const activeCards = investorCardSystem.cards.filter(card => card.status === 'active').length;
    const suspendedCards = investorCardSystem.cards.filter(card => card.status === 'suspended').length;
    
    // Update badges
    const allCardsBadge = document.getElementById('allCardsBadge');
    const activeCardsBadge = document.getElementById('activeCardsBadge');
    const suspendedCardsBadge = document.getElementById('suspendedCardsBadge');
    
    if (allCardsBadge) allCardsBadge.textContent = allCards;
    if (activeCardsBadge) activeCardsBadge.textContent = activeCards;
    if (suspendedCardsBadge) suspendedCardsBadge.textContent = suspendedCards;
}

/**
 * Setup event listeners for card actions
 */
function setupCardEventListeners() {
    // Tab switching
    document.querySelectorAll('.cards-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            switchCardsTab(tabId);
        });
    });
    
    // Create card button
    const createCardBtn = document.querySelector('button[onclick="openCreateCardModal()"]');
    if (createCardBtn) {
        createCardBtn.addEventListener('click', openCreateCardModal);
    }
    
    // Scan QR code button
    const scanBarcodeBtn = document.querySelector('button[onclick="scanBarcode()"]');
    if (scanBarcodeBtn) {
        scanBarcodeBtn.addEventListener('click', scanBarcode);
    }
}

/**
 * Switch between card tabs (all, active, suspended)
 * @param {string} tabId - The tab to switch to
 */
function switchCardsTab(tabId) {
    // Update active tab
    document.querySelectorAll('.cards-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`.cards-menu-item[onclick="switchCardsTab('${tabId}')"]`).classList.add('active');
    
    // Display cards based on tab
    displayCards(tabId);
}

/**
 * Display cards based on selected tab
 * @param {string} tabId - The selected tab (all, active, suspended)
 */
function displayCards(tabId) {
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    // Filter cards based on tab
    let filteredCards = [];
    switch (tabId) {
        case 'active':
            filteredCards = investorCardSystem.cards.filter(card => card.status === 'active');
            break;
        case 'suspended':
            filteredCards = investorCardSystem.cards.filter(card => card.status === 'suspended');
            break;
        default: // 'all'
            filteredCards = [...investorCardSystem.cards];
            break;
    }
    
    // No cards message
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 50px 0;">
                <i class="fas fa-credit-card fa-3x" style="color: var(--gray-400); margin-bottom: 15px;"></i>
                <h3>لا توجد بطاقات</h3>
                <p>قم بإنشاء بطاقة جديدة من خلال الضغط على زر "إنشاء بطاقة" أعلاه.</p>
                <button class="btn btn-primary" onclick="openCreateCardModal()">
                    <i class="fas fa-plus"></i> إنشاء بطاقة جديدة
                </button>
            </div>
        `;
        return;
    }
    
    // Display cards
    filteredCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'investor-card';
        cardElement.onclick = () => viewCardDetails(card.id);
        
        // Get investor name
        const investor = investors.find(inv => inv.id === card.investorId);
        const investorName = investor ? investor.name : 'مستثمر غير معروف';
        
        // Create card HTML
        cardElement.innerHTML = `
            <div class="card-preview" style="background-color: ${investorCardSystem.cardTypes[card.type].bgColor}; color: ${investorCardSystem.cardTypes[card.type].textColor};">
                <div class="card-header">MASTERCARD</div>
                <div class="card-chip"></div>
                <div class="card-qr">
                    <img src="${card.qrCode}" alt="QR Code" width="60" height="60">
                </div>
                <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                <div class="card-details">
                    <div class="card-valid">VALID ${formatExpiryDate(card.expiryDate)}</div>
                    <div class="card-holder">${investorName}</div>
                </div>
                ${card.status === 'suspended' ? '<div class="card-suspended">متوقفة</div>' : ''}
            </div>
        `;
        
        cardsGrid.appendChild(cardElement);
    });
}

/**
 * Open the create card modal
 */
function openCreateCardModal() {
    // Reset form
    document.getElementById('createCardForm')?.reset();
    
    // Populate investor select
    populateInvestorSelect('cardInvestor');
    
    // Set default expiry date (3 years from now)
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
        const now = new Date();
        const futureDate = new Date(now.getFullYear() + 3, now.getMonth());
        expiryInput.value = futureDate.toISOString().slice(0, 7);
    }
    
    // Select platinum card type by default
    document.querySelector('input[name="cardType"][value="platinum"]').checked = true;
    
    // Update card preview
    updateCardPreview();
    
    // Open modal
    openModal('createCardModal');
}

/**
 * Populate investor select dropdown
 * @param {string} selectId - The ID of the select element to populate
 */
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
    
    // Add change event listener to update phone field
    select.addEventListener('change', function() {
        const investorId = this.value;
        const phoneInput = document.getElementById('cardPhone');
        
        if (investorId && phoneInput) {
            const investor = investors.find(inv => inv.id === investorId);
            if (investor) {
                phoneInput.value = investor.phone || '';
            } else {
                phoneInput.value = '';
            }
        } else if (phoneInput) {
            phoneInput.value = '';
        }
        
        // Update card preview
        updateCardPreview();
    });
}

/**
 * Update card preview based on form values
 */
function updateCardPreview() {
    const preview = document.getElementById('cardPreview');
    if (!preview) return;
    
    const investorSelect = document.getElementById('cardInvestor');
    const expiryInput = document.getElementById('cardExpiry');
    const cardTypeInputs = document.querySelectorAll('input[name="cardType"]');
    
    // Get selected card type
    let selectedType = 'platinum';
    cardTypeInputs.forEach(input => {
        if (input.checked) {
            selectedType = input.value;
        }
    });
    
    // Get card type details
    const cardType = investorCardSystem.cardTypes[selectedType];
    
    // Get investor name
    let holderName = 'حامل البطاقة';
    if (investorSelect.value) {
        const investor = investors.find(inv => inv.id === investorSelect.value);
        if (investor) {
            holderName = investor.name;
        }
    }
    
    // Format expiry date
    let expiryDate = '04/26';
    if (expiryInput.value) {
        const [year, month] = expiryInput.value.split('-');
        expiryDate = `${month}/${year.slice(2)}`;
    }
    
    // Generate a random card number (for preview only)
    const cardNumber = '5162 4532 6597 8210';
    
    // Generate QR code
    generateQRCode('cardQrCode', investorSelect.value || 'preview');
    
    // Update preview
    preview.style.backgroundColor = cardType.bgColor;
    preview.style.color = cardType.textColor;
    
    preview.innerHTML = `
        <div class="card-header">MASTERCARD</div>
        <div class="card-chip"></div>
        <div class="card-qr">
            <canvas id="cardQrCode"></canvas>
        </div>
        <div class="card-number">${cardNumber}</div>
        <div class="card-details">
            <div class="card-valid">VALID ${expiryDate}</div>
            <div class="card-holder">${holderName}</div>
        </div>
    `;
}

/**
 * Create a new investor card
 */
function createInvestorCard() {
    const investorId = document.getElementById('cardInvestor').value;
    const cardType = document.querySelector('input[name="cardType"]:checked').value;
    const expiryDate = document.getElementById('cardExpiry').value;
    
    // Validate form
    if (!investorId) {
        createNotification('خطأ', 'يرجى اختيار المستثمر', 'danger');
        return;
    }
    
    if (!expiryDate) {
        createNotification('خطأ', 'يرجى تحديد تاريخ الانتهاء', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Check if investor already has a card
    const existingCard = investorCardSystem.cards.find(card => card.investorId === investorId && card.status === 'active');
    if (existingCard) {
        createNotification('تنبيه', 'المستثمر لديه بطاقة نشطة بالفعل', 'warning');
        return;
    }
    
    // Generate card details
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const [year, month] = expiryDate.split('-');
    const formattedExpiryDate = `${month}/${year.slice(2)}`;
    
    // Generate QR code
    const qrCodeData = generateQRCodeData(investorId, cardNumber);
    
    // Create card object
    const newCard = {
        id: generateId(),
        investorId,
        cardNumber,
        expiryDate: formattedExpiryDate,
        cvv,
        type: cardType,
        status: 'active',
        qrCode: qrCodeData,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        transactionCount: 0,
        transactions: []
    };
    
    // Add card to array
    investorCardSystem.cards.push(newCard);
    
    // Save cards
    saveCardsToFirebase();
    
    // Create notification
    createNotification('نجاح', 'تم إنشاء البطاقة بنجاح', 'success');
    
    // Close modal
    closeModal('createCardModal');
    
    // Update card counts and display
    updateCardCounts();
    displayCards('all');
    
    // Create activity
    createActivity('card', 'create', `تم إنشاء بطاقة جديدة للمستثمر ${investor.name}`);
}

/**
 * View card details
 * @param {string} cardId - The ID of the card to view
 */
function viewCardDetails(cardId) {
    // Set current card ID
    investorCardSystem.currentCardId = cardId;
    
    // Find card
    const card = investorCardSystem.cards.find(c => c.id === cardId);
    if (!card) {
        createNotification('خطأ', 'البطاقة غير موجودة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === card.investorId);
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Get card type details
    const cardType = investorCardSystem.cardTypes[card.type];
    
    // Prepare card transactions
    const cardTransactions = card.transactions || [];
    const investorOperations = operations.filter(op => op.investorId === card.investorId);
    
    // Mix transactions from card and operations, sort by date (newest first)
    const allTransactions = [...cardTransactions, ...investorOperations.map(op => ({
        id: op.id,
        date: op.date,
        type: op.type,
        amount: op.amount,
        description: op.notes || getOperationTypeName(op.type),
        status: op.status
    }))].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate statistics
    const totalInvestments = investments
        .filter(inv => inv.investorId === investor.id && inv.status === 'active')
        .reduce((sum, inv) => sum + inv.amount, 0);
    
    const totalProfits = calculateTotalProfits(investor.id);
    
    // Populate card details content
    const content = document.getElementById('cardDetailsContent');
    if (!content) return;
    
    content.innerHTML = `
        <div class="grid-layout">
            <div>
                <div class="card-preview-large" style="background-color: ${cardType.bgColor}; color: ${cardType.textColor};">
                    <div class="card-header">MASTERCARD</div>
                    <div class="card-chip"></div>
                    <div class="card-qr">
                        <img src="${card.qrCode}" alt="QR Code" width="80" height="80">
                    </div>
                    <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                    <div class="card-details">
                        <div class="card-valid">VALID ${card.expiryDate}</div>
                        <div class="card-holder">${investor.name}</div>
                    </div>
                </div>
                
                <div class="card-info">
                    <div class="card-info-item">
                        <span class="card-info-label">رقم البطاقة:</span>
                        <span class="card-info-value">${formatCardNumber(card.cardNumber)}</span>
                    </div>
                    <div class="card-info-item">
                        <span class="card-info-label">تاريخ الانتهاء:</span>
                        <span class="card-info-value">${card.expiryDate}</span>
                    </div>
                    <div class="card-info-item">
                        <span class="card-info-label">رمز الأمان:</span>
                        <span class="card-info-value">${card.cvv}</span>
                    </div>
                    <div class="card-info-item">
                        <span class="card-info-label">نوع البطاقة:</span>
                        <span class="card-info-value">${cardType.name}</span>
                    </div>
                    <div class="card-info-item">
                        <span class="card-info-label">حالة البطاقة:</span>
                        <span class="card-info-value status ${card.status}">${card.status === 'active' ? 'نشطة' : 'متوقفة'}</span>
                    </div>
                    <div class="card-info-item">
                        <span class="card-info-label">تاريخ الإنشاء:</span>
                        <span class="card-info-value">${formatDate(card.createdAt)}</span>
                    </div>
                </div>
            </div>
            
            <div>
                <div class="investor-info">
                    <h3>معلومات المستثمر</h3>
                    <div class="investor-info-item">
                        <span class="investor-info-label">الاسم:</span>
                        <span class="investor-info-value">${investor.name}</span>
                    </div>
                    <div class="investor-info-item">
                        <span class="investor-info-label">رقم الهاتف:</span>
                        <span class="investor-info-value">${investor.phone}</span>
                    </div>
                    <div class="investor-info-item">
                        <span class="investor-info-label">العنوان:</span>
                        <span class="investor-info-value">${investor.address || '-'}</span>
                    </div>
                    <div class="investor-info-item">
                        <span class="investor-info-label">تاريخ الانضمام:</span>
                        <span class="investor-info-value">${formatDate(investor.joinDate)}</span>
                    </div>
                    
                    <h3>إحصائيات المستثمر</h3>
                    <div class="statistics-grid">
                        <div class="statistic-item">
                            <div class="statistic-value">${formatCurrency(totalInvestments)}</div>
                            <div class="statistic-label">إجمالي الاستثمارات</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-value">${formatCurrency(totalProfits)}</div>
                            <div class="statistic-label">إجمالي الأرباح</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-value">${investorOperations.length}</div>
                            <div class="statistic-label">عدد العمليات</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-value">${formatCurrency(cardType.dailyLimit)}</div>
                            <div class="statistic-label">الحد اليومي</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card-features">
            <h3>مزايا البطاقة</h3>
            <div class="features-list">
                ${cardType.features.map(feature => `<div class="feature-item"><i class="fas fa-check"></i> ${feature}</div>`).join('')}
            </div>
        </div>
        
        <div class="card-transactions">
            <h3>سجل المعاملات</h3>
            ${allTransactions.length > 0 ? `
                <div class="table-container" style="box-shadow: none; padding: 0;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>النوع</th>
                                <th>المبلغ</th>
                                <th>الوصف</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allTransactions.slice(0, 10).map(t => `
                                <tr>
                                    <td>${formatDate(t.date)}</td>
                                    <td>${getOperationTypeName(t.type)}</td>
                                    <td>${formatCurrency(t.amount)}</td>
                                    <td>${t.description || '-'}</td>
                                    <td><span class="status ${t.status === 'pending' ? 'pending' : 'active'}">${t.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <p>لا توجد معاملات حتى الآن</p>
                </div>
            `}
        </div>
    `;
    
    // Update toggle button text based on card status
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
    
    // Open modal
    openModal('cardDetailsModal');
}

/**
 * Toggle card status (active/suspended)
 */
function toggleCardStatus() {
    const cardId = investorCardSystem.currentCardId;
    if (!cardId) return;
    
    // Find card
    const cardIndex = investorCardSystem.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        createNotification('خطأ', 'البطاقة غير موجودة', 'danger');
        return;
    }
    
    // Toggle status
    const newStatus = investorCardSystem.cards[cardIndex].status === 'active' ? 'suspended' : 'active';
    investorCardSystem.cards[cardIndex].status = newStatus;
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorCardSystem.cards[cardIndex].investorId);
    
    // Create activity
    if (newStatus === 'active') {
        createActivity('card', 'activate', `تم تفعيل بطاقة المستثمر ${investor ? investor.name : 'غير معروف'}`);
    } else {
        createActivity('card', 'suspend', `تم إيقاف بطاقة المستثمر ${investor ? investor.name : 'غير معروف'}`);
    }
    
    // Save cards
    saveCardsToFirebase();
    
    // Show notification
    if (newStatus === 'active') {
        createNotification('نجاح', 'تم تفعيل البطاقة بنجاح', 'success');
    } else {
        createNotification('تنبيه', 'تم إيقاف البطاقة بنجاح', 'warning');
    }
    
    // Close and reopen modal to refresh content
    closeModal('cardDetailsModal');
    viewCardDetails(cardId);
    
    // Update card counts and display
    updateCardCounts();
    displayCards('all');
}

/**
 * Delete card
 */
function deleteCard() {
    const cardId = investorCardSystem.currentCardId;
    if (!cardId) return;
    
    // Find card
    const card = investorCardSystem.cards.find(c => c.id === cardId);
    if (!card) {
        createNotification('خطأ', 'البطاقة غير موجودة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === card.investorId);
    
    // Confirm deletion
    if (!confirm(`هل أنت متأكد من حذف بطاقة المستثمر ${investor ? investor.name : 'غير معروف'}؟`)) {
        return;
    }
    
    // Remove card
    investorCardSystem.cards = investorCardSystem.cards.filter(c => c.id !== cardId);
    
    // Save cards
    saveCardsToFirebase();
    
    // Create activity
    createActivity('card', 'delete', `تم حذف بطاقة المستثمر ${investor ? investor.name : 'غير معروف'}`);
    
    // Show notification
    createNotification('نجاح', 'تم حذف البطاقة بنجاح', 'success');
    
    // Close modal
    closeModal('cardDetailsModal');
    
    // Reset current card ID
    investorCardSystem.currentCardId = null;
    
    // Update card counts and display
    updateCardCounts();
    displayCards('all');
}

/**
 * Search for investor cards
 */
function searchInvestorCards() {
    const searchInput = document.querySelector('#investorCards .search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    // Get current tab
    const activeTab = document.querySelector('.cards-menu-item.active');
    const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
    
    // If search term is empty, reset display
    if (!searchTerm) {
        displayCards(tabId);
        return;
    }
    
    // Filter cards based on tab
    let filteredCards = [];
    switch (tabId) {
        case 'active':
            filteredCards = investorCardSystem.cards.filter(card => card.status === 'active');
            break;
        case 'suspended':
            filteredCards = investorCardSystem.cards.filter(card => card.status === 'suspended');
            break;
        default: // 'all'
            filteredCards = [...investorCardSystem.cards];
            break;
    }
    
    // Further filter by search term
    filteredCards = filteredCards.filter(card => {
        const investor = investors.find(inv => inv.id === card.investorId);
        const investorName = investor ? investor.name.toLowerCase() : '';
        const investorPhone = investor ? investor.phone.toLowerCase() : '';
        
        return investorName.includes(searchTerm) || 
               investorPhone.includes(searchTerm) || 
               card.cardNumber.includes(searchTerm);
    });
    
    // Display filtered cards
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    cardsGrid.innerHTML = '';
    
    // No cards message
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 50px 0;">
                <i class="fas fa-search fa-3x" style="color: var(--gray-400); margin-bottom: 15px;"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على أي بطاقات تطابق بحثك "${searchTerm}".</p>
            </div>
        `;
        return;
    }
    
    // Display cards
    filteredCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'investor-card';
        cardElement.onclick = () => viewCardDetails(card.id);
        
        // Get investor name
        const investor = investors.find(inv => inv.id === card.investorId);
        const investorName = investor ? investor.name : 'مستثمر غير معروف';
        
        // Create card HTML
        cardElement.innerHTML = `
            <div class="card-preview" style="background-color: ${investorCardSystem.cardTypes[card.type].bgColor}; color: ${investorCardSystem.cardTypes[card.type].textColor};">
                <div class="card-header">MASTERCARD</div>
                <div class="card-chip"></div>
                <div class="card-qr">
                    <img src="${card.qrCode}" alt="QR Code" width="60" height="60">
                </div>
                <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                <div class="card-details">
                    <div class="card-valid">VALID ${card.expiryDate}</div>
                    <div class="card-holder">${investorName}</div>
                </div>
                ${card.status === 'suspended' ? '<div class="card-suspended">متوقفة</div>' : ''}
            </div>
        `;
        
        cardsGrid.appendChild(cardElement);
    });
}

/**
 * Scan QR code to view investor card details
 */
function scanBarcode() {
    // Check if device has camera access
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        createNotification('خطأ', 'لا يمكن الوصول إلى الكاميرا على هذا الجهاز', 'danger');
        return;
    }
    
    // Create scan modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'scanBarcodeModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">مسح رمز QR</h2>
                <div class="modal-close" onclick="document.getElementById('scanBarcodeModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="scan-container">
                    <div class="scan-preview">
                        <video id="scanPreview" style="width: 100%; height: 300px; background: #000;"></video>
                        <div class="scan-overlay">
                            <div class="scan-target"></div>
                        </div>
                    </div>
                    <div class="scan-status">
                        <p id="scanStatus">جارِ تحميل الكاميرا...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('scanBarcodeModal').remove()">إلغاء</button>
                <button class="btn btn-primary" onclick="startQRScanner()">
                    <i class="fas fa-camera"></i> بدء المسح
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize QR scanner
    setTimeout(() => {
        startQRScanner();
    }, 500);
}

/**
 * Start QR code scanner
 */
function startQRScanner() {
    const video = document.getElementById('scanPreview');
    const scanStatus = document.getElementById('scanStatus');
    
    if (!video || !scanStatus) return;
    
    scanStatus.textContent = 'جارِ تحميل الكاميرا...';
    
    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            scanStatus.textContent = 'قم بتوجيه الكاميرا نحو رمز QR';
            
            // Use a library like jsQR or instascan in a real implementation
            // For demo purposes, we'll simulate a successful scan after 3 seconds
            setTimeout(() => {
                scanStatus.textContent = 'تم العثور على رمز QR! جارِ المعالجة...';
                
                // Simulate finding a random card
                const randomCard = investorCardSystem.cards[Math.floor(Math.random() * investorCardSystem.cards.length)];
                
                if (randomCard) {
                    // Close scan modal
                    document.getElementById('scanBarcodeModal').remove();
                    
                    // Stop video stream
                    if (video.srcObject) {
                        video.srcObject.getTracks().forEach(track => track.stop());
                    }
                    
                    // Show card details
                    viewCardDetails(randomCard.id);
                } else {
                    scanStatus.textContent = 'لم يتم العثور على أي بطاقات.';
                }
            }, 3000);
        })
        .catch(error => {
            console.error("Error accessing camera:", error);
            scanStatus.textContent = 'خطأ في الوصول إلى الكاميرا: ' + error.message;
        });
}

/**
 * Generate a random card number
 * @returns {string} - The generated card number
 */
function generateCardNumber() {
    // Generate a 16-digit number starting with 5 (for Mastercard)
    let number = '5';
    for (let i = 0; i < 15; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

/**
 * Format card number for display (XXXX XXXX XXXX XXXX)
 * @param {string} number - The card number to format
 * @returns {string} - The formatted card number
 */
function formatCardNumber(number) {
    if (!number) return '';
    
    // Remove any non-digit characters
    number = number.replace(/\D/g, '');
    
    // Format as XXXX XXXX XXXX XXXX
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Format expiry date for display (MM/YY)
 * @param {string} date - The expiry date to format
 * @returns {string} - The formatted expiry date
 */
function formatExpiryDate(date) {
    if (!date) return '';
    
    // If already in MM/YY format, return as is
    if (date.includes('/')) return date;
    
    // Parse from YYYY-MM format
    const [year, month] = date.split('-');
    return `${month}/${year.slice(2)}`;
}

/**
 * Generate a random CVV
 * @returns {string} - The generated CVV
 */
function generateCVV() {
    // Generate a 3-digit number
    let cvv = '';
    for (let i = 0; i < 3; i++) {
        cvv += Math.floor(Math.random() * 10);
    }
    return cvv;
}

/**
 * Generate QR code
 * @param {string} elementId - The ID of the canvas element to render the QR code
 * @param {string} data - The data to encode in the QR code
 */
function generateQRCode(elementId, data) {
    // Check if qrcode library is available
    if (typeof qrcode !== 'undefined') {
        try {
            const qr = qrcode(0, 'L');
            qr.addData(data);
            qr.make();
            
            const canvas = document.getElementById(elementId);
            if (canvas) {
                const qrSize = 4; // Size of QR modules in pixels
                const size = qr.getModuleCount() * qrSize;
                canvas.width = size;
                canvas.height = size;
                
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw QR code
                for (let row = 0; row < qr.getModuleCount(); row++) {
                    for (let col = 0; col < qr.getModuleCount(); col++) {
                        ctx.fillStyle = qr.isDark(row, col) ? '#000' : '#fff';
                        ctx.fillRect(col * qrSize, row * qrSize, qrSize, qrSize);
                    }
                }
            }
        } catch (error) {
            console.error("Error generating QR code:", error);
        }
    } else {
        console.error("QR code library not available");
    }
}

/**
 * Generate a data URL for a QR code
 * @param {string} investorId - The investor ID
 * @param {string} cardNumber - The card number
 * @returns {string} - The data URL of the QR code
 */
function generateQRCodeData(investorId, cardNumber) {
    // Create a data object to encode in the QR code
    const data = JSON.stringify({
        investorId,
        cardNumber,
        timestamp: Date.now()
    });
    
    // Check if qrcode library is available
    if (typeof qrcode !== 'undefined') {
        try {
            const qr = qrcode(0, 'L');
            qr.addData(data);
            qr.make();
            
            return qr.createDataURL(4, 0);
        } catch (error) {
            console.error("Error generating QR code data:", error);
            return '';
        }
    } else {
        console.error("QR code library not available");
        return '';
    }
}

/**
 * Calculate total profits for an investor
 * @param {string} investorId - The investor ID
 * @returns {number} - The total profits
 */
function calculateTotalProfits(investorId) {
    // Get active investments for this investor
    const activeInvestments = investments.filter(inv => inv.investorId === investorId && inv.status === 'active');
    
    // Calculate total profit
    const today = new Date();
    let totalProfit = 0;
    
    activeInvestments.forEach(inv => {
        const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
        totalProfit += profit;
    });
    
    // Get total profit paid
    const profitPaid = operations
        .filter(op => op.investorId === investorId && op.type === 'profit' && op.status === 'active')
        .reduce((total, op) => total + op.amount, 0);
    
    // Calculate due profit
    return Math.max(0, totalProfit - profitPaid);
}

/**
 * Initialize the investor card system when the page loads
 */
window.addEventListener('load', function() {
    // Wait for Firebase to initialize
    setTimeout(() => {
        // Create a QR code reader component for the app
        // This is a placeholder for the QR scanner integration
        if (typeof initQRScanner === 'function') {
            initQRScanner();
        }
        
        // Add investor card system to global window object
        if (!window.investorCardSystem) {
            window.investorCardSystem = investorCardSystem;
        }
        
        // Add event handlers for card actions
        addCardEventHandlers();
    }, 1000);
});

/**
 * Add event handlers for card-related actions
 */
function addCardEventHandlers() {
    // Handle operations that should be tracked in the card system
    if (typeof window.addEventListener === 'function') {
        // Track investment operations
        document.addEventListener('investmentAdded', function(e) {
            if (e.detail && e.detail.investorId) {
                recordCardTransaction(e.detail.investorId, 'investment', e.detail.amount);
            }
        });
        
        // Track withdrawal operations
        document.addEventListener('withdrawalMade', function(e) {
            if (e.detail && e.detail.investorId) {
                recordCardTransaction(e.detail.investorId, 'withdrawal', e.detail.amount);
            }
        });
        
        // Track profit payments
        document.addEventListener('profitPaid', function(e) {
            if (e.detail && e.detail.investorId) {
                recordCardTransaction(e.detail.investorId, 'profit', e.detail.amount);
            }
        });
    }
}

/**
 * Record a transaction on an investor's card
 * @param {string} investorId - The investor ID
 * @param {string} type - The transaction type
 * @param {number} amount - The transaction amount
 * @param {string} description - Optional transaction description
 */
function recordCardTransaction(investorId, type, amount, description = '') {
    // Find active card for this investor
    const card = investorCardSystem.cards.find(c => c.investorId === investorId && c.status === 'active');
    if (!card) return;
    
    // Create transaction object
    const transaction = {
        id: generateId(),
        date: new Date().toISOString(),
        type,
        amount,
        description: description || getOperationTypeName(type),
        status: 'active'
    };
    
    // Add transaction to card
    if (!card.transactions) card.transactions = [];
    card.transactions.push(transaction);
    
    // Update transaction count
    card.transactionCount = (card.transactionCount || 0) + 1;
    
    // Update last used timestamp
    card.lastUsed = new Date().toISOString();
    
    // Save cards
    saveCardsToFirebase();
}

/**
 * Create an activity entry for the investor card system
 * @param {string} entityType - The entity type
 * @param {string} action - The action performed
 * @param {string} description - The activity description
 */
function createCardActivity(entityType, action, description) {
    if (typeof createActivity === 'function') {
        createActivity(entityType, action, description);
    } else {
        console.log(`Card Activity: [${entityType}] [${action}] ${description}`);
    }
}