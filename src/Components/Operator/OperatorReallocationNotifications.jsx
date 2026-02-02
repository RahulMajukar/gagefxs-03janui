// OperatorReallocationNotifications.jsx
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Clock, Calendar, Package, User, Building, Settings, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { getReallocatesByStatus } from '../../api/api'; // Adjust path as needed

// Status-specific icons and colors
const getStatusIcon = (status) => {
  const iconProps = { size: 18, className: "flex-shrink-0" }; // Consistent size and prevent shrinking
  switch (status) {
    case 'APPROVED':
      return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />;
    case 'CANCELLED':
      return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'RETURNED':
      return <AlertCircle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    default:
      return <AlertCircle {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    case 'RETURNED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

// Function to fetch live notifications based on the 'notes' field
const getNotificationsForUser = async (username) => {
  try {
    // Fetch relevant statuses that indicate a notification-worthy event for the operator
    const [approvedReallocations, cancelledReallocations, returnedReallocations] = await Promise.all([
      getReallocatesByStatus('APPROVED'),
      getReallocatesByStatus('CANCELLED'), // Changed from 'REJECTED'
      getReallocatesByStatus('RETURNED')
    ]);

    const allReallocations = [
      ...approvedReallocations,
      ...cancelledReallocations,
      ...returnedReallocations
    ];

    // Filter the combined data based on the 'notes' field containing the operator's username
    const filteredNotifications = allReallocations
      .filter(r => r.notes && r.notes.includes(`Notify Operator: ${username}`))
      .map(r => ({
        id: r.id,
        reallocateId: r.id,
        gageId: r.gageId,
        gageSerialNumber: r.gageSerialNumber,
        gageModelNumber: r.gageModelNumber,
        gageTypeName: r.gageTypeName,
        status: r.status,
        requestedBy: r.requestedBy, // The original requester
        approvedBy: r.approvedBy,   // Who approved/cancelled
        currentDepartment: r.currentDepartment,
        currentFunction: r.currentFunction,
        currentOperation: r.currentOperation,
        message: r.status === 'APPROVED' ? `Your request for ${r.gageSerialNumber} has been APPROVED.` :
                 r.status === 'CANCELLED' ? `Your request for ${r.gageSerialNumber} has been CANCELLED.` :
                 r.status === 'RETURNED' ? `${r.gageSerialNumber} has been returned.` :
                 `Status update for ${r.gageSerialNumber}.`,
        timestamp: r.approvedAt || r.cancelledAt || r.returnedAt || r.updatedAt,
        read: r.acknowledgedByOperator || false, // Assuming a field tracks if operator saw it
        type: r.status.toLowerCase().replace('_', ''),
        relatedData: {
          newDepartment: r.currentDepartment,
          newFunction: r.currentFunction,
          newOperation: r.currentOperation,
          notes: r.notes,
          reason: r.status === 'CANCELLED' ? r.notes : r.status === 'RETURNED' ? r.returnReason : undefined
        },
        timeLimit: r.timeLimit, // Include time limit info
        expiresAt: r.expiresAt // Include expiry info if relevant
      }));

    // Sort notifications by timestamp, newest first
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filteredNotifications;

  } catch (error) {
    console.error("API Error fetching notifications:", error);
    throw error; // Re-throw to be caught by the calling useEffect
  }
};

const OperatorReallocationNotifications = ({ operatorUsername }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedNotificationId, setExpandedNotificationId] = useState(null); // For detailed view

  useEffect(() => {
    if (operatorUsername) {
      loadNotifications();
    }
  }, [operatorUsername]); // Fetch again if the operator's username changes

  const loadNotifications = async () => {
    if (!operatorUsername) return;

    setLoading(true);
    setError('');
    try {
      const data = await getNotificationsForUser(operatorUsername);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications from the server.');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Function to mark notification as read if backend supports it
  // const handleMarkAsRead = async (notificationId) => {
  //   try {
  //     // Example: await markNotificationAsRead(notificationId); // Implement this API call
  //     setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  //   } catch (err) {
  //     console.error('Failed to mark notification as read:', err);
  //   }
  // };

  // Optional: Function to mark all as read
  // const handleMarkAllAsRead = async () => {
  //   const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
  //   if (unreadIds.length === 0) return;
  //   try {
  //     // Example: await markAllNotificationsAsRead(unreadIds); // Implement API call
  //     setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  //   } catch (err) {
  //     console.error('Failed to mark all notifications as read:', err);
  //   }
  // };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleExpand = (id) => {
     setExpandedNotificationId(expandedNotificationId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="flex justify-center mb-2">
          <Clock className="animate-spin text-gray-400" size={24} />
        </div>
        <p className="text-sm">Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <div className="flex justify-center mb-2">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="flex justify-center mb-4">
          <Bell size={48} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">No notifications</h3>
        <p className="text-sm text-gray-500">You have no reallocation updates.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
      {/* Header for unread count */}
      {/* Uncomment if you implement read/unread logic */}
      {/* {unreadCount > 0 && (
        <div className="p-3 bg-blue-50 flex justify-between items-center sticky top-0 z-10">
          <span className="text-sm font-medium text-blue-700">
            {unreadCount} Unread
          </span>
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            disabled={loading}
          >
            Mark All Read
          </button>
        </div>
      )} */}
      {notifications.map((notification) => {
        const isExpanded = expandedNotificationId === notification.id;
        return (
          <div
            key={notification.id}
            className={`p-4 transition-colors duration-150 ${
              // Uncomment if you implement read/unread logic
              // notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
              'bg-white hover:bg-gray-50' // Default background if no read logic
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {getStatusIcon(notification.status)}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* First Line: Title, Timestamp, Expand/Collapse */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.gageSerialNumber} - {notification.gageTypeName}
                  </p>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => toggleExpand(notification.id)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {/* Second Line: Message */}
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border font-medium mr-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(notification.status).split(' ')[0].replace('bg', 'bg-')}`}></span>
                  {notification.status.replace('_', ' ')}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-gray-500" />
                        <span className="font-medium">Requested By:</span>
                        <span>{notification.requestedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={12} className="text-gray-500" />
                        <span className="font-medium">Approved/Canc. By:</span>
                        <span>{notification.approvedBy || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package size={12} className="text-gray-500" />
                        <span className="font-medium">Model:</span>
                        <span>{notification.gageModelNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-500" />
                        <span className="font-medium">Time Limit:</span>
                        <span>{notification.timeLimit || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building size={12} className="text-gray-500" />
                      <span className="font-medium">Current Allocation:</span>
                      <span>{notification.currentDepartment} / {notification.currentFunction} / {notification.currentOperation}</span>
                    </div>
                    {notification.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-500" />
                        <span className="font-medium">Expires At:</span>
                        <span>{new Date(notification.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                    {notification.relatedData.reason && (
                      <div>
                        <span className="font-medium">Reason:</span>
                        <span> {notification.relatedData.reason}</span>
                      </div>
                    )}
                    {/* Fixed Syntax: Removed the extra '&&' */}
                    {notification.relatedData.notes && !notification.relatedData.notes.includes('Notify Operator: ') && (
                      <div>
                        <span className="font-medium">Notes:</span>
                        <span> {notification.relatedData.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button (e.g., More options) - Optional */}
              {/* <div className="flex-shrink-0 pl-2">
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <MoreVertical size={16} />
                </button>
              </div> */}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperatorReallocationNotifications;