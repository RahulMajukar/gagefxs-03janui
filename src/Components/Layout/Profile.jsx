import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import api from "../../api/axios";
import { User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getUsers } from "../../api/api";

// Define enum options (matching backend nested enums)
const LOCATION_OPTIONS = [
  { value: "LOCATION_A", label: "Location A" },
  { value: "LOCATION_B", label: "Location B" },
  { value: "LOCATION_C", label: "Location C" },
];

const PLANT_OPTIONS = [
  { value: "PLANT_A", label: "Plant A" },
  { value: "PLANT_B", label: "Plant B" },
  { value: "PLANT_C", label: "Plant C" },
];

const AREA_OPTIONS = [
  { value: "AREA_A", label: "Area A" },
  { value: "AREA_B", label: "Area B" },
  { value: "AREA_C", label: "Area C" },
];

const getLabelByValue = (value, options) => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value || "—";
};

export default function ProfileModal({ open, onClose, onUpdated }) {
  const { login } = useAuth() ?? {};
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    phone: "",
    profileImage: "",
    role: "",
    departments: [],
    functions: [],
    operations: [],
    location: "",
    plant: "",
    area: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    let cancelled = false;

    const applyUser = (u) => {
      if (!u || cancelled) return;
      const toNames = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((it) => {
          if (!it) return "";
          if (typeof it === "string") return it;
          if (typeof it === "object") return it.name || it.title || it.label || JSON.stringify(it);
          return String(it);
        }).filter(Boolean);
      };

      const userObj = u.user || u.data || u.result || u;

      setEditData((d) => ({
        ...d,
        firstName: userObj.firstName || userObj.first_name || userObj.first || "",
        lastName: userObj.lastName || userObj.last_name || userObj.last || "",
        email: userObj.email || userObj.userEmail || "",
        countryCode: userObj.countryCode || userObj.country_code || "+91",
        phone: userObj.phone || userObj.mobile || "",
        profileImage: userObj.profileImage || userObj.profile_image || userObj.avatar || "",
        role: (userObj.role && (typeof userObj.role === "string" ? userObj.role : userObj.role.name)) ||
              (userObj.roles && Array.isArray(userObj.roles) ? (typeof userObj.roles[0] === 'string' ? userObj.roles[0] : userObj.roles[0]?.name) : "") || "",
        departments: toNames(userObj.departments),
        functions: toNames(userObj.functions),
        operations: toNames(userObj.operations),
        location: userObj.location || "",
        plant: userObj.plant || "",
        area: userObj.area || "",
      }));
    };

    (async () => {
      setLoading(true);
      try {
        const list = await getUsers();
        if (cancelled) return;
        let found = null;
        const matchesStored = (x) => {
          if (!x) return false;
          const xIds = [x.id, x._id, x.userId, x.user_id].filter(Boolean).map(String);
          const sIds = [stored?.id, stored?._id, stored?.userId, stored?.user_id].filter(Boolean).map(String);
          if (xIds.some(id => sIds.includes(id))) return true;
          if (stored?.username && x.username && x.username === stored.username) return true;
          if (stored?.email && x.email && x.email === stored.email) return true;
          return false;
        };
        found = list.find(matchesStored);
        if (found) {
          applyUser(found);
          return;
        }
        applyUser(stored);
      } catch (err) {
        console.warn("Failed to fetch users for profile:", err?.message || err);
        applyUser(stored);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open]);

  const name = `${editData.firstName || ""} ${editData.lastName || ""}`.trim();
  const phone = `${editData.countryCode || "+91"} ${editData.phone || ""}`.trim();
  const locationLabel = getLabelByValue(editData.location, LOCATION_OPTIONS);
  const plantLabel = getLabelByValue(editData.plant, PLANT_OPTIONS);
  const areaLabel = getLabelByValue(editData.area, AREA_OPTIONS);
  const departmentsStr = (editData.departments || []).join(", ") || "—";
  const functionsStr = (editData.functions || []).join(", ") || "—";
  const operationsStr = (editData.operations || []).join(", ") || "—";

  if (!open) return null;

  // Helper component for info boxes
  const InfoBox = ({ label, value }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900 break-words">{value}</p>
    </div>
  );

  return (
    <Modal title="Your Profile" onClose={onClose}>
      <div className="max-w-7xl mx-auto w-full px-4 py-2">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="md:w-1/4 flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shadow">
              {/* Blue circular border wrapper */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 pointer-events-none"></div>
              {editData.profileImage ? (
                <img
                  src={editData.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <label className="mt-4 text-sm font-medium text-gray-700 text-center">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setEditData((d) => ({ ...d, profileImage: reader.result }));
                reader.readAsDataURL(file);
              }}
              className="mt-2 text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Info Grid */}
          <div className="md:w-3/4 w-full">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-gray-500">Loading profile...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoBox label="Full Name" value={name || "—"} />
                    <InfoBox label="Email" value={editData.email || "—"} />
                    <InfoBox label="Phone" value={phone || "—"} />
                  </div>
                </div>

                {/* Location Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Location Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoBox label="Location" value={locationLabel} />
                    <InfoBox label="Plant" value={plantLabel} />
                    <InfoBox label="Area" value={areaLabel} />
                  </div>
                </div>

                {/* Role & Teams */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Role & Teams</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoBox label="Role" value={editData.role || "—"} />
                    <InfoBox label="Departments" value={departmentsStr} />
                    <InfoBox label="Functions" value={functionsStr} />
                    <InfoBox label="Operations" value={operationsStr} />
                  </div>
                </div>

                {/* Save Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      const stored = JSON.parse(localStorage.getItem("user") || "{}");
                      const updated = { ...stored, profileImage: editData.profileImage };
                      localStorage.setItem("user", JSON.stringify(updated));
                      try {
                        login?.(updated);
                      } catch (e) {}

                      try {
                        if (stored?.id) {
                          await api.patch(`/users/${stored.id}`, { profileImage: editData.profileImage });
                        } else {
                          const me = await api.get(`/users/me`).then(r => r.data);
                          const userId = me?.id || me?.user?.id;
                          if (userId) {
                            await api.patch(`/users/${userId}`, { profileImage: editData.profileImage });
                          }
                        }
                      } catch (err) {
                        console.warn("Failed to persist profile image:", err?.message || err);
                      }

                      if (typeof onUpdated === "function") onUpdated(updated.profileImage);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}