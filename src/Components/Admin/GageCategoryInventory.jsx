import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import GageCategoryForm from "./GageCategoryForm";
import api from "../../api/axios";
import { MaterialReactTable } from "material-react-table";
import { Edit } from "lucide-react";

export default function GageCategoryInventory({ isOpen, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/gage-categories/all");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Error fetching gage categories:", err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/gage-categories/${data.id}`, data);
        alert("✅ Gage Category updated successfully!");
      } else {
        await api.post("/gage-categories/add", data);
        alert("✅ Gage Category added successfully!");
      }

      // Refresh list from server
      await fetchCategories();

      // Close form
      setShowForm(false);
      setEditData(null);

    } catch (err) {
      console.error(err);
      alert("❌ Failed to save gage category");
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setShowForm(true);
  };

  const CardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="p-4 border rounded-lg shadow bg-white flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold text-lg">{cat.name}</h3>
            <p className="text-gray-500 text-sm">
              {cat.description || "No description"}
            </p>
          </div>
          <button
            onClick={() => handleEdit(cat)}
            className="text-blue-600 hover:underline text-sm"
          >
            Edit
          </button>
        </div>
      ))}
    </div>
  );

  const TableView = () => {
    const columns = [
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "description",
        header: "Description",
        Cell: ({ cell }) => cell.getValue() || "-",
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <button
            onClick={() => handleEdit(row.original)}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <Edit className="w-4 h-4 inline" /> Edit
          </button>
        ),
      },
    ];

    return (
      <div className="max-h-[60vh] overflow-y-auto">
        <MaterialReactTable columns={columns} data={categories} />
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <Modal
          onClose={onClose}
          title="Gage Categories Inventory"
          className="text-xl font-semibold p-4 w-full max-w-5xl"
        >
          <div className="flex w-full justify-between items-center mb-4 gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <button
                className={`px-4 py-2 rounded ${
                  viewMode === "card"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setViewMode("card")}
              >
                Card View
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  viewMode === "table"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setViewMode("table")}
              >
                Table View
              </button>
            </div>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={() => {
                setEditData(null);
                setShowForm(true);
              }}
            >
              + Add
            </button>
          </div>

          {viewMode === "card" ? <CardView /> : <TableView />}
        </Modal>
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          title={editData ? "Edit Gage Category" : "Add Gage Category"}
          className="max-h-[80vh] overflow-y-auto"
        >
          <div className="p-4">
            <GageCategoryForm
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
    </>
  );
}
