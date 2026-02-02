// src/App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./auth/AuthContext";
import { SystemTimeoutProvider } from "./auth/SystemTimeoutContext";
import { CallProvider } from "./auth/CallContext";
import { useAuth } from "./auth/AuthContext";
// ✅ Add this import
import { NotificationProvider } from "./providers/NotificationProvider";

function AppWithProviders() {
  const { currentUser } = useAuth();
  
  return (
    <CallProvider currentUser={currentUser}>
      <AppRoutes />
    </CallProvider>
  );
}

function App() {
  return (
    <NotificationProvider> {/* ✅ Wrap with NotificationProvider */}
      <AuthProvider>
        <BrowserRouter>
          <SystemTimeoutProvider>
            <AppWithProviders />
          </SystemTimeoutProvider>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;