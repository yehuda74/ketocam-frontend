import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// …your existing imports…

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register the PWA service worker (vite-plugin-pwa)
if ('serviceWorker' in navigator) {
  // This import is optional; autoUpdate is already set; this just forces immediate claim after update
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // Optionally show a toast “New version available, tap to refresh”
        // e.g., window.location.reload();
      },
      onOfflineReady() {
        // Optionally toast “App ready to work offline”
      }
    });
  });
}