#!/bin/bash

echo "🔍 ENSURING TYPESCRIPT IS PROPERLY COMPILED"

# Check if TypeScript files are newer than JavaScript files
echo "📅 Checking file timestamps..."

# Find any TypeScript files that are newer than their compiled counterparts
NEEDS_REBUILD=$(docker exec nappyhood-backend-1 find /app/src -name "*.ts" -newer /app/dist/index.js 2>/dev/null | wc -l)

if [ "$NEEDS_REBUILD" -gt 0 ]; then
    echo "⚠️  TypeScript files are newer than compiled JavaScript!"
    echo "🔨 Rebuilding TypeScript..."

    docker exec nappyhood-backend-1 bash -c "cd /app && npm run build"

    if [ $? -eq 0 ]; then
        echo "✅ TypeScript successfully recompiled"
        echo "🔄 Restarting backend container..."
        docker restart nappyhood-backend-1
        echo "🎯 Backend updated with latest TypeScript changes!"
    else
        echo "❌ TypeScript compilation failed"
        echo "💡 Using manual fix scripts as backup"
    fi
else
    echo "✅ Compiled JavaScript is up to date"
fi

echo "📋 To prevent future issues, always run this script after TypeScript changes"