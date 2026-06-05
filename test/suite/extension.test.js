"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
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
//# sourceMappingURL=extension.test.js.map