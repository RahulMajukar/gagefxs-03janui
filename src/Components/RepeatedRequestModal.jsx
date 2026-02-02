import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  createReallocateRequest, 
  isGageAvailableForReallocation,
  getCompletedReallocationsForGage,
  sendMail
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { 
  Package, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Calendar,
  User,
  Building,
  Settings,
  RotateCcw,
  History
} from 'lucide-react';

const RepeatedRequestModal = ({ isOpen, onClose, gageData, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    gageId: null,
    requestedBy: '',
    requestedByRole: 'F',
    requestedByFunction: '',
    requestedByOperation: '',
    timeLimit: 'ONE_DAY',
    reason: '',
    notes: ''
  });

  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isGageAvailable, setIsGageAvailable] = useState(true);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && gageData?.id) {
      setFormData({
        gageId: gageData.id,
        requestedBy: user?.username || '',
        requestedByRole: user?.role || 'F',
        requestedByFunction: user?.functionName || '',
        requestedByOperation: user?.operationName || '',
        timeLimit: 'ONE_DAY',
        reason: '',
        notes: ''
      });
      
      checkGageAvailability();
      loadCompletedHistory();
    }
  }, [isOpen, gageData, user]);

  const checkGageAvailability = async () => {
    if (!gageData?.id) return;
    
    try {
      const available = await isGageAvailableForReallocation(gageData.id);
      setIsGageAvailable(available);
    } catch (err) {
      console.error('Error checking gage availability:', err);
      setIsGageAvailable(false);
    }
  };

  const loadCompletedHistory = async () => {
    if (!gageData?.id) return;
    
    try {
      setLoadingHistory(true);
      const history = await getCompletedReallocationsForGage(gageData.id);
      setCompletedHistory(history);
    } catch (err) {
      console.error('Error loading completed history:', err);
      setCompletedHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const generateRepeatedRequestEmailHTML = (data) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔄 Repeated Gage Request</h1>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">New Reallocation Request</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; margin-bottom: 15px;">📋 Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Requested By:</td><td style="padding: 8px 0;">${data.requestedBy}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Gage Serial:</td><td style="padding: 8px 0;">${gageData?.serialNumber || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Gage Model:</td><td style="padding: 8px 0;">${gageData?.modelNumber || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Gage Type:</td><td style="padding: 8px 0;">${gageData?.gageType?.name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Function:</td><td style="padding: 8px 0;">${data.requestedByFunction}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Operation:</td><td style="padding: 8px 0;">${data.requestedByOperation}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Time Limit:</td><td style="padding: 8px 0;">${data.timeLimit}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Reason:</td><td style="padding: 8px 0;">${data.reason || 'Not specified'}</td></tr>
          </table>
        </div>

        ${messageText ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1976d2;">📝 Additional Message</h4>
          <p style="margin: 0; color: #333;">${messageText}</p>
        </div>
        ` : ''}

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #856404;">🔄 Repeated Request Notice</h4>
          <p style="margin: 0; color: #856404;">This operator has previously used this gage and is requesting it again. Please review and approve if the gage is available.</p>
        </div>

        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Action Required</h4>
          <p style="margin: 0; color: #721c24;">Please review this request and approve or reject it based on gage availability and operational requirements.</p>
        </div>
      </div>

      <div style="background: #6c757d; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0;">This is an automated notification from GageFX Management System</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
      </div>
    </div>
    `;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isGageAvailable) {
      setError('This gage is not available for reallocation at the moment');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the reallocation request');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        notes: `Repeated request from ${user?.username}. Previous usage completed. ${formData.notes || ''}`.trim()
      };

      const result = await createReallocateRequest(requestData);

      // Send email notification if enabled
      if (notifyByEmail) {
        try {
          const emailHTML = generateRepeatedRequestEmailHTML(formData);
          await sendMail({
            to: ['plant.hod@company.com'], // Update with actual Plant HOD email
            subject: `🔄 Repeated Gage Request - ${gageData?.serialNumber} by ${formData.requestedBy}`,
            html: emailHTML
          });
        } catch (emailErr) {
          console.warn('Failed to send email notification:', emailErr);
          // Don't fail the request if email fails
        }
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Error creating reallocation request:', err);
      setError(err.message || 'Failed to create reallocation request');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeLimitDisplayName = (timeLimit) => {
    const displayNames = {
      'TWO_HOURS': '2 Hours',
      'ONE_DAY': '1 Day',
      'ONE_WEEK': '1 Week',
      'ONE_MONTH': '1 Month',
      'CUSTOM': 'Custom'
    };
    return displayNames[timeLimit] || timeLimit;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Request Same Gage Again">
      <div className="space-y-6">
        {/* Gage Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Gage Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Serial Number:</span>
              <p className="text-gray-800">{gageData?.serialNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Model:</span>
              <p className="text-gray-800">{gageData?.modelNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Type:</span>
              <p className="text-gray-800">{gageData?.gageType?.name || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <p className="text-gray-800">
                {isGageAvailable ? (
                  <span className="text-green-600 font-medium">✅ Available</span>
                ) : (
                  <span className="text-red-600 font-medium">❌ Not Available</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Previous Usage History */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <History className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Previous Usage History</h3>
          </div>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : completedHistory.length > 0 ? (
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {completedHistory.slice(0, 5).map((record, index) => (
                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {record.requestedBy}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {record.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>Function: {record.requestedByFunction} | Operation: {record.requestedByOperation}</div>
                        <div>Time Limit: {getTimeLimitDisplayName(record.timeLimit)}</div>
                        <div>Completed: {formatDate(record.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {completedHistory.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  ... and {completedHistory.length - 5} more records
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No previous usage history found for this gage.</p>
          )}
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Requested By
              </label>
              <input
                type="text"
                value={formData.requestedBy}
                onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="h-4 w-4 inline mr-1" />
                Function
              </label>
              <input
                type="text"
                value={formData.requestedByFunction}
                onChange={(e) => setFormData({...formData, requestedByFunction: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Settings className="h-4 w-4 inline mr-1" />
                Operation
              </label>
              <input
                type="text"
                value={formData.requestedByOperation}
                onChange={(e) => setFormData({...formData, requestedByOperation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Time Limit
              </label>
              <select
                value={formData.timeLimit}
                onChange={(e) => setFormData({...formData, timeLimit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="TWO_HOURS">2 Hours</option>
                <option value="ONE_DAY">1 Day</option>
                <option value="ONE_WEEK">1 Week</option>
                <option value="ONE_MONTH">1 Month</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Reason for Reallocation *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="Please explain why you need this gage again..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information for Plant HOD..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Message for Plant HOD
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Custom message to include in email notification..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notifyByEmail"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="notifyByEmail" className="text-sm text-gray-700">
              Send email notification to Plant HOD
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isGageAvailable}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Request Again</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RepeatedRequestModal;
