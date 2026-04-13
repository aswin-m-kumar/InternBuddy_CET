const defaultBase =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://intern-buddy-cet.vercel.app";

const API_BASE = (import.meta.env.VITE_API_URL || defaultBase).replace(
  /\/+$/,
  "",
);

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

function signIn({ email, password }) {
  return apiRequest("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function signUp({ fullName, email, password }) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
}

function signOut() {
  return apiRequest("/api/auth/signout", {
    method: "POST",
  });
}

function startGoogleSignIn() {
  window.location.href = `${API_BASE}/api/auth/google/start`;
}

export { API_BASE, signIn, signOut, signUp, startGoogleSignIn };
