'use client';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateHeader(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function TickIcon({ isRead }) {
  return (
    <div className={`message-ticks ${isRead ? 'tick-read' : 'tick-sent'}`}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
      </svg>
    </div>
  );
}

export default function MessageBubble({ message, currentUserId, showDateHeader }) {
  const isOutgoing = message.sender_id === currentUserId;

  return (
    <>
      {showDateHeader && (
        <div className="date-divider">
          <span>{formatDateHeader(message.created_at)}</span>
        </div>
      )}
      <div className={`message-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}>
        <div className="message-bubble">
          <div className="message-text">{message.content}</div>
          <div className="message-meta">
            <span className="message-time">{formatTime(message.created_at)}</span>
            {isOutgoing && <TickIcon isRead={message.is_read === 1} />}
          </div>
        </div>
      </div>
    </>
  );
}
