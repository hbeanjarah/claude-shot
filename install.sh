#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Installing claude-shot..."

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check version >= 18
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ required (found $(node -v))${NC}"
    exit 1
fi

# Install via npm
npm i -g claude-shot

# Verify
if command -v claude-shot &> /dev/null; then
    echo -e "${GREEN}claude-shot installed successfully!${NC}"
    echo "Run 'claude-shot' to start setup."
else
    echo -e "${RED}Installation failed. Try: npm i -g claude-shot${NC}"
    exit 1
fi