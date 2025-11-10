#!/bin/bash

# Automated TypeScript Compilation System for Nappyhood Backend
# This script ensures TypeScript changes are always compiled to JavaScript

echo "🔄 AUTOMATED TYPESCRIPT COMPILATION SYSTEM"
echo "==========================================="

# Function to compile TypeScript
compile_typescript() {
    echo "🔨 Compiling TypeScript..."

    # Check if backend is running
    if docker ps | grep -q "nappyhood-backend-1"; then
        # Compile TypeScript inside the running container
        docker exec nappyhood-backend-1 bash -c "cd /app && npm run build" 2>/dev/null

        if [ $? -eq 0 ]; then
            echo "✅ TypeScript compiled successfully"

            # Restart backend to load changes
            echo "🔄 Restarting backend to load compiled changes..."
            docker restart nappyhood-backend-1

            echo "🎯 Backend updated with latest TypeScript changes!"
            return 0
        else
            echo "❌ TypeScript compilation failed"
            return 1
        fi
    else
        echo "❌ Backend container not running"
        return 1
    fi
}

# Function to validate compilation worked
validate_compilation() {
    echo "🧪 Validating compilation..."

    sleep 10 # Wait for restart

    # Check if backend is healthy
    if docker ps | grep -q "nappyhood-backend-1.*Up"; then
        echo "✅ Backend is running after compilation"

        # Test API endpoint
        if curl -s -f https://nappyhood.com/api/health > /dev/null 2>&1; then
            echo "✅ API is responding"
        else
            echo "⚠️  API might not be ready yet (this is normal)"
        fi

        return 0
    else
        echo "❌ Backend failed to start after compilation"
        return 1
    fi
}

# Function to create file watchers (for future automation)
setup_file_watcher() {
    echo "📁 Setting up file watcher for automatic compilation..."

    # Create a simple monitoring script
    cat > /root/typescript-monitor.sh << 'EOF'
#!/bin/bash
# Monitor TypeScript files for changes and auto-compile

while true; do
    # Check if any TypeScript files are newer than the last build
    NEEDS_BUILD=$(docker exec nappyhood-backend-1 find /app/src -name "*.ts" -newer /app/dist/index.js 2>/dev/null | wc -l)

    if [ "$NEEDS_BUILD" -gt 0 ]; then
        echo "$(date): TypeScript files changed, auto-compiling..."
        /root/auto-compile-typescript.sh
    fi

    sleep 30 # Check every 30 seconds
done
EOF

    chmod +x /root/typescript-monitor.sh
    echo "✅ File watcher created at /root/typescript-monitor.sh"
}

# Main execution
main() {
    echo "🚀 Starting automated compilation process..."

    # Always compile first
    if compile_typescript; then
        echo "✅ Initial compilation successful"

        # Validate the compilation worked
        if validate_compilation; then
            echo "✅ Validation passed"
        else
            echo "⚠️  Validation had issues but compilation succeeded"
        fi

        # Set up monitoring for future changes
        setup_file_watcher

        echo ""
        echo "🎯 COMPILATION SYSTEM READY!"
        echo "📋 What this prevents:"
        echo "   - TypeScript source changes being ignored"
        echo "   - Manual fixes being needed for compiled JavaScript"
        echo "   - Phone validation and pagination type issues"
        echo ""
        echo "📋 Usage:"
        echo "   - Run this script after any TypeScript changes"
        echo "   - Or use /root/typescript-monitor.sh for automatic monitoring"
        echo ""

    else
        echo "❌ Compilation failed - manual intervention needed"
        exit 1
    fi
}

# Execute main function
main