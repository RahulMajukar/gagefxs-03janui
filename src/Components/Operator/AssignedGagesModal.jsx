import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import { MaterialReactTable } from "material-react-table";
import {
  Package,
  Hash,
  Cpu,
  Building2,
  FunctionSquare,
  UserCog,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getOperatorFilteredGageIssuesByPriority } from "../../api/api";

export default function AssignedGagesModal({ isOpen, onClose }) {
  const [viewMode, setViewMode] = useState("card");
  const [assignedGages, setAssignedGages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch operator's assigned gages based on their department, function, and operation
  useEffect(() => {
    if (isOpen && user) {
      fetchAssignedGages();
    }
  }, [isOpen, user]);

  const fetchAssignedGages = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Extract operator's context from user object
      const departments = user.departments || [];
      const functions = user.functions || [];
      const operations = user.operations || [];
      
      console.log("Fetching gages for operator:", {
        departments,
        functions,
        operations,
        username: user.username
      });
      
      // Get filtered gage issues by priority
      const filteredGages = await getOperatorFilteredGageIssuesByPriority(
        departments,
        functions,
        operations
      );
      
      console.log("Filtered gages received:", filteredGages);
      setAssignedGages(filteredGages || []);
    } catch (err) {
      console.error("Error fetching assigned gages:", err);
      setError("Failed to load assigned gages. Please try again.");
      setAssignedGages([]);
    } finally {
      setLoading(false);
    }
  };

  // MRT table columns
  const columns = [
    { accessorKey: "title", header: "Issue Title" },
    { accessorKey: "serialNumber", header: "Serial Number" },
    { accessorKey: "dept", header: "Department" },
    { accessorKey: "func", header: "Function" },
    { accessorKey: "operation", header: "Operation" },
    { accessorKey: "priority", header: "Priority" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "assignedTo", header: "Assigned To" },
    { accessorKey: "dueDate", header: "Due Date" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assigned Gages - ${user?.username || 'Operator'}`}>
      <div className="p-4 bg-gray-50 rounded-lg max-h-[80vh] overflow-y-auto">
        {/* Toggle Buttons and Refresh */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setViewMode("card")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                viewMode === "card"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Card View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Table View
            </button>
          </div>
          <button
            onClick={fetchAssignedGages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
            Refresh
          </button>
        </div>

        {/* Operator Context Summary */}
        {user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Your Access Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Departments:</span>
                <div className="mt-1">
                  {user.departments && user.departments.length > 0 ? (
                    user.departments.map((dept, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">None assigned</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Functions:</span>
                <div className="mt-1">
                  {user.functions && user.functions.length > 0 ? (
                    user.functions.map((func, index) => (
                      <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                        {func}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">None assigned</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium text-blue-800">Operations:</span>
                <div className="mt-1">
                  {user.operations && user.operations.length > 0 ? (
                    user.operations.map((op, index) => (
                      <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                        {op}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">None assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <span className="ml-2 text-gray-600">Loading assigned gages...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="text-red-500" size={32} />
            <span className="ml-2 text-red-600">{error}</span>
          </div>
        )}

        {/* Conditional Rendering */}
        {!loading && !error && (
          <>
            {viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedGages.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Package className="mx-auto text-gray-400" size={48} />
                    <p className="text-gray-600 mt-2">No assigned gages found for your department.</p>
                  </div>
                ) : (
                  assignedGages.map((gage, index) => (
                    <div
                      key={gage.id || index}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 p-5 border border-gray-200"
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl mb-4 shadow">
                        <Package size={20} />
                        <h3 className="text-lg font-semibold">{gage.title}</h3>
                      </div>

                      {/* Card Body with Icons */}
                      <div className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Hash className="text-blue-600" size={18} />
                          <p><span className="font-medium">Serial:</span> {gage.serialNumber || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="text-green-600" size={18} />
                          <p><span className="font-medium">Department:</span> {gage.dept || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FunctionSquare className="text-purple-600" size={18} />
                          <p><span className="font-medium">Function:</span> {gage.func || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCog className="text-pink-600" size={18} />
                          <p><span className="font-medium">Operation:</span> {gage.operation || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="text-indigo-600" size={18} />
                          <p><span className="font-medium">Priority:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                              gage.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                              gage.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {gage.priority}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-orange-600" size={18} />
                          <p><span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                              gage.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                              gage.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                              gage.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {gage.status}
                            </span>
                          </p>
                        </div>
                        {gage.assignedTo && (
                          <div className="flex items-center gap-2">
                            <UserCog className="text-teal-600" size={18} />
                            <p><span className="font-medium">Assigned To:</span> {gage.assignedTo}</p>
                          </div>
                        )}
                        {gage.dueDate && (
                          <div className="flex items-center gap-2">
                            <Cpu className="text-purple-600" size={18} />
                            <p><span className="font-medium">Due Date:</span> {new Date(gage.dueDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <MaterialReactTable
                columns={columns}
                data={assignedGages}
                enableGlobalFilter={true}
                initialState={{ showGlobalFilter: true }}
                muiTablePaperProps={{
                  elevation: 0,
                  sx: { borderRadius: "12px", border: "1px solid #e5e7eb" },
                }}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
