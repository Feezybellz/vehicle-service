import axios from "axios";
// import dotenv from "dotenv";

// dotenv.config({ path: "../../.env" });

// const API_URL = "http://localhost:5000/api";
const API_URL = process.env.REACT_APP_BACKEND_API_URL;
console.log("API_URL", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    api.defaults.headers.common["Authorization"] = `Bearer ${refreshToken}`;
    const response = await api.post("/auth/refresh");
    const { token, refreshToken } = response.data;
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  signup: (userData) => api.post("/auth/signup", userData),
  logout: () => api.post("/auth/logout"),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
};

// Add response interceptor to handle token refresh
// List of endpoints that don't require token refresh
const noRefreshEndpoints = [
  "/auth/login",
  "/auth/signup",
  "/auth/refresh",
  "/auth/logout",
  "/auth/verify-email",
];

// Helper to check if endpoint needs refresh
const needsTokenRefresh = (url) => {
  return !noRefreshEndpoints.some((endpoint) => url.includes(endpoint));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log(
      "refreshing token",
      error.config.url,
      needsTokenRefresh(error.config.url)
    );
    if (needsTokenRefresh(error.config.url)) {
      try {
        await refreshToken();
        return api(error.config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// api.interceptors.response.use(
//   (response) => {
//     console.log(response);
//     return Promise.resolve(response);
//   }, // Success case (2xx)
//   (error) => {
//     console.log(error);

//     if (error.response) {
//       // Return the error response instead of rejecting
//       return Promise.resolve(error.response);
//     }
//     return Promise.reject(error);
//   }
// );
export const vehicles = {
  // refereshToken before making request

  getAll: () => api.get("/vehicles"),
  getOne: (id) => api.get(`/vehicles/${id}`),
  create: (vehicleData) => api.post("/vehicles", vehicleData),
  update: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const vehicleServices = {
  getAll: () => api.get("/vehicle-services"),
  getOne: (id) => api.get(`/vehicle-services/${id}`),
  create: (vehicleServiceData) =>
    api.post("/vehicle-services/", vehicleServiceData),
  update: (id, vehicleServiceData) =>
    api.patch(`/vehicle-services/${id}`, vehicleServiceData),
  delete: (id) => api.delete(`/vehicle-services/${id}`),
};

export const reminders = {
  getAll: () => api.get("/service-reminders"),
  getOne: (id) => api.get(`/service-reminders/${id}`),
  create: (reminderData) => api.post("/service-reminders", reminderData),
  update: (id, reminderData) =>
    api.put(`/service-reminders/${id}`, reminderData),
  complete: (id) => api.patch(`/service-reminders/${id}/complete`),
  delete: (id) => api.delete(`/service-reminders/${id}`),
};

export default api;
