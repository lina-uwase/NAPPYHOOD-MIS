#!/bin/bash

echo "🚀 EMERGENCY FIX DEPLOYMENT SCRIPT"
echo "=================================="
echo "This script fixes the 'b is not a function' JavaScript error"
echo "and restores proper server connectivity."
echo

# Check server connectivity
echo "📡 Checking server connectivity..."
if ping -c 3 41.186.186.178 > /dev/null 2>&1; then
    echo "✅ Server is reachable"
else
    echo "❌ Server unreachable. Check network connection."
    exit 1
fi

# Backup current state
echo "💾 Creating backup of current React build..."
cd /Users/lina/Documents/Mine/NAPPYHOOD\ MIS/web
tar -czf "backup-before-fix-$(date +%Y%m%d-%H%M%S).tar.gz" .next src package.json next.config.ts || true

echo "🔧 Uploading fixed React build to server..."
scp -o ConnectTimeout=30 working-react-build.tar.gz root@41.186.186.178:/root/

echo "🔄 Applying fix on server..."
ssh -o ConnectTimeout=30 root@41.186.186.178 << 'EOF'
    cd /root

    # Stop frontend container
    echo "⏹️  Stopping frontend container..."
    docker stop nappyhood-frontend-1 || true

    # Backup current frontend
    echo "💾 Backing up current frontend..."
    docker cp nappyhood-frontend-1:/app /root/frontend-backup-$(date +%Y%m%d-%H%M%S) || true

    # Extract fixed build
    echo "📦 Extracting fixed React build..."
    tar -xzf working-react-build.tar.gz -C /root/web/ || {
        echo "❌ Failed to extract build"
        exit 1
    }

    # Rebuild frontend container
    echo "🔨 Rebuilding frontend container..."
    cd /root
    docker-compose build frontend

    # Restart services
    echo "🚀 Restarting services..."
    docker-compose up -d

    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 10

    # Check service status
    echo "🔍 Checking service status..."
    docker ps

    echo "✅ Emergency fix deployment completed!"
    echo "🌐 Application should now be accessible at https://nappyhood.com"
EOF

echo
echo "✅ DEPLOYMENT COMPLETED!"
echo "🌐 Please check https://nappyhood.com to verify the fix"
echo "📊 Monitor server: Visit your server monitoring dashboard"
echo
echo "If issues persist:"
echo "1. Check server logs: ssh root@41.186.186.178 'docker logs nappyhood-frontend-1'"
echo "2. Restart services: ssh root@41.186.186.178 'cd /root && docker-compose restart'"
echo "3. Contact system administrator"