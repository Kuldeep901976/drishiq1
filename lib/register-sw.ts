declare global {
  interface Window {
    workbox: any;
  }
}

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.workbox !== undefined
  ) {
    const wb = window.workbox;
    
    // Add success handler
    wb.addEventListener('activated', (event: any) => {
      console.log('Service Worker activated');
      // Check if there was a previous version
      if (event.isUpdate) {
        console.log('New content is available; please refresh.');
        // You can show a notification to the user here
        if (window.confirm('New content is available! Click OK to refresh.')) {
          window.location.reload();
        }
      }
    });

    // Add failure handler
    wb.addEventListener('controlling', () => {
      console.log('Service Worker controlling');
    });

    // Register the service worker after the page load
    window.addEventListener('load', () => {
      wb.register();
    });
  }
} 