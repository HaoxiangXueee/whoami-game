/**
 * 玩家输入组件
 * 包含文本输入框和玉玺发送按钮
 */

import { useState, useRef, useCallback } from 'react';

interface PlayerInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * 快捷回复选项
 */
const QUICK_REPLIES = [
  '朕知道了',
  '此事需从长计议',
  '传朕旨意',
  '退下吧',
];

export function PlayerInput({
  onSend,
  isLoading = false,
  placeholder = '朕意如何...',
  maxLength = 500,
}: PlayerInputProps) {
  const [content, setContent] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 处理发送消息
   */
  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    onSend(trimmedContent);
    setContent('');
    setShowQuickReplies(false);

    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isLoading, onSend]);

  /**
   * 处理快捷键
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Command + Enter 发送
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /**
   * 处理文本变化
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);

      // 自动调整高度
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [maxLength]);

  /**
   * 选择快捷回复
   */
  const selectQuickReply = useCallback((reply: string) => {
    setContent(reply);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="player-input-container">
      {/* 快捷回复选项 */}
      {showQuickReplies && (
        <div className="quick-replies">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              className="quick-reply-btn"
              onClick={() => selectQuickReply(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="input-area">
        <button
          className="quick-reply-toggle"
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          title="快捷回复"
        >
          💬
        </button>

        <textarea
          ref={textareaRef}
          className="player-textarea"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
        />

        <button
          className={`send-btn ${!content.trim() || isLoading ? 'disabled' : ''}`}
          onClick={handleSend}
          disabled={!content.trim() || isLoading}
          title="发送 (Ctrl+Enter)"
        >
          {isLoading ? (
            <span className="send-spinner">⟳</span>
          ) : (
            <>
              <span className="seal-icon">🧧</span>
              <span className="send-text">下旨</span>
            </>
          )}
        </button>
      </div>

      {/* 字数统计 */}
      <div className="input-meta">
        <span className="char-count">
          {content.length}/{maxLength}
        </span>
        <span className="shortcut-hint">Ctrl+Enter 发送</span>
      </div>
    </div>
  );
}
