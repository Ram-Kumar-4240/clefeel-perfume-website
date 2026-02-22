/**
 * Clefeel - Home Page JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load best sellers
  await loadBestSellers();
  
  // Load featured products
  await loadFeaturedProducts();
  
  // Initialize newsletter form
  initNewsletterForm();
});

/**
 * Load best selling products
 */
async function loadBestSellers() {
  const container = document.getElementById('bestSellersGrid');
  if (!container) return;
  
  try {
    const products = await Clefeel.apiRequest('/products?bestseller=true&limit=4');
    Clefeel.renderProducts(products, 'bestSellersGrid');
  } catch (error) {
    console.error('Error loading best sellers:', error);
    // Show fallback products
    container.innerHTML = `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80" alt="Midnight Oud Elixir" class="product-image">
          <span class="product-badge bestseller">Bestseller</span>
        </div>
        <div class="product-info">
          <p class="product-category">Royal Oud Series</p>
          <h3 class="product-name"><a href="product.html?id=1">Midnight Oud Elixir</a></h3>
          <div class="product-price">
            <span class="price-current">₹12,999</span>
            <span class="price-original">₹15,999</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80" alt="Velvet Rose Essence" class="product-image">
          <span class="product-badge bestseller">Bestseller</span>
        </div>
        <div class="product-info">
          <p class="product-category">Velvet Rose Collection</p>
          <h3 class="product-name"><a href="product.html?id=2">Velvet Rose Essence</a></h3>
          <div class="product-price">
            <span class="price-current">₹9,999</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80" alt="Amber Mystique" class="product-image">
          <span class="product-badge bestseller">Bestseller</span>
        </div>
        <div class="product-info">
          <p class="product-category">Amber Mystique Line</p>
          <h3 class="product-name"><a href="product.html?id=3">Amber Mystique</a></h3>
          <div class="product-price">
            <span class="price-current">₹11,499</span>
            <span class="price-original">₹13,999</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&q=80" alt="Midnight Noir" class="product-image">
          <span class="product-badge bestseller">Bestseller</span>
        </div>
        <div class="product-info">
          <p class="product-category">Midnight Noir Edition</p>
          <h3 class="product-name"><a href="product.html?id=4">Midnight Noir</a></h3>
          <div class="product-price">
            <span class="price-current">₹14,999</span>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Load featured products
 */
async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProductsGrid');
  if (!container) return;
  
  try {
    const products = await Clefeel.apiRequest('/products?featured=true&limit=4');
    Clefeel.renderProducts(products, 'featuredProductsGrid');
  } catch (error) {
    console.error('Error loading featured products:', error);
    // Show fallback products
    container.innerHTML = `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&q=80" alt="Royal Oud Supreme" class="product-image">
          <span class="product-badge">Featured</span>
        </div>
        <div class="product-info">
          <p class="product-category">Royal Oud Series</p>
          <h3 class="product-name"><a href="product.html?id=5">Royal Oud Supreme</a></h3>
          <div class="product-price">
            <span class="price-current">₹18,999</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&q=80" alt="Rose Garden" class="product-image">
          <span class="product-badge">Featured</span>
        </div>
        <div class="product-info">
          <p class="product-category">Velvet Rose Collection</p>
          <h3 class="product-name"><a href="product.html?id=6">Rose Garden</a></h3>
          <div class="product-price">
            <span class="price-current">₹8,499</span>
            <span class="price-original">₹10,999</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&q=80" alt="Golden Amber" class="product-image">
          <span class="product-badge">Featured</span>
        </div>
        <div class="product-info">
          <p class="product-category">Amber Mystique Line</p>
          <h3 class="product-name"><a href="product.html?id=7">Golden Amber</a></h3>
          <div class="product-price">
            <span class="price-current">₹13,499</span>
          </div>
        </div>
      </div>
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80" alt="Noir Intense" class="product-image">
          <span class="product-badge">Featured</span>
        </div>
        <div class="product-info">
          <p class="product-category">Midnight Noir Edition</p>
          <h3 class="product-name"><a href="product.html?id=8">Noir Intense</a></h3>
          <div class="product-price">
            <span class="price-current">₹16,999</span>
            <span class="price-original">₹19,999</span>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Initialize newsletter form
 */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    
    // Simulate newsletter subscription
    Clefeel.showToast('Thank you for subscribing!', 'success');
    form.reset();
  });
}
