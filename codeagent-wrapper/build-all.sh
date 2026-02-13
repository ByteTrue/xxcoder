#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Building codeagent-wrapper for all platforms..."

OUT="../binaries"
mkdir -p "$OUT"

echo "Building for macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o "$OUT/codeagent-wrapper-darwin-amd64" ./cmd/codeagent-wrapper

echo "Building for macOS (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o "$OUT/codeagent-wrapper-darwin-arm64" ./cmd/codeagent-wrapper

echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o "$OUT/codeagent-wrapper-linux-amd64" ./cmd/codeagent-wrapper

echo "Building for Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o "$OUT/codeagent-wrapper-linux-arm64" ./cmd/codeagent-wrapper

echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o "$OUT/codeagent-wrapper-windows-amd64.exe" ./cmd/codeagent-wrapper

echo "Building for Windows (arm64)..."
GOOS=windows GOARCH=arm64 go build -o "$OUT/codeagent-wrapper-windows-arm64.exe" ./cmd/codeagent-wrapper

echo ""
echo "All builds completed successfully!"
ls -lh "$OUT"/codeagent-wrapper-*
