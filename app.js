let client;
let currentWallet;
let merchantEscrowWallet;
let commissionWallet;
let cashbackHistory = [];
let selectedProduct = null;
let escrowBalance = 0;
let escrowLockTime = 0;

// Commission settings
const COMMISSION_RATE = 0.02; // 2% commission on all transactions
const COMMISSION_ADDRESS = "rCommissionWallet1234567890"; // Demo commission wallet

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
    const commission = (selectedProduct.price * COMMISSION_RATE).toFixed(2);
    const total = (selectedProduct.price + parseFloat(tax) + shipping).toFixed(2);
    
    document.getElementById('orderProductName').textContent = selectedProduct.name;
    document.getElementById('orderProductPrice').textContent = `${selectedProduct.price.toFixed(2)}`;
    document.getElementById('orderTax').textContent = `${tax}`;
    document.getElementById('orderCommission').textContent = `${commission}`;
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
    
    // Initialize merchant-specific functionality
    setTimeout(() => {
        initializeMerchantEscrow();
        updateEscrowDisplay();
    }, 100);
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
    }
}

// Merchant Escrow Functions
async function initializeMerchantEscrow() {
    try {
        showMerchantStatus('🔐 Initializing merchant escrow account...', 'loading');
        
        const response = await fetch('/api/merchant/initialize-escrow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            merchantEscrowWallet = data.escrowWallet;
            escrowBalance = data.balance || 0;
            escrowLockTime = data.lockTime || 0;
            
            showMerchantStatus('✅ Merchant escrow account initialized!', 'success');
            updateEscrowDisplay();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error initializing escrow:', error);
        // Demo fallback
        merchantEscrowWallet = {
            address: 'rMerchantEscrow1234567890',
            balance: 500
        };
        escrowBalance = 500;
        escrowLockTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        showMerchantStatus('✅ Demo escrow account ready!', 'success');
        updateEscrowDisplay();
    }
}

function updateEscrowDisplay() {
    const escrowBalanceEl = document.getElementById('escrowBalance');
    const escrowAddressEl = document.getElementById('escrowAddress');
    const escrowLockTimeEl = document.getElementById('escrowLockTime');
    const escrowStatusEl = document.getElementById('escrowStatus');
    
    if (escrowBalanceEl) escrowBalanceEl.textContent = `${escrowBalance} XRP`;
    if (escrowAddressEl) escrowAddressEl.textContent = merchantEscrowWallet?.address || 'Not initialized';
    
    // Calculate and display lock time
    if (escrowLockTime > Date.now()) {
        const timeLeft = new Date(escrowLockTime - Date.now());
        const hours = Math.floor(timeLeft.getTime() / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft.getTime() % (1000 * 60 * 60)) / (1000 * 60));
        
        if (escrowLockTimeEl) escrowLockTimeEl.textContent = `${hours}h ${minutes}m remaining`;
        if (escrowStatusEl) {
            escrowStatusEl.innerHTML = '🔒 <strong>LOCKED</strong> - Funds secured in time-locked escrow';
            escrowStatusEl.className = 'escrow-status locked';
        }
    } else {
        if (escrowLockTimeEl) escrowLockTimeEl.textContent = 'Unlocked';
        if (escrowStatusEl) {
            escrowStatusEl.innerHTML = '🔓 <strong>UNLOCKED</strong> - Funds available for withdrawal';
            escrowStatusEl.className = 'escrow-status unlocked';
        }
    }
}

async function addFundsToEscrow() {
    const amount = prompt('Enter amount to add to escrow (XRP):');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        showMerchantStatus('💰 Adding funds to escrow...', 'loading');
        
        const response = await fetch('/api/merchant/add-escrow-funds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                lockHours: 24 // Lock for 24 hours
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            escrowBalance += parseFloat(amount);
            escrowLockTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            updateEscrowDisplay();
            showMerchantStatus(`✅ Added ${amount} XRP to escrow with 24h lock!`, 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error adding escrow funds:', error);
        // Demo success
        escrowBalance += parseFloat(amount);
        escrowLockTime = Date.now() + (24 * 60 * 60 * 1000);
        updateEscrowDisplay();
        showMerchantStatus(`✅ Demo: Added ${amount} XRP to escrow!`, 'success');
    }
}

async function withdrawFromEscrow() {
    if (escrowLockTime > Date.now()) {
        alert('Cannot withdraw: Funds are still locked in escrow!');
        return;
    }
    
    const amount = prompt(`Enter amount to withdraw (Available: ${escrowBalance} XRP):`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > escrowBalance) {
        alert('Please enter a valid amount within available balance');
        return;
    }
    
    try {
        showMerchantStatus('💸 Processing withdrawal...', 'loading');
        
        escrowBalance -= parseFloat(amount);
        updateEscrowDisplay();
        showMerchantStatus(`✅ Withdrew ${amount} XRP from escrow!`, 'success');
    } catch (error) {
        console.error('Error withdrawing from escrow:', error);
        showMerchantStatus('❌ Withdrawal failed', 'error');
    }
}

// Commission Account Functions
async function initializeCommissionAccount() {
    try {
        const response = await fetch('/api/commission/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            commissionWallet = data.commissionWallet;
            console.log('Commission account initialized:', commissionWallet.address);
        }
    } catch (error) {
        console.error('Error initializing commission account:', error);
        // Demo fallback
        commissionWallet = {
            address: COMMISSION_ADDRESS,
            balance: 0
        };
    }
}

// Enhanced product management with commission
let products = [
    { name: 'Nike Air Max 270', price: 100, cashback: 5 },
    { name: 'Apple AirPods Pro', price: 249, cashback: 8 },
    { name: 'Samsung Galaxy Watch', price: 329.99, cashback: 6 },
    { name: 'MacBook Air M2', price: 1199, cashback: 4 },
    { name: 'Sony WH-1000XM5', price: 399.99, cashback: 7 },
    { name: 'iPhone 15 Pro', price: 999, cashback: 3 },
    { name: 'Nintendo Switch OLED', price: 349.99, cashback: 5 },
    { name: 'Adidas Ultraboost 22', price: 180, cashback: 6 }
];

function addFunds() {
    addFundsToEscrow();
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
        showMerchantStatus(`✅ ${productName} cashback updated to ${newRate}%`, 'success');
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

// Enhanced payment processing with commission
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
        
        showStatus('✅ Payment successful! Processing cashback & commission...', 'loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send cashback payment and commission
        await sendCashbackWithCommission(walletAddress);
        
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
        
        // Initialize commission account
        await initializeCommissionAccount();
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

// Enhanced cashback with commission processing
async function sendCashbackWithCommission(destinationAddress) {
    try {
        if (!selectedProduct) {
            throw new Error('No product selected');
        }
        
        const commissionAmount = (selectedProduct.price * COMMISSION_RATE).toFixed(2);
        
        const response = await fetch('/api/send-cashback-with-commission', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destination: destinationAddress,
                cashbackAmount: selectedProduct.cashbackAmount.toString(),
                commissionAmount: commissionAmount,
                product: selectedProduct.name,
                productPrice: selectedProduct.price
            })
        });

        const data = await response.json();
        
        if (data.success) {
            const isReal = data.real === true;
            const statusMessage = isReal ? 
                '🎉 Real XRPL transactions successful! Cashback & commission processed.' :
                '🎉 Demo transactions completed! Valid XRPL hash format generated.';
            
            showTransactionSuccess(
                data.cashbackTxHash, 
                selectedProduct.cashbackAmount.toString(), 
                destinationAddress, 
                data.commissionTxHash, 
                commissionAmount,
                isReal
            );
            addToCashbackHistory(selectedProduct.cashbackAmount.toString(), data.cashbackTxHash, selectedProduct.name);
            showStatus(statusMessage, 'success');
            
            // Update escrow balance (deduct cashback)
            if (escrowBalance >= selectedProduct.cashbackAmount) {
                escrowBalance -= selectedProduct.cashbackAmount;
                updateEscrowDisplay();
            }
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Cashback error:', error);
        showStatus('❌ Transaction failed: ' + error.message, 'error');
    }
}

// Enhanced transaction success display
function showTransactionSuccess(cashbackTxHash, cashbackAmount, destination, commissionTxHash, commissionAmount, isReal = false) {
    const realBadge = isReal ? 
        '<span class="real-tx-badge">🟢 REAL XRPL TRANSACTION</span>' : 
        '<span class="demo-tx-badge">🟡 DEMO TRANSACTION</span>';
    
    const detailsHtml = `
        <div class="transaction-details">
            <h3>🎉 Transaction Successful! ${realBadge}</h3>
            
            <div class="transaction-group">
                <h4>💰 Cashback Payment</h4>
                <p><strong>Amount:</strong> ${cashbackAmount} XRP</p>
                <p><strong>Destination:</strong> ${destination.substring(0, 20)}...</p>
                <p><strong>Transaction Hash:</strong></p>
                <div class="transaction-hash">${cashbackTxHash}</div>
                <a href="https://testnet.xrpl.org/transactions/${cashbackTxHash}" target="_blank" class="explorer-link">
                    🔍 View Cashback on XRPL Explorer
                </a>
            </div>
            
            <div class="transaction-group">
                <h4>🏢 Commission Payment</h4>
                <p><strong>Amount:</strong> ${commissionAmount} XRP (${(COMMISSION_RATE * 100)}%)</p>
                <p><strong>Destination:</strong> Commission Account</p>
                <p><strong>Transaction Hash:</strong></p>
                <div class="transaction-hash">${commissionTxHash}</div>
                <a href="https://testnet.xrpl.org/transactions/${commissionTxHash}" target="_blank" class="explorer-link">
                    🔍 View Commission on XRPL Explorer
                </a>
            </div>
            
            ${!isReal ? '<div class="demo-note">💡 Demo mode: Transactions simulated with valid XRPL hash format for demonstration purposes.</div>' : ''}
        </div>
    `;
    
    const transactionDetails = document.getElementById('transactionDetails');
    if (transactionDetails) {
        transactionDetails.innerHTML = detailsHtml;
    }
}

// Send cashback payment (legacy function for compatibility)
async function sendCashback(destinationAddress) {
    // Redirect to enhanced function
    return sendCashbackWithCommission(destinationAddress);
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

// Show merchant status messages
function showMerchantStatus(message, type) {
    const statusDiv = document.getElementById('merchantStatusDisplay');
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
    
    // Update escrow display every minute
    setInterval(updateEscrowDisplay, 60000);
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