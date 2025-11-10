#!/bin/bash

# Nappyhood Salon MIS - Ubuntu Server Deployment Script
# Usage: ./server-deploy.sh
# Server: 41.186.186.178:222

set -e

echo "🚀 Nappyhood Salon MIS - Ubuntu Server Deployment"
echo "=================================================="

# Configuration
SERVER_IP="41.186.186.178"
SERVER_PORT="222"
APP_DIR="/opt/nappyhood"
DOMAIN="nappyhood.com"  # Update this with your actual domain

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we can connect to the server
check_server_connection() {
    echo "🔍 Checking server connection..."
    if ssh -p $SERVER_PORT root@$SERVER_IP -o ConnectTimeout=10 "echo 'Connection successful'" > /dev/null 2>&1; then
        print_status "Server connection established"
    else
        print_error "Cannot connect to server. Please ensure:"
        echo "  1. You have SSH access configured"
        echo "  2. Server is running and accessible"
        echo "  3. Port 222 is open"
        echo ""
        echo "To set up SSH key authentication:"
        echo "  ssh-copy-id -p 222 root@$SERVER_IP"
        exit 1
    fi
}

# Main deployment function
deploy_to_server() {
    echo "📦 Starting deployment to server..."

    # Create deployment script for server
    cat > /tmp/nappyhood-setup.sh << 'EOF'
#!/bin/bash

set -e

echo "🔧 Setting up Nappyhood Salon MIS on Ubuntu Server"

# Update system
echo "📝 Updating system packages..."
apt update && apt upgrade -y

# Install basic dependencies
echo "📦 Installing basic dependencies..."
apt install -y curl wget git nginx software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐙 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create application directory
APP_DIR="/opt/nappyhood"
echo "📁 Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (you'll need to update this with your actual repo URL)
echo "📥 Cloning repository..."
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest changes..."
    git pull
else
    echo "⚠️  Please manually upload your code to $APP_DIR or set up git repository"
    echo "   You can use: scp -P 222 -r . root@41.186.186.178:$APP_DIR"
fi

# Create production environment file
echo "⚙️  Setting up environment configuration..."
cat > .env.production << 'ENVEOF'
# Database Configuration
POSTGRES_PASSWORD=nappyhood_secure_password_2024

# JWT Configuration
JWT_SECRET=nappyhood_jwt_super_secure_secret_key_2024

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001

# Production Settings
NODE_ENV=production
ENVEOF

echo "✅ Environment file created at .env.production"

# Set up firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 22
ufw allow 222
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 5001
echo "✅ Firewall configured"

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/nappyhood << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/nappyhood /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "✅ Nginx configured and reloaded"

echo ""
echo "🎉 Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your application code to: $APP_DIR"
echo "2. Run: cd $APP_DIR && docker-compose up -d --build"
echo "3. Run migrations: docker-compose exec backend npx prisma migrate deploy"
echo "4. Access your app at: http://41.186.186.178"
echo ""
echo "📊 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
EOF

    # Copy and execute setup script on server
    echo "📤 Uploading setup script to server..."
    scp -P $SERVER_PORT /tmp/nappyhood-setup.sh root@$SERVER_IP:/tmp/

    echo "🔧 Executing setup script on server..."
    ssh -p $SERVER_PORT root@$SERVER_IP "chmod +x /tmp/nappyhood-setup.sh && /tmp/nappyhood-setup.sh"

    print_status "Server setup completed!"
}

# Upload application code
upload_code() {
    echo "📤 Uploading application code..."

    # Create temporary deployment package
    echo "📦 Creating deployment package..."
    TEMP_DIR=$(mktemp -d)

    # Copy necessary files
    cp -r backend "$TEMP_DIR/"
    cp -r web "$TEMP_DIR/"
    cp docker-compose.yml "$TEMP_DIR/"
    cp .env.production.example "$TEMP_DIR/" 2>/dev/null || echo "No .env.production.example found"

    # Upload to server
    echo "⬆️  Uploading to server..."
    scp -P $SERVER_PORT -r "$TEMP_DIR"/* root@$SERVER_IP:/opt/nappyhood/

    # Cleanup
    rm -rf "$TEMP_DIR"

    print_status "Code uploaded successfully!"
}

# Deploy application
deploy_application() {
    echo "🚀 Deploying application..."

    ssh -p $SERVER_PORT root@$SERVER_IP << 'EOF'
cd /opt/nappyhood

# Stop any running containers
docker-compose down 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Run database setup
echo "🗄️  Setting up database..."
docker-compose exec -T backend npx prisma migrate deploy
docker-compose exec -T backend npx prisma generate
docker-compose exec -T backend npm run seed

# Check health
echo "🔍 Checking application health..."
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible!"
else
    echo "❌ Frontend check failed"
    docker-compose logs frontend
fi
EOF

    print_status "Application deployed successfully!"
}

# Main execution
main() {
    echo "Starting deployment process..."
    echo ""

    # Check server connection
    check_server_connection

    # Ask for confirmation
    echo ""
    print_warning "This will install Docker, Nginx, and deploy the application to:"
    echo "  Server: $SERVER_IP:$SERVER_PORT"
    echo "  Directory: $APP_DIR"
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi

    # Execute deployment steps
    deploy_to_server
    upload_code
    deploy_application

    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Your application is now accessible at:"
    echo "   Frontend: http://$SERVER_IP"
    echo "   Backend API: http://$SERVER_IP/api"
    echo "   Health Check: http://$SERVER_IP/health"
    echo ""
    echo "🔐 Default login credentials:"
    echo "   Email: nappyhood.boutique@gmail.com"
    echo "   Password: admin123"
    echo ""
    echo "📊 Server management commands:"
    echo "   SSH into server: ssh -p $SERVER_PORT root@$SERVER_IP"
    echo "   View logs: cd /opt/nappyhood && docker-compose logs -f"
    echo "   Restart app: cd /opt/nappyhood && docker-compose restart"
    echo "   Stop app: cd /opt/nappyhood && docker-compose down"
    echo ""
    print_warning "Important: Change default passwords and configure SSL certificate for production use!"
}

# Run main function
main "$@"