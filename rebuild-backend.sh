#!/bin/bash
# Rebuild and restart the backend container with the latest code

echo "🔨 Rebuilding backend container..."
cd "$(dirname "$0")"

echo "📦 Stopping backend..."
docker-compose stop backend

echo "🗑️  Removing old backend container..."
docker-compose rm -f backend

echo "🏗️  Building new backend..."
docker-compose build backend

echo "🚀 Starting backend..."
docker-compose up -d backend

echo "⏳ Waiting for backend to be ready..."
sleep 5

echo "✅ Backend rebuilt and restarted!"
echo ""
echo "Check logs with: docker-compose logs -f backend"
