class NotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.initialized = false;
    this.subscribers = new Set();
    this.broadcastChannel = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔔 Initializing notification service...');

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers are not supported');
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('Notifications are not supported');
      }

      // Register service worker if not already registered
      this.registration = await this.getServiceWorkerRegistration();
      console.log('✅ Service worker ready:', this.registration);

      // Request notification permission
      this.permission = await this.requestPermission();
      console.log('📋 Notification permission:', this.permission);

      if (this.permission === 'granted') {
        console.log('✅ Notification service initialized successfully');
        this.setupMessageListener();
        this.setupBroadcastChannel();
        this.initialized = true;
        
        // Test notification to confirm it's working
        await this.sendTestNotification();
      } else {
        console.warn('⚠️ Notification permission not granted:', this.permission);
        this.initialized = true; // Still mark as initialized to prevent endless retries
      }
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      
      // Retry initialization up to maxRetries times
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
        setTimeout(() => this.initialize(), 2000 * this.retryCount);
      } else {
        console.error('❌ Max retries reached. Notification service initialization failed.');
        this.initialized = true; // Prevent further attempts
      }
    }
  }

  async getServiceWorkerRegistration() {
    try {
      // Try to get existing registration first
      let registration = await navigator.serviceWorker.ready;
      
      if (!registration) {
        // Register new service worker if none exists
        console.log('📝 Registering new service worker...');
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        // Wait for it to be ready
        registration = await navigator.serviceWorker.ready;
      }
      
      return registration;
    } catch (error) {
      console.error('❌ Error getting service worker registration:', error);
      throw error;
    }
  }

  async requestPermission() {
    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      // Show a user-friendly prompt first
      if (this.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        
        // Request permission
        const permission = await Notification.requestPermission();
        this.permission = permission;
        
        if (permission === 'granted') {
          console.log('✅ Notification permission granted!');
        } else if (permission === 'denied') {
          console.warn('❌ Notification permission denied');
        } else {
          console.warn('⏸️ Notification permission dismissed');
        }
        
        return permission;
      }
      
      return this.permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('🔄 Service worker updated:', event.data.version);
        }
      });
    }
  }

  setupBroadcastChannel() {
    // Use BroadcastChannel to communicate between tabs
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('lead-notifications');
        
        this.broadcastChannel.addEventListener('message', (event) => {
          console.log('📡 Broadcast message received:', event.data);
          
          if (event.data.type === 'NEW_LEAD') {
            // Only show notification if this isn't the tab that created the lead
            if (!event.data.fromCurrentTab) {
              this.showNotification(event.data.title, event.data.options);
            }
          }
        });
        
        console.log('📡 Broadcast channel setup complete');
      } catch (error) {
        console.error('❌ Error setting up broadcast channel:', error);
      }
    } else {
      console.warn('⚠️ BroadcastChannel not supported');
    }
  }

  async sendTestNotification() {
    try {
      // Don't send test notification in production or if user hasn't explicitly enabled notifications
      if (window.location.hostname !== 'localhost') {
        return;
      }
      
      console.log('🧪 Sending test notification...');
      await this.showNotification('🎉 Notifications Enabled!', {
        body: 'You will now receive notifications for new leads',
        tag: 'test-notification',
        requireInteraction: false,
        silent: true // Don't make sound for test
      });
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }

  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('⚠️ Cannot show notification: permission not granted');
      return false;
    }

    try {
      console.log('🔔 Showing notification:', title, options);

      // Prepare notification options with defaults
      const notificationOptions = {
        body: options.body || 'A new lead has been added to the system',
        icon: options.icon || '/fav.png',
        badge: options.badge || '/fav.png',
        tag: options.tag || 'lead-notification',
        requireInteraction: options.requireInteraction !== false,
        actions: options.actions || [
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

      let notificationShown = false;

      // Try to show notification through service worker first
      if (this.registration) {
        try {
          console.log('📤 Sending notification to service worker...');
          
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: title,
              options: notificationOptions
            });
            notificationShown = true;
            console.log('✅ Notification sent to service worker');
          } else {
            // Fallback to direct service worker notification
            await this.registration.showNotification(title, notificationOptions);
            notificationShown = true;
            console.log('✅ Notification shown via service worker registration');
          }
        } catch (swError) {
          console.warn('⚠️ Service worker notification failed:', swError);
        }
      }

      // Fallback to browser notification if service worker failed
      if (!notificationShown) {
        console.log('🔔 Falling back to browser notification...');
        const notification = new Notification(title, notificationOptions);
        
        notification.onclick = () => {
          console.log('👆 Notification clicked');
          window.focus();
          notification.close();
          
          // Navigate to leads page if not already there
          if (window.location.pathname !== '/leads') {
            window.location.href = '/leads';
          }
        };

        // Auto close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);
        
        notificationShown = true;
        console.log('✅ Browser notification shown');
      }

      return notificationShown;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return false;
    }
  }

  async sendLeadNotification(leadData) {
    if (!this.initialized) {
      console.warn('⚠️ Notification service not initialized, attempting to initialize...');
      await this.initialize();
      
      if (!this.initialized) {
        console.error('❌ Cannot send notification: service not initialized');
        return;
      }
    }

    try {
      console.log('🚀 Sending lead notification for:', leadData.name);

      // Prepare notification data
      const title = '🚀 New Lead Added!';
      const servicesList = Array.isArray(leadData.requiredServices) 
        ? leadData.requiredServices.join(', ') 
        : 'Services not specified';
        
      const options = {
        body: `${leadData.name} from ${leadData.city || 'Unknown City'}\nServices: ${servicesList}`,
        icon: '/fav.png',
        badge: '/fav.png',
        tag: 'new-lead-' + (leadData.id || Date.now()),
        requireInteraction: true,
        data: {
          leadId: leadData.id,
          leadName: leadData.name,
          leadPhone: leadData.phone,
          leadCity: leadData.city,
          services: leadData.requiredServices,
          source: leadData.source,
          timestamp: Date.now(),
          type: 'new_lead',
          url: '/leads'
        }
      };

      // Show notification in current window/tab
      const success = await this.showNotification(title, options);

      if (success) {
        console.log('✅ Lead notification sent successfully');
        
        // Broadcast to other tabs/windows using BroadcastChannel
        if (this.broadcastChannel) {
          try {
            this.broadcastChannel.postMessage({
              type: 'NEW_LEAD',
              title: title,
              options: options,
              fromCurrentTab: true // Flag to identify the source tab
            });
            console.log('📡 Notification broadcasted to other tabs');
          } catch (broadcastError) {
            console.error('❌ Error broadcasting notification:', broadcastError);
          }
        }

        // Store notification for offline users or missed notifications
        this.storeNotificationForOfflineUsers(leadData);
        
        // Notify subscribers (if any components are listening)
        this.notifySubscribers({
          type: 'lead_notification_sent',
          leadData: leadData,
          timestamp: Date.now()
        });
      } else {
        console.error('❌ Failed to send lead notification');
      }

    } catch (error) {
      console.error('❌ Error sending lead notification:', error);
    }
  }

  storeNotificationForOfflineUsers(leadData) {
    try {
      // Store notification data for users who might be offline
      const notifications = JSON.parse(localStorage.getItem('pending-notifications') || '[]');
      
      const notificationData = {
        id: `lead-${leadData.id || Date.now()}-${Date.now()}`,
        type: 'new_lead',
        leadData: leadData,
        timestamp: Date.now(),
        shown: false,
        expires: Date.now() + (24 * 60 * 60 * 1000) // Expire after 24 hours
      };
      
      notifications.push(notificationData);

      // Clean up expired and keep only last 20 notifications
      const validNotifications = notifications
        .filter(n => n.expires > Date.now())
        .slice(-20);

      localStorage.setItem('pending-notifications', JSON.stringify(validNotifications));
      console.log('💾 Notification stored for offline users');
    } catch (error) {
      console.error('❌ Error storing notification for offline users:', error);
    }
  }

  async checkPendingNotifications() {
    try {
      const notifications = JSON.parse(localStorage.getItem('pending-notifications') || '[]');
      const unshownNotifications = notifications.filter(n => 
        !n.shown && 
        n.expires > Date.now() &&
        Date.now() - n.timestamp < (5 * 60 * 1000) // Only show notifications from last 5 minutes
      );

      console.log(`📬 Found ${unshownNotifications.length} pending notifications`);

      for (const notification of unshownNotifications) {
        if (notification.type === 'new_lead' && notification.leadData) {
          await this.sendLeadNotification(notification.leadData);
          
          // Mark as shown
          notification.shown = true;
        }
      }

      // Update localStorage
      if (unshownNotifications.length > 0) {
        localStorage.setItem('pending-notifications', JSON.stringify(notifications));
        console.log('📬 Processed pending notifications');
      }
    } catch (error) {
      console.error('❌ Error checking pending notifications:', error);
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
        console.error('❌ Error in notification subscriber:', error);
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

  // Force re-initialization
  async reinitialize() {
    console.log('🔄 Forcing notification service re-initialization...');
    this.initialized = false;
    this.retryCount = 0;
    await this.initialize();
  }

  // Cleanup
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    this.subscribers.clear();
    this.initialized = false;
    console.log('🧹 Notification service destroyed');
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.notificationService = notificationService;
}

export default notificationService;
