
#!/bin/bash

echo "Building JeffFromIT Docker containers..."

# Stop existing containers
docker-compose down

# Create data directory for SQLite
mkdir -p ./data

# Remove old images to ensure clean build
docker-compose build --no-cache

# Build and start the containers
docker-compose up -d

echo "Containers started!"
echo "Frontend (direct): http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Full app (with proxy): http://localhost:80"

# Wait a moment for containers to start
sleep 5

# Show running containers
docker-compose ps

# Show logs if there are issues
echo ""
echo "If you see any issues, check logs with:"
echo "docker-compose logs frontend"
echo "docker-compose logs backend"
echo "docker-compose logs nginx"
