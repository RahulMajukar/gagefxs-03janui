import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  Wrench,
  ChevronDown,
  Package,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Bell,
  Building,
  User,
  Calendar,
  RefreshCw,
  Filter,
  Download,
  MapPin,
  X,
  FileText
} from "lucide-react";
import AssignedGagesModal from "../../Components/Operator/AssignedGagesModal";
import SelectOperationGageModal from "../../Components/Operator/SelectOperationGageModal";
import GageUsageHistory from "../../Components/Operator/GageUsageHistory";
import SupportTicketModal from "../../Components/Operator/SupportTicketModal";
import { useAuth } from "../../auth/AuthContext";
import { getOperatorFilteredGageIssuesByPriority } from "../../api/api";
import { getReallocatesByStatus } from "../../api/api";

// Status configurations
const statusConfig = {
  APPROVED: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Approved"
  },
  CANCELLED: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    label: "Cancelled"
  },
  RETURNED: {
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    label: "Returned"
  }
};

// Function to fetch live notifications
const getNotificationsForUser = async (username) => {
  try {
    const [approvedReallocations, cancelledReallocations, returnedReallocations] = await Promise.all([
      getReallocatesByStatus('APPROVED'),
      getReallocatesByStatus('CANCELLED'),
      getReallocatesByStatus('RETURNED')
    ]);

    const allReallocations = [
      ...approvedReallocations,
      ...cancelledReallocations,
      ...returnedReallocations
    ];

    const filteredNotifications = allReallocations
      .filter(r => r.notes && r.notes.includes(`Notify Operator: ${username}`))
      .map(r => ({
        id: r.id,
        reallocateId: r.id,
        gageSerialNumber: r.gageSerialNumber,
        gageModelNumber: r.gageModelNumber,
        gageTypeName: r.gageTypeName,
        status: r.status,
        requestedBy: r.requestedBy,
        approvedBy: r.approvedBy,
        currentDepartment: r.currentDepartment,
        currentFunction: r.currentFunction,
        currentOperation: r.currentOperation,
        message: r.status === 'APPROVED' ? `Request for ${r.gageSerialNumber} has been approved` :
                 r.status === 'CANCELLED' ? `Request for ${r.gageSerialNumber} has been cancelled` :
                 r.status === 'RETURNED' ? `${r.gageSerialNumber} has been returned` :
                 `Status update for ${r.gageSerialNumber}`,
        timestamp: r.approvedAt || r.cancelledAt || r.returnedAt || r.updatedAt,
        read: r.acknowledgedByOperator || false,
        timeLimit: r.timeLimit,
        expiresAt: r.expiresAt,
        relatedData: {
          reason: r.status === 'CANCELLED' ? r.notes : r.status === 'RETURNED' ? r.returnReason : undefined,
          notes: r.notes
        }
      }));

    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filteredNotifications;

  } catch (error) {
    console.error("API Error fetching notifications:", error);
    throw error;
  }
};

