/**
 * Clefeel - Shop Page JavaScript
 */

let currentProducts = [];
let currentFilters = {
  categories: [],
  genders: [],
  minPrice: null,
  maxPrice: null
};
let currentSort = 'newest';
let currentPage = 1;

const PRODUCTS_PER_PAGE = 9;

document.addEventListener('DOMContentLoaded', async () => {
  // Load products
  await loadProducts();
  
  // Initialize filters
  initFilters();
  
  // Initialize sorting
  initSorting();
  
  // Check URL params for category filter
  checkUrlParams();
});

/**
 * Load products from API
 */
async function loadProducts() {
  const container = document.getElementById('productsGrid');
  if (!container) return;
  
  try {
    const products = await Clefeel.apiRequest('/products?limit=50');
    currentProducts = products;
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    // Show fallback products
    container.innerHTML = `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80" alt="Product" class="product-image">
        </div>
        <div class="product-info">
          <p class="product-category">Royal Oud Series</p>
          <h3 class="product-name"><a href="product.html?id=1">Midnight Oud Elixir</a></h3>
          <div class="product-price">
            <span class="price-current">₹12,999</span>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Render products with filters and pagination
 */
function renderProducts() {
  const container = document.getElementById('productsGrid');
  const resultsCount = document.getElementById('resultsCount');
  if (!container) return;
  
  // Apply filters
  let filteredProducts = [...currentProducts];
  
  // Category filter
  if (currentFilters.categories.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      currentFilters.categories.includes(p.category_slug)
    );
  }
  
  // Gender filter
  if (currentFilters.genders.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      currentFilters.genders.includes(p.gender)
    );
  }
  
  // Price filter
  if (currentFilters.minPrice) {
    filteredProducts = filteredProducts.filter(p => {
      const minVariantPrice = Math.min(...(p.variants?.map(v => v.price) || [0]));
      return minVariantPrice >= currentFilters.minPrice;
    });
  }
  if (currentFilters.maxPrice) {
    filteredProducts = filteredProducts.filter(p => {
      const minVariantPrice = Math.min(...(p.variants?.map(v => v.price) || [0]));
      return minVariantPrice <= currentFilters.maxPrice;
    });
  }
  
  // Apply sorting
  switch (currentSort) {
    case 'price-low':
      filteredProducts.sort((a, b) => {
        const priceA = Math.min(...(a.variants?.map(v => v.price) || [0]));
        const priceB = Math.min(...(b.variants?.map(v => v.price) || [0]));
        return priceA - priceB;
      });
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => {
        const priceA = Math.min(...(a.variants?.map(v => v.price) || [0]));
        const priceB = Math.min(...(b.variants?.map(v => v.price) || [0]));
        return priceB - priceA;
      });
      break;
    case 'name':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Newest - use default order
      break;
  }
  
  // Update results count
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`;
  }
  
  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  
  // Render
  Clefeel.renderProducts(paginatedProducts, 'productsGrid');
  
  // Update pagination
  updatePagination(totalPages);
}

/**
 * Initialize filter listeners
 */
function initFilters() {
  // Category filters
  const categoryCheckboxes = document.querySelectorAll('#categoryFilters input[type="checkbox"]');
  categoryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      currentFilters.categories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      currentPage = 1;
      renderProducts();
    });
  });
  
  // Gender filters
  const genderCheckboxes = document.querySelectorAll('#genderFilters input[type="checkbox"]');
  genderCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      currentFilters.genders = Array.from(genderCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      currentPage = 1;
      renderProducts();
    });
  });
  
  // Price filter
  const applyPriceBtn = document.getElementById('applyPriceFilter');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      const minPrice = document.getElementById('minPrice').value;
      const maxPrice = document.getElementById('maxPrice').value;
      
      currentFilters.minPrice = minPrice ? parseInt(minPrice) : null;
      currentFilters.maxPrice = maxPrice ? parseInt(maxPrice) : null;
      currentPage = 1;
      renderProducts();
    });
  }
  
  // Mobile filter toggle
  const filterToggle = document.getElementById('filterToggle');
  const shopSidebar = document.querySelector('.shop-sidebar');
  if (filterToggle && shopSidebar) {
    filterToggle.addEventListener('click', () => {
      shopSidebar.style.display = shopSidebar.style.display === 'block' ? 'none' : 'block';
    });
  }
}

/**
 * Initialize sorting
 */
function initSorting() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      renderProducts();
    });
  }
}

/**
 * Update pagination
 */
function updatePagination(totalPages) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }
  
  pagination.style.display = 'flex';
  
  let html = `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">&laquo;</button>
  `;
  
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  
  html += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">&raquo;</button>
  `;
  
  pagination.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Check URL params for filters
 */
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const search = urlParams.get('search');
  
  if (category) {
    const checkbox = document.querySelector(`#categoryFilters input[value="${category}"]`);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    }
  }
  
  if (search) {
    // Filter products by search term
    const searchLower = search.toLowerCase();
    currentProducts = currentProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
    renderProducts();
  }
}
