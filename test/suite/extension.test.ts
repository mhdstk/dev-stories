import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Extension Test Suite', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('mhdstk.dev-stories'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('mhdstk.dev-stories');
    if (extension) {
      if (!extension.isActive) {
        await extension.activate();
      }
      assert.ok(extension.isActive);
    }
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    const storyCommands = commands.filter(cmd => cmd.startsWith('dev-stories.'));
    
    // Check that essential commands are registered
    assert.ok(storyCommands.includes('dev-stories.authenticate'));
    assert.ok(storyCommands.includes('dev-stories.viewFeed'));
    assert.ok(storyCommands.includes('dev-stories.createStory'));
    assert.ok(storyCommands.length >= 10, `Expected at least 10 story commands, found ${storyCommands.length}`);
  });
});