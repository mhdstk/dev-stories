import * as vscode from 'vscode';
import { Story, CreateStoryRequest, StoryFeed, StoryDraft } from '@/types';
import { GitHubStorageService } from '@/services/githubStorage';
import { GitHubAuthService } from '@/services/githubAuth';
import { StoryValidator } from './storyValidator';

export class StoryManager {
    private static instance: StoryManager;
    private storageService: GitHubStorageService;
    private authService: GitHubAuthService;

    private constructor(private context: vscode.ExtensionContext) {
        this.storageService = GitHubStorageService.getInstance(context);
        this.authService = GitHubAuthService.getInstance(context);
        this.startBackgroundTasks();
    }

    public static getInstance(context?: vscode.ExtensionContext): StoryManager {
        if (!StoryManager.instance && context) {
            StoryManager.instance = new StoryManager(context);
        }
        return StoryManager.instance;
    }

    async createTextStory(text: string, visibility: 'public' | 'followers' | 'group' | 'private' = 'public', tags?: string[]): Promise<Story | null> {
        const request: CreateStoryRequest = {
            content: {
                type: 'text',
                text: text.trim()
            },
            visibility,
            tags
        };

        return await this.storageService.createStory(request);
    }

    async createCodeStory(
        code: string, 
        language: string, 
        filename?: string,
        visibility: 'public' | 'followers' | 'group' | 'private' = 'public',
        tags?: string[]
    ): Promise<Story | null> {
        const request: CreateStoryRequest = {
            content: {
                type: 'code',
                code: {
                    content: code,
                    language,
                    filename
                }
            },
            visibility,
            tags: tags || [language] // Auto-add language as tag
        };

        return await this.storageService.createStory(request);
    }

