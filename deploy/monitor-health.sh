#!/bin/bash

echo "========================================="
echo "CellBlock Health Monitor"
echo "========================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend health
echo -n "Backend API: "
if curl -sf "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ Healthy${NC}"
    curl -s "$API_URL/health" | jq '.' 2>/dev/null || echo ""
else
    echo -e "${RED}✗ Down${NC}"
fi

echo ""

# Check database
echo -n "Database: "
if sudo -u cellblock psql -U cellblock -d cellblock -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Not connected${NC}"
fi

echo ""

# Check systemd service
echo -n "Backend Service: "
if systemctl is-active --quiet cellblock-backend; then
    echo -e "${GREEN}✓ Running${NC}"
    echo "  Uptime: $(systemctl show cellblock-backend -p ActiveEnterTimestamp --value)"
    echo "  Memory: $(systemctl show cellblock-backend -p MemoryCurrent --value | numfmt --to=iec 2>/dev/null || echo 'N/A')"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

echo ""

# Check nginx
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Stopped${NC}"
fi

echo ""

# Check disk space
echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'

USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 90 ]; then
    echo -e "  ${RED}⚠ Disk usage over 90%!${NC}"
elif [ $USAGE -gt 80 ]; then
    echo -e "  ${YELLOW}⚠ Disk usage over 80%${NC}"
fi

echo ""

# Check memory
echo "Memory Usage:"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2" ("$3/$2*100"%)"}'

echo ""

# Check recent errors in logs
echo "Recent Errors (last 10):"
sudo journalctl -u cellblock-backend --since "1 hour ago" --priority=err -n 10 --no-pager || echo "  No errors"

echo ""

# Check SSL certificate expiry (if using HTTPS)
if command -v certbot &> /dev/null; then
    echo "SSL Certificate:"
    certbot certificates 2>/dev/null | grep "Expiry Date" | head -1 || echo "  Not configured"
fi

echo ""
echo "========================================="
echo "Health Check Complete"
echo "========================================="
