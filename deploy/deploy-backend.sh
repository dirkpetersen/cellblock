#!/bin/bash
set -e

echo "========================================="
echo "Deploying CellBlock Backend"
echo "========================================="
echo ""

# Configuration
APP_DIR="/home/cellblock/cellblock"
SERVICE_NAME="cellblock-backend"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "Don't run this as root. Run as cellblock user."
  exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "Pulling latest code from git..."
git fetch origin
git checkout main
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build shared packages
echo "Building shared packages..."
cd packages/types && npm run build
cd ../contracts && npm run build
cd ../..

# Generate Prisma client
echo "Generating Prisma client..."
cd srv-back
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Build backend
echo "Building backend..."
npm run build

# Create systemd service
echo "Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=CellBlock Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=cellblock
WorkingDirectory=$APP_DIR/srv-back
EnvironmentFile=$APP_DIR/srv-back/.env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cellblock-backend

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
echo "Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

# Check status
sleep 3
sudo systemctl status $SERVICE_NAME --no-pager

echo ""
echo "========================================="
echo "Backend Deployment Complete!"
echo "========================================="
echo ""
echo "Service status: sudo systemctl status $SERVICE_NAME"
echo "View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "API endpoint: http://localhost:3000/api/v1/health"
echo ""
