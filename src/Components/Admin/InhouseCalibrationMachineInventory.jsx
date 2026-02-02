import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import InhouseCalibrationMachineForm from "./InhouseCalibrationMachineForm";
import api from "../../api/axios";
import { MaterialReactTable } from "material-react-table";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Cpu, 
  MapPin, 
  Factory, 
  Gauge, 
  Ruler, 
  CalendarDays,
  Barcode,
  Tag,
  Settings,
  Clock,
  FileText,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function InhouseCalibrationMachineInventory({ isOpen, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [machines, setMachines] = useState([]);
  const [showDetails, setShowDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inhouse-calibration-machines/all");
      setMachines(res.data || []);
    } catch (err) {
      console.error("Error fetching inhouse calibration machines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMachines();
  }, [isOpen]);

  const handleSave = async (data) => {
    try {
      await fetchMachines();
      setShowForm(false);
      setEditData(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save inhouse calibration machine");
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setShowForm(true);
  };

  const handleDelete = async (id, machineName) => {
    if (window.confirm(`Are you sure you want to delete "${machineName}"?`)) {
      try {
        await api.delete(`/inhouse-calibration-machines/${id}`);
        alert("✅ Deleted successfully");
        fetchMachines();
      } catch (error) {
        console.error(error);
        alert("❌ Failed to delete");
      }
    }
  };

  const handleViewDetails = (machine) => {
    setShowDetails(machine);
  };

  const StatusBadge = ({ status }) => {
    const getStatusIcon = () => {
      switch (status?.toLowerCase()) {
        case 'active':
          return <CheckCircle className="w-4 h-4" />;
        case 'under maintenance':
          return <Settings className="w-4 h-4" />;
        case 'calibration due':
          return <AlertTriangle className="w-4 h-4" />;
        default:
          return <XCircle className="w-4 h-4" />;
      }
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
        status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
        status === 'under maintenance' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
        status === 'calibration due' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
        'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {getStatusIcon()}
        {status}
      </span>
    );
  };

  const CardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto p-2">
      {machines.map((machine) => (
        <div
          key={machine.id}
          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Cpu className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {machine.machineName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{machine.instrumentCode}</p>
                </div>
              </div>
              <StatusBadge status={machine.status?.toLowerCase()} />
            </div>
          </div>

          {/* Machine Details - 3 Column Layout */}
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Basic Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Barcode className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Equipment #</p>
                    <p className="font-medium text-gray-900">{machine.machineEquipmentNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="font-medium text-gray-900">{machine.accuracy || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Location & Manufacturer */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{machine.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Factory className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Manufacturer</p>
                    <p className="font-medium text-gray-900">{machine.manufacturer}</p>
                  </div>
                </div>
              </div>

              {/* Column 3: Technical & Dates */}
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-xs text-gray-500">Resolution</p>
                  <p className="font-medium text-gray-900">{machine.resolution || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Guarantee</p>
                    <p className="font-medium text-gray-900">
                      {new Date(machine.guaranteeExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gage Type Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-500">Type: </span>
                  <span className="font-medium text-gray-900">{machine.gageTypeName}</span>
                  <span className="text-gray-400 mx-2">/</span>
                  <span className="font-medium text-gray-900">{machine.gageSubTypeName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <button
                onClick={() => handleViewDetails(machine)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(machine)}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(machine.id, machine.machineName)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const TableView = () => {
    const columns = [
      { 
        accessorKey: "machineName", 
        header: "Machine Name", 
        size: 200,
        Cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{row.original.machineName}</div>
              <div className="text-sm text-gray-500">{row.original.instrumentCode}</div>
            </div>
          </div>
        )
      },
      { 
        accessorKey: "machineEquipmentNumber", 
        header: "Equipment #", 
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-mono text-sm">{cell.getValue()}</span>
        )
      },
      { 
        accessorKey: "accuracy", 
        header: "Accuracy", 
        size: 100,
        Cell: ({ cell }) => cell.getValue() || 'N/A'
      },
      { 
        accessorKey: "resolution", 
        header: "Resolution", 
        size: 100,
        Cell: ({ cell }) => cell.getValue() || 'N/A'
      },
      { 
        accessorKey: "location", 
        header: "Location", 
        size: 120,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            {cell.getValue()}
          </div>
        )
      },
      { 
        accessorKey: "status", 
        header: "Status", 
        size: 140,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue()?.toLowerCase()} />
      },
      { 
        accessorKey: "manufacturer", 
        header: "Manufacturer", 
        size: 120,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-gray-400" />
            {cell.getValue()}
          </div>
        )
      },
      { 
        accessorKey: "guaranteeExpiryDate", 
        header: "Guarantee Expiry", 
        size: 120,
        Cell: ({ cell }) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            {new Date(cell.getValue()).toLocaleDateString()}
          </div>
        )
      },
      { 
        accessorKey: "gageTypeName", 
        header: "Gage Type", 
        size: 120 
      },
      { 
        accessorKey: "gageSubTypeName", 
        header: "Gage Sub-Type", 
        size: 120 
      },
      {
        id: "actions",
        header: "Actions",
        size: 140,
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleViewDetails(row.original)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEdit(row.original)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.machineName)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    return (
      <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg">
        <MaterialReactTable 
          columns={columns} 
          data={machines}
          enableColumnResizing
          enableStickyHeader
          enablePagination={false}
          muiTableContainerProps={{
            sx: { maxHeight: '60vh' }
          }}
        />
      </div>
    );
  };

  const DetailsModal = ({ machine, onClose }) => (
    <Modal isOpen={true} onClose={onClose} title="Machine Complete Details" className="max-w-6xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Cpu className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{machine.machineName}</h2>
            <p className="text-gray-500">{machine.instrumentCode}</p>
          </div>
          <StatusBadge status={machine.status?.toLowerCase()} />
        </div>

        {/* 4-Column Grid Layout for Maximum Details */}
        <div className="grid grid-cols-4 gap-6">
          {/* Column 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" />
              Basic Information
            </h3>
            <DetailItem label="Machine Name" value={machine.machineName} />
            <DetailItem label="Instrument Code" value={machine.instrumentCode} icon={<Barcode className="w-4 h-4" />} />
            <DetailItem label="Equipment Number" value={machine.machineEquipmentNumber} icon={<Tag className="w-4 h-4" />} />
            <DetailItem label="Location" value={machine.location} icon={<MapPin className="w-4 h-4" />} />
            <DetailItem label="Status" value={machine.status} customValue={<StatusBadge status={machine.status?.toLowerCase()} />} />
          </div>

          {/* Column 2: Technical Specifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-500" />
              Technical Specs
            </h3>
            <DetailItem label="Accuracy" value={machine.accuracy} icon={<Ruler className="w-4 h-4" />} />
            <DetailItem label="Resolution" value={machine.resolution} icon={<Settings className="w-4 h-4" />} />
            <DetailItem label="Range" value={machine.range || 'N/A'} icon={<Gauge className="w-4 h-4" />} />
            <DetailItem label="Uncertainty" value={machine.uncertainty || 'N/A'} icon={<Shield className="w-4 h-4" />} />
            <DetailItem label="Calibration Frequency" value={machine.calibrationFrequency || 'N/A'} icon={<Clock className="w-4 h-4" />} />
          </div>

          {/* Column 3: Manufacturer & Supplier Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2 flex items-center gap-2">
              <Factory className="w-5 h-5 text-orange-500" />
              Manufacturer & Supplier
            </h3>
            <DetailItem label="Manufacturer" value={machine.manufacturer} icon={<Factory className="w-4 h-4" />} />
            <DetailItem label="Model" value={machine.model || 'N/A'} icon={<Cpu className="w-4 h-4" />} />
            <DetailItem label="Serial Number" value={machine.serialNumber || 'N/A'} icon={<Barcode className="w-4 h-4" />} />
            <DetailItem label="Supplier" value={machine.supplier || 'N/A'} icon={<User className="w-4 h-4" />} />
            <DetailItem label="Supplier Contact" value={machine.supplierContact || 'N/A'} icon={<FileText className="w-4 h-4" />} />
          </div>

          {/* Column 4: Dates & Additional Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-500" />
              Dates & Categories
            </h3>
            <DetailItem 
              label="Guarantee Expiry" 
              value={new Date(machine.guaranteeExpiryDate).toLocaleDateString()} 
              icon={<CalendarDays className="w-4 h-4" />}
            />
            <DetailItem 
              label="Last Calibration" 
              value={machine.lastCalibrationDate ? new Date(machine.lastCalibrationDate).toLocaleDateString() : 'N/A'} 
              icon={<Calendar className="w-4 h-4" />}
            />
            <DetailItem 
              label="Next Calibration Due" 
              value={machine.nextCalibrationDate ? new Date(machine.nextCalibrationDate).toLocaleDateString() : 'N/A'} 
              icon={<Clock className="w-4 h-4" />}
            />
            <DetailItem label="Gage Type" value={machine.gageTypeName} />
            <DetailItem label="Gage Sub-Type" value={machine.gageSubTypeName} />
          </div>
        </div>

        {/* Additional Notes Section */}
        {(machine.notes || machine.remarks) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 text-lg mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              Additional Notes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {machine.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Notes:</label>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border">{machine.notes}</p>
                </div>
              )}
              {machine.remarks && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Remarks:</label>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border">{machine.remarks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Last updated: {machine.updatedAt ? new Date(machine.updatedAt).toLocaleDateString() : 'N/A'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                handleEdit(machine);
              }}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Machine
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );

  const DetailItem = ({ label, value, icon, customValue }) => (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {label}:
      </span>
      <div className="text-right">
        {customValue ? (
          customValue
        ) : (
          <span className="text-sm text-gray-900 font-semibold">{value || 'N/A'}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Inhouse Calibration Machines Inventory">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading machines...</span>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {isOpen && (
        <Modal
          onClose={onClose}
          title="Inhouse Calibration Machines Inventory"
          className="w-full max-w-7xl"
        >
          <div className="p-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    viewMode === "card"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setViewMode("card")}
                >
                  Card View
                </button>
                <button
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    viewMode === "table"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  Table View
                </button>
              </div>
              <button
                className="px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 shadow-sm"
                onClick={() => {
                  setEditData(null);
                  setShowForm(true);
                }}
              >
                <Cpu className="w-4 h-4" />
                Add New Machine
              </button>
            </div>

            {/* Content */}
            {machines.length === 0 ? (
              <div className="text-center py-12">
                <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No machines found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first calibration machine.</p>
                <button
                  onClick={() => {
                    setEditData(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 mx-auto"
                >
                  <Cpu className="w-4 h-4" />
                  Add First Machine
                </button>
              </div>
            ) : viewMode === "card" ? (
              <CardView />
            ) : (
              <TableView />
            )}
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          title={editData ? "Edit Calibration Machine" : "Add Calibration Machine"}
          className="max-h-[90vh] overflow-y-auto max-w-4xl"
        >
          <div className="p-6">
            <InhouseCalibrationMachineForm
              onSave={handleSave}
              onClose={() => {
                setShowForm(false);
                setEditData(null);
              }}
              defaultValues={editData || undefined}
            />
          </div>
        </Modal>
      )}

      {showDetails && (
        <DetailsModal 
          machine={showDetails} 
          onClose={() => setShowDetails(null)} 
        />
      )}
    </>
  );
}