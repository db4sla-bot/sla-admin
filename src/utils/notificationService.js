import { collection, addDoc, getDocs, query, where, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';

class NotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.initialized = false;
    this.deviceToken = null;
    this.userId = null;
    this.notificationListener = null;
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
        // Generate unique device token
        await this.generateDeviceToken();
        
        // Register this device in Firestore
        await this.registerDevice();
        
        // Start listening for notifications
        this.startNotificationListener();
        
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

  generateDeviceToken() {
    // Generate a unique device identifier
    let deviceId = localStorage.getItem('device_token');
    
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_token', deviceId);
    }
    
    this.deviceToken = deviceId;
    this.userId = 'user_' + Date.now(); // You can use actual user ID here
    
    console.log('📱 Device token generated:', this.deviceToken);
  }

  async registerDevice() {
    try {
      const deviceData = {
        deviceToken: this.deviceToken,
        userId: this.userId,
        userAgent: navigator.userAgent,
        registeredAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        active: true,
        notificationPermission: this.permission
      };

      // Check if device already exists
      const devicesRef = collection(db, 'notificationDevices');
      const q = query(devicesRef, where('deviceToken', '==', this.deviceToken));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Add new device
        await addDoc(devicesRef, deviceData);
        console.log('📱 Device registered successfully');
      } else {
        // Update existing device
        const deviceDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'notificationDevices', deviceDoc.id), {
          lastSeen: serverTimestamp(),
          active: true,
          notificationPermission: this.permission
        });
        console.log('📱 Device updated successfully');
      }
    } catch (error) {
      console.error('❌ Error registering device:', error);
    }
  }

  startNotificationListener() {
    try {
      // Listen for new notifications in real-time
      const notificationsRef = collection(db, 'globalNotifications');
      const q = query(
        notificationsRef,
        where('processed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      this.notificationListener = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            
            // Don't show notification if it's from this device
            if (notification.senderDevice !== this.deviceToken) {
              this.displayNotification(notification);
              
              // Mark as processed for this device
              this.markNotificationAsProcessed(change.doc.id);
            }
          }
        });
      });

      console.log('👂 Started listening for notifications');
    } catch (error) {
      console.error('❌ Error starting notification listener:', error);
    }
  }

  async displayNotification(notificationData) {
    if (this.permission !== 'granted') return;

    try {
      const options = {
        body: notificationData.body || 'New notification',
        icon: notificationData.icon || '/fav.png',
        badge: notificationData.badge || '/fav.png',
        tag: notificationData.tag || 'notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        data: notificationData.data || {}
      };

      // Show notification through service worker
      if (this.registration) {
        await this.registration.showNotification(notificationData.title, options);
        console.log('✅ Notification displayed:', notificationData.title);
      } else {
        // Fallback to browser notification
        const notification = new Notification(notificationData.title, options);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
          
          if (notificationData.data?.url) {
            window.location.href = notificationData.data.url;
          }
        };
      }
    } catch (error) {
      console.error('❌ Error displaying notification:', error);
    }
  }

  async markNotificationAsProcessed(notificationId) {
    try {
      await updateDoc(doc(db, 'globalNotifications', notificationId), {
        processed: true,
        processedAt: serverTimestamp(),
        processedBy: this.deviceToken
      });
    } catch (error) {
      console.error('❌ Error marking notification as processed:', error);
    }
  }

  async sendLeadNotification(leadData) {
    if (!this.initialized) {
      console.warn('⚠️ Notification service not initialized');
      return;
    }

    try {
      console.log('🚀 Sending lead notification to all devices...');

      const title = '🚀 New Lead Added!';
      const servicesList = Array.isArray(leadData.requiredServices) 
        ? leadData.requiredServices.join(', ') 
        : 'Services not specified';
        
      const body = `${leadData.name} from ${leadData.city || 'Unknown City'}\nServices: ${servicesList}`;

      // Create notification data
      const notificationData = {
        title: title,
        body: body,
        icon: '/fav.png',
        badge: '/fav.png',
        tag: 'new-lead-' + (leadData.id || Date.now()),
        type: 'new_lead',
        data: {
          leadId: leadData.id,
          leadName: leadData.name,
          leadPhone: leadData.phone,
          leadCity: leadData.city,
          services: leadData.requiredServices,
          source: leadData.source,
          url: '/leads',
          timestamp: Date.now()
        },
        senderDevice: this.deviceToken,
        createdAt: serverTimestamp(),
        processed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Save to Firestore - this will trigger notifications on all devices
      await addDoc(collection(db, 'globalNotifications'), notificationData);
      
      console.log('✅ Notification sent to all devices successfully');
      
      // Also show notification on current device immediately
      this.displayNotification(notificationData);

    } catch (error) {
      console.error('❌ Error sending lead notification:', error);
    }
  }

  async sendCustomNotification(title, body, data = {}) {
    if (!this.initialized) {
      console.warn('⚠️ Notification service not initialized');
      return;
    }

    try {
      const notificationData = {
        title: title,
        body: body,
        icon: '/fav.png',
        badge: '/fav.png',
        tag: 'custom-' + Date.now(),
        type: 'custom',
        data: data,
        senderDevice: this.deviceToken,
        createdAt: serverTimestamp(),
        processed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      await addDoc(collection(db, 'globalNotifications'), notificationData);
      
      console.log('✅ Custom notification sent to all devices');
      
      // Show on current device
      this.displayNotification(notificationData);

    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
    }
  }

  async getAllRegisteredDevices() {
    try {
      const devicesRef = collection(db, 'notificationDevices');
      const q = query(devicesRef, where('active', '==', true));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting registered devices:', error);
      return [];
    }
  }

  async updateDeviceStatus(active = true) {
    if (!this.deviceToken) return;

    try {
      const devicesRef = collection(db, 'notificationDevices');
      const q = query(devicesRef, where('deviceToken', '==', this.deviceToken));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const deviceDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'notificationDevices', deviceDoc.id), {
          active: active,
          lastSeen: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('❌ Error updating device status:', error);
    }
  }

  isSupported() {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  getPermission() {
    return this.permission;
  }

  async reinitialize() {
    console.log('🔄 Reinitializing notification service...');
    this.initialized = false;
    await this.initialize();
  }

  destroy() {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
    }
    
    // Mark device as inactive
    this.updateDeviceStatus(false);
    
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
