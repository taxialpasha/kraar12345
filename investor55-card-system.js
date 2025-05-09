/**
 * Investor Card System
 * Provides functionality to create and manage investor cards
 * Integrates with Firebase for data storage
 * Enables QR codes for each card for easy identification
 */

// Global variables
let investorCardSystem = {
    cards: [],
    activeCardId: null,
    initialized: false,
    firebaseConfig: null,
    cardTypes: [
        { 
            id: 'premium', 
            name: 'بريميوم', 
            color: '#0052cc',
            bgColor: 'linear-gradient(135deg, #192f6a 0%, #3b5998 100%)',
            textColor: 'white',
            icon: 'fas fa-star',
            dailyLimit: 2000000,
            freeTransactions: 20,
            insurance: 'basic',
            features: [
                '20 معاملة مجانية شهرياً',
                'حد يومي: 2,000,000 د.ع',
                'تأمين أساسي'
            ]
        },
        { 
            id: 'gold', 
            name: 'ذهبية', 
            color: '#daa520',
            bgColor: 'linear-gradient(135deg, #532100 0%, #90712b 100%)',
            textColor: 'white',
            icon: 'fas fa-crown',
            dailyLimit: 5000000,
            freeTransactions: 50,
            insurance: 'enhanced',
            profitBonus: 0.15,
            features: [
                '50 معاملة مجانية شهرياً',
                'حد يومي: 5,000,000 د.ع',
                'مكافأة أرباح +0.15%',
                'دعم ذو أولوية'
            ]
        },
        { 
            id: 'platinum', 
            name: 'بلاتينية', 
            color: '#e5e4e2',
            bgColor: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            textColor: 'white',
            icon: 'fas fa-gem',
            dailyLimit: 10000000,
            freeTransactions: 'unlimited',
            insurance: 'premium',
            profitBonus: 0.25,
            features: [
                'معاملات مجانية غير محدودة',
                'حد يومي: 10,000,000 د.ع',
                'مكافأة أرباح +0.25%',
                'خدمات VIP حصرية'
            ]
        }
    ]
};

/**
 * Initialize the investor card system
 */
function initInvestorCardSystem() {
    if (investorCardSystem.initialized) return;
    
    console.log('Initializing Investor Card System...');
    
    // Add card system to global window object for access from other files
    window.investorCardSystem = investorCardSystem;
    
    // Create functions for managing cards
    investorCardSystem.createCard = createInvestorCard;
    investorCardSystem.getCards = getInvestorCards;
    investorCardSystem.getCardById = getInvestorCardById;
    investorCardSystem.updateCard = updateInvestorCard;
    investorCardSystem.deleteCard = deleteInvestorCard;
    investorCardSystem.toggleCardStatus = toggleCardStatus;
    investorCardSystem.generateCardNumber = generateCardNumber;
    investorCardSystem.generateQRCode = generateQRCode;
    investorCardSystem.viewCardDetails = viewCardDetails;
    investorCardSystem.scanBarcode = scanBarcode;
    investorCardSystem.switchCardsTab = switchCardsTab;
    investorCardSystem.searchInvestorCards = searchInvestorCards;
    
    // Load cards from Firebase on initialization
    loadCardsFromFirebase();
    
    // Setup UI events
    setupCardUIEvents();
    
    investorCardSystem.initialized = true;
    console.log('Investor Card System initialized successfully');
}

/**
 * Set up UI events for card system
 */
function setupCardUIEvents() {
    // Add event listener for creating new cards
    document.addEventListener('DOMContentLoaded', function() {
        const createCardButtons = document.querySelectorAll('.btn[onclick="openCreateCardModal()"]');
        createCardButtons.forEach(button => {
            button.onclick = openCreateCardModal;
        });
        
        // Handle card investor selection change
        const cardInvestorSelect = document.getElementById('cardInvestor');
        if (cardInvestorSelect) {
            cardInvestorSelect.addEventListener('change', function() {
                updateCardInvestorInfo();
                updateCardPreview();
            });
        }
        
        // Handle card type selection change
        const cardTypeInputs = document.querySelectorAll('input[name="cardType"]');
        cardTypeInputs.forEach(input => {
            input.addEventListener('change', updateCardPreview);
        });
        
        // Handle card expiry change
        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('change', updateCardPreview);
        }
    });
    
    // Load investor cards when investor cards page is shown
    document.addEventListener('DOMContentLoaded', function() {
        const investorCardsLinks = document.querySelectorAll('a[href="#investorCards"]');
        investorCardsLinks.forEach(link => {
            link.addEventListener('click', function() {
                loadInvestorCards();
            });
        });
    });
}

/**
 * Open the modal for creating a new investor card
 */
function openCreateCardModal() {
    console.log('Opening create card modal');
    
    // Reset form
    const createCardForm = document.getElementById('createCardForm');
    if (createCardForm) createCardForm.reset();
    
    // Set default expiry date to 3 years from now
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
        const now = new Date();
        const futureDate = new Date(now.getFullYear() + 3, now.getMonth());
        expiryInput.value = futureDate.toISOString().slice(0, 7);
    }
    
    // Populate investor select
    populateCardInvestorSelect();
    
    // Update card preview
    updateCardPreview();
    
    // Open modal
    openModal('createCardModal');
}

