#!/bin/bash

# Build GeroWallet extension before running tests
# This script assumes the GeroWallet repository is a sibling directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
GEROWALLET_DIR="${PROJECT_DIR}/../gerowallet"

echo "🔨 Building GeroWallet extension..."

# Check if GeroWallet directory exists
if [ ! -d "$GEROWALLET_DIR" ]; then
  echo "❌ GeroWallet directory not found at: $GEROWALLET_DIR"
  echo "Please clone the GeroWallet repository or update GEROWALLET_DIR in this script"
  exit 1
fi

# Navigate to GeroWallet directory
cd "$GEROWALLET_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building extension..."
npm run build

# Check if build was successful
if [ ! -f "extension/manifest.json" ]; then
  echo "❌ Build failed - extension/manifest.json not found"
  exit 1
fi

echo "✅ Extension built successfully"
echo "📂 Extension location: ${GEROWALLET_DIR}/extension"

# Return to original directory
cd "$PROJECT_DIR"