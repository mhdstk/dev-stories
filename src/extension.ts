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
    const feedTreeView = vscode.window.createTreeView('stories.feed', {
        treeDataProvider: feedProvider,
        showCollapseAll: true,
        canSelectMany: false
    });

    const followingTreeView = vscode.window.createTreeView('stories.following', {
        treeDataProvider: followingProvider,
        showCollapseAll: false,
        canSelectMany: false
    });

    const groupsTreeView = vscode.window.createTreeView('stories.groups', {
        treeDataProvider: groupsProvider,
        showCollapseAll: false,
        canSelectMany: false
    });

    // Try to restore authentication on startup
    authService.getAuthenticatedUser().then(user => {
        if (user) {
            console.log(`Restored authentication for user: ${user.login}`);
            vscode.commands.executeCommand('setContext', 'stories.authenticated', true);
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }
    });

    // Register commands
    const commands = [
        // Authentication commands
        vscode.commands.registerCommand('vscode-stories.authenticate', async () => {
            const result = await authService.authenticate();
            if (result) {
                vscode.window.showInformationMessage(`Authenticated as ${result.user.name}`);
                feedProvider.refresh();
                followingProvider.refresh();
                groupsProvider.refresh();
                statusBarManager.refresh();
            }
        }),
        
        vscode.commands.registerCommand('vscode-stories.signOut', async () => {
            await authService.signOut();
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }),

        // Story viewing commands
        vscode.commands.registerCommand('vscode-stories.viewFeed', async () => {
            if (await authService.ensureAuthenticated()) {
                StoryFeedPanel.createOrShow(context.extensionUri, context);
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        vscode.commands.registerCommand('vscode-stories.openStory', async (story) => {
            const viewer = StoryViewer.getInstance(context);
            
            const options = [
                'View in Webview',
                'Show in Editor',
                'View Info Only'
            ];
            
            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: 'How would you like to view this story?'
            });

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
        }),

        vscode.commands.registerCommand('vscode-stories.refreshFeed', () => {
            feedProvider.refresh();
            followingProvider.refresh();
            groupsProvider.refresh();
            statusBarManager.refresh();
        }),
        
        // Story creation commands
        vscode.commands.registerCommand('vscode-stories.createStory', async () => {
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
        
        vscode.commands.registerCommand('vscode-stories.createCodeStory', async () => {
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

        vscode.commands.registerCommand('vscode-stories.createTextStory', async () => {
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
        vscode.commands.registerCommand('vscode-stories.viewProfile', async () => {
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
        
        vscode.commands.registerCommand('vscode-stories.manageGroups', async () => {
            if (await authService.ensureAuthenticated()) {
                vscode.window.showInformationMessage('Manage Groups - Coming Soon!');
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        }),

        // Tree view actions
        vscode.commands.registerCommand('vscode-stories.joinGroup', (group) => {
            vscode.window.showInformationMessage(`Joining group: ${group.label}`);
        }),

        vscode.commands.registerCommand('vscode-stories.followUser', (user) => {
            vscode.window.showInformationMessage(`Following user: ${user.label}`);
        }),

        // Story management commands
        vscode.commands.registerCommand('vscode-stories.checkExpiredStories', async () => {
            await expirationManager.checkAndCleanupExpiredStories();
            vscode.window.showInformationMessage('Expired stories cleanup completed');
        }),

        vscode.commands.registerCommand('vscode-stories.viewExpiringStories', async () => {
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

        vscode.commands.registerCommand('vscode-stories.extendStoryExpiration', async () => {
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
        vscode.commands.registerCommand('vscode-stories.discoverUsers', async () => {
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

        vscode.commands.registerCommand('vscode-stories.viewUserProfile', async (user) => {
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

        vscode.commands.registerCommand('vscode-stories.viewGroupDetails', async (group) => {
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
                vscode.commands.executeCommand('vscode-stories.viewFeed');
            }
        }),

        vscode.commands.registerCommand('vscode-stories.searchUsers', async () => {
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
                        vscode.commands.executeCommand('vscode-stories.viewUserProfile', selected.user);
                    }
                }
            } else {
                vscode.window.showErrorMessage('Please authenticate with GitHub first');
            }
        })
    ];

    // Set initial context
    vscode.commands.executeCommand('setContext', 'stories.authenticated', false);

    // Add all commands and providers to context subscriptions
    commands.forEach(command => context.subscriptions.push(command));
    context.subscriptions.push(feedTreeView, followingTreeView, groupsTreeView, statusBarManager, expirationManager);
}

export function deactivate() {
    console.log('VS Code Stories extension is deactivated');
}