/**
 * Populate the investor select dropdown in the card creation form
 */
function populateCardInvestorSelect() {
    const select = document.getElementById('cardInvestor');
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
}

/**
 * Update investor info when investor is selected
 */
function updateCardInvestorInfo() {
    const investorId = document.getElementById('cardInvestor').value;
    const phoneInput = document.getElementById('cardPhone');
    
    if (!investorId || !phoneInput) return;
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    if (investor) {
        phoneInput.value = investor.phone;
    } else {
        phoneInput.value = '';
    }
}

/**
 * Update the card preview based on form inputs
 */
function updateCardPreview() {
    const cardPreview = document.getElementById('cardPreview');
    if (!cardPreview) return;
    
    // Get form values
    const investorId = document.getElementById('cardInvestor').value;
    const cardTypeInputs = document.querySelectorAll('input[name="cardType"]');
    let cardType = 'platinum';
    cardTypeInputs.forEach(input => {
        if (input.checked) {
            cardType = input.value;
        }
    });
    
    const expiryInput = document.getElementById('cardExpiry');
    let expiryDate = '';
    if (expiryInput && expiryInput.value) {
        const [year, month] = expiryInput.value.split('-');
        expiryDate = `${month}/${year.slice(2)}`;
    } else {
        const now = new Date();
        const futureDate = new Date(now.getFullYear() + 3, now.getMonth());
        expiryDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${(futureDate.getFullYear() % 100).toString().padStart(2, '0')}`;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    const investorName = investor ? investor.name : 'حامل البطاقة';
    
    // Get card type details
    const cardTypeObj = investorCardSystem.cardTypes.find(t => t.id === cardType) || investorCardSystem.cardTypes[0];
    
    // Generate card number
    const cardNumber = generateCardNumber();
    
    // Set card preview HTML
    cardPreview.innerHTML = '';
    cardPreview.className = `card-preview card-${cardType}`;
    cardPreview.style.background = cardTypeObj.bgColor;
    
    // Create card content
    const cardHTML = `
        <div class="card-header">MASTERCARD</div>
        <div class="card-chip"></div>
        <div class="card-qr" id="previewQRCode"></div>
        <div class="card-number">${formatCardNumber(cardNumber)}</div>
        <div class="card-details">
            <div class="card-valid">VALID ${expiryDate}</div>
            <div class="card-holder">${investorName}</div>
        </div>
        <div class="card-logo">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard">
        </div>
    `;
    
    cardPreview.innerHTML = cardHTML;
    
    // Generate QR code
    generateQRCode('previewQRCode', investorId || 'preview');
}

/**
 * Format a card number with spaces for display
 * @param {string} number - The card number to format
 * @returns {string} Formatted card number
 */
function formatCardNumber(number) {
    return number.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Create a new investor card
 */
function createInvestorCard() {
    // Get form values
    const investorId = document.getElementById('cardInvestor').value;
    const expiryInput = document.getElementById('cardExpiry').value;
    
    // Validate required fields
    if (!investorId || !expiryInput) {
        createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === investorId);
    if (!investor) {
        createNotification('خطأ', 'المستثمر غير موجود', 'danger');
        return;
    }
    
    // Get selected card type
    const cardTypeInputs = document.querySelectorAll('input[name="cardType"]');
    let cardType = 'platinum';
    cardTypeInputs.forEach(input => {
        if (input.checked) {
            cardType = input.value;
        }
    });
    
    // Format expiry date
    const [expiryYear, expiryMonth] = expiryInput.split('-');
    const expiryDate = `${expiryMonth}/${expiryYear.slice(2)}`;
    
    // Generate a new card
    const cardId = generateId();
    const cardNumber = generateCardNumber();
    const cvv = Math.floor(100 + Math.random() * 900).toString(); // 3-digit CVV
    
    // Create new card object
    const newCard = {
        id: cardId,
        investorId: investorId,
        investorName: investor.name,
        phone: investor.phone,
        cardNumber: cardNumber,
        cvv: cvv,
        type: cardType,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiryDate: expiryDate,
        lastUsed: null,
        transactions: []
    };
    
    // Add card to array
    investorCardSystem.cards.push(newCard);
    
    // Save to Firebase
    saveCardToFirebase(newCard);
    
    // Close modal
    closeModal('createCardModal');
    
    // Refresh cards
    loadInvestorCards();
    
    // Show success notification
    createNotification('نجاح', 'تم إنشاء البطاقة بنجاح', 'success', cardId, 'card');
}

/**
 * Save a card to Firebase
 * @param {Object} card - The card to save
 */
function saveCardToFirebase(card) {
    try {
        // Check if Firebase is initialized
        if (typeof firebase !== 'undefined' && firebase.app()) {
            const db = firebase.database();
            const cardsRef = db.ref('cards');
            
            // Save card to Firebase
            cardsRef.child(card.id).set(card)
                .then(() => {
                    console.log('Card saved to Firebase successfully');
                })
                .catch((error) => {
                    console.error('Error saving card to Firebase:', error);
                });
        } else {
            // Save to localStorage as fallback
            localStorage.setItem('investorCards', JSON.stringify(investorCardSystem.cards));
        }
    } catch (error) {
        console.error('Error saving card:', error);
        // Save to localStorage as fallback
        localStorage.setItem('investorCards', JSON.stringify(investorCardSystem.cards));
    }
}

/**
 * Load cards from Firebase
 */
function loadCardsFromFirebase() {
    try {
        // Check if Firebase is initialized
        if (typeof firebase !== 'undefined' && firebase.app()) {
            const db = firebase.database();
            const cardsRef = db.ref('cards');
            
            // Get cards from Firebase
            cardsRef.once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        investorCardSystem.cards = Object.values(data);
                        console.log(`Loaded ${investorCardSystem.cards.length} cards from Firebase`);
                    } else {
                        console.log('No cards found in Firebase');
                        // Try to load from localStorage
                        loadCardsFromLocalStorage();
                    }
                })
                .catch((error) => {
                    console.error('Error loading cards from Firebase:', error);
                    // Try to load from localStorage
                    loadCardsFromLocalStorage();
                });
        } else {
            // Load from localStorage
            loadCardsFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading cards:', error);
        // Load from localStorage
        loadCardsFromLocalStorage();
    }
}

/**
 * Load cards from localStorage (fallback)
 */
function loadCardsFromLocalStorage() {
    const storedCards = localStorage.getItem('investorCards');
    if (storedCards) {
        investorCardSystem.cards = JSON.parse(storedCards);
        console.log(`Loaded ${investorCardSystem.cards.length} cards from localStorage`);
    }
}

/**
 * Get all investor cards
 * @returns {Array} Array of investor cards
 */
function getInvestorCards() {
    return investorCardSystem.cards;
}

/**
 * Get a specific investor card by ID
 * @param {string} id - The card ID
 * @returns {Object|null} The card object or null if not found
 */
function getInvestorCardById(id) {
    return investorCardSystem.cards.find(card => card.id === id) || null;
}

/**
 * Update an investor card
 * @param {string} id - The card ID
 * @param {Object} updates - The updates to apply
 * @returns {boolean} Success flag
 */
function updateInvestorCard(id, updates) {
    const index = investorCardSystem.cards.findIndex(card => card.id === id);
    if (index === -1) return false;
    
    // Update card
    investorCardSystem.cards[index] = {
        ...investorCardSystem.cards[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    // Save to Firebase
    saveCardToFirebase(investorCardSystem.cards[index]);
    
    return true;
}

/**
 * Delete an investor card
 * @param {string} id - The card ID
 * @returns {boolean} Success flag
 */
function deleteInvestorCard(id) {
    const index = investorCardSystem.cards.findIndex(card => card.id === id);
    if (index === -1) return false;
    
    // Remove card
    investorCardSystem.cards.splice(index, 1);
    
    // Delete from Firebase
    try {
        if (typeof firebase !== 'undefined' && firebase.app()) {
            const db = firebase.database();
            db.ref(`cards/${id}`).remove()
                .then(() => {
                    console.log('Card deleted from Firebase successfully');
                })
                .catch((error) => {
                    console.error('Error deleting card from Firebase:', error);
                });
        }
    } catch (error) {
        console.error('Error deleting card:', error);
    }
    
    // Save to localStorage as fallback
    localStorage.setItem('investorCards', JSON.stringify(investorCardSystem.cards));
    
    return true;
}

/**
 * Toggle the status of a card (active/suspended)
 * @param {string} id - The card ID
 * @returns {boolean} Success flag
 */
function toggleCardStatus(id) {
    const card = getInvestorCardById(id);
    if (!card) return false;
    
    // Toggle status
    const newStatus = card.status === 'active' ? 'suspended' : 'active';
    
    // Update card
    return updateInvestorCard(id, { status: newStatus });
}

/**
 * Generate a random card number
 * @returns {string} A 16-digit card number
 */
function generateCardNumber() {
    let number = '5';  // Start with 5 for MasterCard
    
    // Generate 15 more random digits
    for (let i = 0; i < 15; i++) {
        number += Math.floor(Math.random() * 10);
    }
    
    return number;
}

/**
 * Generate a QR code for a card
 * @param {string} elementId - The ID of the element to put the QR code in
 * @param {string} data - The data to encode in the QR code
 */
function generateQRCode(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        // Try to use qrcode library if available
        if (typeof QRCode !== 'undefined') {
            new QRCode(element, {
                text: data,
                width: 64,
                height: 64,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else if (typeof qrcode !== 'undefined') {
            // Alternative QR code library
            const qr = qrcode(0, 'M');
            qr.addData(data);
            qr.make();
            element.innerHTML = qr.createImgTag(2);
        } else {
            // Create a fallback placeholder
            element.innerHTML = `
                <div style="width: 64px; height: 64px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-qrcode" style="font-size: 32px;"></i>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        // Create a fallback placeholder
        element.innerHTML = `
            <div style="width: 64px; height: 64px; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-qrcode" style="font-size: 32px;"></i>
            </div>
        `;
    }
}