    async createCodeStoryFromSelection(): Promise<Story | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.selection || editor.selection.isEmpty) {
            vscode.window.showWarningMessage('Please select some code to share as a story');
            return null;
        }

        const selectedText = editor.document.getText(editor.selection);
        const language = editor.document.languageId;
        const filename = editor.document.fileName.split('/').pop();

        // Ask for visibility and tags
        const visibility = await this.askForVisibility();
        if (!visibility) return null;

        const tags = await this.askForTags([language]);

        return await this.createCodeStory(selectedText, language, filename, visibility, tags);
    }

    async createImageStory(imagePath: string, caption?: string, visibility: 'public' | 'followers' | 'group' | 'private' = 'public', tags?: string[]): Promise<Story | null> {
        const request: CreateStoryRequest = {
            content: {
                type: 'image',
                image: {
                    url: imagePath,
                    caption
                }
            },
            visibility,
            tags
        };

        return await this.storageService.createStory(request);
    }

    async getMyStories(): Promise<Story[]> {
        if (!await this.authService.ensureAuthenticated()) {
            return [];
        }

        return await this.storageService.getUserStories();
    }

    async getStoryById(storyId: string): Promise<Story | null> {
        return await this.storageService.getStory(storyId);
    }

    async getStoryFeed(): Promise<StoryFeed> {
        // TODO: Implement feed logic with following, groups, etc.
        const myStories = await this.getMyStories();
        
        return {
            stories: myStories.map(story => ({
                story,
                isViewed: false
            })),
            hasMore: false,
            lastUpdated: Date.now()
        };
    }

    private async askForVisibility(): Promise<'public' | 'followers' | 'group' | 'private' | undefined> {
        const options = [
            { label: '🌍 Public', description: 'Everyone can see this story', value: 'public' as const },
            { label: '👥 Followers', description: 'Only your followers can see this', value: 'followers' as const },
            { label: '🏢 Group', description: 'Share with a specific group', value: 'group' as const },
            { label: '🔒 Private', description: 'Only you can see this', value: 'private' as const }
        ];

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Who can see this story?',
            ignoreFocusOut: true
        });

        return selected?.value;
    }

    private async askForTags(suggestedTags: string[] = []): Promise<string[]> {
        const input = await vscode.window.showInputBox({
            prompt: 'Add tags (comma-separated, optional)',
            value: suggestedTags.join(', '),
            placeHolder: 'javascript, react, tutorial',
            ignoreFocusOut: true
        });

        if (!input) return suggestedTags;

        const tags = input
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 10); // Max 10 tags

        return [...new Set([...suggestedTags, ...tags])]; // Remove duplicates
    }

    // Draft management
    async saveDraft(draft: Partial<CreateStoryRequest>): Promise<void> {
        const draftData: StoryDraft = {
            id: `draft_${Date.now()}`,
            content: draft.content || {},
            visibility: draft.visibility || 'public',
            tags: draft.tags || [],
            groupId: draft.groupId,
            lastModified: Date.now()
        };

        await this.context.workspaceState.update('currentDraft', draftData);
    }

    async loadDraft(): Promise<StoryDraft | null> {
        return this.context.workspaceState.get('currentDraft', null);
    }

    async clearDraft(): Promise<void> {
        await this.context.workspaceState.update('currentDraft', undefined);
    }

    // Background tasks
    private startBackgroundTasks(): void {
        // Clean up expired cache every hour
        setInterval(async () => {
            try {
                await this.storageService.clearExpiredCache();
            } catch (error) {
                console.error('Failed to clear expired cache:', error);
            }
        }, 60 * 60 * 1000); // 1 hour
    }

    // Utility methods
    getTimeUntilExpiration(story: Story): string {
        return StoryValidator.formatDuration(StoryValidator.getTimeUntilExpiration(story));
    }

    isStoryExpired(story: Story): boolean {
        return StoryValidator.isStoryExpired(story);
    }

    // Interactive story creation wizard
    async createStoryWizard(): Promise<Story | null> {
        const contentType = await vscode.window.showQuickPick([
            { label: '💬 Text Story', description: 'Share a text-based story', value: 'text' as const },
            { label: '💻 Code Story', description: 'Share a code snippet', value: 'code' as const },
            { label: '🖼️ Image Story', description: 'Share an image with caption', value: 'image' as const }
        ], {
            placeHolder: 'What type of story do you want to create?',
            ignoreFocusOut: true
        });

        if (!contentType) return null;

        switch (contentType.value) {
            case 'text':
                return await this.createTextStoryWizard();
            case 'code':
                return await this.createCodeStoryWizard();
            case 'image':
                return await this.createImageStoryWizard();
        }
    }

    private async createTextStoryWizard(): Promise<Story | null> {
        const text = await vscode.window.showInputBox({
            prompt: 'What\'s on your mind?',
            placeHolder: 'Share your thoughts, insights, or updates...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Story text cannot be empty';
                }
                if (value.length > 2000) {
                    return 'Story text is too long (max 2000 characters)';
                }
                return null;
            }
        });

        if (!text) return null;

        const visibility = await this.askForVisibility();
        if (!visibility) return null;

        const tags = await this.askForTags();

        return await this.createTextStory(text, visibility, tags);
    }

    private async createCodeStoryWizard(): Promise<Story | null> {
        // Check if there's a selection first
        const editor = vscode.window.activeTextEditor;
        if (editor && !editor.selection.isEmpty) {
            const useSelection = await vscode.window.showQuickPick([
                { label: 'Use Selected Code', description: 'Create story from current selection' },
                { label: 'Enter Code Manually', description: 'Type or paste code manually' }
            ], {
                placeHolder: 'Found selected code. What would you like to do?'
            });

            if (useSelection?.label === 'Use Selected Code') {
                return await this.createCodeStoryFromSelection();
            }
        }

        // Manual code entry
        const code = await vscode.window.showInputBox({
            prompt: 'Enter your code snippet',
            placeHolder: 'paste or type your code here...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Code cannot be empty';
                }
                if (value.length > 50000) {
                    return 'Code is too long (max 50KB)';
                }
                return null;
            }
        });

        if (!code) return null;

        const language = await vscode.window.showInputBox({
            prompt: 'Programming language',
            placeHolder: 'javascript, python, typescript, etc.',
            ignoreFocusOut: true,
            value: editor?.document.languageId || ''
        });

        if (!language) return null;

        const filename = await vscode.window.showInputBox({
            prompt: 'Filename (optional)',
            placeHolder: 'example.js, main.py, etc.',
            ignoreFocusOut: true
        });

        const visibility = await this.askForVisibility();
        if (!visibility) return null;

        const tags = await this.askForTags([language]);

        return await this.createCodeStory(code, language, filename, visibility, tags);
    }

    private async createImageStoryWizard(): Promise<Story | null> {
        vscode.window.showInformationMessage('Image stories - Coming Soon!');
        return null;
    }
}