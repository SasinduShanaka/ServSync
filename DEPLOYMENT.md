# ServSync VPS Deployment Guide

## Overview
This guide covers deploying your MERN stack ServSync application to a VPS with proper production configuration, SSL, and process management.

## Prerequisites
- VPS with Ubuntu 20.04+ or similar
- Domain name pointed to your VPS IP
- SSH access to your server

## Step-by-Step Deployment

### 1. Server Setup & Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 2. MongoDB Configuration

```bash
# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user (optional but recommended)
mongosh
> use servSync
> db.createUser({
>   user: "servSyncUser",
>   pwd: "your_secure_password",
>   roles: ["readWrite"]
> })
> exit
```

### 3. Clone and Setup Application

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/irushashaveen/ServSync.git
sudo chown -R $USER:$USER /var/www/ServSync
cd ServSync

# Setup Backend
cd backend
npm install
cp .env.example .env  # Create if doesn't exist
```

### 4. Environment Configuration

Create production environment files:

**Backend `.env`:**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/servSync
# Or with auth: mongodb://servSyncUser:your_secure_password@localhost:27017/servSync

SESSION_SECRET=your_super_secure_session_secret_here_minimum_32_chars
FRONTEND_ORIGIN=https://yourdomain.com

# SMS Service (if using)
NOTIFYLK_USER_ID=your_user_id
NOTIFYLK_API_KEY=your_api_key
NOTIFYLK_SENDER_ID=your_sender_id

# File uploads
UPLOAD_DIR=/var/www/ServSync/backend/uploads

# SMS Worker
SMS_WORKER_ENABLED=true
SMS_WORKER_INTERVAL_MS=5000
```

**Frontend build configuration:**
```bash
cd ../frontend
npm install

# Create production build
VITE_API_URL=https://yourdomain.com npm run build
```

### 5. PM2 Process Configuration

Create PM2 ecosystem file:

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'servSync-backend',
    script: './server.js',
    cwd: '/var/www/ServSync/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/servSync-error.log',
    out_file: '/var/log/pm2/servSync-out.log',
    log_file: '/var/log/pm2/servSync-combined.log',
    time: true
  }]
};
```

```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Nginx Configuration

Create Nginx configuration:

**/etc/nginx/sites-available/servSync:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React build files
    root /var/www/ServSync/frontend/dist;
    index index.html;

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600;
        proxy_send_timeout 3600;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/ServSync/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    client_max_body_size 50M;
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/servSync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already setup by certbot)
sudo systemctl status certbot.timer
```

### 8. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 9. Monitoring and Logs

```bash
# Monitor PM2 processes
pm2 status
pm2 logs servSync-backend
pm2 monit

# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor MongoDB
sudo systemctl status mongod
```

## Production Deployment Script

Create an automated deployment script:

**deploy.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Deploying ServSync to production..."

# Pull latest code
git pull origin main

# Backend deployment
echo "📦 Building backend..."
cd backend
npm ci --only=production

# Frontend deployment  
echo "🎨 Building frontend..."
cd ../frontend
npm ci
VITE_API_URL=https://yourdomain.com npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart servSync-backend

echo "✅ Deployment complete!"
echo "🌐 Visit: https://yourdomain.com"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

## Health Check & Troubleshooting

### Check Services Status
```bash
# PM2 processes
pm2 status

# Nginx
sudo systemctl status nginx

# MongoDB
sudo systemctl status mongod

# Check ports
sudo netstat -tlnp | grep -E '(80|443|5000|27017)'
```

### Common Issues

1. **Backend not starting:**
   - Check PM2 logs: `pm2 logs servSync-backend`
   - Verify environment variables in `.env`
   - Check MongoDB connection

2. **Frontend not loading:**
   - Verify Nginx configuration
   - Check build output in `/var/www/ServSync/frontend/dist`
   - Check browser console for API URL issues

3. **WebSocket not working:**
   - Verify Socket.IO proxy configuration in Nginx
   - Check CORS settings in backend
   - Test WebSocket connection in browser dev tools

4. **File uploads failing:**
   - Check upload directory permissions
   - Verify `client_max_body_size` in Nginx
   - Check disk space

## Security Checklist

- ✅ MongoDB authentication enabled
- ✅ Strong session secret
- ✅ HTTPS/SSL certificate
- ✅ Firewall configured
- ✅ Regular security updates
- ✅ File upload restrictions
- ✅ Rate limiting (consider adding)
- ✅ Environment variables secured

## Backup Strategy

```bash
# MongoDB backup script
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/servSync_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -name "servSync_*" -mtime +7 -exec rm -rf {} \;
```

Add to crontab for daily backups:
```bash
sudo crontab -e
# Add: 0 2 * * * /path/to/backup_script.sh
```

Your ServSync application will be fully deployed and production-ready! 🎉