import { useEffect, useState } from "react";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
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
      setRouteHash(window.location.hash || "");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (isAuthenticated && !routeHash) {
      window.location.hash = "#dashboard";
      return;
    }

    if (routeHash.startsWith("#dashboard") && !isAuthenticated) {
      window.location.hash = "#auth";
      return;
    }

    if (routeHash.startsWith("#auth") && isAuthenticated) {
      window.location.hash = "#dashboard";
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

  if (routeHash.startsWith("#auth")) {
    if (isAuthenticated) {
      return <Dashboard />;
    }
    return <Auth />;
  }

  if (routeHash.startsWith("#dashboard")) {
    if (!isAuthenticated) {
      return <Auth />;
    }
    return <Dashboard />;
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <Landing />;
}

export default App;
