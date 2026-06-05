import React from 'react';
import { Story } from '../types';

interface StoryFeedProps {
  stories: Story[];
  loading: boolean;
  onReaction: (storyId: string, emoji: string) => void;
  onViewStory: (storyId: string) => void;
}

export const StoryFeed: React.FC<StoryFeedProps> = ({ 
  stories, 
  loading, 
  onReaction, 
  onViewStory 
}) => {
  if (loading) {
    return (
      <div className="loading">
        <div>Loading stories...</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No stories yet</h3>
        <p>Create your first story to get started!</p>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const formatExpiresIn = (expiresAt: number) => {
    const now = Date.now();
    const diff = expiresAt - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff <= 0) {
      return 'Expired';
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const getReactionCount = (reactions: { [emoji: string]: string[] }, emoji: string) => {
    return reactions[emoji]?.length || 0;
  };

  return (
    <div>
      {/* Story rings at top */}
      <div className="story-grid">
        {stories.slice(0, 10).map((story) => (
          <div key={story.id} className="story-ring" onClick={() => onViewStory(story.id)}>
            <img 
              src={story.authorAvatar} 
              alt={story.authorName}
              className="story-avatar"
            />
          </div>
        ))}
      </div>

      {/* Story cards */}
      <div>
        {stories.map((story) => (
          <div key={story.id} className="story-card">
            <div className="story-header">
              <img 
                src={story.authorAvatar} 
                alt={story.authorName}
                className="story-avatar"
                style={{ width: '40px', height: '40px' }}
              />
              <div style={{ flex: 1 }}>
                <div className="story-author">{story.authorName}</div>
                <div className="story-time">
                  @{story.authorUsername} · {formatTimeAgo(story.timestamp)}
                </div>
              </div>
              <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                {formatExpiresIn(story.expiresAt)}
              </div>
            </div>

            <div className="story-content">
              {story.content.type === 'text' && (
                <div>{story.content.text}</div>
              )}
              
              {story.content.type === 'code' && story.content.code && (
                <div>
                  {story.content.code.filename && (
                    <div style={{ 
                      fontSize: '0.9em', 
                      opacity: 0.8, 
                      marginBottom: '8px',
                      fontFamily: 'var(--vscode-editor-font-family)'
                    }}>
                      📁 {story.content.code.filename}
                    </div>
                  )}
                  <pre className="code-block">
                    <code>{story.content.code.content}</code>
                  </pre>
                </div>
              )}
              
              {story.content.type === 'image' && story.content.image && (
                <div>
                  <img 
                    src={story.content.image.url} 
                    alt={story.content.image.caption || 'Story image'}
                    style={{ maxWidth: '100%', borderRadius: '4px' }}
                  />
                  {story.content.image.caption && (
                    <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                      {story.content.image.caption}
                    </div>
                  )}
                </div>
              )}
            </div>

            {story.tags.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {story.tags.map((tag) => (
                  <span 
                    key={tag}
                    style={{
                      display: 'inline-block',
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-button-foreground)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      marginRight: '6px',
                      opacity: 0.8
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="story-actions">
              <button 
                className="reaction-btn"
                onClick={() => onReaction(story.id, '👍')}
                title="Like"
              >
                👍 {getReactionCount(story.reactions, '👍')}
              </button>
              
              <button 
                className="reaction-btn"
                onClick={() => onReaction(story.id, '🔥')}
                title="Fire"
              >
                🔥 {getReactionCount(story.reactions, '🔥')}
              </button>
              
              <button 
                className="reaction-btn"
                onClick={() => onReaction(story.id, '💡')}
                title="Insightful"
              >
                💡 {getReactionCount(story.reactions, '💡')}
              </button>
              
              <button 
                className="reaction-btn"
                onClick={() => onReaction(story.id, '🐛')}
                title="Bug"
              >
                🐛 {getReactionCount(story.reactions, '🐛')}
              </button>

              <div style={{ marginLeft: 'auto', fontSize: '0.9em', opacity: 0.7 }}>
                {story.viewCount} views
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};