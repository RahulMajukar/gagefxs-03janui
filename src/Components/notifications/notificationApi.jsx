import api from '../../api/axios';

const notificationAPI = {
  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  // Get user email for API headers
  getUserEmail: () => {
    try {
      // Try top-level email key first
      const emailFromKey = localStorage.getItem('email');
      if (emailFromKey) return emailFromKey;

      // Fallback to user object
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.email || user?.username || user?.userEmail || '';
    } catch (error) {
      console.warn('Could not get user email:', error);
      return '';
    }
  },

  // Get auth headers with User-Email
  getAuthHeaders: () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const userEmail = notificationAPI.getUserEmail();
    if (userEmail) {
      headers['User-Email'] = userEmail;
    } else {
      console.warn('⚠️ No user email available for API requests');
    }
    
    return headers;
  },

  // ==========================================
  // NOTIFICATION CRUD OPERATIONS
  // ==========================================

  /**
   * Get all user notifications
   */
  getUserNotifications: async () => {
    try {
      const res = await api.get('/notifications', {
        headers: notificationAPI.getAuthHeaders()
      });
      console.log('✅ Fetched user notifications:', res.data.length);
      
      const notificationsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      return notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id,
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('❌ Error fetching user notifications:', error);
      // Handle 404 gracefully - endpoint might not be implemented yet
      if (error.response?.status === 404) {
        console.log('ℹ️ Notifications endpoint not available yet');
        return [];
      }
      throw error;
    }
  },

  /**
   * Get unread notifications only
   */
  getUnreadNotifications: async () => {
    try {
      const res = await api.get('/notifications/unread', {
        headers: notificationAPI.getAuthHeaders()
      });
      console.log('✅ Fetched unread notifications:', res.data.length);
      
      const notificationsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      return notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id,
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('❌ Error fetching unread notifications:', error);
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get notification by ID
   */
  getNotificationById: async (id) => {
    try {
      const res = await api.get(`/notifications/${id}`, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      return {
        ...res.data,
        id: res.data.id || res.data._id,
        timestamp: res.data.timestamp || res.data.createdAt || new Date().toISOString(),
        read: res.data.read || false,
      };
    } catch (error) {
      console.error('❌ Error fetching notification:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}`, { read: true }, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      console.log('✅ Notification marked as read:', id);
      
      return {
        ...res.data,
        id: res.data.id || res.data._id,
        read: true,
      };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const res = await api.patch('/notifications/mark-all-read', {}, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      console.log('✅ All notifications marked as read');
      return res.data;
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      console.log('✅ Notification deleted:', id);
      return res.data;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete all notifications
   */
  deleteAllNotifications: async () => {
    try {
      const res = await api.delete('/notifications', {
        headers: notificationAPI.getAuthHeaders()
      });
      
      console.log('✅ All notifications deleted');
      return res.data;
    } catch (error) {
      console.error('❌ Error deleting all notifications:', error);
      throw error;
    }
  },

  // ==========================================
  // NOTIFICATION SEARCH & FILTER
  // ==========================================

  /**
   * Search notifications
   */
  searchNotifications: async (query) => {
    try {
      const res = await api.get(`/notifications/search?q=${encodeURIComponent(query)}`, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      const notificationsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      return notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id,
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('❌ Error searching notifications:', error);
      throw error;
    }
  },

  /**
   * Get notifications by type
   */
  getNotificationsByType: async (type) => {
    try {
      const res = await api.get(`/notifications/type/${type}`, {
        headers: notificationAPI.getAuthHeaders()
      });
      
      const notificationsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      return notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id,
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('❌ Error fetching notifications by type:', error);
      throw error;
    }
  },

  /**
   * Get notifications by date range
   */
  getNotificationsByDateRange: async (startDate, endDate) => {
    try {
      const res = await api.get(
        `/notifications/date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: notificationAPI.getAuthHeaders() }
      );
      
      const notificationsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      return notificationsData.map(notification => ({
        ...notification,
        id: notification.id || notification._id,
        timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
        read: notification.read || false,
      }));
    } catch (error) {
      console.error('❌ Error fetching notifications by date range:', error);
      throw error;
    }
  },

  // ==========================================
  // NOTIFICATION STATISTICS
  // ==========================================

  /**
   * Get notification statistics
   */
  getNotificationStats: async () => {
    try {
      const res = await api.get('/notifications/stats', {
        headers: notificationAPI.getAuthHeaders()
      });
      
      console.log('✅ Fetched notification stats:', res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Error fetching notification stats:', error);
      if (error.response?.status === 404) {
        return {
          total: 0,
          unread: 0,
          read: 0,
          byType: {}
        };
      }
      throw error;
    }
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread/count', {
        headers: notificationAPI.getAuthHeaders()
      });
      
      return res.data.count || 0;
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      if (error.response?.status === 404) {
        return 0;
      }
      throw error;
    }
  },

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Test API connection
   */
  testConnection: async () => {
    try {
      const res = await api.get('/notifications/health', {
        headers: notificationAPI.getAuthHeaders(),
      });
      console.log('✅ Notification API connection OK:', res.data);
      return res.data;
    } catch (error) {
      console.error('❌ Notification API connection failed:', error);
      if (error.response?.status === 404) {
        console.log('ℹ️ Notifications endpoint not available yet');
        return { status: 'unavailable' };
      }
      throw error;
    }
  },

  /**
   * Set user email explicitly
   */
  setUserEmail: (email) => {
    if (email) {
      try {
        localStorage.setItem('email', email);
        const user = JSON.parse(localStorage.getItem('user')) || {};
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ User email set:', email);
      } catch (error) {
        console.error('Error setting user email:', error);
      }
    }
  },

  /**
   * Debug user state
   */
  debugUserState: () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const email = notificationAPI.getUserEmail();
      console.log('🔍 User debug info:', {
        userFromStorage: user,
        extractedEmail: email,
        headers: notificationAPI.getAuthHeaders()
      });
      return { user, email };
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  },
};

export default notificationAPI;
