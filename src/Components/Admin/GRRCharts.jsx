import React, { useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Professional SVG Icons with light colors
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const PDFIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
  </svg>
);

// Chart Card Component WITHOUT Footer
const ChartCard = ({ title, children, chartId }) => {
  const chartRef = useRef(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleDownloadImage = async () => {
    if (!chartRef.current) return;
    
    const chartElement = chartRef.current;
    const buttons = chartElement.querySelectorAll('.footer-buttons button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading chart:', error);
    } finally {
      buttons.forEach(btn => btn.style.display = 'flex');
    }
  };

  const handleGeneratePDF = async () => {
    if (!chartRef.current) return;
    
    const chartElement = chartRef.current;
    const buttons = chartElement.querySelectorAll('.footer-buttons button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginLeft = (297 - imgWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', marginLeft, 10, imgWidth, imgHeight);
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      buttons.forEach(btn => btn.style.display = 'flex');
    }
  };

  const handleViewPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <div
        className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm"
        ref={chartRef}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text text-gray-900">{title}</h3>
        </div>

        {/* Chart */}
        <div className="chart-content">
          {children}
        </div>

        {/* Removed footer from individual charts */}
      </div>

      {/* Popup Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex-grow overflow-auto">
              <div className="h-[70vh]">
                {React.cloneElement(children, {
                  margin: { top: 20, right: 30, left: 40, bottom: 20 }
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main GRRCharts Component
const GRRCharts = ({ results, formData }) => {
  if (!results || !formData) return null;

  // Get current date and time
  const currentDateTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Get gage name and number from formData
  const gageName = formData.studyName || formData.gageName || "N/A";
  const gageNumber = formData.gageNumber || "N/A";

  // Calculate chart data from measurement data
  const chartData = useMemo(() => {
    const { measurementData, numberOfAppraisers, numberOfParts, numberOfTrials } = formData;
    const data = [];

    let subgroupIndex = 0;
    for (let a = 1; a <= numberOfAppraisers; a++) {
      const appraiserKey = a.toString();
      const appraiserData = measurementData[appraiserKey] || {};

      for (let p = 1; p <= numberOfParts; p++) {
        const partKey = p.toString();
        const partData = appraiserData[partKey] || {};
        const values = [];

        for (let t = 1; t <= numberOfTrials; t++) {
          const trialKey = t.toString();
          const value = partData[trialKey];
          if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
            values.push(parseFloat(value));
          }
        }

        if (values.length > 0) {
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          const range = Math.max(...values) - Math.min(...values);

          subgroupIndex++;
          data.push({
            subgroup: subgroupIndex,
            average: Number(average.toFixed(2)),
            range: Number(range.toFixed(3)),
            appraiser: a,
            part: p
          });
        }
      }
    }

    return data;
  }, [formData.measurementData, formData.numberOfAppraisers, formData.numberOfParts, formData.numberOfTrials]);

  // Calculate control limits
  const controlLimits = useMemo(() => {
    if (chartData.length === 0) return { ucl: 0, lcl: 0, avg: 0, uclRange: 0, lclRange: 0, avgRange: 0 };

    const averages = chartData.map(d => d.average);
    const ranges = chartData.map(d => d.range);

    const avg = averages.reduce((a, b) => a + b, 0) / averages.length;
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;

    const ucl = avg + (0.577 * avgRange);
    const lcl = avg - (0.577 * avgRange);
    const uclRange = 2.574 * avgRange;
    const lclRange = 0;

    return { ucl, lcl, avg, uclRange, lclRange, avgRange };
  }, [chartData]);

  // Prepare data with control limits
  const xbarChartData = chartData.map(d => ({
    ...d,
    ucl: controlLimits.ucl,
    lcl: controlLimits.lcl,
    centerLine: controlLimits.avg
  }));

  const rangeChartData = chartData.map(d => ({
    ...d,
    ucl: controlLimits.uclRange,
    lcl: controlLimits.lclRange,
    avgRange: controlLimits.avgRange
  }));

  // Part vs Appraiser chart data - FIXED
  const partVsAppraiserData = useMemo(() => {
    const { measurementData, numberOfAppraisers, numberOfParts, numberOfTrials } = formData;
    const partData = [];

    for (let p = 1; p <= numberOfParts; p++) {
      const partKey = p.toString();
      const partEntry = { part: p, name: `Part ${p}` };

      for (let a = 1; a <= numberOfAppraisers; a++) {
        const appraiserKey = a.toString();
        const appraiserData = measurementData[appraiserKey] || {};
        const partMeasurements = appraiserData[partKey] || {};
        const values = [];

        for (let t = 1; t <= numberOfTrials; t++) {
          const trialKey = t.toString();
          const value = partMeasurements[trialKey];
          if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
            values.push(parseFloat(value));
          }
        }

        if (values.length > 0) {
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          // Use string key to ensure proper data binding
          partEntry[`appraiser${a}`] = Number(average.toFixed(3));
        } else {
          partEntry[`appraiser${a}`] = null;
        }
      }

      partData.push(partEntry);
    }

    return partData;
  }, [formData.measurementData, formData.numberOfAppraisers, formData.numberOfParts, formData.numberOfTrials]);

  return (
    <div className="space-y-6">
      {/* All charts without individual footers */}
      {/* Average X Bar Chart */}
      <ChartCard 
        title="Average X Bar Chart" 
        chartId="xbar-chart"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={xbarChartData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="subgroup" 
              label={{ 
                value: 'Subgroup', 
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              stroke="#666"
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ 
                value: 'Average', 
                angle: -90, 
                position: 'left',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              domain={[controlLimits.lcl - 0.01, controlLimits.ucl + 0.01]}
              stroke="#666"
              tickFormatter={(value) => value.toFixed(2)}
              padding={{ top: 10, bottom: 10 }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="ucl" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="UCL"
            />
            <Line 
              type="monotone" 
              dataKey="centerLine" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="Average"
            />
            <Line 
              type="monotone" 
              dataKey="lcl" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="LCL"
            />
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#3b82f6" 
              strokeWidth={1.5}
              dot={{ r: 3 }}
              name="Data"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Range Chart */}
      <ChartCard 
        title="Range Chart" 
        chartId="range-chart"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={rangeChartData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="subgroup" 
              label={{ 
                value: 'Subgroup', 
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              stroke="#666"
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              label={{ 
                value: 'Range', 
                angle: -90, 
                position: 'left',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              domain={[0, Math.max(controlLimits.uclRange * 1.2, 0.02)]}
              stroke="#666"
              tickFormatter={(value) => value.toFixed(2)}
              padding={{ top: 10, bottom: 10 }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Line 
              type="monotone" 
              dataKey="ucl" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="UCL"
            />
            <Line 
              type="monotone" 
              dataKey="range" 
              stroke="#3b82f6" 
              strokeWidth={1.5}
              dot={{ r: 3 }}
              name="Range"
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="avgRange" 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Average"
            />
            <Line 
              type="monotone" 
              dataKey="lcl" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="LCL"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Part vs Appraiser Chart */}
      <ChartCard 
        title="Part V/s Appraiser Chart" 
        chartId="part-appraiser-chart"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={partVsAppraiserData} 
            margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="part" 
              label={{ 
                value: "Parts", 
                position: 'bottom',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              stroke="#666"
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 11 }}
              type="number"
              domain={[0.5, formData.numberOfParts + 0.5]}
              tickCount={formData.numberOfParts}
            />
            <YAxis 
              label={{ 
                value: 'Measurement', 
                angle: -90, 
                position: 'left',
                offset: 0,
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
              stroke="#666"
              tickFormatter={(value) => value.toFixed(3)}
              padding={{ top: 10, bottom: 10 }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value, name) => [value !== null ? value.toFixed(3) : 'N/A', name]}
              labelFormatter={(label) => `Part ${label}`}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            {Array.from({ length: formData.numberOfAppraisers }, (_, i) => {
              const appraiserNum = i + 1;
              // Use distinct colors: blue, magenta/pink, red for better visibility
              const colors = ["#3b82f6", "#ec4899", "#ef4444", "#f59e0b", "#8b5cf6"];
              const markers = ["", "square", "diamond"];
              return (
                <Line
                  key={`appraiser-${appraiserNum}`}
                  type="monotone"
                  dataKey={`appraiser${appraiserNum}`}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: colors[i % colors.length] }}
                  activeDot={{ r: 7 }}
                  name={`Appraiser #${appraiserNum}`}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Single Footer for all charts - Added outside all chart cards */}
      <div className="border-t-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm mt-6">
        <div className="flex justify-between items-center">
          {/* Left side: Date and Time */}
          <div className="text-sm text-gray-700 font-medium">
             {currentDateTime}
          </div>
          
          {/* Right side: Gage information displayed separately */}
          <div className="flex space-x-6">
            {/* Gage Number */}
            <div className="text-sm text-gray-700">
              <span className="font-medium">Gage Number:</span> {gageNumber || "N/A"}
            </div>
            
            {/* Gage Name */}
            <div className="text-sm text-gray-700">
              <span className="font-medium">Gage Name:</span> {gageName || "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRRCharts;