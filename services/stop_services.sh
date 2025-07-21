#!/bin/bash

# UniversalPanel Services Stop Script - Method 3
# This script stops Method 3 services

echo "🛑 Stopping UniversalPanel Method 3 Services..."
echo "==============================================="

# Function to stop services by port
stop_service_by_port() {
    local service_name=$1
    local port=$2
    
    echo "🔍 Stopping $service_name (port $port)..."
    
    # Find process using the port
    PID=$(lsof -ti:$port)
    
    if [ -n "$PID" ]; then
        kill $PID
        echo "✅ $service_name stopped (was PID: $PID)"
    else
        echo "ℹ️  $service_name was not running on port $port"
    fi
}

# Stop Method 3 services only
stop_service_by_port "DB Access Service" "9081"
stop_service_by_port "Mock Data Service" "9083"

# Also try to stop by process name pattern
echo ""
echo "🔍 Stopping any remaining Go processes..."
pkill -f "universal-panel" 2>/dev/null && echo "✅ Stopped remaining processes" || echo "ℹ️  No additional processes found"

echo ""
echo "✅ All Method 3 services stopped!"
