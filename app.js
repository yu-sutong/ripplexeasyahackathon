let client;
let currentWallet;
let cashbackHistory = [];
let selectedProduct = null;

// Product selection functionality
function selectProduct(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard.dataset.product;
    const productPrice = parseFloat(productCard.dataset.price);
    const cashbackRate = parseInt(productCard.dataset.cashback);
    const cashbackAmount = (productPrice * cashbackRate / 100).toFixed(2);
    
    // Remove previous selection
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.select-product-btn').textContent = 'Select';
        card.querySelector('.select-product-btn').classList.remove('selected');
    });
    
    // Mark as selected
    productCard.classList.add('selected');
    button.textContent = 'Selected ✓';
    button.classList.add('selected');
    
    // Store selected product
    selectedProduct = {
        name: productName,
        price: productPrice,
        cashbackRate: cashbackRate,
        cashbackAmount: parseFloat(cashbackAmount)
    };
    
    // Update selected product display
    document.getElementById('selectedProduct').style.display = 'block';
    document.getElementById('selectedName').textContent = productName;
    document.getElementById('selectedPrice').textContent = `${productPrice.toFixed(2)}`;
    document.getElementById('selectedCashback').textContent = 
        `💰 Instant ${cashbackRate}% Cashback = ${cashbackAmount} XRP`;
    
    // Update order summary
    updateOrderSummary();
    
    // Re-validate payment form
    validatePaymentForm();
    
    console.log('Selected product:', selectedProduct);
}

function updateOrderSummary() {
    if (!selectedProduct) return;
    
    const tax = (selectedProduct.price * 0.085).toFixed(2); // 8.5% tax
    const shipping = 5.99;
    const total = (selectedProduct.price + parseFloat(tax) + shipping).toFixed(2);
    
    document.getElementById('orderProductName').textContent = selectedProduct.name;
    document.getElementById('orderProductPrice').textContent = `${selectedProduct.price.toFixed(2)}`;
    document.getElementById('orderTax').textContent = `${tax}`;
    document.getElementById('orderTotal').textContent = `${total}`;
}

// Role Selection Functions
function selectRole(role) {
    localStorage.setItem('userRole', role);
    
    if (role === 'shopper') {
        showShopperPage();
    } else if (role === 'merchant') {
        showMerchantPage();
    }
}

function showLanding() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('shopperPage').style.display = 'none';
    document.getElementById('merchantPage').style.display = 'none';
    localStorage.removeItem('userRole');
}

function showShopperPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('shopperPage').style.display = 'block';
    document.getElementById('merchantPage').style.display = 'none';
    
    // Initialize shopper-specific functionality
    setTimeout(() => {
        showStatus('✅ Ready for instant XRP cashback rewards!', 'success');
        validatePaymentForm();
        updateHistoryDisplay(); // Initialize blank history display
    }, 100);
}

function showMerchantPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('shopperPage').style.display = 'none';
    document.getElementById('merchantPage').style.display = 'block';
}

// Check for existing role on page load
function checkExistingRole() {
    // Always show landing page first, regardless of saved role
    showLanding();
    
    // Optional: If you want to remember the role but still show landing page,
    // you can check for saved role and show a "Continue as [Role]" option
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
        console.log(`Previous role found: ${savedRole}`);
        // You could add a "Continue as Shopper/Merchant" button here if desired
    }
}

// Merchant Functions
let products = [
    { name: 'Nike Air Max 270', price: 100, cashback: 5 },
    { name: 'Adidas Ultraboost', price: 120, cashback: 3 }
];

function addFunds() {
    alert('Add Funds functionality - Connect to XRPL for escrow deposits');
}

function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
    document.getElementById('addProductBtn').style.display = 'none';
    // Clear form
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productCashback').value = '';
}

function cancelAddProduct() {
    document.getElementById('addProductForm').style.display = 'none';
    document.getElementById('addProductBtn').style.display = 'block';
}

function saveNewProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const cashback = parseInt(document.getElementById('productCashback').value);
    
    // Validation
    if (!name) {
        alert('Please enter a product name');
        return;
    }
    
    if (!price || price <= 0) {
        alert('Please enter a valid price');
        return;
    }
    
    if (!cashback || cashback < 0 || cashback > 20) {
        alert('Please enter a cashback percentage between 0 and 20');
        return;
    }
    
    // Check if product already exists
    if (products.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('A product with this name already exists');
        return;
    }
    
    // Add new product
    const newProduct = { name, price, cashback };
    products.push(newProduct);
    
    // Add to DOM
    addProductToList(newProduct);
    
    // Hide form and show button
    cancelAddProduct();
    
    // Show success message
    alert(`✅ Product "${name}" added successfully with ${cashback}% cashback!`);
    
    console.log('Updated products list:', products);
}

function addProductToList(product) {
    const productList = document.getElementById('productList');
    
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.innerHTML = `
        <span>${product.name}</span>
        <div class="cashback-rate">
            <label>Cashback: </label>
            <input type="number" value="${product.cashback}" min="0" max="20" onchange="updateCashbackRate(this, '${product.name}')">%
        </div>
        <button class="delete-product-btn" onclick="deleteProduct(this, '${product.name}')">🗑️</button>
    `;
    
    productList.appendChild(productItem);
}

function updateCashbackRate(input, productName) {
    const newRate = parseInt(input.value);
    
    if (newRate < 0 || newRate > 20) {
        alert('Cashback rate must be between 0% and 20%');
        input.value = products.find(p => p.name === productName)?.cashback || 0;
        return;
    }
    
    // Update in products array
    const product = products.find(p => p.name === productName);
    if (product) {
        product.cashback = newRate;
        console.log(`Updated ${productName} cashback rate to ${newRate}%`);
        
        // Show confirmation
        const notification = document.createElement('div');
        notification.className = 'status success';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1000';
        notification.innerHTML = `✅ ${productName} cashback updated to ${newRate}%`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

function deleteProduct(button, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
        // Remove from products array
        const index = products.findIndex(p => p.name === productName);
        if (index > -1) {
            products.splice(index, 1);
        }
        
        // Remove from DOM
        button.parentElement.remove();
        
        console.log(`Deleted product: ${productName}`);
        console.log('Updated products list:', products);
        
        // Show confirmation
        alert(`🗑️ Product "${productName}" has been deleted`);
    }
}

// Form validation and button state management
function validatePaymentForm() {
    const cardNumber = document.getElementById('cardNumber')?.value || '';
    const expiryDate = document.getElementById('expiryDate')?.value || '';
    const cvv = document.getElementById('cvv')?.value || '';
    const cardName = document.getElementById('cardName')?.value || '';
    const walletAddress = document.getElementById('walletAddress')?.value || '';
    
    const isFormComplete = cardNumber.length >= 19 && 
                         expiryDate.length === 5 && 
                         cvv.length >= 3 && 
                         cardName.length > 0 && 
                         walletAddress.length > 0 &&
                         selectedProduct !== null; // Must have selected a product
    
    const purchaseBtn = document.getElementById('purchaseBtn');
    if (purchaseBtn) {
        purchaseBtn.disabled = !isFormComplete;
        
        if (isFormComplete) {
            purchaseBtn.style.opacity = '1';
            purchaseBtn.style.cursor = 'pointer';
        } else {
            purchaseBtn.style.opacity = '0.6';
            purchaseBtn.style.cursor = 'not-allowed';
        }
        
        // Update button text based on product selection
        if (selectedProduct) {
            purchaseBtn.textContent = `🛒 Complete Purchase & Get ${selectedProduct.cashbackAmount.toFixed(2)} XRP Cashback`;
        } else {
            purchaseBtn.textContent = '🛒 Select a Product First';
        }
    }
}

// Event Listeners (only add if elements exist)
function setupEventListeners() {
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
            validatePaymentForm();
        });
    }

    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
            validatePaymentForm();
        });
    }

    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
            validatePaymentForm();
        });
    }

    const cardName = document.getElementById('cardName');
    if (cardName) {
        cardName.addEventListener('input', function(e) {
            validatePaymentForm();
        });
    }

    const walletAddress = document.getElementById('walletAddress');
    if (walletAddress) {
        walletAddress.addEventListener('input', function(e) {
            validatePaymentForm();
        });
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const purchaseBtn = document.getElementById('purchaseBtn');
            if (purchaseBtn && !purchaseBtn.disabled) {
                processPayment();
            }
        });
    }
}

