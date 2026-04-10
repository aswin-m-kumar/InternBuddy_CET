const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://internbuddy-cet.vercel.app";

export { API_BASE };
