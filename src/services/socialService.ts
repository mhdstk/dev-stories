import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { UserProfile } from '@/types';
import { GitHubAuthService } from './githubAuth';

export interface GitHubFollowingUser {
    id: number;
    login: string;
    name?: string;
    avatar_url: string;
    html_url: string;
    company?: string;
    location?: string;
    bio?: string;
}

export interface StoryGroup {
    id: string;
    name: string;
    description: string;
    tags: string[];
    memberCount: number;
    isPrivate: boolean;
    createdBy: string;
    createdAt: number;
    avatar?: string;
    members: string[];
}

export class SocialService {
    private static instance: SocialService;
    private authService: GitHubAuthService;

    private constructor(private context: vscode.ExtensionContext) {
        this.authService = GitHubAuthService.getInstance(context);
    }

    public static getInstance(context?: vscode.ExtensionContext): SocialService {
        if (!SocialService.instance && context) {
            SocialService.instance = new SocialService(context);
        }
        return SocialService.instance;
    }

    private getOctokit(): Octokit | null {
        return this.authService.getOctokit();
    }

    // Following System
    async getFollowing(): Promise<GitHubFollowingUser[]> {
        const octokit = this.getOctokit();
        const user = await this.authService.getAuthenticatedUser();
        
        if (!octokit || !user) {
            return [];
        }

        try {
            const response = await octokit.rest.users.listFollowingForUser({
                username: user.login,
                per_page: 100
            });

            return response.data.map((user: any) => ({
                id: user.id,
                login: user.login,
                name: user.name || undefined,
                avatar_url: user.avatar_url,
                html_url: user.html_url,
                company: undefined,
                location: undefined,
                bio: undefined
            }));
        } catch (error) {
            console.error('Failed to fetch following list:', error);
            return [];
        }
    }

    async getFollowers(): Promise<GitHubFollowingUser[]> {
        const octokit = this.getOctokit();
        const user = await this.authService.getAuthenticatedUser();
        
        if (!octokit || !user) {
            return [];
        }

        try {
            const response = await octokit.rest.users.listFollowersForAuthenticatedUser({
                per_page: 100
            });

            return response.data.map((user: any) => ({
                id: user.id,
                login: user.login,
                name: user.name || undefined,
                avatar_url: user.avatar_url,
                html_url: user.html_url,
                company: undefined,
                location: undefined,
                bio: undefined
            }));
        } catch (error) {
            console.error('Failed to fetch followers list:', error);
            return [];
        }
    }

