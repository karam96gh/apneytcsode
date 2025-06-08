#!/bin/bash

# Complete Pet Care Application Deployment Script
# Domain: pets.anycode-sy.com
# Server: 62.171.153.198:3333

set -e  # Exit on any error

# Configuration
DOMAIN="pets.anycode-sy.com"
SERVER_IP="62.171.153.198"
APP_PORT="3333"
EMAIL="admin@anycode-sy.com"  # Change this to your email

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root. Please run with 'sudo $0'"
        exit 1
    fi
}

# Install Docker
install_docker() {
    print_header "Installing Docker and Docker Compose"
    
    if ! command -v docker &> /dev/null; then
        print_status "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker $USER
        print_status "Docker installed successfully!"
    else
        print_status "Docker is already installed"
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_status "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        print_status "Docker Compose installed successfully!"
    else
        print_status "Docker Compose is already installed"
    fi
}

# Create directory structure
create_directories() {
    print_header "Creating Directory Structure"
    
    print_status "Creating application directories..."
    mkdir -p uploads/{animals,posts,medical-cases,veterinaries,pet-stores,charities}
    mkdir -p nginx/conf.d
    mkdir -p ssl ssl-challenge
    mkdir -p logs
    
    # Set proper permissions
    chmod 755 uploads
    chmod -R 755 uploads/*
    chmod 755 nginx
    chmod 755 ssl ssl-challenge
    
    print_status "Directory structure created successfully!"
}

# Create Docker files
create_docker_files() {
    print_header "Creating Docker Configuration Files"
    
    # Create Dockerfile
    print_status "Creating Dockerfile..."
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/{animals,posts,medical-cases,veterinaries,pet-stores,charities}

# Generate Prisma client
RUN npx prisma generate

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
EOF

    # Create .dockerignore
    print_status "Creating .dockerignore..."
    cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.coverage
.vscode
.DS_Store
uploads/*
!uploads/.gitkeep
*.log
.docker
ssl/
logs/
EOF

    print_status "Docker configuration files created!"
}

# Create docker-compose.yml
create_docker_compose() {
    print_header "Creating Docker Compose Configuration"
    
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
      - ./logs/mysql:/var/log/mysql
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
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      timeout: 10s
      retries: 3
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
      - "80:80"
      - "443:443"
      - "${APP_PORT}:${APP_PORT}"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
      - ./ssl-challenge:/var/www/certbot:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      app:
        condition: service_healthy
    networks:
      - petcare_network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      timeout: 10s
      retries: 3
      interval: 30s

  # Certbot for SSL certificates
  certbot:
    image: certbot/certbot
    container_name: petcare_certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./ssl-challenge:/var/www/certbot
      - ./logs/certbot:/var/log/letsencrypt
    networks:
      - petcare_network
    profiles:
      - ssl

volumes:
  mysql_data:
    driver: local

networks:
  petcare_network:
    driver: bridge
EOF

    print_status "Docker Compose configuration created!"
}

# Create environment file
create_env_file() {
    print_header "Creating Environment Configuration"
    
    # Generate secure random passwords and secrets
    MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=petcare
MYSQL_USER=petuser
MYSQL_PASSWORD=${MYSQL_PASSWORD}
DATABASE_URL=mysql://petuser:${MYSQL_PASSWORD}@mysql:3306/petcare

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# Server Configuration
PORT=3000
NODE_ENV=production
DOMAIN=${DOMAIN}
SERVER_IP=${SERVER_IP}
APP_PORT=${APP_PORT}

# SSL Configuration
SSL_EMAIL=${EMAIL}

# Upload Configuration
MAX_FILE_SIZE=10485760

# Generated on: $(date)
EOF

    # Secure the env file
    chmod 600 .env
    
    print_status "Environment configuration created with secure random passwords!"
    print_warning "Environment file (.env) has been created with secure passwords. Keep it safe!"
}

# Create Nginx configuration
create_nginx_config() {
    print_header "Creating Nginx Configuration"
    
    # Main nginx.conf
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

    # Server configuration
    cat > nginx/conf.d/default.conf << EOF
# Upstream configuration
upstream petcare_app {
    server app:3000;
    keepalive 32;
}

# Rate limiting maps
map \$request_uri \$limit_key {
    ~*/api/auth/ \$binary_remote_addr;
    default "";
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} ${SERVER_IP};

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name:${APP_PORT}\$request_uri;
    }
}

# HTTPS server
server {
    listen ${APP_PORT} ssl http2;
    server_name ${DOMAIN} ${SERVER_IP};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${DOMAIN}/privkey.pem;

    # SSL Security settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # CORS headers for API
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;

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

    # Auth endpoints with rate limiting
    location ~ ^/api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://petcare_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files - uploads
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # Security: only allow specific file types
        location ~* \.(jpg|jpeg|png|gif|webp|svg|pdf|doc|docx)$ {
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
        
        # Deny access to other file types
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # Health check endpoint
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

    print_status "Nginx configuration created!"
}

# Setup SSL certificates
setup_ssl() {
    print_header "Setting up SSL Certificates"
    
    # First, start nginx without SSL to get Let's Encrypt certificate
    print_status "Creating temporary nginx config for SSL certificate generation..."
    
    # Backup the SSL config
    cp nginx/conf.d/default.conf nginx/conf.d/default.conf.ssl
    
    # Create temporary HTTP-only config
    cat > nginx/conf.d/default.conf << EOF
upstream petcare_app {
    server app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name ${DOMAIN} ${SERVER_IP};

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    # Health check
    location /health {
        proxy_pass http://petcare_app/health;
        access_log off;
    }

    # Temporary: serve app on HTTP for SSL setup
    location / {
        proxy_pass http://petcare_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    print_status "Starting services for SSL certificate generation..."
    docker-compose up -d mysql app nginx
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Test if the domain resolves to this server
    print_status "Checking DNS resolution for ${DOMAIN}..."
    RESOLVED_IP=$(dig +short ${DOMAIN} | tail -n1)
    if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
        print_warning "DNS for ${DOMAIN} resolves to ${RESOLVED_IP}, but this server is ${SERVER_IP}"
        print_warning "Make sure your DNS A record points ${DOMAIN} to ${SERVER_IP}"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment aborted. Please fix DNS first."
            exit 1
        fi
    fi
    
    # Get SSL certificate
    print_status "Obtaining SSL certificate from Let's Encrypt..."
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d ${DOMAIN}
    
    if [ $? -eq 0 ]; then
        print_status "SSL certificate obtained successfully!"
        
        # Restore SSL nginx config
        cp nginx/conf.d/default.conf.ssl nginx/conf.d/default.conf
        
        # Reload nginx with SSL config
        docker-compose restart nginx
        
        print_status "SSL setup completed!"
    else
        print_error "Failed to obtain SSL certificate. Creating self-signed certificate as fallback..."
        
        # Create self-signed certificate as fallback
        mkdir -p ssl/live/${DOMAIN}
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/live/${DOMAIN}/privkey.pem \
            -out ssl/live/${DOMAIN}/fullchain.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}" \
            -addext "subjectAltName=DNS:${DOMAIN},IP:${SERVER_IP}"
        
        chmod 600 ssl/live/${DOMAIN}/privkey.pem
        chmod 644 ssl/live/${DOMAIN}/fullchain.pem
        
        # Restore SSL nginx config
        cp nginx/conf.d/default.conf.ssl nginx/conf.d/default.conf
        docker-compose restart nginx
        
        print_warning "Using self-signed SSL certificate. Browser will show security warnings."
    fi
}

# Setup firewall
setup_firewall() {
    print_header "Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        print_status "Configuring UFW firewall..."
        
        # Reset UFW to defaults
        ufw --force reset
        
        # Default policies
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow essential services
        ufw allow 22/tcp comment "SSH"
        ufw allow 80/tcp comment "HTTP"
        ufw allow 443/tcp comment "HTTPS"
        ufw allow ${APP_PORT}/tcp comment "Pet Care App"
        
        # Enable firewall
        ufw --force enable
        
        print_status "Firewall configured successfully!"
        ufw status verbose
    else
        print_warning "UFW not found. Please configure firewall manually."
    fi
}

# Create management scripts
create_management_scripts() {
    print_header "Creating Management Scripts"
    
    # SSL renewal script
    cat > renew-ssl.sh << 'EOF'
#!/bin/bash
echo "🔄 Renewing SSL certificates..."
docker-compose run --rm certbot renew --quiet
if [ $? -eq 0 ]; then
    echo "✅ SSL certificate renewed successfully!"
    docker-compose exec nginx nginx -s reload
    echo "✅ Nginx reloaded!"
else
    echo "❌ SSL renewal failed!"
    exit 1
fi
EOF

    # Backup script
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "📦 Creating backup..."

# Backup database
docker-compose exec -T mysql mysqldump -u petuser -p$(grep MYSQL_PASSWORD .env | cut -d'=' -f2) petcare > $BACKUP_DIR/database.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads.tar.gz uploads/

# Backup configuration
cp .env $BACKUP_DIR/
cp -r nginx/ $BACKUP_DIR/

echo "✅ Backup completed: $BACKUP_DIR"
EOF

    # Update script
    cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Pet Care Application..."

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    git pull
fi

# Rebuild and restart
docker-compose down
docker-compose up -d --build

echo "✅ Update completed!"
EOF

    # Monitoring script
    cat > monitor.sh << 'EOF'
#!/bin/bash
echo "📊 Pet Care Application Status"
echo "================================"

echo "🐳 Docker Containers:"
docker-compose ps

echo ""
echo "🔍 Service Health:"
curl -s https://pets.anycode-sy.com:3333/health | jq . 2>/dev/null || echo "❌ Health check failed"

echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "📋 Recent Logs:"
docker-compose logs --tail=20 app
EOF

    # Make scripts executable
    chmod +x renew-ssl.sh backup.sh update.sh monitor.sh
    
    print_status "Management scripts created!"
}

# Setup cron jobs
setup_cron() {
    print_header "Setting up Cron Jobs"
    
    if command -v crontab &> /dev/null; then
        print_status "Setting up automated tasks..."
        
        # Create cron entries
        (crontab -l 2>/dev/null; echo "# Pet Care Application - SSL Renewal") | crontab -
        (crontab -l 2>/dev/null; echo "0 3 * * 1 cd $(pwd) && ./renew-ssl.sh >> logs/ssl-renew.log 2>&1") | crontab -
        (crontab -l 2>/dev/null; echo "# Pet Care Application - Daily Backup") | crontab -
        (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./backup.sh >> logs/backup.log 2>&1") | crontab -
        
        print_status "Cron jobs configured:"
        print_status "  - SSL renewal: Weekly on Monday at 3 AM"
        print_status "  - Database backup: Daily at 2 AM"
    else
        print_warning "Crontab not available. Please set up automated tasks manually."
    fi
}

# Deploy application
deploy_application() {
    print_header "Deploying Pet Care Application"
    
    print_status "Stopping any existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    print_status "Building and starting services..."
    docker-compose up -d --build
    
    print_status "Waiting for services to initialize..."
    sleep 45
    
    # Check service health
    print_status "Checking service health..."
    docker-compose ps
    
    # Wait for application to be ready
    local retries=30
    while [ $retries -gt 0 ]; do
        if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
            print_status "Application is healthy!"
            break
        fi
        print_status "Waiting for application to be ready... ($retries retries left)"
        sleep 10
        retries=$((retries-1))
    done
    
    if [ $retries -eq 0 ]; then
        print_error "Application failed to start properly. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"
    
    print_status "Testing HTTP to HTTPS redirect..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN}/ || echo "FAILED")
    if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        print_status "✅ HTTP redirect working"
    else
        print_warning "⚠️  HTTP redirect not working (Status: $HTTP_STATUS)"
    fi
    
    print_status "Testing HTTPS endpoint..."
    HTTPS_STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" https://${DOMAIN}:${APP_PORT}/health || echo "FAILED")
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_status "✅ HTTPS endpoint working"
    else
        print_error "❌ HTTPS endpoint failed (Status: $HTTPS_STATUS)"
    fi
    
    print_status "Testing API endpoint..."
    API_STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" https://${DOMAIN}:${APP_PORT}/api/status || echo "FAILED")
    if [ "$API_STATUS" = "200" ]; then
        print_status "✅ API endpoint working"
    else
        print_warning "⚠️  API endpoint not responding (Status: $API_STATUS)"
    fi
}

# Main deployment function
main() {
    print_header "Pet Care Application - Complete Deployment"
    print_status "Domain: ${DOMAIN}"
    print_status "Server: ${SERVER_IP}"
    print_status "Port: ${APP_PORT}"
    print_status "Email: ${EMAIL}"
    
    # Confirm deployment
    echo ""
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
    
    # Run deployment steps
    check_root
    install_docker
    create_directories
    create_docker_files
    create_docker_compose
    create_env_file
    create_nginx_config
    deploy_application
    setup_ssl
    setup_firewall
    create_management_scripts
    setup_cron
    test_deployment
    
    # Final summary
    print_header "🎉 Deployment Completed Successfully!"
    echo ""
    print_status "Your Pet Care API is now running at:"
    print_status "  🌐 Domain: https://${DOMAIN}:${APP_PORT}"
    print_status "  🌐 IP: https://${SERVER_IP}:${APP_PORT}"
    print_status "  🔧 Health Check: https://${DOMAIN}:${APP_PORT}/health"
    print_status "  📊 API Status: https://${DOMAIN}:${APP_PORT}/api/status"
    echo ""
    print_status "📁 Important files created:"
    print_status "  - .env (contains secure passwords)"
    print_status "  - docker-compose.yml"
    print_status "  - nginx/ (web server config)"
    print_status "  - ssl/ (SSL certificates)"
    print_status "  - uploads/ (file storage)"
    echo ""
    print_status "🛠️  Management commands:"
    print_status "  - View logs: docker-compose logs -f"
    print_status "  - Restart: docker-compose restart"
    print_status "  - Stop: docker-compose down"
    print_status "  - Monitor: ./monitor.sh"
    print_status "  - Backup: ./backup.sh"
    print_status "  - Update: ./update.sh"
    print_status "  - SSL Renew: ./renew-ssl.sh"
    echo ""
    print_status "🔐 Security notes:"
    print_status "  - Firewall configured (ports 22, 80, 443, ${APP_PORT})"
    print_status "  - SSL certificate installed"
    print_status "  - Rate limiting enabled"
    print_status "  - Secure headers configured"
    echo ""
    print_status "📅 Automated tasks scheduled:"
    print_status "  - SSL renewal: Weekly (Monday 3 AM)"
    print_status "  - Database backup: Daily (2 AM)"
    echo ""
    print_warning "⚠️  Important reminders:"
    print_warning "  1. Keep your .env file secure"
    print_warning "  2. Regularly check logs: docker-compose logs"
    print_warning "  3. Monitor disk space for uploads and logs"
    print_warning "  4. Update Docker images regularly"
    echo ""
    print_status "📖 API Documentation endpoints:"
    print_status "  - GET  /api/status           - API status"
    print_status "  - POST /api/auth/register    - User registration"
    print_status "  - POST /api/auth/login       - User login"
    print_status "  - GET  /api/animals          - Get animals"
    print_status "  - GET  /api/posts            - Get posts"
    print_status "  - GET  /api/veterinaries     - Get veterinaries"
    print_status "  - GET  /api/pet-stores       - Get pet stores"
    print_status "  - GET  /api/charities        - Get charities"
    echo ""
    print_status "🎯 Next steps:"
    print_status "  1. Test your API endpoints"
    print_status "  2. Configure your mobile app to use: https://${DOMAIN}:${APP_PORT}"
    print_status "  3. Monitor logs for the first few hours"
    print_status "  4. Set up monitoring/alerting if needed"
    echo ""
    print_header "🚀 Deployment Complete! Your Pet Care API is live!"
}

# Run main deployment
main "$@"