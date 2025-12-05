// src/api/http.js
import axios from "axios";

export const BASE_URL =
  import.meta.env.VITE_API_URL || "https://theservrforthechuns.com";

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach JWT from localStorage to every request so protected APIs receive Authorization header
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const api = http;
export default http;
