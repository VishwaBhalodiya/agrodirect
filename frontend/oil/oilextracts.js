async function fetchOilExtracts() {
    try {
        const response = await fetch("http://localhost:5003/client/oilextracts");
        const oilsData = await response.json();

        const oilsContainer = document.getElementById("oils-container");
        oilsContainer.innerHTML = ""; // Clear previous content

        // Get current cart items
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

        // Generate oil extract cards dynamically
        oilsData.forEach(oil => {
            const oilId = oil.name.replace(/\s+/g, '-');
            // Check if this oil is already in cart
            const inCart = cart.some(item => item.name === oil.name);
            
            const oilCard = `
                <div class="col">
                    <div class="card product-card">
                        <img src="${oil.img}" class="card-img-top product-img" alt="${oil.name}">
                        <div class="card-body text-center">
                            <h5 class="product-title">${oil.name}</h5>
                            <p class="product-description">${oil.desc}</p>
                            <p class="product-price">₹${oil.price} per bottle</p>
                        </div>
                        
                        <div class="quantity-selector">
                            <button class="btn btn-sm btn-outline-secondary" onclick="decrementQuantity('${oil.name}')">-</button>
                            <input type="number" class="form-control quantity-input" id="quantity-${oilId}" value="1" min="1" step="1">
                            <button class="btn btn-sm btn-outline-secondary" onclick="incrementQuantity('${oil.name}')">+</button>
                        </div>
                        
                        <div class="oil-type">
                            <select class="form-select" id="type-${oilId}">
                                <option value="coldpressed">Cold Pressed</option>
                                <option value="refined">Refined</option>
                                <option value="virgin">Virgin</option>
                            </select>
                        </div>
                        
                        <div class="unit-selector">
                            <select class="form-select" id="size-${oilId}">
                                <option value="250ml">250ml</option>
                                <option value="500ml">500ml</option>
                                <option value="1ltr">1 Liter</option>
                            </select>
                        </div>
                        
                        <button class="btn ${inCart ? 'btn-danger' : 'btn-success'} w-100" 
                                onclick="${inCart ? `removeFromCart('${oil.name}')` : `addToCart('${oil.name}', ${oil.price})`}" 
                                id="cart-btn-${oilId}">
                            ${inCart ? 'Remove from Cart' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            `;
            oilsContainer.innerHTML += oilCard;
        });
    } catch (error) {
        console.error("Error fetching oil extracts:", error);
    }
}

function incrementQuantity(oilName) {
    const inputId = `quantity-${oilName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    input.value = parseInt(input.value) + 1;
}

function decrementQuantity(oilName) {
    const inputId = `quantity-${oilName.replace(/\s+/g, '-')}`;
    const input = document.getElementById(inputId);
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

async function addToCart(itemName, itemPrice) {
const oilId = itemName.replace(/\s+/g, '-');
const quantityId = `quantity-${oilId}`;
const typeId = `type-${oilId}`;
const sizeId = `size-${oilId}`;
const btnId = `cart-btn-${oilId}`;

const quantity = parseInt(document.getElementById(quantityId).value);
const type = document.getElementById(typeId).value;
const size = document.getElementById(sizeId).value;
const token = localStorage.getItem('agroToken');

if (!token) {
alert('Please login to add items to cart');
window.location.href = '/index.html';
return;
}

try {
const response = await fetch('http://localhost:5000/api/cart/add', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        name: itemName, // Store just the base name
        price: itemPrice,
        quantity: quantity,
        unit: size,
        type: 'oil', // Add type field
        oilType: type // Store the oil type separately
    })
});

if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add to cart');
}

// Update UI
const btn = document.getElementById(btnId);
btn.classList.remove('btn-success');
btn.classList.add('btn-danger');
btn.textContent = 'Remove from Cart';
btn.onclick = () => removeFromCart(itemName);

alert(`${quantity} ${size} of ${itemName} added to cart`);
} catch (err) {
console.error("Error adding to cart:", err);
alert('Failed to add item to cart: ' + err.message);
}
}
async function removeFromCart(itemName) {
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

if (!cartResponse.ok) {
    throw new Error('Failed to fetch cart');
}

const { cart } = await cartResponse.json();
// Match items where name starts with the base item name
const item = cart.find(item => item.name.startsWith(itemName));

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
alert('Failed to remove item from cart: ' + err.message);
}
}

// Load oil extracts when page is fully loaded
document.addEventListener("DOMContentLoaded", fetchOilExtracts);