/**
 * Load investor cards into the UI
 * @param {string} filter - Optional filter for status (all, active, suspended)
 */
function loadInvestorCards(filter = 'all') {
    console.log(`Loading investor cards with filter: ${filter}`);
    
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    // Update badge counts
    updateCardBadgeCounts();
    
    // Filter cards
    let filteredCards = [...investorCardSystem.cards];
    if (filter === 'active') {
        filteredCards = filteredCards.filter(card => card.status === 'active');
    } else if (filter === 'suspended') {
        filteredCards = filteredCards.filter(card => card.status === 'suspended');
    }
    
    // Sort cards by creation date (newest first)
    filteredCards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Clear grid
    cardsGrid.innerHTML = '';
    
    // Add cards to grid
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div class="no-cards-message">
                <i class="fas fa-credit-card fa-3x"></i>
                <p>لا توجد بطاقات ${filter === 'active' ? 'نشطة' : filter === 'suspended' ? 'متوقفة' : ''}</p>
                <button class="btn btn-primary" onclick="openCreateCardModal()">
                    <i class="fas fa-plus"></i> إنشاء بطاقة جديدة
                </button>
            </div>
        `;
        return;
    }
    
    filteredCards.forEach(card => {
        const cardType = investorCardSystem.cardTypes.find(t => t.id === card.type) || investorCardSystem.cardTypes[0];
        
        const cardElement = document.createElement('div');
        cardElement.className = `investor-card ${card.status === 'suspended' ? 'suspended' : ''}`;
        cardElement.onclick = () => viewCardDetails(card.id);
        
        cardElement.innerHTML = `
            <div class="card-preview card-${card.type}" style="background: ${cardType.bgColor};">
                <div class="card-header">MASTERCARD</div>
                <div class="card-chip"></div>
                <div class="card-qr" id="qr-${card.id}"></div>
                <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                <div class="card-details">
                    <div class="card-valid">VALID ${card.expiryDate}</div>
                    <div class="card-holder">${card.investorName}</div>
                </div>
                <div class="card-logo">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard">
                </div>
                ${card.status === 'suspended' ? '<div class="card-suspended-overlay"><i class="fas fa-ban"></i> متوقفة</div>' : ''}
            </div>
            <div class="card-info">
                <div class="card-owner">${card.investorName}</div>
                <div class="card-type">${cardType.name}</div>
                <div class="card-status ${card.status}">
                    ${card.status === 'active' ? '<i class="fas fa-check-circle"></i> نشطة' : '<i class="fas fa-ban"></i> متوقفة'}
                </div>
            </div>
        `;
        
        cardsGrid.appendChild(cardElement);
        
        // Generate QR code
        generateQRCode(`qr-${card.id}`, card.id);
    });
}

/**
 * Update badge counts for card tabs
 */
function updateCardBadgeCounts() {
    const allCount = investorCardSystem.cards.length;
    const activeCount = investorCardSystem.cards.filter(card => card.status === 'active').length;
    const suspendedCount = investorCardSystem.cards.filter(card => card.status === 'suspended').length;
    
    // Update badges
    const allBadge = document.getElementById('allCardsBadge');
    const activeBadge = document.getElementById('activeCardsBadge');
    const suspendedBadge = document.getElementById('suspendedCardsBadge');
    
    if (allBadge) allBadge.textContent = allCount;
    if (activeBadge) activeBadge.textContent = activeCount;
    if (suspendedBadge) suspendedBadge.textContent = suspendedCount;
}

/**
 * Switch between different card tabs
 * @param {string} tabId - The tab ID (all, active, suspended)
 */
function switchCardsTab(tabId) {
    // Update active tab
    const menuItems = document.querySelectorAll('.cards-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.cards-menu-item[onclick="switchCardsTab('${tabId}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Load cards with filter
    loadInvestorCards(tabId);
}

/**
 * Search for investor cards
 */
function searchInvestorCards() {
    const searchInput = document.querySelector('#investorCards .search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    // Get active tab
    const activeTab = document.querySelector('.cards-menu-item.active');
    let filter = 'all';
    if (activeTab) {
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        filter = tabId;
    }
    
    // Get cards for this tab
    let filteredCards = [...investorCardSystem.cards];
    if (filter === 'active') {
        filteredCards = filteredCards.filter(card => card.status === 'active');
    } else if (filter === 'suspended') {
        filteredCards = filteredCards.filter(card => card.status === 'suspended');
    }
    
    // Apply search term
    if (searchTerm) {
        filteredCards = filteredCards.filter(card => 
            card.investorName.toLowerCase().includes(searchTerm) ||
            card.cardNumber.includes(searchTerm) ||
            card.phone.includes(searchTerm)
        );
    }
    
    // Get cards grid
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;
    
    // Clear grid
    cardsGrid.innerHTML = '';
    
    // Show no results message if needed
    if (filteredCards.length === 0) {
        cardsGrid.innerHTML = `
            <div class="no-cards-message">
                <i class="fas fa-search fa-3x"></i>
                <p>لا توجد نتائج مطابقة للبحث</p>
                <button class="btn btn-light" onclick="document.querySelector('#investorCards .search-input').value = ''; searchInvestorCards();">
                    <i class="fas fa-redo"></i> إعادة تعيين البحث
                </button>
            </div>
        `;
        return;
    }
    
    // Add cards to grid (reuse the existing card UI creation logic)
    filteredCards.forEach(card => {
        const cardType = investorCardSystem.cardTypes.find(t => t.id === card.type) || investorCardSystem.cardTypes[0];
        
        const cardElement = document.createElement('div');
        cardElement.className = `investor-card ${card.status === 'suspended' ? 'suspended' : ''}`;
        cardElement.onclick = () => viewCardDetails(card.id);
        
        cardElement.innerHTML = `
            <div class="card-preview card-${card.type}" style="background: ${cardType.bgColor};">
                <div class="card-header">MASTERCARD</div>
                <div class="card-chip"></div>
                <div class="card-qr" id="qr-search-${card.id}"></div>
                <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                <div class="card-details">
                    <div class="card-valid">VALID ${card.expiryDate}</div>
                    <div class="card-holder">${card.investorName}</div>
                </div>
                <div class="card-logo">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard">
                </div>
                ${card.status === 'suspended' ? '<div class="card-suspended-overlay"><i class="fas fa-ban"></i> متوقفة</div>' : ''}
            </div>
            <div class="card-info">
                <div class="card-owner">${card.investorName}</div>
                <div class="card-type">${cardType.name}</div>
                <div class="card-status ${card.status}">
                    ${card.status === 'active' ? '<i class="fas fa-check-circle"></i> نشطة' : '<i class="fas fa-ban"></i> متوقفة'}
                </div>
            </div>
        `;
        
        cardsGrid.appendChild(cardElement);
        
        // Generate QR code
        generateQRCode(`qr-search-${card.id}`, card.id);
    });
}

/**
 * View card details
 * @param {string} cardId - The card ID
 */
function viewCardDetails(cardId) {
    console.log(`Viewing card details for card ID: ${cardId}`);
    
    // Set active card ID
    investorCardSystem.activeCardId = cardId;
    
    // Find card
    const card = getInvestorCardById(cardId);
    if (!card) {
        createNotification('خطأ', 'البطاقة غير موجودة', 'danger');
        return;
    }
    
    // Find investor
    const investor = investors.find(inv => inv.id === card.investorId);
    
    // Get card type
    const cardType = investorCardSystem.cardTypes.find(t => t.id === card.type) || investorCardSystem.cardTypes[0];
    
    // Get card transactions
    const cardTransactions = operations.filter(op => op.investorId === card.investorId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10); // Get last 10 transactions
    
    // Calculate investor statistics
    const totalInvestment = investments
        .filter(inv => inv.investorId === card.investorId && inv.status === 'active')
        .reduce((total, inv) => total + inv.amount, 0);
    
    // Calculate total profit
    const today = new Date();
    let totalProfit = 0;
    
    investments
        .filter(inv => inv.investorId === card.investorId && inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfit += profit;
        });
    
    // Get profit payment operations
    const profitPayments = operations.filter(op => op.investorId === card.investorId && op.type === 'profit');
    
    // Calculate total profit paid
    const totalProfitPaid = profitPayments.reduce((total, op) => total + op.amount, 0);
    
    // Create card details modal content
    const cardDetailsContent = document.getElementById('cardDetailsContent');
    if (!cardDetailsContent) return;
    
    cardDetailsContent.innerHTML = `
        <div class="card-details-container">
            <div class="card-details-header">
                <div class="card-preview-large card-${card.type}" style="background: ${cardType.bgColor};">
                    <div class="card-header">MASTERCARD</div>
                    <div class="card-chip"></div>
                    <div class="card-qr" id="qr-details-${card.id}"></div>
                    <div class="card-number">${formatCardNumber(card.cardNumber)}</div>
                    <div class="card-details">
                        <div class="card-valid">VALID ${card.expiryDate}</div>
                        <div class="card-holder">${card.investorName}</div>
                    </div>
                    <div class="card-logo">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard">
                    </div>
                    ${card.status === 'suspended' ? '<div class="card-suspended-overlay"><i class="fas fa-ban"></i> متوقفة</div>' : ''}
                </div>
                <div class="card-meta">
                    <h3>تفاصيل البطاقة</h3>
                    <table class="card-details-table">
                        <tr>
                            <th>اسم المستثمر:</th>
                            <td>${card.investorName}</td>
                        </tr>
                        <tr>
                            <th>رقم الجوال:</th>
                            <td>${card.phone}</td>
                        </tr>
                        <tr>
                            <th>نوع البطاقة:</th>
                            <td><span class="badge badge-${card.type}">${cardType.name}</span></td>
                        </tr>
                        <tr>
                            <th>الحالة:</th>
                            <td><span class="status ${card.status}">${card.status === 'active' ? 'نشطة' : 'متوقفة'}</span></td>
                        </tr>
                        <tr>
                            <th>تاريخ الإنشاء:</th>
                            <td>${formatDate(card.createdAt)}</td>
                        </tr>
                        <tr>
                            <th>تاريخ الانتهاء:</th>
                            <td>${card.expiryDate}</td>
                        </tr>
                        <tr>
                            <th>الحد اليومي:</th>
                            <td>${formatCurrency(cardType.dailyLimit)}</td>
                        </tr>
                        <tr>
                            <th>المعاملات المجانية:</th>
                            <td>${cardType.freeTransactions === 'unlimited' ? 'غير محدودة' : cardType.freeTransactions}</td>
                        </tr>
                        ${cardType.profitBonus ? `
                        <tr>
                            <th>مكافأة الأرباح:</th>
                            <td>+${cardType.profitBonus}%</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
            </div>
            
            <div class="card-details-stats">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="stat-value">${formatCurrency(totalInvestment)}</div>
                    <div class="stat-title">إجمالي الاستثمار</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="stat-value">${formatCurrency(totalProfit.toFixed(2))}</div>
                    <div class="stat-title">إجمالي الأرباح</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-value">${formatCurrency(totalProfitPaid.toFixed(2))}</div>
                    <div class="stat-title">الأرباح المدفوعة</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-value">${formatCurrency((totalProfit - totalProfitPaid).toFixed(2))}</div>
                    <div class="stat-title">الأرباح المستحقة</div>
                </div>
            </div>
            
            <div class="card-details-transactions">
                <h3>آخر المعاملات</h3>
                ${cardTransactions.length > 0 ? `
                <div class="table-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>رقم العملية</th>
                                <th>النوع</th>
                                <th>المبلغ</th>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cardTransactions.map(transaction => `
                            <tr>
                                <td>${transaction.id}</td>
                                <td>${getOperationTypeName(transaction.type)}</td>
                                <td>${formatCurrency(transaction.amount)}</td>
                                <td>${formatDate(transaction.date)}</td>
                                <td><span class="status ${transaction.status === 'pending' ? 'pending' : 'active'}">${transaction.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="alert alert-info">
                    <div class="alert-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">لا توجد معاملات</div>
                        <div class="alert-text">لا توجد معاملات حديثة لهذه البطاقة.</div>
                    </div>
                </div>
                `}
            </div>
            
            <div class="card-details-investments">
                <h3>الاستثمارات النشطة</h3>
                ${investor && investments.filter(inv => inv.investorId === investor.id && inv.status === 'active').length > 0 ? `
                <div class="table-container" style="box-shadow: none; padding: 0;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>المبلغ</th>
                                <th>تاريخ الاستثمار</th>
                                <th>الربح الشهري</th>
                                <th>إجمالي الأرباح</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${investments.filter(inv => inv.investorId === investor.id && inv.status === 'active').map(investment => {
                                const monthlyProfit = calculateMonthlyProfit(investment.amount);
                                const totalInvestmentProfit = calculateProfit(investment.amount, investment.date, today.toISOString());
                                
                                return `
                                <tr>
                                    <td>${formatCurrency(investment.amount)}</td>
                                    <td>${formatDate(investment.date)}</td>
                                    <td>${formatCurrency(monthlyProfit.toFixed(2))}</td>
                                    <td>${formatCurrency(totalInvestmentProfit.toFixed(2))}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="alert alert-info">
                    <div class="alert-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">لا توجد استثمارات نشطة</div>
                        <div class="alert-text">لا توجد استثمارات نشطة لهذا المستثمر.</div>
                    </div>
                </div>
                `}
            </div>
        </div>
    `;
    
    // Generate QR code
    setTimeout(() => {
        generateQRCode(`qr-details-${card.id}`, card.id);
    }, 100);
    
    // Update toggle card status button
    const toggleBtn = document.getElementById('toggleCardStatusBtn');
    if (toggleBtn) {
        if (card.status === 'active') {
            toggleBtn.innerHTML = '<i class="fas fa-ban"></i> إيقاف البطاقة';
            toggleBtn.className = 'btn btn-warning';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-check-circle"></i> تفعيل البطاقة';
            toggleBtn.className = 'btn btn-success';
        }
    }
    
    // Open modal
    openModal('cardDetailsModal');
}

/**
 * Delete the current card
 */
function deleteCard() {
    const cardId = investorCardSystem.activeCardId;
    if (!cardId) return;
    
    // Confirm deletion
    if (confirm('هل أنت متأكد من أنك تريد حذف هذه البطاقة؟')) {
        // Delete card
        if (deleteInvestorCard(cardId)) {
            // Close modal
            closeModal('cardDetailsModal');
            
            // Refresh cards
            loadInvestorCards();
            
            // Show success notification
            createNotification('نجاح', 'تم حذف البطاقة بنجاح', 'success');
        } else {
            // Show error notification
            createNotification('خطأ', 'فشل حذف البطاقة', 'danger');
        }
    }
}

/**
 * Toggle the status of the current card
 */
function toggleCardStatus() {
    const cardId = investorCardSystem.activeCardId;
    if (!cardId) return;
    
    // Toggle status
    if (toggleCardStatus(cardId)) {
        // Close modal
        closeModal('cardDetailsModal');
        
        // Refresh cards
        loadInvestorCards();
        
        // Get card to show appropriate message
        const card = getInvestorCardById(cardId);
        const status = card ? card.status : 'unknown';
        
        // Show success notification
        createNotification(
            'نجاح', 
            `تم ${status === 'active' ? 'تفعيل' : 'إيقاف'} البطاقة بنجاح`, 
            'success'
        );
    } else {
        // Show error notification
        createNotification('خطأ', 'فشل تغيير حالة البطاقة', 'danger');
    }
}

/**
 * Scan a barcode/QR code
 */
function scanBarcode() {
    console.log('Scanning barcode/QR code');
    
    // Check if device has camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Create scannerModal if it doesn't exist
        if (!document.getElementById('scannerModal')) {
            const modal = document.createElement('div');
            modal.id = 'scannerModal';
            modal.className = 'modal-overlay';
            
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">مسح الباركود</h2>
                        <div class="modal-close" onclick="closeModal('scannerModal')">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="scanner-container">
                            <video id="scanner-video" playsinline></video>
                            <div class="scanner-overlay">
                                <div class="scanner-target"></div>
                                <div class="scanner-instructions">قم بتوجيه الكاميرا نحو باركود البطاقة</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-light" onclick="closeModal('scannerModal')">إلغاء</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Open modal
        openModal('scannerModal');
        
        // Initialize camera
        const video = document.getElementById('scanner-video');
        
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                video.setAttribute('playsinline', true); // Required for iOS
                video.play();
                
                // Check if QR scanner library is available
                if (typeof jsQR === 'undefined') {
                    // Load jsQR library
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
                    script.onload = startScanning;
                    document.head.appendChild(script);
                } else {
                    startScanning();
                }
            })
            .catch(function(err) {
                console.error('Error accessing camera:', err);
                closeModal('scannerModal');
                createNotification('خطأ', 'فشل الوصول إلى الكاميرا. يرجى التحقق من إذن الكاميرا.', 'danger');
            });
    } else {
        createNotification('خطأ', 'جهازك لا يدعم الوصول إلى الكاميرا.', 'danger');
    }
}

/**
 * Start scanning for QR codes
 */
function startScanning() {
    const video = document.getElementById('scanner-video');
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const scanInterval = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code) {
                console.log('QR Code detected:', code.data);
                
                // Stop scanning
                clearInterval(scanInterval);
                
                // Stop camera
                video.srcObject.getTracks().forEach(track => track.stop());
                
                // Close modal
                closeModal('scannerModal');
                
                // Process the code
                processScannedCode(code.data);
            }
        }
    }, 100);
    
    // Add event listener to stop scanning when modal is closed
    const modal = document.getElementById('scannerModal');
    if (modal) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class' && !modal.classList.contains('active')) {
                    clearInterval(scanInterval);
                    if (video.srcObject) {
                        video.srcObject.getTracks().forEach(track => track.stop());
                    }
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }
}

/**
 * Process a scanned QR code
 * @param {string} data - The data from the QR code
 */
function processScannedCode(data) {
    console.log('Processing scanned code:', data);
    
    // Check if data is a card ID
    const card = getInvestorCardById(data);
    if (card) {
        // Show card details
        viewCardDetails(data);
    } else {
        // Check if data is a valid JSON
        try {
            const json = JSON.parse(data);
            if (json.type === 'investor_card' && json.id) {
                const card = getInvestorCardById(json.id);
                if (card) {
                    viewCardDetails(json.id);
                } else {
                    createNotification('خطأ', 'البطاقة غير موجودة', 'danger');
                }
            } else {
                createNotification('خطأ', 'رمز QR غير صالح', 'danger');
            }
        } catch (e) {
            createNotification('خطأ', 'رمز QR غير صالح', 'danger');
        }
    }
}

