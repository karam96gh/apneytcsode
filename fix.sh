#!/bin/bash

# Fix Port Conflicts for Pet Care API
# This script configures the app to run on custom ports to avoid conflicts

set -e

DOMAIN="pets.anycode-sy.com"
SERVER_IP="62.171.153.198"
APP_PORT="3333"
HTTP_PORT="8080"
HTTPS_PORT="8443"

echo "🔧 Fixing port conflicts for Pet Care API..."
echo "📋 Configuration:"
echo "   - HTTP Port: ${HTTP_PORT}"
echo "   - HTTPS Port: ${HTTPS_PORT}"
echo "   - App Port: ${APP_PORT}"

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Check what's using the standard ports
echo "🔍 Checking port usage..."
echo "Port 80 usage:"
sudo netstat -tlnp | grep :80 || echo "  Port 80 is free"
echo "Port 443 usage:"
sudo netstat -tlnp | grep :443 || echo "  Port 443 is free"
echo "Port ${APP_PORT} usage:"
sudo netstat -tlnp | grep :${APP_PORT} || echo "  Port ${APP_PORT} is free"

# Create directories
mkdir -p ssl/live/${DOMAIN} ssl-challenge nginx/conf.d logs

# Create self-signed certificate
echo "🔐 Creating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/live/${DOMAIN}/privkey.pem \
    -out ssl/live/${DOMAIN}/fullchain.pem \
    -subj "/C=SY/ST=Damascus/L=Damascus/O=PetCare/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},IP:${SERVER_IP}" 2>/dev/null

chmod 600 ssl/live/${DOMAIN}/privkey.pem
chmod 644 ssl/live/${DOMAIN}/fullchain.pem

# Create Nginx configuration that doesn't conflict with existing apps
echo "📝 Creating Nginx configuration with custom ports..."
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create server configuration with custom ports
cat > nginx/conf.d/default.conf << EOF
upstream petcare_app {
    server app:3000;
    keepalive 32;
}

# HTTP server on custom port
server {
    listen ${HTTP_PORT};
    server_name ${DOMAIN} ${SERVER_IP};

    # Health check
    location /health {
        proxy_pass http://petcare_app/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    }

    # Static files - uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Root and other routes
    location / {
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}

# HTTPS server on custom port
server {
    listen ${HTTPS_PORT} ssl http2;
    server_name ${DOMAIN} ${SERVER_IP};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${DOMAIN}/privkey.pem;

    # SSL settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Health check
    location /health {
        proxy_pass http://petcare_app/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    }

    # Static files - uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Root and other routes
    location / {
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}

# Main app server on port ${APP_PORT} (direct access)
server {
    listen ${APP_PORT} ssl http2;
    server_name ${DOMAIN} ${SERVER_IP};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${DOMAIN}/privkey.pem;

    # SSL settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # API endpoints with rate limiting
    location /api/ {
        # Simple rate limiting
        limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    }

    # Handle preflight requests
    location ~* \.(OPTIONS) {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 200;
    }

    # Static files - uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security: only allow specific file types
        location ~* \.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx)$ {
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }

    # Health check
    location /health {
        proxy_pass http://petcare_app/health;
        access_log off;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Root and other routes
    location / {
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
}
EOF

# Update docker-compose.yml with custom ports
echo "🐳 Updating docker-compose.yml with custom ports..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: petcare_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: \${MYSQL_DATABASE}
      MYSQL_USER: \${MYSQL_USER}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - petcare_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p\${MYSQL_ROOT_PASSWORD}"]
      timeout: 20s
      retries: 10
      interval: 30s

  # Node.js Application
  app:
    build: .
    container_name: petcare_app
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://\${MYSQL_USER}:\${MYSQL_PASSWORD}@mysql:3306/\${MYSQL_DATABASE}
      JWT_SECRET: \${JWT_SECRET}
      PORT: 3000
      DOMAIN: ${DOMAIN}
      SERVER_IP: ${SERVER_IP}
    volumes:
      - ./uploads:/app/uploads
      - ./logs/app:/app/logs
    networks:
      - petcare_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      timeout: 10s
      retries: 5
      interval: 30s
    command: >
      sh -c "
        echo 'Waiting for database to be ready...' &&
        sleep 30 &&
        npx prisma db push &&
        echo 'Starting application...' &&
        npm start
      "

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: petcare_nginx
    restart: unless-stopped
    ports:
      - "${HTTP_PORT}:${HTTP_PORT}"
      - "${HTTPS_PORT}:${HTTPS_PORT}"
      - "${APP_PORT}:${APP_PORT}"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      app:
        condition: service_healthy
    networks:
      - petcare_network

volumes:
  mysql_data:
    driver: local

networks:
  petcare_network:
    driver: bridge
EOF

# Update environment file
echo "📝 Updating environment variables..."
if [ -f .env ]; then
    # Add new port variables to existing .env
    echo "" >> .env
    echo "# Custom Ports (to avoid conflicts)" >> .env
    echo "HTTP_PORT=${HTTP_PORT}" >> .env
    echo "HTTPS_PORT=${HTTPS_PORT}" >> .env
    echo "APP_PORT=${APP_PORT}" >> .env
else
    echo "⚠️  .env file not found, creating one..."
    cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
MYSQL_DATABASE=petcare
MYSQL_USER=petuser
MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DATABASE_URL=mysql://petuser:\${MYSQL_PASSWORD}@mysql:3306/petcare

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

# Server Configuration
PORT=3000
NODE_ENV=production
DOMAIN=${DOMAIN}
SERVER_IP=${SERVER_IP}

# Custom Ports (to avoid conflicts)
HTTP_PORT=${HTTP_PORT}
HTTPS_PORT=${HTTPS_PORT}
APP_PORT=${APP_PORT}
EOF
    chmod 600 .env
fi

# Configure firewall for custom ports
echo "🔥 Configuring firewall for custom ports..."
if command -v ufw &> /dev/null; then
    ufw allow ${HTTP_PORT}/tcp comment "Pet Care HTTP"
    ufw allow ${HTTPS_PORT}/tcp comment "Pet Care HTTPS"
    ufw allow ${APP_PORT}/tcp comment "Pet Care App"
    echo "✅ Firewall rules added"
fi

# Start services
echo "🚀 Starting services with custom ports..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 60

# Check status
echo "🔍 Checking service status..."
docker-compose ps

# Test endpoints
echo "🧪 Testing endpoints..."
sleep 10

echo "Testing HTTP endpoint (port ${HTTP_PORT})..."
curl -f http://localhost:${HTTP_PORT}/health 2>/dev/null && echo "✅ HTTP endpoint working" || echo "❌ HTTP endpoint failed"

echo "Testing HTTPS endpoint (port ${HTTPS_PORT})..."
curl -k -f https://localhost:${HTTPS_PORT}/health 2>/dev/null && echo "✅ HTTPS endpoint working" || echo "❌ HTTPS endpoint failed"

echo "Testing main app endpoint (port ${APP_PORT})..."
curl -k -f https://localhost:${APP_PORT}/health 2>/dev/null && echo "✅ Main app endpoint working" || echo "❌ Main app endpoint failed"

echo ""
echo "🎉 Pet Care API is now running with custom ports!"
echo "================================"
echo "📋 Access URLs:"
echo "  🌐 HTTP:  http://${DOMAIN}:${HTTP_PORT}"
echo "  🔒 HTTPS: https://${DOMAIN}:${HTTPS_PORT}"
echo "  🚀 Main:  https://${DOMAIN}:${APP_PORT}"
echo ""
echo "🔗 Alternative access (IP):"
echo "  🌐 HTTP:  http://${SERVER_IP}:${HTTP_PORT}"
echo "  🔒 HTTPS: https://${SERVER_IP}:${HTTPS_PORT}"
echo "  🚀 Main:  https://${SERVER_IP}:${APP_PORT}"
echo ""
echo "📋 API Endpoints:"
echo "  Health: https://${DOMAIN}:${APP_PORT}/health"
echo "  Status: https://${DOMAIN}:${APP_PORT}/api/status"
echo "  Auth:   https://${DOMAIN}:${APP_PORT}/api/auth/*"
echo ""
echo "⚠️  Note: Using custom ports to avoid conflicts with other applications"
echo "📱 Configure your mobile app to use: https://${DOMAIN}:${APP_PORT}"
echo ""
echo "📋 Management commands:"
echo "  Logs:    docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop:    docker-compose down"