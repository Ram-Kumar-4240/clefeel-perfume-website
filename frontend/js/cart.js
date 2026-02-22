/**
 * Clefeel - Cart Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

/**
 * Render cart items
 */
function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartLayout = document.getElementById('cartLayout');
  const cartSummary = document.getElementById('cartSummary');
  const emptyCart = document.getElementById('emptyCart');
  
  if (!cartItems) return;
  
  const cart = Clefeel.getCart();
  
  if (cart.length === 0) {
    // Show empty cart
    if (cartLayout) cartLayout.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'none';
    if (emptyCart) emptyCart.style.display = 'block';
    return;
  }
  
  // Show cart
  if (cartLayout) cartLayout.style.display = 'grid';
  if (cartSummary) cartSummary.style.display = 'block';
  if (emptyCart) emptyCart.style.display = 'none';
  
  // Render items
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
      <div class="cart-item-image">
        <img src="${item.image || 'https://via.placeholder.com/120x150?text=No+Image'}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h3 class="cart-item-name">
          <a href="product.html?id=${item.productId}">${item.name}</a>
        </h3>
        <p class="cart-item-variant">Size: ${item.size}</p>
        <p class="cart-item-price">${Clefeel.formatPrice(item.price)}</p>
        <div class="quantity-control" style="margin-top: 1rem;">
          <button class="quantity-btn qty-minus" data-product-id="${item.productId}" data-variant-id="${item.variantId}">-</button>
          <input type="number" class="quantity-input qty-input" value="${item.quantity}" min="1" max="10" data-product-id="${item.productId}" data-variant-id="${item.variantId}">
          <button class="quantity-btn qty-plus" data-product-id="${item.productId}" data-variant-id="${item.variantId}">+</button>
        </div>
      </div>
      <div class="cart-item-actions">
        <p class="cart-item-price">${Clefeel.formatPrice(item.price * item.quantity)}</p>
        <button class="cart-item-remove" data-product-id="${item.productId}" data-variant-id="${item.variantId}">Remove</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  addCartEventListeners();
  
  // Update summary
  updateCartSummary();
}

/**
 * Add event listeners to cart items
 */
function addCartEventListeners() {
  // Quantity minus buttons
  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.productId);
      const variantId = parseInt(btn.dataset.variantId);
      const input = document.querySelector(`.qty-input[data-product-id="${productId}"][data-variant-id="${variantId}"]`);
      const newQty = Math.max(1, parseInt(input.value) - 1);
      input.value = newQty;
      Clefeel.updateCartQuantity(productId, variantId, newQty);
      renderCart();
    });
  });
  
  // Quantity plus buttons
  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.productId);
      const variantId = parseInt(btn.dataset.variantId);
      const input = document.querySelector(`.qty-input[data-product-id="${productId}"][data-variant-id="${variantId}"]`);
      const newQty = Math.min(10, parseInt(input.value) + 1);
      input.value = newQty;
      Clefeel.updateCartQuantity(productId, variantId, newQty);
      renderCart();
    });
  });
  
  // Quantity input changes
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const productId = parseInt(input.dataset.productId);
      const variantId = parseInt(input.dataset.variantId);
      const newQty = Math.max(1, Math.min(10, parseInt(input.value) || 1));
      input.value = newQty;
      Clefeel.updateCartQuantity(productId, variantId, newQty);
      renderCart();
    });
  });
  
  // Remove buttons
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.productId);
      const variantId = parseInt(btn.dataset.variantId);
      Clefeel.removeFromCart(productId, variantId);
      renderCart();
    });
  });
}

/**
 * Update cart summary
 */
function updateCartSummary() {
  const cart = Clefeel.getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 299;
  const total = subtotal + shipping;
  
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');
  
  if (subtotalEl) subtotalEl.textContent = Clefeel.formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : Clefeel.formatPrice(shipping);
  if (totalEl) totalEl.textContent = Clefeel.formatPrice(total);
}
