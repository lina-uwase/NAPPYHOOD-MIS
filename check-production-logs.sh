#!/bin/bash

# Script to check production server logs
# Usage: ./check-production-logs.sh [backend|all|errors]

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

case "${1:-backend}" in
    backend)
        echo "📋 Backend Logs (last 100 lines):"
        echo "=================================="
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
            cd $SERVER_PATH &&
            docker-compose logs backend --tail=100
        "
        ;;
    errors)
        echo "❌ Backend Error Logs (last 50 lines):"
        echo "====================================="
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
            cd $SERVER_PATH &&
            docker-compose logs backend --tail=200 | grep -i error || echo 'No errors found in recent logs'
        "
        ;;
    all)
        echo "📋 All Service Logs (last 50 lines each):"
        echo "=========================================="
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
            cd $SERVER_PATH &&
            echo '=== BACKEND ===' &&
            docker-compose logs backend --tail=50 &&
            echo '' &&
            echo '=== FRONTEND ===' &&
            docker-compose logs frontend --tail=50 &&
            echo '' &&
            echo '=== DATABASE ===' &&
            docker-compose logs postgres --tail=50
        "
        ;;
    follow)
        echo "👀 Following Backend Logs (Ctrl+C to exit):"
        echo "==========================================="
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
            cd $SERVER_PATH &&
            docker-compose logs -f backend
        "
        ;;
    *)
        echo "Usage: $0 [backend|errors|all|follow]"
        echo ""
        echo "Commands:"
        echo "  backend  - Show backend logs (default)"
        echo "  errors   - Show only error lines from backend"
        echo "  all      - Show logs from all services"
        echo "  follow   - Follow backend logs in real-time"
        ;;
esac
