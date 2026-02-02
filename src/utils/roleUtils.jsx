// src/utils/roleUtils.js
export const getDashboardPath = (user) => {
  if (!user) return "/login";

  switch (user.role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "IT_ADMIN":
      return "/dashboard/it-admin";
    case "OPERATOR":
      return "/dashboard/operator";
    case "QA":
      return "/dashboard/qa";
    default:
      return "/dashboard";
  }
};

// Role-to-UI label mapping (maintain backend role values for logic)
export const ROLE_LABELS = {
  // Keep backend keys as-is; labels are the UI text you want shown
  ADMIN: "ADMIN",
  ROLE_ADMIN: "ADMIN",
  IT_ADMIN: "QC_Manager",
  ROLE_IT_ADMIN: "QC_Manager",
  CALIBRATION_MANAGER: "PLANT_HEAD",
  ROLE_CALIBRATION_MANAGER: "PLANT_HEAD",
};

// Returns a compact normalized role key (without ROLE_ prefix) for comparisons
export const normalizeRoleKey = (role) => {
  if (!role) return "";
  const s = String(role).trim();
  return s.replace(/^ROLE_/i, "").toUpperCase();
};

// Public helper to get the UI label for a role (falls back to the raw role string)
export const getRoleLabel = (role) => {
  if (!role) return "Unknown Role";
  const raw = String(role).trim();
  // Try exact key match first
  if (ROLE_LABELS[raw]) return ROLE_LABELS[raw];
  // Try normalized (without ROLE_ prefix)
  const normalized = normalizeRoleKey(raw);
  if (ROLE_LABELS[normalized]) return ROLE_LABELS[normalized];
  // Fallback: return the original role string (or a nicer fallback if needed)
  return raw;
};

// Backwards-compatible alias
export const getRoleDisplayName = (role) => getRoleLabel(role);
