import * as vscode from 'vscode';
import { GitHubAuthService } from './services/githubAuth';
import { StoryManager } from './core/storyManager';
import { StoryFeedPanel } from './ui/storyFeedPanel';
import { StoryFeedProvider, StoryFollowingProvider, StoryGroupsProvider } from './ui/treeProviders';
import { StatusBarManager } from './ui/statusBar';
import { StoryViewer } from './core/storyViewer';
import { ExpirationManager } from './core/expirationManager';
import { SocialService } from './services/socialService';

export function activate(context: vscode.ExtensionContext) {
    console.log('VS Code Stories extension is now active!');

    // Initialize services
    const authService = GitHubAuthService.getInstance(context);
    const storyManager = StoryManager.getInstance(context);
    const socialService = SocialService.getInstance(context);
    const expirationManager = ExpirationManager.getInstance(context);
    
    // Initialize UI components
    const statusBarManager = new StatusBarManager(context);
    
    // Initialize tree view providers
    const feedProvider = new StoryFeedProvider(context, storyManager, authService);
    const followingProvider = new StoryFollowingProvider(context, authService, socialService);
    const groupsProvider = new StoryGroupsProvider(context, authService, socialService);

    // Register tree views
    const feedTreeView = vscode.window.createTreeView('devstories.feed', {
        treeDataProvider: feedProvider,
        showCollapseAll: true,
        canSelectMany: false
    });

    const followingTreeView = vscode.window.createTreeView('devstories.following', {
        treeDataProvider: followingProvider,
        showCollapseAll: false,
        canSelectMany: false
    });

    const groupsTreeView = vscode.window.createTreeView('devstories.groups', {
        treeDataProvider: groupsProvider,
        showCollapseAll: false,
        canSelectMany: false
    });

    // Try to restore authentication on startup
    authService.getAuthenticatedUser().then(user => {
        if (user) {
            console.log(`Restored authentication for user: ${user.login}`);
            vscode.commands.executeCommand('setContext', 'devstories.authenticated', true);
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }
    });

    // Register commands
    const commands = [
        // Authentication commands
        vscode.commands.registerCommand('dev-stories.authenticate', async () => {
            const result = await authService.authenticate();
            if (result) {
                vscode.window.showInformationMessage(`Authenticated as ${result.user.name}`);
                feedProvider.refresh();
                followingProvider.refresh();
                groupsProvider.refresh();
                statusBarManager.refresh();
            }
        }),
        
        vscode.commands.registerCommand('dev-stories.signOut', async () => {
            await authService.signOut();
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }),

        // Story viewing commands
        vscode.commands.registerCommand('dev-stories.viewFeed', async () => {
            if (await authService.ensureAuthenticated()) {
                StoryFeedPanel.createOrShow(context.extensionUri, context);
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        vscode.commands.registerCommand('dev-stories.openStory', async (story) => {
            if (!story) {
                vscode.window.showErrorMessage('No story selected. Please select a story from the Dev Stories panel.');
                return;
            }

            // Validate story structure
            if (!story.authorName || !story.authorUsername) {
                vscode.window.showErrorMessage('Invalid story data. The story may be corrupted.');
                console.error('Invalid story object:', story);
                return;
            }

            const viewer = StoryViewer.getInstance(context);
            
            const options = [
                'View in Webview',
                'Show in Editor',
                'View Info Only'
            ];
            
            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: 'How would you like to view this story?'
            });

            if (!choice) {
                return; // User cancelled
            }

            try {
                switch (choice) {
                    case 'View in Webview':
                        await viewer.viewStoryDetails(story);
                        break;
                    case 'Show in Editor':
                        await viewer.showStoryInEditor(story);
                        break;
                    case 'View Info Only':
                        await viewer.displayStoryInfo(story);
                        break;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open story: ${error instanceof Error ? error.message : 'Unknown error'}`);
                console.error('Error opening story:', error);
            }
        }),

        vscode.commands.registerCommand('dev-stories.refreshFeed', () => {
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }),
        
        // Story creation commands
        vscode.commands.registerCommand('dev-stories.createStory', async () => {
            if (await authService.ensureAuthenticated()) {
                const story = await storyManager.createStoryWizard();
                if (story) {
                    vscode.window.showInformationMessage('Story created successfully!');
                    feedProvider.refresh();
                    statusBarManager.refresh();
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),
        
        vscode.commands.registerCommand('dev-stories.createCodeStory', async () => {
            if (await authService.ensureAuthenticated()) {
                const story = await storyManager.createCodeStoryFromSelection();
                if (story) {
                    const timeLeft = storyManager.getTimeUntilExpiration(story);
                    vscode.window.showInformationMessage(`Code story created! Expires in ${timeLeft}`);
                    feedProvider.refresh();
                    statusBarManager.refresh();
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        vscode.commands.registerCommand('dev-stories.createTextStory', async () => {
            if (await authService.ensureAuthenticated()) {
                const text = await vscode.window.showInputBox({
                    prompt: 'What\'s on your mind?',
                    placeHolder: 'Share your thoughts...',
                    ignoreFocusOut: true
                });

                if (text) {
                    const story = await storyManager.createTextStory(text);
                    if (story) {
                        vscode.window.showInformationMessage('Text story created!');
                        feedProvider.refresh();
                        statusBarManager.refresh();
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),
        
        // Profile and management commands
        vscode.commands.registerCommand('dev-stories.viewProfile', async () => {
            if (await authService.ensureAuthenticated()) {
                const user = await authService.getAuthenticatedUser();
                const stories = await storyManager.getMyStories();
                if (user) {
                    vscode.window.showInformationMessage(`Profile: ${user.name} (@${user.login}) - ${stories.length} active stories`);
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),
        
        vscode.commands.registerCommand('dev-stories.manageGroups', async () => {
            if (await authService.ensureAuthenticated()) {
                vscode.window.showInformationMessage('Manage Groups - Coming Soon!');
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        // Tree view actions
        vscode.commands.registerCommand('dev-stories.joinGroup', async (groupOrItem) => {
            if (!(await authService.ensureAuthenticated())) {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
                return;
            }

            let groupId: string | undefined;
            let groupName: string | undefined;

            if (groupOrItem) {
                if (typeof groupOrItem === 'string') {
                    groupId = groupOrItem;
                    groupName = groupOrItem;
                } else if (typeof groupOrItem.id === 'string') {
                    groupId = groupOrItem.id;
                    groupName = groupOrItem.name || groupOrItem.label;
                } else if (groupOrItem.label && typeof groupOrItem.label === 'string') {
                    groupId = groupOrItem.label.toLowerCase().replace(/\s+/g, '-');
                    groupName = groupOrItem.label;
                }
            }

            if (!groupId) {
                const groups = await socialService.getStoryGroups();
                const items = groups.map(g => ({
                    label: g.name,
                    description: g.description,
                    group: g
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a group to join',
                    ignoreFocusOut: true
                });
                if (selected) {
                    groupId = selected.group.id;
                    groupName = selected.group.name;
                }
            }

            if (groupId) {
                const success = await socialService.joinGroup(groupId);
                if (success) {
                    if (groupName) {
                        vscode.window.showInformationMessage(`Joined group: ${groupName}`);
                    }
                    groupsProvider.refresh();
                }
            }
        }),

        vscode.commands.registerCommand('dev-stories.followUser', async (userOrItem) => {
            if (!(await authService.ensureAuthenticated())) {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
                return;
            }

            let username: string | undefined;

            if (userOrItem) {
                if (typeof userOrItem === 'string') {
                    username = userOrItem;
                } else if (typeof userOrItem.login === 'string') {
                    username = userOrItem.login;
                } else if (userOrItem.description && typeof userOrItem.description === 'string' && userOrItem.description.startsWith('@')) {
                    username = userOrItem.description.substring(1);
                } else if (userOrItem.label && typeof userOrItem.label === 'string') {
                    username = userOrItem.label;
                }
            }

            if (!username) {
                username = await vscode.window.showInputBox({
                    prompt: 'Enter the GitHub username you want to follow',
                    placeHolder: 'e.g. octocat',
                    ignoreFocusOut: true
                });
            }

            if (username) {
                const success = await socialService.followUser(username);
                if (success) {
                    followingProvider.refresh();
                    feedProvider.refresh();
                }
            }
        }),

        // Story management commands
        vscode.commands.registerCommand('dev-stories.checkExpiredStories', async () => {
            await expirationManager.checkAndCleanupExpiredStories();
            vscode.window.showInformationMessage('Expired stories cleanup completed');
        }),

        vscode.commands.registerCommand('dev-stories.viewExpiringStories', async () => {
            if (await authService.ensureAuthenticated()) {
                const expiringStories = await expirationManager.getExpiringStories(24);
                if (expiringStories.length === 0) {
                    vscode.window.showInformationMessage('No stories expiring in the next 24 hours');
                } else {
                    const viewer = StoryViewer.getInstance(context);
                    const selectedStory = await viewer.showStoryQuickPick(expiringStories);
                    if (selectedStory) {
                        await viewer.viewStoryDetails(selectedStory);
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        vscode.commands.registerCommand('dev-stories.extendStoryExpiration', async () => {
            if (await authService.ensureAuthenticated()) {
                const stories = await storyManager.getMyStories();
                const viewer = StoryViewer.getInstance(context);
                const selectedStory = await viewer.showStoryQuickPick(stories);
                
                if (selectedStory) {
                    const hours = await vscode.window.showInputBox({
                        prompt: 'How many hours to extend?',
                        value: '24',
                        validateInput: (value) => {
                            const num = parseInt(value);
                            if (isNaN(num) || num < 1 || num > 168) {
                                return 'Please enter a number between 1 and 168 hours';
                            }
                            return null;
                        }
                    });
                    
                    if (hours) {
                        await expirationManager.extendStoryExpiration(selectedStory.id, parseInt(hours));
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        // Social features
        vscode.commands.registerCommand('dev-stories.discoverUsers', async () => {
            if (await authService.ensureAuthenticated()) {
                const suggestions = await socialService.getSuggestedUsers();
                
                if (suggestions.length === 0) {
                    vscode.window.showInformationMessage('No user suggestions available at the moment');
                    return;
                }

                const quickPickItems = suggestions.map(user => ({
                    label: `$(account) ${user.name || user.login}`,
                    description: `@${user.login}`,
                    detail: user.bio || user.company || 'GitHub user',
                    user: user
                }));

                const selected = await vscode.window.showQuickPick(quickPickItems, {
                    placeHolder: 'Select a user to follow',
                    ignoreFocusOut: true
                });

                if (selected) {
                    const isFollowing = await socialService.isFollowing(selected.user.login);
                    const action = isFollowing ? 'Unfollow' : 'Follow';
                    
                    const confirmed = await vscode.window.showInformationMessage(
                        `${action} @${selected.user.login}?`,
                        action,
                        'Cancel'
                    );

                    if (confirmed === action) {
                        if (isFollowing) {
                            await socialService.unfollowUser(selected.user.login);
                        } else {
                            await socialService.followUser(selected.user.login);
                        }
                        followingProvider.refresh();
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        vscode.commands.registerCommand('dev-stories.viewUserProfile', async (user) => {
            const isFollowing = await socialService.isFollowing(user.login);
            const profile = await socialService.getUserProfile(user.login);
            
            if (profile) {
                const info = [
                    `👤 **${profile.name || profile.login}** (@${profile.login})`,
                    profile.bio ? `📝 ${profile.bio}` : '',
                    profile.company ? `🏢 ${profile.company}` : '',
                    profile.location ? `📍 ${profile.location}` : '',
                    `🔗 ${profile.html_url}`,
                    '',
                    `Following: ${isFollowing ? 'Yes' : 'No'}`
                ].filter(line => line.length > 0).join('\n\n');

                const action = await vscode.window.showInformationMessage(
                    info,
                    { modal: true },
                    isFollowing ? 'Unfollow' : 'Follow',
                    'View on GitHub'
                );

                if (action === 'Follow') {
                    await socialService.followUser(user.login);
                    followingProvider.refresh();
                } else if (action === 'Unfollow') {
                    await socialService.unfollowUser(user.login);
                    followingProvider.refresh();
                } else if (action === 'View on GitHub') {
                    vscode.env.openExternal(vscode.Uri.parse(profile.html_url));
                }
            }
        }),

        vscode.commands.registerCommand('dev-stories.viewGroupDetails', async (group) => {
            const info = [
                `🏢 **${group.name}**`,
                `📝 ${group.description}`,
                `👥 ${group.memberCount} members`,
                `🏷️ Tags: ${group.tags.join(', ')}`,
                `🔒 ${group.isPrivate ? 'Private' : 'Public'} group`,
                `📅 Created: ${new Date(group.createdAt).toLocaleDateString()}`
            ].join('\n\n');

            const action = await vscode.window.showInformationMessage(
                info,
                { modal: true },
                'Join Group',
                'View Stories'
            );

            if (action === 'Join Group') {
                await socialService.joinGroup(group.id);
                groupsProvider.refresh();
            } else if (action === 'View Stories') {
                // TODO: Filter stories by group
                vscode.commands.executeCommand('dev-stories.viewFeed');
            }
        }),

        vscode.commands.registerCommand('dev-stories.searchUsers', async () => {
            if (await authService.ensureAuthenticated()) {
                const query = await vscode.window.showInputBox({
                    prompt: 'Search for GitHub users',
                    placeHolder: 'Enter username or keywords...',
                    ignoreFocusOut: true
                });

                if (query && query.length >= 2) {
                    const results = await socialService.searchUsers(query);
                    
                    if (results.length === 0) {
                        vscode.window.showInformationMessage('No users found matching your search');
                        return;
                    }

                    const quickPickItems = results.map(user => ({
                        label: `$(account) ${user.name || user.login}`,
                        description: `@${user.login}`,
                        detail: user.bio || user.company || 'GitHub user',
                        user: user
                    }));

                    const selected = await vscode.window.showQuickPick(quickPickItems, {
                        placeHolder: 'Select a user to view profile',
                        ignoreFocusOut: true
                    });

                    if (selected) {
                        vscode.commands.executeCommand('dev-stories.viewUserProfile', selected.user);
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        })
    ];

    // Set initial context
    vscode.commands.executeCommand('setContext', 'devstories.authenticated', false);

    // Add all commands and providers to context subscriptions
    commands.forEach(command => context.subscriptions.push(command));
    context.subscriptions.push(feedTreeView, followingTreeView, groupsTreeView, statusBarManager, expirationManager);
}

export function deactivate() {
    console.log('VS Code Stories extension is deactivated');
}