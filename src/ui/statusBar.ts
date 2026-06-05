import * as vscode from 'vscode';
import { GitHubAuthService } from '@/services/githubAuth';
import { StoryManager } from '@/core/storyManager';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private authService: GitHubAuthService;
    private storyManager: StoryManager;

    constructor(context: vscode.ExtensionContext) {
        this.authService = GitHubAuthService.getInstance(context);
        this.storyManager = StoryManager.getInstance(context);
        
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'dev-stories.viewFeed';
        context.subscriptions.push(this.statusBarItem);
        
        this.updateStatusBar();
        
        // Update status bar periodically
        setInterval(() => {
            this.updateStatusBar();
        }, 30000); // Every 30 seconds
    }

    private async updateStatusBar() {
        try {
            const isAuthenticated = await this.authService.isAuthenticated();
            
            if (!isAuthenticated) {
                this.statusBarItem.text = '$(broadcast) Stories';
                this.statusBarItem.tooltip = 'Click to sign in and view stories';
                this.statusBarItem.command = 'dev-stories.authenticate';
            } else {
                const user = await this.authService.getAuthenticatedUser();
                const myStories = await this.storyManager.getMyStories();
                const activeStories = myStories.length;
                
                this.statusBarItem.text = `$(broadcast) ${activeStories}`;
                this.statusBarItem.tooltip = `${activeStories} active stories - Click to view feed`;
                this.statusBarItem.command = 'dev-stories.viewFeed';
                
                if (activeStories > 0) {
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
                } else {
                    this.statusBarItem.backgroundColor = undefined;
                }
            }
            
            this.statusBarItem.show();
        } catch (error) {
            console.error('Failed to update status bar:', error);
            this.statusBarItem.text = '$(broadcast) Stories';
            this.statusBarItem.tooltip = 'Stories extension';
            this.statusBarItem.show();
        }
    }

    public refresh() {
        this.updateStatusBar();
    }

    public dispose() {
        this.statusBarItem.dispose();
    }
}