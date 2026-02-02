import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import { MaterialReactTable } from "material-react-table";
import {
  Clock,
  Users,
  Calendar,
  FileText,
  Hash,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getUsageRecordsByOperator } from "../../api/api";

export default function GageUsageHistory({ isOpen, onClose }) {
  const { user } = useAuth();
  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch usage history when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUsageHistory();
    }
  }, [isOpen, user]);

  const fetchUsageHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch usage records from the new job-based API
      const records = await getUsageRecordsByOperator(user.username);
      
      // Transform the data to match the expected format
      const transformedData = records.map(record => ({
        id: record.id,
        gageType: record.gageType,
        serialNumber: record.gageSerialNumber,
        daysUsed: record.daysUsed,
        usesCount: record.usesCount,
        usageDate: record.usageDate,
        jobDescription: record.jobDescription,
        jobNumber: record.jobNumber,
        usageCount: record.usageCount,
        usageNotes: record.usageNotes,
      }));
      
      setUsageHistory(transformedData);
    } catch (err) {
      console.error("Error fetching usage history:", err);
      setError("Failed to load usage history. Please try again.");
      setUsageHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      accessorKey: "usageDate",
      header: "Date",
      size: 100,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={16} />
          <span>{new Date(cell.getValue()).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "gageType",
      header: "Gage Type",
      size: 150,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Package className="text-green-600" size={16} />
          <span className="font-medium">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
      size: 120,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Hash className="text-orange-600" size={16} />
          <span className="font-mono text-sm">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "daysUsed",
      header: "Days Used",
      size: 100,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Clock className="text-indigo-600" size={16} />
          <span>{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "usesCount",
      header: "Uses Count",
      size: 100,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <Users className="text-purple-600" size={16} />
          <span>{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "jobDescription",
      header: "Ref Job Description",
      size: 200,
      Cell: ({ cell }) => (
        <div className="flex items-center gap-2">
          <FileText className="text-gray-600" size={16} />
          <span className="truncate">{cell.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "jobNumber",
      header: " Ref Job Number",
      size: 120,
      Cell: ({ cell }) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {cell.getValue() || 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Gage Usage History"
      description="View your recent gage usage records and remaining capacities."
    >
      <div className="bg-white px-6 py-4 w-full max-w-6xl mx-auto max-h-[80vh] overflow-y-auto">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Usage Records</h3>
            <p className="text-sm text-gray-600">
              Operator: <span className="font-medium">{user?.username}</span>
            </p>
          </div>
          <button
            onClick={fetchUsageHistory}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-3 text-gray-600">Loading usage history...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Data table */}
        {!loading && !error && (
          <>
            {usageHistory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Usage History</h3>
                <p className="text-gray-500">You haven't recorded any gage usage yet.</p>
              </div>
            ) : (
              <MaterialReactTable
                columns={columns}
                data={usageHistory}
                enableGlobalFilter={true}
                enableSorting={true}
                enablePagination={true}
                enableRowSelection={false}
                enableColumnOrdering={false}
                enableColumnFilters={true}
                enableDensityToggle={false}
                enableFullScreenToggle={false}
                enableHiding={false}
                initialState={{
                  pagination: { pageSize: 10, pageIndex: 0 },
                  sorting: [{ id: 'usageDate', desc: true }], // Sort by date descending
                }}
                muiTableContainerProps={{
                  sx: {
                    maxHeight: '500px',
                  },
                }}
                muiTablePaperProps={{
                  elevation: 0,
                  sx: {
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  },
                }}
                muiTableHeadCellProps={{
                  sx: {
                    backgroundColor: '#f9fafb',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  },
                }}
                muiTableBodyCellProps={{
                  sx: {
                    fontSize: '0.875rem',
                  },
                }}
                renderTopToolbarCustomActions={() => (
                  <div className="text-sm text-gray-600">
                    Total Records: <span className="font-medium">{usageHistory.length}</span>
                  </div>
                )}
              />
            )}
          </>
        )}

        {/* Close button */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg 
                       hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
