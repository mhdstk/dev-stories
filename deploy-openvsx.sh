#!/bin/bash

# VS Code Stories Extension - OpenVSX Deployment Script
# Usage: ./deploy-openvsx.sh

set -e

echo "🚀 Starting OpenVSX deployment for VS Code Stories..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
print_status "Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npx is not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Check if OVSX_TOKEN is set
if [ -z "$OVSX_TOKEN" ]; then
    print_warning "OVSX_TOKEN environment variable is not set"
    echo "You will need to provide the token manually during publishing"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf out/
rm -rf coverage/
rm -rf *.vsix

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Install webview dependencies
print_status "Installing webview dependencies..."
cd webview-ui
npm ci
cd ..

# Run tests
print_status "Running tests..."
npm test

# Run linter
print_status "Running linter..."
npm run lint

# Build webview
print_status "Building webview..."
cd webview-ui
npm run build
cd ..

# Compile extension
print_status "Compiling extension..."
npm run compile

# Package extension
print_status "Packaging extension..."
npx vsce package

# Get the package file name
PACKAGE_FILE=$(ls *.vsix | head -1)

if [ ! -f "$PACKAGE_FILE" ]; then
    print_error "Package file not found"
    exit 1
fi

print_success "Package created: $PACKAGE_FILE"

# Verify package contents
print_status "Verifying package contents..."
npx vsce ls

# Ask for confirmation
echo
print_status "Ready to publish to OpenVSX Registry"
echo "Package: $PACKAGE_FILE"
echo "Publisher: mhdstk"
echo
read -p "Do you want to proceed with publishing? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Publishing cancelled by user"
    print_status "Package file $PACKAGE_FILE is ready for manual publishing"
    echo "To publish manually, run:"
    echo "  npx ovsx publish $PACKAGE_FILE -p YOUR_TOKEN"
    exit 0
fi

# Publish to OpenVSX
print_status "Publishing to OpenVSX Registry..."

if [ -z "$OVSX_TOKEN" ]; then
    # No token in environment, let ovsx prompt for it
    npx ovsx publish "$PACKAGE_FILE"
else
    # Use token from environment
    npx ovsx publish "$PACKAGE_FILE" -p "$OVSX_TOKEN"
fi

if [ $? -eq 0 ]; then
    print_success "Successfully published to OpenVSX Registry!"
    echo
    print_status "Your extension is now available at:"
    echo "https://open-vsx.org/extension/mhdstk/vscode-stories"
    echo
    print_status "It may take a few minutes to appear in search results"
else
    print_error "Publishing failed"
    exit 1
fi

# Cleanup
print_status "Cleaning up..."
# Optionally remove the VSIX file
# rm "$PACKAGE_FILE"

print_success "Deployment completed successfully! 🎉"