import axios from "axios";

// 1. This line correctly reads your live backend URL from the Netlify environment variables.
//    If it's not found (like when you are on your local computer), it defaults to localhost.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// 2. We create the central API object with the correct live base URL.
const API = axios.create({
  baseURL: `${API_URL}/api`,
});

// 3. This is a very important addition. It automatically adds your login token
//    to every request you make after logging in. This fixes all "Unauthorized"
//    errors on protected pages like your dashboard.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // If a token exists, add it to the 'Authorization' header.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

export default API;
