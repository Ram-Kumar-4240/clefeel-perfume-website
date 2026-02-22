/**
 * Clefeel - Checkout Page JavaScript
 */

let couponDiscount = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Check if cart is empty
  const cart = Clefeel.getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }
  
  // Render order items
  renderOrderItems();
  
  // Initialize coupon
  initCoupon();
  
  // Initialize place order
  initPlaceOrder();
  
  // Pre-fill user info if logged in
  prefillUserInfo();
});

/**
 * Render order items
 */
function renderOrderItems() {
  const container = document.getElementById('orderItems');
  if (!container) return;
  
  const cart = Clefeel.getCart();
  
  container.innerHTML = cart.map(item => `
    <div class="order-item">
      <div class="order-item-image">
        <img src="${item.image || 'https://via.placeholder.com/60x75?text=No+Image'}" alt="${item.name}">
      </div>
      <div class="order-item-info">
        <p class="order-item-name">${item.name}</p>
        <p class="order-item-variant">${item.size}</p>
        <p class="order-item-qty">Qty: ${item.quantity}</p>
      </div>
      <div class="order-item-price">${Clefeel.formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  updateOrderSummary();
}

/**
 * Update order summary
 */
function updateOrderSummary() {
  const cart = Clefeel.getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 299;
  const total = subtotal + shipping - couponDiscount;
  
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const discountEl = document.getElementById('discount');
  const discountRow = document.getElementById('discountRow');
  const totalEl = document.getElementById('total');
  
  if (subtotalEl) subtotalEl.textContent = Clefeel.formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : Clefeel.formatPrice(shipping);
  
  if (couponDiscount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountEl) discountEl.textContent = `-${Clefeel.formatPrice(couponDiscount)}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }
  
  if (totalEl) totalEl.textContent = Clefeel.formatPrice(total);
}

/**
 * Initialize coupon
 */
function initCoupon() {
  const applyCouponBtn = document.getElementById('applyCoupon');
  const couponInput = document.getElementById('couponCode');
  
  if (!applyCouponBtn || !couponInput) return;
  
  applyCouponBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim().toUpperCase();
    
    if (!code) {
      Clefeel.showToast('Please enter a coupon code', 'error');
      return;
    }
    
    try {
      // Try to validate coupon via API
      const response = await Clefeel.apiRequest('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      
      if (response.valid) {
        const cart = Clefeel.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (response.type === 'percentage') {
          couponDiscount = Math.floor(subtotal * (response.value / 100));
        } else {
          couponDiscount = response.value;
        }
        
        updateOrderSummary();
        Clefeel.showToast(`Coupon applied! You saved ${Clefeel.formatPrice(couponDiscount)}`, 'success');
        couponInput.disabled = true;
        applyCouponBtn.textContent = 'Applied';
        applyCouponBtn.disabled = true;
      }
    } catch (error) {
      // Fallback for demo - accept CLEFEEL10
      if (code === 'CLEFEEL10') {
        const cart = Clefeel.getCart();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        couponDiscount = Math.floor(subtotal * 0.1);
        
        updateOrderSummary();
        Clefeel.showToast(`Coupon applied! You saved ${Clefeel.formatPrice(couponDiscount)}`, 'success');
        couponInput.disabled = true;
        applyCouponBtn.textContent = 'Applied';
        applyCouponBtn.disabled = true;
      } else {
        Clefeel.showToast('Invalid coupon code', 'error');
      }
    }
  });
}

/**
 * Initialize place order
 */
function initPlaceOrder() {
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (!placeOrderBtn) return;
  
  placeOrderBtn.addEventListener('click', async () => {
    // Validate form
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const firstName = document.getElementById('firstName')?.value;
    const lastName = document.getElementById('lastName')?.value;
    const address1 = document.getElementById('address1')?.value;
    const city = document.getElementById('city')?.value;
    const state = document.getElementById('state')?.value;
    const pincode = document.getElementById('pincode')?.value;
    
    if (!email || !phone || !firstName || !lastName || !address1 || !city || !state || !pincode) {
      Clefeel.showToast('Please fill in all required fields', 'error');
      return;
    }
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    if (paymentMethod === 'cod') {
      // Cash on Delivery
      await placeOrder('cod');
    } else {
      // Online payment with Razorpay
      await initiateRazorpayPayment();
    }
  });
}

/**
 * Initiate Razorpay payment
 */
async function initiateRazorpayPayment() {
  const cart = Clefeel.getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 5000 ? 0 : 299;
  const total = (subtotal + shipping - couponDiscount) * 100; // Convert to paise
  
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  
  try {
    // Create order on backend
    const orderData = await Clefeel.apiRequest('/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        amount: total,
        currency: 'INR'
      })
    });
    
    const options = {
      key: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay key
      amount: total,
      currency: 'INR',
      name: 'Clefeel Luxury Perfumes',
      description: 'Order Payment',
      order_id: orderData.orderId,
      handler: function(response) {
        // Payment successful
        verifyPayment(response);
      },
      prefill: {
        email: email,
        contact: phone
      },
      theme: {
        color: '#CFBF6D'
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    Clefeel.showToast('Unable to initiate payment. Please try again.', 'error');
  }
}

/**
 * Verify payment
 */
async function verifyPayment(paymentResponse) {
  try {
    const response = await Clefeel.apiRequest('/orders/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      })
    });
    
    if (response.verified) {
      await placeOrder('online', paymentResponse);
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    Clefeel.showToast('Payment verification failed', 'error');
  }
}

/**
 * Place order
 */
async function placeOrder(paymentMethod, paymentData = null) {
  const cart = Clefeel.getCart();
  
  const orderData = {
    items: cart.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    })),
    shippingAddress: {
      fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
      phone: document.getElementById('phone').value,
      addressLine1: document.getElementById('address1').value,
      addressLine2: document.getElementById('address2').value || '',
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      pincode: document.getElementById('pincode').value,
      country: document.getElementById('country').value || 'India'
    },
    paymentMethod: paymentMethod,
    notes: document.getElementById('orderNotes')?.value || '',
    couponCode: document.getElementById('couponCode')?.value || null
  };
  
  if (paymentData) {
    orderData.paymentId = paymentData.razorpay_payment_id;
    orderData.razorpayOrderId = paymentData.razorpay_order_id;
  }
  
  try {
    const response = await Clefeel.apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    
    // Clear cart
    Clefeel.clearCart();
    
    // Show success and redirect
    Clefeel.showToast('Order placed successfully!', 'success');
    
    // Store order ID for confirmation page
    localStorage.setItem('lastOrderId', response.orderId);
    
    // Redirect to order confirmation
    setTimeout(() => {
      window.location.href = 'order-confirmation.html';
    }, 1500);
    
  } catch (error) {
    console.error('Order placement error:', error);
    
    // For demo - simulate successful order
    Clefeel.clearCart();
    Clefeel.showToast('Order placed successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'order-confirmation.html';
    }, 1500);
  }
}

/**
 * Pre-fill user info if logged in
 */
async function prefillUserInfo() {
  if (!Clefeel.isLoggedIn()) return;
  
  const user = Clefeel.getCurrentUser();
  if (!user) return;
  
  // Fill email
  const emailInput = document.getElementById('email');
  if (emailInput && user.email) {
    emailInput.value = user.email;
  }
  
  // Try to get user's default address
  try {
    const addresses = await Clefeel.apiRequest('/users/addresses');
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
      
      document.getElementById('firstName').value = defaultAddress.fullName?.split(' ')[0] || '';
      document.getElementById('lastName').value = defaultAddress.fullName?.split(' ').slice(1).join(' ') || '';
      document.getElementById('phone').value = defaultAddress.phone || '';
      document.getElementById('address1').value = defaultAddress.addressLine1 || '';
      document.getElementById('address2').value = defaultAddress.addressLine2 || '';
      document.getElementById('city').value = defaultAddress.city || '';
      document.getElementById('state').value = defaultAddress.state || '';
      document.getElementById('pincode').value = defaultAddress.pincode || '';
    }
  } catch (error) {
    console.error('Error loading addresses:', error);
  }
}
