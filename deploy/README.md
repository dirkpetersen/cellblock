# CellBlock Production Deployment

Complete production deployment guide for AWS EC2 (Ubuntu 22.04 LTS).

## Quick Deploy

### 1. Initial Server Setup

```bash
# On fresh AWS EC2 instance (Ubuntu 22.04)
sudo ./deploy/setup-production.sh
```

This will:

- Install Node.js 18, PostgreSQL 15, Nginx, Certbot
- Create cellblock user
- Configure PostgreSQL database
- Set up firewall rules

### 2. Clone Repository

```bash
# As cellblock user
cd /home/cellblock
git clone https://github.com/dirkpetersen/cellblock.git
cd cellblock
git checkout main
```

### 3. Configure Environment

```bash
# Copy template
cp deploy/.env.production.template srv-back/.env

# Edit with your values
nano srv-back/.env
```

Required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secret (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `SENDGRID_API_KEY` or AWS SES credentials
- `APNS_*` credentials for iOS push notifications
- `WNS_*` credentials for Windows push notifications

### 4. Deploy Backend

```bash
./deploy/deploy-backend.sh
```

This will:

- Install npm dependencies
- Generate Prisma client
- Run database migrations
- Build backend
- Create systemd service
- Start backend service

### 5. Configure Nginx

```bash
sudo ./deploy/configure-nginx.sh
# Enter your domain: api.cellblock.app
```

### 6. Setup SSL

```bash
sudo ./deploy/setup-ssl.sh
# Enter your domain and email
```

### 7. Deploy Frontend to GitHub Pages

```bash
# On your local machine
cd srv-front
npm run build
# Deploy to GitHub Pages (automatic via GitHub Actions)
```

## Docker Deployment (Alternative)

### Using Docker Compose

```bash
# Create .env file
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Monitoring

### Check Backend Status

```bash
sudo systemctl status cellblock-backend
```

### View Backend Logs

```bash
sudo journalctl -u cellblock-backend -f
```

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### View Nginx Logs

```bash
tail -f /var/log/nginx/cellblock-access.log
tail -f /var/log/nginx/cellblock-error.log
```

### Test API

```bash
curl https://api.cellblock.app/api/v1/health
```

## Database Management

### Backup Database

```bash
pg_dump -U cellblock cellblock > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U cellblock cellblock < backup-20241201.sql
```

### Run Migrations

```bash
cd /home/cellblock/cellblock/srv-back
npx prisma migrate deploy
```

## Scaling

### Vertical Scaling

- Upgrade EC2 instance type
- Increase PostgreSQL shared_buffers
- Adjust Node.js memory limits

### Horizontal Scaling (Future)

- Migrate to AWS Aurora (RDS)
- Add read replicas
- Use Redis for rate limiting and sessions
- Deploy multiple backend instances behind load balancer

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
sudo journalctl -u cellblock-backend -n 50

# Verify database connection
psql -U cellblock -d cellblock -c "SELECT 1;"

# Check environment variables
sudo systemctl cat cellblock-backend | grep EnvironmentFile

# Restart service
sudo systemctl restart cellblock-backend
```

### SSL Certificate Issues

```bash
# Test certificate
certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check nginx configuration
sudo nginx -t
```

### High Memory Usage

```bash
# Check memory
free -h

# Check Node.js processes
pm2 list  # If using pm2
ps aux | grep node

# Restart backend
sudo systemctl restart cellblock-backend
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key-only authentication
- [ ] PostgreSQL local connections only
- [ ] Strong JWT_SECRET (32+ characters)
- [ ] SSL certificate installed
- [ ] Regular security updates enabled
- [ ] Fail2ban installed (optional)
- [ ] CloudFlare proxy (optional)

## Maintenance

### Weekly

- Check disk space: `df -h`
- Review logs for errors
- Monitor database size

### Monthly

- Review and rotate logs
- Check SSL certificate expiry
- Review database backups
- Update system packages: `sudo apt update && sudo apt upgrade`

### Quarterly

- Review and optimize database
- Analyze usage patterns
- Plan capacity upgrades

## Support

For issues, see:

- **Documentation:** https://dirkpetersen.github.io/cellblock
- **Issues:** https://github.com/dirkpetersen/cellblock/issues
