import React, { useState, useEffect } from 'react';
import { 
  getUserInvolvedReallocates, 
  returnGage,
  getReallocateTimeLimits 
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import RepeatedRequestModal from './RepeatedRequestModal';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  User,
  Building,
  Settings,
  Package,
  RotateCcw,
  RefreshCw,
  Repeat
} from 'lucide-react';

const OperatorReallocationDashboard = () => {
  const { user } = useAuth();
  const [reallocates, setReallocates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedReallocate, setSelectedReallocate] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showRepeatedRequestModal, setShowRepeatedRequestModal] = useState(false);
  const [selectedGageForRepeatedRequest, setSelectedGageForRepeatedRequest] = useState(null);

  useEffect(() => {
    if (user?.username) {
      loadReallocates();
    }
  }, [user?.username]);

  const loadReallocates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserInvolvedReallocates(user.username);
      setReallocates(data);
    } catch (err) {
      console.error('Error loading reallocates:', err);
      setError('Failed to load reallocation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnGage = (reallocate) => {
    setSelectedReallocate(reallocate);
    setReturnReason('');
    setShowReturnModal(true);
  };

  const handleRequestAgain = (reallocate) => {
    setSelectedGageForRepeatedRequest({
      id: reallocate.gageId,
      serialNumber: reallocate.gageSerialNumber,
      modelNumber: reallocate.gageModelNumber,
      gageType: { name: reallocate.gageTypeName }
    });
    setShowRepeatedRequestModal(true);
  };

  const submitReturn = async () => {
    if (!selectedReallocate || !returnReason.trim()) return;
    
    try {
      setSubmitting(true);
      await returnGage(selectedReallocate.id, user.username, returnReason);
      
      setShowReturnModal(false);
      setSelectedReallocate(null);
      setReturnReason('');
      loadReallocates();
    } catch (err) {
      console.error('Error returning gage:', err);
      setError('Failed to return gage');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-300';
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-300';
      case 'RETURNED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL': return Clock;
      case 'APPROVED': return CheckCircle;
      case 'EXPIRED': return AlertCircle;
      case 'RETURNED': return RotateCcw;
      case 'COMPLETED': return CheckCircle;
      case 'CANCELLED': return XCircle;
      default: return Package;
    }
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-gray-600">Loading reallocation requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Reallocation Requests</h2>
          <p className="text-gray-600">Manage your gage reallocation requests</p>
        </div>
        <button
          onClick={loadReallocates}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reallocation List */}
      {reallocates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">No reallocation requests found</p>
          <p className="text-gray-400 text-sm">Your reallocation requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reallocates.map((reallocate) => {
            const StatusIcon = getStatusIcon(reallocate.status);
            const expiringSoon = isExpiringSoon(reallocate.expiresAt);
            const expired = isExpired(reallocate.expiresAt);
            
            return (
              <div 
                key={reallocate.id} 
                className={`bg-white border rounded-lg p-6 shadow-sm transition-all hover:shadow-md ${
                  expiringSoon ? 'border-orange-300 bg-orange-50' : 
                  expired ? 'border-red-300 bg-red-50' : 
                  'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(reallocate.status).split(' ')[0]}`}>
                      <StatusIcon size={20} className={getStatusColor(reallocate.status).split(' ')[1]} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {reallocate.gageSerialNumber} - {reallocate.gageTypeName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {reallocate.gageModelNumber && `Model: ${reallocate.gageModelNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(reallocate.status)}`}>
                      {reallocate.status.replace('_', ' ')}
                    </span>
                    {expiringSoon && (
                      <p className="text-orange-600 text-xs mt-1 font-medium">
                        ⚠️ Expires Soon
                      </p>
                    )}
                    {expired && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        ⚠️ Expired
                      </p>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Original Allocation */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Building size={14} />
                      Original Allocation
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><span className="font-medium">Dept:</span> {reallocate.originalDepartment}</div>
                      <div><span className="font-medium">Function:</span> {reallocate.originalFunction}</div>
                      <div><span className="font-medium">Operation:</span> {reallocate.originalOperation}</div>
                    </div>
                  </div>

                  {/* Current Allocation */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Settings size={14} />
                      Current Allocation
                    </h4>
                    <div className="text-sm text-blue-600 space-y-1">
                      <div><span className="font-medium">Dept:</span> {reallocate.currentDepartment}</div>
                      <div><span className="font-medium">Function:</span> {reallocate.currentFunction}</div>
                      <div><span className="font-medium">Operation:</span> {reallocate.currentOperation}</div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <Clock size={14} />
                      Time Information
                    </h4>
                    <div className="text-sm text-green-600 space-y-1">
                      <div><span className="font-medium">Limit:</span> {getTimeLimitDisplayName(reallocate.timeLimit)}</div>
                      <div><span className="font-medium">Allocated:</span> {formatDate(reallocate.allocatedAt)}</div>
                      <div><span className="font-medium">Expires:</span> {formatDate(reallocate.expiresAt)}</div>
                      {reallocate.remainingMinutes && (
                        <div><span className="font-medium">Remaining:</span> {reallocate.remainingMinutes} min</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason and Notes */}
                {(reallocate.reason || reallocate.notes) && (
                  <div className="mb-4">
                    {reallocate.reason && (
                      <div className="mb-2">
                        <h4 className="font-medium text-gray-700 mb-1">Reason</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{reallocate.reason}</p>
                      </div>
                    )}
                    {reallocate.notes && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{reallocate.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(reallocate.createdAt)}
                    {reallocate.approvedBy && (
                      <span className="ml-4">
                        Approved by: {reallocate.approvedBy}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {reallocate.status === 'APPROVED' && (
                      <button
                        onClick={() => handleReturnGage(reallocate)}
                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        Return Gage
                      </button>
                    )}
                    
                    {(reallocate.status === 'COMPLETED' || reallocate.status === 'RETURNED') && (
                      <button
                        onClick={() => handleRequestAgain(reallocate)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Repeat size={14} />
                        Request Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedReallocate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Return Gage: {selectedReallocate.gageSerialNumber}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Return *
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Please provide a reason for returning this gage..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedReallocate(null);
                    setReturnReason('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  disabled={!returnReason.trim() || submitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Returning...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Return Gage
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repeated Request Modal */}
      <RepeatedRequestModal
        isOpen={showRepeatedRequestModal}
        onClose={() => {
          setShowRepeatedRequestModal(false);
          setSelectedGageForRepeatedRequest(null);
        }}
        gageData={selectedGageForRepeatedRequest}
        onSuccess={(result) => {
          console.log('Repeated reallocation request created:', result);
          alert('✅ Repeated request submitted successfully!');
          setShowRepeatedRequestModal(false);
          setSelectedGageForRepeatedRequest(null);
          loadReallocates(); // Refresh the list
        }}
      />
    </div>
  );
};

export default OperatorReallocationDashboard;
