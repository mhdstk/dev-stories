export interface Story {
    id: string;
    authorGitHubId: string;
    authorUsername: string;
    authorName: string;
    authorAvatar: string;
    timestamp: number;
    expiresAt: number;
    content: StoryContent;
    visibility: StoryVisibility;
    tags: string[];
    groupId?: string;
    viewCount: number;
    viewers: string[];
    reactions: { [emoji: string]: string[] };
    metadata: StoryMetadata;
}

export interface StoryContent {
    type: StoryContentType;
    text?: string;
    code?: CodeContent;
    image?: ImageContent;
    mixedContent?: MixedContentItem[];
}

export interface CodeContent {
    language: string;
    content: string;
    filename?: string;
    startLine?: number;
    endLine?: number;
    repository?: RepositoryInfo;
}

export interface ImageContent {
    url: string;
    caption?: string;
    alt?: string;
    width?: number;
    height?: number;
}

export interface MixedContentItem {
    type: 'text' | 'code' | 'image';
    content: string | CodeContent | ImageContent;
    order: number;
}

export interface RepositoryInfo {
    owner: string;
    name: string;
    branch?: string;
    path?: string;
    url: string;
}

export interface StoryMetadata {
    createdWith: string; // Extension version
    deviceInfo?: string;
    location?: string;
    projectContext?: ProjectContext;
}

export interface ProjectContext {
    workspaceName?: string;
    activeFile?: string;
    gitBranch?: string;
    gitCommit?: string;
}

export type StoryContentType = 'code' | 'text' | 'image' | 'mixed';
export type StoryVisibility = 'public' | 'followers' | 'group' | 'private';

// Story creation and editing interfaces
export interface CreateStoryRequest {
    content: StoryContent;
    visibility: StoryVisibility;
    tags?: string[];
    groupId?: string;
    expiresIn?: number; // Hours until expiration (default 24)
}

export interface StoryDraft {
    id: string;
    content: Partial<StoryContent>;
    visibility: StoryVisibility;
    tags: string[];
    groupId?: string;
    lastModified: number;
}

// Story viewing and interaction interfaces
export interface StoryView {
    storyId: string;
    viewerId: string;
    viewerUsername: string;
    timestamp: number;
    duration?: number; // How long they viewed it
}

export interface StoryReaction {
    storyId: string;
    userId: string;
    username: string;
    emoji: string;
    timestamp: number;
}

export interface StoryComment {
    id: string;
    storyId: string;
    authorId: string;
    authorUsername: string;
    authorAvatar: string;
    content: string;
    timestamp: number;
    parentId?: string; // For threaded comments
}

// Feed and discovery interfaces
export interface StoryFeedItem {
    story: Story;
    isViewed: boolean;
    viewTimestamp?: number;
}

export interface StoryFeed {
    stories: StoryFeedItem[];
    hasMore: boolean;
    lastUpdated: number;
    nextCursor?: string;
}

export interface StoryGroup {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    memberCount: number;
    isPrivate: boolean;
    createdBy: string;
    createdAt: number;
    avatar?: string;
}

export interface UserProfile {
    githubUser: import('@/types/auth').GitHubUser;
    storyCount: number;
    followerCount: number;
    followingCount: number;
    groupMemberships: string[];
    lastActive: number;
    isFollowed: boolean;
}

// Analytics and insights
export interface StoryAnalytics {
    storyId: string;
    totalViews: number;
    uniqueViews: number;
    reactions: { [emoji: string]: number };
    topViewers: { username: string; viewCount: number }[];
    viewsByHour: { [hour: string]: number };
    engagementRate: number;
}

// Error handling
export interface StoryError {
    code: string;
    message: string;
    details?: any;
}

export interface ValidationResult {
    isValid: boolean;
    errors: StoryError[];
}

// Storage interfaces
export interface StorageMetadata {
    version: string;
    lastSync: number;
    totalStories: number;
    storageQuota?: number;
    storageUsed?: number;
}