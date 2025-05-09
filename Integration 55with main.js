/**
 * Integration code to connect the Investor Card System with the main application
 * This file includes event dispatchers and hooks to connect card system with the main app's operations
 */

// Event Dispatchers for card transactions
document.addEventListener('DOMContentLoaded', function() {
    setupInvestorCardEvents();
});

/**
 * Set up event dispatchers for investor card transactions
 */
function setupInvestorCardEvents() {
    // Listen for the original save functions and dispatch events for the card system
    
    // Investment event
    const originalSaveInvestment = window.saveInvestment;
    if (originalSaveInvestment) {
        window.saveInvestment = function() {
            // Call original function first
            const result = originalSaveInvestment.apply(this, arguments);
            
            // Get investment details
            const investorId = document.getElementById('investmentInvestor').value;
            const amount = parseFloat(document.getElementById('investmentAmount').value);
            
            // Dispatch event for card system
            const event = new CustomEvent('investmentAdded', { 
                detail: { 
                    investorId, 
                    amount,
                    type: 'investment',
                    date: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
            
            return result;
        };
    }
    
    // Withdrawal event
    const originalSaveWithdrawal = window.saveWithdrawal;
    if (originalSaveWithdrawal) {
        window.saveWithdrawal = function() {
            // Call original function first
            const result = originalSaveWithdrawal.apply(this, arguments);
            
            // Get withdrawal details
            const investorId = document.getElementById('withdrawInvestor').value;
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            
            // Dispatch event for card system
            const event = new CustomEvent('withdrawalMade', { 
                detail: { 
                    investorId, 
                    amount,
                    type: 'withdrawal',
                    date: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
            
            return result;
        };
    }
    
    // Profit payment event
    const originalSavePayProfit = window.savePayProfit;
    if (originalSavePayProfit) {
        window.savePayProfit = function() {
            // Call original function first
            const result = originalSavePayProfit.apply(this, arguments);
            
            // Get profit payment details
            const investorId = document.getElementById('profitInvestor').value;
            const amount = parseFloat(document.getElementById('profitAmount').value);
            
            // Dispatch event for card system
            const event = new CustomEvent('profitPaid', { 
                detail: { 
                    investorId, 
                    amount,
                    type: 'profit',
                    date: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
            
            return result;
        };
    }
    
    // Handle approval event
    const originalApproveOperation = window.approveOperation;
    if (originalApproveOperation) {
        window.approveOperation = function(id) {
            // Find operation before approval
            const operation = operations.find(op => op.id === id);
            const investorId = operation ? operation.investorId : null;
            const amount = operation ? operation.amount : 0;
            const type = operation ? operation.type : '';
            
            // Call original function
            const result = originalApproveOperation.apply(this, arguments);
            
            // Dispatch event for card system if the operation is relevant
            if (investorId && ['investment', 'withdrawal', 'profit'].includes(type)) {
                const event = new CustomEvent('operationApproved', { 
                    detail: { 
                        operationId: id,
                        investorId, 
                        amount,
                        type,
                        date: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            }
            
            return result;
        };
    }
}

/**
 * Setup QR Scanner functionality
 */
function initQRScanner() {
    // Add QR scanning capability
    if (window.ZXing || window.Html5QrcodeScanner) {
        // Using a QR scanning library like ZXing or Html5QrcodeScanner
        console.log("QR scanning library available");
    } else {
        console.log("No QR scanning library available, using basic implementation");
        
        // If no library is available, we'll create a simple function to simulate scanning
        window.scanQRCode = function(callback) {
            // This is a placeholder - in a real implementation, you would use a proper QR code scanner
            // For now, we'll just prompt the user to enter a card ID
            setTimeout(() => {
                const cardId = prompt("Enter card ID (simulating QR scan):");
                if (cardId && callback) {
                    callback(cardId);
                }
            }, 1000);
        };
    }
}

/**
 * Add card tab to sidebar menu 
 * This ensures the sidebar menu has a link to the investor cards page
 */
function addCardTabToMenu() {
    // Check if the investor cards menu item already exists
    if (document.querySelector('.menu-item[href="#investorCards"]')) {
        return; // Already exists
    }
    
    const sidebar = document.querySelector('.sidebar-menu');
    if (!sidebar) return;
    
    // Find the appropriate section to add the menu item
    const investmentSection = Array.from(sidebar.querySelectorAll('.menu-category')).find(
        cat => cat.textContent.includes('إدارة الاستثمار')
    );
    
    if (investmentSection) {
        const menuItem = document.createElement('a');
        menuItem.href = '#investorCards';
        menuItem.className = 'menu-item';
        menuItem.onclick = () => showPage('investorCards');
        menuItem.innerHTML = `
            <span class="menu-icon"><i class="fas fa-credit-card"></i></span>
            <span>بطاقات المستثمرين</span>
        `;
        
        // Add the menu item after the investors link
        const investorsLink = sidebar.querySelector('a[href="#investors"]');
        if (investorsLink && investorsLink.parentNode) {
            investorsLink.parentNode.insertBefore(menuItem, investorsLink.nextSibling);
        } else {
            // If investors link not found, add to the end of investment section
            const nextSection = investmentSection.nextElementSibling;
            if (nextSection) {
                sidebar.insertBefore(menuItem, nextSection);
            } else {
                sidebar.appendChild(menuItem);
            }
        }
    }
}

// Add the Firebase hooks to save and load cards
let firebaseHooksInitialized = false;

/**
 * Initialize Firebase hooks for investor cards
 */
function initFirebaseHooks() {
    if (firebaseHooksInitialized) return;
    
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
            // Set up Firebase listeners for card system
            const db = firebase.database();
            
            // Listen for investor changes to update cards
            const investorsRef = db.ref('investors');
            investorsRef.on('child_changed', snapshot => {
                const investor = snapshot.val();
                investor.id = snapshot.key;
                
                // Update investor name on cards if needed
                updateInvestorCardsAfterChange(investor);
            });
            
            // Listen for operation changes to update card transactions
            const operationsRef = db.ref('operations');
            operationsRef.on('child_added', snapshot => {
                const operation = snapshot.val();
                operation.id = snapshot.key;
                
                // Add operation to relevant card
                addOperationToCard(operation);
            });
            
            firebaseHooksInitialized = true;
            console.log("Firebase hooks initialized for investor card system");
        } catch (error) {
            console.error("Error initializing Firebase hooks for card system:", error);
        }
    }
}

/**
 * Update investor cards after investor data changes
 * @param {Object} investor - The updated investor data
 */
function updateInvestorCardsAfterChange(investor) {
    if (!investor || !investor.id) return;
    
    // Find cards for this investor
    const cards = window.investorCardSystem?.cards || [];
    const investorCards = cards.filter(card => card.investorId === investor.id);
    
    if (investorCards.length === 0) return;
    
    // Update the card display if the investor page is currently active
    if (document.getElementById('investorCards').classList.contains('active')) {
        // Refresh the current view
        const activeTab = document.querySelector('.cards-menu-item.active');
        if (activeTab) {
            const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
            displayCards(tabId);
        }
    }
}

/**
 * Add an operation to relevant investor card
 * @param {Object} operation - The operation data
 */
function addOperationToCard(operation) {
    if (!operation || !operation.investorId || !['investment', 'withdrawal', 'profit'].includes(operation.type)) {
        return;
    }
    
    // Find active card for this investor
    const cards = window.investorCardSystem?.cards || [];
    const card = cards.find(c => c.investorId === operation.investorId && c.status === 'active');
    
    if (!card) return;
    
    // Check if operation is already recorded
    if (card.transactions && card.transactions.some(t => t.id === operation.id)) {
        return; // Already recorded
    }
    
    // Create transaction object
    const transaction = {
        id: operation.id,
        date: operation.date,
        type: operation.type,
        amount: operation.amount,
        description: operation.notes || getOperationTypeName(operation.type),
        status: operation.status
    };
    
    // Add transaction to card
    if (!card.transactions) card.transactions = [];
    card.transactions.push(transaction);
    
    // Update transaction count
    card.transactionCount = (card.transactionCount || 0) + 1;
    
    // Update last used timestamp
    card.lastUsed = new Date().toISOString();
    
    // Save cards
    if (typeof saveCardsToFirebase === 'function') {
        saveCardsToFirebase();
    }
}

// Add investor card system to the window object for global access
window.investorCardSystem = window.investorCardSystem || {
    cards: [],
    currentCardId: null,
    initSystem: function() {
        if (typeof initInvestorCardSystem === 'function') {
            initInvestorCardSystem();
        }
        
        // Add card tab to menu
        addCardTabToMenu();
        
        // Initialize Firebase hooks
        initFirebaseHooks();
        
        console.log("Investor Card System initialized");
    }
};

// Initialize system when window loads
window.addEventListener('load', function() {
    // Delay initialization to ensure all other scripts are loaded
    setTimeout(() => {
        window.investorCardSystem.initSystem();
    }, 1000);
});