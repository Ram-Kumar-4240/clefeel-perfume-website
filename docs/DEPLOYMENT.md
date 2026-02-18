# Clefeel Perfume E-Commerce - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Cloudinary account (for image storage)
- Gmail account (for email notifications)
- Google OAuth credentials (optional, for social login)

## Local Development Setup

### 1. Clone and Setup Backend

```bash
cd clefeel-perfume/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Configure Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/clefeel

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters

# Frontend URL
FRONTEND_URL=http://localhost:5500
ADMIN_URL=http://localhost:5500/admin

# Email (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=admin@clefeel.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb clefeel

# Run migrations (automatic on first start)
npm start
```

### 4. Create Admin User

```bash
# Use the API to register, then manually update role in database
# Or run this SQL:
# UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### 5. Start Backend

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 6. Serve Frontend

For local development, use a simple HTTP server:

```bash
# Using Python 3
cd ../frontend
python -m http.server 5500

# Or using Node.js npx serve
npx serve -l 5500

# Or using VS Code Live Server extension
```

## Production Deployment

### Option 1: Render (Recommended - Free Tier)

#### Backend Deployment

1. Push code to GitHub
2. Connect Render to your repository
3. Create New Web Service
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all from .env

#### Database (Render PostgreSQL)

1. Create New PostgreSQL instance
2. Copy Internal Database URL
3. Add to environment variables as `DATABASE_URL`

#### Frontend (Static Site)

1. Create New Static Site on Render
2. Connect to same repository
3. Set publish directory to `frontend`
4. Add custom domain if needed

### Option 2: Railway (Free Tier)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL plugin
railway add --plugin postgres

# Deploy
railway up
```

### Option 3: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create clefeel-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set EMAIL_USER=your-email
# ... etc

# Deploy
git push heroku main
```

### Option 4: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into server
ssh user@your-server

# Install Node.js and PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx

# Clone repository
git clone https://github.com/yourusername/clefeel.git
cd clefeel/backend

# Install dependencies
npm install --production

# Setup PM2
sudo npm install -g pm2
pm2 start server.js --name clefeel-api

# Configure Nginx
sudo nano /etc/nginx/sites-available/clefeel
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name api.clefeel.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/clefeel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.clefeel.com
```

## Frontend Deployment

### Netlify (Recommended)

1. Push frontend code to GitHub
2. Connect Netlify to repository
3. Build settings:
   - Build command: (leave empty for static)
   - Publish directory: `frontend`
4. Add environment variables if needed
5. Deploy!

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

## Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Database is connected and tables created
- [ ] Email notifications working
- [ ] Image uploads working (Cloudinary)
- [ ] Frontend loads correctly
- [ ] All pages functional (Home, Shop, Product, Cart, Checkout)
- [ ] User registration working
- [ ] User login working
- [ ] Add to cart working
- [ ] Buy Now flow working
- [ ] Order placement working
- [ ] Admin panel accessible
- [ ] Admin can add products
- [ ] Admin can view orders
- [ ] SSL certificate installed
- [ ] Custom domain configured

## Monitoring & Maintenance

### Logs

```bash
# View PM2 logs
pm2 logs clefeel-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backup

```bash
# Backup PostgreSQL
pg_dump clefeel > backup_$(date +%Y%m%d).sql

# Restore
psql clefeel < backup_20240101.sql
```

### Updates

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Restart service
pm2 restart clefeel-api
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Email Not Working

- Verify Gmail App Password is correct
- Check "Less secure app access" is enabled or use App Password
- Check spam folders

### Images Not Uploading

- Verify Cloudinary credentials
- Check file size limits (max 5MB)
- Verify image format (jpg, png, webp)

### CORS Errors

- Update `FRONTEND_URL` in backend .env
- Ensure CORS middleware is configured correctly

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] Email password is App Password, not main password
- [ ] Cloudinary credentials are secure
- [ ] Rate limiting is enabled
- [ ] Helmet.js is configured
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] HTTPS enabled
- [ ] Secure cookies in production

## Support

For issues and questions:
- Check logs first
- Verify environment variables
- Test API endpoints with curl/Postman
- Check database connectivity
