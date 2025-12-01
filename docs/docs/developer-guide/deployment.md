# Deployment Guide

This guide covers deploying CellBlock to production.

## Production Infrastructure

### Backend (AWS EC2)

**Instance Specifications:**

- Instance Type: t3.medium (2 vCPU, 4 GB RAM)
- OS: Ubuntu 22.04 LTS
- Storage: 20 GB EBS
- Security Group: Allow ports 80, 443, 22

### Database (PostgreSQL)

**Configuration:**

- PostgreSQL 14+
- Running on same EC2 instance initially
- Future: Migrate to AWS RDS or Aurora

### Frontend (GitHub Pages)

**Hosting:**

- Static export deployed to GitHub Pages
- Custom domain: docs.cellblock.app (future)
- HTTPS enabled automatically

## Prerequisites

- AWS account with EC2 access
- Domain name (optional)
- SendGrid or AWS SES account for emails
- SSH key pair for EC2 access

## Backend Deployment

### 1. Provision EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.medium
# Configure security group:
# - SSH (22) from your IP
# - HTTP (80) from anywhere
# - HTTPS (443) from anywhere
```

### 2. Initial Server Setup

SSH into your instance:

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

Update system:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Install Nginx:

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. Configure PostgreSQL

Create database and user:

```bash
sudo -u postgres psql

CREATE DATABASE cellblock;
CREATE USER cellblock_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cellblock TO cellblock_user;
\q
```

### 4. Deploy Backend Code

Clone repository:

```bash
cd /var/www
sudo git clone https://github.com/dirkpetersen/cellblock.git
sudo chown -R ubuntu:ubuntu cellblock
cd cellblock
```

Install dependencies:

```bash
npm install --production
```

Configure environment:

```bash
cd srv-back
cp .env.example .env
nano .env
```

Set production values:

```env
NODE_ENV=production
DATABASE_URL="postgresql://cellblock_user:your_secure_password@localhost:5432/cellblock"
JWT_SECRET="generate-strong-secret-here"
JWT_REFRESH_SECRET="generate-different-strong-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"
FRONTEND_URL="https://dirkpetersen.github.io/cellblock"
```

Run database migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Build backend:

```bash
npm run build
```

### 5. Configure Systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/cellblock-backend.service
```

Add configuration:

```ini
[Unit]
Description=CellBlock Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/cellblock/srv-back
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/cellblock/backend.log
StandardError=append:/var/log/cellblock/backend-error.log

Environment=NODE_ENV=production
EnvironmentFile=/var/www/cellblock/srv-back/.env

[Install]
WantedBy=multi-user.target
```

Create log directory:

```bash
sudo mkdir -p /var/log/cellblock
sudo chown ubuntu:ubuntu /var/log/cellblock
```

Enable and start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cellblock-backend
sudo systemctl start cellblock-backend
sudo systemctl status cellblock-backend
```

### 6. Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/cellblock
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.cellblock.app;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/cellblock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Install SSL Certificate

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain certificate:

```bash
sudo certbot --nginx -d api.cellblock.app
```

Certbot automatically configures Nginx for HTTPS.

Auto-renewal:

```bash
sudo systemctl status certbot.timer
```

## Frontend Deployment

Frontend is deployed to GitHub Pages automatically via GitHub Actions.

### 1. Configure GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages`
4. Folder: `/` (root)

### 2. GitHub Actions Workflow

Create `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: 3.x

      - name: Install dependencies
        run: |
          pip install mkdocs-material
          pip install mkdocs-git-revision-date-localized-plugin
          pip install mkdocs-minify-plugin

      - name: Build documentation
        run: |
          cd docs
          mkdocs build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/site
```

### 3. Custom Domain (Optional)

To use custom domain:

1. Add CNAME record: `docs.cellblock.app` → `dirkpetersen.github.io`
2. Create `docs/docs/CNAME` file with `docs.cellblock.app`
3. Update `site_url` in `mkdocs.yml`

## Database Backups

### Automated Backups

Create backup script:

```bash
sudo nano /usr/local/bin/backup-cellblock-db.sh
```

Add script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cellblock"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="cellblock_backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump cellblock | gzip > "$BACKUP_DIR/$FILENAME"

# Delete backups older than 30 days
find $BACKUP_DIR -name "cellblock_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-cellblock-db.sh
```

Schedule daily backups:

```bash
sudo crontab -e
```

Add line:

```
0 2 * * * /usr/local/bin/backup-cellblock-db.sh
```

### Restore from Backup

```bash
gunzip -c /var/backups/cellblock/cellblock_backup_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql cellblock
```

## Monitoring

### Application Logs

View backend logs:

```bash
sudo journalctl -u cellblock-backend -f
```

View Nginx logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Check Endpoint

Backend exposes health check:

```bash
curl https://api.cellblock.app/api/v1/health
```

### Uptime Monitoring

Use external service like:

- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Configure to ping health endpoint every 5 minutes.

## Scaling

### Vertical Scaling

Upgrade EC2 instance:

1. Stop instance
2. Change instance type (e.g., t3.medium → t3.large)
3. Start instance

### Horizontal Scaling (Future)

When single instance insufficient:

1. **Load Balancer**
   - AWS Application Load Balancer
   - Distribute traffic across multiple instances

2. **Database**
   - Migrate to AWS RDS or Aurora
   - Enable read replicas

3. **Session Storage**
   - Use Redis for session storage
   - Enables multi-instance deployments

4. **WebSocket**
   - Sticky sessions for WebSocket connections
   - Redis pub/sub for cross-instance messaging

## Security Checklist

- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication only (disable password login)
- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Database using strong password
- [ ] Environment variables properly secured
- [ ] Regular security updates (`sudo apt update && sudo apt upgrade`)
- [ ] Fail2ban installed for SSH protection
- [ ] Database backups automated
- [ ] Monitoring and alerts configured

## Troubleshooting

### Backend won't start

Check logs:

```bash
sudo journalctl -u cellblock-backend -n 50
```

Common issues:

- Database connection failed: Check DATABASE_URL
- Port already in use: Check if another process using port 3000
- Environment variables missing: Verify .env file

### Database connection errors

Test connection:

```bash
psql -U cellblock_user -d cellblock -h localhost
```

Check PostgreSQL status:

```bash
sudo systemctl status postgresql
```

### Nginx errors

Test configuration:

```bash
sudo nginx -t
```

Check logs:

```bash
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues

Renew manually:

```bash
sudo certbot renew
```

Check expiration:

```bash
sudo certbot certificates
```

## Maintenance

### Update Backend Code

```bash
cd /var/www/cellblock
git pull origin main
cd srv-back
npm install --production
npm run build
npx prisma migrate deploy
sudo systemctl restart cellblock-backend
```

### Database Migrations

Run migrations:

```bash
cd /var/www/cellblock/srv-back
npx prisma migrate deploy
```

### Update Dependencies

```bash
cd /var/www/cellblock
npm audit fix
npm update
```

Test before deploying to production.

## Rollback Procedure

If deployment fails:

1. **Stop service:**

   ```bash
   sudo systemctl stop cellblock-backend
   ```

2. **Revert code:**

   ```bash
   cd /var/www/cellblock
   git checkout previous-stable-commit
   cd srv-back
   npm install --production
   npm run build
   ```

3. **Rollback database (if needed):**

   ```bash
   # Restore from backup
   gunzip -c /var/backups/cellblock/cellblock_backup_YYYYMMDD_HHMMSS.sql.gz | sudo -u postgres psql cellblock
   ```

4. **Restart service:**
   ```bash
   sudo systemctl start cellblock-backend
   ```

---

For more deployment details, see [CLAUDE.md](https://github.com/dirkpetersen/cellblock/blob/main/CLAUDE.md).
