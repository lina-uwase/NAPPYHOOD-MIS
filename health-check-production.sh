#!/bin/bash

# Comprehensive Production Health Check Script
# Verifies all services are running correctly

SERVER_IP="41.186.186.178"
SERVER_PORT="222"
SERVER_USER="root"
SERVER_PATH="/opt/nappyhood"

echo "🏥 Production Health Check"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

echo "1️⃣ Docker Containers Status"
echo "---------------------------"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose ps
"
echo ""

echo "2️⃣ Database Tables Check"
echo "-------------------------"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c '\dt' | grep -E '(products|sale_products|customers|sales|services)' | wc -l
" | grep -q "5" && check_status 0 "All required tables exist" || check_status 1 "Missing some tables"
echo ""

echo "3️⃣ Products Data Check"
echo "----------------------"
PRODUCT_COUNT=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -t -c 'SELECT COUNT(*) FROM products;' | tr -d ' '
")
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    check_status 0 "Products table has $PRODUCT_COUNT product(s)"
    echo "   Products:"
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
      cd $SERVER_PATH &&
      docker-compose exec -T postgres psql -U postgres -d nappyhood_salon -c 'SELECT name, price FROM products ORDER BY name;'
    " | grep -E "^\s+\w" | head -10
else
    check_status 1 "Products table is empty"
fi
echo ""

echo "4️⃣ Backend Health Endpoint"
echo "--------------------------"
HEALTH_RESPONSE=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s http://localhost:5001/health | grep -o '\"status\":\"OK\"' || echo 'FAILED'
")
if [ "$HEALTH_RESPONSE" = '"status":"OK"' ]; then
    check_status 0 "Backend health check passed"
else
    check_status 1 "Backend health check failed"
fi
echo ""

echo "5️⃣ Products API Endpoint"
echo "------------------------"
PRODUCTS_API=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s -w '\nHTTP_CODE:%{http_code}' http://localhost:5001/api/products 2>&1 | tail -1
")
HTTP_CODE=$(echo "$PRODUCTS_API" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    check_status 0 "Products API returns 200 OK"
    PRODUCT_COUNT_API=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
      curl -s http://localhost:5001/api/products | grep -o '\"success\":true' || echo 'FAILED'
    ")
    if [ "$PRODUCT_COUNT_API" = '"success":true' ]; then
        echo "   ✅ API response structure is correct"
    fi
else
    check_status 1 "Products API returned HTTP $HTTP_CODE"
fi
echo ""

echo "6️⃣ Sales API Endpoint"
echo "---------------------"
SALES_API=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s -w '\nHTTP_CODE:%{http_code}' 'http://localhost:5001/api/sales?page=1&limit=10' 2>&1 | tail -1
")
HTTP_CODE=$(echo "$SALES_API" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    check_status 0 "Sales API returns 200 OK"
else
    check_status 1 "Sales API returned HTTP $HTTP_CODE"
fi
echo ""

echo "7️⃣ Customers API Endpoint"
echo "--------------------------"
CUSTOMERS_API=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  curl -s -w '\nHTTP_CODE:%{http_code}' 'http://localhost:5001/api/customers?limit=5' 2>&1 | tail -1
")
HTTP_CODE=$(echo "$CUSTOMERS_API" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    check_status 0 "Customers API returns $HTTP_CODE"
else
    check_status 1 "Customers API returned HTTP $HTTP_CODE"
fi
echo ""

echo "8️⃣ Recent Error Logs Check"
echo "--------------------------"
ERROR_COUNT=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose logs backend --since 5m 2>&1 | grep -i -E '(error|exception|failed)' | grep -v 'Health check' | wc -l | tr -d ' '
")
if [ "$ERROR_COUNT" -eq 0 ]; then
    check_status 0 "No errors in last 5 minutes"
else
    echo -e "${YELLOW}⚠️  Found $ERROR_COUNT error(s) in last 5 minutes${NC}"
    echo "   Recent errors:"
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
      cd $SERVER_PATH &&
      docker-compose logs backend --since 5m 2>&1 | grep -i -E '(error|exception|failed)' | grep -v 'Health check' | tail -5
    "
fi
echo ""

echo "9️⃣ Database Connection Test"
echo "---------------------------"
DB_TEST=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend node -e \"
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$connect()
      .then(() => { console.log('OK'); prisma.\$disconnect(); })
      .catch(e => { console.log('FAILED'); process.exit(1); });
  \" 2>&1
")
if echo "$DB_TEST" | grep -q "OK"; then
    check_status 0 "Database connection successful"
else
    check_status 1 "Database connection failed"
fi
echo ""

echo "🔟 Prisma Client Status"
echo "----------------------"
PRISMA_CHECK=$(ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
  cd $SERVER_PATH &&
  docker-compose exec -T backend ls -la node_modules/.prisma/client 2>&1 | head -3 | wc -l | tr -d ' '
")
if [ "$PRISMA_CHECK" -gt 0 ]; then
    check_status 0 "Prisma client is installed"
else
    check_status 1 "Prisma client not found"
fi
echo ""

echo "📊 Summary"
echo "=========="
echo "✅ All critical checks completed!"
echo ""
echo "🌐 Test from your browser:"
echo "   - Products: https://www.nappyhood.com/api/products"
echo "   - Sales: https://www.nappyhood.com/api/sales?page=1&limit=10"
echo "   - Health: https://www.nappyhood.com/health"
echo ""
echo "💡 If any checks failed, review the output above for details."
