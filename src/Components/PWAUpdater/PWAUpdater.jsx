import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './PWAUpdater.css';

const PWAUpdater = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Register service worker and check for updates
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
      
      // Check for updates every 30 seconds
      const updateInterval = setInterval(checkForUpdates, 30000);
      
      return () => clearInterval(updateInterval);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      console.log('SW: Registered successfully');

      // Listen for service worker updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        console.log('SW: Update found, installing new version...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('SW: New version installed, showing update notification');
            setUpdateAvailable(true);
            showUpdateToast();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('SW: Service worker updated to', event.data.version);
          toast.success('App updated successfully! 🎉', {
            position: "top-center",
            autoClose: 3000,
          });
        }
      });

      // Check for existing update
      if (reg.waiting) {
        setUpdateAvailable(true);
        showUpdateToast();
      }

    } catch (error) {
      console.error('SW: Registration failed:', error);
    }
  };

  const checkForUpdates = () => {
    if (registration) {
      registration.update();
    }
  };

  const showUpdateToast = () => {
    toast.info(
      <div className="pwa-update-toast">
        <div className="pwa-update-message">
          🚀 New version available!
        </div>
        <div className="pwa-update-actions">
          <button 
            className="pwa-update-btn pwa-update-now"
            onClick={handleUpdate}
          >
            Update Now
          </button>
          <button 
            className="pwa-update-btn pwa-update-later"
            onClick={() => toast.dismiss()}
          >
            Later
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        className: "pwa-update-toast-container"
      }
    );
  };

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to get the new version
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      toast.dismiss();
      toast.loading('Updating app...', {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return null; // This component doesn't render anything visible
};

export default PWAUpdater;
