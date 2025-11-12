#!/bin/bash

# Nappyhood MIS Server Deployment Script
# Usage: ./server-deploy.sh [frontend|backend|full]

set -e

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "🚀 Nappyhood MIS Server Deployment Script"
echo "========================================="

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Deploying frontend..."

    # Build locally first for faster feedback
    echo "🔨 Building frontend locally..."
    cd web
    npm run build
    cd ..

    # Copy frontend files to server
    echo "📤 Copying frontend files to server..."
    rsync -avz -e "ssh -p $SERVER_PORT" --delete \
        --exclude node_modules \
        --exclude .git \
        --exclude .env.local \
        web/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/web/

    # Build and restart frontend on server
    echo "🔧 Building and restarting frontend on server..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        cd $SERVER_PATH
        docker build -t nappyhood-frontend-latest ./web
        docker stop nappyhood-frontend 2>/dev/null || true
        docker rm nappyhood-frontend 2>/dev/null || true
        docker run -d --name nappyhood-frontend --network nappyhood_default -p 3000:3000 nappyhood-frontend-latest
    "

    echo "✅ Frontend deployed successfully!"
}

# Function to deploy backend
deploy_backend() {
    echo "📦 Deploying backend..."

    # Copy backend files to server
    echo "📤 Copying backend files to server..."
    rsync -avz -e "ssh -p $SERVER_PORT" --delete \
        --exclude node_modules \
        --exclude .git \
        backend/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/

    # Restart backend services
    echo "🔧 Restarting backend services..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        cd $SERVER_PATH
        docker-compose restart backend
    "

    echo "✅ Backend deployed successfully!"
}

# Function to deploy everything
deploy_full() {
    echo "📦 Deploying full application..."

    # Copy all files to server
    echo "📤 Copying all files to server..."
    rsync -avz -e "ssh -p $SERVER_PORT" --delete \
        --exclude node_modules \
        --exclude .git \
        --exclude web/.env.local \
        --exclude backend/node_modules \
        . $SERVER_USER@$SERVER_IP:$SERVER_PATH/

    # Restart all services
    echo "🔧 Restarting all services..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        cd $SERVER_PATH
        docker-compose down
        docker-compose up -d
    "

    echo "✅ Full application deployed successfully!"
}

# Function to check server status
check_status() {
    echo "📊 Checking server status..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        echo '=== Docker Containers ==='
        docker ps
        echo ''
        echo '=== Service Health ==='
        curl -s http://localhost:5001/health || echo 'Backend health check failed'
        curl -s http://localhost:3000 > /dev/null && echo 'Frontend is running' || echo 'Frontend health check failed'
    "
}

# Main script logic
case "${1:-help}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    full)
        deploy_full
        ;;
    status)
        check_status
        ;;
    help|*)
        echo "Usage: $0 [frontend|backend|full|status]"
        echo ""
        echo "Commands:"
        echo "  frontend  - Deploy only frontend changes"
        echo "  backend   - Deploy only backend changes"
        echo "  full      - Deploy complete application"
        echo "  status    - Check server status"
        echo ""
        echo "Examples:"
        echo "  $0 frontend    # Deploy frontend changes"
        echo "  $0 backend     # Deploy backend changes"
        echo "  $0 full        # Deploy everything"
        echo "  $0 status      # Check if services are running"
        ;;
esac
