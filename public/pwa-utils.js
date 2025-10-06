// PWA Cache Management Utility
// Add this to browser console to manage PWA cache manually

window.PWAUtils = {
  // Clear all caches
  async clearAllCaches() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ All caches cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      return false;
    }
  },

  // Unregister service worker
  async unregisterServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('✅ Service worker unregistered successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Error unregistering service worker:', error);
      return false;
    }
  },

  // Force refresh with cache bypass
  forceRefresh() {
    window.location.reload(true);
  },

  // Complete PWA reset
  async resetPWA() {
    console.log('🔄 Resetting PWA...');
    await this.clearAllCaches();
    await this.unregisterServiceWorker();
    console.log('✅ PWA reset complete. Refreshing page...');
    setTimeout(() => {
      this.forceRefresh();
    }, 1000);
  },

  // Check cache status
  async checkCacheStatus() {
    try {
      const cacheNames = await caches.keys();
      console.log('📦 Available caches:', cacheNames);
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        console.log(`📁 Cache "${cacheName}" contains ${keys.length} items:`, keys.map(req => req.url));
      }
    } catch (error) {
      console.error('❌ Error checking cache status:', error);
    }
  }
};

// Log available commands
console.log(`
🔧 PWA Debug Utilities Available:
- PWAUtils.clearAllCaches() - Clear all caches
- PWAUtils.unregisterServiceWorker() - Unregister service worker  
- PWAUtils.forceRefresh() - Force refresh bypassing cache
- PWAUtils.resetPWA() - Complete PWA reset
- PWAUtils.checkCacheStatus() - Check what's cached
`);

export default window.PWAUtils;