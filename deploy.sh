#!/bin/bash

# Nappyhood Salon MIS Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Nappyhood Salon MIS deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Creating from example..."
    cp .env.production.example .env.production
    echo "📝 Please edit .env.production with your actual values before continuing."
    echo "   - Set POSTGRES_PASSWORD to a secure password"
    echo "   - Set JWT_SECRET to a secure random string"
    echo "   - Update other values as needed"
    read -p "Press Enter when you've configured .env.production..."
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down --remove-orphans
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check if backend is healthy
echo "🔍 Checking backend health..."
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed. Check logs with: docker-compose logs backend"
    exit 1
fi

# Check if frontend is accessible
echo "🔍 Checking frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible!"
else
    echo "❌ Frontend check failed. Check logs with: docker-compose logs frontend"
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001"
echo "   Health Check: http://localhost:5001/health"
echo ""
echo "📊 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Database access: docker-compose exec postgres psql -U postgres nappyhood_salon"
echo ""
echo "🔧 First-time setup:"
echo "   Run database migrations: docker-compose exec backend npx prisma migrate deploy"
echo "   Generate Prisma client: docker-compose exec backend npx prisma generate"