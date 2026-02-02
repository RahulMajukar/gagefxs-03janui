import React from 'react';

const CalendarLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* No header/navbar or footer */}
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
};

export default CalendarLayout;