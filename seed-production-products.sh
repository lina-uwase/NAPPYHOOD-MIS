#!/bin/bash

# Script to seed products on production server

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "🌱 Seeding Products on Production"
echo "================================="
echo ""

echo "1️⃣ Building TypeScript (if needed)..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend npm run build 2>&1 | tail -5
"

echo ""
echo "2️⃣ Running products seed script..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend node dist/scripts/seedProducts.js
"

echo ""
echo "3️⃣ Verifying products were created..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c 'SELECT name, price FROM products;'
"

echo ""
echo "✅ Products seeding complete!"
