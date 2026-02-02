// src/components/dashboard/Header.jsx
import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  return (
    <div className="bg-blue-500 shadow-sm border-b">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {/* <h1 className="text-2xl font-bold text-white">Plant Head Dashboard</h1> */}
            {localStorage.getItem('userRole') === 'IT_ADMIN' && (
              <h1 className="text-2xl font-bold text-white">QC Manager Dashboard</h1>
            )}
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Dashboard
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCalendarClick}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-600">Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;