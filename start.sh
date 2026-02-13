#!/bin/bash

echo "========================================"
echo "  Zabbix Monitoring Dashboard v3.0"
echo "========================================"
echo ""

echo "[1/3] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "[2/3] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "[3/3] Starting Zabbix dashboard..."
echo ""
echo "========================================"
echo " HTTP Server: http://localhost:3001"
echo " WebSocket: ws://localhost:8080"
echo " Login: admin / Admin@2024!"
echo "========================================"
echo ""

node zabbix-server.js
