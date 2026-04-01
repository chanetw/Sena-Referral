#!/bin/bash

# ========================================
# SENA Referral System - Local Startup Script
# Run without Docker
# ========================================

set -e

echo "🚀 Starting SENA Referral System (Local Mode)..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "${YELLOW}⚠️  MySQL is not running. Starting MySQL...${NC}"
    brew services start mysql
    sleep 3
fi

echo "${GREEN}✅ MySQL is running${NC}"

# Check database exists
if ! mysql -u sena_user -psena_password -e "USE sena_referral;" 2>/dev/null; then
    echo "${YELLOW}⚠️  Database not found. Creating...${NC}"
    mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS sena_referral CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sena_user'@'localhost' IDENTIFIED BY 'sena_password';
GRANT ALL PRIVILEGES ON sena_referral.* TO 'sena_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Run migrations
    mysql -u sena_user -psena_password sena_referral < database-schema.sql
    mysql -u sena_user -psena_password sena_referral < customer-audit-triggers.sql
    mysql -u sena_user -psena_password sena_referral < init-database.sql
    mysql -u sena_user -psena_password sena_referral < migration-scripts/004-create-email-logs.sql
    
    echo "${GREEN}✅ Database created and migrated${NC}"
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
cp .env.local .env 2>/dev/null || true
cd ..

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
cp .env.local .env 2>/dev/null || true
cd ..

echo ""
echo "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 To start the services:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo "  URL: http://localhost:4000"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo "  URL: http://localhost:5173"
echo ""
echo "📧 Email Test Mode: chanetw@sena.co.th"
echo "🔑 Login: admin@test.com / password"
echo ""
