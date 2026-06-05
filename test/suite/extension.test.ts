import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('mhdstk.vscode-stories'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('mhdstk.vscode-stories');
    if (extension) {
      if (!extension.isActive) {
        await extension.activate();
      }
      assert.ok(extension.isActive);
    }
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    const storyCommands = commands.filter(cmd => cmd.startsWith('vscode-stories.'));
    
    // Check that essential commands are registered
    assert.ok(storyCommands.includes('vscode-stories.authenticate'));
    assert.ok(storyCommands.includes('vscode-stories.viewFeed'));
    assert.ok(storyCommands.includes('vscode-stories.createStory'));
    assert.ok(storyCommands.length >= 10, `Expected at least 10 story commands, found ${storyCommands.length}`);
  });
});