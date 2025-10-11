#!/bin/bash
# MCP Gemini CLI Server Startup Script
# This script starts the MCP server as a background daemon

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PID_FILE="$SCRIPT_DIR/.mcp-server.pid"
LOG_FILE="$SCRIPT_DIR/mcp-server.log"

# Function to check if server is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to stop server
stop_server() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo "Stopping MCP server (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
        rm -f "$PID_FILE"
        sleep 1
        echo "Server stopped."
    else
        echo "Server is not running."
        rm -f "$PID_FILE"
    fi
}

# Function to start server
start_server() {
    if is_running; then
        echo "MCP server is already running (PID: $(cat "$PID_FILE"))"
        exit 0
    fi

    echo "Starting MCP Gemini CLI server..."
    echo "Log file: $LOG_FILE"

    # Build the project first
    if [ ! -d "dist" ]; then
        echo "Building project..."
        bun run build
    fi

    # Start the server in background
    nohup bun run dist/index.js > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!

    echo "$SERVER_PID" > "$PID_FILE"
    echo "MCP server started with PID: $SERVER_PID"
    echo "To view logs: tail -f $LOG_FILE"
}

# Function to show status
show_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo "MCP server is running (PID: $PID)"
        echo "Log file: $LOG_FILE"
    else
        echo "MCP server is not running"
    fi
}

# Parse command
case "${1:-start}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        start_server
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
