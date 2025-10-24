# ServSync cPanel Deployment Guide

## Overview
Deploy your MERN stack ServSync to cPanel hosting with proper configuration for shared hosting environment.

## Prerequisites
- cPanel hosting account (VPS Silver)
- Domain configured in cPanel
- SSH access (if available) or File Manager access

## Step-by-Step cPanel Deployment

### 1. Access Your cPanel

1. Log into your hosting provider's client area
2. Find and click "cPanel" or "Open cPanel"
3. Or visit: `https://yourdomain.com:2083` (replace with your domain)

### 2. Enable Node.js (Required for Backend)

1. **In cPanel, find "Setup Node.js App"**
   - Look in "Software" section
   - Click "Setup Node.js App"

2. **Create Node.js Application**
   - Click "Create Application"
   - **Node.js version**: Select 18.x or latest available
   - **Application mode**: Production
   - **Application root**: `backend` 
   - **Application URL**: Leave blank or use subdomain like `api.yourdomain.com`
   - **Application startup file**: `server.js`
   - Click "Create"

### 3. Upload Your Project Files

**Option A: Using File Manager (Recommended)**

1. **Open File Manager in cPanel**
   - Navigate to `public_html` folder
   - Create folder structure:
     ```
     public_html/
     ├── backend/          (Node.js app files)
     ├── frontend/         (React build files - will go directly in public_html)
     ```

2. **Upload Backend Files**
   - Go to `public_html/backend/`
   - Upload all backend files EXCEPT `node_modules` folder
   - Upload: `server.js`, `package.json`, all folders (config, controllers, models, routes, etc.)

3. **Upload Frontend Build**
   - First, build your frontend locally:
   ```bash
   cd C:\Y2S2-ITP-Project\ServSync\frontend
   npm run build
   ```
   - Upload contents of `dist` folder directly to `public_html/`
   - Your `public_html` should have: `index.html`, `assets/`, etc.

**Option B: Using SSH (if available)**

```bash
# Connect via SSH
ssh username@your-server-ip

# Navigate to web directory
cd public_html

# Clone repository
git clone https://github.com/irushashaveen/ServSync.git temp
mv temp/backend ./
mv temp/frontend ./
rm -rf temp

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Move built files to public_html root
mv frontend/dist/* ./
```

### 4. Configure Node.js Dependencies

1. **Go back to "Setup Node.js App" in cPanel**
2. **Click on your application name**
3. **In the terminal section or "Run NPM Install"**
   - This installs all dependencies from package.json
   - Wait for completion (may take 5-10 minutes)

### 5. Environment Variables Setup

1. **In Node.js App settings, find "Environment variables"**
2. **Add these variables:**

   ```
   NODE_ENV = production
   PORT = (leave empty - cPanel assigns automatically)
   MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/servSync
   SESSION_SECRET = your_super_secure_session_secret_here_32_chars
   FRONTEND_ORIGIN = https://yourdomain.com
   NOTIFYLK_USER_ID = your_sms_user_id
   NOTIFYLK_API_KEY = your_sms_api_key
   NOTIFYLK_SENDER_ID = your_sms_sender_id
   UPLOAD_DIR = /home/username/public_html/backend/uploads
   SMS_WORKER_ENABLED = true
   SMS_WORKER_INTERVAL_MS = 5000
   ```

### 6. Database Setup (MongoDB Atlas - Recommended for cPanel)

Since cPanel might not have MongoDB, use MongoDB Atlas (free tier):

1. **Create MongoDB Atlas Account**
   - Visit: https://www.mongodb.com/atlas
   - Create free cluster

2. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Use this as your `MONGO_URI`

3. **Whitelist IPs**
   - In Atlas, go to Network Access
   - Add your server's IP address or use `0.0.0.0/0` for all IPs (less secure but works)

### 7. Configure .htaccess for React Router

Create `.htaccess` in `public_html` root:

