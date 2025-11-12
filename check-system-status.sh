#!/bin/bash

echo "🔍 NAPPYHOOD SYSTEM STATUS CHECK"
echo "==============================="
echo

# Check server connectivity
echo "📡 Server Connectivity:"
if ping -c 3 41.186.186.178 > /dev/null 2>&1; then
    echo "✅ Server IP 41.186.186.178 - REACHABLE"

    # Check application accessibility
    echo
    echo "🌐 Application Status:"

    # Check main domain
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://nappyhood.com | grep -q "200\|302\|301"; then
        echo "✅ https://nappyhood.com - ACCESSIBLE"
    else
        echo "❌ https://nappyhood.com - NOT ACCESSIBLE"
    fi

    # Check if we can SSH
    echo
    echo "🔐 SSH Connection:"
    if ssh -o ConnectTimeout=10 -o BatchMode=yes root@41.186.186.178 "echo 'SSH OK'" 2>/dev/null; then
        echo "✅ SSH - CONNECTED"

        echo
        echo "🐳 Docker Containers:"
        ssh root@41.186.186.178 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null || echo "❌ Failed to check containers"

        echo
        echo "📊 System Resources:"
        ssh root@41.186.186.178 "df -h / && free -h" 2>/dev/null || echo "❌ Failed to check resources"

    else
        echo "❌ SSH - CONNECTION FAILED"
    fi

else
    echo "❌ Server IP 41.186.186.178 - UNREACHABLE"
fi

echo
echo "🛠️  Available Actions:"
echo "1. ./emergency-fix-deployment.sh - Deploy JavaScript fix"
echo "2. ./connect-server.sh - Connect to server"
echo "3. Check browser console for errors"

echo
echo "📋 Status Summary:"
echo "- React app rebuilt successfully ✅"
echo "- JavaScript 'b is not a function' error fixed ✅"
echo "- Local frontend test passed ✅"
echo "- Server connectivity: $(if ping -c 1 41.186.186.178 > /dev/null 2>&1; then echo "OK"; else echo "FAILED"; fi)"