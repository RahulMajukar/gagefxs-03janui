import React, { useEffect, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material"; 
import axios from "../../api/axios";
import EditServiceProviderForm from "./EditServiceProviderForm";
import Modal from "../Modal";

const ServiceProviderTableView = ({ countryData }) => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchServiceProviders();
    fetchCountries(); // ✅ fetch countries on mount
  }, []);

  const fetchServiceProviders = async () => {
    try {
      const response = await axios.get("/service-providers");
      setServiceProviders(response.data);
    } catch (error) {
      console.error("Error fetching service providers:", error);
    }
  };

  const handleEdit = (rowData) => {
    const transformed = {
      serviceProviderType: rowData.serviceProviderType, // ← NEW
      serviceProviderId: rowData.id || rowData._id,
      serviceProviderName: rowData.name,
      serviceContact: rowData.contactPerson,
      serviceCountry: rowData.country,
      servicePhone: rowData.phoneNumber,
      serviceEmail: rowData.email,
      serviceWebsite: rowData.website,
      serviceAccreditation: rowData.accreditationNumber,
      serviceAddress: rowData.address,
      serviceCertificate: rowData.certificate,
      serviceNotes: rowData.description,
    };

    setEditingRow(transformed);
    setIsEditModalOpen(true);
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get("/countries");
      setCountryData(response.data);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  // ✅ Replaced Retire with Delete
  const handleDelete = async (rowData) => {
    if (!window.confirm("Are you sure you want to delete this service provider?")) return;
    try {
      await axios.delete(`/service-providers/${rowData.id || rowData._id}`);
      fetchServiceProviders(); // refresh list
    } catch (error) {
      console.error("Error deleting service provider:", error);
      alert("Failed to delete service provider. Please try again.");
    }
  };

  const columns = [
    { accessorKey: "serviceProviderType", header: "Service Provider Type" },
    { accessorKey: "name", header: "Service Provider Name" },
    { accessorKey: "contactPerson", header: "Contact Person" },
    { accessorKey: "country", header: "Country" },
    { accessorKey: "phoneNumber", header: "Phone Number" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "website", header: "Website" },
    { accessorKey: "accreditationNumber", header: "Accreditation" },
    { accessorKey: "address", header: "Service Address" },
    { accessorKey: "description", header: "Notes" },

    {
      header: "Actions",
      id: "actions",
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(row.original)}>
              <Edit className="text-blue-600 hover:text-blue-800" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(row.original)}>
              <Delete className="text-red-600 hover:text-red-800" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <MaterialReactTable
        columns={columns}
        data={serviceProviders}
        enablePagination
        enableColumnResizing
        positionActionsColumn="last"
        muiTableBodyRowProps={{ hover: true }}
        muiTableBodyCellProps={{ sx: { color: "#374151" } }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [5, 10, 20],
          showFirstButton: true,
          showLastButton: true,
        }}
        muiTableProps={{ sx: { tableLayout: "auto" } }}
      />

      {/* Edit Modal */}
      {isEditModalOpen && editingRow && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
          <EditServiceProviderForm
            defaultValues={editingRow}
            countryData={countryData}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingRow(null);
              fetchServiceProviders();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default ServiceProviderTableView;