```apache
# Enable rewrite engine
RewriteEngine On

# Handle API routes - proxy to Node.js app
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ https://yourdomain.com:port/api/$1 [P,L]

# Handle Socket.IO
RewriteCond %{REQUEST_URI} ^/socket.io/
RewriteRule ^socket.io/(.*)$ https://yourdomain.com:port/socket.io/$1 [P,L]

# Handle React Router - all other routes go to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/socket.io/
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### 8. Start Your Node.js Application

1. **Go to "Setup Node.js App" in cPanel**
2. **Click on your application**
3. **Click "Start App" or "Restart App"**
4. **Note the port number** cPanel assigns (usually shows in app details)

### 9. Update Frontend API URLs

If your Node.js app gets assigned a specific port, update your frontend API calls:

**Option A: Environment-based (Recommended)**
Create `frontend/src/config.js`:
```javascript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:5000';
```

**Option B: Update .htaccess with correct port**
Replace `port` in the .htaccess file with the actual port cPanel assigned.

### 10. SSL Certificate Setup

1. **In cPanel, find "SSL/TLS"**
2. **Go to "Let's Encrypt SSL"**
3. **Select your domain and click "Issue"**
4. **Wait for certificate generation**
5. **Force HTTPS redirect** in SSL/TLS settings

### 11. Create Uploads Directory

1. **In File Manager, go to `backend/` folder**
2. **Create new folder called `uploads`**
3. **Set permissions to 755**

### 12. Test Your Deployment

Visit these URLs to verify everything works:

1. **Frontend**: `https://yourdomain.com`
2. **API**: `https://yourdomain.com/api/sessions`
3. **Node.js Status**: Check in cPanel Node.js App section
4. **Queue Display**: `https://yourdomain.com/queue-display.html`

### 13. Configure ESP32 Connection

Update your ESP32 code with production URLs:
```cpp
// Replace in your ESP32 code
const char* SERVER_URL = "https://yourdomain.com/api/iot/display?sessionId=SESSION_ID&counterId=COUNTER_ID";

// For WebSocket (if using)
// ws://yourdomain.com:assigned_port/socket.io/
```

## Troubleshooting Common cPanel Issues

### 1. Node.js App Won't Start
- Check error logs in Node.js App section
- Verify all environment variables are set
- Ensure MongoDB connection string is correct
- Check if all dependencies installed properly

### 2. API Routes Return 404
- Verify .htaccess file is in public_html root
- Check if mod_rewrite is enabled (ask hosting provider)
- Ensure Node.js port in .htaccess matches assigned port

### 3. File Upload Issues
- Check uploads directory exists and has correct permissions
- Verify file size limits in cPanel (PHP Settings)
- Check disk space usage

### 4. WebSocket Not Working
- Some shared hosting blocks WebSocket connections
- Contact hosting provider to enable WebSocket support
- Alternative: Use polling mode for ESP32

### 5. Database Connection Failed
- Verify MongoDB Atlas IP whitelist includes your server
- Check connection string format
- Test connection from cPanel terminal if available

## Automated Updates

Create a simple update process:

1. **Make changes locally**
2. **Build frontend**: `npm run build`
3. **Upload changed files via File Manager**
4. **Restart Node.js app in cPanel**

## Performance Tips for cPanel

1. **Enable compression** (included in .htaccess)
2. **Use CDN** for static assets if available
3. **Optimize images** before upload
4. **Monitor resource usage** in cPanel
5. **Use caching** for API responses where appropriate

## Security Checklist for cPanel

- ✅ Strong passwords for cPanel and database
- ✅ SSL certificate enabled
- ✅ Secure environment variables
- ✅ File permissions properly set
- ✅ Regular backups via cPanel
- ✅ Keep Node.js and dependencies updated

Your ServSync application should now be fully deployed on cPanel hosting! 🎉

For ESP32 displays, they can now connect to:
- **API**: `https://yourdomain.com/api/iot/display?sessionId=...&counterId=...`
- **Display Page**: `https://yourdomain.com/queue-display.html?sessionId=...&counterId=...`