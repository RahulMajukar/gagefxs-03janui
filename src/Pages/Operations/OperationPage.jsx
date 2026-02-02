import { useParams } from "react-router-dom";
import FunctionF1 from "../Functions/FunctionF1";
import FunctionF2 from "../Functions/FunctionF2";
import FunctionF3 from "../Functions/FunctionF3";

// Map functionId to components
const functionMap = {
  f1: FunctionF1,
  f2: FunctionF2,
  f3: FunctionF3,
};

export default function FunctionPage() {
  const { functionId } = useParams();

  // Optional: normalize functionId to lowercase to avoid case-sensitivity issues
  const normalizedId = functionId?.toLowerCase();
  const Component = functionMap[normalizedId];

  if (!Component) {
    return (
      <div className="text-red-600 font-semibold p-4">
        ⚠️ Function "{functionId}" not found.
      </div>
    );
  }

  return <Component />;
}
