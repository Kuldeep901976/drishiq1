interface AdConfig {
  id: string;
  type: 'banner' | 'header-centered' | 'footer-floating' | 'footer-takeover';
  title: string;
  subtitle?: string;
  cta: string;
  link: string;
  icon?: string;
  bg?: string;
  urgent?: boolean;
  autoHide?: number; // seconds
  delay?: number; // seconds
  dismissible?: boolean;
  conditions?: {
    pages?: string[]; // specific pages
    sections?: string[]; // specific sections
    userType?: 'guest' | 'free' | 'premium' | 'enterprise';
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    dayOfWeek?: string[];
    excludePages?: string[];
  };
}

interface PageAdSettings {
  bannerAds?: boolean;
  headerCenteredAd?: boolean;
  footerFloatingAd?: boolean;
  footerTakeoverAd?: boolean;
  maxAdsPerPage?: number;
  adFrequency?: number;
}

class AdManager {
  private static instance: AdManager;
  private adConfigs: AdConfig[] = [];
  private pageSettings: { [page: string]: PageAdSettings } = {};
  private userDismissals: Set<string> = new Set();

  private constructor() {
    this.initializeDefaultAds();
    this.initializePageSettings();
    this.loadUserDismissals();
  }

  public static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager();
    }
    return AdManager.instance;
  }

  private initializeDefaultAds() {
    this.adConfigs = [
      // Header Banner Ads
      {
        id: 'header-invitation',
        type: 'banner',
        title: "Join the DrishiQ Revolution",
        subtitle: "See Through the Challenge with Intelligence of Perception",
        cta: "Request Invitation",
        link: "/invitation",
        bg: "from-[#0B4422] to-green-600",
        icon: "lightning",
        urgent: true,
        dismissible: true,
        conditions: {
          pages: ['/', '/about'],
          userType: 'guest'
        }
      },
      {
        id: 'header-premium',
        type: 'banner',
        title: "Experience Clarity Like Never Before",
        subtitle: "Transform how you perceive and solve complex problems",
        cta: "Upgrade to Premium",
        link: "/payment",
        bg: "from-blue-600 to-[#0B4422]",
        icon: "eye",
        dismissible: true,
        conditions: {
          pages: ['/sessions', '/dashboard'],
          userType: 'free'
        }
      },
      
      // Centered Header Ads
      {
        id: 'header-special-offer',
        type: 'header-centered',
        title: "🎁 Special Clarity Boost",
        cta: "Claim Now",
        link: "/payment",
        autoHide: 6,
        dismissible: true,
        conditions: {
          pages: ['/'],
          timeOfDay: 'afternoon'
        }
      },
      {
        id: 'header-early-access',
        type: 'header-centered',
        title: "🚀 Limited Early Access",
        cta: "Get Access",
        link: "/invitation",
        autoHide: 8,
        dismissible: true,
        conditions: {
          pages: ['/'],
          dayOfWeek: ['saturday', 'sunday']
        }
      },

      // Footer Floating Ads
      {
        id: 'footer-premium',
        type: 'footer-floating',
        title: "🚀 DrishiQ Premium: Unlock deeper insights!",
        cta: "View Plans",
        link: "/payment",
        delay: 5,
        dismissible: true,
        conditions: {
          pages: ['/', '/sessions'],
          userType: 'guest'
        }
      },
      {
        id: 'footer-enterprise',
        type: 'footer-floating',
        title: "🏢 Enterprise Solution Available",
        cta: "Contact Sales",
        link: "/enterprise",
        delay: 8,
        dismissible: true,
        conditions: {
          pages: ['/dashboard'],
          userType: 'premium'
        }
      },

      // Footer Takeover Ads
      {
        id: 'takeover-flash-sale',
        type: 'footer-takeover',
        title: "⚡ Flash Sale: 50% Off Premium",
        cta: "Claim Now",
        link: "/payment",
        urgent: true,
        dismissible: true,
        conditions: {
          pages: ['/'],
          timeOfDay: 'evening',
          excludePages: ['/payment']
        }
      },
      {
        id: 'takeover-session-boost',
        type: 'footer-takeover',
        title: "🎯 Special Session Boost Available",
        cta: "Unlock Now",
        link: "/payment",
        dismissible: true,
        conditions: {
          pages: ['/sessions'],
          userType: 'free'
        }
      }
    ];
  }

  private initializePageSettings() {
    this.pageSettings = {
      '/': {
        bannerAds: true,
        headerCenteredAd: true,
        footerFloatingAd: true,
        footerTakeoverAd: false,
        maxAdsPerPage: 3,
        adFrequency: 1
      },
      '/sessions': {
        bannerAds: true,
        headerCenteredAd: false,
        footerFloatingAd: true,
        footerTakeoverAd: true,
        maxAdsPerPage: 2,
        adFrequency: 2
      },
      '/dashboard': {
        bannerAds: false,
        headerCenteredAd: false,
        footerFloatingAd: true,
        footerTakeoverAd: false,
        maxAdsPerPage: 1,
        adFrequency: 5
      },
      '/payment': {
        bannerAds: false,
        headerCenteredAd: false,
        footerFloatingAd: false,
        footerTakeoverAd: false,
        maxAdsPerPage: 0,
        adFrequency: 0
      },
      '/blog': {
        bannerAds: true,
        headerCenteredAd: false,
        footerFloatingAd: true,
        footerTakeoverAd: false,
        maxAdsPerPage: 2,
        adFrequency: 3
      }
    };
  }

  private loadUserDismissals() {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('drishiq-dismissed-ads');
      if (dismissed) {
        this.userDismissals = new Set(JSON.parse(dismissed));
      }
    }
  }

  private saveUserDismissals() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drishiq-dismissed-ads', JSON.stringify([...this.userDismissals]));
    }
  }

  public dismissAd(adId: string, permanent: boolean = false) {
    if (permanent) {
      this.userDismissals.add(adId);
      this.saveUserDismissals();
    } else {
      // Temporary dismissal using sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`dismissed-${adId}`, 'true');
      }
    }
  }

  public isAdDismissed(adId: string): boolean {
    if (this.userDismissals.has(adId)) return true;
    
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`dismissed-${adId}`) === 'true';
    }
    return false;
  }

  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getCurrentDayOfWeek(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  }

  private matchesConditions(ad: AdConfig, currentPage: string, userType: string = 'guest'): boolean {
    if (!ad.conditions) return true;

    const { pages, sections, userType: requiredUserType, timeOfDay, dayOfWeek, excludePages } = ad.conditions;

    // Check excluded pages
    if (excludePages && excludePages.includes(currentPage)) return false;

    // Check page match
    if (pages && !pages.includes(currentPage)) return false;

    // Check user type
    if (requiredUserType && requiredUserType !== userType) return false;

    // Check time of day
    if (timeOfDay && timeOfDay !== this.getCurrentTimeOfDay()) return false;

    // Check day of week
    if (dayOfWeek && !dayOfWeek.includes(this.getCurrentDayOfWeek())) return false;

    return true;
  }

  public getAdsForPage(currentPage: string, userType: string = 'guest') {
    const settings = this.pageSettings[currentPage] || this.pageSettings['/'];
    
    const availableAds = this.adConfigs.filter(ad => 
      !this.isAdDismissed(ad.id) &&
      this.matchesConditions(ad, currentPage, userType)
    );

    return {
      bannerAds: settings.bannerAds ? availableAds.filter(ad => ad.type === 'banner') : [],
      headerCenteredAd: settings.headerCenteredAd ? availableAds.find(ad => ad.type === 'header-centered') : null,
      footerFloatingAd: settings.footerFloatingAd ? availableAds.find(ad => ad.type === 'footer-floating') : null,
      footerTakeoverAd: settings.footerTakeoverAd ? availableAds.find(ad => ad.type === 'footer-takeover') : null,
      settings
    };
  }

  public updatePageSettings(page: string, settings: Partial<PageAdSettings>) {
    this.pageSettings[page] = { ...this.pageSettings[page], ...settings };
  }

  public addAd(ad: AdConfig) {
    this.adConfigs.push(ad);
  }

  public removeAd(adId: string) {
    this.adConfigs = this.adConfigs.filter(ad => ad.id !== adId);
  }

  public updateAd(adId: string, updates: Partial<AdConfig>) {
    const index = this.adConfigs.findIndex(ad => ad.id === adId);
    if (index !== -1) {
      this.adConfigs[index] = { ...this.adConfigs[index], ...updates };
    }
  }

  // Admin functions for managing ads
  public getAllAds(): AdConfig[] {
    return [...this.adConfigs];
  }

  public getPageSettings(): { [page: string]: PageAdSettings } {
    return { ...this.pageSettings };
  }

  public clearDismissedAds() {
    this.userDismissals.clear();
    this.saveUserDismissals();
    if (typeof window !== 'undefined') {
      // Clear session storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('dismissed-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }
}

export const adManager = AdManager.getInstance();
export type { AdConfig, PageAdSettings };
