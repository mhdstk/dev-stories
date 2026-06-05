import { 
    Story, 
    StoryContent, 
    CreateStoryRequest, 
    ValidationResult, 
    StoryError,
    StoryContentType,
    StoryVisibility 
} from '@/types/story';

export class StoryValidator {
    
    static validateCreateStoryRequest(request: CreateStoryRequest): ValidationResult {
        const errors: StoryError[] = [];

        // Validate content
        const contentValidation = this.validateStoryContent(request.content);
        if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors);
        }

        // Validate visibility
        if (!this.isValidVisibility(request.visibility)) {
            errors.push({
                code: 'INVALID_VISIBILITY',
                message: 'Invalid visibility setting'
            });
        }

        // Validate tags
        if (request.tags && !this.validateTags(request.tags)) {
            errors.push({
                code: 'INVALID_TAGS',
                message: 'Tags must be non-empty strings, max 10 tags allowed'
            });
        }

        // Validate expiration
        if (request.expiresIn && (request.expiresIn < 1 || request.expiresIn > 168)) {
            errors.push({
                code: 'INVALID_EXPIRATION',
                message: 'Expiration must be between 1 and 168 hours'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateStoryContent(content: StoryContent): ValidationResult {
        const errors: StoryError[] = [];

        // Validate content type
        if (!this.isValidContentType(content.type)) {
            errors.push({
                code: 'INVALID_CONTENT_TYPE',
                message: 'Invalid content type'
            });
            return { isValid: false, errors };
        }

        switch (content.type) {
            case 'text':
                if (!content.text || content.text.trim().length === 0) {
                    errors.push({
                        code: 'EMPTY_TEXT_CONTENT',
                        message: 'Text content cannot be empty'
                    });
                }
                if (content.text && content.text.length > 2000) {
                    errors.push({
                        code: 'TEXT_TOO_LONG',
                        message: 'Text content exceeds maximum length (2000 characters)'
                    });
                }
                break;

            case 'code':
                if (!content.code) {
                    errors.push({
                        code: 'MISSING_CODE_CONTENT',
                        message: 'Code content is required for code stories'
                    });
                } else {
                    if (!content.code.content || content.code.content.trim().length === 0) {
                        errors.push({
                            code: 'EMPTY_CODE_CONTENT',
                            message: 'Code content cannot be empty'
                        });
                    }
                    if (content.code.content && content.code.content.length > 50000) {
                        errors.push({
                            code: 'CODE_TOO_LONG',
                            message: 'Code content exceeds maximum length (50KB)'
                        });
                    }
                    if (!content.code.language) {
                        errors.push({
                            code: 'MISSING_LANGUAGE',
                            message: 'Programming language is required for code content'
                        });
                    }
                }
                break;

            case 'image':
                if (!content.image) {
                    errors.push({
                        code: 'MISSING_IMAGE_CONTENT',
                        message: 'Image content is required for image stories'
                    });
                } else {
                    if (!content.image.url) {
                        errors.push({
                            code: 'MISSING_IMAGE_URL',
                            message: 'Image URL is required'
                        });
                    }
                    if (content.image.caption && content.image.caption.length > 500) {
                        errors.push({
                            code: 'CAPTION_TOO_LONG',
                            message: 'Image caption exceeds maximum length (500 characters)'
                        });
                    }
                }
                break;

            case 'mixed':
                if (!content.mixedContent || content.mixedContent.length === 0) {
                    errors.push({
                        code: 'EMPTY_MIXED_CONTENT',
                        message: 'Mixed content cannot be empty'
                    });
                } else {
                    if (content.mixedContent.length > 10) {
                        errors.push({
                            code: 'TOO_MANY_MIXED_ITEMS',
                            message: 'Mixed content cannot have more than 10 items'
                        });
                    }
                    
                    // Validate each mixed content item
                    content.mixedContent.forEach((item, index) => {
                        if (!item.type || !['text', 'code', 'image'].includes(item.type)) {
                            errors.push({
                                code: 'INVALID_MIXED_ITEM_TYPE',
                                message: `Mixed content item ${index} has invalid type`
                            });
                        }
                        if (!item.content) {
                            errors.push({
                                code: 'MISSING_MIXED_ITEM_CONTENT',
                                message: `Mixed content item ${index} is missing content`
                            });
                        }
                    });
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateStory(story: Story): ValidationResult {
        const errors: StoryError[] = [];

        // Basic field validation
        if (!story.id || story.id.trim().length === 0) {
            errors.push({
                code: 'MISSING_STORY_ID',
                message: 'Story ID is required'
            });
        }

        if (!story.authorGitHubId || !story.authorUsername) {
            errors.push({
                code: 'MISSING_AUTHOR_INFO',
                message: 'Author information is required'
            });
        }

        if (!story.timestamp || story.timestamp <= 0) {
            errors.push({
                code: 'INVALID_TIMESTAMP',
                message: 'Valid timestamp is required'
            });
        }

        if (!story.expiresAt || story.expiresAt <= story.timestamp) {
            errors.push({
                code: 'INVALID_EXPIRATION',
                message: 'Expiration date must be after creation timestamp'
            });
        }

        // Validate content
        const contentValidation = this.validateStoryContent(story.content);
        if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors);
        }

        // Validate visibility
        if (!this.isValidVisibility(story.visibility)) {
            errors.push({
                code: 'INVALID_VISIBILITY',
                message: 'Invalid visibility setting'
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private static isValidContentType(type: any): type is StoryContentType {
        return ['code', 'text', 'image', 'mixed'].includes(type);
    }

    private static isValidVisibility(visibility: any): visibility is StoryVisibility {
        return ['public', 'followers', 'group', 'private'].includes(visibility);
    }

    private static validateTags(tags: string[]): boolean {
        if (tags.length > 10) return false;
        
        return tags.every(tag => 
            typeof tag === 'string' && 
            tag.trim().length > 0 && 
            tag.length <= 50 &&
            /^[a-zA-Z0-9_-]+$/.test(tag)
        );
    }

    static sanitizeContent(content: string): string {
        // Remove potentially dangerous content
        return content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    static generateStoryId(): string {
        return `story_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    static isStoryExpired(story: Story): boolean {
        return Date.now() > story.expiresAt;
    }

    static getTimeUntilExpiration(story: Story): number {
        return Math.max(0, story.expiresAt - Date.now());
    }

    static formatDuration(milliseconds: number): string {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return 'Less than 1m';
        }
    }
}