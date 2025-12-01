#!/bin/bash
set -e

echo "========================================="
echo "Configuring Nginx for CellBlock"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., api.cellblock.app): " DOMAIN

if [ -z "$DOMAIN" ]; then
  echo "Domain name is required"
  exit 1
fi

# Create nginx configuration
tee /etc/nginx/sites-available/cellblock > /dev/null <<EOF
# CellBlock Backend API
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Redirect to HTTPS (will be configured by certbot)
    # return 301 https://\$server_name\$request_uri;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/cellblock-access.log;
    error_log /var/log/nginx/cellblock-error.log;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/cellblock /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo ""
echo "========================================="
echo "Nginx Configuration Complete!"
echo "========================================="
echo ""
echo "Domain: $DOMAIN"
echo "Backend API will be available at: http://$DOMAIN/api/v1"
echo ""
echo "Next step: Run deploy/setup-ssl.sh to configure HTTPS"
echo ""
