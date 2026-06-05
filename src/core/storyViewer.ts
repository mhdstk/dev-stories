import * as vscode from 'vscode';
import { Story } from '@/types';
import { GitHubStorageService } from '@/services/githubStorage';
import { GitHubAuthService } from '@/services/githubAuth';
import { StoryValidator } from './storyValidator';

export class StoryViewer {
    private static instance: StoryViewer;
    private storageService: GitHubStorageService;
    private authService: GitHubAuthService;

    private constructor(private context: vscode.ExtensionContext) {
        this.storageService = GitHubStorageService.getInstance(context);
        this.authService = GitHubAuthService.getInstance(context);
    }

    public static getInstance(context?: vscode.ExtensionContext): StoryViewer {
        if (!StoryViewer.instance && context) {
            StoryViewer.instance = new StoryViewer(context);
        }
        return StoryViewer.instance;
    }

    async showStoryQuickPick(stories: Story[]): Promise<Story | undefined> {
        if (stories.length === 0) {
            vscode.window.showInformationMessage('No stories available');
            return;
        }

        const quickPickItems = stories.map(story => ({
            label: `$(${this.getStoryIcon(story)}) ${story.authorName}`,
            description: this.getStoryDescription(story),
            detail: this.getStoryPreview(story),
            story: story
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a story to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected?.story;
    }

    async viewStoryDetails(story: Story): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'storyDetails',
            `Story by ${story.authorName}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getStoryDetailsHtml(story);

        // Track view
        await this.trackStoryView(story.id);
    }

    async showStoryInEditor(story: Story): Promise<void> {
        let content = '';
        let language = 'markdown';

        switch (story.content.type) {
            case 'text':
                content = `# Story by ${story.authorName}\n\n${story.content.text}`;
                break;
            case 'code':
                if (story.content.code) {
                    content = story.content.code.content;
                    language = story.content.code.language;
                }
                break;
            case 'image':
                content = `# Story by ${story.authorName}\n\n![Story Image](${story.content.image?.url})\n\n${story.content.image?.caption || ''}`;
                break;
            default:
                content = `# Story by ${story.authorName}\n\nMixed content story`;
        }

        const document = await vscode.workspace.openTextDocument({
            content,
            language
        });

        await vscode.window.showTextDocument(document);

        // Track view
        await this.trackStoryView(story.id);
    }

    async displayStoryInfo(story: Story): Promise<void> {
        const timeLeft = StoryValidator.formatDuration(
            StoryValidator.getTimeUntilExpiration(story)
        );
        
        const reactions = Object.entries(story.reactions)
            .map(([emoji, users]) => `${emoji} ${users.length}`)
            .join(' ');

        const info = [
            `👤 **Author**: ${story.authorName} (@${story.authorUsername})`,
            `🕒 **Created**: ${new Date(story.timestamp).toLocaleString()}`,
            `⏰ **Expires in**: ${timeLeft}`,
            `👁️ **Views**: ${story.viewCount}`,
            `🏷️ **Tags**: ${story.tags.join(', ') || 'None'}`,
            `👍 **Reactions**: ${reactions || 'None'}`,
            `🔒 **Visibility**: ${story.visibility}`
        ].join('\n\n');

        vscode.window.showInformationMessage(info, { modal: true });
    }

    private getStoryIcon(story: Story): string {
        switch (story.content.type) {
            case 'text': return 'comment';
            case 'code': return 'code';
            case 'image': return 'file-media';
            case 'mixed': return 'layers';
            default: return 'broadcast';
        }
    }

    private getStoryDescription(story: Story): string {
        const timeLeft = StoryValidator.formatDuration(
            StoryValidator.getTimeUntilExpiration(story)
        );
        return `@${story.authorUsername} • ${timeLeft} left • ${story.viewCount} views`;
    }

    private getStoryPreview(story: Story): string {
        switch (story.content.type) {
            case 'text':
                return story.content.text?.substring(0, 100) + '...' || 'Text story';
            case 'code':
                return `${story.content.code?.language}: ${story.content.code?.content.substring(0, 50)}...`;
            case 'image':
                return story.content.image?.caption || 'Image story';
            default:
                return 'Mixed content story';
        }
    }

    private getStoryDetailsHtml(story: Story): string {
        const timeLeft = StoryValidator.formatDuration(
            StoryValidator.getTimeUntilExpiration(story)
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Details</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
        }
        .author-info {
            flex-grow: 1;
        }
        .author-name {
            font-weight: bold;
            font-size: 16px;
        }
        .author-username {
            opacity: 0.7;
            font-size: 14px;
        }
        .meta {
            opacity: 0.7;
            font-size: 12px;
        }
        .content {
            margin: 20px 0;
        }
        .code-block {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 16px;
            margin: 12px 0;
            font-family: var(--vscode-editor-font-family);
            white-space: pre;
            overflow-x: auto;
        }
        .tags {
            display: flex;
            gap: 8px;
            margin: 16px 0;
            flex-wrap: wrap;
        }
        .tag {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        .reactions {
            display: flex;
            gap: 12px;
            margin: 16px 0;
        }
        .reaction {
            background: var(--vscode-button-secondaryBackground);
            border: none;
            padding: 6px 12px;
            border-radius: 16px;
            cursor: pointer;
            font-size: 14px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            opacity: 0.7;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${story.authorAvatar}" alt="${story.authorName}" class="avatar">
        <div class="author-info">
            <div class="author-name">${story.authorName}</div>
            <div class="author-username">@${story.authorUsername}</div>
        </div>
        <div class="meta">
            <div>Created: ${new Date(story.timestamp).toLocaleString()}</div>
            <div>Expires in: ${timeLeft}</div>
        </div>
    </div>

    <div class="content">
        ${this.formatStoryContent(story)}
    </div>

    ${story.tags.length > 0 ? `
        <div class="tags">
            ${story.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
    ` : ''}

    <div class="reactions">
        ${Object.entries(story.reactions).map(([emoji, users]) => 
            `<span class="reaction">${emoji} ${users.length}</span>`
        ).join('')}
    </div>

    <div class="footer">
        <div>Views: ${story.viewCount} | Visibility: ${story.visibility}</div>
    </div>
</body>
</html>`;
    }

    private formatStoryContent(story: Story): string {
        switch (story.content.type) {
            case 'text':
                return `<div>${story.content.text?.replace(/\n/g, '<br>')}</div>`;
            case 'code':
                return story.content.code ? `
                    ${story.content.code.filename ? `<div style="opacity: 0.7; margin-bottom: 8px;">📁 ${story.content.code.filename}</div>` : ''}
                    <div class="code-block">${this.escapeHtml(story.content.code.content)}</div>
                ` : '<div>No code content</div>';
            case 'image':
                return story.content.image ? `
                    <img src="${story.content.image.url}" alt="Story image" style="max-width: 100%; border-radius: 4px;">
                    ${story.content.image.caption ? `<div style="margin-top: 8px; opacity: 0.8;">${story.content.image.caption}</div>` : ''}
                ` : '<div>No image content</div>';
            default:
                return '<div>Mixed content story</div>';
        }
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    private async trackStoryView(storyId: string): Promise<void> {
        try {
            // TODO: Implement view tracking in GitHub storage
            console.log(`Tracked view for story: ${storyId}`);
        } catch (error) {
            console.error('Failed to track story view:', error);
        }
    }
}