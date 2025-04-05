async function fetchSeeds() {
    try {
        const response = await fetch("http://localhost:5003/client/seeds");
        const seedsData = await response.json();

        const seedsContainer = document.getElementById("seeds-container");
        seedsContainer.innerHTML = ""; // Clear previous content

        // Get current cart items
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

        // Generate seed cards dynamically
        seedsData.forEach(seed => {
            const seedId = seed.name.replace(/\s+/g, '-');
            // Check if this seed is already in cart
            const inCart = cart.some(item => item.name === seed.name);
            
            const seedCard = `
                <div class="col">
                    <div class="card product-card">
                        <img src="${seed.img}" class="card-img-top product-img" alt="${seed.name}">
                        <div class="card-body text-center">
                            <h5 class="product-title">${seed.name}</h5>
                            <p class="product-description">${seed.desc}</p>
                            <p class="product-price">₹${seed.price} / packet</p>
                        </div>
                        
                        <div class="quantity-selector">
                            <button class="btn btn-sm btn-outline-secondary" onclick="decrementQuantity('${seed.name}')">-</button>
                            <input type="number" class="form-control quantity-input" id="quantity-${seedId}" value="1" min="1" step="1">
                            <button class="btn btn-sm btn-outline-secondary" onclick="incrementQuantity('${seed.name}')">+</button>
                        </div>
                        
                        <div class="unit-selector">
                            <select class="form-select" id="unit-${seedId}">
                                <option value="packet">Packet</option>
                                <option value="kg">Kilogram (kg)</option>
                            </select>
                        </div>
                        
                        <button class="btn ${inCart ? 'btn-danger' : 'btn-success'} w-100" 
                                onclick="${inCart ? `removeFromCart('${seed.name}')` : `addToCart('${seed.name}', ${seed.price})`}" 
                                id="cart-btn-${seedId}">
                            ${inCart ? 'Remove from Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            `;
            seedsContainer.innerHTML += seedCard;
        });
    } catch (error) {
        console.error("Error fetching seeds:", error);
    }
}

function incrementQuantity(seedName) {
    const inputId = `quantity-${seedName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    input.value = parseInt(input.value) + 1;
}

function decrementQuantity(seedName) {
    const inputId = `quantity-${seedName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

async function addToCart(itemName, itemPrice) {
try {
const quantityId = `quantity-${itemName.replace(/\s+/g, '-')}`;
const unitId = `unit-${itemName.replace(/\s+/g, '-')}`;
const btnId = `cart-btn-${itemName.replace(/\s+/g, '-')}`;

const quantity = parseFloat(document.getElementById(quantityId).value);
const unit = document.getElementById(unitId).value;
const token = localStorage.getItem('agroToken');

if (!token) {
alert('Please login to add items to cart');
window.location.href = '/index.html';
return;
}

const response = await fetch('http://localhost:5000/api/cart/add', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`
},
body: JSON.stringify({
name: itemName,
price: itemPrice,
quantity: quantity,
unit: unit,
type: 'product'
})
});

const data = await response.json();

if (!response.ok) {
throw new Error(data.error || 'Failed to add to cart');
}

// Update UI
const btn = document.getElementById(btnId);
btn.classList.remove('btn-success');
btn.classList.add('btn-danger');
btn.textContent = 'Remove from Cart';
btn.onclick = () => removeFromCart(itemName, itemPrice);

alert(`${quantity} ${unit} of ${itemName} added to cart`);
} catch (err) {
console.error("Error adding to cart:", err);
alert('Failed to add item to cart: ' + err.message);
}
}

async function removeFromCart(itemName, itemPrice) {
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
const item = cart.find(item => item.name === itemName && item.type === 'product');

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
btn.onclick = () => addToCart(itemName, itemPrice);

alert(`${itemName} removed from cart`);
} catch (err) {
console.error("Error removing from cart:", err);
alert('Failed to remove item from cart');
}
}
// Load seeds when page is fully loaded
document.addEventListener("DOMContentLoaded", fetchSeeds);