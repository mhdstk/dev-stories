import React, { useState } from 'react';

interface StoryCreationProps {
  onCreateStory: (storyData: any) => void;
  onCancel: () => void;
}

export const StoryCreation: React.FC<StoryCreationProps> = ({ 
  onCreateStory, 
  onCancel 
}) => {
  const [contentType, setContentType] = useState<'text' | 'code' | 'image'>('text');
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [filename, setFilename] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'group' | 'private'>('public');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let content: any = { type: contentType };
    
    switch (contentType) {
      case 'text':
        content.text = text.trim();
        break;
      case 'code':
        content.code = {
          content: code.trim(),
          language,
          filename: filename.trim() || undefined
        };
        break;
      case 'image':
        // TODO: Implement image upload
        break;
    }

    const storyData = {
      content,
      visibility,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    };

    onCreateStory(storyData);
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Create New Story</h2>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Content Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Content Type
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className={`btn ${contentType === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContentType('text')}
            >
              💬 Text
            </button>
            <button
              type="button"
              className={`btn ${contentType === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContentType('code')}
            >
              💻 Code
            </button>
            <button
              type="button"
              className={`btn ${contentType === 'image' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setContentType('image')}
              disabled
            >
              🖼️ Image (Coming Soon)
            </button>
          </div>
        </div>

        {/* Content Input */}
        {contentType === 'text' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              What's on your mind?
            </label>
            <textarea
              className="input textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your thoughts, insights, or updates..."
              required
              style={{ width: '100%', minHeight: '120px' }}
            />
          </div>
        )}

        {contentType === 'code' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Programming Language
              </label>
              <input
                type="text"
                className="input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="javascript, python, typescript, etc."
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Filename (optional)
              </label>
              <input
                type="text"
                className="input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="example.js, main.py, etc."
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Code Content
              </label>
              <textarea
                className="input textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste or type your code here..."
                required
                style={{ 
                  width: '100%', 
                  minHeight: '200px',
                  fontFamily: 'var(--vscode-editor-font-family)',
                  fontSize: 'var(--vscode-editor-font-size)'
                }}
              />
            </div>
          </>
        )}

        {/* Visibility */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Who can see this?
          </label>
          <select 
            className="input"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            style={{ width: '100%' }}
          >
            <option value="public">🌍 Public - Everyone can see</option>
            <option value="followers">👥 Followers - Only your followers</option>
            <option value="group">🏢 Group - Specific group members</option>
            <option value="private">🔒 Private - Only you</option>
          </select>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Tags (optional)
          </label>
          <input
            type="text"
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="javascript, react, tutorial (comma separated)"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: '4px' }}>
            Add up to 10 tags to help others discover your story
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Share Story
          </button>
        </div>
      </form>
    </div>
  );
};