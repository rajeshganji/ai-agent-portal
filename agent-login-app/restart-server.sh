#!/bin/bash
echo "🔄 Restarting server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2
node server.js
