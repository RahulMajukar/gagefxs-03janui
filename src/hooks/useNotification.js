// // src/hooks/useNotification.js
// import { useNotifications } from '../Components/notifications/NotificationManager';

// export const useNotification = () => {
//   const { 
//     addNotification, 
//     notifySuccess, 
//     notifyError, 
//     notifyWarning, 
//     notifyInfo 
//   } = useNotifications();

//   const showNotification = (type, title, message, options = {}) => {
//     addNotification({
//       type,
//       title,
//       message,
//       ...options
//     });
//   };

//   return {
//     showNotification,
//     success: notifySuccess,
//     error: notifyError,
//     warning: notifyWarning,
//     info: notifyInfo,
    
//     // Specific notification helpers
//     gageCreated: (serialNumber, data) => 
//       showNotification('gage_created', '✅ Gage Created', `Gage ${serialNumber} has been created`, { data }),
    
//     gageUpdated: (serialNumber, data) =>
//       showNotification('gage_updated', '📝 Gage Updated', `Gage ${serialNumber} has been updated`, { data }),
    
//     gageIssued: (serialNumber, data) =>
//       showNotification('gage_issued', '🔄 Gage Issued', `Gage ${serialNumber} has been issued`, { data }),
    
//     gageReturned: (serialNumber, data) =>
//       showNotification('gage_returned', '↩️ Gage Returned', `Gage ${serialNumber} has been returned`, { data }),
    
//     usageRecorded: (serialNumber, jobNumber) =>
//       showNotification('usage_recorded', '📊 Usage Recorded', `Usage recorded for gage ${serialNumber} on job ${jobNumber}`),
    
//     calibrationDue: (serialNumber, days) =>
//       showNotification('calibration_due', '📅 Calibration Due', `Gage ${serialNumber} due in ${days} days`),
    
//     calibrationOverdue: (serialNumber) =>
//       showNotification('calibration_overdue', '⚠️ Calibration Overdue', `Gage ${serialNumber} is overdue for calibration`)
//   };
// };