import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaCheckCircle,
  FaUser
} from "react-icons/fa";
import minitabLogo from "../assets/Qsutra GageFX Logo Square.png";
import Stratumlogo from '../assets/HTF.png';
import api from "../api/axios";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", role: "" });

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    setShowSuccessPopup(false);

    try {
      const response = await api.post("/auth/signin", {
        username: data.usernameOrEmail,
        password: data.password,
      }, { withCredentials: true });

      const userData = response.data;

      const roleFromAPI = Array.isArray(userData.roles)
        ? userData.roles[0]
        : Array.from(userData.roles)[0];
      const cleanRole = roleFromAPI.replace("ROLE_", "");

      localStorage.setItem("username", data.usernameOrEmail);
      localStorage.setItem("userRole", cleanRole);
      if (userData.token) localStorage.setItem("token", userData.token);

      login({ ...userData, role: cleanRole, profileImage: userData.profileImage || "" });

      // Save for popup display
      setLoginData({
        username: data.usernameOrEmail,
        role: cleanRole.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      });

      setShowSuccessPopup(true);
    } catch (err) {
      console.error(err);
      setServerError(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (showSuccessPopup) {
      timer = setTimeout(() => {
        const urlParams = new URLSearchParams(location.search);
        const redirect = urlParams.get("redirect") || localStorage.getItem("redirectTo");
        if (redirect) {
          localStorage.removeItem("redirectTo");
          navigate(redirect, { replace: true });
        } else {
          const cleanRole = localStorage.getItem("userRole") || "USER";
          // IT_ADMIN should land on the main dashboard
          const dashboardPath = cleanRole === "IT_ADMIN"
            ? "/dashboard"
            : `/dashboard/${cleanRole.toLowerCase()}`;
          navigate(dashboardPath, { replace: true });
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessPopup, navigate, location.search]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-blue-100">

      {/* LEFT SIDE Branding */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-600 via-violet-500 to-purple-400 p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <img src={minitabLogo} alt="AGI Logo" className="w-[200px] h-auto mb-9 mr-6" />
          </div>
          <h1 className="text-2xl text-white leading-tight">Qsutra - Gage Management System</h1>
          <h3 className="text-white text-sm">Ver 2.0.1 (7th April, 2025)</h3>
          <p className="text-white text-xs mt-4 leading-tight">
            International copyright laws and treaties for Intellectual Property govern & protect this computer program.
            Unauthorized reproduction or distribution is strictly prohibited.
          </p>

          <div className="relative mt-16">
            <div className="absolute -top-10 left-20 w-24 h-8 bg-pink-400/50 rounded-full transform rotate-45"></div>
            <div className="absolute top-10 left-40 w-32 h-8 bg-orange-400/50 rounded-full transform -rotate-12"></div>
            <div className="absolute top-20 left-10 w-20 h-20 bg-pink-400/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <img src={Stratumlogo} alt="Gage Management Logo" className="w-18 h-16 mx-auto mb-4" />

          {serverError && (
            <div className="flex items-center text-red-600 mb-3">
              <FaExclamationCircle className="mr-2" /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <select
                id="selectedField"
                className={`bg-gray-100 text-gray-900 w-full pl-3 pr-10 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${errors.selectedField ? "border-red-500 ring-1 ring-red-500" : ""}`}
                disabled={loading}
                {...register("selectedField", { required: "Role selection is required" })}
              >
                <option value="">Select Role</option>
                <option value="IT_ADMIN">QC Manager</option>
                {/* <option value="ADMIN">Admin</option>
                <option value="CRIB_MANAGER">Crib Manager</option>
                <option value="OPERATOR">Operator</option>
                <option value="PLANT_HOD">Plant HOD</option> */}
                <option value="CALIBRATION_MANAGER">Plant Head</option>
                {/* <option value="USER">User</option>
                <option value="MANAGER">Manager</option> */}
              </select>
              {errors.selectedField && (
                <p className="text-red-500 text-xs mt-1">{errors.selectedField.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                <FaEnvelope className="inline mr-2 text-pink-500" /> Username or Email
              </label>
              <input
                type="text"
                placeholder="username or user@system.com"
                autoComplete="username"
                className={`appearance-none border ${errors.usernameOrEmail ? "border-red-500" : "border-gray-300"} rounded-lg w-full py-2 px-3 text-gray-700`}
                {...register("usernameOrEmail", { required: "Username or email is required" })}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                <FaLock className="inline mr-2 text-pink-500" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••"
                  autoComplete="current-password"
                  className={`appearance-none border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg w-full py-2 px-3 text-gray-700`}
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full py-2 px-4 rounded-lg font-bold flex items-center justify-center"
            >
              <FaSignInAlt className="mr-2" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* 🌟 Premium Success Popup */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          aria-live="polite"
        >
          <div className="relative w-full max-w-md">
            {/* Outer glow (optional subtle pulse) */}
            <div className="absolute inset-0 bg-green-400 rounded-2xl blur-xl opacity-20"></div>

            <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg flex items-center">
                    <FaCheckCircle className="mr-2" /> Login Successful!
                  </h3>
                  <div className="h-2 w-16 bg-green-300 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-white animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="p-6 text-center">
                <div className="mx-auto mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto border-2 border-green-200">
                    <FaUser className="text-green-600 text-3xl" />
                  </div>
                </div>

                <h4 className="text-gray-800 font-semibold text-xl mb-1">
                  Welcome back, {loginData.username.split('@')[0]}!
                </h4>
                <p className="text-gray-600 mb-4">
                  Role: <span className="font-medium text-emerald-600">{loginData.role}</span>
                </p>

                <div className="mt-4 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-green-500 rounded-full animate-successProgress"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Redirecting to your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes successProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-successProgress {
          animation: successProgress 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}