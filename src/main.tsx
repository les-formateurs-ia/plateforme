
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";
  // Étincelles au survol de tous les boutons .sweep (site public).
  import "./app/lib/particles/button-pulse";

  createRoot(document.getElementById("root")!).render(<App />);
  