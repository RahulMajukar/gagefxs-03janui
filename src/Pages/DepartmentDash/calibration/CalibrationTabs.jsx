// src/components/dashboard/CalibrationTabs.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Truck, 
  ChevronRight,
  MapPin,
  User,
  Package,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Building2
} from 'lucide-react';

const CalibrationTabs = ({ 
  activeTab, 
  setActiveTab, 
  allGauges, 
  scheduledGages = [], // Add this prop with default value
  handleScheduleForCalibration, 
  getPriorityColor, 
  getStatusColor 
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Update tabs count
  const tabs = [
    {
      id: 'schedule',
      label: 'Scheduled',
      icon: Calendar,
      color: 'blue',
      // count: scheduledGages.length // Use scheduled gages count
       count: allGauges.filter(g => (g.status || '').toString().toLowerCase() === 'scheduled').length
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: CalendarCheck,
      color: 'green',
      count: allGauges.filter(g => g.source === 'upcoming').length
    },
    {
      id: 'outFor',
      label: 'Out for Calibration',
      icon: Truck,
      color: 'indigo',
      count: allGauges.filter(g => g.source === 'outFor').length
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertCircle,
      color: 'red',
      count: allGauges.filter(g => g.source === 'outOf').length
    }
  ];

  const getTabColor = (tabId) => {
    const colors = {
      schedule: 'border-blue-600 text-blue-600 bg-blue-50',
      upcoming: 'border-green-600 text-green-600 bg-green-50',
      outFor: 'border-indigo-600 text-indigo-600 bg-indigo-50',
      overdue: 'border-red-600 text-red-600 bg-red-50'
    };
    return colors[tabId] || 'border-gray-300 text-gray-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const days = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const calculateDaysUntil = (dueDate) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Update ScheduledGaugeCard component
  const ScheduledGaugeCard = ({ item }) => {
    const isHovered = hoveredItem === item.id;
    const daysUntilSchedule = calculateDaysUntil(item.scheduleInfo?.scheduledDate);

    return (
      <div 
        className={`group relative bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
          isHovered 
            ? 'border-blue-400 shadow-xl scale-[1.02]' 
            : 'border-blue-200 shadow-sm hover:shadow-lg'
        }`}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Scheduled stripe */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h4>
              </div>
              {item.manufacturer && (
                <p className="text-sm text-gray-500 ml-7">by {item.manufacturer}</p>
              )}
            </div>

            {/* Schedule Status Badge */}
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow-md">
                SCHEDULED
              </span>
              {daysUntilSchedule !== null && daysUntilSchedule >= 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  in {daysUntilSchedule} {daysUntilSchedule === 1 ? 'day' : 'days'}
                </span>
              )}
            </div>
          </div>

          {/* Schedule Info Grid */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <h5 className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              SCHEDULE DETAILS
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-700 font-medium">Date & Time</p>
                <p className="text-sm font-bold text-blue-900">
                  {formatDate(item.scheduleInfo?.scheduledDate)}
                </p>
                <p className="text-xs text-blue-600">
                  at {formatTime(item.scheduleInfo?.scheduledTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Assigned To</p>
                <p className="text-sm font-bold text-blue-900">
                  {item.scheduleInfo?.assignedTo || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Laboratory</p>
                <p className="text-sm font-bold text-blue-900 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {item.scheduleInfo?.laboratory || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Duration</p>
                <p className="text-sm font-bold text-blue-900">
                  {item.scheduleInfo?.estimatedDuration || 'N/A'} hours
                </p>
              </div>
            </div>
          </div>

          {/* Gauge Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Last Calibrated</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(item.lastCalibrated)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Due Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(item.dueDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Responsible</p>
                <p className="text-sm font-semibold text-gray-900">{item.responsible}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Location</p>
                <p className="text-sm font-semibold text-gray-900">
                  {item.location || item.department || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              item.priority === 'high' ? 'bg-red-100 text-red-700' :
              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {item.priority?.toUpperCase()} PRIORITY
            </span>
            {item.scheduleInfo?.scheduleStatus && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {item.scheduleInfo.scheduleStatus}
              </span>
            )}
          </div>
        </div>

        {/* Decorative corner */}
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-100 to-transparent opacity-30 rounded-tl-full"></div>
      </div>
    );
  };

  const GaugeCard = ({ item, showScheduleButton = true, isOverdue = false }) => {
    const isHovered = hoveredItem === item.id;
    const daysUntil = calculateDaysUntil(item.dueDate);
    const daysOverdue = isOverdue ? calculateDaysOverdue(item.dueDate) : 0;

    return (
      <div 
        className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
          isHovered 
            ? 'border-blue-400 shadow-xl scale-[1.02]' 
            : 'border-gray-200 shadow-sm hover:shadow-lg'
        }`}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Priority stripe */}
        <div className={`absolute top-0 left-0 w-1 h-full ${
          item.priority === 'high' ? 'bg-red-500' : 
          item.priority === 'medium' ? 'bg-yellow-500' : 
          'bg-green-500'
        }`}></div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-gray-400" />
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h4>
              </div>
              {item.manufacturer && (
                <p className="text-sm text-gray-500 ml-7">by {item.manufacturer}</p>
              )}
            </div>

            {/* Priority Badge */}
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                item.priority === 'high' ? 'bg-red-100 text-red-700' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {item.priority?.toUpperCase()}
              </span>
              
              {isOverdue && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-md animate-pulse">
                  {daysOverdue} DAYS OVERDUE
                </span>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Last Calibrated */}
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Last Calibrated</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(item.lastCalibrated)}</p>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-start gap-2">
              <Clock className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                isOverdue ? 'text-red-500' : daysUntil && daysUntil < 15 ? 'text-orange-500' : 'text-blue-500'
              }`} />
              <div>
                <p className="text-xs text-gray-500 font-medium">Due Date</p>
                <p className={`text-sm font-semibold ${
                  isOverdue ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatDate(item.dueDate)}
                </p>
                {!isOverdue && daysUntil !== null && (
                  <p className={`text-xs ${daysUntil < 15 ? 'text-orange-600' : 'text-gray-500'}`}>
                    in {daysUntil} days
                  </p>
                )}
              </div>
            </div>

            {/* Responsible */}
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Responsible</p>
                <p className="text-sm font-semibold text-gray-900">{item.responsible}</p>
              </div>
            </div>

            {/* Location/Department */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Location</p>
                <p className="text-sm font-semibold text-gray-900">
                  {item.location || item.department || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {item.status && (
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                getStatusColor ? getStatusColor(item.status) : 'bg-gray-100 text-gray-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                {item.status}
              </span>
            </div>
          )}
        </div>

        {/* Decorative corner */}
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-gray-100 to-transparent opacity-30 rounded-tl-full"></div>
      </div>
    );
  };

  const renderTabContent = () => {
    let items = [];
    let title = '';
    let emptyMessage = '';
    let isOverdue = false;
    let isScheduled = false;
    console.log('Scheduled Gages:', allGauges.filter(g => g.status === 'scheduled'));
    if (activeTab === 'schedule') {
      items = allGauges.filter(g => g.status == 'scheduled');
      title = 'Scheduled Calibrations';
      emptyMessage = 'No calibrations scheduled yet';
      isScheduled = true;
    } else if (activeTab === 'upcoming') {
      items = allGauges.filter(g => g.source === 'upcoming').slice(0, 5);
      title = 'Upcoming Calibrations';
      emptyMessage = 'No upcoming calibrations';
    } else if (activeTab === 'outFor') {
      items = allGauges.filter(g => g.source === 'outFor');
      title = 'Out for Calibration';
      emptyMessage = 'No gauges currently out for calibration';
    } else if (activeTab === 'overdue') {
      items = allGauges.filter(g => g.source === 'outOf');
      title = 'Overdue Calibrations';
      emptyMessage = 'No overdue calibrations';
      isOverdue = true;
    }

    return (
      <div className="space-y-4">
        {/* Header with stats */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          
          {items.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {items.length} Active
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              isScheduled ? (
                <ScheduledGaugeCard key={item.id} item={item} />
              ) : (
                <GaugeCard 
                  key={item.id} 
                  item={item} 
                  isOverdue={isOverdue}
                />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
            <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{emptyMessage}</p>
            <p className="text-sm text-gray-400 mt-2">
              {isScheduled ? 'Schedule a calibration to get started' : 'Check back later for updates'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
      {/* Tabs Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200 px-6 py-4">
        <div className="flex gap-3 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={`relative flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? `${getTabColor(tab.id)} shadow-md transform scale-105`
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                
                {/* Count badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-white/80 text-current' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-current rounded-t-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CalibrationTabs;