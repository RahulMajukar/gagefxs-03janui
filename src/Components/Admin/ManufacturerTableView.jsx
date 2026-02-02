import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip, Alert } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const ManufacturerTableView = ({ onEdit }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletionStatus, setDeletionStatus] = useState({}); // Track deletion status

  // ✅ Fetch manufacturers
  const fetchManufacturers = async () => {
    try {
      const response = await axios.get("/manufacturers");
      setData(Array.isArray(response.data) ? response.data : [response.data]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch manufacturers:", error);
      setLoading(false);
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

  // ✅ Delete function with usage check
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

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "contactPerson", header: "Contact" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phoneNumber", header: "Phone" },
    { accessorKey: "country", header: "Country" },
    { accessorKey: "website", header: "Website" },
    { accessorKey: "address", header: "Address" },
    {
      header: "Actions",
      Cell: ({ row }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => onEdit(row.original)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={() => handleDelete(row.original)} // ✅ Updated delete function
              disabled={deletionStatus[row.original.id]?.isChecking}
            >
              {deletionStatus[row.original.id]?.isChecking ? (
                <div style={{ width: 20, height: 20, border: '2px solid #f0f0f0', borderTop: '2px solid #d32f2f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                <Delete />
              )}
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      state={{ isLoading: loading }}
      enableStickyHeader
      enableColumnResizing
      enableGlobalFilter
      muiTableContainerProps={{ sx: { maxHeight: 600 } }}
      muiTableBodyRowProps={{ sx: { height: 36 } }}
      muiTableBodyCellProps={{ sx: { py: 0.5, px: 1 } }}
      muiTableHeadCellProps={{ sx: { py: 0.5, px: 1, fontSize: "0.8rem" } }}
    />
  );
};

export default ManufacturerTableView;