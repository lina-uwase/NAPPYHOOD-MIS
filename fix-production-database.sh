#!/bin/bash

# Script to fix production database by running missing migrations
# This will create the missing products and sale_products tables

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "🔧 Fixing Production Database"
echo "============================="
echo ""

echo "1️⃣ Checking current database tables..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c '\dt' | grep -E '(products|sale_products)'
"

echo ""
echo "2️⃣ Running Prisma migrations..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend npx prisma migrate deploy
"

echo ""
echo "3️⃣ Verifying tables were created..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c '\dt' | grep -E '(products|sale_products)'
"

echo ""
echo "4️⃣ Regenerating Prisma Client..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend npx prisma generate
"

echo ""
echo "5️⃣ Restarting backend to apply changes..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose restart backend
"

echo ""
echo "✅ Database fix complete!"
echo ""
echo "🧪 Test the endpoints:"
echo "   curl http://your-domain.com/api/products"
echo "   curl http://your-domain.com/api/sales?page=1&limit=10"
