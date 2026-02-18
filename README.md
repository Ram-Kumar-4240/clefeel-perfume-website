# Clefeel Perfume E-Commerce Platform

A production-ready, full-stack perfume e-commerce website built for small business operations.

## 🌟 Features

### Customer-Facing
- **Home Page** - Hero section, featured products, brand story
- **Shop Page** - Product grid with filters (Gender, Price) and sorting
- **Product Detail** - Size variants, quantity selector, stock status
- **Buy Now Flow** - Direct checkout without cart
- **Cart** - Add, update, remove items
- **User Authentication** - Email/password + Google OAuth
- **Order History** - View past orders
- **Responsive Design** - Mobile, tablet, desktop optimized

### Admin Panel
- **Dashboard** - Stats, recent orders
- **Product Management** - Add, edit, delete products with variants
- **Order Management** - View all orders, update status
- **Stock Management** - Track inventory

### Backend Features
- **REST API** - Node.js + Express
- **PostgreSQL Database** - Robust data storage
- **Email Notifications** - Order confirmations to admin
- **Image Storage** - Cloudinary integration
- **Security** - JWT auth, rate limiting, input validation

## 📁 Project Structure

```
clefeel-perfume/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── config/         # Database, email, cloudinary
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation
│   │   ├── models/         # Database queries
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   ├── server.js           # Entry point
│   └── package.json
├── frontend/               # Customer website
│   ├── css/style.css
│   ├── js/main.js
│   ├── index.html          # Home
│   ├── shop.html           # Product listing
│   ├── product.html        # Product detail
│   ├── cart.html           # Shopping cart
│   ├── buy-now.html        # Direct checkout
│   ├── login.html          # User login
│   ├── register.html       # User registration
│   └── account.html        # User profile
├── admin/                  # Admin panel
│   ├── index.html          # Admin login
│   └── dashboard.html      # Admin dashboard
└── docs/                   # Documentation
    ├── ARCHITECTURE.md
    └── DEPLOYMENT.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Cloudinary account
- Gmail account (for emails)

### Backend Setup

```bash
cd backend
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Edit with your credentials
nano .env

# Start server
npm run dev
```

### Frontend Setup

```bash
# Serve frontend folder with any static server
cd frontend
python -m http.server 5500
# or
npx serve -l 5500
```

### Admin Setup

```bash
# Access admin panel
open http://localhost:5500/admin/

# Login with admin credentials
# (First create a user via API, then update role to 'admin' in DB)
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/clefeel

# JWT
JWT_SECRET=your-super-secret-key

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
```

## 📊 Database Schema

### Tables
- **users** - Customer and admin accounts
- **perfumes** - Product information
- **variants** - Size/price combinations
- **orders** - Order records
- **order_items** - Order line items
- **cart** - Shopping cart items
- **enquiries** - Customer inquiries

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/perfumes` - List products (with filters)
- `GET /api/perfumes/featured` - Featured products
- `GET /api/perfumes/:slug` - Product details

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item

### Orders
- `POST /api/orders` - Create order (Buy Now)
- `POST /api/orders/from-cart` - Checkout cart
- `GET /api/orders/my-orders` - User order history

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/orders` - All orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `POST /api/perfumes` - Add product (admin)

## 🛒 Buy Now Flow

1. User clicks "Buy Now" on product page
2. System redirects to `buy-now.html` with product params
3. User fills delivery details
4. System shows order summary
5. User confirms order
6. Backend:
   - Validates stock
   - Creates order
   - Sends email notification to admin
   - Returns order confirmation
7. User sees success page

## 📧 Email Notifications

Order emails include:
- Order number
- Customer details (name, email, phone, address)
- Product list with quantities and prices
- Total amount
- Link to view order in admin

## 🎨 Design System

- **Colors**: Gold accent (#C9A962), Light backgrounds
- **Typography**: Playfair Display (headings), Inter (body)
- **Components**: Cards, buttons, forms, tables
- **Responsive**: Mobile-first approach

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Manual testing checklist
- [ ] User registration
- [ ] User login
- [ ] Add to cart
- [ ] Buy Now flow
- [ ] Order placement
- [ ] Email notification
- [ ] Admin product creation
- [ ] Admin order management
```

## 🚀 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

### Recommended Platforms
- **Backend**: Render, Railway, Heroku
- **Frontend**: Netlify, Vercel, Cloudflare Pages
- **Database**: Render PostgreSQL, Supabase
- **Images**: Cloudinary

## 💰 Cost Estimation (Monthly)

| Service | Free Tier | Paid (Small) |
|---------|-----------|--------------|
| Backend (Render) | $0 | $7 |
| Database (Render) | $0 | $0 (included) |
| Frontend (Netlify) | $0 | $0 |
| Images (Cloudinary) | $0 | $0 |
| Email (Gmail) | $0 | $0 |
| **Total** | **$0** | **$7** |

## 🔒 Security Features

- Password hashing (bcrypt)
- JWT authentication
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection
- CORS configuration
- Helmet security headers

## 📝 License

MIT License - Free for commercial use

## 🤝 Support

For issues and questions:
1. Check the documentation
2. Review the logs
3. Test API endpoints
4. Verify environment variables

---

Built with ❤️ for perfume businesses
