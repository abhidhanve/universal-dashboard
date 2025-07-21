#!/bin/bash

# OnePanel Services Startup Script
# This script starts all OnePanel microservices

echo "🚀 Starting OnePanel Services..."
echo "================================"

# Check if MongoDB is running
echo "📋 Checking MongoDB connection..."
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: brew services start mongodb/brew/mongodb-community"
    echo "   Or: sudo systemctl start mongod"
    exit 1
fi

# Function to start a service in the background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3
    
    echo "🔧 Starting $service_name on port $port..."
    cd "$service_path"
    
    # Install dependencies if needed
    if [ ! -d "vendor" ] && [ ! -f "go.sum" ]; then
        echo "📦 Installing dependencies for $service_name..."
        go mod download || echo "⚠️  Warning: Could not download all dependencies for $service_name"
    fi
    
    # Start the service
    go run main.go &
    SERVICE_PID=$!
    echo "✅ $service_name started (PID: $SERVICE_PID)"
    
    # Go back to original directory
    cd - > /dev/null
}

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Start all services for Method 3 (Direct Database Connection)
start_service "DB Access Service" "$SCRIPT_DIR/db_access" "9081"
sleep 2

echo ""
echo "🎉 Method 3 services started successfully!"
echo "================================"
echo "📊 Service Status:"
echo "  • DB Access Service: http://localhost:9081 (Primary)"
echo "  • Mock Data Service: http://localhost:9083 (Testing)"
echo ""
echo "🔍 Health Check URLs:"
echo "  • curl http://localhost:9081/ping"
echo "  • curl http://localhost:9083/ping"
echo ""
echo "📚 Method 3: Direct Database Connection"
echo "🛑 To stop all services: ./stop_services.sh"
echo ""
echo "⏳ Services are starting up... Wait a few seconds before testing."

# Keep script running to show logs (optional)
echo "Press Ctrl+C to stop monitoring logs..."
wait
