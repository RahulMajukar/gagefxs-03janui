// // src/components/LoginPage.jsx
// import React, { useState } from "react";
// import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
// // import logo from "../assets/logo.png"; // Replace with your logo path

// const LoginPage = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = (e) => {
//     e.preventDefault();
//     // Add your login logic here
//     console.log({ email, password });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
//       <div className="bg-white shadow-2xl rounded-2xl max-w-md w-full p-8">
//         <div className="flex justify-center mb-6">
//           {/* <img src={logo} alt="Logo" className="w-24 h-24 object-contain" /> */}
//         </div>
//         <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
//           Welcome Back
//         </h2>
//         <p className="text-center text-gray-500 mb-6">
//           Enter your credentials to access your account
//         </p>
//         <form onSubmit={handleLogin} className="space-y-4">
//           {/* Email Input */}
//           <div className="relative">
//             <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           {/* Password Input */}
//           <div className="relative">
//             <FaLock className="absolute left-3 top-3 text-gray-400" />
//             <input
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               className="w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <div
//               className="absolute right-3 top-3 cursor-pointer text-gray-400"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </div>
//           </div>

//           {/* Remember Me */}
//           <div className="flex items-center justify-between text-sm text-gray-500">
//             <label className="flex items-center space-x-2">
//               <input type="checkbox" className="w-4 h-4" />
//               <span>Remember Me</span>
//             </label>
//             <a href="#" className="hover:text-blue-500">
//               Forgot Password?
//             </a>
//           </div>

//           {/* Login Button */}
//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition duration-300"
//           >
//             Login
//           </button>
//         </form>

//         {/* Footer */}
//         <p className="text-center text-gray-400 mt-6 text-sm">
//           Don’t have an account?{" "}
//           <a href="#" className="text-blue-600 hover:underline">
//             Sign Up
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
