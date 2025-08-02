import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adManager, type AdConfig } from './ad-manager';

interface UseAdsOptions {
  userType?: 'guest' | 'free' | 'premium' | 'enterprise';
  enableAutoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseAdsReturn {
  bannerAds: AdConfig[];
  headerCenteredAd: AdConfig | null;
  footerFloatingAd: AdConfig | null;
  footerTakeoverAd: AdConfig | null;
  settings: any;
  dismissAd: (adId: string, permanent?: boolean) => void;
  refreshAds: () => void;
  isLoading: boolean;
}

export function useAds(options: UseAdsOptions = {}): UseAdsReturn {
  const {
    userType = 'guest',
    enableAutoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const pathname = usePathname();
  const [adsData, setAdsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAds = () => {
    const data = adManager.getAdsForPage(pathname || '', userType);
    setAdsData(data);
    setIsLoading(false);
  };

  const dismissAd = (adId: string, permanent: boolean = false) => {
    adManager.dismissAd(adId, permanent);
    loadAds(); // Refresh ads after dismissal
  };

  const refreshAds = () => {
    loadAds();
  };

  useEffect(() => {
    loadAds();
  }, [pathname, userType]);

  // Auto-refresh ads if enabled
  useEffect(() => {
    if (!enableAutoRefresh) return;

    const interval = setInterval(() => {
      loadAds();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, pathname, userType]);

  return {
    bannerAds: adsData?.bannerAds || [],
    headerCenteredAd: adsData?.headerCenteredAd || null,
    footerFloatingAd: adsData?.footerFloatingAd || null,
    footerTakeoverAd: adsData?.footerTakeoverAd || null,
    settings: adsData?.settings || {},
    dismissAd,
    refreshAds,
    isLoading
  };
}

// Admin hook for managing ads
export function useAdManager() {
  const [allAds, setAllAds] = useState<AdConfig[]>([]);
  const [pageSettings, setPageSettings] = useState<any>({});

  const loadData = () => {
    setAllAds(adManager.getAllAds());
    setPageSettings(adManager.getPageSettings());
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    allAds,
    pageSettings,
    addAd: (ad: AdConfig) => {
      adManager.addAd(ad);
      loadData();
    },
    removeAd: (adId: string) => {
      adManager.removeAd(adId);
      loadData();
    },
    updateAd: (adId: string, updates: Partial<AdConfig>) => {
      adManager.updateAd(adId, updates);
      loadData();
    },
    updatePageSettings: (page: string, settings: any) => {
      adManager.updatePageSettings(page, settings);
      loadData();
    },
    clearDismissedAds: () => {
      adManager.clearDismissedAds();
      loadData();
    },
    refreshData: loadData
  };
} 