    async isFollowing(username: string): Promise<boolean> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return false;
        }

        try {
            await octokit.rest.users.checkPersonIsFollowedByAuthenticated({
                username
            });
            return true;
        } catch (error: any) {
            if (error.status === 404) {
                return false;
            }
            console.error('Failed to check following status:', error);
            return false;
        }
    }

    async followUser(username: string): Promise<boolean> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return false;
        }

        try {
            await octokit.rest.users.follow({
                username
            });
            vscode.window.showInformationMessage(`Now following @${username}`);
            return true;
        } catch (error) {
            console.error('Failed to follow user:', error);
            vscode.window.showErrorMessage(`Failed to follow @${username}`);
            return false;
        }
    }

    async unfollowUser(username: string): Promise<boolean> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return false;
        }

        try {
            await octokit.rest.users.unfollow({
                username
            });
            vscode.window.showInformationMessage(`Unfollowed @${username}`);
            return true;
        } catch (error) {
            console.error('Failed to unfollow user:', error);
            vscode.window.showErrorMessage(`Failed to unfollow @${username}`);
            return false;
        }
    }

    // Discovery System
    async discoverDevelopers(topics?: string[]): Promise<GitHubFollowingUser[]> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return [];
        }

        try {
            const searchTopics = topics || ['javascript', 'typescript', 'react', 'python', 'vscode'];
            const query = `type:user followers:>10 ${searchTopics.map(t => `topic:${t}`).join(' OR ')}`;
            
            const response = await octokit.rest.search.users({
                q: query,
                per_page: 20,
                sort: 'followers',
                order: 'desc'
            });

            return response.data.items.map((user: any) => ({
                id: user.id,
                login: user.login,
                name: user.name || undefined,
                avatar_url: user.avatar_url,
                html_url: user.html_url,
                company: user.company || undefined,
                location: user.location || undefined,
                bio: user.bio || undefined
            }));
        } catch (error) {
            console.error('Failed to discover developers:', error);
            return [];
        }
    }

    async findDevelopersFromOrganizations(): Promise<GitHubFollowingUser[]> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return [];
        }

        try {
            // Get user's organizations
            const orgsResponse = await octokit.rest.orgs.listForAuthenticatedUser();
            const developers: GitHubFollowingUser[] = [];

            for (const org of orgsResponse.data.slice(0, 3)) { // Limit to first 3 orgs
                try {
                    const membersResponse = await octokit.rest.orgs.listMembers({
                        org: org.login,
                        per_page: 20
                    });

                    const orgMembers = membersResponse.data.map((member: any) => ({
                        id: member.id,
                        login: member.login,
                        name: member.name || undefined,
                        avatar_url: member.avatar_url,
                        html_url: member.html_url,
                        company: org.login,
                        location: undefined,
                        bio: undefined
                    }));

                    developers.push(...orgMembers);
                } catch (orgError) {
                    console.warn(`Failed to get members for org ${org.login}:`, orgError);
                }
            }

            return developers;
        } catch (error) {
            console.error('Failed to find developers from organizations:', error);
            return [];
        }
    }

    // Groups System (Mock implementation - in real app this would use a separate service)
    async getStoryGroups(): Promise<StoryGroup[]> {
        // Mock implementation - in production, this would fetch from a dedicated service
        const defaultGroups: StoryGroup[] = [
            {
                id: 'javascript',
                name: 'JavaScript Developers',
                description: 'Share JavaScript tips, tricks, and code snippets',
                tags: ['javascript', 'js', 'web'],
                memberCount: 1250,
                isPrivate: false,
                createdBy: 'system',
                createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
                members: []
            },
            {
                id: 'typescript',
                name: 'TypeScript Community',
                description: 'TypeScript best practices and code sharing',
                tags: ['typescript', 'ts', 'types'],
                memberCount: 890,
                isPrivate: false,
                createdBy: 'system',
                createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
                members: []
            },
            {
                id: 'react',
                name: 'React Developers',
                description: 'React components, hooks, and patterns',
                tags: ['react', 'hooks', 'components'],
                memberCount: 2100,
                isPrivate: false,
                createdBy: 'system',
                createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000),
                members: []
            },
            {
                id: 'python',
                name: 'Python Coders',
                description: 'Python scripts, libraries, and data science',
                tags: ['python', 'datascience', 'ml'],
                memberCount: 1680,
                isPrivate: false,
                createdBy: 'system',
                createdAt: Date.now() - (60 * 24 * 60 * 60 * 1000),
                members: []
            },
            {
                id: 'vscode-extension',
                name: 'VS Code Extension Developers',
                description: 'VS Code extension development and tips',
                tags: ['vscode', 'extension', 'api'],
                memberCount: 340,
                isPrivate: false,
                createdBy: 'system',
                createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
                members: []
            }
        ];

        // Add some randomness to member counts
        return defaultGroups.map(group => ({
            ...group,
            memberCount: group.memberCount + Math.floor(Math.random() * 100)
        }));
    }

    async joinGroup(groupId: string): Promise<boolean> {
        try {
            // Mock implementation - in production, this would update group membership
            vscode.window.showInformationMessage(`Joined group: ${groupId}`);
            return true;
        } catch (error) {
            console.error('Failed to join group:', error);
            vscode.window.showErrorMessage('Failed to join group');
            return false;
        }
    }

    async leaveGroup(groupId: string): Promise<boolean> {
        try {
            // Mock implementation
            vscode.window.showInformationMessage(`Left group: ${groupId}`);
            return true;
        } catch (error) {
            console.error('Failed to leave group:', error);
            vscode.window.showErrorMessage('Failed to leave group');
            return false;
        }
    }

    async searchUsers(query: string): Promise<GitHubFollowingUser[]> {
        const octokit = this.getOctokit();
        
        if (!octokit || query.length < 2) {
            return [];
        }

        try {
            const response = await octokit.rest.search.users({
                q: query,
                per_page: 10
            });

            return response.data.items.map((user: any) => ({
                id: user.id,
                login: user.login,
                name: user.name || undefined,
                avatar_url: user.avatar_url,
                html_url: user.html_url,
                company: user.company || undefined,
                location: user.location || undefined,
                bio: user.bio || undefined
            }));
        } catch (error) {
            console.error('Failed to search users:', error);
            return [];
        }
    }

    async getUserProfile(username: string): Promise<GitHubFollowingUser | null> {
        const octokit = this.getOctokit();
        
        if (!octokit) {
            return null;
        }

        try {
            const response = await octokit.rest.users.getByUsername({
                username
            });

            return {
                id: response.data.id,
                login: response.data.login,
                name: response.data.name || undefined,
                avatar_url: response.data.avatar_url,
                html_url: response.data.html_url,
                company: response.data.company || undefined,
                location: response.data.location || undefined,
                bio: response.data.bio || undefined
            };
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
    }

    // Utility methods
    async getSuggestedUsers(): Promise<GitHubFollowingUser[]> {
        const suggestions: GitHubFollowingUser[] = [];
        
        // Get developers from organizations
        const orgDevelopers = await this.findDevelopersFromOrganizations();
        suggestions.push(...orgDevelopers.slice(0, 5));
        
        // Get discovered developers by topics
        const discoveredDevelopers = await this.discoverDevelopers();
        suggestions.push(...discoveredDevelopers.slice(0, 5));
        
        // Remove duplicates and current user
        const currentUser = await this.authService.getAuthenticatedUser();
        const unique = suggestions.filter((user, index, self) => 
            index === self.findIndex(u => u.id === user.id) &&
            user.id !== currentUser?.id
        );
        
        return unique.slice(0, 10);
    }
}