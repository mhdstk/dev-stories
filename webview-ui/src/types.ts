export interface Story {
  id: string;
  authorGitHubId: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  expiresAt: number;
  content: StoryContent;
  visibility: 'public' | 'followers' | 'group' | 'private';
  tags: string[];
  groupId?: string;
  viewCount: number;
  viewers: string[];
  reactions: { [emoji: string]: string[] };
}

export interface StoryContent {
  type: 'code' | 'text' | 'image' | 'mixed';
  text?: string;
  code?: {
    language: string;
    content: string;
    filename?: string;
  };
  image?: {
    url: string;
    caption?: string;
  };
  mixedContent?: any[];
}

export interface StoryFeedItem {
  story: Story;
  isViewed: boolean;
  viewTimestamp?: number;
}

export interface WebviewMessage {
  type: string;
  payload?: any;
}

export interface VSCodeAPI {
  postMessage(message: WebviewMessage): void;
  setState(state: any): void;
  getState(): any;
}