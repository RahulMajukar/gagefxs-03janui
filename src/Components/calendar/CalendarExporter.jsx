// CalendarExporter.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, 
  Calendar, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  BarChart3,
  Filter,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  FileText,
  CalendarDays,
  Settings,
  Printer
} from 'lucide-react';

const CalendarExporter = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcoming: 0,
    completed: 0,
    pending: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Months array for calendar
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Fetch data and stats
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/calendar/events');
      const events = await response.json();
      
      // Calculate stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      const upcoming = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate > now && eventDate <= thirtyDaysFromNow;
      }).length;
      
      const completed = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate < now;
      }).length;
      
      setStats({
        totalEvents: events.length,
        upcoming,
        completed,
        pending: events.length - (upcoming + completed)
      });
      
      // Get recent events
      const recent = events
        .sort((a, b) => new Date(b.start) - new Date(a.start))
        .slice(0, 5);
      setRecentEvents(recent);
      
      return events;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  };

  // Refresh stats
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Transform events to calendar format
  const transformEventsToCalendarFormat = (events) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Process each event
    const processedEvents = events
      .filter(event => event.start)
      .map((event, index) => {
        const eventDate = new Date(event.start);
        const month = MONTHS[eventDate.getMonth()];
        
        // Extract instrument details
        const description = event.description || '';
        const idMatch = description.match(/for\s+(HC\/\d+\/\d+)/);
        const snMatch = description.match(/\(SN:\s*(.*?)\)/);
        
        const idNo = idMatch ? idMatch[1] : `HC/01/${index + 1}`;
        const serialNo = snMatch ? snMatch[1] : '';
        
        // Create description text
        let instrumentName = event.title.replace(' Calibration', '');
        if (serialNo) {
          instrumentName = `${instrumentName} ${serialNo}`;
        }

        // Create month flags
        const monthFlags = {};
        MONTHS.forEach(m => {
          monthFlags[m] = m === month ? 'P' : '';
        });

        return {
          slNo: index + 1,
          description: instrumentName,
          idNo: idNo,
          calFreq: '1 Year',
          ...monthFlags,
          rawDate: eventDate,
          eventType: event.title,
          location: event.location || 'SHOP_FLOOR'
        };
      });

    // Sort by date
    processedEvents.sort((a, b) => a.rawDate - b.rawDate);

    // Reset SL numbers
    processedEvents.forEach((event, index) => {
      event.slNo = index + 1;
    });

    // Format date for display
    const formatDate = (date) => {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    return {
      header: {
        companyName: 'HIGH TENSILE FASTNUTS (I) PVT. LTD.',
        location: 'PUNE',
        title: `LIST OF INSTRUMENT & CALIBRATION CALENDAR: ${currentYear}-${nextYear.toString().slice(-2)}`,
        exportDate: new Date().toLocaleString('en-IN')
      },
      events: processedEvents,
      months: MONTHS,
      summary: {
        totalEvents: events.length,
        processedEvents: processedEvents.length,
        dateRange: {
          start: processedEvents.length > 0 
            ? formatDate(new Date(Math.min(...processedEvents.map(e => e.rawDate))))
            : 'N/A',
          end: processedEvents.length > 0
            ? formatDate(new Date(Math.max(...processedEvents.map(e => e.rawDate))))
            : 'N/A'
        }
      }
    };
  };

  // Create Excel file
  const createExcelFile = (calendarData) => {
    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    // Header rows
    wsData.push([calendarData.header.companyName]);
    wsData.push([calendarData.header.location]);
    wsData.push([calendarData.header.title]);
    wsData.push([`Exported on: ${calendarData.header.exportDate}`]);
    wsData.push([]);
    
    // Summary
    wsData.push([
      'SUMMARY:',
      `Total Instruments: ${calendarData.summary.totalEvents}`,
      `Date Range: ${calendarData.summary.dateRange.start} to ${calendarData.summary.dateRange.end}`
    ]);
    wsData.push([]);
    
    // Column headers
    const headers = [
      'S.L.',
      'Description',
      'ID. NO.',
      'CAL. FREQ.',
      ...calendarData.months
    ];
    wsData.push(headers);
    
    // Data rows
    calendarData.events.forEach(event => {
      const row = [
        event.slNo,
        event.description,
        event.idNo,
        event.calFreq,
        ...calendarData.months.map(month => event[month] || '')
      ];
      wsData.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Column widths
    const colWidths = [
      { wch: 6 },
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      ...calendarData.months.map(() => ({ wch: 8 }))
    ];
    ws['!cols'] = colWidths;
    
    // Merge cells for header
    const lastCol = headers.length - 1;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: lastCol } }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Calibration Schedule');
    
    // Create details sheet
    createDetailsSheet(wb, calendarData);
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Calibration_Schedule_${dateStr}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, filename);
  };

  // Create details sheet
  const createDetailsSheet = (wb, calendarData) => {
    const detailsData = [
      ['Event Details'],
      ['Exported from Calibration System'],
      [`Total Events: ${calendarData.summary.totalEvents}`],
      [`Export Date: ${calendarData.header.exportDate}`],
      [],
      ['SL.No', 'Instrument', 'ID', 'Calibration Date', 'Type', 'Location', 'Status']
    ];
    
    const now = new Date();
    calendarData.events.forEach(event => {
      const eventDate = event.rawDate;
      const status = eventDate < now ? 'Completed' : 'Upcoming';
      const dateStr = eventDate.toLocaleDateString('en-IN');
      
      detailsData.push([
        event.slNo,
        event.description,
        event.idNo,
        dateStr,
        event.eventType,
        event.location,
        status
      ]);
    });
    
    const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
    detailsWs['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, detailsWs, 'Event Details');
  };

  // Main export function
  const handleExport = async () => {
    setLoading(true);
    setStatus({ type: 'loading', message: 'Fetching calendar events...' });
    setProgress(10);

    try {
      // Fetch data
      setProgress(30);
      const events = await fetchData();
      
      setProgress(60);
      setStatus({ type: 'loading', message: 'Formatting data...' });

      // Transform data
      const formattedData = transformEventsToCalendarFormat(events);

      setProgress(90);
      setStatus({ type: 'loading', message: 'Generating Excel file...' });

      // Create Excel
      createExcelFile(formattedData);

      setProgress(100);
      setStatus({ 
        type: 'success', 
        message: `Successfully exported ${events.length} events to Excel!`
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus({ type: 'idle', message: '' });
        setProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to export calendar data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status.type) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status.type) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Event card component
  const EventCard = ({ event }) => {
    const eventDate = new Date(event.start);
    const now = new Date();
    const isPast = eventDate < now;
    
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPast ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Calendar className={`w-4 h-4 ${isPast ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-800">{event.title}</p>
            <p className="text-sm text-gray-500">
              {eventDate.toLocaleDateString()} • {event.location || 'SHOP_FLOOR'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPast ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {isPast ? 'Completed' : 'Upcoming'}
        </div>
      </div>
    );
  };

  // Stat card component
  const StatCard = ({ icon, title, value, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <span className="text-2xl font-bold text-gray-800">{value}</span>
        </div>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calibration Calendar</h1>
                <p className="text-gray-600">Manage and export calibration schedules</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
                         bg-white rounded-lg border border-gray-300 hover:bg-gray-50 
                         transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                               bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Calendar className="w-5 h-5" />}
                title="Total Events"
                value={stats.totalEvents}
                color="blue"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                title="Upcoming (30d)"
                value={stats.upcoming}
                color="orange"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5" />}
                title="Completed"
                value={stats.completed}
                color="green"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Pending"
                value={stats.pending}
                color="red"
              />
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Recent Calibrations
                </h2>
                <Filter className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <EventCard key={index} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No events found</p>
                  </div>
                )}
              </div>
              
              {recentEvents.length > 0 && (
                <button className="w-full mt-6 py-2 text-sm font-medium text-blue-600 
                                 hover:text-blue-700 transition-colors flex items-center justify-center gap-1">
                  View All Events
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center justify-center gap-2 px-4 py-3 
                                 bg-white text-blue-600 rounded-lg font-medium
                                 hover:bg-blue-50 transition-colors">
                  <Calendar className="w-5 h-5" />
                  View Calendar
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 
                                 bg-white text-blue-600 rounded-lg font-medium
                                 hover:bg-blue-50 transition-colors">
                  <FileText className="w-5 h-5" />
                  Generate Report
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 
                                 bg-white text-blue-600 rounded-lg font-medium
                                 hover:bg-blue-50 transition-colors">
                  <Printer className="w-5 h-5" />
                  Print Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Export Section */}
          <div className="space-y-8">
            {/* Export Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Export Calendar</h2>
                  <p className="text-sm text-gray-600">Export to Excel format</p>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={loading}
                className={`
                  w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg
                  font-medium transition-all duration-200 mb-6
                  ${loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-[1.02]'
                  }
                  text-white shadow-md hover:shadow-lg
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Export to Excel</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {loading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Message */}
              {status.message && (
                <div className={`mb-6 p-4 rounded-lg border ${getStatusColor().replace('text', 'border')} 
                              bg-opacity-10 ${getStatusColor().replace('text', 'bg')}`}>
                  <div className="flex items-center gap-3">
                    {getStatusIcon()}
                    <p className={`text-sm font-medium ${getStatusColor()}`}>
                      {status.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Includes all calendar events</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Formatted as calibration schedule</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Multiple Excel sheets included</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Auto-generated with timestamp</span>
                </div>
              </div>
            </div>

            {/* Export History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Recent Exports
              </h3>
              <div className="space-y-3">
                {['Today', 'Yesterday', 'Last Week'].map((time, index) => (
                  <div key={index} className="flex items-center justify-between p-3 
                                            bg-gray-50 rounded-lg hover:bg-gray-100 
                                            transition-colors cursor-pointer group">
                    <div>
                      <p className="font-medium text-gray-700 group-hover:text-blue-600">
                        Calibration Schedule
                      </p>
                      <p className="text-sm text-gray-500">{time} • {3 - index} files</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Export Information
              </h3>
              <ul className="text-blue-700 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Excel file matches your calibration calendar format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Events are sorted by calibration date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Includes instrument details and serial numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Main schedule + detailed events sheet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarExporter;