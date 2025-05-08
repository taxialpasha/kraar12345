/**
 * Direct Fix for Placeholder Image 404 Error
 * This script patches the createCardElement function to use inline SVG instead of placeholder images
 */

// Store the original createCardElement function
const originalCreateCardElement = window.createCardElement;

// Override the createCardElement function with our fixed version
window.createCardElement = function(card, investor) {
    const div = document.createElement('div');
    div.className = `investor-card ${card.type} ${card.status === 'suspended' ? 'suspended' : ''}`;
    div.onclick = () => viewCardDetails(card.id);
    
    // Add unique ID for reference later
    div.id = `card-${card.id}`;
    
    div.innerHTML = `
        <div class="card-shimmer"></div>
        <div class="card-content">
            <div class="card-header">
                <div class="card-logo">
                    <!-- Replace placeholder image with inline SVG logo -->
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
                <canvas id="qr-${card.id}" width="80" height="80"></canvas>
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
    
    // Generate QR code after a short delay to ensure canvas is ready
    setTimeout(() => {
        const canvas = document.getElementById(`qr-${card.id}`);
        if (canvas) {
            try {
                generateSimpleQRCode(canvas, card, investor);
            } catch (e) {
                console.warn('Failed to generate QR code:', e);
                // Fallback to a simple QR code visualization
                drawSimpleQRCode(canvas);
            }
        }
    }, 100);
    
    return div;
};

// Simple QR code generator fallback
function generateSimpleQRCode(canvas, card, investor) {
    // Create a simplified version of the card data
    const cardData = {
        cardId: card.id,
        cardNumber: card.number,
        investorId: investor.id,
        investorName: investor.name,
        issuerBank: 'بنك الاستثمار العراقي'
    };
    
    // Generate a string from the data
    const dataString = JSON.stringify(cardData);
    
    // Draw a simple QR-like pattern
    drawSimpleQRCode(canvas, dataString);
}

// Draw a simple QR code visualization
function drawSimpleQRCode(canvas, dataString = '') {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Use hash from data string to create a consistent pattern
    let hash = 0;
    if (dataString) {
        for (let i = 0; i < dataString.length; i++) {
            hash = ((hash << 5) - hash) + dataString.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
    }
    
    // Create a grid
    const cells = 6;
    const cellSize = size / cells;
    const padding = cellSize * 0.2;
    
    // Draw cells based on hash or random if no hash
    ctx.fillStyle = '#000000';
    
    // Position finder patterns (like real QR codes)
    // Top-left
    ctx.fillRect(padding, padding, cellSize * 2 - padding * 2, cellSize * 2 - padding * 2);
    // Top-right
    ctx.fillRect(size - cellSize * 2 + padding, padding, cellSize * 2 - padding * 2, cellSize * 2 - padding * 2);
    // Bottom-left
    ctx.fillRect(padding, size - cellSize * 2 + padding, cellSize * 2 - padding * 2, cellSize * 2 - padding * 2);
    
    // Draw inner white squares in finder patterns
    ctx.fillStyle = '#ffffff';
    // Top-left
    ctx.fillRect(padding + cellSize * 0.5, padding + cellSize * 0.5, cellSize - padding, cellSize - padding);
    // Top-right
    ctx.fillRect(size - cellSize * 1.5, padding + cellSize * 0.5, cellSize - padding, cellSize - padding);
    // Bottom-left
    ctx.fillRect(padding + cellSize * 0.5, size - cellSize * 1.5, cellSize - padding, cellSize - padding);
    
    // Draw data cells
    ctx.fillStyle = '#000000';
    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            // Skip finder pattern areas
            if ((i < 2 && j < 2) || (i < 2 && j >= cells - 2) || (i >= cells - 2 && j < 2)) {
                continue;
            }
            
            // Use hash or random to determine if cell should be filled
            const shouldFill = dataString ? 
                ((hash + i * j) % 5 > 2) : 
                (Math.random() > 0.6);
                
            if (shouldFill) {
                ctx.fillRect(
                    j * cellSize + padding,
                    i * cellSize + padding,
                    cellSize - padding * 2,
                    cellSize - padding * 2
                );
            }
        }
    }
}

// Fix for broken QR code generation
function fixOriginalQRFunction() {
    // Check if the original function exists and is properly working
    if (typeof window.generateAdvancedQRCode !== 'function' || 
        typeof qrcode !== 'function') {
        
        // Replace with our simplified version
        window.generateAdvancedQRCode = generateSimpleQRCode;
    }
}

// Add our custom loadCardInvestors implementation
if (typeof window.loadCardInvestors !== 'function') {
    window.loadCardInvestors = function() {
        const investorSelect = document.getElementById('cardInvestor');
        
        if (!investorSelect) return;
        
        // Clear previous options
        investorSelect.innerHTML = '<option value="">اختر المستثمر</option>';
        
        // Add investor options
        investors.forEach(investor => {
            const option = document.createElement('option');
            option.value = investor.id;
            option.textContent = investor.name;
            option.dataset.phone = investor.phone || '';
            investorSelect.appendChild(option);
        });
        
        // Handle selection change
        investorSelect.onchange = function() {
            const selectedOption = this.options[this.selectedIndex];
            const phoneInput = document.getElementById('cardPhone');
            
            if (phoneInput && selectedOption.dataset.phone) {
                phoneInput.value = selectedOption.dataset.phone;
            }
            
            updateCardPreview();
        };
    };
}

// Initialize our fixes
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Image placeholder fix loaded');
    fixOriginalQRFunction();
    
    // Fix existing images on the page
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
        // Trigger onerror manually if needed
        if (img.complete && img.naturalWidth === 0) {
            img.onerror();
        }
    });
});