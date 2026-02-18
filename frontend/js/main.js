// Clefeel Perfume - Main JavaScript

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : 'https://your-api-domain.com/api';

// Utility Functions
const utils = {
  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  },

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  getToken() {
    return localStorage.getItem('clefeel_token');
  },

  setToken(token) {
    localStorage.setItem('clefeel_token', token);
  },

  removeToken() {
    localStorage.removeItem('clefeel_token');
  },

  getUser() {
    const user = localStorage.getItem('clefeel_user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    localStorage.setItem('clefeel_user', JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem('clefeel_user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  }
};

// API Client
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = utils.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth
  auth: {
    login(email, password) {
      return api.request('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
    },

    register(userData) {
      return api.request('/auth/register', {
        method: 'POST',
        body: userData
      });
    },

    googleLogin(googleData) {
      return api.request('/auth/google', {
        method: 'POST',
        body: googleData
      });
    },

    getMe() {
      return api.request('/auth/me');
    },

    logout() {
      return api.request('/auth/logout', { method: 'POST' });
    }
  },

  // Products
  products: {
    getAll(filters = {}) {
      const params = new URLSearchParams(filters).toString();
      return api.request(`/perfumes?${params}`);
    },

    getFeatured() {
      return api.request('/perfumes/featured');
    },

    getBySlug(slug) {
      return api.request(`/perfumes/${slug}`);
    }
  },

  // Cart
  cart: {
    get() {
      return api.request('/cart');
    },

    add(variantId, quantity = 1) {
      return api.request('/cart', {
        method: 'POST',
        body: { variantId, quantity }
      });
    },

    update(cartId, quantity) {
      return api.request(`/cart/${cartId}`, {
        method: 'PUT',
        body: { quantity }
      });
    },

    remove(cartId) {
      return api.request(`/cart/${cartId}`, {
        method: 'DELETE'
      });
    },

    clear() {
      return api.request('/cart', { method: 'DELETE' });
    },

    getCount() {
      return api.request('/cart/count');
    }
  },

  // Orders
  orders: {
    create(orderData) {
      return api.request('/orders', {
        method: 'POST',
        body: orderData
      });
    },

    createFromCart(orderData) {
      return api.request('/orders/from-cart', {
        method: 'POST',
        body: orderData
      });
    },

    getMyOrders() {
      return api.request('/orders/my-orders');
    },

    getById(id) {
      return api.request(`/orders/${id}`);
    }
  }
};

// Toast Notifications
const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'success', duration = 3000) {
    this.init();

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        ${type === 'success' 
          ? '<path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="#28A745"/>'
          : '<path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="#DC3545"/>'
        }
      </svg>
      <span>${message}</span>
    `;

    this.container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.add('hide');
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  }
};

// Cart State Management
const cart = {
  items: [],
  count: 0,
  total: 0,

  async init() {
    if (utils.isLoggedIn()) {
      await this.refresh();
    }
    this.updateUI();
  },

  async refresh() {
    try {
      const data = await api.cart.get();
      this.items = data.items || [];
      this.count = data.count || 0;
      this.total = data.total || 0;
      this.updateUI();
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  },

  async add(variantId, quantity = 1) {
    try {
      await api.cart.add(variantId, quantity);
      await this.refresh();
      toast.success('Added to cart');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  },

  async update(cartId, quantity) {
    try {
      await api.cart.update(cartId, quantity);
      await this.refresh();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  },

  async remove(cartId) {
    try {
      await api.cart.remove(cartId);
      await this.refresh();
      toast.success('Item removed');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  },

  updateUI() {
    // Update cart count badges
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = this.count;
      el.style.display = this.count > 0 ? 'flex' : 'none';
    });
  }
};

// Header Component
const header = {
  init() {
    this.render();
    this.attachEvents();
  },

  render() {
    const user = utils.getUser();
    const isLoggedIn = utils.isLoggedIn();

    const headerHTML = `
      <header class="header">
        <div class="container">
          <div class="header-inner">
            <a href="/" class="logo">Cle<span>feel</span></a>
            
            <nav class="nav">
              <a href="/" class="nav-link ${location.pathname === '/' ? 'active' : ''}">Home</a>
              <a href="/shop.html" class="nav-link ${location.pathname === '/shop.html' ? 'active' : ''}">Shop</a>
              <a href="/about.html" class="nav-link ${location.pathname === '/about.html' ? 'active' : ''}">About</a>
              <a href="/contact.html" class="nav-link ${location.pathname === '/contact.html' ? 'active' : ''}">Contact</a>
            </nav>
            
            <div class="header-actions">
              ${isLoggedIn ? `
                <a href="/account.html" class="icon-btn" title="My Account">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </a>
              ` : `
                <a href="/login.html" class="icon-btn" title="Login">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </a>
              `}
              
              <a href="/cart.html" class="icon-btn cart-btn" title="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span class="cart-count" style="display: none;">0</span>
              </a>
              
              <button class="mobile-menu-btn" aria-label="Menu">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;

    // Insert header at the beginning of body
    const existingHeader = document.querySelector('.header');
    if (existingHeader) {
      existingHeader.outerHTML = headerHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }
  },

  attachEvents() {
    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.body.classList.toggle('menu-open');
      });
    }
  }
};

// Footer Component
const footer = {
  init() {
    const footerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="/" class="logo">Cle<span>feel</span></a>
              <p>Discover the art of fine fragrances. Curated perfumes for the discerning individual who appreciates luxury and elegance.</p>
            </div>
            
            <div class="footer-column">
              <h4 class="footer-title">Shop</h4>
              <div class="footer-links">
                <a href="/shop.html">All Perfumes</a>
                <a href="/shop.html?gender=men">For Men</a>
                <a href="/shop.html?gender=women">For Women</a>
                <a href="/shop.html?gender=unisex">Unisex</a>
              </div>
            </div>
            
            <div class="footer-column">
              <h4 class="footer-title">Company</h4>
              <div class="footer-links">
                <a href="/about.html">About Us</a>
                <a href="/contact.html">Contact</a>
                <a href="/terms.html">Terms of Service</a>
                <a href="/privacy.html">Privacy Policy</a>
              </div>
            </div>
            
            <div class="footer-column">
              <h4 class="footer-title">Support</h4>
              <div class="footer-links">
                <a href="/faq.html">FAQ</a>
                <a href="/shipping.html">Shipping Info</a>
                <a href="/returns.html">Returns</a>
                <a href="/track-order.html">Track Order</a>
              </div>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p class="footer-copyright">© ${new Date().getFullYear()} Clefeel Parfumerie. All rights reserved.</p>
            <div class="footer-social">
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    `;

    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  header.init();
  footer.init();
  cart.init();
});

// Export for use in other scripts
window.Clefeel = {
  utils,
  api,
  toast,
  cart,
  header,
  footer
};
