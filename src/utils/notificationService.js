class NotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.initialized = false;
    this.subscribers = new Set();
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers are not supported');
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('Notifications are not supported');
      }

      // Register service worker if not already registered
      this.registration = await navigator.serviceWorker.ready;

      // Request notification permission
      this.permission = await this.requestPermission();

      if (this.permission === 'granted') {
        console.log('Notification service initialized successfully');
        this.setupMessageListener();
        this.initialized = true;
        
        // Subscribe to notifications from other tabs/windows
        this.setupBroadcastChannel();
      } else {
        console.warn('Notification permission not granted:', this.permission);
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  async requestPermission() {
    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('Service worker updated:', event.data.version);
        }
      });
    }
  }

  setupBroadcastChannel() {
    // Use BroadcastChannel to communicate between tabs
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('lead-notifications');
      
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data.type === 'NEW_LEAD') {
          this.showNotification(event.data.title, event.data.options);
        }
      });
    }
  }

  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return false;
    }

    try {
      // Prepare notification options
      const notificationOptions = {
        body: options.body || 'A new lead has been added to the system',
        icon: options.icon || '/fav.png',
        badge: options.badge || '/fav.png',
        tag: options.tag || 'lead-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Lead'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: {
          url: '/leads',
          timestamp: Date.now(),
          ...options.data
        },
        ...options
      };

      // Show notification through service worker
      if (this.registration) {
        // Send message to service worker to show notification
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            options: notificationOptions
          });
        } else {
          // Fallback to direct notification if no controller
          await this.registration.showNotification(title, notificationOptions);
        }
      } else {
        // Fallback to browser notification
        new Notification(title, notificationOptions);
      }

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  async sendLeadNotification(leadData) {
    if (!this.initialized) {
      console.warn('Notification service not initialized');
      return;
    }

    try {
      // Prepare notification data
      const title = '🚀 New Lead Added!';
      const options = {
        body: `${leadData.name} from ${leadData.city || 'Unknown City'}\nServices: ${leadData.requiredServices?.join(', ') || 'Not specified'}`,
        icon: '/fav.png',
        badge: '/fav.png',
        tag: 'new-lead',
        requireInteraction: true,
        data: {
          leadId: leadData.id,
          leadName: leadData.name,
          leadPhone: leadData.phone,
          leadCity: leadData.city,
          services: leadData.requiredServices,
          source: leadData.source,
          timestamp: Date.now(),
          type: 'new_lead'
        }
      };

      // Show notification in current window
      const success = await this.showNotification(title, options);

      if (success) {
        console.log('Lead notification sent successfully');
        
        // Broadcast to other tabs/windows using BroadcastChannel
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'NEW_LEAD',
            title: title,
            options: options
          });
        }

        // Also store in localStorage for persistence
        this.storeNotificationForOfflineUsers(leadData);
      }

    } catch (error) {
      console.error('Error sending lead notification:', error);
    }
  }

  storeNotificationForOfflineUsers(leadData) {
    try {
      // Store notification data for users who might be offline
      const notifications = JSON.parse(localStorage.getItem('pending-notifications') || '[]');
      
      notifications.push({
        id: `lead-${leadData.id}-${Date.now()}`,
        type: 'new_lead',
        leadData: leadData,
        timestamp: Date.now(),
        shown: false
      });

      // Keep only last 10 notifications
      if (notifications.length > 10) {
        notifications.splice(0, notifications.length - 10);
      }

      localStorage.setItem('pending-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification for offline users:', error);
    }
  }

  async checkPendingNotifications() {
    try {
      const notifications = JSON.parse(localStorage.getItem('pending-notifications') || '[]');
      const unshownNotifications = notifications.filter(n => !n.shown);

      for (const notification of unshownNotifications) {
        if (notification.type === 'new_lead' && notification.leadData) {
          await this.sendLeadNotification(notification.leadData);
          
          // Mark as shown
          notification.shown = true;
        }
      }

      // Update localStorage
      localStorage.setItem('pending-notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  }

  // Subscribe to notifications (for components that want to listen)
  subscribe(callback) {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  // Check if notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  // Get current permission status
  getPermission() {
    return this.permission;
  }

  // Cleanup
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    this.subscribers.clear();
    this.initialized = false;
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;
