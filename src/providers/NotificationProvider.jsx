// src/providers/NotificationProvider.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';

// No more import of NOTIFICATION_TYPES

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gage_system_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        updateUnreadCount(parsed);
      } catch (e) {
        console.error('Failed to load notifications from localStorage:', e);
      }
    }
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('gage_system_notifications', JSON.stringify(notifications));
    updateUnreadCount(notifications);
  }, [notifications]);

  const updateUnreadCount = (notifs) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);

    // Update browser tab title with unread count
    if (count > 0) {
      document.title = `(${count}) Gage Management System`;
    } else {
      document.title = 'Gage Management System';
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      read: false,
      // Keep type/title/message/source – but don't rely on NOTIFICATION_TYPES
      type: notification.type || 'info',          // fallback to 'info'
      title: notification.title || 'Notification',
      message: notification.message || '',
      source: notification.source || 'System',
      ...notification, // allow overriding
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 150); // keep last 150
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications? This cannot be undone.')) {
      setNotifications([]);
    }
  };

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAllAsRead,
    clearAll,

    // Convenience methods – now without NOTIFICATION_TYPES dependency
    notify: (type, title, message, source = 'System') => 
      addNotification({ type, title, message, source }),

    notifySuccess: (title, message) => 
      addNotification({ type: 'success', title, message }),

    notifyError: (title, message) => 
      addNotification({ type: 'error', title, message }),

    notifyWarning: (title, message) => 
      addNotification({ type: 'warning', title, message }),

    notifyInfo: (title, message) => 
      addNotification({ type: 'info', title, message }),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};