import axios from "axios";

// Use same-origin base URL so Vite dev proxy forwards to backend
// and cookies (sessions) are sent correctly.
const api = axios.create({
  baseURL: "/",
  withCredentials: true
});

export default api;
