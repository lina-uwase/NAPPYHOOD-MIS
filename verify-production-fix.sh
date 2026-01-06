#!/bin/bash

# Verify that production is working correctly

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "✅ Verifying Production Fix"
echo "=========================="
echo ""

echo "1️⃣ Checking products table data..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c 'SELECT COUNT(*) FROM products;'
"

echo ""
echo "2️⃣ Testing Products API endpoint..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s http://localhost:5001/api/products | head -50
"

echo ""
echo "3️⃣ Testing Sales API endpoint..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s 'http://localhost:5001/api/sales?page=1&limit=10' | head -50
"

echo ""
echo "4️⃣ Checking recent backend logs for errors..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose logs backend --tail=20 | grep -i error || echo 'No errors found ✅'
"

echo ""
echo "✅ Verification complete!"
