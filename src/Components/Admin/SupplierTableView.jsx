import React, { useEffect, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip } from "@mui/material";
import { Edit, Archive, EventAvailable } from "@mui/icons-material";
import axios from "../../api/axios";

const SupplierTableView = ({ data, setSuppliers, onEdit }) => {
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/suppliers");
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (supplier) => {
    alert(`📅 Scheduling for ${supplier.name}`);
  };

  const handleRetire = async (id, name) => {
    const confirm = window.confirm(`Retire supplier "${name}"?`);
    if (!confirm) return;

    try {
      await axios.put(`/suppliers/retire/${id}`);
      await fetchSuppliers();
      alert(`"${name}" has been retired.`);
    } catch (error) {
      console.error("Error retiring supplier:", error);
      alert("Failed to retire supplier.");
    }
  };

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "contactPerson", header: "Contact" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phoneNumber", header: "Phone" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "website", header: "Website" },
    { accessorKey: "invoicePONumber", header: "InvoicePONumber" },
    { accessorKey: "country", header: "Country" },
    {
      header: "Actions",
      Cell: ({ row }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Tooltip title="Schedule">
            <IconButton
              color="success"
              onClick={() => handleSchedule(row.original)}
            >
              <EventAvailable />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              onClick={() => onEdit(row.original)} // ✅ Parent handles edit
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Retire">
            <IconButton
              color="warning"
              onClick={() =>
                handleRetire(row.original.id, row.original.name)
              }
            >
              <Archive />
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
      enableColumnResizing
      enableStickyHeader
      enableGlobalFilter
      muiTableContainerProps={{
        sx: {
          maxHeight: 600,
          overflowY: "auto",
        },
      }}
      muiTableBodyRowProps={{ sx: { height: 36 } }}
      muiTableBodyCellProps={{ sx: { py: 0.5, px: 1 } }}
      muiTableHeadCellProps={{ sx: { py: 0.5, px: 1, fontSize: "0.8rem" } }}
    />
  );
};

export default SupplierTableView;