/**
 * Add card transaction to a card
 * @param {string} cardId - The card ID
 * @param {string} operationId - The operation ID
 * @returns {boolean} - Success flag
 */
function addCardTransaction(cardId, operationId) {
    const card = getInvestorCardById(cardId);
    if (!card) return false;
    
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return false;
    
    // Add transaction to card
    if (!card.transactions) card.transactions = [];
    
    card.transactions.push({
        id: operationId,
        type: operation.type,
        amount: operation.amount,
        date: operation.date,
        status: operation.status
    });
    
    // Update last used
    card.lastUsed = new Date().toISOString();
    
    // Save to Firebase
    saveCardToFirebase(card);
    
    return true;
}

/**
 * CSS for the card system
 */
function addCardSystemStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Investor Card System Styles */
        .cards-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
        }
        
        .cards-menu {
            display: flex;
            gap: 15px;
            padding: 0 10px;
            border-bottom: 1px solid var(--gray-200);
            padding-bottom: 15px;
        }
        
        .cards-menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        
        .cards-menu-item:hover {
            background-color: var(--gray-100);
        }
        
        .cards-menu-item.active {
            background-color: var(--primary-color);
            color: white;
        }
        
        .cards-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 20px;
            height: 20px;
            border-radius: 10px;
            background-color: rgba(255, 255, 255, 0.3);
            font-size: 0.75rem;
            padding: 0 6px;
        }
        
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            padding: 10px;
        }
        
        .investor-card {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            background-color: white;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .investor-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
        
        .investor-card.suspended .card-preview {
            filter: grayscale(0.7);
        }
        
        .card-preview {
            width: 100%;
            height: 180px;
            border-radius: 10px;
            padding: 16px;
            position: relative;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .card-preview-large {
            width: 400px;
            height: 220px;
            border-radius: 16px;
            padding: 20px;
            position: relative;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .card-platinum {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }
        
        .card-gold {
            background: linear-gradient(135deg, #532100 0%, #90712b 100%);
        }
        
        .card-premium {
            background: linear-gradient(135deg, #192f6a 0%, #3b5998 100%);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
            letter-spacing: 1px;
        }
        
        .card-chip {
            width: 40px;
            height: 30px;
            background: linear-gradient(135deg, #c3a336 0%, #f2ec9b 50%, #c3a336 100%);
            border-radius: 5px;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .card-chip::before {
            content: '';
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
            border-radius: 3px;
        }
        
        .card-qr {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 48px;
            height: 48px;
            background-color: white;
            border-radius: 5px;
            padding: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .card-number {
            font-size: 1.1rem;
            letter-spacing: 2px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .card-details {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 0.8rem;
        }
        
        .card-logo {
            position: absolute;
            bottom: 15px;
            right: 15px;
            width: 50px;
            height: 30px;
            display: flex;
            align-items: center;
        }
        
        .card-logo img {
            width: 100%;
            height: auto;
            object-fit: contain;
        }
        
        .card-suspended-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            border-radius: 10px;
        }
        
        .card-suspended-overlay i {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #e74c3c;
        }
        
        .card-info {
            padding: 16px;
        }
        
        .card-owner {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .card-type {
            font-size: 0.85rem;
            color: var(--gray-600);
            margin-bottom: 8px;
        }
        
        .card-status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .card-status.active {
            background-color: rgba(46, 204, 113, 0.1);
            color: #2ecc71;
        }
        
        .card-status.suspended {
            background-color: rgba(231, 76, 60, 0.1);
            color: #e74c3c;
        }
        
        .no-cards-message {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            background-color: var(--gray-100);
            border-radius: 10px;
            gap: 15px;
            color: var(--gray-600);
        }
        
        .card-type-options {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .card-type-option {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            padding: 15px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid var(--gray-200);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .card-type-option:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .card-type-option.premium {
            border-color: #0052cc;
        }
        
        .card-type-option.gold {
            border-color: #daa520;
        }
        
        .card-type-option.platinum {
            border-color: #e5e4e2;
        }
        
        .card-type-option input[type="radio"] {
            position: absolute;
            opacity: 0;
        }
        
        .card-type-option.selected {
            border-width: 2px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .card-type-option.premium.selected {
            border-color: #0052cc;
            background-color: rgba(0, 82, 204, 0.05);
        }
        
        .card-type-option.gold.selected {
            border-color: #daa520;
            background-color: rgba(218, 165, 32, 0.05);
        }
        
        .card-type-option.platinum.selected {
            border-color: #1e293b;
            background-color: rgba(30, 41, 59, 0.05);
        }
        
        .card-type-icon {
            text-align: center;
            font-size: 1.5rem;
        }
        
        .card-type-option.premium .card-type-icon {
            color: #0052cc;
        }
        
        .card-type-option.gold .card-type-icon {
            color: #daa520;
        }
        
        .card-type-option.platinum .card-type-icon {
            color: #1e293b;
        }
        
        .card-type-name {
            font-weight: 600;
            text-align: center;
            margin-bottom: 5px;
        }
        
        .card-type-features {
            font-size: 0.75rem;
            color: var(--gray-600);
            line-height: 1.4;
        }
        
        .card-details-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .card-details-header {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .card-meta {
            flex: 1;
            min-width: 300px;
        }
        
        .card-details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .card-details-table th, .card-details-table td {
            padding: 10px;
            border-bottom: 1px solid var(--gray-200);
            text-align: right;
        }
        
        .card-details-table th {
            font-weight: 600;
            width: 40%;
            color: var(--gray-700);
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .badge-platinum {
            background-color: rgba(30, 41, 59, 0.1);
            color: #1e293b;
        }
        
        .badge-gold {
            background-color: rgba(218, 165, 32, 0.1);
            color: #daa520;
        }
        
        .badge-premium {
            background-color: rgba(0, 82, 204, 0.1);
            color: #0052cc;
        }
        
        .card-details-stats {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .stat-card {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .stat-icon {
            color: var(--primary-color);
            font-size: 1.2rem;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .stat-title {
            font-size: 0.85rem;
            color: var(--gray-600);
        }
        
        .scanner-container {
            position: relative;
            width: 100%;
            height: 300px;
            overflow: hidden;
            border-radius: 10px;
            background-color: black;
        }
        
        #scanner-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .scanner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        
        .scanner-target {
            width: 200px;
            height: 200px;
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }
        
        .scanner-instructions {
            margin-top: 20px;
            color: white;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            font-weight: 500;
        }
        
        /* Media Queries for Responsiveness */
        @media (max-width: 768px) {
            .cards-grid {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
            
            .card-preview-large {
                width: 100%;
                height: 180px;
            }
            
            .card-details-header {
                flex-direction: column;
            }
            
            .card-type-options {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Initialize card system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add card system styles
    addCardSystemStyles();
    
    // Initialize investor card system
    initInvestorCardSystem();
    
    // Setup cards page
    setupCardsPage();
});

/**
 * Setup the investor cards page
 */
function setupCardsPage() {
    const investorCardsPage = document.getElementById('investorCards');
    if (!investorCardsPage) return;
    
    // Load cards when page is shown
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class' && investorCardsPage.classList.contains('active')) {
                loadInvestorCards();
            }
        });
    });
    
    observer.observe(investorCardsPage, { attributes: true });
}

// Add card system to any operation creation
const originalCreateOperation = window.createOperation;
if (typeof originalCreateOperation === 'function') {
    window.createOperation = function(data) {
        // Call original function
        const result = originalCreateOperation(data);
        
        // Add transaction to card if applicable
        if (result && data.investorId) {
            // Find all cards for this investor
            const investorCards = investorCardSystem.cards.filter(card => card.investorId === data.investorId && card.status === 'active');
            
            // Add transaction to all active cards
            investorCards.forEach(card => {
                addCardTransaction(card.id, data.id);
            });
        }
        
        return result;
    };
}
