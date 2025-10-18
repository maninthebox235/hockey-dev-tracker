#!/bin/bash
set -e

echo "=== Hockey Development Tracker Startup ==="
echo "Node version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Checking dist directory ==="
if [ -d "dist" ]; then
  echo "✓ dist directory exists"
  ls -la dist/
  
  if [ -f "dist/index.js" ]; then
    echo "✓ dist/index.js exists"
  else
    echo "✗ dist/index.js NOT FOUND"
    exit 1
  fi
  
  if [ -d "dist/public" ]; then
    echo "✓ dist/public directory exists"
    ls -la dist/public/
  else
    echo "✗ dist/public NOT FOUND"
    exit 1
  fi
else
  echo "✗ dist directory NOT FOUND"
  exit 1
fi

echo ""
echo "=== Checking required directories ==="
mkdir -p /tmp/uploads /tmp/analysis_results
echo "✓ Created /tmp directories"

if [ -d "drizzle" ]; then
  echo "✓ drizzle directory exists"
else
  echo "⚠ drizzle directory not found (may cause issues)"
fi

if [ -d "shared" ]; then
  echo "✓ shared directory exists"
else
  echo "⚠ shared directory not found (may cause issues)"
fi

echo ""
echo "=== Environment Variables ==="
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:+[SET]}"
echo "JWT_SECRET: ${JWT_SECRET:+[SET]}"

echo ""
echo "=== Starting application ==="
exec node dist/index.js

