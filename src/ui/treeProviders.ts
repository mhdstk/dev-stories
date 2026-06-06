import * as vscode from 'vscode';
import { Story, StoryFeedItem } from '@/types';
import { StoryManager } from '@/core/storyManager';
import { GitHubAuthService } from '@/services/githubAuth';
import { SocialService, GitHubFollowingUser, StoryGroup } from '@/services/socialService';

export class StoryTreeItem extends vscode.TreeItem {
    constructor(
        public readonly story: Story,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(story.authorName || story.authorUsername || 'Unknown User', collapsibleState);
        
        this.tooltip = `${story.authorName || story.authorUsername || 'Unknown User'} (@${story.authorUsername})\n${this.getContentPreview(story)}`;
        this.description = this.getTimeAgo(story.timestamp);
        this.contextValue = 'story';
        this.iconPath = new vscode.ThemeIcon('broadcast');
        
        this.command = {
            command: 'dev-stories.openStory',
            title: 'Open Story',
            arguments: [story]
        };
    }

    private getContentPreview(story: Story): string {
        switch (story.content.type) {
            case 'text':
                return story.content.text?.substring(0, 100) + '...' || 'Text story';
            case 'code':
                return `Code (${story.content.code?.language}): ${story.content.code?.content.substring(0, 50)}...`;
            case 'image':
                return `Image: ${story.content.image?.caption || 'No caption'}`;
            default:
                return 'Mixed content story';
        }
    }

    private getTimeAgo(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }
}

export class StoryFeedProvider implements vscode.TreeDataProvider<StoryTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StoryTreeItem | undefined | null | void> = new vscode.EventEmitter<StoryTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StoryTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private stories: Story[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private storyManager: StoryManager,
        private authService: GitHubAuthService
    ) {
        this.refresh();
    }

    refresh(): void {
        this.loadStories();
        this._onDidChangeTreeData.fire();
    }

    private async loadStories(): Promise<void> {
        try {
            if (await this.authService.ensureAuthenticated()) {
                const feed = await this.storyManager.getStoryFeed();
                this.stories = feed.stories.map(item => item.story);
            } else {
                this.stories = [];
            }
        } catch (error) {
            console.error('Failed to load stories:', error);
            this.stories = [];
        }
    }

    getTreeItem(element: StoryTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: StoryTreeItem): Promise<StoryTreeItem[]> {
        if (!element) {
            // Root level - return stories
            if (!await this.authService.isAuthenticated()) {
                return [];
            }

            return this.stories.map(story => 
                new StoryTreeItem(story, vscode.TreeItemCollapsibleState.None)
            );
        }

        return [];
    }
}

export class StoryFollowingProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private following: GitHubFollowingUser[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private authService: GitHubAuthService,
        private socialService: SocialService
    ) {
        this.refresh();
    }

    refresh(): void {
        this.loadFollowing();
        this._onDidChangeTreeData.fire();
    }

    private async loadFollowing(): Promise<void> {
        try {
            if (await this.authService.isAuthenticated()) {
                this.following = await this.socialService.getFollowing();
            } else {
                this.following = [];
            }
        } catch (error) {
            console.error('Failed to load following:', error);
            this.following = [];
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            if (!await this.authService.isAuthenticated()) {
                return [];
            }

            if (this.following.length === 0) {
                const placeholder = new vscode.TreeItem('No following yet', vscode.TreeItemCollapsibleState.None);
                placeholder.description = 'Find users to follow';
                placeholder.iconPath = new vscode.ThemeIcon('account');
                placeholder.command = {
                    command: 'dev-stories.discoverUsers',
                    title: 'Discover Users'
                };
                return [placeholder];
            }

            return this.following.map(user => {
                const item = new vscode.TreeItem(user.name || user.login, vscode.TreeItemCollapsibleState.None);
                item.description = `@${user.login}`;
                item.tooltip = user.bio || `@${user.login}`;
                item.iconPath = new vscode.ThemeIcon('account');
                item.contextValue = 'followedUser';
                item.command = {
                    command: 'dev-stories.viewUserProfile',
                    title: 'View Profile',
                    arguments: [user]
                };
                return item;
            });
        }

        return [];
    }
}

export class StoryGroupsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private groups: StoryGroup[] = [];

    constructor(
        private context: vscode.ExtensionContext,
        private authService: GitHubAuthService,
        private socialService: SocialService
    ) {
        this.refresh();
    }

    refresh(): void {
        this.loadGroups();
        this._onDidChangeTreeData.fire();
    }

    private async loadGroups(): Promise<void> {
        try {
            if (await this.authService.isAuthenticated()) {
                this.groups = await this.socialService.getStoryGroups();
            } else {
                this.groups = [];
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.groups = [];
        }
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            if (!await this.authService.isAuthenticated()) {
                return [];
            }

            return this.groups.map(group => {
                const item = new vscode.TreeItem(group.name, vscode.TreeItemCollapsibleState.None);
                item.description = `${group.memberCount} members`;
                item.tooltip = `${group.description}\n\nTags: ${group.tags.join(', ')}`;
                item.iconPath = new vscode.ThemeIcon(group.isPrivate ? 'lock' : 'organization');
                item.contextValue = 'storyGroup';
                item.command = {
                    command: 'dev-stories.viewGroupDetails',
                    title: 'View Group',
                    arguments: [group]
                };
                return item;
            });
        }

        return [];
    }
}