import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';

class NotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔔 Initializing notification service...');

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers are not supported');
        return;
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications are not supported');
        return;
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Request notification permission
      this.permission = await this.requestPermission();
      console.log('📋 Notification permission:', this.permission);

      if (this.permission === 'granted') {
        console.log('✅ Notification service initialized successfully');
        this.initialized = true;
      } else {
        console.warn('⚠️ Notification permission not granted');
      }
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  async requestPermission() {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async sendLeadNotification(leadData) {
    console.log('🚀 sendLeadNotification called for:', leadData.name);

    if (!this.initialized) {
      console.log('⚠️ Notification service not initialized, attempting to initialize...');
      await this.initialize();
    }

    if (this.permission !== 'granted') {
      console.warn('⚠️ Cannot send notification: permission not granted');
      return false;
    }

    try {
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
          leadId: leadData.id,
          leadName: leadData.name,
          url: '/leads',
          timestamp: Date.now(),
          type: 'new_lead'
        }
      };

      // Try service worker notification first
      if (this.registration) {
        try {
          await this.registration.showNotification(title, options);
          console.log('✅ Service worker notification sent');
          return true;
        } catch (swError) {
          console.warn('⚠️ Service worker notification failed:', swError);
        }
      }

      // Fallback to browser notification
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        console.log('👆 Notification clicked');
        window.focus();
        notification.close();
        
        if (window.location.pathname !== '/leads') {
          window.location.href = '/leads';
        }
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
      
      console.log('✅ Browser notification sent');
      return true;

    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  getPermission() {
    return this.permission;
  }

  destroy() {
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
