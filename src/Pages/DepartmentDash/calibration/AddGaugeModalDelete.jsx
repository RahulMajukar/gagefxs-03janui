// src/components/dashboard/modals/AddGageModal.jsx
import React from 'react';
import {
  Plus,
  Settings,
  Calendar,
  Save,
  X
} from 'lucide-react';

const AddGageModal = ({
  isOpen,
  onClose,
  onSubmit,
  register,
  handleSubmit,
  errors,
  departments,
  priorities,
  intervals
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Schedule New Gage</h2>
              <p className="text-sm text-gray-600">Enter the details for the new calibration gage</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Basic Information</span>
              </h3>
            </div>
            {['gageName', 'gageId', 'manufacturer', 'model', 'serialNumber', 'department', 'location'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.split(/(?=[A-Z])/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register(field, { required: true, ...(field === 'gageId' && { pattern: { value: /^[A-Z]{2,3}-\d{3,6}$/, message: 'Format: ABC-123456' } }) })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[field] ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={`e.g., ${field === 'gageName' ? 'Digital Caliper' : field === 'gageId' ? 'CAL-001234' : field === 'manufacturer' ? 'Mitutoyo' : field === 'model' ? 'CD-6CSX' : field === 'serialNumber' ? 'SN123456789' : field === 'department' ? 'Production' : 'Building A, Room 101'}`}
                />
                {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                {...register('department', { required: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                {...register('location', { required: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Building A, Room 101"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Calibration Information</span>
              </h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calibration Interval (months) <span className="text-red-500">*</span>
              </label>
              <select
                {...register('calibrationInterval', { required: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.calibrationInterval ? 'border-red-500' : 'border-gray-300'}`}
              >
                {intervals.map(interval => (
                  <option key={interval} value={interval}>{interval} months</option>
                ))}
              </select>
              {errors.calibrationInterval && <p className="mt-1 text-sm text-red-600">{errors.calibrationInterval}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Calibration Date</label>
              <input
                type="date"
                {...register('lastCalibrationDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next Due Date</label>
              <input
                type="date"
                {...register('nextDueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsible Person <span className="text-red-500">*</span>
              </label>
              <input
                {...register('responsible', { required: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.responsible ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., John Doe"
              />
              {errors.responsible && <p className="mt-1 text-sm text-red-600">{errors.responsible}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                {...register('priority', { required: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.priority ? 'border-red-500' : 'border-gray-300'}`}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calibration Standard</label>
              <input
                {...register('calibrationStandard')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., ISO 9001:2015"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or special instructions..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Schedule Gage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGageModal;