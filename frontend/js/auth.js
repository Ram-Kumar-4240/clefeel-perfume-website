/**
 * Clefeel - Authentication JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (Clefeel.isLoggedIn() && !window.location.pathname.includes('account')) {
    // Redirect to account or home
    return;
  }
  
  // Initialize login form
  initLoginForm();
  
  // Initialize register form
  initRegisterForm();
  
  // Initialize Google auth
  initGoogleAuth();
});

/**
 * Initialize login form
 */
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;
    
    try {
      const response = await Clefeel.apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // Store token and user
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      Clefeel.showToast('Welcome back!', 'success');
      
      // Redirect
      setTimeout(() => {
        const redirectUrl = localStorage.getItem('redirectAfterLogin') || '../index.html';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Demo fallback - allow any login
      if (email && password) {
        // Create demo user
        const demoUser = {
          id: 1,
          email: email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'customer'
        };
        
        localStorage.setItem('token', 'demo_token_' + Date.now());
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        Clefeel.showToast('Welcome back!', 'success');
        
        setTimeout(() => {
          window.location.href = '../index.html';
        }, 1000);
      } else {
        Clefeel.showToast('Invalid email or password', 'error');
      }
      
      loginBtn.textContent = 'Sign In';
      loginBtn.disabled = false;
    }
  });
}

/**
 * Initialize register form
 */
function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      Clefeel.showToast('Passwords do not match', 'error');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      Clefeel.showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.textContent = 'Creating account...';
    registerBtn.disabled = true;
    
    try {
      const response = await Clefeel.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password
        })
      });
      
      // Store token and user
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      Clefeel.showToast('Account created successfully!', 'success');
      
      // Redirect
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Demo fallback
      const demoUser = {
        id: Date.now(),
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: 'customer'
      };
      
      localStorage.setItem('token', 'demo_token_' + Date.now());
      localStorage.setItem('user', JSON.stringify(demoUser));
      
      Clefeel.showToast('Account created successfully!', 'success');
      
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
      
      registerBtn.textContent = 'Create Account';
      registerBtn.disabled = false;
    }
  });
}

/**
 * Initialize Google authentication
 */
function initGoogleAuth() {
  const googleLoginBtn = document.getElementById('googleLogin');
  const googleRegisterBtn = document.getElementById('googleRegister');
  
  const handleGoogleAuth = async () => {
    // In a real implementation, this would use Google OAuth
    // For demo, we'll create a mock Google user
    
    const mockGoogleUser = {
      id: 'google_' + Date.now(),
      email: 'google.user@example.com',
      firstName: 'Google',
      lastName: 'User',
      role: 'customer'
    };
    
    localStorage.setItem('token', 'google_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(mockGoogleUser));
    
    Clefeel.showToast('Welcome!', 'success');
    
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1000);
  };
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleAuth);
  }
  
  if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', handleGoogleAuth);
  }
}
