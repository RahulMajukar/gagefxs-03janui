export default function ProductionDashboard({ functions = [], operations = [] }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Production Dashboard</h1>
      <p>Welcome to the Production Department</p>

      {functions.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold">Functions:</h2>
          <ul className="list-disc pl-6">
            {functions.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {operations.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold">Operations:</h2>
          <ul className="list-disc pl-6">
            {operations.map((op) => (
              <li key={op}>{op}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
