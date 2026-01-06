#!/bin/bash

# Quick script to rebuild and test production backend
# Usage: ./test-production-rebuild.sh

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "🔧 Rebuilding Backend Docker Image and Container"
echo "=================================================="

# Rebuild backend
echo "📦 Building backend image..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose build backend
"

# Stop and remove old container
echo "🛑 Stopping old backend container..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose stop backend &&
  docker-compose rm -f backend
"

# Start new container
echo "🚀 Starting new backend container..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose up -d backend
"

# Wait for container to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check status
echo "📊 Checking container status..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose ps backend
"

# Check logs
echo "📋 Recent backend logs:"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose logs backend --tail=30
"

# Test health endpoint
echo "🏥 Testing health endpoint..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s http://localhost:5001/health || echo 'Health check failed'
"

echo ""
echo "✅ Rebuild complete! Check the logs above for any errors."
echo "🌐 Test your API endpoints:"
echo "   - http://your-domain.com/api/products"
echo "   - http://your-domain.com/api/sales?page=1&limit=10"
