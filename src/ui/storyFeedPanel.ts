import * as vscode from 'vscode';
import * as path from 'path';
import { StoryManager } from '@/core/storyManager';
import { GitHubAuthService } from '@/services/githubAuth';

export class StoryFeedPanel {
    public static currentPanel: StoryFeedPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private storyManager: StoryManager;
    private authService: GitHubAuthService;

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (StoryFeedPanel.currentPanel) {
            StoryFeedPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'storyFeed',
            'Stories Feed',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
                ]
            }
        );

        StoryFeedPanel.currentPanel = new StoryFeedPanel(panel, extensionUri, context);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.storyManager = StoryManager.getInstance(context);
        this.authService = GitHubAuthService.getInstance(context);

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(
            (e) => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                await this._handleMessage(message);
            },
            undefined,
            this._disposables
        );
    }

    private async _handleMessage(message: any) {
        switch (message.type) {
            case 'requestInitialData':
                await this._sendInitialData();
                break;
            case 'createStory':
                await this._createStory(message.payload);
                break;
            case 'addReaction':
                await this._addReaction(message.payload);
                break;
            case 'viewStory':
                await this._viewStory(message.payload);
                break;
            case 'signIn':
                await this._signIn();
                break;
        }
    }

    private async _sendInitialData() {
        const user = await this.authService.getAuthenticatedUser();
        
        if (user) {
            this._panel.webview.postMessage({
                type: 'userData',
                payload: user
            });

            const feed = await this.storyManager.getStoryFeed();
            this._panel.webview.postMessage({
                type: 'storiesData',
                payload: {
                    stories: feed.stories.map(item => item.story)
                }
            });
        } else {
            this._panel.webview.postMessage({
                type: 'userData',
                payload: null
            });
        }
    }

    private async _createStory(payload: any) {
        try {
            let story;
            
            if (payload.content.type === 'text') {
                story = await this.storyManager.createTextStory(
                    payload.content.text,
                    payload.visibility,
                    payload.tags
                );
            } else if (payload.content.type === 'code') {
                story = await this.storyManager.createCodeStory(
                    payload.content.code.content,
                    payload.content.code.language,
                    payload.content.code.filename,
                    payload.visibility,
                    payload.tags
                );
            }

            if (story) {
                this._panel.webview.postMessage({
                    type: 'storyCreated',
                    payload: story
                });
                vscode.window.showInformationMessage('Story created successfully!');
            } else {
                this._panel.webview.postMessage({
                    type: 'error',
                    payload: 'Failed to create story'
                });
            }
        } catch (error) {
            console.error('Error creating story:', error);
            this._panel.webview.postMessage({
                type: 'error',
                payload: 'Failed to create story'
            });
        }
    }

    private async _addReaction(payload: { storyId: string; emoji: string }) {
        // TODO: Implement reaction functionality
        vscode.window.showInformationMessage(`Added ${payload.emoji} reaction to story`);
    }

    private async _viewStory(payload: { storyId: string }) {
        // TODO: Implement story view tracking
        console.log('Viewing story:', payload.storyId);
    }

    private async _signIn() {
        const result = await this.authService.authenticate();
        if (result) {
            this._sendInitialData();
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Stories Feed';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'webview.css')
        );

        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>VS Code Stories</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        StoryFeedPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}