import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import notificationService from '../../utils/notificationService';
import './NotificationPermission.css';

const NotificationPermission = () => {
  const [permission, setPermission] = useState('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(notificationService.isSupported());
    
    if (notificationService.isSupported()) {
      setPermission(Notification.permission);
      
      // Show prompt if permission is default and user hasn't dismissed it
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      setShowPrompt(false);
      
      if (newPermission === 'granted') {
        // Test notification
        await notificationService.showNotification('🎉 Notifications Enabled!', {
          body: 'You will now receive notifications for new leads',
          tag: 'permission-granted'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.showNotification('🧪 Test Notification', {
        body: 'This is a test notification to verify everything is working!',
        tag: 'test-notification',
        requireInteraction: false
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  if (!isSupported) {
    return null; // Don't show anything if notifications aren't supported
  }

  // Permission status indicator (always visible in corner)
  const StatusIndicator = () => (
    <div className={`notification-status-indicator ${permission}`} title={`Notifications: ${permission}`}>
      {permission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
    </div>
  );

  return (
    <>
      <StatusIndicator />
      
      {showPrompt && permission === 'default' && (
        <div className="notification-permission-prompt">
          <div className="notification-prompt-content">
            <div className="notification-prompt-header">
              <Bell className="notification-prompt-icon" />
              <h3>Enable Lead Notifications</h3>
              <button className="notification-prompt-close" onClick={handleDismiss}>
                <X size={18} />
              </button>
            </div>
            
            <div className="notification-prompt-body">
              <p>Get instantly notified when new leads are added, even when the app is closed!</p>
              <div className="notification-prompt-actions">
                <button 
                  className="notification-enable-btn"
                  onClick={handleRequestPermission}
                >
                  <Bell size={16} />
                  Enable Notifications
                </button>
                <button 
                  className="notification-dismiss-btn"
                  onClick={handleDismiss}
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel for granted permissions */}
      {permission === 'granted' && (
        <div className="notification-settings">
          <button 
            className="notification-test-btn"
            onClick={handleTestNotification}
            title="Test Notification"
          >
            <Bell size={14} />
            Test
          </button>
        </div>
      )}
    </>
  );
};

export default NotificationPermission;
