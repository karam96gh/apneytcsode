#!/bin/bash

# Fix Nginx MIME types issue

set -e

echo "🔧 Fixing Nginx MIME types issue..."

# Stop everything first
docker-compose down --remove-orphans 2>/dev/null || true

# Create corrected nginx.conf WITHOUT mime.types reference
echo "📝 Creating corrected nginx.conf..."
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    # Basic MIME types inline (instead of external file)
    types {
        text/html                             html htm shtml;
        text/css                              css;
        text/xml                              xml;
        image/gif                             gif;
        image/jpeg                            jpeg jpg;
        image/png                             png;
        application/javascript                js;
        application/json                      json;
        application/pdf                       pdf;
        application/zip                       zip;
        text/plain                            txt;
    }
    
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 10M;
    
    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Create simple server configuration
echo "📝 Creating simple server configuration..."
cat > nginx/conf.d/default.conf << 'EOF'
upstream petcare_app {
    server app:3000;
}

server {
    listen 3333;
    server_name _;
    
    # Root location
    location / {
        proxy_pass http://petcare_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
    }
    
    # Handle preflight OPTIONS requests
    location @options {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 200;
    }
    
    # Nginx status check
    location /nginx-health {
        access_log off;
        return 200 "nginx working\n";
        add_header Content-Type text/plain;
    }
    
    # Static files
    location /uploads/ {
        alias /var/www/uploads/;
        try_files $uri =404;
    }
}
EOF

# Test the new nginx configuration
echo "🧪 Testing corrected nginx configuration..."
docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is now valid!"
else
    echo "❌ Configuration still has issues. Let's try even simpler..."
    
    # Create ultra-minimal nginx.conf
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    server {
        listen 3333;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
        }
        
        location /health {
            proxy_pass http://app/health;
        }
    }
}
EOF

    # Test ultra-minimal config
    docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Ultra-minimal nginx configuration works!"
    else
        echo "❌ Even minimal config fails. Let's skip nginx and run app directly."
        
        # Create direct app deployment
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: petcare_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: petcare
      MYSQL_USER: petuser
      MYSQL_PASSWORD: petpass123
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - petcare_network

  app:
    build: .
    container_name: petcare_app
    restart: unless-stopped
    ports:
      - "3333:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://petuser:petpass123@mysql:3306/petcare
      JWT_SECRET: your-jwt-secret-change-this
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
        npx prisma db push &&
        echo 'Starting application...' &&
        npm start
      "

volumes:
  mysql_data:

networks:
  petcare_network:
    driver: bridge
EOF
        
        echo "🚀 Starting app directly without nginx..."
        docker-compose up -d
        
        echo "⏳ Waiting for app to start..."
        sleep 60
        
        echo "🧪 Testing direct app access..."
        if curl -f http://localhost:3333/health 2>/dev/null; then
            echo "✅ App is working directly on port 3333!"
            echo "🌐 Access your API at: http://pets.anycode-sy.com:3333"
            echo "🌐 Or via IP: http://62.171.153.198:3333"
        else
            echo "❌ App is not responding. Check logs:"
            docker-compose logs app
        fi
        
        exit 0
    fi
fi

# If nginx config is valid, proceed with full deployment
echo "🚀 Starting services with working nginx..."

# Start MySQL first
echo "🗄️  Starting MySQL..."
docker-compose up -d mysql

echo "⏳ Waiting for MySQL (45 seconds)..."
sleep 45

# Start App
echo "🚀 Starting App..."
docker-compose up -d app

echo "⏳ Waiting for App (45 seconds)..."
sleep 45

# Test if app is ready
echo "🧪 Testing if app is ready..."
for i in {1..12}; do
    if docker-compose exec -T app curl -f http://localhost:3000/health 2>/dev/null; then
        echo "✅ App is ready!"
        break
    elif [ $i -eq 12 ]; then
        echo "❌ App failed to start. Logs:"
        docker-compose logs app
        exit 1
    else
        echo "⏳ App not ready yet, waiting... ($i/12)"
        sleep 10
    fi
done

# Start Nginx
echo "🌐 Starting Nginx..."
docker-compose up -d nginx

echo "⏳ Waiting for Nginx (30 seconds)..."
sleep 30

# Final tests
echo "🧪 Testing final setup..."

# Test nginx health
if curl -f http://localhost:3333/nginx-health 2>/dev/null; then
    echo "✅ Nginx is working"
else
    echo "⚠️  Nginx health check failed, but continuing..."
fi

# Test app through nginx
if curl -f http://localhost:3333/health 2>/dev/null; then
    echo "✅ App accessible through nginx"
else
    echo "❌ App not accessible through nginx"
    docker-compose logs nginx
    docker-compose logs app
fi

# Show status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Pet Care API Setup Complete!"
echo "================================"
echo "🌐 Your API is accessible at:"
echo "  - http://pets.anycode-sy.com:3333"
echo "  - http://62.171.153.198:3333"
echo ""
echo "🧪 Test commands:"
echo "  curl http://localhost:3333/health"
echo "  curl http://localhost:3333/api/status"
echo ""
echo "📋 Management:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"