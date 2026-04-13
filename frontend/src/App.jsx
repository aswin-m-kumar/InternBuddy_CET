import { Landing } from "./pages/Landing";
import { Auth } from "./pages/Auth";

function App() {
  if (window.location.hash === "#auth") {
    return <Auth />;
  }

  return <Landing />;
}

export default App;
