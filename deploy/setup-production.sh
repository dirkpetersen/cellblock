#!/bin/bash
set -e

echo "========================================="
echo "Cell Block Production Server Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 18
echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 15
echo "Installing PostgreSQL 15..."
apt-get install -y postgresql-15 postgresql-contrib-15

# Install nginx
echo "Installing nginx..."
apt-get install -y nginx

# Install certbot for SSL
echo "Installing certbot..."
apt-get install -y certbot python3-certbot-nginx

# Install git
echo "Installing git..."
apt-get install -y git

# Create cellblock user
echo "Creating cellblock user..."
if ! id "cellblock" &>/dev/null; then
    useradd -m -s /bin/bash cellblock
    usermod -aG sudo cellblock
fi

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER cellblock WITH PASSWORD '$(openssl rand -base64 32)';"
sudo -u postgres psql -c "CREATE DATABASE cellblock OWNER cellblock;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cellblock TO cellblock;"

# Configure firewall
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Clone the repository: git clone https://github.com/dirkpetersen/cellblock.git"
echo "2. Configure environment variables in /home/cellblock/cellblock/.env"
echo "3. Run deploy/deploy-backend.sh"
echo "4. Configure nginx with deploy/configure-nginx.sh"
echo "5. Set up SSL with deploy/setup-ssl.sh"
echo ""
