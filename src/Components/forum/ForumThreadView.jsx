import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  RefreshCw,
  AlertCircle,
  Activity,
  User,
  VideoIcon,
  Phone,
  ArrowLeft,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Signal,
  Circle,
  Users,
  Volume2,
  MessageCircle,
  MoreVertical,
  Clock,
  Pin
} from "lucide-react";
import ThreadCard from "./ThreadCard";
import ThreadComposer from "./ThreadComposer";
import { fetchGroupThreads, createForumPost, sendCallNotification, checkActiveCalls } from "../../api/api";
import { useSFU } from "./useSFU";
import VideoCallModal from "./VideoCallModal";
import AudioCallModal from "./AudioCallModal";

// Global instance tracker
const activeForumInstances = new Map();

// Optimized user cache
const userCache = new Map();

export default function ForumThreadView({
  groupId,
  groupName,
  isInDrawer = false,
  setForumDrawerOpen,
  username,
  currentUser,
  allUsers,
  onBack,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);

  // Enhanced connection state tracking
  const [connectionState, setConnectionState] = useState({
    mediasoup: 'disconnected',
    chat: 'disconnected',
    lastAttempt: null,
    retryCount: 0
  });

  // Unified call state
  const [callState, setCallState] = useState('idle');
  const [callerName, setCallerName] = useState('');
  const [callerId, setCallerId] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCallType, setCurrentCallType] = useState('video');

  // 🔍 Enhanced Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [highlightedMatches, setHighlightedMatches] = useState([]);

  // 👥 Enhanced Group members and individual call state
  const [groupMembers, setGroupMembers] = useState([]);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showParticipantsSidebar, setShowParticipantsSidebar] = useState(false);
  const [individualCallState, setIndividualCallState] = useState({
    isIncoming: false,
    isOutgoing: false,
    targetUser: null,
    caller: null,
    callerName: '',
    callId: null,
    callType: 'video'
  });

  // 📱 Enhanced UI states
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState(null);

  const postsEndRef = useRef(null);
  const pollingRef = useRef(null);
  const lastPostCountRef = useRef(0);
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const mountedRef = useRef(false);
  const connectionRetryRef = useRef(null);
  const initializationRef = useRef(false);
  const userCacheRef = useRef(new Map());
  const typingTimeoutRef = useRef(null);

  const {
    localStream,
    remoteStreams,
    isInCall,
    isAdmin,
    mediasoupConnected,
    cameraError,
    participants,
    connectionAttempts,
    joinCall,
    endCall,
    sendMediasoupMessage,
    manuallyConnect,
    manuallyDisconnect,
    setOnCallEvent,
    callType: sfuCallType,
    connectionHealth
  } = useSFU(groupId, username);

  // ✅ FIXED: Define handleCallEnded first to avoid reference error
  // ✅ ENHANCED: Call ended handler with complete cleanup
  const handleCallEnded = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.log('📞 [FORUM] Handling call ended with complete cleanup');
    setCallState('idle');
    setCallerName('');
    setCallerId('');
    setIncomingCall(null);
    setCurrentCallType('video');
    setActiveUsers([]);
  }, []);

  // ✅ OPTIMIZED: Stable component lifecycle management
  useEffect(() => {
    mountedRef.current = true;
    const instanceId = instanceIdRef.current;
    
    console.log('🔍 [FORUM] Component mounted:', { 
      instanceId, 
      groupId, 
      username,
      existingInstances: activeForumInstances.size
    });

    // Prevent duplicate initialization
    if (initializationRef.current) {
      console.log('⏸️ [FORUM] Skipping duplicate initialization');
      return;
    }
    initializationRef.current = true;

    // Track this instance
    activeForumInstances.set(instanceId, {
      groupId,
      username,
      mountedAt: new Date().toISOString()
    });

    return () => {
      console.log('🔍 [FORUM] Component unmounted:', instanceId);
      mountedRef.current = false;
      initializationRef.current = false;
      
      // Cleanup all intervals and timeouts
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
        connectionRetryRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      setIsChatConnected(false);
      activeForumInstances.delete(instanceId);
    };
  }, [groupId, username]);

  // ✅ OPTIMIZED: Enhanced connection state monitoring
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const newState = {
      mediasoup: mediasoupConnected ? 'connected' : 'disconnected',
      chat: isChatConnected ? 'connected' : 'disconnected',
      lastAttempt: new Date().toISOString(),
      retryCount: connectionAttempts
    };
    
    setConnectionState(prev => ({
      ...prev,
      ...newState
    }));
    
    console.log('📊 [FORUM] Connection state:', {
      mediasoupConnected,
      connectionAttempts,
      isInCall,
      participantsCount: participants.length,
      callState,
      instanceId: instanceIdRef.current,
      connectionHealth
    });
  }, [mediasoupConnected, connectionAttempts, isInCall, participants, callState, isChatConnected, connectionHealth]);

  // ✅ OPTIMIZED: User cache management
  const getUserFromCache = useCallback((userId) => {
    if (!userId) return null;
    
    // Check local cache first
    if (userCacheRef.current.has(userId)) {
      return userCacheRef.current.get(userId);
    }
    
    // Check global cache
    if (userCache.has(userId)) {
      const user = userCache.get(userId);
      userCacheRef.current.set(userId, user);
      return user;
    }
    
    // Find in allUsers
    const user = allUsers?.find(u => 
      u.email === userId || u.username === userId || u.id === userId
    );
    
    if (user) {
      userCacheRef.current.set(userId, user);
      userCache.set(userId, user);
    }
    
    return user;
  }, [allUsers]);

  const getDisplayName = useCallback((userId) => {
    if (userId === username) return 'You';
    
    const user = getUserFromCache(userId);
    if (user) {
      return `${user.firstName} ${user.lastName}`.trim() || user.username || user.email;
    }
    return userId;
  }, [getUserFromCache, username]);

  const getProfileImage = useCallback((userId) => {
    if (userId === username) return currentUser?.profileImage || null;
    
    const user = getUserFromCache(userId);
    return user?.profileImage || null;
  }, [getUserFromCache, username, currentUser]);

  // ✅ OPTIMIZED: Fetch group members with enhanced caching
  const fetchGroupMembers = useCallback(async () => {
    if (!groupId || !allUsers) return;
    
    try {
      console.log('👥 [FORUM] Fetching group members...');
      
      // Use cached data if available
      const cacheKey = `group-members-${groupId}`;
      const cachedMembers = sessionStorage.getItem(cacheKey);
      
      if (cachedMembers) {
        const members = JSON.parse(cachedMembers);
        setGroupMembers(members);
        
        // Update online users
        const online = members.filter(m => m.isOnline);
        setOnlineUsers(online);
        console.log('👥 [FORUM] Using cached group members:', members.length, 'online:', online.length);
        return;
      }

      // Simulate API call with enhanced user data
      const members = allUsers
        .filter(user => user.username !== username)
        .map(user => ({
          ...user,
          id: user.id || user.username,
          isOnline: Math.random() > 0.3,
          lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          role: Math.random() > 0.8 ? 'admin' : 'member',
          status: Math.random() > 0.7 ? 'active' : 'idle'
        }))
        .sort((a, b) => {
          // Sort by online status first, then by name
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
          return a.firstName?.localeCompare(b.firstName) || 0;
        });
      
      setGroupMembers(members);
      
      // Update online users
      const online = members.filter(m => m.isOnline);
      setOnlineUsers(online);
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify(members));
      console.log('✅ [FORUM] Group members fetched and cached:', members.length, 'online:', online.length);
      
    } catch (error) {
      console.error('❌ [FORUM] Failed to fetch group members:', error);
    }
  }, [groupId, allUsers, username]);

  // ✅ FIXED: Handle individual video/audio call with proper callType propagation
  const handleIndividualCall = async (targetUser, callType = 'video') => {
    if (!mountedRef.current) return;
    try {
      console.log('📞 [FORUM] Starting individual call to:', targetUser.username, 'Type:', callType);
      
      // Generate a unique call ID
      const callId = `${groupId}-${username}-${targetUser.username}-${Date.now()}`;
      
      // Set individual call state
      setIndividualCallState({
        isIncoming: false,
        isOutgoing: true,
        targetUser: targetUser,
        caller: username,
        callerName: currentUser?.firstName + ' ' + currentUser?.lastName || username,
        callId: callId,
        callType: callType
      });
      
      // Send call notification via HTTP
      await sendCallNotification(
        groupId,
        'INDIVIDUAL_CALL_STARTED',
        username,
        currentUser?.firstName + ' ' + currentUser?.lastName || username,
        targetUser.username,
        callType
      );
      
      // ALSO send via WebSocket for immediate delivery
      sendMediasoupMessage('INDIVIDUAL_CALL_STARTED', {
        callId: callId,
        targetUser: targetUser.username,
        callType: callType,
        callerName: currentUser?.firstName + ' ' + currentUser?.lastName || username
      });
      
      console.log('✅ [FORUM] Individual call notification sent via both HTTP and WebSocket');
    } catch (error) {
      console.error('❌ [FORUM] Failed to start individual call:', error);
      alert('Failed to start individual call. Please try again.');
      // Reset individual call state on error
      setIndividualCallState({
        isIncoming: false,
        isOutgoing: false,
        targetUser: null,
        caller: null,
        callerName: '',
        callId: null,
        callType: 'video'
      });
    }
  };

  // ✅ ENHANCED: Handle incoming individual call
  const handleIncomingIndividualCall = useCallback((data) => {
    if (!mountedRef.current || individualCallState.isOutgoing) return;
    
    console.log('📞 [FORUM] Incoming individual call:', data);
    
    if (data.targetUser === username && data.action === 'INDIVIDUAL_CALL_STARTED') {
      setIndividualCallState({
        isIncoming: true,
        isOutgoing: false,
        targetUser: null,
        caller: data.caller,
        callerName: data.callerName,
        callId: data.callId,
        callType: data.callType || 'video'
      });
    }
  }, [username, individualCallState.isOutgoing]);

  // ✅ ENHANCED: Accept individual call
  const handleAcceptIndividualCall = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('✅ [FORUM] Accepting individual call from:', individualCallState.callerName, 'Type:', individualCallState.callType);
      
      // Send acceptance via WebSocket (faster than HTTP)
      sendMediasoupMessage('INDIVIDUAL_CALL_RESPONSE', {
        callId: individualCallState.callId,
        action: 'accepted',
        targetUser: individualCallState.caller,
        callType: individualCallState.callType // Include callType in response
      });

      // Also send HTTP notification for reliability
      await sendCallNotification(
        groupId,
        'INDIVIDUAL_CALL_ACCEPTED',
        username,
        currentUser?.firstName + ' ' + currentUser?.lastName || username,
        individualCallState.caller,
        individualCallState.callType // Include callType
      );

      // Start the actual call using existing group call infrastructure
      await handleStartCall(false, individualCallState.callType);

      // Reset individual call state
      setIndividualCallState({
        isIncoming: false,
        isOutgoing: false,
        targetUser: null,
        caller: null,
        callerName: '',
        callId: null,
        callType: 'video'
      });

    } catch (error) {
      console.error('❌ [FORUM] Failed to accept individual call:', error);
      alert('Failed to accept individual call. Please try again.');
    }
  };

  // ✅ ENHANCED: Decline individual call
  const handleDeclineIndividualCall = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('❌ [FORUM] Declining individual call from:', individualCallState.callerName);
      
      // Send decline via WebSocket
      sendMediasoupMessage('INDIVIDUAL_CALL_RESPONSE', {
        callId: individualCallState.callId,
        action: 'declined',
        targetUser: individualCallState.caller
      });

      // Also send HTTP notification
      await sendCallNotification(
        groupId,
        'INDIVIDUAL_CALL_DECLINED',
        username,
        currentUser?.firstName + ' ' + currentUser?.lastName || username,
        individualCallState.caller
      );

      // Reset individual call state
      setIndividualCallState({
        isIncoming: false,
        isOutgoing: false,
        targetUser: null,
        caller: null,
        callerName: '',
        callId: null,
        callType: 'video'
      });

    } catch (error) {
      console.error('❌ [FORUM] Failed to decline individual call:', error);
    }
  };

  // ✅ ENHANCED: Cancel outgoing individual call
  const handleCancelIndividualCall = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('📞 [FORUM] Canceling individual call to:', individualCallState.targetUser?.username);
      
      // Send cancel via WebSocket
      sendMediasoupMessage('INDIVIDUAL_CALL_RESPONSE', {
        callId: individualCallState.callId,
        action: 'canceled',
        targetUser: individualCallState.targetUser?.username
      });

      // Also send HTTP notification
      await sendCallNotification(
        groupId,
        'INDIVIDUAL_CALL_CANCELED',
        username,
        currentUser?.firstName + ' ' + currentUser?.lastName || username,
        individualCallState.targetUser?.username
      );

      // Reset individual call state
      setIndividualCallState({
        isIncoming: false,
        isOutgoing: false,
        targetUser: null,
        caller: null,
        callerName: '',
        callId: null,
        callType: 'video'
      });

    } catch (error) {
      console.error('❌ [FORUM] Failed to cancel individual call:', error);
    }
  };

  // ✅ ENHANCED: Poll for call notifications with caching
  const startCallNotificationPolling = useCallback(() => {
    if (!mountedRef.current || !groupId) return;
    
    let lastPollTime = 0;
    const POLL_INTERVAL = 5000;
    
    const pollCallNotifications = async () => {
      const now = Date.now();
      if (now - lastPollTime < POLL_INTERVAL) return;
      lastPollTime = now;
      
      try {
        const activeCalls = await checkActiveCalls(groupId);
        
        if (activeCalls && Array.isArray(activeCalls)) {
          activeCalls.forEach(call => {
            if (call.targetUser === username && call.action === 'INDIVIDUAL_CALL_STARTED') {
              handleIncomingIndividualCall(call);
            }
          });
        }
      } catch (error) {
        console.error('❌ [FORUM] Call notification polling error:', error);
      }
    };

    const notificationInterval = setInterval(pollCallNotifications, POLL_INTERVAL);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, [groupId, username, handleIncomingIndividualCall]);

  // ✅ ENHANCED: Stable event callback setup with complete call handling
  useEffect(() => {
    if (!setOnCallEvent || !mountedRef.current) return;
    
    console.log('✅ [FORUM] Setting up enhanced call event callback');
    
    const handleCallEvent = (data) => {
      if (!mountedRef.current) return;
      
      console.log('🎯 [FORUM] Call event received:', data.type, 'from:', data.sender, 'callType:', data.callType);
      
      const { type, sender, groupId: eventGroupId, payload, callType } = data;
      
      // Only process events for our group
      if (eventGroupId && String(eventGroupId) !== String(groupId)) {
        return;
      }
      
      switch (type) {
        case 'CALL_STARTED':
          console.log('📞 [FORUM] INCOMING GROUP CALL from:', sender, 'Type:', payload?.callType);
          if (callState === 'idle' && !isInCall) {
            setCallState('ringing');
            setCallerName(payload?.callerName || sender);
            setCallerId(sender);
            setCurrentCallType(payload?.callType || 'video');
            setIncomingCall({
              caller: sender,
              callerName: payload?.callerName || sender,
              groupId: groupId,
              callType: payload?.callType || 'video'
            });
          }
          break;
          
        case 'USER_JOINED_CALL':
          console.log('👥 [FORUM] User joined call:', sender);
          // Update active users
          setActiveUsers(prev => {
            if (!prev.includes(sender)) {
              return [...prev, sender];
            }
            return prev;
          });
          break;

        case 'USER_LEFT_CALL':
          console.log('👤 [FORUM] User left call:', sender, 'reason:', payload?.reason);
          // Remove from active users
          setActiveUsers(prev => prev.filter(user => user !== sender));
          
          // Show notification
          if (payload?.userName) {
            console.log(`ℹ️ ${payload.userName} left the call`);
          }
          break;
          
        case 'CALL_ENDED':
          console.log('📞 [FORUM] Call ended by:', sender, 'reason:', payload?.reason);
          handleCallEnded();
          
          // Clear active users
          setActiveUsers([]);
          
          // Show call ended message
          if (payload?.reason === 'empty_call') {
            console.log('ℹ️ Call ended because no participants left');
          } else if (sender !== username) {
            console.log(`ℹ️ Call was ended by ${sender}`);
          }
          break;

        case 'NEW_PRODUCER':
          console.log('🎬 [FORUM] New producer from:', sender);
          break;
          
        // Handle individual call incoming via WebSocket
        case 'INDIVIDUAL_CALL_INCOMING':
          console.log('📞 [FORUM] INCOMING INDIVIDUAL CALL from:', data.callerName, 'Type:', data.callType);
          if (!individualCallState.isOutgoing && !isInCall) {
            setIndividualCallState({
              isIncoming: true,
              isOutgoing: false,
              targetUser: null,
              caller: data.caller,
              callerName: data.callerName,
              callId: data.callId,
              callType: data.callType || 'video'
            });
          }
          break;
          
        case 'INDIVIDUAL_CALL_STARTED':
          console.log('📞 [FORUM] Individual call started notification:', data);
          if (data.targetUser === username && !individualCallState.isOutgoing && !isInCall) {
            setIndividualCallState({
              isIncoming: true,
              isOutgoing: false,
              targetUser: null,
              caller: data.caller || sender,
              callerName: data.callerName,
              callId: data.callId,
              callType: data.callType || 'video'
            });
          }
          break;
          
        case 'INDIVIDUAL_CALL_ACCEPTED':
          console.log('✅ [FORUM] Individual call accepted by:', data.sender, 'Type:', data.callType);
          if (individualCallState.isOutgoing) {
            setIndividualCallState(prev => ({
              ...prev,
              isOutgoing: false
            }));
            // Use callType from the acceptance message
            const callTypeToUse = data.callType || individualCallState.callType || 'video';
            console.log('📞 [FORUM] Starting call with type:', callTypeToUse);
            handleStartCall(false, callTypeToUse);
          }
          break;
          
        case 'INDIVIDUAL_CALL_DECLINED':
          console.log('❌ [FORUM] Individual call declined by:', data.sender);
          if (individualCallState.isOutgoing) {
            alert(`${data.sender} declined your ${individualCallState.callType} call`);
            setIndividualCallState({
              isIncoming: false,
              isOutgoing: false,
              targetUser: null,
              caller: null,
              callerName: '',
              callId: null,
              callType: 'video'
            });
          }
          break;
          
        case 'INDIVIDUAL_CALL_CANCELED':
          console.log('📞 [FORUM] Individual call canceled by:', data.caller);
          if (individualCallState.isIncoming) {
            setIndividualCallState({
              isIncoming: false,
              isOutgoing: false,
              targetUser: null,
              caller: null,
              callerName: '',
              callId: null,
              callType: 'video'
            });
          }
          break;
          
        default:
          console.log('📞 [FORUM] Unknown event:', type);
      }
    };

    setOnCallEvent(handleCallEvent);
    
    return () => {
      if (mountedRef.current && setOnCallEvent) {
        console.log('🧹 [FORUM] Cleaning up call callback');
        setOnCallEvent(null);
      }
    };
  }, [setOnCallEvent, groupId, callState, isInCall, individualCallState, username, handleCallEnded]);

  // ✅ ENHANCED: Call state synchronization
  useEffect(() => {
    if (!mountedRef.current) return;
    
    console.log('📞 [FORUM] Call state sync:', { 
      isInCall, 
      callState, 
      participantsCount: participants.length 
    });
    
    if (isInCall && callState !== 'connected') {
      setCallState('connected');
      console.log('✅ [FORUM] Call state updated to connected');
    } else if (!isInCall && (callState === 'connected' || callState === 'calling')) {
      console.log('🔄 [FORUM] Resetting call state because we left call');
      handleCallEnded();
    }
  }, [isInCall, callState, participants.length, handleCallEnded]);

  // ✅ ENHANCED: Initialize group members and call notification polling
  useEffect(() => {
    if (!mountedRef.current) return;
    
    fetchGroupMembers();
    const cleanupPolling = startCallNotificationPolling();
    
    return () => {
      if (cleanupPolling) cleanupPolling();
    };
  }, [fetchGroupMembers, startCallNotificationPolling]);

  // 🔍 ENHANCED: Search function with memoization
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setFilteredPosts([]);
      setSearchResultsCount(0);
      setCurrentResultIndex(-1);
      setHighlightedMatches([]);
      return;
    }

    const matches = [];
    const filtered = posts.map(post => {
      const contentMatches = [];
      const regex = new RegExp(`(${query})`, 'gi');
      const content = post.content || '';
      let match;
      let lastIndex = 0;
      let highlightedContent = '';
      let matchCount = 0;

      while ((match = regex.exec(content)) !== null) {
        highlightedContent += content.substring(lastIndex, match.index);
        highlightedContent += `<mark class="bg-yellow-200">${match[0]}</mark>`;
        lastIndex = regex.lastIndex;
        contentMatches.push({
          postId: post.id,
          index: matchCount,
          type: 'content',
          text: match[0],
          position: match.index
        });
        matchCount++;
      }
      highlightedContent += content.substring(lastIndex);

      const authorMatches = [];
      const author = post.createdByName || '';
      let authorMatch;
      let lastAuthorIndex = 0;
      let highlightedAuthor = '';
      let authorMatchCount = 0;

      while ((authorMatch = regex.exec(author)) !== null) {
        highlightedAuthor += author.substring(lastAuthorIndex, authorMatch.index);
        highlightedAuthor += `<mark class="bg-yellow-200">${authorMatch[0]}</mark>`;
        lastAuthorIndex = regex.lastIndex;
        authorMatches.push({
          postId: post.id,
          index: authorMatchCount,
          type: 'author',
          text: authorMatch[0],
          position: authorMatch.index
        });
        authorMatchCount++;
      }
      highlightedAuthor += author.substring(lastAuthorIndex);

      matches.push(...contentMatches, ...authorMatches);

      return {
        ...post,
        highlightedContent,
        highlightedAuthor
      };
    }).filter(post => 
      (post.highlightedContent !== post.content) || 
      (post.highlightedAuthor !== post.createdByName)
    );

    setFilteredPosts(filtered);
    setSearchResultsCount(matches.length);
    setCurrentResultIndex(-1);
    setHighlightedMatches(matches);
  }, [posts]);

  // 🔍 ENHANCED: Handle search input change with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        handleSearch(query);
      }
    }, 300);
  };

  // 🔍 ENHANCED: Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPosts([]);
    setSearchResultsCount(0);
    setCurrentResultIndex(-1);
    setHighlightedMatches([]);
    setIsSearching(false);
  };

  // 🔍 ENHANCED: Toggle search mode
  const toggleSearch = () => {
    if (isSearching) {
      clearSearch();
    }
    setIsSearching(!isSearching);
  };

  // 🔍 ENHANCED: Navigate search results
  const navigateSearchResults = (direction) => {
    if (highlightedMatches.length === 0) return;
    
    let newIndex = currentResultIndex;
    
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % highlightedMatches.length;
    } else if (direction === 'prev') {
      newIndex = currentResultIndex === 0 
        ? highlightedMatches.length - 1 
        : currentResultIndex - 1;
    }
    
    setCurrentResultIndex(newIndex);
    
    const match = highlightedMatches[newIndex];
    const postElement = document.getElementById(`post-${match.postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        postElement.classList.remove('ring-2', 'ring-blue-500');
      }, 1000);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isSearching || !searchQuery) return;
      
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigateSearchResults('next');
      } else if (e.key === 'Enter' && (e.shiftKey && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        navigateSearchResults('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearching, searchQuery, currentResultIndex, highlightedMatches]);

  // ✅ OPTIMIZED: Polling with caching
  const startPolling = useCallback(() => {
    if (!mountedRef.current || !groupId) return;
    
    console.log("🔄 [FORUM] Starting optimized real-time polling...");
    setIsChatConnected(true);
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    let lastFetchTime = 0;
    const POLL_INTERVAL = 4000;

    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current || !groupId) return;
      
      const now = Date.now();
      if (now - lastFetchTime < POLL_INTERVAL) return;
      lastFetchTime = now;
      
      try {
        const newPosts = await fetchGroupThreads(groupId);
        if (newPosts && Array.isArray(newPosts) && mountedRef.current) {
          setPosts(prevPosts => {
            if (newPosts.length !== lastPostCountRef.current) {
              lastPostCountRef.current = newPosts.length;
              
              const enriched = newPosts.map(post => {
                const user = getUserFromCache(post.createdBy);
                const name = user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user?.firstName || user?.lastName || post.createdBy;
                
                return {
                  ...post,
                  createdByProfileImage: user?.profileImage || "",
                  createdByName: name,
                };
              });

              const sorted = [...enriched].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
              );
              return sorted;
            }
            return prevPosts;
          });
        }
      } catch (err) {
        console.log("❌ [FORUM] Polling error:", err);
        if (mountedRef.current) {
          setIsChatConnected(false);
        }
      }
    }, POLL_INTERVAL);
  }, [groupId, getUserFromCache]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (mountedRef.current) {
      setIsChatConnected(false);
    }
  }, []);

  const loadPosts = async () => {
    if (!groupId || !mountedRef.current) return;
    try {
      setLoading(true);
      const data = await fetchGroupThreads(groupId);
      
      if (!mountedRef.current) return;
      
      const enriched = data.map(post => {
        const user = getUserFromCache(post.createdBy);
        const name = user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user?.firstName || user?.lastName || post.createdBy;
        
        return {
          ...post,
          createdByProfileImage: user?.profileImage || "",
          createdByName: name,
        };
      });

      const sorted = [...enriched].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setPosts(sorted);
      lastPostCountRef.current = sorted.length;
      setError(null);
      
      // Update unread count
      setUnreadCount(0);
      setLastSeen(new Date().toISOString());
    } catch (err) {
      if (mountedRef.current) {
        setError("Failed to load chat.");
        setIsChatConnected(false);
      }
      console.error("❌ [FORUM] Load posts error:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // ✅ FIXED: Optimized connection initialization
  useEffect(() => {
    if (!mountedRef.current || !groupId) return;

    console.log('🔗 [FORUM] Auto-connecting to Mediasoup...');
    
    // ✅ FIXED: Longer delay before initial connection
    const connectTimer = setTimeout(() => {
      if (mountedRef.current) {
        manuallyConnect();
      }
    }, 3000); // Increased from 1500ms to 3000ms

    return () => {
      clearTimeout(connectTimer);
    };
  }, [groupId, username, manuallyConnect]);

  // ✅ FIXED: Less aggressive reconnection
  useEffect(() => {
    if (!mountedRef.current) return;

    console.log('📊 [FORUM] Connection state updated:', {
      mediasoupConnected,
      connectionStatus: connectionState.mediasoup,
      connectionAttempts: connectionAttempts,
      isInCall
    });

    // ✅ FIXED: Only auto-reconnect if truly disconnected for a while
    if (!mediasoupConnected && 
        connectionState.mediasoup === 'disconnected' && 
        connectionAttempts === 0 &&
        mountedRef.current) {
      
      console.log('🔄 [FORUM] Auto-initiating reconnection...');
      const reconnectTimer = setTimeout(() => {
        if (mountedRef.current && !mediasoupConnected) {
          manuallyConnect();
        }
      }, 5000); // Increased from 3000ms to 5000ms

      return () => clearTimeout(reconnectTimer);
    }
  }, [mediasoupConnected, connectionState.mediasoup, connectionAttempts, isInCall, manuallyConnect]);

  // ✅ ENHANCED: Stable initialization
  useEffect(() => {
    if (!mountedRef.current || !groupId) return;
    
    console.log('🚀 [FORUM] Initializing forum with all features...');
    
    const initializeForum = async () => {
      try {
        await loadPosts();
        startPolling();
        
        // Initial Mediasoup connection with delay
        setTimeout(() => {
          if (mountedRef.current && !mediasoupConnected) {
            console.log('🔄 [FORUM] Initial Mediasoup connection attempt');
            manuallyConnect();
          }
        }, 2000);
      } catch (error) {
        console.error('❌ [FORUM] Initialization failed:', error);
      }
    };

    initializeForum();

    return () => {
      stopPolling();
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
    };
  }, [groupId]);

  useEffect(() => {
    if (mountedRef.current) {
      const container = document.querySelector(".chat-messages");
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [posts, isInDrawer]);

  const handleNewPost = async (newPostData) => {
    if (!mountedRef.current) return;
    
    try {
      const res = await createForumPost(groupId, {
        content: newPostData.content,
        createdBy: username,
        messageType: newPostData.messageType || "TEXT",
        attachments: newPostData.attachments || [],
      });
      
      const user = getUserFromCache(username);
      const name = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user?.firstName || user?.lastName || username;
      
      if (mountedRef.current) {
        setPosts(prev => [...prev, {
          ...res,
          createdByProfileImage: user?.profileImage || "",
          createdByName: name,
          optimistic: true,
        }]);
      }

      console.log("✅ [FORUM] Message sent via HTTP");

    } catch (httpErr) {
      console.error("❌ [FORUM] HTTP send failed:", httpErr);
      alert("Failed to send message. Please try again.");
    }
  };

  // ✅ ENHANCED: Start call with complete state management
  const handleStartCall = async (asAdmin = true, callType = 'video') => {
    if (!mountedRef.current) return;
    
    try {
      console.log("🎥 [FORUM] Starting call...", { asAdmin, callType });
      
      if (!mediasoupConnected) {
        console.log('🔄 [FORUM] Connecting to Mediasoup first...');
        manuallyConnect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCallState('calling');
      setCallerName('You');
      setCallerId(username);
      setCurrentCallType(callType);
      
      // Send call notification with call type
      sendMediasoupMessage('CALL_STARTED', {
        callerName: currentUser?.firstName + ' ' + currentUser?.lastName || username,
        callerId: username,
        callType: callType
      });
      
      console.log('📢 [FORUM] Call notification sent for:', callType);
      
      // Join the call with specific type
      await joinCall(asAdmin, callType);
      
      console.log("✅ [FORUM] Call started successfully:", callType);
      
    } catch (error) {
      console.error("❌ [FORUM] Failed to start call:", error);
      
      if (mountedRef.current) {
        handleCallEnded();
      }
      
      alert(`${callType === 'video' ? 'Video' : 'Audio'} call failed: ${error.message || "Please check your media permissions"}`);
      sendMediasoupMessage('CALL_ENDED');
    }
  };

  // ✅ ENHANCED: Accept call
  const handleAcceptCall = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('🎥 [FORUM] Accepting call from:', callerName, 'Type:', currentCallType);
      
      setIncomingCall(null);
      setCallState('connecting');
      
      await joinCall(false, currentCallType);
      
      console.log("✅ [FORUM] Joined call successfully:", currentCallType);
      
    } catch (error) {
      console.error("❌ [FORUM] Failed to join call:", error);
      
      let errorMessage = "Failed to join call";
      if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is busy. Please close other applications using your microphone and try again.";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone permission denied. Please allow access in your browser settings.";
      }
      
      alert(errorMessage);
      handleCallEnded();
    }
  };

  const handleJoinCall = async () => {
    if (!mountedRef.current) return;
    
    try {
      console.log('🎥 [FORUM] Joining existing call...');
      
      setCallState('connecting');
      
      sendMediasoupMessage('USER_JOINED_CALL', {
        callType: currentCallType
      });
      
      await joinCall(false, currentCallType);
      
      console.log("✅ [FORUM] Joined existing call successfully");
      
    } catch (error) {
      console.error("❌ [FORUM] Failed to join call:", error);
      alert("Failed to join call: " + (error.message || "Please check your media permissions"));
      handleCallEnded();
    }
  };

  const handleDeclineCall = async () => {
    console.log('📞 [FORUM] Declining call from:', callerName);
    handleCallEnded();
  };

  const handleEndCall = async () => {
    console.log('📞 [FORUM] Ending call...');
    sendMediasoupMessage('CALL_ENDED');
    endCall();
    handleCallEnded();
  };

  // ✅ ENHANCED: Manual reconnect
  const handleManualReconnect = async () => {
    if (!mountedRef.current) return;
    
    console.log('🔄 [FORUM] Manual reconnect triggered');
    
    try {
      setConnectionState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
      
      manuallyConnect();
      
      if (!isChatConnected) {
        startPolling();
      }
      
      console.log('✅ [FORUM] Manual reconnect completed');
      
    } catch (error) {
      console.error('❌ [FORUM] Manual reconnect failed:', error);
      alert('Reconnect failed. Please check your internet connection.');
    }
  };

  const handleTypingStart = () => {
    if (mountedRef.current) {
      setIsTyping(true);
    }
  };

  const handleTypingEnd = () => {
    if (mountedRef.current) {
      setIsTyping(false);
    }
  };

  const retrySend = (failedPost) => {
    handleNewPost({
      content: failedPost.content,
      messageType: failedPost.messageType,
      attachments: failedPost.attachments,
    });
  };

  const manualRefresh = () => {
    if (mountedRef.current) {
      loadPosts();
    }
  };

  // 👥 ENHANCED: Toggle members sidebar
  const toggleMembersSidebar = () => {
    setShowMembersSidebar(!showMembersSidebar);
  };

  // 👥 ENHANCED: Toggle participants sidebar
  const toggleParticipantsSidebar = () => {
    setShowParticipantsSidebar(!showParticipantsSidebar);
  };

  // ✅ ENHANCED: Status indicator
  const StatusIndicator = () => (
    <div className="flex items-center gap-4">
      {/* Mediasoup WebSocket Status */}
       <div className="flex items-center gap-1">
        {mediasoupConnected ? (
          <Signal size={16} className="text-green-500" />
        ) : (
          <Signal size={16} className="text-white-500 opacity-50" />
        )}
         {/* <span className={`text-xs ${mediasoupConnected ? 'text-green-600' : 'text-red-600'}`}>
          {mediasoupConnected ? 'Call Ready' : 'Call Offline'}
        </span>  */}
       </div> 
    </div>
  );

  // 🔍 ENHANCED: Search Bar Component
  const SearchBar = () => (
    <div className="px-3 py-2 border-b bg-white flex items-center gap-2">
      <Search size={16} className="text-gray-500" />
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search messages..."
        className="flex-1 outline-none text-sm"
        autoFocus
      />
      {searchQuery && (
        <div className="text-xs text-gray-500">
          {currentResultIndex + 1} / {searchResultsCount}
        </div>
      )}
      <button 
        onClick={() => navigateSearchResults('prev')}
        disabled={searchResultsCount === 0}
        className={`p-1 rounded-full ${searchResultsCount === 0 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
        title="Previous result (Ctrl+Shift+Enter)"
      >
        <ChevronUp size={16} />
      </button>
      <button 
        onClick={() => navigateSearchResults('next')}
        disabled={searchResultsCount === 0}
        className={`p-1 rounded-full ${searchResultsCount === 0 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
        title="Next result (Ctrl+Enter)"
      >
        <ChevronDown size={16} />
      </button>
      <button 
        onClick={clearSearch}
        className="p-1 hover:bg-gray-100 rounded-full"
      >
        <X size={16} />
      </button>
    </div>
  );

  // 👥 ENHANCED: Group Members Sidebar Component
  const GroupMembersSidebar = useMemo(() => {
    const MemberItem = ({ member }) => (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors">
        <div className="flex items-center gap-3">
          {/* Profile Image */}
          {member.profileImage ? (
            <img
              src={member.profileImage}
              alt={member.firstName}
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
          )}
          
          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{member.username}</p>
            </div>
          </div>
        </div>

        {/* Call Buttons */}
        <div className="flex gap-1">
          {/* <button
            onClick={() => handleIndividualCall(member, 'audio')}
            className='text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors'
              title="voice call"
            
          >
            <Phone size={16} />
          </button> */}
          {/* <button
            onClick={() => handleIndividualCall(member, 'video')}
            className='text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors'
            title="video call"
          >
            <VideoIcon size={16} />
          </button> */}
        </div>
      </div>
    );

    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Group Members</h3>
            <button
              onClick={toggleMembersSidebar}
              className="p-1 hover:bg-gray-100 rounded-full"
              title="Close"
            >
              <X size={16}  />
              
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {groupMembers.length} members 
          </p>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto">
          {groupMembers.map((member) => (
            <MemberItem key={member.username} member={member} />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Click call buttons to start individual calls
          </div>
        </div>
      </div>
    );
  }, [groupMembers, onlineUsers, individualCallState.isOutgoing, handleIndividualCall, toggleMembersSidebar]);

  // 👥 ENHANCED: Individual Call Modal
  const IndividualCallModal = () => {
    if (!individualCallState.isIncoming && !individualCallState.isOutgoing) return null;

    const isVideoCall = individualCallState.callType === 'video';
    const callIcon = isVideoCall ? 
      <VideoIcon className="text-blue-600" size={32} /> : 
      <Phone className="text-blue-600" size={32} />;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-2xl">
          {/* Call Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {callIcon}
          </div>
          
          {/* Call Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {individualCallState.isIncoming ? 
              `Incoming ${isVideoCall ? 'Video' : 'Audio'} Call` : 
              `Calling...`}
          </h2>
          
          {/* Caller/Callee Info */}
          <p className="text-gray-600 mb-6">
            {individualCallState.isIncoming
              ? `from ${individualCallState.callerName}`
              : `to ${individualCallState.targetUser?.firstName} ${individualCallState.targetUser?.lastName}`}
          </p>

          {/* Call Status */}
          <div className="rounded-lg p-3 mb-6 bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              {individualCallState.isIncoming
                ? `${isVideoCall ? 'Video' : 'Audio'} Call`
                : 'Waiting for user to answer...'}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            {individualCallState.isIncoming ? (
              <>
                <button
                  onClick={handleDeclineIndividualCall}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Phone size={20} className="rotate-135" />
                  Decline
                </button>
                <button
                  onClick={handleAcceptIndividualCall}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                >
                  {isVideoCall ? <VideoIcon size={20} /> : <Phone size={20} />}
                  Accept
                </button>
              </>
            ) : (
              <button
                onClick={handleCancelIndividualCall}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Phone size={20} className="rotate-135" />
                Cancel Call
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isCallActive = callState === 'calling' || callState === 'connected';
  const canJoinCall = isCallActive && !isInCall && mediasoupConnected;

  if (!isInDrawer) {
    return (
      <div className="p-6">
        <h1>Group: {groupId}</h1>
        <div className="space-y-4 mt-4">
          {posts.map((post) => (
            <ThreadCard
              key={post.id}
              thread={post}
              currentUsername={username}
              onRetry={retrySend}
            />
          ))}
        </div>
        <ThreadComposer
          groupId={groupId}
          onThreadCreated={handleNewPost}
          onInputStart={handleTypingStart}
          onInputEnd={handleTypingEnd}
          username={username}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Bar - Enhanced Group Header */}
      <div className="bg-[#00529B] text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="hover:bg-white/20 p-1 rounded" title="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{groupName.charAt(0).toUpperCase()}</span>
            </div>                     
            <div>
              <button
            onClick={toggleMembersSidebar}
            className={`p-1 text-white rounded-full  ${
              showMembersSidebar ? '' : ''
            }`}
            title="Group Members"
          >
              <span className="font-semibold text-base">{groupName || `Group ${groupId}`}</span>
              <div className="text-xs text-blue-100 opacity-80">
                {groupMembers.length} members
                
              </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIndicator />
          
          {/* 👥 Group Members Button */}
          <button
            onClick={toggleMembersSidebar}
            className={`p-2 text-white rounded-full hover:bg-white/20 transition-colors ${
              showMembersSidebar ? 'bg-blue-600' : ''
            }`}
            title="Group Members"
          >
            <Users size={18} />
          </button>
          
          {/* 👥 Participants Button (only show during call) */}
          {isInCall && (
            <button
              onClick={toggleParticipantsSidebar}
              className="p-2 text-white rounded-full hover:bg-white/20 transition-colors relative"
              title="Call Participants"
            >
              <MessageCircle size={18} />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {participants.length + 1}
              </span>
            </button>
          )}
          
          {/* 🔍 Search Button */}
          <button
            onClick={toggleSearch}
            className={`p-2 text-white rounded-full hover:bg-white/20 transition-colors ${
              isSearching ? 'bg-blue-600' : ''
            }`}
            title="Search Messages"
          >
            <Search size={18} />
          </button>
          
          {/* Audio Call Button */}
          {/* {callState === 'idle' && (
            <button
              onClick={() => handleStartCall(true, 'audio')}
              className="p-2 text-white rounded-full hover:bg-white/20 transition-colors"
              title="Start Group Audio Call"
            >
              <Phone size={18} />
            </button>
          )} */}
          
          {/* Video Call Button */}
          {/* {callState === 'idle' && (
            <button
              onClick={() => handleStartCall(true, 'video')}
              className="p-2 text-white rounded-full hover:bg-white/20 transition-colors"
              title="Start Group Video Call"
            >
              <VideoIcon size={18} />
            </button>
          )} */}
          
          {/* Join Call Button */}
          {canJoinCall && (
            <button
              onClick={handleJoinCall}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-1 text-xs px-3"
              title={`Join ${currentCallType === 'video' ? 'Video' : 'Audio'} Call`}
            >
              {currentCallType === 'video' ? <VideoIcon size={14} /> : <Phone size={14} />}
              Join Call
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
<div className="flex-1 flex flex-col min-w-0">  
          {/* 🔍 Search Bar - Only show when searching */}
          {isSearching && <SearchBar />}

          {/* Enhanced Status Bar */}
          {!isSearching && (
            <div className="px-3 py-2 border-b text-xs text-gray-600 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                {currentUser?.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt="You"
                    className="w-5 h-5 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={10} />
                  </div>
                )}
                <span className="font-medium">{username || "Guest"}</span>
                {isTyping && (
                  <span className="text-indigo-600 flex items-center gap-1">
                    <Activity size={10} className="animate-pulse" /> Typing...
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeUsers.length > 0 && (
                  <span className="text-green-600 flex items-center gap-1">
                    {/* <Circle size={8} className="fill-current" />
                    {activeUsers.length} in call */}
                  </span>
                )}
                <button onClick={manualRefresh} disabled={loading} className="text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-full" title="Refresh Messages">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                 
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 chat-messages pb-16">
            {loading ? (
              <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin" />
                Loading messages...
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500 flex flex-col items-center gap-2">
                <AlertCircle size={20} />
                {error}
                <button 
                  onClick={handleManualReconnect}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 mt-2"
                >
                  Retry Connection
                </button>
              </div>
            ) : searchQuery && filteredPosts.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Search size={32} className="mx-auto mb-2 text-gray-400" />
                <p>No messages found for "{searchQuery}"</p>
                <button 
                  onClick={clearSearch}
                  className="text-blue-500 text-sm hover:underline mt-2"
                >
                  Clear search
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <MessageCircle size={32} className="mx-auto mb-2 text-gray-400" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              posts.map((post) => (
                <ThreadCard
                  key={post.id}
                  id={`post-${post.id}`}
                  thread={post}
                  currentUsername={username}
                  currentUser={currentUser}
                  onRetry={retrySend}
                />
              ))
            )}
            <div ref={postsEndRef} />
          </div>

          {/* Composer - Fixed at bottom */}
          <div className="border-t bg-white p-2 sticky bottom-0">
            <ThreadComposer
              groupId={groupId}
              onThreadCreated={handleNewPost}
              onInputStart={handleTypingStart}
              onInputEnd={handleTypingEnd}
              username={username}
            />
          </div>
        </div>

        {/* 👥 Group Members Sidebar */}
        {showMembersSidebar && GroupMembersSidebar}
      </div>

      {/* Video/Audio Call Modals */}
      {(callState === 'ringing' || callState === 'calling' || isInCall) && (
        currentCallType === 'video' ? (
          <VideoCallModal
            callState={callState}
            callerName={callerName}
            isAdmin={isAdmin}
            currentUserId={username}
            localStream={localStream}
            remoteStreams={remoteStreams}
            participants={participants}
            allUsers={allUsers}
            currentUser={currentUser}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
            onCancel={handleEndCall}
            onEndCall={handleEndCall}
            callType={currentCallType}
          />
        ) : (
          <AudioCallModal
            callState={callState}
            callerName={callerName}
            isAdmin={isAdmin}
            currentUserId={username}
            localStream={localStream}
            remoteStreams={remoteStreams}
            participants={participants}
            allUsers={allUsers}
            currentUser={currentUser}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
            onCancel={handleEndCall}
            onEndCall={handleEndCall}
          />
        )
      )}

      {/* 👥 Individual Call Modal */}
      <IndividualCallModal />
    </div>
  );
}