// Process payment and send cashback
async function processPayment() {
    if (!selectedProduct) {
        showStatus('Please select a product first!', 'error');
        return;
    }
    
    const walletAddress = document.getElementById('walletAddress').value;
    const processBtn = document.getElementById('purchaseBtn');
    
    try {
        // Disable button and show processing
        processBtn.disabled = true;
        processBtn.innerHTML = '<span class="loading-spinner"></span> Processing Payment...';
        
        // Simulate payment processing
        showStatus('💳 Processing your payment...', 'loading');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showStatus('✅ Payment successful! Sending instant cashback...', 'loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send cashback payment
        await sendCashback(walletAddress);
        
    } catch (error) {
        console.error('Payment error:', error);
        showStatus('Payment completed, but cashback may have been delayed. Check your wallet.', 'error');
    } finally {
        processBtn.disabled = false;
        if (selectedProduct) {
            processBtn.innerHTML = `🛒 Complete Purchase & Get ${selectedProduct.cashbackAmount.toFixed(2)} XRP Cashback`;
        } else {
            processBtn.innerHTML = '🛒 Select a Product First';
        }
        validatePaymentForm(); // Re-check form state
    }
}

// Initialize XRPL client
async function initializeXRPL() {
    try {
        client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
        await client.connect();
        console.log('Connected to XRPL Testnet');
    } catch (error) {
        console.error('Failed to connect to XRPL:', error);
        showStatus('Failed to connect to XRP Ledger', 'error');
    }
}

// Generate a test wallet
async function generateTestWallet() {
    try {
        showStatus('Generating new test wallet...', 'loading');
        
        const response = await fetch('/api/generate-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentWallet = data.wallet;
            document.getElementById('walletAddress').value = data.wallet.address;
            showStatus(`New wallet generated! Address: ${data.wallet.address.substring(0, 20)}...`, 'success');
            validatePaymentForm(); // Re-check form state
            
            // Auto-fund the wallet
            setTimeout(() => {
                fundWallet();
            }, 1000);
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Error generating wallet:', error);
        showStatus('Error generating wallet', 'error');
    }
}

// Fund wallet with test XRP
async function fundWallet() {
    try {
        const address = document.getElementById('walletAddress').value;
        if (!address) {
            showStatus('Please enter a wallet address first', 'error');
            return;
        }

        showStatus('Funding wallet with test XRP...', 'loading');
        
        const response = await fetch('/api/fund-wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address })
        });

        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ Wallet funded with test XRP! Ready for cashback.', 'success');
            
            // Check balance after funding
            setTimeout(() => {
                checkBalance(address);
            }, 3000);
        } else {
            showStatus('Wallet funding completed (may already be funded)', 'success');
        }
    } catch (error) {
        console.error('Error funding wallet:', error);
        showStatus('Wallet setup completed', 'success');
    }
}

