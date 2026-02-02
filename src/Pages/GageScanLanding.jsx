import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import Loader from "../Components/Loader";
import GageCardView from "../Components/Admin/GageCardView";

export default function GageScanLanding() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gage, setGage] = useState(null);
  const [showNotFound, setShowNotFound] = useState(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const serial = params.get("serial") || params.get("serialnumber") || params.get("sn");
  const idParam = params.get("id");

  useEffect(() => {
    if (!isAuthenticated()) {
      const redirect = encodeURIComponent(location.pathname + location.search);
      localStorage.setItem("redirectTo", location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`, { replace: true });
      return;
    }

    const fetchGage = async () => {
      try {
        setLoading(true);
        setError("");
        setShowNotFound(false);
        let resp;
        if (serial) {
          resp = await api.get(`/gages/serial/${encodeURIComponent(serial)}`);
        } else if (idParam) {
          resp = await api.get(`/gages/${encodeURIComponent(idParam)}`);
        } else {
          setError("Missing scan parameters.");
          return;
        }
        setGage(resp.data);
      } catch (e) {
        if (e.response?.status === 404) {
          setShowNotFound(true);
        } else {
          setError(e.response?.data?.message || "Could not load gage.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGage();
  }, [isAuthenticated, location.pathname, location.search, navigate, serial, idParam]);

  const handleDismiss = () => {
    setShowNotFound(false);

    // Force full page refresh → then navigate
    window.location.href = "/dashboard/admin";

    // Alternative (if you prefer replace behavior after refresh):
    // window.location.replace("/dashboard/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader message="Opening gage..." />
      </div>
    );
  }

  if (showNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full border border-gray-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gage Not Found</h3>
            <p className="text-gray-600 mb-6">
              {serial 
                ? `Serial number "${serial}" is not in the system.` 
                : `Gage ID "${idParam}" is not in the system.`}
            </p>
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate("/dashboard/admin")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Scanned Gage</h1>
      <GageCardView
        gages={gage ? [gage] : []}
        onEdit={() => {}}
        onSchedule={() => {}}
        onRetire={() => {}}
        selectedGage={null}
        showSchedule={false}
        setShowSchedule={() => {}}
        setSelectedGage={() => {}}
        onUpdated={() => {}}
      />
       <button
              onClick={handleDismiss}
              className="w-60 h-12 py-3 px-8 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Back to Dashboard
            </button>
    </div>
  );
}