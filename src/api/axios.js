import axios from "axios";

// Use env override if set, else fallback to current host:port/api
const baseURL = import.meta.env.VITE_API_URL || 
  `${window.location.protocol}//${window.location.hostname}:8080/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// // src/api/api.js
// import axios from "axios";

// // Use env override if set, else fallback to current host:port/api
// const baseURL =
//   import.meta.env.VITE_API_URL ||
//   `${window.location.protocol}//${window.location.hostname}:${window.location.port || "8080"}/api`;

// const api = axios.create({
//   baseURL,
//   withCredentials: true, // if using cookie-based auth
// });

// // Request interceptor: Attach JWT if available
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor: Handle 401 Unauthorized
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;