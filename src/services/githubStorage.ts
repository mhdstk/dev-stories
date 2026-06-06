import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import { Story, StoryFeed, CreateStoryRequest, StorageMetadata } from '@/types';
import { GitHubAuthService } from './githubAuth';
import { StoryValidator } from '@/core/storyValidator';

export class GitHubStorageService {
    private static instance: GitHubStorageService;
    private authService: GitHubAuthService;

    private constructor(private context: vscode.ExtensionContext) {
        this.authService = GitHubAuthService.getInstance();
    }

    public static getInstance(context?: vscode.ExtensionContext): GitHubStorageService {
        if (!GitHubStorageService.instance && context) {
            GitHubStorageService.instance = new GitHubStorageService(context);
        }
        return GitHubStorageService.instance;
    }

    private getOctokit(): Octokit | null {
        return this.authService.getOctokit();
    }

    private async ensureStoriesRepository(): Promise<{ owner: string; repo: string } | null> {
        const octokit = this.getOctokit();
        const user = await this.authService.getAuthenticatedUser();
        
        if (!octokit || !user) {
            return null;
        }

        const repoName = 'vscode-stories-data';
        const owner = user.login;

        try {
            // Check if repository exists
            await octokit.rest.repos.get({
                owner,
                repo: repoName
            });

            return { owner, repo: repoName };
        } catch (error: any) {
            if (error.status === 404) {
                // Repository doesn't exist, create it
                try {
                    await this.createStoriesRepository(owner, repoName);
                    return { owner, repo: repoName };
                } catch (createError) {
                    console.error('Failed to create stories repository:', createError);
                    vscode.window.showErrorMessage('Failed to create stories repository');
                    return null;
                }
            } else {
                console.error('Error checking repository:', error);
                return null;
            }
        }
    }

