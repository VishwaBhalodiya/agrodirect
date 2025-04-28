document.addEventListener("DOMContentLoaded", function() {
    checkAuthState();
    displayCart();
});

function checkAuthState() {
    const token = localStorage.getItem('agroToken');
    const userDropdown = document.getElementById('userDropdown');
    const loginButton = document.getElementById('loginButton');
    const userNameDisplay = document.getElementById('userNameDisplay');

    if (token) {
        userDropdown.style.display = 'block';
        loginButton.style.display = 'none';
        userNameDisplay.textContent = 'Account';
    } else {
        userDropdown.style.display = 'none';
        loginButton.style.display = 'block';
    }
}

async function displayCart() {
    const token = localStorage.getItem('agroToken');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummaryContainer = document.getElementById('cart-summary-container');
    const emptyCartElement = document.getElementById('empty-cart');

    if (!token) {
        emptyCartElement.style.display = 'block';
        cartSummaryContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch cart');
        }
        
        const { cart } = await response.json();
        
        if (!cart || cart.length === 0) {
            emptyCartElement.style.display = 'block';
            cartSummaryContainer.innerHTML = '';
        } else {
            emptyCartElement.style.display = 'none';
            renderCartUI(cart);
        }
    } catch (err) {
        console.error("Error loading cart:", err);
        showErrorToast('Failed to load cart: ' + err.message);
        emptyCartElement.style.display = 'block';
        cartSummaryContainer.innerHTML = '';
    }
}

function renderCartUI(cart) {
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSummaryContainer = document.getElementById('cart-summary-container');
let cartItemsHTML = '';
let subtotal = 0;

cart.forEach((item) => {
let itemTotal;
let itemDetails = '';

// Handle different item types
if (item.type === 'sapling') {
    itemTotal = item.price * item.quantity;
    itemDetails = `
        <p class="text-muted">Price: ₹${item.price} per sapling</p>
        ${item.age ? `<p class="text-muted">Age: ${formatAge(item.age)}</p>` : ''}
        ${item.size ? `<p class="text-muted">Size: ${formatSize(item.size)}</p>` : ''}
    `;
} else if (item.type === 'oil') {
    // Handle oil items
    itemTotal = item.price * item.quantity;
    itemDetails = `
        <p class="text-muted">Price: ₹${item.price} per ${item.unit}</p>
        ${item.oilType ? `<p class="text-muted">Type: ${formatOilType(item.oilType)}</p>` : ''}
    `;
} else {
    // Handle regular items
    const quantityInKg = item.unit === 'g' ? item.quantity / 1000 : item.quantity;
    itemTotal = item.price * quantityInKg;
    itemDetails = `<p class="text-muted">Price: ₹${item.price} / ${item.unit}</p>`;
}

subtotal += itemTotal;

cartItemsHTML += `
    <div class="cart-item mb-3 p-3 border rounded">
        <div class="row align-items-center">
            <div class="col-md-5">
                <h5 class="cart-item-name mb-2">${item.name}</h5>
                ${itemDetails}
            </div>
            <div class="col-md-4">
                <div class="d-flex align-items-center quantity-selector">
                    <button class="btn btn-sm btn-outline-secondary" 
                        onclick="updateQuantity('${item._id}', ${item.type === 'sapling' || item.type === 'oil' ? -1 : -0.1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="form-control quantity-input mx-2 text-center" 
                        value="${item.quantity}" 
                        min="${item.type === 'sapling' || item.type === 'oil' ? 1 : 0.1}" 
                        step="${item.type === 'sapling' || item.type === 'oil' ? 1 : 0.1}"
                        onchange="updateItemQuantity('${item._id}', this.value)">
                    <span class="text-muted">${item.type === 'sapling' ? 'sapling(s)' : item.unit}</span>
                </div>
            </div>
            <div class="col-md-2 text-end">
                <p class="fw-bold mb-0">₹${itemTotal.toFixed(2)}</p>
            </div>
            <div class="col-md-1 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="removeItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
`;
});

// Rest of the function remains the same...
    cartItemsContainer.innerHTML = cartItemsHTML;

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    cartSummaryContainer.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h4 class="card-title summary-title mb-4">Order Summary</h4>
                <div class="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee === 0 ? 'Free' : '₹' + deliveryFee.toFixed(2)}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between fw-bold mb-3">
                    <span>Total</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
                ${deliveryFee > 0 ? 
                    `<p class="text-muted small text-center mb-3">Add ₹${(500 - subtotal).toFixed(2)} more for free delivery</p>` : 
                    '<p class="text-success small text-center mb-3">You qualify for free delivery!</p>'}
                <button class="btn btn-success w-100 py-2 checkout-btn" onclick="checkout()">
                    Proceed to Checkout <i class="fas fa-arrow-right ms-2"></i>
                </button>
            </div>
        </div>
    `;
}

function formatAge(age) {
    return age.includes('year') ? age.replace('year', ' year') : age.replace('months', ' months');
}

function formatSize(size) {
    const sizeMap = {
        'small': 'Small (1-2 ft)',
        'medium': 'Medium (2-4 ft)',
        'large': 'Large (4-6 ft)'
    };
    return sizeMap[size] || size;
}

async function updateQuantity(itemId, change) {
    const token = localStorage.getItem('agroToken');
    if (!token) {
        showErrorToast('Please login to update cart');
        return;
    }

    try {
        // First get current cart to find the item
        const cartResponse = await fetch('http://localhost:5000/api/cart', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!cartResponse.ok) {
            const errorData = await cartResponse.json();
            throw new Error(errorData.message || 'Failed to fetch cart for update');
        }
        
        const { cart } = await cartResponse.json();
        const item = cart.find(item => item._id === itemId);
        
        if (!item) throw new Error('Item not found in cart');
        
        let newQuantity;
        if (item.type === 'sapling') {
            newQuantity = parseInt(item.quantity) + change;
            if (newQuantity < 1) {
                showErrorToast('Minimum quantity is 1 sapling');
                return;
            }
        } else {
            newQuantity = parseFloat(item.quantity) + change;
            if (newQuantity < 0.1) {
                showErrorToast('Minimum quantity is 0.1');
                return;
            }
        }

        // Now update the quantity
        const response = await fetch('http://localhost:5000/api/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                itemId: itemId,
                newQuantity: newQuantity
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update quantity');
        }

        showSuccessToast('Quantity updated successfully');
        displayCart(); // Refresh the cart
    } catch (err) {
        console.error("Error updating quantity:", err);
        showErrorToast('Failed to update quantity: ' + err.message);
    }
}

async function updateQuantity(itemId, change) {
const token = localStorage.getItem('agroToken');
if (!token) {
showErrorToast('Please login to update cart');
return;
}

try {
// First get current cart to find the item
const cartResponse = await fetch('http://localhost:5000/api/cart', {
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

if (!cartResponse.ok) {
    const errorData = await cartResponse.json();
    throw new Error(errorData.message || 'Failed to fetch cart for update');
}

const { cart } = await cartResponse.json();
const item = cart.find(item => item._id === itemId);

if (!item) throw new Error('Item not found in cart');

let newQuantity;
if (item.type === 'sapling') {
    newQuantity = parseInt(item.quantity) + change;
    if (newQuantity < 1) {
        showErrorToast('Minimum quantity is 1 sapling');
        return;
    }
} else {
    newQuantity = parseFloat(item.quantity) + change;
    if (newQuantity < 0.1) {
        showErrorToast('Minimum quantity is 0.1');
        return;
    }
}

// Now update the quantity
const response = await fetch('http://localhost:5000/api/cart/update', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        itemId: itemId,
        newQuantity: newQuantity
    })
});

if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update quantity');
}

showSuccessToast('Quantity updated successfully');
displayCart(); // Refresh the cart
} catch (err) {
console.error("Error updating quantity:", err);
showErrorToast('Failed to update quantity: ' + err.message);
}
}

async function updateItemQuantity(itemId, newQuantity) {
const token = localStorage.getItem('agroToken');
if (!token) {
showErrorToast('Please login to update cart');
return;
}

try {
// First get current cart to find the item type
const cartResponse = await fetch('http://localhost:5000/api/cart', {
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

if (!cartResponse.ok) {
    const errorData = await cartResponse.json();
    throw new Error(errorData.message || 'Failed to fetch cart for update');
}

const { cart } = await cartResponse.json();
const item = cart.find(item => item._id === itemId);

if (!item) throw new Error('Item not found in cart');

let parsedQuantity;
if (item.type === 'sapling') {
    parsedQuantity = parseInt(newQuantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        showErrorToast('Please enter a valid quantity (minimum 1)');
        return;
    }
} else {
    parsedQuantity = parseFloat(newQuantity);
    if (isNaN(parsedQuantity)) {
        showErrorToast('Please enter a valid quantity');
        return;
    }
    if (parsedQuantity < 0.1) {
        showErrorToast('Minimum quantity is 0.1');
        return;
    }
}

// Now update the quantity
const response = await fetch('http://localhost:5000/api/cart/update', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        itemId: itemId,
        newQuantity: parsedQuantity
    })
});

if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update quantity');
}

showSuccessToast('Quantity updated successfully');
displayCart(); // Refresh the cart
} catch (err) {
console.error("Error updating quantity:", err);
showErrorToast('Failed to update quantity: ' + err.message);
}
}

function checkout() {
    const token = localStorage.getItem('agroToken');
    if (!token) {
        showErrorToast('Please login to proceed to checkout');
        window.location.href = '/index.html';
        return;
    }

    window.location.href = '/checkout.html';
}
async function removeItem(itemId) {
    const token = localStorage.getItem('agroToken');
    if (!token) {
        alert('Please login to update cart');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/cart/remove', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove item from cart');
        }

        alert('Item removed from cart');
        displayCart(); // Refresh cart UI
    } catch (err) {
        console.error("Error removing item:", err);
        alert('Failed to remove item: ' + err.message);
    }
}