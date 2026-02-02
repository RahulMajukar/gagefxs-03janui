// src/components/RichAlertModal.jsx
import React, { useState, useEffect, useCallback } from 'react';

const RichAlertModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseTime = 2000,
  showCloseButton = true,
  overlayClose = true,
  icon: CustomIcon,
  confirmButtonStyle = 'primary',
  cancelButtonStyle = 'secondary',
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  animation = 'scale', // 'scale', 'fade', 'slide-up', 'slide-down'
  customContent,
  showProgressBar = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setProgress(100);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose && type !== 'confirm') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            onClose?.();
            return 0;
          }
          return prev - (100 / (autoCloseTime / 50));
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose, type]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget && overlayClose) {
      onClose?.();
    }
  }, [overlayClose, onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    if (type !== 'confirm') {
      onClose?.();
    }
  }, [onConfirm, onClose, type]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!isVisible) return null;

  // Icon configuration
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon />;
    
    const iconClass = "w-8 h-8";
    
    switch (type) {
      case 'success':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="rounded-full bg-yellow-100 p-2">
            <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        );
    }
  };

  // Color configuration
  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          progress: 'bg-green-500',
          button: confirmButtonStyle === 'primary' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-green-100 text-green-700 hover:bg-green-200'
        };
      case 'warning':
        return {
          progress: 'bg-yellow-500',
          button: confirmButtonStyle === 'primary' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        };
      case 'error':
        return {
          progress: 'bg-red-500',
          button: confirmButtonStyle === 'primary' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-red-100 text-red-700 hover:bg-red-200'
        };
      case 'confirm':
        return {
          progress: 'bg-blue-500',
          button: confirmButtonStyle === 'primary' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
      default:
        return {
          progress: 'bg-blue-500',
          button: confirmButtonStyle === 'primary' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
    }
  };

  // Size configuration
  const getSize = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      default: return 'max-w-md';
    }
  };

  // Animation configuration
  const getAnimation = () => {
    switch (animation) {
      case 'fade':
        return isOpen ? 'opacity-100' : 'opacity-0';
      case 'scale':
        return isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
      case 'slide-up':
        return isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';
      case 'slide-down':
        return isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4';
      default:
        return isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95';
    }
  };

  const colors = getColors();
  const sizeClass = getSize();
  const animationClass = getAnimation();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-0'
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClass} transform transition-all duration-300 ${animationClass}`}
      >
        {/* Progress Bar */}
        {autoClose && showProgressBar && (
          <div className="w-full bg-gray-200 rounded-t-2xl h-1">
            <div
              className={`h-1 rounded-t-2xl transition-all duration-50 ${colors.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Header */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
              )}
              
              {customContent ? (
                customContent
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {message}
                </p>
              )}
            </div>

            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={handleCancel}
                className="flex-shrink-0 rounded-full p-1 hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className={`flex ${type === 'confirm' ? 'justify-end space-x-3' : 'justify-center'}`}>
            {type === 'confirm' && (
              <button
                onClick={handleCancel}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                  cancelButtonStyle === 'primary' 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                colors.button
              } ${type === 'confirm' ? '' : 'w-full'}`}
              autoFocus={type === 'confirm'}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichAlertModal;