#!/bin/bash

# Comprehensive production diagnostics script
# Run this to see what's actually happening

echo "🔍 Production Server Diagnostics"
echo "================================"
echo ""

echo "1️⃣ Container Status:"
echo "-------------------"
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose ps"

echo ""
echo "2️⃣ Backend Logs (last 50 lines):"
echo "--------------------------------"
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose logs backend --tail=50"

echo ""
echo "3️⃣ Testing Health Endpoint:"
echo "--------------------------"
ssh -p 222 root@41.186.186.178 "curl -s http://localhost:5001/health | head -20"

echo ""
echo "4️⃣ Testing Products API:"
echo "-----------------------"
ssh -p 222 root@41.186.186.178 "curl -s -w '\nHTTP Status: %{http_code}\n' http://localhost:5001/api/products | head -30"

echo ""
echo "5️⃣ Testing Sales API:"
echo "-------------------"
ssh -p 222 root@41.186.186.178 "curl -s -w '\nHTTP Status: %{http_code}\n' 'http://localhost:5001/api/sales?page=1&limit=10' | head -30"

echo ""
echo "6️⃣ Recent Errors in Logs:"
echo "-------------------------"
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose logs backend --tail=200 | grep -i -E '(error|failed|exception|prisma|database)' | tail -20"

echo ""
echo "7️⃣ Checking Database Connection:"
echo "--------------------------------"
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose exec -T backend npx prisma db pull --print 2>&1 | head -5"

echo ""
echo "✅ Diagnostics complete!"
