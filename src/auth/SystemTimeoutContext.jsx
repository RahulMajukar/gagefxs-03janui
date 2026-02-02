import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

const SystemTimeoutContext = createContext();

export const SystemTimeoutProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState(15 * 60 * 1000); // 15 minutes default
  const [remainingTime, setRemainingTime] = useState(timeoutDuration);
  const [isPaused, setIsPaused] = useState(false);
  
  // Use refs to avoid dependency issues
  const timeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const currentPathRef = useRef(location.pathname);
  const isAuthenticatedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isPopupVisibleRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated();
    isPausedRef.current = isPaused;
    isPopupVisibleRef.current = isPopupVisible;
  });

  // Check if popup should be visible on mount (persist across refresh)
  useEffect(() => {
    const shouldShowPopup = localStorage.getItem('systemTimeoutPopupVisible');
    if (shouldShowPopup === 'true') {
      setIsPopupVisible(true);
    }
  }, []);

  // Persist popup visibility state
  useEffect(() => {
    if (isPopupVisible) {
      localStorage.setItem('systemTimeoutPopupVisible', 'true');
    } else {
      localStorage.setItem('systemTimeoutPopupVisible', 'false');
    }
  }, [isPopupVisible]);

  // Load saved timeout duration on mount
  useEffect(() => {
    const savedTimeout = localStorage.getItem('systemTimeoutMinutes');
    if (savedTimeout) {
      const minutes = parseFloat(savedTimeout);
      if (!isNaN(minutes) && minutes > 0) {
        const newDuration = minutes * 60 * 1000;
        setTimeoutDuration(newDuration);
        setRemainingTime(newDuration);
      }
    }
  }, []);

  // Handle route changes - only reset timer if path actually changed
  useEffect(() => {
    if (currentPathRef.current !== location.pathname) {
      currentPathRef.current = location.pathname;
      
      // Only reset timer if user is authenticated and not in popup
      if (isAuthenticated() && !isPaused && !isPopupVisible) {
        resetTimer();
      }
    }
  }, [location.pathname]);

  // Reset timer function - use refs to avoid dependency issues
  const resetTimer = useCallback(() => {
    if (!isAuthenticatedRef.current || isPausedRef.current || isPopupVisibleRef.current) {
      return;
    }

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Update last activity
    lastActivityRef.current = Date.now();
    setRemainingTime(timeoutDuration);

    // Start new timeout
    timeoutRef.current = setTimeout(() => {
      if (!isPopupVisibleRef.current) {
        setIsPopupVisible(true);
      }
    }, timeoutDuration);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, [timeoutDuration]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    if (isAuthenticatedRef.current && !isPausedRef.current && !isPopupVisibleRef.current) {
      // Debounce activity - only reset if more than 1 second has passed
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    }
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated()) {
      setIsPopupVisible(false);
      setIsPaused(false);
      setRemainingTime(0);
      
      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    // Only listen to meaningful user interactions (ignore mouse move and scroll)
    const events = ['mousedown', 'keydown', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer setup
    if (!isPopupVisible) {
      resetTimer();
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isAuthenticated, handleUserActivity, resetTimer, isPopupVisible]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setIsPopupVisible(false);
    // Reset timer when popup closes
    setTimeout(() => {
      resetTimer();
    }, 100);
  }, [resetTimer]);

  // Handle timeout settings change
  const updateTimeoutDuration = useCallback((minutes) => {
    const newDuration = minutes * 60 * 1000;
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Update duration
    setTimeoutDuration(newDuration);
    setRemainingTime(newDuration);
    
    // Save to localStorage
    localStorage.setItem('systemTimeoutMinutes', minutes.toString());
    
    // Reset timer with new duration
    if (isAuthenticated() && !isPaused && !isPopupVisible) {
      setTimeout(() => {
        resetTimer();
      }, 100);
    }
  }, [isAuthenticated, isPaused, isPopupVisible, resetTimer]);

  // Pause/resume timeout
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    
    if (isPaused) {
      // Resume timer
      setTimeout(() => {
        resetTimer();
      }, 100);
    } else {
      // Pause timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
  }, [isPaused, resetTimer]);

  // Format remaining time
  const formatRemainingTime = useCallback(() => {
    if (remainingTime <= 0) return '00:00';
    
    const totalSeconds = Math.floor(remainingTime / 1000);
    
    // If less than 1 minute, show only seconds
    if (totalSeconds < 60) {
      return `${totalSeconds.toString().padStart(2, '0')}s`;
    }
    
    // If less than 1 hour, show MM:SS format
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // If 1 hour or more, show HH:MM:SS format
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingTime]);

  const value = {
    isPopupVisible,
    remainingTime: formatRemainingTime(),
    timeoutDuration: timeoutDuration / 60000, // in minutes
    isPaused,
    handlePopupClose,
    updateTimeoutDuration,
    togglePause
  };

  return (
    <SystemTimeoutContext.Provider value={value}>
      {children}
    </SystemTimeoutContext.Provider>
  );
};

export const useSystemTimeout = () => {
  const context = useContext(SystemTimeoutContext);
  if (!context) {
    throw new Error('useSystemTimeout must be used within a SystemTimeoutProvider');
  }
  return context;
};
