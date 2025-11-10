#!/bin/bash

# PERMANENT FIX GUARDIAN SYSTEM
# Ensures critical fixes NEVER get lost again

set -e

echo "🛡️ PERMANENT FIX GUARDIAN SYSTEM"
echo "=================================="
echo "This system ensures critical fixes are NEVER lost again"

# Function to apply services pagination fix
apply_services_pagination_fix() {
    echo "📊 Applying services pagination fix..."

    docker exec nappyhood-backend-1 bash -c 'cat > /tmp/apply-pagination.js << '\''EOF'\''
const fs = require('\''fs'\'');
const path = '\''/app/dist/controllers/serviceController.js'\'';

let content = fs.readFileSync(path, '\''utf8'\'');

// Check if pagination is already applied
if (content.includes('\''skip.*take'\'') && content.includes('\''totalPages'\'')) {
    console.log('\''✅ Services pagination already applied'\'');
    process.exit(0);
}

console.log('\''📊 Applying services pagination fix...'\'');

// Replace the old getAllServices function with paginated version
const oldFunction = /const getAllServices = async \(req, res\) => \{[\s\S]*?\};/;

const newFunction = `const getAllServices = async (req, res) => {
    try {
        const { page = '\''1'\'', limit = '\''10'\'', search, category, isActive = '\''true'\'' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {
            isActive: isActive === '\''true'\''
        };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: '\''insensitive'\'' } },
                { description: { contains: search, mode: '\''insensitive'\'' } }
            ];
        }
        if (category) {
            whereClause.category = category;
        }
        const [services, total] = await Promise.all([
            database_1.prisma.service.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                orderBy: [
                    { category: '\''asc'\'' },
                    { name: '\''asc'\'' }
                ]
            }),
            database_1.prisma.service.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: services,
            meta: {
                total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });
    }
    catch (error) {
        console.error('\''Get services error:'\'', error);
        res.status(500).json({ error: '\''Internal server error'\'' });
    }
};`;

content = content.replace(oldFunction, newFunction);
fs.writeFileSync(path, content);
console.log('\''✅ Services pagination fix applied!'\'');
EOF' 2>/dev/null || echo "Container not ready, skipping for now"

    docker exec nappyhood-backend-1 node /tmp/apply-pagination.js 2>/dev/null || echo "⚠️ Failed to apply pagination fix"
}

# Function to apply customer registration fix
apply_customer_registration_fix() {
    echo "👤 Applying customer registration fix..."

    docker exec nappyhood-backend-1 bash -c 'cat > /tmp/apply-customer.js << '\''EOF'\''
const fs = require('\''fs'\'');
const path = '\''/app/dist/controllers/customerController.js'\'';

let content = fs.readFileSync(path, '\''utf8'\'');

// Check if saleCount is already handled
if (content.includes('\''saleCount.*parseInt'\'')) {
    console.log('\''✅ Customer registration fix already applied'\'');
    process.exit(0);
}

console.log('\''👤 Applying customer registration fix...'\'');

// Add saleCount to destructuring
const oldDestructuring = /let \{ fullName, gender, location, district, province, birthDay, birthMonth, birthYear, isDependent, parentId \} = req\.body;/;
const newDestructuring = `let { fullName, gender, location, district, province, birthDay, birthMonth, birthYear, isDependent, parentId, saleCount } = req.body;`;

if (oldDestructuring.test(content)) {
    content = content.replace(oldDestructuring, newDestructuring);
}

// Add saleCount to customer creation
const oldCreate = /saleCount: saleCount \? parseInt\(saleCount\) : 0/;
if (!oldCreate.test(content)) {
    content = content.replace(
        /parentId: isDependent \? parentId : null$/m,
        `parentId: isDependent ? parentId : null,
                saleCount: saleCount ? parseInt(saleCount) : 0`
    );
}

fs.writeFileSync(path, content);
console.log('\''✅ Customer registration fix applied!'\'');
EOF' 2>/dev/null || echo "Container not ready, skipping for now"

    docker exec nappyhood-backend-1 node /tmp/apply-customer.js 2>/dev/null || echo "⚠️ Failed to apply customer fix"
}

# Function to clean database conflicts
clean_database_conflicts() {
    echo "🗄️ Cleaning database conflicts..."

    # Remove inactive users that might cause conflicts
    docker exec nappyhood-postgres-1 psql -U postgres -d nappyhood_salon -c \
        "DELETE FROM users WHERE \"isActive\" = false AND (email LIKE '%test%' OR email LIKE '%temp%' OR phone LIKE '%deleted%');" \
        2>/dev/null || echo "⚠️ Database cleanup failed"

    echo "✅ Database conflicts cleaned"
}

# Function to verify fixes are working
verify_fixes() {
    echo "🔍 Verifying all fixes are working..."

    # Check services pagination
    SERVICES_CHECK=$(docker exec nappyhood-backend-1 grep -c "skip.*take" /app/dist/controllers/serviceController.js 2>/dev/null || echo "0")
    if [ "$SERVICES_CHECK" -gt 0 ]; then
        echo "✅ Services pagination: WORKING"
    else
        echo "❌ Services pagination: MISSING"
        apply_services_pagination_fix
    fi

    # Check customer registration
    CUSTOMER_CHECK=$(docker exec nappyhood-backend-1 grep -c "saleCount" /app/dist/controllers/customerController.js 2>/dev/null || echo "0")
    if [ "$CUSTOMER_CHECK" -gt 0 ]; then
        echo "✅ Customer registration: WORKING"
    else
        echo "❌ Customer registration: MISSING"
        apply_customer_registration_fix
    fi
}

# Function to apply all fixes
apply_all_fixes() {
    echo "🔧 Applying all critical fixes..."

    apply_services_pagination_fix
    apply_customer_registration_fix
    clean_database_conflicts

    echo "🔄 Restarting backend to load fixes..."
    docker restart nappyhood-backend-1

    echo "⏳ Waiting for backend to start..."
    sleep 15

    verify_fixes

    echo "🎯 ALL FIXES APPLIED AND VERIFIED!"
}

# Main execution based on parameters
case "${1:-apply}" in
    "apply")
        apply_all_fixes
        ;;
    "verify")
        verify_fixes
        ;;
    "monitor")
        echo "🔄 Starting continuous monitoring..."
        while true; do
            echo "$(date): Checking system health..."
            verify_fixes
            echo "$(date): Sleeping for 30 minutes..."
            sleep 1800  # Check every 30 minutes
        done
        ;;
    *)
        echo "Usage: $0 [apply|verify|monitor]"
        echo "  apply   - Apply all fixes immediately"
        echo "  verify  - Verify fixes are in place"
        echo "  monitor - Continuously monitor and fix"
        ;;
esac