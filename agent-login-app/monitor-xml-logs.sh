#!/bin/bash

# IVR XML Logging Monitor
# View real-time logs with XML request/response tracking

echo "🔍 IVR XML Request/Response Monitor"
echo "======================================"
echo "Monitoring logs for XML requests and responses..."
echo "Press Ctrl+C to stop"
echo ""

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to colorize log output
colorize_logs() {
    while IFS= read -r line; do
        if [[ $line == *"INCOMING IVR REQUEST"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"OUTGOING XML RESPONSE"* ]]; then
            echo -e "${GREEN}$line${NC}"
        elif [[ $line == *"GENERATED XML"* ]]; then
            echo -e "${CYAN}$line${NC}"
        elif [[ $line == *"ERROR"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"[Response]"* ]]; then
            echo -e "${PURPLE}$line${NC}"
        elif [[ $line == *"[IVR]"* ]]; then
            echo -e "${BLUE}$line${NC}"
        elif [[ $line == *"[PBX]"* ]]; then
            echo -e "${CYAN}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Check if running locally or need to access remote logs
if [ -f "package.json" ] && [ -d "src" ]; then
    echo "📍 Local development environment detected"
    echo "Starting local server with detailed logging..."
    echo ""
    
    # Start server with logs
    NODE_ENV=development npm start 2>&1 | colorize_logs
    
elif command -v railway &> /dev/null; then
    echo "🚂 Railway CLI detected - viewing remote logs..."
    echo ""
    
    # Stream Railway logs
    railway logs --follow 2>&1 | colorize_logs
    
else
    echo "❌ Unable to detect environment"
    echo ""
    echo "Options:"
    echo "1. Local: Run from project directory with package.json"
    echo "2. Railway: Install railway CLI (npm install -g @railway/cli)"
    echo "3. Manual: Check logs in your hosting platform"
    echo ""
    echo "Local log files (if they exist):"
    echo "- logs/stream/stream_events_*.jsonl"
    echo "- Application console output"
fi