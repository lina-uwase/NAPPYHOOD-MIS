#!/bin/bash

# Deployment Validation Script for Nappyhood
# Ensures all systems are working correctly after changes

echo "🔍 DEPLOYMENT VALIDATION SYSTEM"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${BLUE}📡 Testing API endpoints...${NC}"

    # Test health endpoint
    if curl -s -f https://nappyhood.com/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint responding${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
        ((FAILED++))
    fi

    # Test services endpoint (with auth header - will fail auth but should not crash)
    SERVICES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://nappyhood.com/api/services)
    if [ "$SERVICES_RESPONSE" = "401" ] || [ "$SERVICES_RESPONSE" = "403" ]; then
        echo -e "${GREEN}✅ Services endpoint responding (auth required)${NC}"
        ((PASSED++))
    elif [ "$SERVICES_RESPONSE" = "500" ]; then
        echo -e "${RED}❌ Services endpoint returning 500 error${NC}"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠️  Services endpoint returned unexpected code: $SERVICES_RESPONSE${NC}"
        ((WARNINGS++))
    fi

    # Test auth endpoint
    AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://nappyhood.com/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test","password":"test"}')
    if [ "$AUTH_RESPONSE" = "400" ] || [ "$AUTH_RESPONSE" = "401" ]; then
        echo -e "${GREEN}✅ Auth endpoint responding (invalid creds rejected)${NC}"
        ((PASSED++))
    elif [ "$AUTH_RESPONSE" = "500" ]; then
        echo -e "${RED}❌ Auth endpoint returning 500 error${NC}"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠️  Auth endpoint returned unexpected code: $AUTH_RESPONSE${NC}"
        ((WARNINGS++))
    fi
}

# Function to test containers
test_containers() {
    echo -e "${BLUE}🐳 Testing container status...${NC}"

    # Check backend
    if docker ps | grep -q "nappyhood-backend-1.*Up"; then
        echo -e "${GREEN}✅ Backend container running${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Backend container not running${NC}"
        ((FAILED++))
    fi

    # Check frontend
    if docker ps | grep -q "nappyhood-frontend-1.*Up"; then
        echo -e "${GREEN}✅ Frontend container running${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Frontend container not running${NC}"
        ((FAILED++))
    fi

    # Check database
    if docker ps | grep -q "nappyhood-postgres-1.*Up.*healthy"; then
        echo -e "${GREEN}✅ Database container healthy${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Database container unhealthy${NC}"
        ((FAILED++))
    fi
}

# Function to test TypeScript compilation
test_typescript_compilation() {
    echo -e "${BLUE}📝 Testing TypeScript compilation...${NC}"

    # Check if source files are newer than compiled files
    NEEDS_REBUILD=$(docker exec nappyhood-backend-1 find /app/src -name "*.ts" -newer /app/dist/index.js 2>/dev/null | wc -l)

    if [ "$NEEDS_REBUILD" -eq 0 ]; then
        echo -e "${GREEN}✅ Compiled JavaScript is up to date${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  TypeScript files are newer than compiled JavaScript${NC}"
        echo -e "${YELLOW}    Run /root/auto-compile-typescript.sh to fix${NC}"
        ((WARNINGS++))
    fi

    # Check if critical endpoints have required features
    SERVICES_CODE=$(docker exec nappyhood-backend-1 grep -c "skip.*take" /app/dist/controllers/serviceController.js 2>/dev/null || echo 0)
    if [ "$SERVICES_CODE" -gt 0 ]; then
        echo -e "${GREEN}✅ Services pagination compiled correctly${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Services pagination missing in compiled code${NC}"
        ((FAILED++))
    fi

    AUTH_CODE=$(docker exec nappyhood-backend-1 grep -c "isActive.*true" /app/dist/controllers/authController.js 2>/dev/null || echo 0)
    if [ "$AUTH_CODE" -gt 0 ]; then
        echo -e "${GREEN}✅ Auth validation compiled correctly${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Auth isActive filter missing in compiled code${NC}"
        ((FAILED++))
    fi
}

# Function to test database connectivity
test_database() {
    echo -e "${BLUE}🗄️  Testing database connectivity...${NC}"

    # Test database connection
    DB_TEST=$(docker exec nappyhood-postgres-1 psql -U postgres -d nappyhood_salon -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
    if [ "$DB_TEST" -eq 1 ]; then
        echo -e "${GREEN}✅ Database connection working${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        ((FAILED++))
    fi

    # Check for duplicate user issues
    DUPLICATE_CHECK=$(docker exec nappyhood-postgres-1 psql -U postgres -d nappyhood_salon -c "SELECT COUNT(*) FROM users WHERE email LIKE '%lina250%' AND \"isActive\" = true;" 2>/dev/null | tail -n 3 | head -n 1 | xargs)
    if [ "$DUPLICATE_CHECK" -le 1 ]; then
        echo -e "${GREEN}✅ No duplicate active user conflicts${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Multiple active users with same email detected${NC}"
        ((WARNINGS++))
    fi
}

# Function to show summary
show_summary() {
    echo ""
    echo -e "${BLUE}📊 VALIDATION SUMMARY${NC}"
    echo "===================="
    echo -e "${GREEN}✅ Passed: $PASSED${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    echo -e "${RED}❌ Failed: $FAILED${NC}"
    echo ""

    if [ "$FAILED" -eq 0 ]; then
        if [ "$WARNINGS" -eq 0 ]; then
            echo -e "${GREEN}🎯 ALL SYSTEMS PERFECT! No issues detected.${NC}"
            exit 0
        else
            echo -e "${YELLOW}✅ SYSTEMS FUNCTIONAL with minor warnings.${NC}"
            exit 0
        fi
    else
        echo -e "${RED}❌ CRITICAL ISSUES DETECTED! Manual intervention required.${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 Starting validation checks..."
    echo ""

    test_containers
    echo ""
    test_api_endpoints
    echo ""
    test_typescript_compilation
    echo ""
    test_database
    echo ""
    show_summary
}

# Execute main function
main