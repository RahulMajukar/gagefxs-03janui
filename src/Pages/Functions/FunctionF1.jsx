// src/pages/Functions/FunctionF1.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function FunctionF1() {
  const { user } = useAuth() ?? {};

  // Determine which operations to show for this function
  // Example: F1 has OT1 and OT2
  const allOperationsForF1 = ["ot1", "ot2"];
  const operationsToShow = user?.operations
    ? allOperationsForF1.filter((op) => user.operations.includes(op))
    : [];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Function F1</h2>
      {operationsToShow.length > 0 ? (
        <ul className="space-y-2">
          {operationsToShow.map((op) => (
            <li key={op}>
              <Link to={`/operations/${op}`} className="text-green-600 underline">
                {op.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No operations available for you.</p>
      )}
    </div>
  );
}
