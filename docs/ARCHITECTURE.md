# Clefeel Perfume E-Commerce - System Architecture

## Overview
A production-ready perfume e-commerce platform with customer-facing storefront, admin panel, and secure order management.

## Tech Stack

### Frontend (Customer)
- **HTML5** - Semantic structure
- **CSS3** - Custom styling with CSS variables
- **Vanilla JavaScript** - No frameworks for fast loading
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Nodemailer** - Email notifications
- **Multer** - File upload handling
- **bcrypt** - Password hashing

### Admin Panel
- **HTML/CSS/JS** - Standalone admin interface
- **Chart.js** (optional) - Analytics visualization

### External Services
- **Cloudinary** - Image storage and optimization
- **Google OAuth** - Social authentication
- **SMTP Provider** - Email delivery (Gmail/SendGrid)

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Perfumes Table
```sql
CREATE TABLE perfumes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  gender VARCHAR(20) CHECK (gender IN ('men', 'women', 'unisex')),
  brand VARCHAR(100),
  category VARCHAR(100),
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Variants Table
```sql
CREATE TABLE variants (
  id SERIAL PRIMARY KEY,
  perfume_id INTEGER REFERENCES perfumes(id) ON DELETE CASCADE,
  size VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES variants(id),
  perfume_name VARCHAR(255),
  size VARCHAR(20),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);
```

### Cart Table
```sql
CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES variants(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, variant_id)
);
```

### Enquiries Table
```sql
CREATE TABLE enquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Email registration
- `POST /api/auth/login` - Email login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/verify/:token` - Email verification
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/perfumes` - List all perfumes (with filters)
- `GET /api/perfumes/:slug` - Get single perfume
- `GET /api/perfumes/featured` - Get featured perfumes

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove from cart
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order (Buy Now + Cart Checkout)
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/perfumes` - List all perfumes
- `POST /api/admin/perfumes` - Create perfume
- `PUT /api/admin/perfumes/:id` - Update perfume
- `DELETE /api/admin/perfumes/:id` - Delete perfume
- `GET /api/admin/orders` - List all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/enquiries` - List enquiries

## Buy Now Flow

```
1. User clicks "Buy Now" on product page
2. Frontend redirects to /buy-now.html with product params
3. User fills delivery form (name, email, phone, address)
4. System shows order summary
5. User confirms order
6. Backend:
   - Validates stock
   - Creates order with status 'pending'
   - Sends email notification to admin
   - Returns order confirmation
7. User sees order confirmation page
```

## Email Notification Template

**Subject:** New Order Received - #{ORDER_NUMBER}

**Body:**
```
New Order Received

Order ID: {ORDER_NUMBER}
Customer: {NAME}
Email: {EMAIL}
Phone: {PHONE}
Address: {ADDRESS}

Products:
- {PRODUCT_NAME} ({SIZE}) x {QUANTITY} = ${PRICE}

Total Amount: ${TOTAL}

View Order: {ADMIN_ORDER_LINK}
```

## Security Measures

1. **Password Hashing** - bcrypt with salt rounds 12
2. **JWT Tokens** - 24h expiry, secure httpOnly cookies
3. **Rate Limiting** - 100 requests per 15 minutes
4. **Input Validation** - express-validator
5. **SQL Injection Protection** - Parameterized queries
6. **CORS** - Configured for specific origins
7. **Helmet** - Security headers

## File Structure

```
clefeel-perfume/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, email, cloudinary config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handlers
│   │   ├── models/         # Database queries
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── uploads/            # Temporary upload folder
│   ├── migrations/         # SQL migration files
│   └── server.js           # Entry point
├── frontend/
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   ├── pages/             # HTML pages
│   └── images/            # Static images
├── admin/
│   ├── css/               # Admin styles
│   ├── js/                # Admin JavaScript
│   └── pages/             # Admin HTML pages
└── docs/                  # Documentation
```

## Deployment Checklist

- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up Cloudinary account
- [ ] Configure Google OAuth credentials
- [ ] Set up SMTP email service
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Deploy backend (Render/Railway/Heroku)
- [ ] Deploy frontend (Netlify/Vercel)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Test all flows end-to-end
