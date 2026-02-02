import { useParams } from "react-router-dom";

// Import all function components
import FunctionF1 from "./FunctionF1";
import FunctionF2 from "./FunctionF2";
import FunctionF3 from "./FunctionF3";

const functionMap = {
  f1: FunctionF1,
  f2: FunctionF2,
  f3: FunctionF3,
};

export default function FunctionPage() {
  const { functionId } = useParams();
  const Component = functionMap[functionId];

  if (!Component) return <div>Function not found</div>;

  return <Component />;
}
