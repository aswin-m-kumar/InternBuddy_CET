const defaultBase =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://intern-buddy-cet.vercel.app";

const API_BASE = (import.meta.env.VITE_API_URL || defaultBase).replace(
  /\/+$/,
  "",
);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function parseJsonResponse(response) {
  return response.text().then((responseText) => {
    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return {};
    }
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve(existing);
        return;
      }

      existing.addEventListener("load", () => resolve(existing), {
        once: true,
      });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(script);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function loadGoogleIdentity() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured");
  }

  if (window.google?.accounts?.id) {
    return window.google.accounts.id;
  }

  await loadScript("https://accounts.google.com/gsi/client");

  if (!window.google?.accounts?.id) {
    throw new Error("Google sign-in SDK failed to load");
  }

  return window.google.accounts.id;
}

export async function signInWithGoogleCredential(credential) {
  const response = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ credential }),
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || data.error || "Google sign-in failed");
  }

  return data.user || null;
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    credentials: "include",
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Failed to load user session",
    );
  }

  return data;
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || data.error || "Logout failed");
  }

  return data;
}

export { API_BASE, GOOGLE_CLIENT_ID };
