"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storyValidator_1 = require("../../src/core/storyValidator");
describe('StoryValidator', () => {
    describe('validateCreateStoryRequest', () => {
        it('should validate a valid text story request', () => {
            const request = {
                content: {
                    type: 'text',
                    text: 'This is a valid text story'
                },
                visibility: 'public',
                tags: ['test']
            };
            const result = storyValidator_1.StoryValidator.validateCreateStoryRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should validate a valid code story request', () => {
            const request = {
                content: {
                    type: 'code',
                    code: {
                        language: 'javascript',
                        content: 'console.log("Hello World");',
                        filename: 'hello.js'
                    }
                },
                visibility: 'public',
                tags: ['javascript', 'hello']
            };
            const result = storyValidator_1.StoryValidator.validateCreateStoryRequest(request);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject empty text content', () => {
            const request = {
                content: {
                    type: 'text',
                    text: ''
                },
                visibility: 'public'
            };
            const result = storyValidator_1.StoryValidator.validateCreateStoryRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].code).toBe('EMPTY_TEXT_CONTENT');
        });
        it('should reject invalid visibility', () => {
            const request = {
                content: {
                    type: 'text',
                    text: 'Valid content'
                },
                visibility: 'invalid'
            };
            const result = storyValidator_1.StoryValidator.validateCreateStoryRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_VISIBILITY')).toBe(true);
        });
        it('should reject too many tags', () => {
            const request = {
                content: {
                    type: 'text',
                    text: 'Valid content'
                },
                visibility: 'public',
                tags: Array.from({ length: 11 }, (_, i) => `tag${i}`)
            };
            const result = storyValidator_1.StoryValidator.validateCreateStoryRequest(request);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_TAGS')).toBe(true);
        });
    });
    describe('utility methods', () => {
        it('should generate unique story IDs', () => {
            const id1 = storyValidator_1.StoryValidator.generateStoryId();
            const id2 = storyValidator_1.StoryValidator.generateStoryId();
            expect(id1).toMatch(/^story_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^story_\d+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });
        it('should correctly identify expired stories', () => {
            const expiredStory = {
                id: 'test',
                authorGitHubId: '123',
                authorUsername: 'test',
                authorName: 'Test User',
                authorAvatar: 'https://avatar.url',
                timestamp: Date.now() - 1000,
                expiresAt: Date.now() - 500, // Expired 500ms ago
                content: { type: 'text', text: 'test' },
                visibility: 'public',
                tags: [],
                viewCount: 0,
                viewers: [],
                reactions: {},
                metadata: { createdWith: '1.0.0' }
            };
            const activeStory = {
                ...expiredStory,
                expiresAt: Date.now() + 86400000 // Expires in 24 hours
            };
            expect(storyValidator_1.StoryValidator.isStoryExpired(expiredStory)).toBe(true);
            expect(storyValidator_1.StoryValidator.isStoryExpired(activeStory)).toBe(false);
        });
        it('should format duration correctly', () => {
            expect(storyValidator_1.StoryValidator.formatDuration(3600000)).toBe('1h 0m'); // 1 hour
            expect(storyValidator_1.StoryValidator.formatDuration(1800000)).toBe('30m'); // 30 minutes
            expect(storyValidator_1.StoryValidator.formatDuration(30000)).toBe('Less than 1m'); // 30 seconds
            expect(storyValidator_1.StoryValidator.formatDuration(7200000)).toBe('2h 0m'); // 2 hours
        });
        it('should sanitize content', () => {
            const dangerous = '<script>alert("xss")</script>Hello <iframe src="evil.com"></iframe>';
            const sanitized = storyValidator_1.StoryValidator.sanitizeContent(dangerous);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('<iframe>');
            expect(sanitized).toContain('Hello');
        });
        it('should truncate text correctly', () => {
            const longText = 'This is a very long text that needs to be truncated';
            const truncated = storyValidator_1.StoryValidator.truncateText(longText, 20);
            expect(truncated).toHaveLength(20);
            expect(truncated).toEndWith('...');
        });
    });
});
//# sourceMappingURL=storyValidator.test.js.map