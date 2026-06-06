# VS Code Stories Web Viewer

This directory contains a web-based viewer for VS Code Stories that can be integrated with the OpenVSX marketplace or deployed as a standalone web application.

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **VS Code Theming**: Matches VS Code's dark theme aesthetic
- **Story Display**: Shows code snippets, text stories, and mixed content
- **Social Features**: Display reactions, view counts, and user information
- **Extension Integration**: Direct link to install the VS Code extension

## Files

- `index.html`: Main web viewer with embedded CSS and JavaScript
- Future files could include:
  - `api.js`: Integration with GitHub API for live story data
  - `styles.css`: Separate stylesheet for better maintainability
  - `app.js`: Enhanced JavaScript functionality

## Integration Options

### OpenVSX Marketplace
- Can be embedded as an iframe in the marketplace page
- Provides preview of community stories
- Drives extension installation

### Standalone Deployment
- Deploy to static hosting (Netlify, Vercel, GitHub Pages)
- Custom domain for community story sharing
- SEO optimized for discoverability

### GitHub Pages Integration
- Host directly from the extension repository
- Automatic updates when extension is updated
- Easy maintenance and versioning

## Technical Architecture

The web viewer is designed to be:
- **Lightweight**: Single HTML file with embedded assets
- **Fast Loading**: Minimal dependencies and optimized CSS
- **API Ready**: Prepared for integration with GitHub API
- **Accessible**: Proper semantic HTML and keyboard navigation

## Future Enhancements

1. **Live Data Integration**
   - Connect to GitHub API for real story data
   - Real-time updates and notifications
   - User authentication for personalized feeds

2. **Enhanced Interactivity**
   - Like and react to stories directly from web
   - Share stories on social media
   - Filter and search functionality

3. **Progressive Web App**
   - Offline support for viewed stories
   - Push notifications for new stories
   - App-like experience on mobile devices

## Development

To test the web viewer locally:
1. Open `index.html` in any modern web browser
2. The page will display mock story data
3. Responsive design can be tested using browser dev tools

For production deployment, consider:
- Content Security Policy configuration
- CDN for better performance
- Analytics integration
- Error monitoring