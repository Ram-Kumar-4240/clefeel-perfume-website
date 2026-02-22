/**
 * Clefeel - Product Detail Page JavaScript
 */

let currentProduct = null;
let selectedVariant = null;
let quantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }
  
  // Load product
  await loadProduct(productId);
  
  // Initialize size selection
  initSizeSelection();
  
  // Initialize quantity controls
  initQuantityControls();
  
  // Initialize action buttons
  initActionButtons();
  
  // Initialize tabs
  initTabs();
  
  // Load related products
  await loadRelatedProducts();
});

/**
 * Load product details
 */
async function loadProduct(productId) {
  try {
    const product = await Clefeel.apiRequest(`/products/${productId}`);
    currentProduct = product;
    selectedVariant = product.variants?.[0];
    
    // Update page content
    document.getElementById('breadcrumbProductName').textContent = product.name;
    document.getElementById('productCategory').textContent = product.category_name || 'Perfume';
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDescription').textContent = product.short_description || product.description;
    document.getElementById('productSku').textContent = product.variants?.[0]?.sku || 'N/A';
    document.getElementById('productCategoryMeta').textContent = product.category_name || 'Perfume';
    document.getElementById('productGender').textContent = product.gender ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1) : 'Unisex';
    
    // Update price
    updatePrice();
    
    // Update images
    if (product.images && product.images.length > 0) {
      document.getElementById('mainImage').src = product.images[0];
    }
    
    // Update size options
    const sizeOptions = document.getElementById('sizeOptions');
    if (sizeOptions && product.variants) {
      sizeOptions.innerHTML = product.variants.map((variant, index) => `
        <div class="size-option ${index === 0 ? 'active' : ''}" 
             data-size="${variant.size}" 
             data-price="${variant.price}"
             data-variant-id="${variant.id}">
          ${variant.size}
          <span class="size-price">${Clefeel.formatPrice(variant.price)}</span>
        </div>
      `).join('');
    }
    
    // Update page title
    document.title = `${product.name} | Clefeel Luxury Perfumes`;
    
  } catch (error) {
    console.error('Error loading product:', error);
    Clefeel.showToast('Error loading product', 'error');
  }
}

/**
 * Update displayed price
 */
function updatePrice() {
  if (!selectedVariant) return;
  
  const priceEl = document.getElementById('productPrice');
  const comparePriceEl = document.getElementById('productComparePrice');
  
  if (priceEl) {
    priceEl.textContent = Clefeel.formatPrice(selectedVariant.price * quantity);
  }
  
  if (comparePriceEl) {
    if (selectedVariant.compare_price > selectedVariant.price) {
      comparePriceEl.textContent = Clefeel.formatPrice(selectedVariant.compare_price * quantity);
      comparePriceEl.style.display = 'inline';
    } else {
      comparePriceEl.style.display = 'none';
    }
  }
}

/**
 * Initialize size selection
 */
function initSizeSelection() {
  const sizeOptions = document.getElementById('sizeOptions');
  if (!sizeOptions) return;
  
  sizeOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.size-option');
    if (!option) return;
    
    // Remove active class from all options
    sizeOptions.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('active'));
    
    // Add active class to clicked option
    option.classList.add('active');
    
    // Update selected variant
    const variantId = parseInt(option.dataset.variantId);
    selectedVariant = currentProduct.variants.find(v => v.id === variantId);
    
    // Update price
    updatePrice();
  });
}

/**
 * Initialize quantity controls
 */
function initQuantityControls() {
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('quantityInput');
  
  if (!qtyMinus || !qtyPlus || !qtyInput) return;
  
  qtyMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyInput.value = quantity;
      updatePrice();
    }
  });
  
  qtyPlus.addEventListener('click', () => {
    if (quantity < 10) {
      quantity++;
      qtyInput.value = quantity;
      updatePrice();
    }
  });
  
  qtyInput.addEventListener('change', () => {
    quantity = Math.max(1, Math.min(10, parseInt(qtyInput.value) || 1));
    qtyInput.value = quantity;
    updatePrice();
  });
}

/**
 * Initialize action buttons
 */
function initActionButtons() {
  // Add to cart button
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      if (!currentProduct || !selectedVariant) return;
      
      Clefeel.addToCart(currentProduct, selectedVariant, quantity);
    });
  }
  
  // Buy now button
  const buyNowBtn = document.getElementById('buyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      if (!currentProduct || !selectedVariant) return;
      
      // Clear cart and add this item
      Clefeel.clearCart();
      Clefeel.addToCart(currentProduct, selectedVariant, quantity);
      
      // Redirect to checkout
      window.location.href = 'checkout.html';
    });
  }
  
  // Wishlist button
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn && currentProduct) {
    // Check if already in wishlist
    if (Clefeel.isInWishlist(currentProduct.id)) {
      wishlistBtn.classList.add('active');
    }
    
    wishlistBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      
      if (Clefeel.isInWishlist(currentProduct.id)) {
        Clefeel.removeFromWishlist(currentProduct.id);
        wishlistBtn.classList.remove('active');
      } else {
        Clefeel.addToWishlist(currentProduct.id);
        wishlistBtn.classList.add('active');
      }
    });
  }
  
  // Gallery thumbnails
  const thumbnails = document.querySelectorAll('.gallery-thumb');
  const mainImage = document.getElementById('mainImage');
  
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      
      if (mainImage) {
        mainImage.src = thumb.querySelector('img').src.replace('w=200', 'w=800');
      }
    });
  });
}

/**
 * Initialize tabs
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Remove active class from all buttons and contents
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`)?.classList.add('active');
    });
  });
}

/**
 * Load related products
 */
async function loadRelatedProducts() {
  try {
    const products = await Clefeel.apiRequest('/products?limit=4');
    Clefeel.renderProducts(products, 'relatedProductsGrid');
  } catch (error) {
    console.error('Error loading related products:', error);
  }
}
