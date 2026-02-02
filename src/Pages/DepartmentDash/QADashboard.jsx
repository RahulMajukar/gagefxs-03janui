export default function QADashboard({ user }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">QA Dashboard</h1>
      <p>Welcome, {user.username}</p>

      <div className="mt-4">
        <h2 className="font-semibold">Departments:</h2>
        <ul className="list-disc pl-6">
          {user.departments?.map((d) => (
            <li key={d.name}>{d.name}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Functions:</h2>
        <ul className="list-disc pl-6">
          {user.functions?.map((f) => (
            <li key={f.name || f}>{f.name || f}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h2 className="font-semibold">Operations:</h2>
        <ul className="list-disc pl-6">
          {user.operations?.map((op) => (
            <li key={op.name || op}>{op.name || op}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
