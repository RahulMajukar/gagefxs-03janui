// src/pages/Functions/FunctionF2.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function FunctionF2() {
  const { user } = useAuth() ?? {};

  // Example: F2 has OT2 and OT3
  const allOperationsForF2 = ["ot2", "ot3"];
  const operationsToShow = user?.operations
    ? allOperationsForF2.filter((op) => user.operations.includes(op))
    : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Function F2</h1>
      <p className="mt-2 text-gray-600">Welcome to Function F2 page.</p>

      {operationsToShow.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {operationsToShow.map((op) => (
            <li key={op}>
              <Link to={`/operations/${op}`} className="text-green-600 underline">
                {op.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 mt-4">No operations available for you.</p>
      )}
    </div>
  );
}
