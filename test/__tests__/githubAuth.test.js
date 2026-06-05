"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const githubAuth_1 = require("../../src/services/githubAuth");
// Mock the Octokit
jest.mock('@octokit/rest', () => {
    return {
        Octokit: jest.fn().mockImplementation(() => ({
            rest: {
                users: {
                    getAuthenticated: jest.fn().mockResolvedValue({
                        data: {
                            id: 12345,
                            login: 'testuser',
                            name: 'Test User',
                            email: 'test@example.com',
                            avatar_url: 'https://avatar.url',
                            html_url: 'https://github.com/testuser'
                        }
                    })
                }
            }
        }))
    };
});
describe('GitHubAuthService', () => {
    let mockContext;
    let authService;
    beforeEach(() => {
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            secrets: {
                store: jest.fn(),
                get: jest.fn()
            }
        };
        // Reset the singleton
        githubAuth_1.GitHubAuthService.instance = undefined;
        authService = githubAuth_1.GitHubAuthService.getInstance(mockContext);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('authenticate', () => {
        it('should successfully authenticate and return user data', async () => {
            const mockSession = {
                accessToken: 'mock-token',
                account: { label: 'testuser' },
                id: 'session-id',
                scopes: ['repo', 'user']
            };
            global.mockVscode.authentication.getSession.mockResolvedValue(mockSession);
            const result = await authService.authenticate();
            expect(result).toBeTruthy();
            expect(result?.user.login).toBe('testuser');
            expect(result?.user.name).toBe('Test User');
            expect(result?.token).toBe('mock-token');
        });
        it('should return null if authentication fails', async () => {
            global.mockVscode.authentication.getSession.mockResolvedValue(null);
            const result = await authService.authenticate();
            expect(result).toBeNull();
            expect(global.mockVscode.window.showErrorMessage).toHaveBeenCalledWith('GitHub authentication failed');
        });
        it('should handle authentication errors gracefully', async () => {
            const error = new Error('Authentication failed');
            global.mockVscode.authentication.getSession.mockRejectedValue(error);
            const result = await authService.authenticate();
            expect(result).toBeNull();
            expect(global.mockVscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Authentication failed'));
        });
    });
    describe('signOut', () => {
        it('should successfully sign out', async () => {
            await authService.signOut();
            expect(global.mockVscode.window.showInformationMessage).toHaveBeenCalledWith('Successfully signed out of VS Code Stories');
        });
    });
    describe('singleton pattern', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = githubAuth_1.GitHubAuthService.getInstance(mockContext);
            const instance2 = githubAuth_1.GitHubAuthService.getInstance();
            expect(instance1).toBe(instance2);
            expect(instance1).toBe(authService);
        });
    });
    describe('authentication state', () => {
        it('should correctly report authentication status', () => {
            expect(authService.isAuthenticated()).toBe(false);
            // After successful authentication, this would be true
            // This would require mocking the internal state
        });
        it('should get authenticated user when available', async () => {
            const mockSession = {
                accessToken: 'mock-token',
                account: { label: 'testuser' },
                id: 'session-id',
                scopes: ['repo', 'user']
            };
            global.mockVscode.authentication.getSession.mockResolvedValue(mockSession);
            await authService.authenticate();
            const user = await authService.getAuthenticatedUser();
            expect(user?.login).toBe('testuser');
        });
    });
});
//# sourceMappingURL=githubAuth.test.js.map