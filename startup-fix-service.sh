#!/bin/bash

# STARTUP FIX SERVICE
# Automatically applies fixes when containers restart

echo "🚀 STARTUP FIX SERVICE - ENSURING FIXES PERSIST"

# Create a systemd service that monitors and fixes
cat > /etc/systemd/system/nappyhood-fix-guardian.service << 'EOF'
[Unit]
Description=Nappyhood Fix Guardian Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=30
ExecStart=/root/permanent-fix-guardian.sh monitor
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable nappyhood-fix-guardian.service
systemctl start nappyhood-fix-guardian.service

echo "✅ Startup fix service installed and started"
echo "📋 This service will:"
echo "   - Monitor the system every 30 minutes"
echo "   - Automatically detect when fixes are lost"
echo "   - Re-apply fixes immediately"
echo "   - Restart backend when needed"
echo ""
echo "🔧 Service status: $(systemctl is-active nappyhood-fix-guardian.service)"
echo "📊 View logs: journalctl -u nappyhood-fix-guardian.service -f"