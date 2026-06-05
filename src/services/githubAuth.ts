import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import { GitHubUser, AuthenticationResult } from '@/types/auth';

export class GitHubAuthService {
    private static instance: GitHubAuthService;
    private currentUser: GitHubUser | null = null;
    private octokit: Octokit | null = null;

    private constructor(private context: vscode.ExtensionContext) {}

    public static getInstance(context?: vscode.ExtensionContext): GitHubAuthService {
        if (!GitHubAuthService.instance && context) {
            GitHubAuthService.instance = new GitHubAuthService(context);
        }
        return GitHubAuthService.instance;
    }

    async authenticate(): Promise<AuthenticationResult | null> {
        try {
            const session = await vscode.authentication.getSession('github', [
                'repo',
                'user',
                'gist'
            ], { 
                createIfNone: true,
                clearSessionPreference: false
            });

            if (!session) {
                vscode.window.showErrorMessage('GitHub authentication failed');
                return null;
            }

            // Initialize Octokit with the token
            this.octokit = new Octokit({
                auth: session.accessToken
            });

            // Get user information
            const { data: user } = await this.octokit.rest.users.getAuthenticated();
            
            this.currentUser = {
                id: user.id,
                login: user.login,
                name: user.name || user.login,
                email: user.email || '',
                avatar_url: user.avatar_url,
                html_url: user.html_url
            };

            // Set authentication context
            vscode.commands.executeCommand('setContext', 'devstories.authenticated', true);
            
            vscode.window.showInformationMessage(`Welcome to VS Code Stories, ${this.currentUser.name}!`);

            return {
                user: this.currentUser,
                token: session.accessToken
            };

        } catch (error) {
            console.error('Authentication error:', error);
            vscode.window.showErrorMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    async signOut(): Promise<void> {
        try {
            // For now, just clear internal state
            // VS Code doesn't provide direct session removal API
            this.currentUser = null;
            this.octokit = null;
            
            vscode.commands.executeCommand('setContext', 'devstories.authenticated', false);
            vscode.window.showInformationMessage('Successfully signed out of VS Code Stories');

        } catch (error) {
            console.error('Sign out error:', error);
            vscode.window.showErrorMessage('Failed to sign out');
        }
    }

    async getAuthenticatedUser(): Promise<GitHubUser | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        // Try to restore session
        try {
            const session = await vscode.authentication.getSession('github', [
                'repo',
                'user', 
                'gist'
            ], { createIfNone: false });
            
            if (session) {
                const authResult = await this.authenticate();
                return authResult?.user || null;
            }
        } catch (error) {
            console.log('No existing session found');
        }

        return null;
    }

    getOctokit(): Octokit | null {
        return this.octokit;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null && this.octokit !== null;
    }

    async ensureAuthenticated(): Promise<boolean> {
        if (this.isAuthenticated()) {
            return true;
        }

        const result = await this.authenticate();
        return result !== null;
    }
}