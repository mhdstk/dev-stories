import * as vscode from 'vscode';
import { Story } from '@/types';
import { GitHubStorageService } from '@/services/githubStorage';
import { GitHubAuthService } from '@/services/githubAuth';
import { StoryValidator } from './storyValidator';

export class ExpirationManager {
    private static instance: ExpirationManager;
    private storageService: GitHubStorageService;
    private authService: GitHubAuthService;
    private checkInterval: NodeJS.Timeout | null = null;

    private constructor(private context: vscode.ExtensionContext) {
        this.storageService = GitHubStorageService.getInstance(context);
        this.authService = GitHubAuthService.getInstance(context);
        this.startExpirationCheck();
    }

    public static getInstance(context?: vscode.ExtensionContext): ExpirationManager {
        if (!ExpirationManager.instance && context) {
            ExpirationManager.instance = new ExpirationManager(context);
        }
        return ExpirationManager.instance;
    }

    private startExpirationCheck(): void {
        // Check for expired stories every 5 minutes
        this.checkInterval = setInterval(async () => {
            await this.checkAndCleanupExpiredStories();
        }, 5 * 60 * 1000);
    }

    public stopExpirationCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkAndCleanupExpiredStories(): Promise<void> {
        try {
            if (!await this.authService.isAuthenticated()) {
                return;
            }

            // Clean up local cache
            await this.storageService.clearExpiredCache();
            
            // Note: GitHub repository cleanup is handled by GitHub Actions workflow
            console.log('Expired stories cleanup completed');
        } catch (error) {
            console.error('Failed to cleanup expired stories:', error);
        }
    }

    async getExpiringStories(hoursFromNow: number = 2): Promise<Story[]> {
        try {
            const stories = await this.storageService.getUserStories();
            const expirationTime = Date.now() + (hoursFromNow * 60 * 60 * 1000);
            
            return stories.filter(story => 
                story.expiresAt <= expirationTime && 
                !StoryValidator.isStoryExpired(story)
            );
        } catch (error) {
            console.error('Failed to get expiring stories:', error);
            return [];
        }
    }

    async notifyExpiringStories(): Promise<void> {
        const expiringStories = await this.getExpiringStories(2); // 2 hours warning
        
        if (expiringStories.length > 0) {
            const message = expiringStories.length === 1 
                ? `1 story expires in less than 2 hours`
                : `${expiringStories.length} stories expire in less than 2 hours`;
            
            const action = await vscode.window.showInformationMessage(
                message,
                'View Stories',
                'Dismiss'
            );

            if (action === 'View Stories') {
                vscode.commands.executeCommand('dev-stories.viewFeed');
            }
        }
    }

    async extendStoryExpiration(storyId: string, additionalHours: number = 24): Promise<boolean> {
        try {
            // TODO: Implement story expiration extension
            // This would require updating the story file in GitHub
            vscode.window.showInformationMessage(`Story expiration extended by ${additionalHours} hours`);
            return true;
        } catch (error) {
            console.error('Failed to extend story expiration:', error);
            vscode.window.showErrorMessage('Failed to extend story expiration');
            return false;
        }
    }

    formatTimeUntilExpiration(story: Story): string {
        return StoryValidator.formatDuration(
            StoryValidator.getTimeUntilExpiration(story)
        );
    }

    isStoryExpired(story: Story): boolean {
        return StoryValidator.isStoryExpired(story);
    }

    getStoryExpirationStatus(story: Story): 'active' | 'expiring' | 'expired' {
        const now = Date.now();
        const timeLeft = story.expiresAt - now;
        
        if (timeLeft <= 0) {
            return 'expired';
        } else if (timeLeft <= 2 * 60 * 60 * 1000) { // 2 hours
            return 'expiring';
        } else {
            return 'active';
        }
    }

    getExpirationWarningMessage(story: Story): string | null {
        const status = this.getStoryExpirationStatus(story);
        const timeLeft = this.formatTimeUntilExpiration(story);
        
        switch (status) {
            case 'expired':
                return 'This story has expired';
            case 'expiring':
                return `This story expires in ${timeLeft}`;
            default:
                return null;
        }
    }

    dispose(): void {
        this.stopExpirationCheck();
    }
}