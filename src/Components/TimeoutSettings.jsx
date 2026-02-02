// import React, { useState, useMemo } from "react";
// import { useSystemTimeout } from "../auth/SystemTimeoutContext";
// import { Clock, Pause, Play, ChevronDown } from "lucide-react";
// import DigitalClock from "../Components/Layout/DigitalClock";

// export default function TimeoutSettings() {
//   const { remainingTime, timeoutDuration, isPaused, togglePause, updateTimeoutDuration } = useSystemTimeout();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//   const options = useMemo(() => [
//     { label: "15s", value: 0.25 },
//     { label: "1 min", value: 1 },
//     { label: "5 min", value: 5 },
//     { label: "15 min", value: 15 },
//     { label: "30 min", value: 30 },
//     { label: "1 hour", value: 60 },
//   ], []);

//   const isSelected = (val) => Math.abs(timeoutDuration - val) < 0.001;

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//         className={`flex items-center space-x-3 px-1 py-1 rounded-lg border bg-black text-white hover:shadow-md transition`}
//       >
//          <div className="flex items-center gap-3">
//       {/* Clock Icon */}
//       <div className="p-1 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 shadow-lg">
//         <Clock className="w-2 h-5 text-white drop-shadow-md" />
//       </div>

//       {/* Digital Clock */}
//       <DigitalClock
//         className="bg-gradient-to-r from-gray-900 via-black to-gray-800 
//                    text-green-200 font-mono rounded-lg shadow-[0_0_4px_rgba(0,255,0,0.7)] 
//                    font-extrabold text-xl px-1 py-1 tracking-widest text-center border border-green-400"
//       />
//     </div>
//   <ChevronDown className={`w-4 h-4 text-red-500 ${isDropdownOpen ? "rotate-180" : ""}`} />
//       </button>

//       {isDropdownOpen && (
//         <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
//           <button
//             onClick={togglePause}
//             className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium
//               ${isPaused ? "bg-green-500 hover:bg-green-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-white"}`}
//           >
//             {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
//             <span>{isPaused ? "Resume Timer" : "Pause Timer"}</span>
//           </button>

//           <div className="grid grid-cols-3 gap-2 mt-4">
//             {options.map((opt) => (
//               <button
//                 key={opt.value}
//                 onClick={() => updateTimeoutDuration(opt.value)}
//                 className={`text-xs py-2 px-3 rounded-lg border font-medium ${
//                   isSelected(opt.value)
//                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                     : "border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
//                 }`}
//               >
//                 {opt.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
