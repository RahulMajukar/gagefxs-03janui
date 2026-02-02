// src/components/dashboard/SidebarStats.jsx
import React from 'react';
import { Filter, Download } from 'lucide-react';

const SidebarStats = ({ allGauges, summaryData }) => {
  const total = allGauges.length;

  return (
    <div className="space-y-6">
      {/* Priority Dispatch */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-medium text-gray-900 mb-4">Priority Dispatch</h3>
        <div className="space-y-4">
          {[
            { key: 'high', label: 'High Priority', color: 'red', count: allGauges.filter(g => g.priority === 'high').length },
            { key: 'medium', label: 'Medium Priority', color: 'yellow', count: allGauges.filter(g => g.priority === 'medium').length },
            { key: 'low', label: 'Low Priority', color: 'green', count: allGauges.filter(g => g.priority === 'low').length }
          ].map(({ key, label, color, count }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className={`font-medium text-${color}-600`}>
                  {label} ({count})
                </span>
                <span className="text-sm text-gray-500">
                  {key === 'high' ? 'Send first to calibration'
                    : key === 'medium' ? 'Schedule within week'
                    : 'Can wait if needed'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-${color}-600 h-2 rounded-full`}
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-medium text-gray-900 mb-4">Quick Analytics</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span>On-Time Rate</span>
              <span className="font-medium text-green-600">
                {total ? Math.round((summaryData.calibratedOnTime / total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${total ? (summaryData.calibratedOnTime / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span>Avg. Turnaround Time</span>
              <span className="font-medium text-blue-600">7.2 days</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SidebarStats;