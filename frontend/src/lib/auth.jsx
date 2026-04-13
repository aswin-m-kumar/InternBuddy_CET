const defaultBase =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://intern-buddy-cet.vercel.app";

const API_BASE = (import.meta.env.VITE_API_URL || defaultBase).replace(
  /\/+$/,
  "",
);

let csrfTokenCache = null;
let csrfFetchInFlight = null;

async function fetchCsrfToken() {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  if (csrfFetchInFlight) {
    return csrfFetchInFlight;
  }

  csrfFetchInFlight = fetch(`${API_BASE}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.csrf_token) {
        throw new Error(
          data.message || data.error || "Failed to fetch CSRF token",
        );
      }
      csrfTokenCache = data.csrf_token;
      return csrfTokenCache;
    })
    .finally(() => {
      csrfFetchInFlight = null;
    });

  return csrfFetchInFlight;
}

function clearAuthCaches() {
  csrfTokenCache = null;
}

async function apiFetch(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    ...(options.headers || {}),
  };

  const hasFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!hasFormDataBody && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await fetchCsrfToken();
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    method,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function apiRequest(path, options = {}) {
  const { response, data } = await apiFetch(path, options);

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
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
  }).finally(() => {
    clearAuthCaches();
  });
}

function getAuthSession() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  }).then((data) => {
    if (data?.csrf_token) {
      csrfTokenCache = data.csrf_token;
    }
    return data;
  });
}

function startGoogleSignIn() {
  window.location.href = `${API_BASE}/api/auth/google/start`;
}

export {
  API_BASE,
  apiFetch,
  getAuthSession,
  signIn,
  signOut,
  signUp,
  startGoogleSignIn,
};
