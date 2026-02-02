import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle,
  Truck,
  AlertTriangle,
  Clock,
  Calendar,
  TrendingUp,
  Eye,
  CalendarPlus
} from 'lucide-react';

const SummaryCard = ({ title, value, icon: Icon, color, percent, tag, trend, onOpen, onSchedule }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Simplified color scheme with subtle professional tones
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
      border: 'border-blue-200',
      glow: 'shadow-md',
      button: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-700',
      border: 'border-green-200',
      glow: 'shadow-md',
      button: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-500',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
      border: 'border-red-200',
      glow: 'shadow-md',
      button: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    orange: {
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700',
      border: 'border-orange-200',
      glow: 'shadow-md',
      button: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-700',
      border: 'border-purple-200',
      glow: 'shadow-md',
      button: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    indigo: {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-500',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-700',
      border: 'border-indigo-200',
      glow: 'shadow-md',
      button: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    }
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`relative bg-white rounded-xl p-5 border ${classes.border} transition-all duration-300 
      ${isHovered ? `${classes.glow} transform scale-[1.02]` : 'shadow-sm'}
      hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content wrapper */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${classes.text}`}>{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                  <TrendingUp className="h-3 w-3" />
                  <span>{trend}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Icon container */}
          <div className={`${classes.iconBg} p-3 rounded-xl shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
          {percent !== undefined && (
            <span className={`${classes.badge} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5`}>
              <CheckCircle className="h-3 w-3" />
              {percent}% Success
            </span>
          )}
          {tag && (
            <span className={`${classes.badge} px-3 py-1 rounded-full text-xs font-medium`}>
              {tag}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {percent !== undefined && (
          <div className="mb-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${classes.iconBg} transition-all duration-1000 ease-out`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Button with very subtle colors */}
        <button
          onClick={onOpen}
          className={`w-full ${classes.button} py-2.5 px-4 rounded-lg text-sm font-medium 
          transition-all duration-200 flex items-center justify-center gap-2 
          hover:shadow-sm active:scale-[0.98] border border-gray-200`}
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  );
};

const SummaryCards = ({ summaryData, allGages, openDrawer, handleScheduleForCalibration }) => {
  // Default data for demo purposes
  const defaultSummaryData = summaryData || {
    totalGages: 1250,
    calibratedOnTime: 1128,
    outForCalibration: 45,
    outOfCalibration: 23,
    dueNext15Days: 54,
    scheduledGages: 89
  };

  const findAndSchedule = (filterFn) => {
    if (!allGages) {
      alert('Feature requires gage data');
      return;
    }
    const gage = allGages.find(filterFn);
    if (gage) {
      handleScheduleForCalibration?.(gage);
    } else {
      alert('No matching gages available');
    }
  };

  const handleOpen = (type) => {
    if (openDrawer) {
      openDrawer(type);
    } else {
      console.log(`Opening ${type} drawer`);
    }
  };

  // Calculate overall success rate
  const successRate = defaultSummaryData.totalGages
    ? Math.round((defaultSummaryData.calibratedOnTime / defaultSummaryData.totalGages) * 100)
    : 0;

  const cards = [
    {
      title: "Total Gages",
      value: defaultSummaryData.totalGages,
      icon: BarChart3,
      color: "blue",
      type: "total",
      trend: "+12"
    },
    {
      title: "Calibrated On Time",
      value: defaultSummaryData.calibratedOnTime,
      icon: CheckCircle,
      color: "green",
      percent: successRate,
      type: "onTime",
      trend: "+5"
    },
    {
      title: "Out for Calibration",
      value: defaultSummaryData.outForCalibration,
      icon: Truck,
      color: "indigo",
      type: "outFor"
    },
    {
      title: "Calibration Due",
      value: defaultSummaryData.outOfCalibration,
      icon: AlertTriangle,
      color: "red",
      tag: "Action Required",
      type: "outOf"
    },
    {
      title: "Due Next 15 Days",
      value: defaultSummaryData.dueNext15Days,
      icon: Clock,
      color: "orange",
      type: "dueNext15"
    },
    {
      title: "Scheduled Gages",
      value: defaultSummaryData.scheduledGages,
      icon: Calendar,
      color: "purple",
      tag: "Ready",
      type: "scheduled",
      trend: "+8"
    }
  ];

  return (
    <div className="py-6 bg-gray-50">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Calibration Dashboard</h1>
        <p className="text-gray-600 text-sm">Monitor and manage your gage calibration status</p>
      </div>

      {/* Stats Overview */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
            <p className="text-sm text-gray-600 mt-1">Success Rate</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-2xl font-bold text-green-600">
              {defaultSummaryData.totalGages - defaultSummaryData.outOfCalibration}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Gages</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-2xl font-bold text-orange-600">
              {defaultSummaryData.dueNext15Days + defaultSummaryData.outOfCalibration}
            </p>
            <p className="text-sm text-gray-600 mt-1">Needs Attention</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-2xl font-bold text-purple-600">
              {defaultSummaryData.scheduledGages}
            </p>
            <p className="text-sm text-gray-600 mt-1">In Queue</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, index) => (
          <SummaryCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            percent={card.percent}
            tag={card.tag}
            trend={card.trend}
            onOpen={() => handleOpen(card.type)}
            onSchedule={() => findAndSchedule(g => g.source === card.type)}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Last updated: {new Date().toLocaleDateString()} • Total records: {defaultSummaryData.totalGages}</p>
      </div>
    </div>
  );
};

export default SummaryCards;