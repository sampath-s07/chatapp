'use client';

import { useState, useMemo } from 'react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}

function getInitial(name) {
  return name ? name[0].toUpperCase() : '?';
}

export default function Sidebar({
  currentUser,
  users,
  selectedUser,
  onSelectUser,
  onlineUsers,
  lastMessages,
  unreadCounts,
  onLogout,
}) {
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // Sort: unread first, then by last message time
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aUnread = unreadCounts[a.id] || 0;
      const bUnread = unreadCounts[b.id] || 0;
      if (aUnread !== bUnread) return bUnread - aUnread;

      const aLast = lastMessages[a.id]?.created_at || a.created_at;
      const bLast = lastMessages[b.id]?.created_at || b.created_at;
      return new Date(bLast) - new Date(aLast);
    });
  }, [filteredUsers, unreadCounts, lastMessages]);

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div
            className="header-avatar"
            style={{ background: currentUser?.avatar_color || '#00a884' }}
            title={currentUser?.username}
          >
            {getInitial(currentUser?.username)}
          </div>
          <span className="sidebar-title">ChatApp</span>
        </div>
        <div className="header-actions">
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={onLogout}
            title="Logout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="search-contacts"
            className="search-input"
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="sidebar-contacts">
        {sortedUsers.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {search ? 'No contacts found' : 'No other users yet'}
          </div>
        ) : (
          <>
            <div className="contacts-section-label">
              {onlineUsers.length > 0 ? `${onlineUsers.filter(id => id !== currentUser?.id).length} online` : 'All contacts'}
            </div>
            {sortedUsers.map((user, idx) => {
              const isOnline = onlineUsers.includes(user.id);
              const isActive = selectedUser?.id === user.id;
              const lastMsg = lastMessages[user.id];
              const unread = unreadCounts[user.id] || 0;

              return (
                <div key={user.id}>
                  <div
                    id={`contact-${user.id}`}
                    className={`contact-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="contact-avatar-wrap">
                      <div
                        className="contact-avatar"
                        style={{ background: user.avatar_color || '#00a884' }}
                      >
                        {getInitial(user.username)}
                      </div>
                      {isOnline && <div className="online-dot" />}
                    </div>

                    <div className="contact-info">
                      <div className="contact-name-row">
                        <span className="contact-name">{user.username}</span>
                        {lastMsg && (
                          <span className="contact-time">{formatTime(lastMsg.created_at)}</span>
                        )}
                      </div>
                      <div className="contact-preview-row">
                        <span className="contact-preview">
                          {lastMsg
                            ? (lastMsg.sender_id === currentUser?.id ? '✓ ' : '') + lastMsg.content
                            : isOnline ? '🟢 Online' : 'Tap to start chatting'}
                        </span>
                        {unread > 0 && (
                          <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx < sortedUsers.length - 1 && <div className="sidebar-divider" />}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
