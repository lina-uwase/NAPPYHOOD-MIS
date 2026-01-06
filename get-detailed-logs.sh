#!/bin/bash

# Get detailed error logs from production

echo "🔍 Checking for errors around the 500 response..."
echo "================================================"

# Get logs around the error time (12:07:48)
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose logs backend --since 30m | grep -A 10 -B 10 '12:07:48'"

echo ""
echo "🔍 Checking for any error messages..."
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose logs backend --since 1h | grep -i -E '(error|exception|failed|prisma|database|undefined|null)' | head -50"

echo ""
echo "🔍 Testing API endpoint now to see live error..."
ssh -p 222 root@41.186.186.178 "
  cd /opt/nappyhood &&
  echo 'Making request to /api/products...' &&
  docker-compose exec -T backend curl -s http://localhost:5001/api/products || echo 'Request failed'
"

echo ""
echo "🔍 Checking if we can see console output..."
ssh -p 222 root@41.186.186.178 "cd /opt/nappyhood && docker-compose logs backend --tail=500 | grep -E '(Get all products|Get sales|error|Error|ERROR)' | tail -30"