// Modern Notification Card Component with Single Column Layout
const NotificationCard = ({ notification, isExpanded, onToggle }) => {
  const config = statusConfig[notification.status] || statusConfig.APPROVED;
  const StatusIcon = config.icon;

  return (
    <div className={`bg-white rounded-xl border-2 ${config.borderColor} p-4 transition-all duration-300 ${
      isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <StatusIcon size={18} className={config.color} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {notification.gageSerialNumber}
            </h4>
            <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 ml-2">
          {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
        <button
          onClick={() => onToggle(notification.id)}
          className="flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
          <ChevronDown 
            size={14} 
            className={`transform transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {/* Expandable Details - Single Column Layout */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Requested By:</span>
                </div>
                <span className="text-sm text-gray-900 text-right">{notification.requestedBy}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Model:</span>
                </div>
                <span className="text-sm text-gray-900 text-right">{notification.gageModelNumber || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Type:</span>
                </div>
                <span className="text-sm text-gray-900 text-right">{notification.gageTypeName}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Time Limit:</span>
                </div>
                <span className="text-sm text-gray-900 text-right">{notification.timeLimit || 'Standard'}</span>
              </div>
            </div>

            {/* Allocation */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 font-medium">Current Allocation</span>
              </div>
              <div className="flex flex-wrap gap-2 ml-6">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium">
                  {notification.currentDepartment}
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-medium">
                  {notification.currentFunction}
                </span>
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-lg text-xs font-medium">
                  {notification.currentOperation}
                </span>
              </div>
            </div>

            {/* Reason (if available) */}
            {notification.relatedData.reason && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Reason</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 ml-6">
                  <p className="text-sm text-gray-900">{notification.relatedData.reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Filter Modal Component
const FilterModal = ({ isOpen, onClose, filters, onFilterChange, onApplyFilters, onClearFilters }) => {
  if (!isOpen) return null;

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'RETURNED', label: 'Returned' }
  ];

  const timeOptions = [
    { value: 'ALL', label: 'All Time' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'This Week' },
    { value: 'MONTH', label: 'This Month' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Filter Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="space-y-2">
              {statusOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Time Period
            </label>
            <div className="space-y-2">
              {timeOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="timePeriod"
                    value={option.value}
                    checked={filters.timePeriod === option.value}
                    onChange={(e) => onFilterChange('timePeriod', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Read/Unread Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Read Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="readStatus"
                  value="ALL"
                  checked={filters.readStatus === 'ALL'}
                  onChange={(e) => onFilterChange('readStatus', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="readStatus"
                  value="UNREAD"
                  checked={filters.readStatus === 'UNREAD'}
                  onChange={(e) => onFilterChange('readStatus', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700">Unread Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OperatorDashboard({ functions = [], operations = [] }) {
  const hasFunctions = functions.length > 0;
  const hasOperations = operations.length > 0;
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'ALL',
    timePeriod: 'ALL',
    readStatus: 'ALL'
  });

  // Dynamic assigned gages
  const [assignedGagesCount, setAssignedGagesCount] = useState(0);
  const [gageStatus, setGageStatus] = useState({ critical: 0, pending: 0, completed: 0 });

  useEffect(() => {
    if (user) {
      fetchAssignedGagesCount();
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notifications, filters]);

  const fetchAssignedGagesCount = async () => {
    if (!user) return;
    try {
      const departments = user.departments || [];
      const functions = user.functions || [];
      const operations = user.operations || [];

      const gages = await getOperatorFilteredGageIssuesByPriority(
        departments,
        functions,
        operations
      );

      setAssignedGagesCount(gages?.length || 0);
      
      const critical = gages.filter(g => g.priority === 'high').length;
      const pending = gages.filter(g => g.status === 'pending').length;
      const completed = gages.filter(g => g.status === 'completed').length;
      
      setGageStatus({ critical, pending, completed });
    } catch (err) {
      console.error("Error fetching assigned gages count:", err);
      setAssignedGagesCount(0);
      setGageStatus({ critical: 0, pending: 0, completed: 0 });
    }
  };

  const loadNotifications = async () => {
    if (!user?.username) return;

    setNotificationsLoading(true);
    try {
      const data = await getNotificationsForUser(user.username);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(notification => notification.status === filters.status);
    }

    // Time period filter
    if (filters.timePeriod !== 'ALL') {
      const now = new Date();
      let startDate;

      switch (filters.timePeriod) {
        case 'TODAY':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'WEEK':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'MONTH':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(notification => 
          new Date(notification.timestamp) >= startDate
        );
      }
    }

    // Read status filter
    if (filters.readStatus === 'UNREAD') {
      filtered = filtered.filter(notification => !notification.read);
    }

    setFilteredNotifications(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilters = () => {
    applyFilters();
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'ALL',
      timePeriod: 'ALL',
      readStatus: 'ALL'
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Gage Serial Number',
      'Status',
      'Message',
      'Requested By',
      'Model',
      'Type',
      'Time Limit',
      'Department',
      'Function',
      'Operation',
      'Timestamp'
    ];

    const csvData = filteredNotifications.map(notification => [
      notification.gageSerialNumber,
      notification.status,
      notification.message,
      notification.requestedBy,
      notification.gageModelNumber || 'N/A',
      notification.gageTypeName,
      notification.timeLimit || 'Standard',
      notification.currentDepartment,
      notification.currentFunction,
      notification.currentOperation,
      new Date(notification.timestamp).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `notifications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleNotificationExpand = (notificationId) => {
    setExpandedNotificationId(expandedNotificationId === notificationId ? null : notificationId);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  // Stats data
  const stats = [
    { 
      title: "Total Assigned", 
      value: assignedGagesCount, 
      icon: ClipboardList, 
      color: "blue",
      trend: "up",
      change: "+12%",
      description: "Gages assigned to you"
    },
    { 
      title: "Critical Issues", 
      value: gageStatus.critical, 
      icon: AlertTriangle, 
      color: "red",
      trend: "up",
      change: "+3%",
      description: "Require immediate attention"
    },
    { 
      title: "Completed", 
      value: gageStatus.completed, 
      icon: CheckCircle, 
      color: "green",
      trend: "up",
      change: "+18%",
      description: "Tasks completed this week"
    },
    { 
      title: "Pending", 
      value: gageStatus.pending, 
      icon: Clock, 
      color: "yellow",
      trend: "down",
      change: "-2%",
      description: "Awaiting action"
    },
  ];

  // Quick actions
  const quickActions = [
    { 
      title: "View Assigned Gages", 
      icon: ClipboardList, 
      color: "blue",
      onClick: () => setIsModalOpen(true),
      description: "Check all assigned instruments"
    },
    { 
      title: "Check-out Gage", 
      icon: Wrench, 
      color: "green",
      onClick: () => setIsSelectModalOpen(true),
      description: "Start using a gage"
    },
    { 
      title: "Usage History", 
      icon: History, 
      color: "purple",
      onClick: () => setIsHistoryModalOpen(true),
      description: "View past activities"
    },
    { 
      title: "Report Issue", 
      icon: AlertTriangle, 
      color: "red",
      onClick: () => setIsTicketModalOpen(true),
      description: "Report problems"
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:bg-blue-100' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'hover:bg-green-100' },
      red: { bg: 'bg-red-50', icon: 'text-red-600', hover: 'hover:bg-red-100' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', hover: 'hover:bg-purple-100' },
      yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', hover: 'hover:bg-yellow-100' }
    };
    return colors[color] || colors.blue;
  };

  const hasActiveFilters = filters.status !== 'ALL' || filters.timePeriod !== 'ALL' || filters.readStatus !== 'ALL';

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 mt-1 ml-4 text-lg font-semibold">Welcome back, {user?.name || 'Operator'}. Here's what's happening today!</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    ●
                  </span>
                )}
              </button>
              <button 
                onClick={exportToCSV}
                disabled={filteredNotifications.length === 0}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const colorClass = getColorClasses(stat.color);
            return (
              <div key={index} className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colorClass.bg}`}>
                    <stat.icon size={24} className={colorClass.icon} />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-900 mb-1">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions and Modules */}
          <div className="xl:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-500 mt-1">Frequently used operations</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const colorClass = getColorClasses(action.color);
                    return (
                      <button
                        key={index}
                        onClick={action.onClick}
                        className={`flex items-center p-4 rounded-lg border border-gray-200 ${colorClass.hover} hover:border-gray-300 transition-all duration-200 text-left group`}
                      >
                        <div className={`p-3 rounded-lg ${colorClass.bg} transition-colors`}>
                          <action.icon size={20} className={colorClass.icon} />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-medium text-gray-900">{action.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Functions and Operations */}
            {(hasFunctions || hasOperations) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasFunctions && (
                  <div className="bg-white rounded-xl shadow-xs border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Functions</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {functions.map((f, index) => (
                          <NavLink
                            key={f}
                            to={`/operator/functions/${f}`}
                            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Package size={18} className="text-blue-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{f}</p>
                              <p className="text-xs text-gray-500">Manage operations</p>
                            </div>
                            <ChevronDown size={16} className="text-gray-400 transform -rotate-90" />
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {hasOperations && (
                  <div className="bg-white rounded-xl shadow-xs border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">Operations</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {operations.map((op, index) => (
                          <NavLink
                            key={op}
                            to={`/operator/operations/${op}`}
                            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                          >
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Wrench size={18} className="text-green-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{op}</p>
                              <p className="text-xs text-gray-500">View details</p>
                            </div>
                            <ChevronDown size={16} className="text-gray-400 transform -rotate-90" />
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Notifications with Scroll */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 sticky top-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <Bell size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                      <p className="text-sm text-gray-500">
                        {hasActiveFilters ? `${filteredNotifications.length} filtered` : `${notifications.length} total`}
                        {filteredUnreadCount > 0 && ` • ${filteredUnreadCount} unread`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {filteredUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {filteredUnreadCount}
                      </span>
                    )}
                    <button 
                      onClick={loadNotifications}
                      disabled={notificationsLoading}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <RefreshCw size={16} className={`text-gray-400 ${notificationsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Notifications Container */}
              <div className="p-6">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={20} className="animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">
                      {hasActiveFilters ? 'No notifications match your filters' : 'No notifications'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'You\'re all caught up'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {/* Custom Scrollbar Styling */}
                    <style jsx>{`
                      .max-h-\[500px\]::-webkit-scrollbar {
                        width: 4px;
                      }
                      .max-h-\[500px\]::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 10px;
                      }
                      .max-h-\[500px\]::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 10px;
                      }
                      .max-h-\[500px\]::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                      }
                    `}</style>
                    
                    {filteredNotifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        isExpanded={expandedNotificationId === notification.id}
                        onToggle={toggleNotificationExpand}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <AssignedGagesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {isSelectModalOpen && (
        <SelectOperationGageModal isOpen={isSelectModalOpen} onClose={() => setIsSelectModalOpen(false)} />
      )}
      {isHistoryModalOpen && (
        <GageUsageHistory isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />
      )}
      {isTicketModalOpen && (
        <SupportTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
}