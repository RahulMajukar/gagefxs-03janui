import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  createReallocateRequest, 
  isGageAvailableForReallocation,
  getUsers,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  User,
} from 'lucide-react';

const animations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

const ReallocationRequestModal = ({ isOpen, onClose, gageData, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    gageId: null,
    requestedBy: '',
    requestedByDepartment: '',
    requestedByFunction: '',
    requestedByOperation: '',
    timeLimit: 'ONE_DAY',
    reason: '',
    notes: '',
    requestedTo: ''
  });

  const [toEmails, setToEmails] = useState(['']);
  const [ccEmails, setCcEmails] = useState(['']);
  const [plantHodUsers, setPlantHodUsers] = useState([]);
  const [messageText, setMessageText] = useState('');  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isGageAvailable, setIsGageAvailable] = useState(true);
  const [operatorDepartment, setOperatorDepartment] = useState('');
  const [operatorFunction, setOperatorFunction] = useState('');
  const [operatorOperation, setOperatorOperation] = useState('');

  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  // Helper functions for dynamic email fields
  const handleToChange = (index, value) => {
    const newTo = [...toEmails];
    newTo[index] = value;
    setToEmails(newTo);
  };

  const handleCcChange = (index, value) => {
    const newCc = [...ccEmails];
    newCc[index] = value;
    setCcEmails(newCc);
  };

  const handleCcAdd = () => {
    setCcEmails([...ccEmails, '']);
  };

  const removeCc = (index) => {
    if (ccEmails.length > 1) {
      const newCc = ccEmails.filter((_, i) => i !== index);
      setCcEmails(newCc);
    } else {
      setCcEmails(['']);
    }
  };

  const generateReallocationEmailHTML = (data) => {
    const safe = (val) => val == null ? '' : String(val).replace(/</g, '<').replace(/>/g, '>');

    const LOGO_CID = "cid:logo";
    const FRONTEND_URL = "http://localhost:5173/dashboard/plant_hod";
    const redirectPath = `/reallocations/${safe(data.requestId)}`;
    const loginUrl = `${FRONTEND_URL}/login?redirect=${encodeURIComponent(redirectPath)}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Gage Reallocation Request</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; color: #334155; line-height: 1.5;">
  <table align="center" width="100%" style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-collapse: collapse;">
    <!-- Header -->
    <tr>
      <td style="background: #0f172a; padding: 25px 30px; display: flex; align-items: center; gap: 20px;">
        <img 
  src="${LOGO_CID}" 
  alt="GageFX Logo"
  style="width: 72px; height: 64px; display: block; border-radius: 8px; object-fit: contain; margin-right: 16px;"
  onerror="this.style.display='none'"
/>
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600; line-height: 1.2;">
          GageFX Reallocation Request
        </h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <p>Hello Sir,</p>
        <p>A new gage reallocation request requires your review:</p>

        <table width="100%" style="border-collapse: collapse; margin: 20px 0; font-size: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Request ID</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Serial</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Type</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Requested By</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Department</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Function</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Operation</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center;">Reason</th>
          </tr>
          <tr>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.requestId)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.serialNumber)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.gageType)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.requestedBy)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.department)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.function)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${safe(data.operation)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; word-break: break-word;">${safe(data.reason)}</td>
          </tr>
        </table>

        ${safe(data.message) ? `
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">Message from Requestor</div>
          <div style="color: #334155; font-style: italic;">${safe(data.message)}</div>
        </div>
        ` : ''}

        <table align="center" style="margin: 25px auto;">
          <tr>
            <td align="center">
              <a href="${loginUrl}" 
                 style="display: inline-block; width: 220px; padding: 14px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                🔍 Review Request
              </a>
            </td>
          </tr>
        </table>

        <p>Thank you for your prompt attention.</p>
        <p>Best regards,<br><strong>GageFX System</strong></p>
      </td>
    </tr>

    <tr>
      <td style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;">This is an automated message. Please do not reply.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  };

  useEffect(() => {
    if (isOpen && gageData) {
      loadPlantHodUsers();
      checkGageAvailability();
      
      const dept = user?.departments?.[0] || '';
      const func = user?.functions?.[0] || '';
      const op = user?.operations?.[0] || '';
      
      setOperatorDepartment(dept);
      setOperatorFunction(func);
      setOperatorOperation(op);

      setFormData({
        gageId: gageData.id,
        requestedBy: user?.email || user?.username || '',
        requestedByRole: dept,
        requestedByFunction: func,
        requestedByOperation: op,
        reason: '',
        notes: '',
        requestedTo: ''
      });
      
      setToEmails(['']);
      setCcEmails(['']);
      setMessageText('');
      setError('');
    }
  }, [isOpen, gageData, user]);

  const loadPlantHodUsers = async () => {
    try {
      const users = await getUsers();
      const hods = (users || []).filter(u => {
        const role = (u.role || u.roles || '').toString().toUpperCase();
        return role.includes('PLANT_HOD') || role.includes('HOD');
      });
      setPlantHodUsers(hods);
    } catch (err) {
      setPlantHodUsers([]);
    }
  };

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isGageAvailable) {
      setError('This gage is not available for reallocation');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the reallocation request');
      return;
    }

    // Determine primary To email
    let primaryTo = '';
    if (toEmails[0]?.trim()) {
      primaryTo = toEmails[0].trim();
    } else if (formData.requestedTo) {
      const hod = plantHodUsers.find(u => 
        (u.username === formData.requestedTo) || (u.email === formData.requestedTo)
      );
      primaryTo = hod?.email || '';
    }

    if (!primaryTo) {
      primaryTo = 'plant.hod@gagefx.com';
    }

    if (!primaryTo.includes('@')) {
      setError('Please enter a valid primary recipient email');
      return;
    }

    const finalToEmails = [primaryTo];
    const finalCcEmails = ccEmails
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        gageId: formData.gageId,
        requestedBy: formData.requestedBy,
        requestedByRole: formData.requestedByRole,
        requestedByFunction: formData.requestedByFunction,
        requestedByOperation: formData.requestedByOperation,
        timeLimit: 'ONE_DAY',
        reason: formData.reason,
        notes: messageText ? `${formData.notes ? formData.notes + '\n' : ''}Message: ${messageText}` : formData.notes
      };

      const result = await createReallocateRequest(payload);

      // Send email notification (separate from dashboard notification)
      try {
        const emailData = {
          requestId: result?.id || 'N/A',
          serialNumber: gageData.serialNumber || 'N/A',
          gageType: gageData.gageType?.name || 'N/A',
          requestedBy: formData.requestedBy,
          department: formData.requestedByRole,
          function: formData.requestedByFunction,
          operation: formData.requestedByOperation,
          reason: formData.reason,
          message: messageText || ''
        };

        const htmlContent = generateReallocationEmailHTML(emailData);

        const emailFormData = new FormData();
        finalToEmails.forEach(email => emailFormData.append('to', email));
        finalCcEmails.forEach(email => emailFormData.append('cc', email));
        emailFormData.append('subject', `New Gage Reallocation Request - ${gageData.serialNumber || ''}`);
        emailFormData.append('html', htmlContent);
        if (formData.requestedBy) {
          emailFormData.append('from', formData.requestedBy);
        }

        const mailResponse = await fetch('http://localhost:8080/api/mail/send', {
          method: 'POST',
          body: emailFormData,
        });

        if (mailResponse.ok) {
          setShowEmailSuccess(true);
          setTimeout(() => setShowEmailSuccess(false), 4000);
        } else {
          const errorMsg = await mailResponse.text();
          console.error('📧 Email send failed:', errorMsg);
          alert('❌ Failed to send email: ' + (errorMsg || 'Unknown error'));
        }
      } catch (mailErr) {
        console.error('Email delivery failed:', mailErr);
        alert('❌ Network error while sending email. Check console.');
      }

      // Dashboard notification is handled automatically by the backend
      // The email link will take the user to their dashboard
      setShowSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitSuccess(false);
        if (onSuccess) onSuccess(result);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Error creating reallocation request:', err);
      setError(err.response?.data?.message || 'Failed to create reallocation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!gageData) return null;

  return (
    <>
      <style>{animations}</style>
      <Modal title="Request Gage Reallocation" onClose={onClose}>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              Gage Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Serial Number:</span>
                <span className="ml-2 text-gray-600">{gageData.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Model Number:</span>
                <span className="ml-2 text-gray-600">{gageData.modelNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Gage Type:</span>
                <span className="ml-2 text-gray-600">{gageData.gageType?.name || gageData.gageType || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  gageData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {gageData.status || 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Department:</span>
                <span className="ml-2 text-gray-600">{operatorDepartment || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Function:</span>
                <span className="ml-2 text-gray-600">{operatorFunction || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Operation:</span>
                <span className="ml-2 text-gray-600">{operatorOperation || 'N/A'}</span>
              </div>
            </div>
          </div>

          {!isGageAvailable && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-red-800">Gage Not Available</p>
                  <p className="text-red-700 text-sm">
                    This gage is currently allocated and not available for reallocation.
                  </p>
                </div>
              </div>
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User size={16} className="text-gray-600" />
                Recipients
              </h3>
              <div className="space-y-4">
                {/* To Field - Email dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To (Email) *
                  </label>
                  <select
                    value={formData.requestedTo}
                    onChange={(e) => handleChange('requestedTo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select recipient email</option>
                    {plantHodUsers.map(u => (
                      <option key={u.id || u.email} value={u.email}>
                        {u.fullName || u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* CC Fields with Add Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CC (Optional)
                  </label>
                  {ccEmails.map((email, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleCcChange(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        placeholder="cc@example.com"
                      />
                      {ccEmails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCc(index)}
                          className="px-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleCcAdd}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    + Add CC
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Recipient
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Write your message to the recipient..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Reallocation *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Please explain why you need this gage reallocated..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isGageAvailable || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Email Sent Success Popup */}
      {showEmailSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-gray-800 text-center font-semibold text-lg">Email sent! ✉️</p>
            <p className="text-gray-500 text-sm text-center">
              Your reallocation request has been emailed to the recipient.
            </p>
          </div>
        </div>
      )}

      {/* Request Submitted Success Popup */}
      {showSubmitSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-gray-800 text-center font-semibold text-lg">Request submitted! ✅</p>
            <p className="text-gray-500 text-sm text-center">
              Your reallocation request has been created successfully.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReallocationRequestModal;