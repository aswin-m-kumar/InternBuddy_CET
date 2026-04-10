const defaultBase =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://intern-buddy-cet.vercel.app";

const API_BASE = (import.meta.env.VITE_API_URL || defaultBase).replace(
  /\/+$/,
  "",
);

export { API_BASE };
