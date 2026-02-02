// src/components/PlantHeadDash.jsx
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
        {/* Top Animation Section (INSIDE CARD) */}
        <div
          className={`
            w-full h-64
            flex items-center justify-center
            ${gradient}
            border-b border-gray-200
          `}
        >
          <Lottie
            animationData={animation}
            loop
            autoplay
            className="w-56 h-56"
          />
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col h-[calc(100%-16rem)]">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm text-center leading-relaxed flex-grow">
            {description}
          </p>

          {/* CTA */}
          <div className="mt-4 text-center">
            <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Open Module →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const PlantHeadDash = () => {
  const cards = [
    {
      title: 'Calibration Manager',
      description:
        'Monitor and manage calibration workflows across departments.',
      to: '/admin/calibration',
      animation: CalibrationManagerAnim,
      gradient: 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
    },
    {
      title: 'User Manager',
      description:
        'Manage user accounts, roles, and access permissions securely.',
      to: '/it-admin/users',
      animation: InventoryManagerAnim,
      gradient: 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4 py-8 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            Plant Head Dashboard
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Monitor, manage, and optimize plant operations efficiently.
          </p>

          <div className="flex justify-center mt-6">
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          </div>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-8">
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

export default PlantHeadDash;
