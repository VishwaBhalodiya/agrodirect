async function fetchSaplings() {
    try {
        const response = await fetch("http://localhost:5003/client/saplings");
        const saplingsData = await response.json();

        const saplingsContainer = document.getElementById("saplings-container");
        saplingsContainer.innerHTML = ""; // Clear previous content

        // Get current cart items
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

        // Generate sapling cards dynamically
        saplingsData.forEach(sapling => {
            const saplingId = sapling.name.replace(/\s+/g, '-');
            // Check if this sapling is already in cart
            const inCart = cart.some(item => item.name === sapling.name);
            
            const saplingCard = `
                <div class="col">
                    <div class="card product-card">
                        <img src="${sapling.img}" class="card-img-top product-img" alt="${sapling.name}">
                        <div class="card-body text-center">
                            <h5 class="product-title">${sapling.name}</h5>
                            <p class="product-description">${sapling.desc}</p>
                            <p class="product-price">₹${sapling.price} per sapling</p>
                        </div>
                        
                        <div class="quantity-selector">
                            <button class="btn btn-sm btn-outline-secondary" onclick="decrementQuantity('${sapling.name}')">-</button>
                            <input type="number" class="form-control quantity-input" id="quantity-${saplingId}" value="1" min="1" step="1">
                            <button class="btn btn-sm btn-outline-secondary" onclick="incrementQuantity('${sapling.name}')">+</button>
                        </div>
                        
                        <div class="sapling-age">
                            <select class="form-select" id="age-${saplingId}">
                                <option value="6months">6 Months Old</option>
                                <option value="1year">1 Year Old</option>
                                <option value="2years">2 Years Old</option>
                            </select>
                        </div>
                        
                        <div class="unit-selector">
                            <select class="form-select" id="size-${saplingId}">
                                <option value="small">Small (1-2 ft)</option>
                                <option value="medium">Medium (2-4 ft)</option>
                                <option value="large">Large (4-6 ft)</option>
                            </select>
                        </div>
                        
                        <button class="btn ${inCart ? 'btn-danger' : 'btn-success'} w-100" 
                                onclick="${inCart ? `removeFromCart('${sapling.name}')` : `addToCart('${sapling.name}', ${sapling.price})`}" 
                                id="cart-btn-${saplingId}">
                            ${inCart ? 'Remove from Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            `;
            saplingsContainer.innerHTML += saplingCard;
        });
    } catch (error) {
        console.error("Error fetching saplings:", error);
    }
}

function incrementQuantity(saplingName) {
    const inputId = `quantity-${saplingName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    input.value = parseInt(input.value) + 1;
}

function decrementQuantity(saplingName) {
    const inputId = `quantity-${saplingName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

async function addToCart(itemName, basePrice) {
const quantityId = `quantity-${itemName.replace(/\s+/g, '-')}`;
const ageId = `age-${itemName.replace(/\s+/g, '-')}`;
const sizeId = `size-${itemName.replace(/\s+/g, '-')}`;
const btnId = `cart-btn-${itemName.replace(/\s+/g, '-')}`;

const quantity = parseInt(document.getElementById(quantityId).value);
const age = document.getElementById(ageId).value;
const size = document.getElementById(sizeId).value;
const token = localStorage.getItem('agroToken');

if (!token) {
alert('Please login to add items to cart');
window.location.href = '/index.html';
return;
}

// Calculate price multiplier
let priceMultiplier = 1;
if (age === '1year') priceMultiplier = 1.5;
if (age === '2years') priceMultiplier = 2;

if (size === 'medium') priceMultiplier *= 1.3;
if (size === 'large') priceMultiplier *= 1.7;

const finalPrice = Math.round(basePrice * priceMultiplier);

try {
const response = await fetch('http://localhost:5000/api/cart/add', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        name: itemName,
        price: finalPrice,
        quantity: quantity,
        unit: 'sapling',
        type: 'sapling',
        age: age,
        size: size
    })
});

if (!response.ok) throw new Error('Failed to add to cart');

// Update UI
const btn = document.getElementById(btnId);
btn.classList.remove('btn-success');
btn.classList.add('btn-danger');
btn.textContent = 'Remove from Cart';
btn.onclick = () => removeFromCart(itemName, basePrice);

alert(`${quantity} sapling(s) of ${itemName} added to cart`);
} catch (err) {
console.error("Error adding to cart:", err);
alert('Failed to add item to cart');
}
}

async function removeFromCart(itemName, basePrice) {
const token = localStorage.getItem('agroToken');
const btnId = `cart-btn-${itemName.replace(/\s+/g, '-')}`;

if (!token) {
alert('Please login to manage your cart');
return;
}

try {
// Fetch user's cart to get the item ID
const cartResponse = await fetch('http://localhost:5000/api/cart', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const { cart } = await cartResponse.json();
const item = cart.find(item => item.name === itemName && item.type === 'sapling');

if (!item) throw new Error('Item not found in cart');

// Remove item by ID
const response = await fetch('http://localhost:5000/api/cart/remove', {
    method: 'DELETE',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ itemId: item._id })
});

if (!response.ok) throw new Error('Failed to remove from cart');

// Update UI
const btn = document.getElementById(btnId);
btn.classList.remove('btn-danger');
btn.classList.add('btn-success');
btn.textContent = 'Add to Cart';
btn.onclick = () => addToCart(itemName, basePrice);

alert(`${itemName} removed from cart`);
} catch (err) {
console.error("Error removing from cart:", err);
alert('Failed to remove item from cart');
}
}
// Load saplings when page is fully loaded
document.addEventListener("DOMContentLoaded", fetchSaplings);