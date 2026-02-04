// ReallocationManagementModal.js
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  getReallocatesByStatus,
  approveReallocateRequest,
  rejectReallocateRequest,
  cancelReallocateRequest,
  createReallocateRequest,
  returnGage,
  getReallocateTimeLimits,
  getDepartments,
  getFunctions,
  getOperations,
  getUsers,
  getGages,
  isGageAvailableForReallocation,
} from '../api/api';
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
  ArrowRight,
  RotateCcw
} from 'lucide-react';

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

const generateApprovalEmailBody = (reallocate, approvalData, selectedGage) => {
  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  const gageSerial = selectedGage?.serialNumber || reallocate.gageSerialNumber;
  const gageModel = selectedGage?.modelNumber || reallocate.gageModelNumber || 'N/A';
  const gageType = (selectedGage?.gageType?.name) || reallocate.gageTypeName || 'N/A';
  const newDept = approvalData.newDepartment || reallocate.originalDepartment;
  const newFunc = approvalData.newFunction || reallocate.originalFunction;
  const newOp = approvalData.newOperation || reallocate.originalOperation;
  const LOGO_CID = "cid:logo";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gage Reallocation Approved</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; color: #334155; line-height: 1.5;">
  <table align="center" width="100%" style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-collapse: collapse;">
    <!-- Header -->
    <tr>
      <td style="background: #0f172a; padding: 25px 30px; display: flex; align-items: center; gap: 16px;">
        <img
          src="${LOGO_CID}"
          alt="GageFX Logo"
          style="width: 72px; height: 64px; display: block; border-radius: 8px; object-fit: contain; margin-right: 16px;"
          onerror="this.style.display='none'"
        />
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600; line-height: 1.2;">
          GageFX Reallocation Approved
        </h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <div style="display: inline-block; padding: 4px 12px; background: #dcfce7; color: #166534; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
          ✅ APPROVED
        </div>
        <p>A gage reallocation request has been approved by Plant HOD.</p>
        <table width="100%" style="border-collapse: collapse; margin: 20px 0; font-size: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Request ID</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Serial</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Model</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Type</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Requested By</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Original Allocation</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Time Limit</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center;">New Allocation</th>
          </tr>
          <tr>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.id)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(gageSerial)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(gageModel)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(gageType)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.requestedBy)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.originalDepartment)} / ${escapeHtml(reallocate.originalFunction)} / ${escapeHtml(reallocate.originalOperation)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(getTimeLimitDisplayName(approvalData.timeLimit))}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; word-break: break-word;">${escapeHtml(newDept)} / ${escapeHtml(newFunc)} / ${escapeHtml(newOp)}</td>
          </tr>
        </table>
        ${approvalData.notes ? `
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 6px;">Approval Notes</div>
          <div style="color: #334155; font-style: italic;">${escapeHtml(approvalData.notes)}</div>
        </div>
        ` : ''}
        <p>Thank you for your attention to this matter.</p>
        <p>Best regards,<br><strong>GageFX System</strong></p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;">This is an automated notification. Do not reply directly.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const generateRejectionEmailBody = (reallocate, rejectionReason) => { // Removed selectedNotificationOperator parameter
  const escapeHtml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  const LOGO_CID = "cid:logo";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gage Reallocation Rejected</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; color: #334155; line-height: 1.5;">
  <table align="center" width="100%" style="max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-collapse: collapse;">
    <!-- Header -->
    <tr>
      <td style="background: #0f172a; padding: 25px 30px; display: flex; align-items: center; gap: 16px;">
        <img
          src="${LOGO_CID}"
          alt="GageFX Logo"
          style="width: 72px; height: 64px; display: block; border-radius: 8px; object-fit: contain; margin-right: 16px;"
          onerror="this.style.display='none'"
        />
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600; line-height: 1.2;">
          GageFX Reallocation Rejected
        </h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <div style="display: inline-block; padding: 4px 12px; background: #fecaca; color: #991b1b; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
          ❌ REJECTED
        </div>
        <p>A gage reallocation request has been rejected by Plant HOD.</p>
        <table width="100%" style="border-collapse: collapse; margin: 20px 0; font-size: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <tr style="background: #f1f5f9;">
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Request ID</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Serial</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Model</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Gage Type</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Requested By</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Original Allocation</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center; border-right: 1px solid #e2e8f0;">Time Limit</th>
            <th style="padding: 12px 10px; font-weight: 600; color: #1e293b; font-size: 12px; text-align: center;">Rejection Reason</th>
          </tr>
          <tr>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.id)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.gageSerialNumber)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.gageModelNumber || 'N/A')}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.gageTypeName || 'N/A')}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.requestedBy)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(reallocate.originalDepartment)} / ${escapeHtml(reallocate.originalFunction)} / ${escapeHtml(reallocate.originalOperation)}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; border-right: 1px solid #e2e8f0; word-break: break-word;">${escapeHtml(getTimeLimitDisplayName(reallocate.timeLimit))}</td>
            <td style="padding: 14px 10px; color: #334155; text-align: center; word-break: break-word;">${escapeHtml(rejectionReason)}</td>
          </tr>
        </table>
        <p>Thank you for your attention to this matter.</p>
        <p>Best regards,<br><strong>GageFX System</strong></p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;">This is an automated notification. Do not reply directly.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const ReallocationManagementModal = ({ isOpen, onClose, onRefresh, preselectReallocateId, autoOpenApprove }) => {
  const [reallocates, setReallocates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReallocate, setSelectedReallocate] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    timeLimit: 'ONE_DAY',
    newDepartment: '',
    newFunction: '',
    newOperation: '',
    notes: '' // State for general notes
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [timeLimits, setTimeLimits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [plantHodUsers, setPlantHodUsers] = useState([]);
  const [availableGages, setAvailableGages] = useState([]);
  const [selectedGageId, setSelectedGageId] = useState(null);
  // EMAIL STATE FOR APPROVAL - To field will be a dropdown
  const [emailTo, setEmailTo] = useState([]);
  const [emailCc, setEmailCc] = useState([]);
  const [selectedOperatorEmailForEmail, setSelectedOperatorEmailForEmail] = useState(''); // Dropdown selection for email To
  const [newCcEmail, setNewCcEmail] = useState('');
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  // EMAIL STATE FOR REJECTION - To field will be a dropdown
  const [rejectionEmailTo, setRejectionEmailTo] = useState([]);
  const [rejectionEmailCc, setRejectionEmailCc] = useState([]);
  const [selectedRejectionOperatorEmailForEmail, setSelectedRejectionOperatorEmailForEmail] = useState(''); // Dropdown selection for email To
  const [newRejectionCcEmail, setNewRejectionCcEmail] = useState('');
  const [showRejectionEmailSuccess, setShowRejectionEmailSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);
  // OPERATORS STATE (SHARED) - For the To dropdowns
  const [operators, setOperators] = useState([]);
  // New state for submit success popup
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!animateIn) {
      setShouldRender(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadPlantHods();
      loadIssuedGages();
    } else {
      setReallocates([]);
      setError('');
      setSelectedReallocate(null);
      setShowApprovalModal(false);
      setShowRejectionModal(false);
      setApprovalData({
        timeLimit: 'ONE_DAY',
        newDepartment: '',
        newFunction: '',
        newOperation: '',
        notes: ''
      });
      setRejectionReason('');
      setReturnReason('');
      setSelectedGageId(null);
      // Reset email states for approval
      setEmailTo([]);
      setEmailCc([]);
      setSelectedOperatorEmailForEmail('');
      setNewCcEmail('');
      setShowEmailSuccess(false);
      // Reset email states for rejection
      setRejectionEmailTo([]);
      setRejectionEmailCc([]);
      setSelectedRejectionOperatorEmailForEmail('');
      setNewRejectionCcEmail('');
      setShowRejectionEmailSuccess(false);
      // Reset operators
      setOperators([]);
      // Reset success popups
      setShowSubmitSuccess(false);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pendingReallocates, timeLimitsData, deptsData, funcsData, opsData, allUsers] = await Promise.all([
        getReallocatesByStatus('PENDING_APPROVAL'),
        getReallocateTimeLimits(),
        getDepartments(),
        getFunctions(),
        getOperations(),
        getUsers()
      ]);
      setReallocates(pendingReallocates);
      setTimeLimits(timeLimitsData);
      setDepartments(deptsData.map(d => d.name));
      setFunctions(funcsData.map(f => f.name));
      setOperations(opsData.map(o => o.name));
      // Filter operators based on role 'F' or 'OPERATOR'
      const ops = (allUsers || []).filter(u => {
        const role = (u.role || u.roles || '').toString().toUpperCase();
        return role.includes('F') || role.includes('OPERATOR');
      });
      setOperators(ops);
      if (preselectReallocateId && autoOpenApprove) {
        const found = (pendingReallocates || []).find(r => r.id === preselectReallocateId);
        if (found) {
          handleApprove(found);
        }
      }
    } catch (err) {
      console.error('Error loading ', err);
      setError('Failed to load reallocation requests or users');
    } finally {
      setLoading(false);
    }
  };

  const loadPlantHods = async () => {
    try {
      const users = await getUsers();
      const hods = (users || []).filter(u => {
        const role = (u.role || u.roles || '').toString().toUpperCase();
        return role.includes('PLANT_HOD') || role.includes('HOD');
      });
      setPlantHodUsers(hods);
    } catch (e) {
      setPlantHodUsers([]);
    }
  };

  const loadIssuedGages = async () => {
    try {
      const gages = await getGages();
      const availabilityChecks = await Promise.all(
        (gages || []).map(async (g) => {
          try {
            const available = await isGageAvailableForReallocation(g.id);
            return available ? g : null;
          } catch (e) {
            return null;
          }
        })
      );
      const available = availabilityChecks.filter(Boolean);
      setAvailableGages(available);
    } catch (e) {
      setAvailableGages([]);
    }
  };

  const handleApprove = (reallocate) => {
    setSelectedReallocate(reallocate);
    setApprovalData({
      timeLimit: 'ONE_DAY',
      newDepartment: reallocate.originalDepartment || '',
      newFunction: reallocate.originalFunction || '',
      newOperation: reallocate.originalOperation || '',
      notes: '' // Reset general notes
    });
    setSelectedGageId(reallocate.gageId || null);
    setShowApprovalModal(true);
  };

  const handleReject = (reallocate) => {
    setSelectedReallocate(reallocate);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleReturn = (reallocate) => {
    setSelectedReallocate(reallocate);
    setReturnReason('');
    const reason = prompt('Enter reason for returning gage:');
    if (reason) {
      submitReturn(reallocate.id, reason);
    }
  };

  // Helper to add emails safely from dropdown selection
  const addEmailFromDropdown = (email, list, setList, resetDropdown) => {
    if (email && email.trim() && email.includes('@')) {
      setList([...list, email.trim()]);
      resetDropdown(''); // Reset the dropdown selection
    }
  };

  const submitApproval = async () => {
    if (!selectedReallocate) return;
    try {
      setSubmitting(true);
      const approveWithNewGage = selectedGageId && selectedGageId !== selectedReallocate.gageId;
      let finalReallocateId = selectedReallocate.id;

      // Prepare notes for the approval API call (for dashboard notification)
      // Combine general notes and selected operator usernames from emailTo
      let dashboardNotificationNotes = approvalData.notes;
      if (emailTo.length > 0) {
         const operatorUsernames = emailTo.map(email => {
             const op = operators.find(u => u.email === email);
             return op ? (op.username || op.email) : email; // Fallback to email if no username
         }).filter(Boolean).join(', ');
         if (operatorUsernames) {
             dashboardNotificationNotes = dashboardNotificationNotes ? `${dashboardNotificationNotes} | Notify Operator: ${operatorUsernames}` : `Notify Operator: ${operatorUsernames}`;
         }
      }

      if (approveWithNewGage) {
        try {
          const available = await isGageAvailableForReallocation(selectedGageId);
          if (!available) {
            setError('Selected gage is not available for reallocation. Please choose another.');
            setSubmitting(false);
            return;
          }
        } catch (e) {
          setError('Could not validate gage availability. Please try again.');
          setSubmitting(false);
          return;
        }
        const created = await createReallocateRequest({
          gageId: selectedGageId,
          requestedBy: selectedReallocate.requestedBy,
          requestedByRole: selectedReallocate.requestedByRole || 'F',
          requestedByFunction: selectedReallocate.requestedByFunction,
          requestedByOperation: selectedReallocate.requestedByOperation,
          timeLimit: approvalData.timeLimit,
          reason: selectedReallocate.reason || 'Reallocated by HOD to a different gage',
          notes: dashboardNotificationNotes || undefined // Use combined notes
        });
        await approveReallocateRequest({
          reallocateId: created.id,
          approvedBy: 'plant.hod',
          timeLimit: approvalData.timeLimit,
          newDepartment: approvalData.newDepartment || undefined,
          newFunction: approvalData.newFunction || undefined,
          newOperation: approvalData.newOperation || undefined,
          notes: dashboardNotificationNotes || undefined // Use combined notes
        });
        await cancelReallocateRequest(selectedReallocate.id, 'plant.hod', 'Superseded by HOD with different gage');
        finalReallocateId = created.id;
      } else {
        await approveReallocateRequest({
          reallocateId: selectedReallocate.id,
          approvedBy: 'plant.hod',
          timeLimit: approvalData.timeLimit,
          newDepartment: approvalData.newDepartment || undefined,
          newFunction: approvalData.newFunction || undefined,
          newOperation: approvalData.newOperation || undefined,
          notes: dashboardNotificationNotes || undefined // Use combined notes
        });
      }

      // EMAIL LOGIC WITH TO & CC FOR APPROVAL
      if (emailTo.length > 0 || emailCc.length > 0) {
        const selectedGage = selectedGageId
          ? (availableGages || []).find(g => g.id === selectedGageId)
          : null;
        const emailBody = generateApprovalEmailBody(
          { ...selectedReallocate, id: finalReallocateId },
          { ...approvalData },
          selectedGage
        );
        try {
          const emailFormData = new FormData();
          emailTo.forEach(email => emailFormData.append('to', email));
          emailCc.forEach(email => emailFormData.append('cc', email));
          emailFormData.append('subject', `✅ Approved: Gage Reallocation - ${selectedReallocate.gageSerialNumber}`);
          emailFormData.append('html', emailBody);
          emailFormData.append('from', 'plant.hod@gagefx.com');
          const mailResponse = await fetch('http://localhost:8080/api/mail/send', {
            method: 'POST',
            body: emailFormData,
          });
          if (!mailResponse.ok) {
            const errorMsg = await mailResponse.text();
            console.error('📧 Approval email failed:', errorMsg);
            setError('Approval succeeded, but email notification failed.');
          } else {
            setShowEmailSuccess(true);
          }
        } catch (emailErr) {
          console.warn('Email notification failed:', emailErr);
        }
      }

      // Show submit success popup
      setShowSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitSuccess(false);
        setShowApprovalModal(false);
        loadData();
        if (onRefresh) onRefresh();
      }, 2500);
    } catch (err) {
      console.error('Error approving reallocation:', err);
      setError('Failed to approve reallocation request');
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedReallocate || !rejectionReason.trim()) return;
    try {
      setSubmitting(true);

      // Prepare notes for the rejection API call (for dashboard notification)
      // Combine rejection reason and selected operator usernames from rejectionEmailTo
      let dashboardNotificationNotes = rejectionReason;
      if (rejectionEmailTo.length > 0) {
         const operatorUsernames = rejectionEmailTo.map(email => {
             const op = operators.find(u => u.email === email);
             return op ? (op.username || op.email) : email; // Fallback to email if no username
         }).filter(Boolean).join(', ');
         if (operatorUsernames) {
             dashboardNotificationNotes = dashboardNotificationNotes ? `${dashboardNotificationNotes} | Notify Operator: ${operatorUsernames}` : `Notify Operator: ${operatorUsernames}`;
         }
      }

      await rejectReallocateRequest(selectedReallocate.id, 'plant.hod', dashboardNotificationNotes);

      // EMAIL LOGIC WITH TO & CC FOR REJECTION
      if (rejectionEmailTo.length > 0 || rejectionEmailCc.length > 0) {
        const emailBody = generateRejectionEmailBody(
          selectedReallocate,
          rejectionReason
        );
        try {
          const emailFormData = new FormData();
          rejectionEmailTo.forEach(email => emailFormData.append('to', email));
          rejectionEmailCc.forEach(email => emailFormData.append('cc', email));
          emailFormData.append('subject', `❌ Rejected: Gage Reallocation - ${selectedReallocate.gageSerialNumber}`);
          emailFormData.append('html', emailBody);
          emailFormData.append('from', 'plant.hod@gagefx.com');
          const mailResponse = await fetch('http://localhost:8080/api/mail/send', {
            method: 'POST',
            body: emailFormData,
          });
          if (!mailResponse.ok) {
            const errorMsg = await mailResponse.text();
            console.error('📧 Rejection email failed:', errorMsg);
            setError('Rejection succeeded, but email notification failed.');
          } else {
            setShowRejectionEmailSuccess(true);
          }
        } catch (emailErr) {
          console.warn('Rejection email notification failed:', emailErr);
        }
      }

      setShowRejectionModal(false);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error rejecting reallocation:', err);
      setError('Failed to reject reallocation request');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReturn = async (reallocateId, reason) => {
    try {
      setSubmitting(true);
      await returnGage(reallocateId, 'plant.hod', reason);
      loadData();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error returning gage:', err);
      setError('Failed to return gage');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleClose = () => {
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setSelectedReallocate(null);
    // Reset email states for approval
    setEmailTo([]);
    setEmailCc([]);
    setSelectedOperatorEmailForEmail('');
    setNewCcEmail('');
    setShowEmailSuccess(false);
    // Reset email states for rejection
    setRejectionEmailTo([]);
    setRejectionEmailCc([]);
    setSelectedRejectionOperatorEmailForEmail('');
    setNewRejectionCcEmail('');
    setShowRejectionEmailSuccess(false);
    onClose();
  };

  const handleRefresh = () => {
    loadData();
  };

  if (!shouldRender) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-600">Loading reallocation requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Approval Modal */}
      {showApprovalModal && selectedReallocate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[52] p-4"
          onClick={() => setShowApprovalModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Approve Reallocation Request</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {(() => {
                const chosenGage = selectedGageId ? (availableGages || []).find(g => g.id === selectedGageId) : null;
                const displaySerial = chosenGage?.serialNumber || selectedReallocate.gageSerialNumber;
                const displayModel = chosenGage?.modelNumber || selectedReallocate.gageModelNumber || 'N/A';
                const displayType = (chosenGage && chosenGage.gageType && chosenGage.gageType.name) || selectedReallocate.gageTypeName || 'N/A';
                return (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-1">Gage: {displaySerial}</h3>
                    <p className="text-sm text-blue-700 mb-0.5">Model: {displayModel}</p>
                    <p className="text-sm text-blue-700 mb-2">Type: {displayType}</p>
                    <p className="text-sm text-blue-700">
                      Requested by {selectedReallocate.requestedBy} for {getTimeLimitDisplayName(selectedReallocate.timeLimit)}
                    </p>
                  </div>
                );
              })()}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Gage (Available)
                  </label>
                  <select
                    value={selectedGageId || ''}
                    onChange={(e) => setSelectedGageId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Keep Requested Gage</option>
                    {availableGages.map(g => (
                      <option key={g.id} value={g.id}>{g.serialNumber} ({g.modelNumber || 'N/A'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit
                  </label>
                  <select
                    value={approvalData.timeLimit}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, timeLimit: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timeLimits.map((timeLimit) => (
                      <option key={timeLimit} value={timeLimit}>
                        {getTimeLimitDisplayName(timeLimit)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={approvalData.newDepartment}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, newDepartment: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Keep Original</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Function
                    </label>
                    <select
                      value={approvalData.newFunction}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, newFunction: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Keep Original</option>
                      {functions.map((func) => (
                        <option key={func} value={func}>{func}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation
                    </label>
                    <select
                      value={approvalData.newOperation}
                      onChange={(e) => setApprovalData(prev => ({ ...prev, newOperation: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Keep Original</option>
                      {operations.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={approvalData.notes}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Additional notes for the approval..."
                  />
                </div>
                {/* EMAIL SECTION (Approval) - To Field is now a dropdown */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Email/Dashboard Notification</h4>
                  {/* To Field - Dropdown for Operators */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                    <div className="flex gap-2">
                    <select
                      value={selectedOperatorEmailForEmail}
                      onChange={(e) => setSelectedOperatorEmailForEmail(e.target.value)}
                      className="w-[520px] p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">-- Select an Operator --</option>
                      {operators.map((op) => (
                        <option key={op.id} value={op.email}>
                          {op.username || op.email} ({op.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => addEmailFromDropdown(selectedOperatorEmailForEmail, emailTo, setEmailTo, setSelectedOperatorEmailForEmail)}
                      className="p-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <User size={14} />
                      Add To
                    </button>
                    </div>
                    {emailTo.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {emailTo.map((email, index) => (
                          <span
                            key={`to-${index}`}
                            className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            <User size={12} className="opacity-80" />
                            {email}
                            <button
                              type="button"
                              onClick={() => setEmailTo(emailTo.filter((_, i) => i !== index))}
                              className="text-green-600 hover:text-green-900 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Cc Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cc (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newCcEmail}
                        onChange={(e) => setNewCcEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmailFromDropdown(newCcEmail, emailCc, setEmailCc, setNewCcEmail);
                          }
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., manager@company.com"
                      />
                      <button
                        type="button"
                        onClick={() => addEmailFromDropdown(newCcEmail, emailCc, setEmailCc, setNewCcEmail)}
                        className="px-3 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
                      >
                        <Settings size={14} className="rotate-90" />
                        Add Cc
                      </button>
                    </div>
                    {emailCc.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {emailCc.map((email, index) => (
                          <span
                            key={`cc-${index}`}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            <Settings size={12} className="opacity-80 rotate-90" />
                            {email}
                            <button
                              type="button"
                              onClick={() => setEmailCc(emailCc.filter((_, i) => i !== index))}
                              className="text-blue-600 hover:text-blue-900 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApproval}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Approve Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectionModal && selectedReallocate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[52] p-4"
          onClick={() => setShowRejectionModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Reject Reallocation Request</h3>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Gage: {selectedReallocate.gageSerialNumber}</h3>
                <p className="text-sm text-red-700">
                  Requested by {selectedReallocate.requestedBy}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Rejection *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    placeholder="Please provide a reason for rejecting this request..."
                    required
                  />
                </div>
                {/* EMAIL SECTION (Rejection) - To Field is now a dropdown */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Email/Dashboard Notification</h4>
                  {/* To Field - Dropdown for Operators */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                    <div className="flex gap-2">
                    <select
                      value={selectedRejectionOperatorEmailForEmail}
                      onChange={(e) => setSelectedRejectionOperatorEmailForEmail(e.target.value)}
                      className="w-[520px] p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">-- Select an Operator --</option>
                      {operators.map((op) => (
                        <option key={op.id} value={op.email}>
                          {op.username || op.email} ({op.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => addEmailFromDropdown(selectedRejectionOperatorEmailForEmail, rejectionEmailTo, setRejectionEmailTo, setSelectedRejectionOperatorEmailForEmail)}
                      className="p-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <User size={14} />
                      Add To
                    </button>
                    </div>
                    {rejectionEmailTo.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rejectionEmailTo.map((email, index) => (
                          <span
                            key={`rej-to-${index}`}
                            className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                          >
                            <User size={12} className="opacity-80" />
                            {email}
                            <button
                              type="button"
                              onClick={() => setRejectionEmailTo(rejectionEmailTo.filter((_, i) => i !== index))}
                              className="text-green-600 hover:text-green-900 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Cc Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cc (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newRejectionCcEmail}
                        onChange={(e) => setNewRejectionCcEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmailFromDropdown(newRejectionCcEmail, rejectionEmailCc, setRejectionEmailCc, setNewRejectionCcEmail);
                          }
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., manager@company.com"
                      />
                      <button
                        type="button"
                        onClick={() => addEmailFromDropdown(newRejectionCcEmail, rejectionEmailCc, setRejectionEmailCc, setNewRejectionCcEmail)}
                        className="px-3 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
                      >
                        <Settings size={14} className="rotate-90" />
                        Add Cc
                      </button>
                    </div>
                    {rejectionEmailCc.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rejectionEmailCc.map((email, index) => (
                          <span
                            key={`rej-cc-${index}`}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            <Settings size={12} className="opacity-80 rotate-90" />
                            {email}
                            <button
                              type="button"
                              onClick={() => setRejectionEmailCc(rejectionEmailCc.filter((_, i) => i !== index))}
                              className="text-blue-600 hover:text-blue-900 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim() || submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Reject Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* EMAIL SUCCESS MODAL (Approval) */}
      {showEmailSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Sent!</h3>
            <p className="text-gray-600 mb-4">The approval notification has been sent successfully.</p>
            <button
              onClick={() => setShowEmailSuccess(false)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* EMAIL SUCCESS MODAL (Rejection) */}
      {showRejectionEmailSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email Sent!</h3>
            <p className="text-gray-600 mb-4">The rejection notification has been sent successfully.</p>
            <button
              onClick={() => setShowRejectionEmailSuccess(false)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* SUBMIT SUCCESS MODAL */}
      {showSubmitSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Request Approved!</h3>
            <p className="text-gray-600 mb-4">The reallocation request has been approved successfully.</p>
            <button
              onClick={() => setShowSubmitSuccess(false)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Main Modal Structure */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] transition-opacity duration-300"
          onClick={handleClose}
        />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-6xl bg-white rounded-l-lg shadow-lg transform transition-transform duration-700 ease-in-out ${animateIn ? 'translate-x-0' : 'translate-x-full'} overflow-hidden z-[51]`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-semibold">Reallocation Management</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 transition text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 72px)' }}>
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
          {reallocates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No pending reallocation requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reallocates.map((reallocate) => (
                <div key={reallocate.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {reallocate.gageSerialNumber} - {reallocate.gageTypeName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested by {reallocate.requestedBy} ({reallocate.requestedByRole})
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(reallocate.status)}`}>
                      {reallocate.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Original Allocation</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Dept:</span> {reallocate.originalDepartment}</div>
                        <div><span className="font-medium">Function:</span> {reallocate.originalFunction}</div>
                        <div><span className="font-medium">Operation:</span> {reallocate.originalOperation}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Current (Active)</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Dept:</span> {reallocate.currentDepartment || reallocate.originalDepartment}</div>
                        <div><span className="font-medium">Function:</span> {reallocate.currentFunction || reallocate.originalFunction}</div>
                        <div><span className="font-medium">Operation:</span> {reallocate.currentOperation || reallocate.originalOperation}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Request Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><span className="font-medium">Function:</span> {reallocate.requestedByFunction}</div>
                        <div><span className="font-medium">Operation:</span> {reallocate.requestedByOperation}</div>
                        <div><span className="font-medium">Time Limit:</span> {getTimeLimitDisplayName(reallocate.timeLimit)}</div>
                      </div>
                    </div>
                  </div>
                  {reallocate.reason && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-1">Reason</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{reallocate.reason}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Requested: {formatDate(reallocate.createdAt)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(reallocate)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(reallocate)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReallocationManagementModal;