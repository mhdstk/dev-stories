"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
global.mockVscode = mockVscode;
//# sourceMappingURL=setup.js.map