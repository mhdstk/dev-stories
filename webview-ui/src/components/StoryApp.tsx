import React, { useState, useEffect } from 'react';
import { StoryFeed } from './StoryFeed';
import { StoryCreation } from './StoryCreation';
import { Story, WebviewMessage, VSCodeAPI } from '../types';

declare const vscode: VSCodeAPI;

export const StoryApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'feed' | 'create'>('feed');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WebviewMessage;
      
      switch (message.type) {
        case 'storiesData':
          setStories(message.payload.stories || []);
          setLoading(false);
          break;
        case 'userData':
          setUser(message.payload);
          break;
        case 'storyCreated':
          setStories(prev => [message.payload, ...prev]);
          setCurrentView('feed');
          break;
        case 'error':
          console.error('Error from extension:', message.payload);
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial data
    vscode.postMessage({ type: 'requestInitialData' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleCreateStory = (storyData: any) => {
    vscode.postMessage({ 
      type: 'createStory', 
      payload: storyData 
    });
  };

  const handleReaction = (storyId: string, emoji: string) => {
    vscode.postMessage({
      type: 'addReaction',
      payload: { storyId, emoji }
    });
  };

  const handleViewStory = (storyId: string) => {
    vscode.postMessage({
      type: 'viewStory',
      payload: { storyId }
    });
  };

  const handleAuthSignIn = () => {
    vscode.postMessage({ type: 'signIn' });
  };

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Welcome to VS Code Stories</h3>
          <p>Sign in with GitHub to start sharing your code stories</p>
          <button className="btn btn-primary" onClick={handleAuthSignIn} style={{ marginTop: '16px' }}>
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={user.avatar_url} 
            alt={user.name}
            className="story-avatar"
            style={{ width: '32px', height: '32px' }}
          />
          <div>
            <div style={{ fontWeight: '600' }}>{user.name}</div>
            <div style={{ fontSize: '0.9em', opacity: 0.7 }}>@{user.login}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${currentView === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentView('feed')}
          >
            Feed
          </button>
          <button 
            className={`btn ${currentView === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentView('create')}
          >
            Create
          </button>
        </div>
      </header>

      <div className="content">
        {currentView === 'feed' ? (
          <StoryFeed 
            stories={stories} 
            loading={loading}
            onReaction={handleReaction}
            onViewStory={handleViewStory}
          />
        ) : (
          <StoryCreation 
            onCreateStory={handleCreateStory}
            onCancel={() => setCurrentView('feed')}
          />
        )}
      </div>
    </div>
  );
};