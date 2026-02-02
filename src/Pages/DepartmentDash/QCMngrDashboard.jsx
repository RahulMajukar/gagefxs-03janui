// src/components/QCMngrDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';

// Lottie animations
import InventoryManagerAnim from '../../assets/InventoryManager.json';
import CalibrationManagerAnim from '../../assets/CalibrationManager.json';

const DashboardCard = ({ title, description, to, animation, gradient }) => {
  return (
    <Link to={to} className="block h-full no-underline group">
      <div
        className="
          h-full rounded-2xl overflow-hidden
          bg-white
          border border-gray-200
          shadow-md transition-all duration-300
          hover:shadow-xl hover:-translate-y-1
        "
      >
        {/* Animation Section */}
        <div
          className={`
            w-full h-56
            flex items-center justify-center
            ${gradient}
            border-b border-gray-200
          `}
        >
          <Lottie
            animationData={animation}
            loop
            autoplay
            className="w-65 h-60"
          />
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col items-center text-center h-[calc(100%-14rem)]">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {title}
          </h3>

          {/* Blue Button (Always Visible) */}
          {/* <button
            className="
              px-5 py-2 rounded-lg
              bg-blue-600 text-white text-sm font-medium
              hover:bg-blue-700 transition
            "
          >
            Open Module
          </button> */}

          {/* Description (Hidden → Show on Hover) */}
          <p
            className="
              mt-4 text-sm leading-relaxed
              text-blue-600
              opacity-0 max-h-0
              group-hover:opacity-100 group-hover:max-h-40
              transition-all duration-300
            "
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

const QCMngrDashboard = () => {
  const cards = [
    {
      title: 'Inventory Manager',
      description:
        'Access inventory insights, manage assets, and monitor stock availability efficiently.',
      to: '/dashboard/admin',
      animation: InventoryManagerAnim,
      gradient: 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100',
    },
    {
      title: 'Calibration Manager',
      description:
        'Control calibration schedules, instruments, and compliance with precision.',
      to: '/admin/calibration',
      animation: CalibrationManagerAnim,
      gradient: 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4 py-8 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            QC Manager Dashboard
          </h1>

          <div className="flex justify-center mt-6">
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          </div>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {cards.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              description={card.description}
              to={card.to}
              animation={card.animation}
              gradient={card.gradient}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QCMngrDashboard;
