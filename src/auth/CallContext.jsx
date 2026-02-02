import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children, currentUser }) => {
  const socketRef = useRef(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [webSocketConnected, setWebSocketConnected] = useState(false);

  // Global Socket.IO connection
  useEffect(() => {
    if (!currentUser?.username) return;

    console.log("🔌 Setting up global Socket.IO connection for user:", currentUser.username);

    const socketIO = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      query: {
        username: currentUser.username
      },
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketIO.on('connect', () => {
      console.log('✅ Global Socket.IO connected');
      setWebSocketConnected(true);
    });

    socketIO.on('disconnect', () => {
      console.log('🔌 Global Socket.IO disconnected');
      setWebSocketConnected(false);
    });

    // Handle incoming calls from ANY group
    socketIO.on('call_event', (eventData) => {
      console.log('📞 Global call event received:', eventData);
      
      if (eventData.type === 'CALL_STARTED' && eventData.sender !== currentUser.username) {
        console.log('📞 INCOMING CALL from:', eventData.sender, 'in group:', eventData.groupId);
        
        setIncomingCall({
          caller: eventData.sender,
          callerName: eventData.sender,
          groupId: eventData.groupId,
          timestamp: new Date()
        });
        
        // Show browser notification if not in focus
        if (Notification.permission === 'granted') {
          new Notification('Incoming Video Call', {
            body: `${eventData.sender} is calling in group ${eventData.groupId}`,
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
      }
    });

    socketRef.current = socketIO;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUser]);

  // Join a specific group for calls
  const joinCallGroup = (groupId) => {
    if (socketRef.current && socketRef.current.connected && groupId) {
      socketRef.current.emit('join_call_group', {
        groupId: String(groupId),
        username: currentUser.username,
        action: 'JOIN'
      });
      console.log('📤 Joined call group:', groupId);
    }
  };

  // Send call event
  const sendCallEvent = (groupId, type, extraData = {}) => {
    if (socketRef.current && socketRef.current.connected) {
      const messageData = {
        type: String(type),
        sender: currentUser.username,
        groupId: String(groupId),
        timestamp: new Date().toISOString(),
        ...extraData
      };
      
      console.log('📡 Sending global call event:', messageData);
      socketRef.current.emit('call_event', messageData);
      return true;
    }
    return false;
  };

  const value = {
    incomingCall,
    setIncomingCall,
    activeCall,
    setActiveCall,
    webSocketConnected,
    joinCallGroup,
    sendCallEvent,
    socket: socketRef.current
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};