import { createContext, useContext, useState, useEffect } from "react";
import Loader from "../Components/Loader";
import api from "../api/axios";

const AuthContext = createContext();

// Utility function to check if JWT token is expired
const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    
    // Decode JWT token (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume expired if we can't decode
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage and validate token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (storedUser && token) {
          // Check if token is expired locally first
          if (isTokenExpired(token)) {
            console.log("Token is expired, clearing authentication");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setUser(null);
            setLoading(false);
            return;
          }
          
          // Set user immediately for better UX
          setUser(JSON.parse(storedUser));
          
          // Try to validate token with backend, but don't fail if endpoint doesn't exist
          try {
            await api.get("/auth/validate");
            // Token is valid, keep user logged in
          } catch (error) {
            // If it's a 404 (endpoint doesn't exist) or other non-auth errors, 
            // assume token is valid and continue
            if (error.response?.status === 404) {
              console.log("Token validation endpoint not available, continuing with stored token");
            } else if (error.response?.status === 401) {
              // Token is invalid, clear everything
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              setUser(null);
            } else {
              // Other errors, assume token is valid for now
              console.log("Token validation error, continuing with stored token:", error.message);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Periodic token check to maintain authentication
  useEffect(() => {
    if (!user) return;

    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpired(token)) {
        console.log("Token expired during session, logging out");
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTokenInterval);
  }, [user]);

  const login = (userData, redirectPath = null) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    
    // Store redirect path for after login
    if (redirectPath) {
      localStorage.setItem('pendingRedirect', redirectPath);
    }
  };

  const logout = (redirectToLogin = false) => {
    // Clear any pending redirects
    localStorage.removeItem('pendingRedirect');
    
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // If redirectToLogin is true, navigate to login without redirect parameter
    if (redirectToLogin) {
      window.location.href = '/login';
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!user && !!token && !isTokenExpired(token);
  };

  // Get user role
  const getUserRole = () => {
    return user?.role;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Get and clear pending redirect
  const getAndClearRedirect = () => {
    const redirect = localStorage.getItem('pendingRedirect');
    if (redirect) {
      localStorage.removeItem('pendingRedirect');
      return redirect;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Loader message="Loading..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      getUserRole, 
      hasRole, 
      hasAnyRole,
      loading,
      getAndClearRedirect
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};