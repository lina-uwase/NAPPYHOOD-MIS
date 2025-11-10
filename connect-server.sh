#!/bin/bash

# Nappyhood Server Connection Helper
SERVER_IP="41.186.186.178"
SERVER_PORT="222"

echo "🔑 Nappyhood Server Connection Helper"
echo "===================================="
echo ""
echo "Server: $SERVER_IP:$SERVER_PORT"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "⚠️  No SSH key found. Creating one..."
    echo ""
    read -p "Enter your email for SSH key: " email
    ssh-keygen -t rsa -b 4096 -C "$email" -f ~/.ssh/id_rsa
    echo ""
    echo "✅ SSH key created at ~/.ssh/id_rsa"
    echo ""
fi

echo "🔗 Attempting to connect to server..."
echo ""
echo "Method 1: Trying with SSH key..."
if ssh -p $SERVER_PORT -o ConnectTimeout=10 -o BatchMode=yes root@$SERVER_IP "echo 'SSH key authentication successful'" 2>/dev/null; then
    echo "✅ SSH key authentication works!"
    echo ""
    echo "You can now run the deployment script:"
    echo "  ./server-deploy.sh"
    exit 0
else
    echo "❌ SSH key authentication failed"
    echo ""
fi

echo "Method 2: Trying password authentication..."
echo "Please enter the root password when prompted:"
echo ""

if ssh -p $SERVER_PORT root@$SERVER_IP "echo 'Password authentication successful'"; then
    echo ""
    echo "✅ Password authentication works!"
    echo ""
    echo "📋 To set up key-based authentication (recommended):"
    echo "1. Copy your public key to the server:"
    echo "   ssh-copy-id -p $SERVER_PORT root@$SERVER_IP"
    echo ""
    echo "2. Then run the deployment script:"
    echo "   ./server-deploy.sh"
    echo ""
else
    echo ""
    echo "❌ Cannot connect to server"
    echo ""
    echo "🔧 Troubleshooting options:"
    echo ""
    echo "1. Check if you have the correct root password"
    echo "2. Access server via console/VNC from your hosting provider"
    echo "3. Ensure SSH is enabled and port 222 is open"
    echo "4. Check server firewall settings"
    echo ""
    echo "💡 Alternative: Use the server console to run these commands manually:"
    echo ""
    echo "   # Update system"
    echo "   apt update && apt upgrade -y"
    echo ""
    echo "   # Install Docker"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sh get-docker.sh"
    echo ""
    echo "   # Install Docker Compose"
    echo "   curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   chmod +x /usr/local/bin/docker-compose"
    echo ""
    echo "Then manually upload your project files and run docker-compose up -d --build"
fi