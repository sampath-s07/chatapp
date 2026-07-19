'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';

function getInitial(name) {
  return name ? name[0].toUpperCase() : '?';
}

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export default function ChatWindow({ currentUser, selectedUser, socket, isOnline }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load message history when selecting a user
  useEffect(() => {
    if (!selectedUser) return;

    setLoading(true);
    setMessages([]);

    fetch(`/api/messages?with=${selectedUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          // Mark as read
          if (socket) {
            socket.emit('message:read', {
              senderId: selectedUser.id,
              receiverId: currentUser.id,
            });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUser?.id]);

  // Scroll to bottom after loading messages
  useEffect(() => {
    scrollToBottom('instant');
  }, [loading]);

  // Socket message events
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleReceive = (message) => {
      const isRelevant =
        (message.sender_id === currentUser.id && message.receiver_id === selectedUser.id) ||
        (message.sender_id === selectedUser.id && message.receiver_id === currentUser.id);

      if (isRelevant) {
        setMessages((prev) => {
          // Deduplicate by id
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Mark as read immediately if incoming
        if (message.sender_id === selectedUser.id) {
          socket.emit('message:read', {
            senderId: selectedUser.id,
            receiverId: currentUser.id,
          });
        }

        setTimeout(() => scrollToBottom(), 50);
      }
    };

    const handleReadAck = ({ senderId, receiverId }) => {
      if (senderId === currentUser.id && receiverId === selectedUser.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === currentUser.id ? { ...m, is_read: 1 } : m
          )
        );
      }
    };

    socket.on('message:receive', handleReceive);
    socket.on('message:read:ack', handleReadAck);

    return () => {
      socket.off('message:receive', handleReceive);
      socket.off('message:read:ack', handleReadAck);
    };
  }, [socket, selectedUser?.id, currentUser?.id]);

  const sendMessage = useCallback(() => {
    const content = input.trim();
    if (!content || !socket || !selectedUser) return;

    socket.emit('message:send', {
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content,
    });

    setInput('');
    inputRef.current?.focus();
  }, [input, socket, selectedUser, currentUser]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedUser) {
    return (
      <div className="chat-main">
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2>ChatApp</h2>
          <p>Select a contact to start a real-time conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main">
      {/* Chat Header */}
      <div className="chat-header">
        <div
          className="chat-header-avatar"
          style={{ background: selectedUser.avatar_color || '#00a884' }}
        >
          {getInitial(selectedUser.username)}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{selectedUser.username}</div>
          <div className={`chat-header-status ${isOnline ? 'online' : ''}`}>
            {isOnline ? '🟢 Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" id="messages-container">
        {loading ? (
          <div className="no-messages">
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>No messages yet — say hi! 👋</span>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const showDate = !prev || !isSameDay(prev.created_at, msg.created_at);
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUser.id}
                showDateHeader={showDate}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <button className="emoji-btn" type="button" aria-label="Emoji">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          <textarea
            id="message-input"
            ref={inputRef}
            className="message-input"
            placeholder="Type a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <button
          id="send-btn"
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
