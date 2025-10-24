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
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart servSync-backend

echo "✅ Deployment complete!"
echo "🌐 Visit: https://yourdomain.com"