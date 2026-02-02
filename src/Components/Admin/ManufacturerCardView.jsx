import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import {
  Factory,
  MapPin,
  Phone,
  Globe,
  Mail,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Edit,
  CalendarCheck,
  Trash,
} from "lucide-react";

const ITEMS_PER_PAGE = 6;

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
    <Icon size={16} className="text-gray-700" />
    <span>
      <strong>{label}:</strong> {value || "-"}
    </span>
  </div>
);

export const ManufacturerCardView = ({ onEdit, onUpdated, onSchedule }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState({});
  const [showAllDetails, setShowAllDetails] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletionStatus, setDeletionStatus] = useState({}); // Track deletion status

  // ✅ Fetch manufacturers
  const fetchManufacturers = async () => {
    try {
      const res = await axios.get("/manufacturers");
      setManufacturers(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      console.error("Failed to fetch manufacturers", err);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  // ✅ Check if manufacturer can be deleted
  const checkCanDelete = async (manufacturerId) => {
    try {
      const response = await axios.get(`/manufacturers/${manufacturerId}/can-delete`);
      return response.data;
    } catch (error) {
      console.error("Error checking deletion status:", error);
      return { canDelete: false, message: "Error checking deletion status" };
    }
  };

  // ✅ Delete manufacturer with usage check
  const handleDelete = async (manufacturer) => {
    try {
      // Check if manufacturer can be deleted
      const canDeleteResponse = await checkCanDelete(manufacturer.id);
      
      if (!canDeleteResponse.canDelete) {
        // Manufacturer is being used, show error message
        const gagesResponse = await axios.get(`/manufacturers/${manufacturer.id}/used-by-gages`);
        const gagesData = gagesResponse.data;
        
        let message = `Cannot delete manufacturer: it is currently used by ${gagesData.gageCount} gage(s):\n\n`;
        gagesData.gages.forEach(gage => {
          message += `• Serial: ${gage.serialNumber}, Model: ${gage.modelNumber}, Status: ${gage.status}\n`;
        });
        
        alert(message);
        return;
      }
      
      // If can be deleted, proceed with confirmation
      if (window.confirm(`Are you sure you want to delete ${manufacturer.name}?`)) {
        await axios.delete(`/manufacturers/${manufacturer.id}`);
        fetchManufacturers(); // refresh list
      }
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
      if (error.response && error.response.status === 409) {
        // Conflict - manufacturer is being used
        alert(error.response.data.message || "Cannot delete manufacturer: it is being used by gages");
      } else {
        alert("Failed to delete manufacturer. Please try again.");
      }
    }
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredManufacturers =
    searchTerm.trim() === ""
      ? manufacturers
      : manufacturers.filter((m) =>
          (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

  const totalPages = Math.ceil(filteredManufacturers.length / ITEMS_PER_PAGE);
  const paginated = filteredManufacturers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Search & toggle details */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="border border-gray-300 rounded px-3 py-1 w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={() => setShowAllDetails((prev) => !prev)}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200"
        >
          {showAllDetails ? <EyeOff size={16} /> : <Eye size={16} />}
          {showAllDetails ? "Hide All Details" : "Show All Details"}
        </button>
      </div>

      {/* Manufacturer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.length === 0 && (
          <p className="col-span-full text-center text-gray-600">No matching manufacturers found.</p>
        )}

        {paginated.map((m) => {
          const showDetails = showAllDetails || expandedCards[m.id || m._id];

          return (
            <div key={m.id || m._id} className="p-4 border rounded-xl shadow-sm bg-white flex flex-col space-y-4 text-sm">
              <div className="bg-blue-50 p-3 rounded flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-blue-900 flex items-center">
                    <Factory className="mr-2 text-teal-600" size={18} />
                    {m.name || "Unknown"}
                  </h3>
                  <p className="text-xs text-gray-600 pl-6">Contact: {m.contactPerson || "N/A"}</p>
                </div>
                <button
                  onClick={() => toggleCard(m.id || m._id)}
                  className="flex items-center gap-1 text-xs bg-gray-100 border rounded px-2 py-1 hover:bg-gray-200"
                >
                  {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showDetails ? "Hide" : "Show"}
                </button>
              </div>

              {showDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field icon={Mail} label="Email" value={m.email} />
                  <Field icon={Phone} label="Phone" value={m.phoneNumber} />
                  <Field icon={Globe} label="Website" value={m.website} />
                  <Field icon={MapPin} label="Country" value={m.country} />
                  <div className="col-span-2">
                    <Field icon={MapPin} label="Address" value={m.address} />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => onEdit(m)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={() => onSchedule(m)}
                  className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs flex items-center gap-1"
                >
                  <CalendarCheck size={14} /> Schedule
                </button>
                <button
                  onClick={() => handleDelete(m)} // ✅ Updated delete function
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deletionStatus[m.id]?.isChecking}
                >
                  {deletionStatus[m.id]?.isChecking ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </span>
                  ) : (
                    <>
                      <Trash size={14} /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-2 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-2 py-1 text-sm bg-gray-100 border rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};