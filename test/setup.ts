// Test setup file

const storyCommands = [
  'dev-stories.authenticate',
  'dev-stories.signOut',
  'dev-stories.viewFeed',
  'dev-stories.refreshFeed',
  'dev-stories.createStory',
  'dev-stories.createTextStory',
  'dev-stories.createCodeStory',
  'dev-stories.openStory',
  'dev-stories.viewProfile',
  'dev-stories.manageGroups',
  'dev-stories.joinGroup',
  'dev-stories.followUser',
  'dev-stories.checkExpiredStories',
  'dev-stories.viewExpiringStories',
  'dev-stories.extendStoryExpiration',
  'dev-stories.discoverUsers',
  'dev-stories.viewUserProfile',
  'dev-stories.viewGroupDetails',
  'dev-stories.searchUsers'
];

const mockedExtension = {
  id: 'mhdstk.dev-stories',
  isActive: false,
  activate: jest.fn().mockImplementation(async function (this: { isActive: boolean }) {
    this.isActive = true;
  })
};

// Mock VS Code API
const mockVscode = {
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    createWebviewPanel: jest.fn(),
    createTreeView: jest.fn(),
    createStatusBarItem: jest.fn(),
    activeTextEditor: undefined,
  },
  workspace: {
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    openTextDocument: jest.fn(),
    showTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
    getCommands: jest.fn().mockResolvedValue(storyCommands),
  },
  extensions: {
    getExtension: jest.fn().mockReturnValue(mockedExtension),
  },
  authentication: {
    getSession: jest.fn(),
  },
  Uri: {
    parse: jest.fn(),
    joinPath: jest.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
    Beside: -2,
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  ThemeIcon: jest.fn().mockImplementation((id) => ({ id })),
  EventEmitter: jest.fn().mockImplementation(() => ({
    fire: jest.fn(),
    event: jest.fn(),
  })),
};

// Mock the vscode module
jest.mock('vscode', () => mockVscode, { virtual: true });

// Global test utilities
(global as any).mockVscode = mockVscode;