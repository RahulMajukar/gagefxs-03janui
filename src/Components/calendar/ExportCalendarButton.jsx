// ExportCalendarButton.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ExportCalendarButton = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const transformEvents = (events) => {
    return events
      .filter(event => event.start)
      .map((event, index) => {
        const eventDate = new Date(event.start);
        const month = MONTHS[eventDate.getMonth()];
        
        const description = event.description || '';
        const idMatch = description.match(/for\s+(HC\/\d+\/\d+)/);
        const snMatch = description.match(/\(SN:\s*(.*?)\)/);
        
        const idNo = idMatch ? idMatch[1] : `HC/01/${index + 1}`;
        const serialNo = snMatch ? snMatch[1] : '';
        
        let instrumentName = event.title.replace(' Calibration', '');
        if (serialNo) {
          instrumentName = `${instrumentName} ${serialNo}`;
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
          location: event.location || 'SHOP_FLOOR'
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate)
      .map((event, index) => ({ ...event, slNo: index + 1 }));
  };

  const createExcelFile = (events) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const processedEvents = transformEvents(events);

    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    // Header
    wsData.push(['HIGH TENSILE FASTNUTS (I) PVT. LTD.']);
    wsData.push(['PUNE']);
    wsData.push([`LIST OF INSTRUMENT & CALIBRATION CALENDAR: ${currentYear}-${nextYear.toString().slice(-2)}`]);
    wsData.push([`Exported on: ${new Date().toLocaleString()}`]);
    wsData.push([]);
    wsData.push([`Total Instruments: ${events.length}`]);
    wsData.push([]);
    
    // Column headers
    const headers = ['S.L.', 'Description', 'ID. NO.', 'CAL. FREQ.', ...MONTHS];
    wsData.push(headers);
    
    // Data rows
    processedEvents.forEach(event => {
      const row = [
        event.slNo,
        event.description,
        event.idNo,
        event.calFreq,
        ...MONTHS.map(month => event[month] || '')
      ];
      wsData.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      ...MONTHS.map(() => ({ wch: 8 }))
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Calibration Schedule');
    
    // Details sheet
    const detailsData = [
      ['Event Details'],
      [],
      ['SL.No', 'Instrument', 'ID', 'Calibration Date', 'Type', 'Location']
    ];
    
    processedEvents.forEach(event => {
      detailsData.push([
        event.slNo,
        event.description,
        event.idNo,
        event.rawDate.toLocaleDateString('en-IN'),
        event.eventType,
        event.location
      ]);
    });
    
    const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
    detailsWs['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, detailsWs, 'Event Details');
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Calibration_Schedule_${dateStr}.xlsx`);
  };

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const username = localStorage.getItem('username');
      if (!username) throw new Error('User email is required');
      
      const response = await fetch('http://localhost:8080/api/calendar/events', {
        headers: {
          'User-Email': username
        }
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const events = await response.json();
      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('No calendar events found');
      }

      createExcelFile(events);
      
      setStatus({
        type: 'success',
        message: `Exported ${events.length} events successfully!`
      });
      
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Export failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={handleExport}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${loading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
          text-white shadow hover:shadow-md
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export Calendar</span>
          </>
        )}
      </button>
      
      {status && (
        <div className={`mt-2 text-sm px-3 py-2 rounded ${
          status.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportCalendarButton;