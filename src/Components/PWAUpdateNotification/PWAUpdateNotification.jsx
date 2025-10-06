import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import './PWAUpdateNotification.css';

const PWAUpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when a new service worker takes control
        window.location.reload();
      });

      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        });
      });

      // Check for updates periodically
      const checkForUpdates = () => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      };

      // Check for updates every 30 seconds
      const updateInterval = setInterval(checkForUpdates, 30000);

      return () => clearInterval(updateInterval);
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="pwa-update-banner">
      <div className="pwa-update-content">
        <div className="pwa-update-icon">
          <RefreshCw size={20} />
        </div>
        <div className="pwa-update-text">
          <h4>Update Available</h4>
          <p>A new version is ready. Refresh to get the latest features.</p>
        </div>
        <div className="pwa-update-actions">
          <button onClick={handleUpdate} className="pwa-update-btn">
            Refresh
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-btn">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;