// components/context/CalendarContext.js - Simple version without WebSocket dependencies

import { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CalendarContext = createContext();

export function CalendarProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Simple event broadcasting without WebSocket
  const sendEventCreated = (eventData) => {
    console.log('Event created:', eventData);
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('event-created', { 
      detail: { ...eventData, user: user?.email } 
    }));
    toast.success('Event created successfully!');
  };
  
  const sendEventUpdated = (eventData) => {
    console.log('Event updated:', eventData);
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('event-updated', { 
      detail: { ...eventData, user: user?.email } 
    }));
    toast.success('Event updated successfully!');
  };
  
  const sendEventDeleted = (eventData) => {
    console.log('Event deleted:', eventData);
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('event-deleted', { 
      detail: { id: eventData.id, user: user?.email } 
    }));
    toast.success('Event deleted successfully!');
  };
  
  const sendCalendarSync = () => {
    console.log('Calendar sync requested');
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('calendar-sync', { 
      detail: { user: user?.email } 
    }));
    toast.success('Calendar synchronized!');
  };

  // Mock connection status - always connected for simplicity
  const value = {
    isConnected: true,
    connectionStatus: 'connected',
    sendEventCreated,
    sendEventUpdated,
    sendEventDeleted,
    sendCalendarSync,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}