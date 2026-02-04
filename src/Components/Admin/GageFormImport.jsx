// src/components/GageFormImport.jsx - Updated with Calendar Event Creation
import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Upload, X, Check, AlertCircle, Loader, FileText, Layers, FileSpreadsheet, Calendar } from "lucide-react";
import api from "../../api/axios";

const GageFormImport = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [importMode, setImportMode] = useState("single"); // "single" or "all"
  const [importResults, setImportResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [allSheetsData, setAllSheetsData] = useState({});
  const [totalGagesCount, setTotalGagesCount] = useState(0);
  const [calendarEventsCreated, setCalendarEventsCreated] = useState(0);
  const fileInputRef = useRef(null);

  // Location mapping for Excel locations to API locations
  const LOCATION_MAP_IMPORT = {};

  // Criticality mapping for calendar priority
  const CRITICALITY_PRIORITY_MAP = {
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low"
  };

  // Function to create calendar event for a gage
  const createCalendarEvent = async (gageData, gageTypeName) => {
    console.log(`Gage data `,gageData);
    console.log(`gageType`, gageTypeName);

    try {
      if (!gageData.nextCalibrationDate) {
        console.warn(`No calibration date for serial ${gageData.serialNumber}, skipping calendar event`);
        return { success: false, error: "No calibration date" };
      }

      // Format the date for the calendar API
      const startDate = new Date(gageData.nextCalibrationDate);
      const endDate = new Date(gageData.nextCalibrationDate);

      // Set times for the event
      startDate.setHours(9, 0, 0, 0); // Start at 9:00 AM
      endDate.setHours(10, 0, 0, 0); // End at 5:00 PM
      endDate.setDate(endDate.getDate()); // End on next day
      const eventData = {
        title: `${gageTypeName || 'Gage'} Calibration`,
        description: `Calibration due for ${gageData.modelNumber || 'Gage'} (SN: ${gageData.serialNumber})`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        category: "scheduled",
        priority: CRITICALITY_PRIORITY_MAP[gageData.criticality] || "medium",
        location: gageData.location || "",
        gageName: gageData.gageName,
        attendees: ["calibartion.system", "planthod.system"],
        reminders: [{ type: "popup", minutes: 15 }],
        isAllDay: false,
        allDayType: "single-day",
        isRecurring: false,
        recurrence: null,
        color: "#3b82f6",
        username: localStorage.getItem("username") || "itadmin.system"
      };

      // Add gage-specific metadata
      eventData.gageId = gageData.id;
      eventData.serialNumber = gageData.serialNumber;

      console.log("Creating calendar event with data:", eventData);

      const response = await api.post("/calendar/events", eventData);
      console.log(`Calendar event created successfully for serial ${gageData.serialNumber}`);

      setCalendarEventsCreated(prev => prev + 1);
      return { success: true, data: response.data };

    } catch (error) {
      console.error(`Failed to create calendar event for serial ${gageData.serialNumber}:`, error);
      let errorMessage = "Unknown error occurred";

      if (error.response) {
        errorMessage = `Server error: ${error.response.status}`;
        if (error.response.data?.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage = "No response from calendar server";
      } else {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrorMessage("");
      setImportResults(null);
      setParsedData([]);
      setAllSheetsData({});
      setTotalGagesCount(0);
      setCalendarEventsCreated(0);

      // Read workbook and get sheet names
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetNames = workbook.SheetNames.filter(name =>
            !name.toLowerCase().includes('sheet') ||
            workbook.Sheets[name]['!ref']
          );
          setSheetNames(sheetNames);

          // Parse all sheets data
          const allData = {};
          let totalCount = 0;

          sheetNames.forEach(sheetName => {
            const data = parseSheetData(workbook, sheetName);
            allData[sheetName] = data;
            totalCount += data.length;
          });

          setAllSheetsData(allData);
          setTotalGagesCount(totalCount);

          // Select first sheet by default for single mode
          if (sheetNames.length > 0) {
            setSelectedSheet(sheetNames[0]);
            setParsedData(allData[sheetNames[0]] || []);
          }
        } catch (error) {
          setErrorMessage("Error reading Excel file: " + error.message);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  // Parse sheet data (keep existing parseSheetData function as is)
  const parseSheetData = (workbook, sheetName) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return [];
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let headerRowIndex = -1;
      let headers = [];

      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && row.length > 0) {
          const firstCell = row[0]?.toString().toLowerCase().trim();
          const secondCell = row[1]?.toString().toLowerCase().trim();

          if (
            firstCell.includes('sl') ||
            firstCell.includes('no') ||
            (secondCell && (
              secondCell.includes('description') ||
              secondCell.includes('item')
            ))
          ) {
            headerRowIndex = i;
            headers = row.map(cell => cell?.toString().trim() || '');
            break;
          }
        }
      }

      if (headerRowIndex === -1 || headers.length < 5) {
        return [];
      }

      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          const cleanHeader = header.toLowerCase()
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanHeader.includes('sl') && cleanHeader.includes('no')) {
            headerMap['sl_no'] = index;
          } else if (cleanHeader.includes('description') || cleanHeader.includes('item')) {
            headerMap['description'] = index;
          } else if (cleanHeader.includes('history') || cleanHeader.includes('card')) {
            headerMap['history_card'] = index;
          } else if (cleanHeader.includes('periodicity') || cleanHeader.includes('calibration')) {
            headerMap['periodicity'] = index;
          } else if (cleanHeader.includes('identification') || cleanHeader.includes('mark')) {
            headerMap['identification'] = index;
          } else if (cleanHeader.includes('location')) {
            headerMap['location'] = index;
          } else if (cleanHeader.includes('cal') && cleanHeader.includes('due')) {
            headerMap['cal_due'] = index;
          }
        }
      });

      const dataRows = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        if (!row || row.length === 0 ||
          row[0]?.toString().includes('Prepared By') ||
          row[0]?.toString().includes('Approved By')) {
          continue;
        }

        const hasData = Object.values(headerMap).some(index =>
          row[index] && row[index].toString().trim()
        );

        if (hasData) {
          const rowData = {
            sheetName: sheetName,
            sl_no: row[headerMap['sl_no']]?.toString().trim() || '',
            description: row[headerMap['description']]?.toString().trim() || '',
            history_card: row[headerMap['history_card']]?.toString().trim() || '',
            periodicity: row[headerMap['periodicity']]?.toString().trim() || '',
            identification: row[headerMap['identification']]?.toString().trim() || '',
            location: row[headerMap['location']]?.toString().trim() || '',
            cal_due: row[headerMap['cal_due']]?.toString().trim() || ''
          };
          dataRows.push(rowData);
        }
      }

      return dataRows;

    } catch (error) {
      console.error("Error parsing sheet data:", error);
      return [];
    }
  };

  // Convert Excel date format to ISO format (keep existing function)
  const convertExcelDate = (excelDate) => {
    if (!excelDate || excelDate.toString().trim() === '') {
      return null;
    }

    const dateStr = excelDate.toString().trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.split(' ')[0];
    }

    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        let day, month, year;
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else if (parts[2].length === 4) {
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }

        if (day && month && year) {
          const paddedMonth = month.padStart(2, '0');
          const paddedDay = day.padStart(2, '0');
          return `${year}-${paddedMonth}-${paddedDay}`;
        }
      }
    }

    try {
      if (!isNaN(dateStr) && dateStr > 25569) {
        const date = new Date((dateStr - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error parsing date:', e, dateStr);
    }

    console.warn('Could not parse date:', excelDate);
    return null;
  };

  // Convert periodicity to months (keep existing function)
  const getCalibrationInterval = (periodicity) => {
    if (!periodicity) return 12;

    const period = periodicity.toLowerCase().trim();

    if (period.includes('year') || period === 'yearly') {
      return 12;
    } else if (period.includes('month') || period === 'monthly') {
      return 1;
    } else if (period.includes('quarter') || period.includes('3')) {
      return 3;
    } else if (period.includes('semi') || period.includes('6')) {
      return 6;
    } else {
      const match = period.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > 0) return num;
      }
      return 12;
    }
  };

  // Calculate pending calibration date (keep existing function)
  const calculatePendingCalibrationDate = (nextCalibrationDate, criticality = "MEDIUM") => {
    if (!nextCalibrationDate) return nextCalibrationDate;

    const date = new Date(nextCalibrationDate);

    if (criticality === "HIGH") {
      return date.toISOString().split('T')[0];
    } else if (criticality === "MEDIUM") {
      date.setDate(date.getDate() + 10);
      return date.toISOString().split('T')[0];
    } else if (criticality === "LOW") {
      date.setDate(date.getDate() + 15);
      return date.toISOString().split('T')[0];
    }

    return nextCalibrationDate;
  };

  // Process import based on selected mode - UPDATED WITH CALENDAR EVENT CREATION
  const processImport = async () => {
    if (!file) {
      setErrorMessage("Please select a file");
      return;
    }

    if (importMode === "single" && (!selectedSheet || parsedData.length === 0)) {
      setErrorMessage("Please select a sheet with valid data");
      return;
    }

    if (importMode === "all" && totalGagesCount === 0) {
      setErrorMessage("No valid data found in any sheet");
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResults(null);
    setErrorMessage("");
    setCalendarEventsCreated(0);

    try {
      const results = [];
      let successfulCount = 0;
      let failedCount = 0;
      let calendarEventsCount = 0;
      let totalRows = 0;

      // Prepare data based on import mode
      let dataToProcess = [];

      if (importMode === "single") {
        dataToProcess = parsedData.map(row => ({ ...row, sheetName: selectedSheet }));
        totalRows = parsedData.length;
      } else {
        Object.keys(allSheetsData).forEach(sheetName => {
          const sheetData = allSheetsData[sheetName];
          sheetData.forEach(row => {
            dataToProcess.push({ ...row, sheetName });
          });
        });
        totalRows = totalGagesCount;
      }

      // Process each row sequentially
      for (let i = 0; i < dataToProcess.length; i++) {
        const row = dataToProcess[i];

        // Validate required fields
        if (!row.description || !row.history_card || !row.identification || !row.location || !row.cal_due) {
          results.push({
            sheetName: row.sheetName,
            index: i + 1,
            row: row,
            success: false,
            calendarEventCreated: false,
            error: `Missing required fields: ${!row.description ? 'DESCRIPTION ' : ''}${!row.history_card ? 'HISTORY CARD ' : ''}${!row.identification ? 'IDENTIFICATION ' : ''}${!row.location ? 'LOCATION ' : ''}${!row.cal_due ? 'CAL DUE ' : ''}`
          });
          failedCount++;
          continue;
        }

        // Convert next calibration date
        const nextCalibrationDate = convertExcelDate(row.cal_due);

        // Validate date conversion
        if (!nextCalibrationDate) {
          results.push({
            sheetName: row.sheetName,
            index: i + 1,
            row: row,
            success: false,
            calendarEventCreated: false,
            error: `Invalid date format: ${row.cal_due}`
          });
          failedCount++;
          continue;
        }

        // Prepare API data with proper field mapping
        const criticality = "MEDIUM"; // Default criticality for imported gages
        const apiData = {
          gageTypeName: row.sheetName,
          manufacturerId: "1",
          modelNumber: row.history_card,
          serialNumber: row.identification,
          gageSubTypeId: "1",
          measurementRange: "",
          accuracy: "",
          purchaseDate: new Date().toISOString().split('T')[0],
          calibrationInterval: getCalibrationInterval(row.periodicity),
          nextCalibrationDate: nextCalibrationDate,
          pendingCalibrationDate: calculatePendingCalibrationDate(nextCalibrationDate, criticality),
          maxUsersNumber: "1",
          usageFrequency: "MONTHLY",
          criticality: criticality,
          location: row.location || "SHOP_FLOOR",
          notes: `Imported from Excel sheet: ${row.sheetName}. Original description: ${row.description}`,
          codeType: "BOTH",
          id_mark: row.identification,
          gageName: row.description
        };

        try {
          // Create the gage first
          const formData = new FormData();
          Object.keys(apiData).forEach(key => {
            if (apiData[key] !== null && apiData[key] !== undefined) {
              formData.append(key, apiData[key]);
            }
          });

          console.log("Creating gage for row:", i + 1, apiData);

          const response = await api.post("/gages/upload", formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const createdGage = response.data;

          // ✅ CREATE CALENDAR EVENT FOR THE GAGE
          let calendarEventResult = null;
          try {
            calendarEventResult = await createCalendarEvent({
              ...apiData,
              id: createdGage.id, // Use the created gage ID
              modelNumber: createdGage.modelNumber,
              serialNumber: createdGage.serialNumber,
              criticality: createdGage.criticality || criticality,
              location: createdGage.location || apiData.location,
              nextCalibrationDate: createdGage.nextCalibrationDate || nextCalibrationDate,
              gageName: createdGage.gageName || apiData.gageName
            }, row.sheetName);

            if (calendarEventResult.success) {
              calendarEventsCount++;
              console.log(`Calendar event created for gage ${createdGage.serialNumber}`);
            } else {
              console.warn(`Calendar event failed for gage ${createdGage.serialNumber}:`, calendarEventResult.error);
            }
          } catch (calendarError) {
            console.error(`Calendar event creation error for gage ${createdGage.serialNumber}:`, calendarError);
            calendarEventResult = { success: false, error: calendarError.message };
          }

          results.push({
            sheetName: row.sheetName,
            index: i + 1,
            row: row,
            success: true,
            calendarEventCreated: calendarEventResult?.success || false,
            calendarEventError: calendarEventResult?.error,
            data: createdGage,
            error: null
          });
          successfulCount++;

        } catch (error) {
          let errorMessage = "Unknown error occurred";
          if (error.response) {
            errorMessage = `Server error: ${error.response.status}`;
            if (error.response.data?.message) {
              errorMessage += ` - ${error.response.data.message}`;
            }
            if (error.response.data?.errors) {
              errorMessage += ` - ${JSON.stringify(error.response.data.errors)}`;
            }
          } else if (error.request) {
            errorMessage = "No response from server. Please check your network connection.";
          } else {
            errorMessage = error.message;
          }

          results.push({
            sheetName: row.sheetName,
            index: i + 1,
            row: row,
            success: false,
            calendarEventCreated: false,
            error: errorMessage
          });
          failedCount++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / totalRows) * 100));

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Set results
      setImportResults({
        success: true,
        totalRows: totalRows,
        processedRows: results.length,
        results: results,
        summary: {
          successful: successfulCount,
          failed: failedCount,
          calendarEventsCreated: calendarEventsCount
        }
      });

      // Call completion callback
      if (onImportComplete) {
        onImportComplete({
          success: true,
          totalRows: totalRows,
          successful: successfulCount,
          failed: failedCount,
          calendarEventsCreated: calendarEventsCount
        });
      }

    } catch (error) {
      setErrorMessage("Error processing import: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheet("");
    setImportMode("single");
    setImportResults(null);
    setParsedData([]);
    setAllSheetsData({});
    setTotalGagesCount(0);
    setCalendarEventsCreated(0);
    setProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Preview parsed data (keep existing renderDataPreview function as is)
  const renderDataPreview = () => {
    if (importMode === "single" && parsedData.length === 0) return null;
    if (importMode === "all" && totalGagesCount === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
        <h4 className="font-semibold mb-2">
          {importMode === "single"
            ? `Data Preview for "${selectedSheet}" (first 5 rows):`
            : `Data Summary - All Sheets (${totalGagesCount} total gages):`
          }
        </h4>

        {importMode === "single" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 border">SL No.</th>
                  <th className="px-2 py-1 border">Description</th>
                  <th className="px-2 py-1 border">History Card</th>
                  <th className="px-2 py-1 border">Periodicity</th>
                  <th className="px-2 py-1 border">Identification</th>
                  <th className="px-2 py-1 border">Location</th>
                  <th className="px-2 py-1 border">Cal Due</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border">{row.sl_no}</td>
                    <td className="px-2 py-1 border">{row.description}</td>
                    <td className="px-2 py-1 border">{row.history_card}</td>
                    <td className="px-2 py-1 border">{row.periodicity}</td>
                    <td className="px-2 py-1 border">{row.identification}</td>
                    <td className="px-2 py-1 border">{row.location}</td>
                    <td className="px-2 py-1 border">{row.cal_due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 5 && (
              <p className="text-xs text-gray-500 mt-1">
                ... and {parsedData.length - 5} more rows
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {Object.keys(allSheetsData).map(sheetName => {
              const sheetData = allSheetsData[sheetName];
              if (sheetData.length === 0) return null;

              return (
                <div key={sheetName} className="flex items-center justify-between p-2 bg-white border rounded">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-600" />
                    <span className="font-medium">{sheetName}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {sheetData.length} gages
                  </span>
                </div>
              );
            })}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                <strong>Total:</strong> {totalGagesCount} gages across {Object.keys(allSheetsData).length} sheet(s)
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Import Bulk Gages</h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Excel File</label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {file && (
            <button
              onClick={resetForm}
              className="p-2 text-red-600 hover:text-red-800"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Import Mode Selection */}
      {sheetNames.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Import Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setImportMode("single")}
              className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${importMode === "single"
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <FileText size={24} className="mb-2" />
              <span className="font-medium">Single Sheet</span>
              <span className="text-sm mt-1">Import from selected sheet only</span>
            </button>

            <button
              type="button"
              onClick={() => setImportMode("all")}
              className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${importMode === "all"
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Layers size={24} className="mb-2" />
              <span className="font-medium">All Sheets</span>
              <span className="text-sm mt-1">Import from all sheets</span>
            </button>
          </div>
        </div>
      )}

      {/* Sheet Selection (only for single mode) */}
      {sheetNames.length > 0 && importMode === "single" && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Sheet</label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Sheet --</option>
            {sheetNames.map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName} ({allSheetsData[sheetName]?.length || 0} gages)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Data Preview */}
      {(parsedData.length > 0 || totalGagesCount > 0) && renderDataPreview()}

      {/* Import Button */}
      <div className="mb-6">
        <button
          onClick={processImport}
          disabled={!file || isImporting ||
            (importMode === "single" && (!selectedSheet || parsedData.length === 0)) ||
            (importMode === "all" && totalGagesCount === 0)}
          className={`w-full px-6 py-3 rounded-md font-medium text-white ${!file || isImporting ||
              (importMode === "single" && (!selectedSheet || parsedData.length === 0)) ||
              (importMode === "all" && totalGagesCount === 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {isImporting ? (
            <div className="flex items-center justify-center">
              <Loader className="animate-spin mr-2" size={20} />
              Importing... {progress}%
              {calendarEventsCreated > 0 && (
                <span className="ml-2 text-sm bg-blue-800 px-2 py-1 rounded">
                  Events: {calendarEventsCreated}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Upload size={20} className="mr-2" />
              {importMode === "single"
                ? `Import ${parsedData.length} Gages from "${selectedSheet}"`
                : `Import ${totalGagesCount} Gages from All Sheets`
              }
            </div>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {isImporting && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Processing: {progress}% complete</span>
            {calendarEventsCreated > 0 && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Calendar events: {calendarEventsCreated}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Field Mapping Info - Updated with Calendar Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">Field Mapping & Features:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Sheet Name</strong> → Gage Type</li>
          <li>• <strong>HISTORY CARD NO.</strong> → Model Number</li>
          <li>• <strong>IDENTIFICATION MARK</strong> → Serial Number & id_mark</li>
          <li>• <strong>LOCATION</strong> → Location (mapped to API values)</li>
          <li>• <strong>CAL DUE ON</strong> → Next Calibration Date & Calendar Event</li>
          <li>• <strong>PERIODICITY OF CALIBRATION</strong> → Calibration Interval (months)</li>
          <li>• <strong>DESCRIPTION OF ITEM</strong> → Gage Name</li>
          <li className="flex items-center gap-1">
            <Calendar size={14} />
            <strong>Auto Calendar Events:</strong> Calendar events will be created for each gage with calibration due date
          </li>
          <li className="flex items-center gap-1">
            <Calendar size={14} />
            <strong>Event Details:</strong> 9 AM - 5 PM, 15 min reminder, "calibartion.system" attendee
          </li>
        </ul>
      </div>

      {/* Results - Updated with Calendar Events Info */}
      {importResults && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Import Results</h3>

          {importResults.success ? (
            <>
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <div className="flex items-center gap-2">
                  <Check size={20} />
                  <span>Import completed successfully!</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold text-blue-800">Total Rows</h4>
                  <p className="text-2xl font-bold">{importResults.totalRows}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-semibold text-green-800">Successful</h4>
                  <p className="text-2xl font-bold">{importResults.summary.successful}</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold text-red-800">Failed</h4>
                  <p className="text-2xl font-bold">{importResults.summary.failed}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                  <h4 className="font-semibold text-purple-800">Calendar Events</h4>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-purple-600" />
                    <p className="text-2xl font-bold">{importResults.summary.calendarEventsCreated}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Results with Calendar Event Status */}
              {importResults.results && importResults.results.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Detailed Results</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sheet</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gage Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calendar</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importResults.results.map((result, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{result.sheetName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{result.index}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {result.row.description || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {result.row.history_card || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {result.row.identification || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {result.success ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {result.success && result.calendarEventCreated ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  <Calendar size={12} className="mr-1" />
                                  Created
                                </span>
                              ) : result.success && !result.calendarEventCreated ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Failed
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 max-w-xs truncate">
                              {result.error || result.calendarEventError || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span>Import failed: {importResults.error}</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GageFormImport;