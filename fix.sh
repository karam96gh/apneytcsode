#!/bin/bash

# Minimal Nginx Fix - Start with basic working configuration

set -e

DOMAIN="pets.anycode-sy.com"
SERVER_IP="62.171.153.198"
APP_PORT="3333"

echo "🔧 Starting minimal Nginx fix..."

# Stop everything
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Remove problematic containers
docker rm -f petcare_nginx petcare_app petcare_mysql 2>/dev/null || true

# Create basic directories
mkdir -p nginx/conf.d logs uploads ssl

# Create minimal nginx.conf without advanced features
echo "📝 Creating minimal nginx.conf..."
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes 1;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10M;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create simple server configuration - HTTP only first
echo "📝 Creating minimal server configuration..."
cat > nginx/conf.d/default.conf << EOF
upstream app {
    server app:3000;
}

server {
    listen 3333;
    server_name ${DOMAIN} ${SERVER_IP} localhost;
    
    # Basic health check
    location /nginx-status {
        return 200 "nginx is working";
        add_header Content-Type text/plain;
    }
    
    # Proxy to app
    location / {
        proxy_pass http://app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Basic timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

# Create minimal docker-compose.yml without health checks
echo "🐳 Creating minimal docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: petcare_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpass123}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-petcare}
      MYSQL_USER: ${MYSQL_USER:-petuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-petpass123}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - petcare_network
    command: --default-authentication-plugin=mysql_native_password

  app:
    build: .
    container_name: petcare_app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://${MYSQL_USER:-petuser}:${MYSQL_PASSWORD:-petpass123}@mysql:3306/${MYSQL_DATABASE:-petcare}
      JWT_SECRET: ${JWT_SECRET:-your-jwt-secret-change-this}
      PORT: 3000
    volumes:
      - ./uploads:/app/uploads
    networks:
      - petcare_network
    depends_on:
      - mysql
    command: >
      sh -c "
        echo 'Waiting for database...' &&
        sleep 45 &&
        npm start
      "

  nginx:
    image: nginx:alpine
    container_name: petcare_nginx
    restart: unless-stopped
    ports:
      - "3333:3333"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./uploads:/var/www/uploads:ro
    networks:
      - petcare_network
    depends_on:
      - app

volumes:
  mysql_data:

networks:
  petcare_network:
    driver: bridge
EOF

# Create or update .env with basic values
echo "📝 Creating basic .env file..."
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=rootpass123
MYSQL_DATABASE=petcare
MYSQL_USER=petuser
MYSQL_PASSWORD=petpass123
JWT_SECRET=your-jwt-secret-change-this-in-production
PORT=3000
NODE_ENV=production
EOF

# Test nginx configuration before starting
echo "🧪 Testing nginx configuration..."
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi
echo "✅ Nginx configuration is valid"

# Start services one by one
echo "🚀 Starting MySQL..."
docker-compose up -d mysql

echo "⏳ Waiting for MySQL (30 seconds)..."
sleep 30

echo "🚀 Starting App..."
docker-compose up -d app

echo "⏳ Waiting for App (30 seconds)..."
sleep 30

# Check if app is responding
echo "🧪 Testing if app container is ready..."
for i in {1..10}; do
    if docker-compose exec -T app wget --no-verbose --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
        echo "✅ App is responding"
        break
    fi
    echo "⏳ App not ready yet, waiting... ($i/10)"
    sleep 10
done

echo "🚀 Starting Nginx..."
docker-compose up -d nginx

echo "⏳ Waiting for Nginx (15 seconds)..."
sleep 15

# Check final status
echo "🔍 Checking container status..."
docker-compose ps

# Test the endpoints
echo "🧪 Testing endpoints..."

# Test nginx directly
if curl -f http://localhost:3333/nginx-status 2>/dev/null; then
    echo "✅ Nginx is working"
else
    echo "❌ Nginx test failed"
    echo "📋 Nginx logs:"
    docker-compose logs nginx
fi

# Test app through nginx
if curl -f http://localhost:3333/health 2>/dev/null; then
    echo "✅ App is accessible through nginx"
else
    echo "❌ App test failed"
    echo "📋 App logs:"
    docker-compose logs app
fi

# Show logs if there are issues
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Some containers are not running properly"
    echo "📋 Container status:"
    docker-compose ps
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
    exit 1
fi

echo ""
echo "🎉 Basic setup completed successfully!"
echo "================================"
echo "🌐 Your Pet Care API is accessible at:"
echo "  - http://localhost:3333"
echo "  - http://${SERVER_IP}:3333"
echo "  - http://${DOMAIN}:3333"
echo ""
echo "🧪 Test endpoints:"
echo "  - Health: curl http://localhost:3333/health"
echo "  - Status: curl http://localhost:3333/api/status"
echo "  - Nginx Status: curl http://localhost:3333/nginx-status"
echo ""
echo "📋 Management commands:"
echo "  - View all logs: docker-compose logs -f"
echo "  - View nginx logs: docker-compose logs nginx"
echo "  - View app logs: docker-compose logs app"
echo "  - Restart: docker-compose restart"
echo "  - Stop: docker-compose down"
echo ""
echo "⚠️  This is a basic HTTP-only setup. Run add-ssl.sh to add HTTPS support."

# Create SSL addition script for later
cat > add-ssl.sh << 'EOF'
#!/bin/bash
echo "🔒 Adding SSL support..."

# Create self-signed certificate
mkdir -p ssl/live/pets.anycode-sy.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/live/pets.anycode-sy.com/privkey.pem \
    -out ssl/live/pets.anycode-sy.com/fullchain.pem \
    -subj "/CN=pets.anycode-sy.com"

# Update nginx config with SSL
cat > nginx/conf.d/default.conf << 'SSLEOF'
upstream app {
    server app:3000;
}

server {
    listen 3333 ssl;
    server_name pets.anycode-sy.com 62.171.153.198 localhost;
    
    ssl_certificate /etc/nginx/ssl/live/pets.anycode-sy.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/pets.anycode-sy.com/privkey.pem;
    
    location /nginx-status {
        return 200 "nginx is working with SSL";
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
SSLEOF

# Update docker-compose to mount SSL
sed -i '/nginx:/,/networks:/ { /volumes:/ { 
a\      - ./ssl:/etc/nginx/ssl:ro
}}' docker-compose.yml

docker-compose restart nginx
echo "✅ SSL added! Access via: https://pets.anycode-sy.com:3333"
EOF

chmod +x add-ssl.sh

echo "✅ Minimal setup completed!"
echo "🔗 Next steps:"
echo "  1. Test the API: curl http://localhost:3333/health"
echo "  2. Add SSL later: ./add-ssl.sh"
echo "  3. Configure your mobile app to use: http://${DOMAIN}:3333"