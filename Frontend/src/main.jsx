import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import UserContext from "./contexts/UserContext.jsx";
import RiderContext from "./contexts/RiderContext.jsx";
import SocketContext from "./contexts/SocketContext.jsx";

// Cargar Google Maps API desde .env
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (apiKey) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,directions`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <SocketContext>
      <UserContext>
        <RiderContext>
          <App />
        </RiderContext>
      </UserContext>
    </SocketContext>
  // </StrictMode>
);

// Register a manual service worker (production)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
      .then((reg) => {
        console.log('Service worker registered:', reg.scope);

        reg.update();

        if (navigator.serviceWorker.controller) {
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                window.location.reload();
              }
            });
          });
        }
      })
      .catch(err => console.error('SW registration failed:', err))
  })
}