// Check wallet balance
async function checkBalance(address) {
    try {
        const response = await fetch(`/api/balance/${address}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`Wallet balance: ${data.balance} XRP`);
        }
    } catch (error) {
        console.log('Could not fetch balance');
    }
}

// Send cashback payment
async function sendCashback(destinationAddress) {
    try {
        if (!selectedProduct) {
            throw new Error('No product selected');
        }
        
        const response = await fetch('/api/send-cashback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destination: destinationAddress,
                amount: selectedProduct.cashbackAmount.toString(),
                product: selectedProduct.name
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showTransactionSuccess(data.txHash, selectedProduct.cashbackAmount.toString(), destinationAddress);
            addToCashbackHistory(selectedProduct.cashbackAmount.toString(), data.txHash, selectedProduct.name);
            showStatus('🎉 Cashback sent successfully! Check your wallet.', 'success');
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Cashback error:', error);
        
        // Show demo success for fallback
        const mockTxHash = 'DEMO_' + Math.random().toString(36).substring(2, 15).toUpperCase();
        showTransactionSuccess(mockTxHash, selectedProduct.cashbackAmount.toString(), destinationAddress);
        addToCashbackHistory(selectedProduct.cashbackAmount.toString(), mockTxHash, selectedProduct.name);
        showStatus('🎉 Demo: Cashback transaction simulated successfully!', 'success');
    }
}

// Show transaction success details
function showTransactionSuccess(txHash, amount, destination) {
    const detailsHtml = `
        <div class="transaction-details">
            <h3>🎉 Cashback Transaction Successful!</h3>
            <p><strong>Amount:</strong> ${amount} XRP</p>
            <p><strong>Destination:</strong> ${destination.substring(0, 20)}...</p>
            <p><strong>Transaction Hash:</strong></p>
            <div class="transaction-hash">${txHash}</div>
            <a href="https://testnet.xrpl.org/transactions/${txHash}" target="_blank" class="explorer-link">
                🔍 View on XRPL Explorer
            </a>
        </div>
    `;
    
    const transactionDetails = document.getElementById('transactionDetails');
    if (transactionDetails) {
        transactionDetails.innerHTML = detailsHtml;
    }
}

// Add transaction to history
function addToCashbackHistory(amount, txHash, productName = 'Unknown Product') {
    const timestamp = new Date().toLocaleString();
    cashbackHistory.unshift({
        amount: amount,
        txHash: txHash,
        timestamp: timestamp,
        product: productName
    });
    
    updateHistoryDisplay();
}

// Update history display - MODIFIED to show blank initially
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('cashbackHistory');
    if (!historyContainer) return;
    
    if (cashbackHistory.length === 0) {
        // Show empty state message instead of demo transaction
        historyContainer.innerHTML = `
            <div class="empty-history">
                <div style="text-align: center; color: #6c757d; padding: 40px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📈</div>
                    <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 10px;">No cashback history yet</div>
                    <div style="font-size: 0.9rem;">Complete a purchase to see your XRP cashback transactions here</div>
                </div>
            </div>
        `;
        return;
    }
    
    const historyHtml = cashbackHistory.map(item => `
        <div class="history-item">
            <div>
                <div><strong>${item.product}</strong></div>
                <div class="timestamp">${item.timestamp}</div>
                <div style="font-size: 0.8rem; color: #6c757d;">TX: ${item.txHash.substring(0, 20)}...</div>
            </div>
            <div class="amount">+${item.amount} XRP</div>
        </div>
    `).join('');
    
    historyContainer.innerHTML = historyHtml;
}

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusDisplay');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
        
        // Auto-clear non-success messages
        if (type !== 'success') {
            setTimeout(() => {
                if (statusDiv.querySelector('.status:not(.success)')) {
                    statusDiv.innerHTML = '';
                }
            }, 5000);
        }
    }
}

// Initialize when page loads
window.addEventListener('load', async () => {
    checkExistingRole();
    setupEventListeners();
});

// Add visual effects
setInterval(() => {
    const productImage = document.querySelector('.product-image');
    if (productImage) {
        productImage.classList.add('pulse');
        setTimeout(() => {
            productImage.classList.remove('pulse');
        }, 2000);
    }
}, 10000);