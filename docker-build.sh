
#!/bin/bash

echo "Building JeffFromIT Docker containers..."

# Create data directory for SQLite
mkdir -p ./data

# Build and start the containers
docker-compose up --build -d

echo "Containers started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Full app (with proxy): http://localhost:80"

# Show running containers
docker-compose ps
