/**
 * Clefeel Luxury Perfumes - Main JavaScript
 * Frontend functionality for the e-commerce website
 */

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format price in Indian Rupees
 */
function formatPrice(price) {
  return '₹' + parseInt(price).toLocaleString('en-IN');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconSvg = type === 'success' 
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
    : type === 'error'
    ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>';
  
  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// CART FUNCTIONS
// ============================================

/**
 * Get cart from localStorage
 */
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

/**
 * Save cart to localStorage
 */
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

/**
 * Add item to cart
 */
function addToCart(product, variant, quantity = 1) {
  const cart = getCart();
  
  const existingItem = cart.find(item => 
    item.productId === product.id && item.variantId === variant.id
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      image: product.images?.[0] || '',
      size: variant.size,
      price: variant.price,
      quantity: quantity
    });
  }
  
  saveCart(cart);
  showToast('Item added to cart successfully!');
}

/**
 * Remove item from cart
 */
function removeFromCart(productId, variantId) {
  let cart = getCart();
  cart = cart.filter(item => !(item.productId === productId && item.variantId === variantId));
  saveCart(cart);
  showToast('Item removed from cart');
}

/**
 * Update cart item quantity
 */
function updateCartQuantity(productId, variantId, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.productId === productId && item.variantId === variantId);
  
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

/**
 * Get cart total
 */
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Get cart item count
 */
function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Update cart count in header
 */
function updateCartCount() {
  const cartCountElements = document.querySelectorAll('#cartCount');
  const count = getCartItemCount();
  cartCountElements.forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/**
 * Clear cart
 */
function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}

// ============================================
// WISHLIST FUNCTIONS
// ============================================

/**
 * Get wishlist from localStorage
 */
function getWishlist() {
  const wishlist = localStorage.getItem('wishlist');
  return wishlist ? JSON.parse(wishlist) : [];
}

/**
 * Add to wishlist
 */
function addToWishlist(productId) {
  const wishlist = getWishlist();
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    showToast('Added to wishlist!');
  }
}

/**
 * Remove from wishlist
 */
function removeFromWishlist(productId) {
  let wishlist = getWishlist();
  wishlist = wishlist.filter(id => id !== productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  showToast('Removed from wishlist');
}

/**
 * Check if product is in wishlist
 */
function isInWishlist(productId) {
  const wishlist = getWishlist();
  return wishlist.includes(productId);
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Check if user is logged in
 */
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

/**
 * Get current user
 */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// ============================================
// UI FUNCTIONS
// ============================================

/**
 * Initialize header scroll effect
 */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/**
 * Initialize mobile navigation
 */
function initMobileNav() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');
  
  if (!menuToggle || !mobileNav) return;
  
  function openNav() {
    mobileNav.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeNav() {
    mobileNav.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  menuToggle.addEventListener('click', openNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeNav);
}

/**
 * Initialize search overlay
 */
function initSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const searchForm = document.getElementById('searchForm');
  
  if (!searchBtn || !searchOverlay) return;
  
  searchBtn.addEventListener('click', () => {
    searchOverlay.classList.add('active');
    document.getElementById('searchInput')?.focus();
  });
  
  if (searchClose) {
    searchClose.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });
  }
  
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('searchInput').value;
      if (query) {
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
}

/**
 * Create product card HTML
 */
function createProductCard(product) {
  const variant = product.variants?.[0] || { price: 0, compare_price: 0 };
  const hasDiscount = variant.compare_price > variant.price;
  
  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image-wrap">
        <img src="${product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'}" alt="${product.name}" class="product-image">
        ${product.is_bestseller ? '<span class="product-badge bestseller">Bestseller</span>' : ''}
        ${product.is_featured && !product.is_bestseller ? '<span class="product-badge">Featured</span>' : ''}
        <div class="product-actions">
          <button class="product-action-btn wishlist-btn" data-product-id="${product.id}" title="Add to Wishlist">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <a href="product.html?id=${product.id}" class="product-action-btn" title="Quick View">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        </div>
      </div>
      <div class="product-info">
        <p class="product-category">${product.category_name || 'Perfume'}</p>
        <h3 class="product-name">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-price">
          <span class="price-current">${formatPrice(variant.price)}</span>
          ${hasDiscount ? `<span class="price-original">${formatPrice(variant.compare_price)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render products grid
 */
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 3rem;">No products found.</p>';
    return;
  }
  
  container.innerHTML = products.map(product => createProductCard(product)).join('');
  
  // Add wishlist button listeners
  container.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = parseInt(btn.dataset.productId);
      if (isInWishlist(productId)) {
        removeFromWishlist(productId);
        btn.classList.remove('active');
      } else {
        addToWishlist(productId);
        btn.classList.add('active');
      }
    });
  });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize common UI components
  initHeader();
  initMobileNav();
  initSearch();
  updateCartCount();
  
  // Check auth status and update UI
  if (isLoggedIn()) {
    document.body.classList.add('logged-in');
  }
});

// Export functions for use in other scripts
window.Clefeel = {
  formatPrice,
  showToast,
  apiRequest,
  getCart,
  saveCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartTotal,
  getCartItemCount,
  clearCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  isLoggedIn,
  getCurrentUser,
  logout,
  createProductCard,
  renderProducts
};
