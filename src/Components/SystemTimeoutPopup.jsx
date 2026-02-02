// import React, { useState, useEffect } from "react";
// import { useAuth } from "../auth/AuthContext";
// import { useSystemTimeout } from "../auth/SystemTimeoutContext";
// import { AlertTriangle, X } from "lucide-react";
// import DigitalClock from "../Components/Layout/DigitalClock";

// export default function SystemTimeoutPopup() {
//   const { user } = useAuth();
//   const { isPopupVisible, handlePopupClose } = useSystemTimeout();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isVerifying, setIsVerifying] = useState(false);

//   useEffect(() => {
//     if (isPopupVisible) {
//       setUsername("");
//       setPassword("");
//       setError("");
//     }
//   }, [isPopupVisible]);

//   useEffect(() => {
//     if (user?.username) setUsername(user.username);
//   }, [user]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!username.trim() || !password.trim()) {
//       setError("Please enter both username and password");
//       return;
//     }

//     setIsVerifying(true);
//     setError("");

//     try {
//       await new Promise((resolve) => setTimeout(resolve, 500));
//       if (user?.username && username.toLowerCase() === user.username.toLowerCase() && password.trim()) {
//         handlePopupClose();
//       } else setError("Invalid username or password");
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   if (!isPopupVisible) return null;

//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 bg-black">
//       <div className="w-full h-full flex flex-col items-center justify-center font-mono text-green-400 relative">
//         {/* Header */}
//         <div className="flex justify-between items-center w-full max-w-sm p-4 border-b border-green-600">
//           <div className="flex items-center space-x-2">
//             <AlertTriangle className="w-5 h-5 text-yellow-400" />
//             <span className="text-lg font-bold">Session Timeout</span>
//           </div>
//           <button className="text-green-400 cursor-not-allowed" disabled>
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//  <div className="w-full max-w-sm mx-auto py-8 flex justify-center">
//   <div className="clock-container bg-black text-green-400 rounded-md px-3 py-1 flex items-center justify-center font-mono">
//   <DigitalClock className="text-green-500 text-lg" />
// </div>

// </div>

//         {/* Form */}
//         <div className="w-full max-w-sm p-4">
//           <p className="text-green-300  mb-4 text-center text-sm">
//             Your session has timed out. Please re-enter credentials.
//           </p>

//           <form onSubmit={handleSubmit} className="space-y-3">
//             <input
//               type="text"
//               placeholder="Username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full bg-black border border-green-600 text-green-400 px-3 py-2 rounded-md placeholder-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
//             />
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full bg-black border border-green-600 text-green-400 px-3 py-2 rounded-md placeholder-green-600 focus:outline-none focus:ring-1 focus:ring-green-500"
//             />

//             {error && <p className="text-red-500 text-sm">{error}</p>}

//             <button
//               type="submit"
//               disabled={isVerifying || !username.trim() || !password.trim()}
//               className="w-full py-2 rounded-md bg-green-600 text-black font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isVerifying ? "Verifying..." : "Continue Session"}
//             </button>
//           </form>
//         </div>

//         {/* Footer */}
//         <div className="text-center text-xs text-green-500 py-2 border-t border-green-600 w-full max-w-sm">
//           This popup remains until valid credentials are provided.
//         </div>
//       </div>

//       {/* Glow effect */}
//       <style>
//         {`
//           .glow {
//   text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00;
// }

//         `}
//       </style>
//     </div>
//   );
// }
