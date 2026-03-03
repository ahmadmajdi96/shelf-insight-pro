import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Migrate: clear old custom backend URL so the app uses the default backend
const oldApiUrl = localStorage.getItem('shelfvision_api_url');
if (oldApiUrl && oldApiUrl.includes('iralpha.backend.cortanexai.com')) {
  localStorage.removeItem('shelfvision_api_url');
}

createRoot(document.getElementById("root")!).render(<App />);
