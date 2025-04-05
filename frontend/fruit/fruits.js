
        async function fetchFruits() {
            try {
                const response = await fetch("http://localhost:5003/client/fruits");
                const fruits = await response.json();
    
                const fruitContainer = document.getElementById("fruit-container");
                fruitContainer.innerHTML = ""; // Clear previous content
    
                // Get current cart items
                let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    
                // Generate fruit cards dynamically
                fruits.forEach(fruit => {
                    const fruitId = fruit.name.replace(/\s+/g, '-');
                    // Check if this fruit is already in cart
                    const inCart = cart.some(item => item.name === fruit.name);
                    
                    const fruitCard = `
                        <div class="col">
                            <div class="card product-card">
                                <img src="${fruit.img}" class="card-img-top product-img" alt="${fruit.name}">
                                <div class="card-body text-center">
                                    <h5 class="product-title">${fruit.name}</h5>
                                    <p class="product-description">${fruit.desc}</p>
                                    <p class="product-price">₹${fruit.price} / kg</p>
                                </div>
                                
                                <div class="quantity-selector">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="decrementQuantity('${fruit.name}')">-</button>
                                    <input type="number" class="form-control quantity-input" id="quantity-${fruitId}" value="1" min="0.1" step="0.1">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="incrementQuantity('${fruit.name}')">+</button>
                                </div>
                                
                                <div class="unit-selector">
                                    <select class="form-select" id="unit-${fruitId}">
                                        <option value="kg">Kilogram (kg)</option>
                                        <option value="g">Gram (g)</option>
                                    </select>
                                </div>
                                
                                <button class="btn ${inCart ? 'btn-danger' : 'btn-success'} w-100" 
                                        onclick="${inCart ? `removeFromCart('${fruit.name}')` : `addToCart('${fruit.name}', ${fruit.price})`}" 
                                        id="cart-btn-${fruitId}">
                                    ${inCart ? 'Remove from Cart' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    `;
                    fruitContainer.innerHTML += fruitCard;
                });
            } catch (error) {
                console.error("Error fetching fruits:", error);
            }
        }
    
        function incrementQuantity(fruitName) {
            const inputId = `quantity-${fruitName.replace(/\s+/g, '-')}`;
            const input = document.getElementById(inputId);
            input.value = (parseFloat(input.value) + 0.1).toFixed(1);
        }
    
        function decrementQuantity(fruitName) {
            const inputId = `quantity-${fruitName.replace(/\s+/g, '-')}`;
            const input = document.getElementById(inputId);
            if (parseFloat(input.value) > 0.1) {
                input.value = (parseFloat(input.value) - 0.1).toFixed(1);
            }
        }
        async function addToCart(itemName, itemPrice) {
  const quantityId = `quantity-${itemName.replace(/\s+/g, '-')}`;
  const unitId = `unit-${itemName.replace(/\s+/g, '-')}`;
  const btnId = `cart-btn-${itemName.replace(/\s+/g, '-')}`;
  
  const quantity = parseFloat(document.getElementById(quantityId).value);
  const unit = document.getElementById(unitId).value;
  const token = localStorage.getItem('agroToken');

  if (!token) {
    alert('Please login to add items to cart');
    window.location.href = '/index.html'; // Redirect to login
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
        name: itemName,
        price: itemPrice,
        quantity: quantity,
        unit: unit
      })
    });

    if (!response.ok) throw new Error('Failed to add to cart');

    // Update UI
    const btn = document.getElementById(btnId);
    btn.classList.remove('btn-success');
    btn.classList.add('btn-danger');
    btn.textContent = 'Remove from Cart';
    btn.onclick = () => removeFromCart(itemName);
    
    alert(`${quantity} ${unit} of ${itemName} added to cart`);
  } catch (err) {
    console.error("Error adding to cart:", err);
    alert('Failed to add item to cart');
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
    const { cart } = await cartResponse.json();
    const item = cart.find(item => item.name === itemName);

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

        // Load fruits when page is fully loaded
        document.addEventListener("DOMContentLoaded", fetchFruits);
