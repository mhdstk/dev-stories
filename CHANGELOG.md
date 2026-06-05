# Changelog

All notable changes to the "VS Code Stories" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of VS Code Stories extension
- Instagram-like stories functionality for developers
- GitHub OAuth authentication and integration
- 24-hour story expiration system
- Story creation with code snippets, text, and mixed content
- React-based WebView UI with VS Code theming
- Social features: following, groups, discovery
- Stories sidebar with feed, following, and groups views
- Status bar integration with story count indicator
- Context menu integration for sharing selected code
- Story viewing with multiple display options
- Expiration management and cleanup system
- Web viewer component for OpenVSX integration
- Comprehensive test suite with Jest
- CI/CD pipeline with GitHub Actions
- Automated publishing to VS Code Marketplace and OpenVSX

### Changed
- N/A (Initial release)

### Deprecated
- N/A (Initial release)

### Removed
- N/A (Initial release)

### Fixed
- N/A (Initial release)

### Security
- Content sanitization for user-generated content
- Secure token storage using VS Code's SecretStorage API
- GitHub-based permissions and privacy controls

## [0.1.0] - 2026-06-05

### Added
- 🎉 **Initial Release**: Complete VS Code Stories extension
- 📱 **Instagram-like Stories**: 24-hour ephemeral content sharing
- 🔐 **GitHub Integration**: OAuth authentication and social features
- 💻 **Developer-focused Content**: Code snippets with syntax highlighting
- 🎨 **VS Code Integration**: Native sidebar, status bar, and context menus
- ⚛️ **Modern UI**: React-based WebView with responsive design
- 🤝 **Social Features**: Following, groups, discovery, and reactions
- 🌐 **Web Viewer**: OpenVSX marketplace integration
- 🧪 **Testing**: Comprehensive test suite with 80%+ coverage
- 🚀 **CI/CD**: Automated testing, building, and deployment

### Features in Detail

#### Core Story System
- Create stories from selected code with automatic language detection
- Text-based stories for sharing insights and thoughts
- Mixed content stories combining text, code, and metadata
- Automatic 24-hour expiration with GitHub Actions cleanup
- Story validation and content sanitization

#### Social & Discovery
- Follow GitHub users and see their stories in your feed
- Discover developers through organizations and common interests
- Join topic-based groups (JavaScript, React, Python, etc.)
- React to stories with developer-friendly emojis
- User profiles with story statistics

#### VS Code Integration
- Stories sidebar in Activity Bar with three views
- Status bar indicator showing active story count
- Right-click context menu for sharing selected code
- Command palette integration with 10+ commands
- Webview panel for rich story viewing experience

#### Technical Implementation
- TypeScript with strict configuration and path mapping
- Webpack bundling for extension and webview code
- React frontend with VS Code theme integration
- GitHub API service layer with rate limiting
- Local caching with VS Code storage APIs
- Comprehensive error handling and user feedback

#### Developer Experience
- ESLint and Prettier for code quality
- Jest testing framework with mocks for VS Code APIs
- GitHub Actions CI/CD pipeline
- Automated deployment to both marketplaces
- Web viewer for community engagement

### Installation Requirements
- VS Code 1.85.0 or higher
- GitHub account for authentication
- Node.js 18+ for development

### Known Limitations
- GitHub API rate limits (5,000 requests/hour)
- 50KB limit for code snippets
- Stories limited to 24-hour lifespan
- Requires internet connection for story synchronization

### Next Steps
See the [roadmap](README.md#roadmap) for planned features and improvements.