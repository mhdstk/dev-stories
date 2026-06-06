# OpenVSX Deployment Guide

This guide explains how to deploy the VS Code Stories extension to the OpenVSX Registry.

## 🚀 Quick Deployment

### **Method 1: Manual Deployment**

```bash
# 1. Build the extension
npm run compile
cd webview-ui && npm run build && cd ..

# 2. Package the extension
npx vsce package

# 3. Publish to OpenVSX
npx ovsx publish dev-stories-0.1.0.vsix -p YOUR_TOKEN
```

### **Method 2: Using npm Scripts**

```bash
# Build and package
npm run deploy

# Publish to OpenVSX (requires OVSX_TOKEN environment variable)
npm run publish:openvsx
```

### **Method 3: Automated with GitHub Actions**

The repository includes automated deployment. Push a git tag to trigger:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 📋 Prerequisites Setup

### **1. Sign Eclipse Contributor Agreement**
- Visit: https://www.eclipse.org/legal/ECA.php
- Sign the agreement (required for all OpenVSX publishers)
- Use the same email as your GitHub account

### **2. Create OpenVSX Account & Namespace**

```bash
# Install OpenVSX CLI
npm install -g ovsx

# Login to OpenVSX (opens browser)
npx ovsx login

# Create your namespace (replace 'mhdstk' with your username)
npx ovsx create-namespace mhdstk

# Verify namespace creation
npx ovsx verify-namespace mhdstk
```

### **3. Generate Access Token**

```bash
# Generate a personal access token
npx ovsx create-token

# Save the token securely
export OVSX_TOKEN="your-token-here"
```

## 🔧 Configuration Details

### **Required package.json Fields**

Ensure your `package.json` includes:

```json
{
  "name": "dev-stories",
  "publisher": "mhdstk",
  "version": "0.1.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/mhdstk/dev-stories.git"
  },
  "license": "MIT",
  "icon": "media/icon.png"
}
```

### **Extension Icon**

Create a 128x128 PNG icon at `media/icon.png`. Requirements:
- Format: PNG
- Size: 128x128 pixels
- Background: Transparent or solid color
- Design: Simple, recognizable at small sizes

## 🚀 Deployment Steps

### **Step 1: Prepare Extension**

```bash
# Install dependencies
npm install
cd webview-ui && npm install && cd ..

# Run tests
npm test

# Lint code
npm run lint

# Build webview
cd webview-ui && npm run build && cd ..

# Compile extension
npm run compile
```

### **Step 2: Package Extension**

```bash
# Create VSIX package
npx vsce package

# Verify package contents
npx vsce ls
```

### **Step 3: Test Package Locally**

```bash
# Install locally to test
code --install-extension dev-stories-0.1.0.vsix

# Test the extension
# Uninstall when done
code --uninstall-extension mhdstk.dev-stories
```

### **Step 4: Publish to OpenVSX**

```bash
# Method A: Using token directly
npx ovsx publish dev-stories-0.1.0.vsix -p YOUR_TOKEN

# Method B: Using environment variable
export OVSX_TOKEN="your-token-here"
npx ovsx publish dev-stories-0.1.0.vsix

# Method C: Using npm script
npm run publish:openvsx
```

## 🤖 Automated CI/CD

The repository includes GitHub Actions for automated deployment:

### **Workflow Triggers:**
- **Release**: Publishes to both VS Code Marketplace and OpenVSX
- **Tag Push**: Triggers deployment pipeline
- **Manual**: Can be triggered manually from Actions tab

### **Required Secrets:**
Add these secrets to your GitHub repository:

1. **OVSX_TOKEN**: Your OpenVSX access token
2. **VSCE_TOKEN**: VS Code Marketplace token (optional)

### **Setup Secrets:**

```bash
# In your GitHub repository settings
# Go to Settings > Secrets and Variables > Actions
# Add the following repository secrets:

OVSX_TOKEN=your-openvsx-token-here
VSCE_TOKEN=your-vscode-marketplace-token-here
```

## 📊 Publishing Checklist

- [ ] **ECA Signed**: Eclipse Contributor Agreement completed
- [ ] **Namespace Created**: Publisher namespace exists on OpenVSX
- [ ] **Token Generated**: Access token created and stored securely
- [ ] **Extension Tested**: All functionality works correctly
- [ ] **Package Validated**: VSIX package created and tested
- [ ] **Repository Setup**: GitHub secrets configured (if using CI/CD)
- [ ] **Version Updated**: Version number incremented in package.json
- [ ] **Changelog Updated**: CHANGELOG.md includes new version
- [ ] **README Updated**: Documentation is current and accurate

## 🔍 Verification

After publishing, verify your extension:

1. **Visit OpenVSX**: https://open-vsx.org/extension/mhdstk/dev-stories
2. **Check Details**: Ensure description, icon, and links work
3. **Test Installation**: Install from OpenVSX in VS Code
4. **Monitor Downloads**: Check adoption metrics

## 🐛 Troubleshooting

### **Common Issues:**

1. **"Namespace not found"**
   - Ensure namespace is created: `npx ovsx create-namespace mhdstk`
   - Verify namespace exists: `npx ovsx verify-namespace mhdstk`

2. **"Authentication failed"**
   - Regenerate token: `npx ovsx create-token`
   - Check token expiry and permissions

3. **"Package validation failed"**
   - Run: `npx vsce package --allow-star-activation`
   - Check package.json for required fields

4. **"Icon not found"**
   - Ensure icon exists at specified path
   - Verify icon is 128x128 PNG format

### **Debug Commands:**

```bash
# Check OpenVSX status
npx ovsx --version

# Verify namespace
npx ovsx verify-namespace mhdstk

# Test token
npx ovsx search dev-stories

# Validate package
npx vsce ls
```

## 📈 Post-Deployment

After successful deployment:

1. **Update Documentation**: Add OpenVSX badge to README
2. **Announce Release**: Share on social media/dev communities  
3. **Monitor Feedback**: Watch for issues and feature requests
4. **Plan Updates**: Schedule regular updates and improvements

## 🔄 Version Updates

For subsequent releases:

```bash
# Update version
npm version patch  # or minor/major

# Build and publish
npm run deploy
npm run publish:openvsx

# Create GitHub release
gh release create v0.1.1 --generate-notes
```

## 📞 Support

- **OpenVSX Issues**: https://github.com/eclipse/openvsx/issues
- **VS Code Extensions**: https://code.visualstudio.com/api
- **Extension Guidelines**: https://open-vsx.org/about

---

**Happy Publishing! 🚀**