    private async createStoriesRepository(owner: string, repoName: string): Promise<void> {
        const octokit = this.getOctokit();
        if (!octokit) return;

        // Create private repository
        await octokit.rest.repos.createForAuthenticatedUser({
            name: repoName,
            description: 'VS Code Stories data storage',
            private: true,
            auto_init: true
        });

        // Create initial structure with README and metadata
        const readmeContent = `# VS Code Stories Data

This repository stores your VS Code Stories data including:
- Stories and their content
- User preferences and settings
- Following lists and groups
- Analytics data

**Warning**: This repository is automatically managed by the VS Code Stories extension. Manual changes may be lost.
`;

        const initialMetadata: StorageMetadata = {
            version: '1.0.0',
            lastSync: Date.now(),
            totalStories: 0
        };

        const gitignoreContent = `# OS generated files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
`;

        const workflowContent = `name: Cleanup Expired Stories

on:
  schedule:
    - cron: '0 */6 * * *'  # Run every 6 hours
  workflow_dispatch:

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Cleanup expired stories
        run: |
          # Simple cleanup script for expired stories
          find stories -name "*.json" -exec node -e "
            const fs = require('fs');
            const file = process.argv[1];
            try {
              const story = JSON.parse(fs.readFileSync(file, 'utf8'));
              if (Date.now() > story.expiresAt) {
                fs.unlinkSync(file);
                console.log('Deleted expired story:', file);
              }
            } catch (e) {
              console.error('Error processing:', file, e.message);
            }
          " {} \\;
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --staged --quiet || git commit -m "Auto-cleanup expired stories [skip ci]"
          git push
`;

        // Create files
        await Promise.all([
            // README
            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'README.md',
                message: 'Initial setup - Add README',
                content: Buffer.from(readmeContent).toString('base64')
            }),

            // Metadata
            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'metadata.json',
                message: 'Initial setup - Add metadata',
                content: Buffer.from(JSON.stringify(initialMetadata, null, 2)).toString('base64')
            }),

            // Gitignore
            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: '.gitignore',
                message: 'Initial setup - Add gitignore',
                content: Buffer.from(gitignoreContent).toString('base64')
            }),

            // GitHub Actions workflow
            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: '.github/workflows/cleanup.yml',
                message: 'Initial setup - Add cleanup workflow',
                content: Buffer.from(workflowContent).toString('base64')
            }),

            // Create initial directories by adding placeholder files
            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'stories/.gitkeep',
                message: 'Initial setup - Create stories directory',
                content: Buffer.from('').toString('base64')
            }),

            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'following.json',
                message: 'Initial setup - Initialize following list',
                content: Buffer.from(JSON.stringify([], null, 2)).toString('base64')
            }),

            octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo: repoName,
                path: 'groups.json',
                message: 'Initial setup - Initialize groups list',
                content: Buffer.from(JSON.stringify([], null, 2)).toString('base64')
            })
        ]);

        vscode.window.showInformationMessage('Stories repository created successfully!');
    }

    async createStory(request: CreateStoryRequest): Promise<Story | null> {
        // Validate request
        const validation = StoryValidator.validateCreateStoryRequest(request);
        if (!validation.isValid) {
            const errors = validation.errors.map(e => e.message).join(', ');
            vscode.window.showErrorMessage(`Invalid story data: ${errors}`);
            return null;
        }

        const repoInfo = await this.ensureStoriesRepository();
        const user = await this.authService.getAuthenticatedUser();
        const octokit = this.getOctokit();

        if (!repoInfo || !user || !octokit) {
            vscode.window.showErrorMessage('Failed to access stories repository');
            return null;
        }

        try {
            // Create story object
            const now = Date.now();
            const expiresIn = request.expiresIn || 24; // Default 24 hours
            const story: Story = {
                id: StoryValidator.generateStoryId(),
                authorGitHubId: user.id.toString(),
                authorUsername: user.login,
                authorName: user.name || user.login || 'Unknown User',
                authorAvatar: user.avatar_url,
                timestamp: now,
                expiresAt: now + (expiresIn * 60 * 60 * 1000),
                content: request.content,
                visibility: request.visibility,
                tags: request.tags || [],
                groupId: request.groupId,
                viewCount: 0,
                viewers: [],
                reactions: {},
                metadata: {
                    createdWith: vscode.extensions.getExtension('mhdstk.vscode-stories')?.packageJSON.version || '0.1.0',
                    projectContext: await this.getProjectContext()
                }
            };

            // Create file path based on date
            const date = new Date(now);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const filePath = `stories/${year}/${month}/${day}/${story.id}.json`;

            // Upload to GitHub
            await octokit.rest.repos.createOrUpdateFileContents({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                path: filePath,
                message: `Add story: ${story.content.type} story`,
                content: Buffer.from(JSON.stringify(story, null, 2)).toString('base64')
            });

            // Update local cache
            await this.cacheStory(story);

            vscode.window.showInformationMessage('Story created successfully!');
            return story;

        } catch (error) {
            console.error('Failed to create story:', error);
            vscode.window.showErrorMessage('Failed to create story');
            return null;
        }
    }

    async getStory(storyId: string): Promise<Story | null> {
        // Try local cache first
        const cachedStory = await this.getCachedStory(storyId);
        if (cachedStory && !StoryValidator.isStoryExpired(cachedStory)) {
            return cachedStory;
        }

        // If not in cache or expired, try to fetch from GitHub
        const repoInfo = await this.ensureStoriesRepository();
        const octokit = this.getOctokit();

        if (!repoInfo || !octokit) {
            return null;
        }

        try {
            // Search for story file
            const searchResult = await octokit.rest.search.code({
                q: `filename:${storyId}.json repo:${repoInfo.owner}/${repoInfo.repo}`
            });

            if (searchResult.data.items.length === 0) {
                return null;
            }

            const item = searchResult.data.items[0];
            const fileContent = await octokit.rest.repos.getContent({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                path: item.path
            });

            if ('content' in fileContent.data) {
                const storyData = JSON.parse(
                    Buffer.from(fileContent.data.content, 'base64').toString()
                );

                // Validate and cache
                const validation = StoryValidator.validateStory(storyData);
                if (validation.isValid) {
                    await this.cacheStory(storyData);
                    return storyData;
                }
            }
        } catch (error) {
            console.error('Failed to fetch story:', error);
        }

        return null;
    }

    async getUserStories(username?: string): Promise<Story[]> {
        const targetUser = username || (await this.authService.getAuthenticatedUser())?.login;
        if (!targetUser) return [];

        const repoInfo = await this.ensureStoriesRepository();
        const octokit = this.getOctokit();

        if (!repoInfo || !octokit) {
            return [];
        }

        try {
            // Get stories directory contents
            const stories: Story[] = [];
            const contents = await this.getRepositoryContents(octokit, repoInfo, 'stories');
            
            for (const item of contents) {
                if (item.type === 'file' && item.name.endsWith('.json')) {
                    const story = await this.getStory(item.name.replace('.json', ''));
                    if (story && !StoryValidator.isStoryExpired(story)) {
                        stories.push(story);
                    }
                }
            }

            return stories.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to fetch user stories:', error);
            return [];
        }
    }

    private async getRepositoryContents(octokit: Octokit, repoInfo: { owner: string; repo: string }, path: string): Promise<any[]> {
        try {
            const response = await octokit.rest.repos.getContent({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                path
            });

            if (Array.isArray(response.data)) {
                return response.data;
            }
        } catch (error) {
            console.log(`Directory ${path} not found or empty`);
        }
        return [];
    }

    private async getProjectContext() {
        const workspace = vscode.workspace;
        const editor = vscode.window.activeTextEditor;
        
        return {
            workspaceName: workspace.name,
            activeFile: editor?.document.fileName,
            // TODO: Add git branch and commit info
        };
    }

    private async cacheStory(story: Story): Promise<void> {
        const cacheKey = `story_${story.id}`;
        await this.context.globalState.update(cacheKey, story);
    }

    private async getCachedStory(storyId: string): Promise<Story | null> {
        const cacheKey = `story_${storyId}`;
        return this.context.globalState.get(cacheKey, null);
    }

    async clearExpiredCache(): Promise<void> {
        const keys = this.context.globalState.keys();
        for (const key of keys) {
            if (key.startsWith('story_')) {
                const story: Story | undefined = this.context.globalState.get(key);
                if (story && StoryValidator.isStoryExpired(story)) {
                    await this.context.globalState.update(key, undefined);
                }
            }
        }
    }
}