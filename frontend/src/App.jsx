import { useEffect, useState } from "react";
import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";

function App() {
  const [routeHash, setRouteHash] = useState(window.location.hash || "");

  useEffect(() => {
    const onHashChange = () => {
      setRouteHash(window.location.hash || "");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (routeHash === "#auth") {
    return <Auth />;
  }

  if (routeHash === "#dashboard") {
    return <Dashboard />;
  }

  return <Landing />;
}

export default App;
