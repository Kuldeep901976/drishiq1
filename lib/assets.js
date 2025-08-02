// Asset URLs for local development and production
// This file provides easy access to your assets

export const ASSET_CATEGORIES = {
  IMAGES: 'images',
  LOGOS: 'logos',
  ICONS: 'icons',
  SOCIAL_ICONS: 'social-icons'
};

// Base URL for assets (local development)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010';
};

// Asset mapping with local paths
export const ASSETS = {
  [ASSET_CATEGORIES.IMAGES]: {
    'profile_toggle.gif': '/assets/images/profile_toggle.gif'
  },
  [ASSET_CATEGORIES.LOGOS]: {
    'Logo.png': '/assets/logo/Logo.png',
    'facicon.png': '/assets/logo/facicon.png'
  },
  [ASSET_CATEGORIES.ICONS]: {
    'attach.png': '/assets/other-Icons/attach.png',
    'mic.png': '/assets/other-Icons/mic.png',
    'qr-code.png': '/assets/other-Icons/qr-code.png',
    'search.png': '/assets/other-Icons/search.png',
    'send.png': '/assets/other-Icons/send.png',
    'toggle.png': '/assets/other-Icons/toggle.png'
  },
  [ASSET_CATEGORIES.SOCIAL_ICONS]: {
    'facebook.png': '/assets/social-icons/facebook.png',
    'google.png': '/assets/social-icons/google.png',
    'linkedin.png': '/assets/social-icons/linkedin.png'
  }
};

// Helper function to get asset URL
export function getAssetUrl(category, filename) {
  const relativePath = ASSETS[category]?.[filename];
  if (!relativePath) return null;
  
  // For local development, use relative paths
  if (process.env.NODE_ENV === 'development') {
    return relativePath;
  }
  
  // For production, use full URL
  return `${getBaseUrl()}${relativePath}`;
}

// Helper function to get optimized asset URL
export function getOptimizedAssetUrl(category, filename, width = 800, quality = 80) {
  const baseUrl = getAssetUrl(category, filename);
  if (!baseUrl) return null;
  
  // For external storage URLs, add optimization parameters if needed
  if (baseUrl.includes('your-storage-service.com')) {
    return `${baseUrl}?w=${width}&q=${quality}`;
  }
  
  // For local files, return as is (Next.js will handle optimization)
  return baseUrl;
}

// Predefined asset getters for common use cases
export const AssetGetters = {
  // Logo assets
  getLogo: () => getAssetUrl(ASSET_CATEGORIES.LOGOS, 'Logo.png'),
  getFavicon: () => getAssetUrl(ASSET_CATEGORIES.LOGOS, 'facicon.png'),
  
  // Icon assets
  getAttachIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'attach.png'),
  getMicIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'mic.png'),
  getQrCodeIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'qr-code.png'),
  getSearchIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'search.png'),
  getSendIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'send.png'),
  getToggleIcon: () => getAssetUrl(ASSET_CATEGORIES.ICONS, 'toggle.png'),
  
  // Social icons
  getFacebookIcon: () => getAssetUrl(ASSET_CATEGORIES.SOCIAL_ICONS, 'facebook.png'),
  getGoogleIcon: () => getAssetUrl(ASSET_CATEGORIES.SOCIAL_ICONS, 'google.png'),
  getLinkedinIcon: () => getAssetUrl(ASSET_CATEGORIES.SOCIAL_ICONS, 'linkedin.png'),
  
  // Image assets
  getProfileToggle: () => getAssetUrl(ASSET_CATEGORIES.IMAGES, 'profile_toggle.gif')
};

// Function to update asset URLs after external storage upload
export function updateAssetUrls(assetUrls) {
  Object.keys(assetUrls).forEach(category => {
    if (ASSETS[category]) {
      Object.keys(assetUrls[category]).forEach(filename => {
        if (ASSETS[category][filename] !== undefined) {
          ASSETS[category][filename] = assetUrls[category][filename];
        }
      });
    }
  });
}

// Load asset URLs from file (if exists)
export async function loadAssetUrls() {
  try {
    const response = await fetch('/asset-urls.json');
    const assetUrls = await response.json();
    updateAssetUrls(assetUrls);
    return assetUrls;
  } catch (error) {
    console.warn('Asset URLs file not found. Using local assets.');
    return null;
  }
}

// Get all assets for a category
export function getAssetsByCategory(category) {
  return ASSETS[category] || {};
}

// Get all available categories
export function getAvailableCategories() {
  return Object.keys(ASSETS);
} 