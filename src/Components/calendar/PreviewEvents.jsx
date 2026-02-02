import React, { useState, useEffect, useRef } from 'react';
import {
  Eye, Download, X, FileDown, Printer, Loader2, CheckCircle, AlertCircle,
  Calendar, Filter, Search, ChevronLeft, ChevronRight, User, Clock,
  AlertTriangle, MessageSquare, Send, Mail, Smartphone
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PreviewEvents = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false); // ← NEW
  const [loading, setLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    priority: '',
    status: '',
    dateRange: 'all'
  });
  const itemsPerPage = 10;
  const previewRef = useRef(null);

  // SMS form state
  const [smsForm, setSmsForm] = useState({ to: '', message: '' });
  const [smsErrors, setSmsErrors] = useState({});

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Get unique filter options from events
  const getUniqueValues = (key) => {
    return [...new Set(events.map(event => event[key]).filter(Boolean))].sort();
  };

  const transformEvents = (events) => {
    return events
      .filter(event => event.start)
      .map((event, index) => {
        const eventDate = new Date(event.start);
        const month = MONTHS[eventDate.getMonth()];
        const now = new Date();
        let eventStatus = 'pending';
        if (event.acceptanceStatus === 'expired') {
          eventStatus = 'expired';
        } else if (event.attendees?.some(a => a.status === 'ACCEPTED')) {
          eventStatus = 'accepted';
        }

        const gageName = event.gageName || '';
        const description = event.description || '';
        const idMatch = description.match(/for\s+(HC\/\d+\/\d+)/);
        let idNo = idMatch ? idMatch[1] : '';
        if (!idNo && gageName) {
          const gageIdMatch = gageName.match(/(HC\/\d+\/\d+)/);
          idNo = gageIdMatch ? gageIdMatch[1] : `HC/01/${index + 1}`;
        } else if (!idNo) {
          idNo = `HC/01/${index + 1}`;
        }

        const snMatch = description.match(/\(SN:\s*(.*?)\)/);
        const serialNo = snMatch ? snMatch[1] : '';
        let instrumentName = gageName || event.title.replace(' Calibration', '');
        if (serialNo) {
          instrumentName = `${instrumentName} (SN: ${serialNo})`;
        }

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
          location: event.location || 'SHOP_FLOOR',
          originalGageName: gageName,
          category: event.category || 'work',
          priority: event.priority || 'medium',
          status: eventStatus,
          isUpcoming: eventDate > now,
          isPast: eventDate < now,
          isCurrent: eventDate.toDateString() === now.toDateString()
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate)
      .map((event, index) => ({ ...event, slNo: index + 1 }));
  };

  const fetchEvents = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const username = localStorage.getItem('username');
      if (!username) throw new Error('User email is required');
      const response = await fetch('https://qsutrarmsclm.hub.swajyot.co.in:8458/api/calendar/events', {
        headers: { 'User-Email': username }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No calendar events found');
      }
      const transformedEvents = transformEvents(data);
      setEvents(transformedEvents);
      setStatus({
        type: 'success',
        message: `Loaded ${transformedEvents.length} events successfully!`
      });
    } catch (error) {
      console.error('Preview error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to load events'
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    if (events.length === 0) {
      await fetchEvents();
    }
  };

  // Apply all filters
  const applyFilters = (events) => {
    return events.filter(event => {
      const matchesSearch =
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.idNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.originalGageName && event.originalGageName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = !filters.location || event.location === filters.location;
      const matchesCategory = !filters.category || event.category === filters.category;
      const matchesPriority = !filters.priority || event.priority === filters.priority;
      const matchesStatus = !filters.status || event.status === filters.status;
      let matchesDate = true;
      if (filters.dateRange === 'upcoming') {
        matchesDate = event.isUpcoming;
      } else if (filters.dateRange === 'past') {
        matchesDate = event.isPast;
      } else if (filters.dateRange === 'current') {
        matchesDate = event.isCurrent;
      }
      return matchesSearch && matchesLocation && matchesCategory &&
        matchesPriority && matchesStatus && matchesDate;
    });
  };

  const filteredEvents = applyFilters(events);

  // Generate shareable summary text
  const generateShareText = () => {
    const total = filteredEvents.length;
    const currentYear = new Date().getFullYear();
    const company = 'HIGH TENSILE FASTNUTS (I) PVT. LTD.';
    const subject = `Calibration Schedule ${currentYear}-${currentYear + 1}`;
    const bodyLines = [
      `*${company}*`,
      `Calibration Schedule: ${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
      `Total Instruments: ${total}`,
      '',
      'Schedule Summary:',
      ...filteredEvents.slice(0, 5).map(e => `- ${e.description} (${e.idNo}) on ${e.rawDate.toLocaleDateString()}`),
      ...(total > 5 ? [`... and ${total - 5} more`] : []),
      '',
      'Generated via Calibration System'
    ];
    return { subject, body: bodyLines.join('\n') };
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const { body } = generateShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    setShareModalOpen(false);
  };

  // Email share
  const handleShareEmail = () => {
    const { subject, body } = generateShareText();
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    setShareModalOpen(false);
  };

  // Open SMS modal from share
  const handleShareSMS = () => {
    setShareModalOpen(false);
    setSmsModalOpen(true);
  };

  // Export PDF (unchanged)
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('HIGH TENSILE FASTNUTS (I) PVT. LTD.', 14, 15);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('PUNE', 14, 23);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`LIST OF INSTRUMENT & CALIBRATION CALENDAR: ${currentYear}-${nextYear.toString().slice(-2)}`, 14, 31);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 39);
      doc.text(`Total Instruments: ${filteredEvents.length}`, 14, 46);

      const activeFilters = Object.entries(filters)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      if (activeFilters) {
        doc.text(`Active Filters: ${activeFilters}`, 14, 53);
      }

      const tableColumn = ['S.L.', 'DESCRIPTION', 'ID. NO.', 'CAL. FREQ.', ...MONTHS];
      const tableRows = filteredEvents.map(event => [
        event.slNo.toString(),
        event.description,
        event.idNo,
        event.calFreq,
        ...MONTHS.map(month => event[month] || '')
      ]);

      autoTable(doc, {
        startY: activeFilters ? 60 : 50,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        margin: { top: 20, left: 14, right: 14, bottom: 15 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 10, halign: 'center' },
        bodyStyles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          ...MONTHS.reduce((acc, _, index) => {
            acc[index + 4] = { cellWidth: 14, halign: 'center' };
            return acc;
          }, {})
        },
        styles: { halign: 'center' },
        didParseCell: function(data) {
          if (data.column.index === 1) {
            data.cell.styles.halign = 'left';
          }
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('LIST OF INSTRUMENT & CALIBRATION CALENDAR', 14, 12);
          }
        }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`Calibration_Schedule_${dateStr}.pdf`);
      setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('PDF generation error:', error);
      setStatus({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    }
  };

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  useEffect(() => {
    if (previewOpen && events.length === 0) {
      fetchEvents();
    }
  }, [previewOpen]);

  // Reset filters
  const resetFilters = () => {
    setFilters({ location: '', category: '', priority: '', status: '', dateRange: 'all' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // SMS Modal Handlers
  const openSmsModal = () => {
    setSmsModalOpen(true);
    setSmsForm({ to: '', message: '' });
    setSmsErrors({});
  };

  const validateSmsForm = () => {
    const errors = {};
    if (!smsForm.to.trim()) {
      errors.to = 'Phone number is required';
    } else if (!/^\+91\d{10}$/.test(smsForm.to.trim())) {
      errors.to = 'Invalid phone number format. Use +91XXXXXXXXXX';
    }
    if (!smsForm.message.trim()) {
      errors.message = 'Message is required';
    } else if (smsForm.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    } else if (smsForm.message.trim().length > 160) {
      errors.message = 'Message cannot exceed 160 characters';
    }
    return errors;
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();
    const errors = validateSmsForm();
    if (Object.keys(errors).length > 0) {
      setSmsErrors(errors);
      return;
    }
    setSmsLoading(true);
    try {
      const response = await fetch('https://qsutrarmsclm.hub.swajyot.co.in:8458/api/gages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smsForm.to.trim(),
          message: smsForm.message.trim()
        })
      });
      if (!response.ok) throw new Error('Failed to send SMS');
      const result = await response.json();
      setStatus({ type: 'success', message: 'SMS sent successfully!' });
      setSmsModalOpen(false);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('SMS error:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to send SMS. Please try again.' });
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSmsChange = (e) => {
    const { name, value } = e.target;
    setSmsForm(prev => ({ ...prev, [name]: value }));
    if (smsErrors[name]) {
      setSmsErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Render main buttons when no modal is open
  if (!previewOpen && !smsModalOpen && !shareModalOpen) {
    return (
      <div className="inline-block ml-2 flex gap-2">
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow hover:shadow-md transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          <span>Preview Events</span>
        </button>
        <button
          onClick={openSmsModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow hover:shadow-md transition-all duration-200"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Send SMS</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Main Buttons */}
      {(!previewOpen && !smsModalOpen && !shareModalOpen) && (
        <div className="inline-block ml-2 flex gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow hover:shadow-md transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Events</span>
          </button>
          <button
            onClick={openSmsModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow hover:shadow-md transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send SMS</span>
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Event Preview</h2>
                  <p className="text-sm text-gray-600">Calendar events with gage names</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareModalOpen(true)} // ← SHARE BUTTON
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow hover:shadow-md transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow hover:shadow-md transition-all duration-200"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Status Messages */}
              {status && (
                <div className={`mx-6 mt-4 px-4 py-2 rounded-lg border ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <div className="flex items-center gap-2">
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{status.message}</span>
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="p-4 border-b bg-white text-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by gage name or ID..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 text-black">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={filters.location}
                        onChange={(e) => { setFilters({...filters, location: e.target.value}); setCurrentPage(1); }}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">All Locations</option>
                        {getUniqueValues('location').map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                      <select
                        value={filters.category}
                        onChange={(e) => { setFilters({...filters, category: e.target.value}); setCurrentPage(1); }}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">All Categories</option>
                        {getUniqueValues('category').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <select
                        value={filters.priority}
                        onChange={(e) => { setFilters({...filters, priority: e.target.value}); setCurrentPage(1); }}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">All Priorities</option>
                        {getUniqueValues('priority').map(pri => <option key={pri} value={pri}>{pri}</option>)}
                      </select>
                      <select
                        value={filters.status}
                        onChange={(e) => { setFilters({...filters, status: e.target.value}); setCurrentPage(1); }}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                        <option value="accepted">Accepted</option>
                      </select>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => { setFilters({...filters, dateRange: e.target.value}); setCurrentPage(1); }}
                        className="border rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="all">All Dates</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                        <option value="current">Today</option>
                      </select>
                      {(filters.location || filters.category || filters.priority || filters.status || filters.dateRange !== 'all' || searchTerm) && (
                        <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-800">Clear Filters</button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-600">{filteredEvents.length} of {events.length} events</div>
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Excel-like Table */}
              <div className="flex-1 overflow-auto p-4" ref={previewRef}>
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-blue-50 border-b">
                    <div className="p-3">
                      <h3 className="text-lg font-bold text-center text-gray-800">HIGH TENSILE FASTNUTS (I) PVT. LTD.</h3>
                      <p className="text-center text-gray-600">PUNE</p>
                      <p className="text-center font-semibold text-gray-800">LIST OF INSTRUMENT & CALIBRATION CALENDAR: 2025-26</p>
                      <p className="text-center text-sm text-gray-500">Preview generated on: {new Date().toLocaleString()}</p>
                      <p className="text-center text-sm text-gray-500">Total Instruments: {filteredEvents.length}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">S.L.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">DESCRIPTION (Gage Name)</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">ID. NO.</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">CAL. FREQ.</th>
                          {MONTHS.map(month => (
                            <th key={month} className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">{month}</th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedEvents.length > 0 ? (
                          paginatedEvents.map((event) => (
                            <tr key={event.slNo} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-300 text-center">{event.slNo}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300 text-left">{event.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300 text-center">{event.idNo}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300 text-center">{event.calFreq}</td>
                              {MONTHS.map(month => (
                                <td
                                  key={month}
                                  className={`px-3 py-3 text-center text-sm border border-gray-300 ${
                                    event[month] === 'P' ? 'bg-green-100 text-green-800 font-semibold' : 'text-gray-500'
                                  }`}
                                >
                                  {event[month] || ''}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  event.status === 'expired' ? 'bg-red-100 text-red-800' :
                                  event.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {event.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                              {loading ? 'Loading events...' : 'No events found'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-black">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300"></div>
                    <span>P = Calibration Scheduled</span>
                  </span>
                  <span className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300"></div>
                    <span>Pending</span>
                    <div className="w-3 h-3 bg-red-100 border border-red-300"></div>
                    <span>Expired</span>
                    <div className="w-3 h-3 bg-green-100 border border-green-300"></div>
                    <span>Accepted</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <Send className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Share Calibration Schedule</h2>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleShareSMS}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Send via SMS</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Share on WhatsApp</span>
              </button>
              <button
                onClick={handleShareEmail}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Send via Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {smsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Send SMS</h2>
              </div>
              <button
                onClick={() => setSmsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSmsSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="to"
                      name="to"
                      value={smsForm.to}
                      onChange={handleSmsChange}
                      placeholder="+91XXXXXXXXXX"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        smsErrors.to ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {smsErrors.to && <p className="mt-1 text-sm text-red-600">{smsErrors.to}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      value={smsForm.message}
                      onChange={handleSmsChange}
                      rows={4}
                      placeholder="Enter your message (10-160 characters)"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        smsErrors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <div className="flex justify-between mt-1">
                      <span className={`text-sm ${
                        smsForm.message.length > 160 ? 'text-red-600' :
                        smsForm.message.length >= 10 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {smsForm.message.length}/160
                      </span>
                      {smsErrors.message && <p className="text-sm text-red-600">{smsErrors.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSmsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={smsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {smsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Send SMS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewEvents;