'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Sidebar from '../../components/Sidebar';
import ChatWindow from '../../components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [messages, setMessages] = useState({}); // keyed by userId
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const selectedUserRef = useRef(null);

  // Keep a ref for selected user for socket callbacks
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Load current user from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('currentUser');
    if (!stored) {
      router.push('/');
      return;
    }
    setCurrentUser(JSON.parse(stored));
  }, []);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchUsers();
  }, [currentUser]);

  // Set up Socket.io
  useEffect(() => {
    if (!currentUser) return;

    const sock = io({
      auth: { userId: currentUser.id },
    });

    sock.on('connect', () => {
      sock.emit('user:online', currentUser.id);
    });

    sock.on('online:users', (userIds) => {
      setOnlineUserIds(userIds.map(Number));
    });

    // Handle incoming messages for sidebar preview + unread counts
    sock.on('message:receive', (message) => {
      const partnerId =
        message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;

      // Update last message for sidebar
      setLastMessages((prev) => ({
        ...prev,
        [partnerId]: message,
      }));

      // Update unread count if not currently viewing this chat
      if (message.sender_id !== currentUser.id) {
        const activeUser = selectedUserRef.current;
        if (!activeUser || activeUser.id !== message.sender_id) {
          setUnreadCounts((prev) => ({
            ...prev,
            [message.sender_id]: (prev[message.sender_id] || 0) + 1,
          }));
        }
      }
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
    };
  }, [currentUser?.id]);

  // Preload last messages for all users on initial load
  useEffect(() => {
    if (!currentUser || users.length === 0) return;

    // Fetch last messages for each user in parallel
    Promise.all(
      users.map(async (user) => {
        try {
          const res = await fetch(`/api/messages?with=${user.id}`);
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const lastMsg = data.messages[data.messages.length - 1];
            const unread = data.messages.filter(
              (m) => m.sender_id === user.id && !m.is_read
            ).length;
            return { userId: user.id, lastMsg, unread };
          }
        } catch {
          // ignore
        }
        return { userId: user.id, lastMsg: null, unread: 0 };
      })
    ).then((results) => {
      const newLastMessages = {};
      const newUnreadCounts = {};
      results.forEach(({ userId, lastMsg, unread }) => {
        if (lastMsg) newLastMessages[userId] = lastMsg;
        if (unread > 0) newUnreadCounts[userId] = unread;
      });
      setLastMessages(newLastMessages);
      setUnreadCounts(newUnreadCounts);
    });
  }, [currentUser?.id, users.length]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    // Clear unread count for this user
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('currentUser');
    if (socket) socket.disconnect();
    router.push('/');
  };

  if (loading || !currentUser) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-lg" />
        <span className="loading-text">Connecting to ChatApp...</span>
      </div>
    );
  }

  return (
    <div className="chat-app">
      <Sidebar
        currentUser={currentUser}
        users={users}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        onlineUsers={onlineUserIds}
        lastMessages={lastMessages}
        unreadCounts={unreadCounts}
        onLogout={handleLogout}
      />
      <ChatWindow
        currentUser={currentUser}
        selectedUser={selectedUser}
        socket={socket}
        isOnline={selectedUser ? onlineUserIds.includes(selectedUser.id) : false}
      />
    </div>
  );
}
