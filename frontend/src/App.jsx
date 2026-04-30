import { useEffect, useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { getAuthSession } from "./lib/auth";

function App() {
  const [routeHash, setRouteHash] = useState(window.location.hash || "");
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncAuth = async () => {
      try {
        const result = await getAuthSession();
        if (!cancelled) {
          setIsAuthenticated(Boolean(result?.authenticated));
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
        }
      }
    };

    syncAuth();

    return () => {
      cancelled = true;
    };
  }, [routeHash]);

  useEffect(() => {
    const onHashChange = () => {
      const nextHash = window.location.hash || "";
      setRouteHash(nextHash);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const cameFromOAuthSuccess = searchParams.get("auth") === "success";

    if (cameFromOAuthSuccess && isAuthenticated) {
      window.history.replaceState({}, "", window.location.pathname);
      window.location.hash = "#dashboard";
      return;
    }

    if (isAuthenticated) {
      if (
        !routeHash ||
        routeHash.startsWith("#auth") ||
        routeHash.startsWith("#signup") ||
        routeHash.startsWith("#landing")
      ) {
        window.location.hash = "#dashboard";
      }
      return;
    }

    if (routeHash.startsWith("#dashboard")) {
      window.location.hash = "#landing";
    }
  }, [authChecked, isAuthenticated, routeHash]);

  if (!authChecked) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#09171a] text-[#e6f6f8]">
        <p className="text-sm font-semibold tracking-wide">
          Restoring session...
        </p>
      </div>
    );
  }

  if (routeHash.startsWith("#dashboard")) {
    return isAuthenticated ? <Dashboard /> : <Landing />;
  }

  if (
    routeHash.startsWith("#auth") ||
    routeHash.startsWith("#signup") ||
    routeHash.startsWith("#landing")
  ) {
    return <Landing />;
  }

  return isAuthenticated ? <Dashboard /> : <Landing />;
}

export default App;
