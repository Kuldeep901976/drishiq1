'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../lib/drishiq-i18n';

interface Banner {
  id: number;
  title: string;
  text: string;
  image_url: string;
  cta_label: string;
  cta_link: string;
  is_active: boolean;
}

export default function BannerCarousel() {
  const { t } = useLanguage();

  // Recompute banners when t changes (i.e., when language changes)
  const defaultBanners = useMemo(() => [
    {
      image: '/assets/banners/banner-0-1753217601452.jpg',
      title: t('banner.0.title'),
      text: t('banner.0.text'),
      cta: { label: t('banner.0.cta'), link: '/testimonials/submit' }
    },
    {
      image: '/assets/banners/banner-1-1753218298881.jpg',
      title: t('banner.1.title'),
      text: t('banner.1.text'),
      cta: { label: t('banner.1.cta'), link: '/invitation' }
    },
    {
      image: '/assets/banners/banner-2-1753218056625.jpg',
      title: t('banner.2.title'),
      text: t('banner.2.text'),
      cta: { label: t('banner.2.cta'), link: '/invitation' }
    },
    {
      image: '/assets/banners/banner-3-1753218624317.jpg',
      title: t('banner.3.title'),
      text: t('banner.3.text'),
      cta: { label: t('banner.3.cta'), link: '/invitation' }
    },
    {
      image: '/assets/banners/banner-4-1753218891541.avif',
      title: t('banner.4.title'),
      text: t('banner.4.text'),
      cta: { label: t('banner.4.cta'), link: '/support-in-need' }
    },
    {
      image: '/assets/banners/banner-5-1753218996511.avif',
      title: t('banner.5.title'),
      text: t('banner.5.text'),
      cta: { label: t('banner.5.cta'), link: '/invitation' }
    }
  ], [t]);

  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState(defaultBanners);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update banners when defaultBanners changes (i.e., when language changes)
  useEffect(() => {
    setBanners(defaultBanners);
  }, [defaultBanners]);

  // Load banner data from saved JSON file
  const loadBanners = async () => {
    try {
      console.log('Loading banners from JSON file...');
      const response = await fetch(`/assets/banners/banners-data.json?t=${Date.now()}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const savedBanners = await response.json();
        console.log('Loaded banners:', savedBanners);
        // Convert saved banner format to component format
        const formattedBanners = savedBanners.map((banner: Banner) => ({
          image: banner.image_url,
          title: banner.title,
          text: banner.text,
          cta: { 
            label: banner.cta_label, 
            link: banner.cta_link 
          }
        }));
        console.log('Formatted banners:', formattedBanners);
        setBanners(formattedBanners);
      } else {
        console.log('No saved banners found, using defaults');
      }
    } catch (error) {
      console.log('Error loading banners, using defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length]);

  const swipe = (direction: 'left' | 'right') => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (direction === 'left') {
      setCurrent((prev) => (prev + 1) % banners.length);
    } else {
      setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
    }
    // Restart interval
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  if (loading) {
    return (
      <section className="banner-carousel-loading">
        <div className="banner-loading-text">Loading banners...</div>
      </section>
    );
  }

  return (
    <section 
      className="banner-carousel-section"
      style={{ backgroundImage: `url(${banners[current].image})` }}
    >
      {/* Overlay for better text readability */}
      <div className="banner-overlay"></div>
      
      <div className="banner-container">
        <div className="banner-controls">
          <button 
            aria-label="Previous" 
            onClick={() => swipe('right')} 
            className="banner-nav-button"
          >
            ‹
          </button>
          
          <div className="banner-content">
            {/* Content */}
            <div className="banner-text-container">
              <h1 className="banner-title">
                {banners[current].title}
              </h1>
              <p className="banner-text">
                {banners[current].text}
              </p>
              <a 
                href={banners[current].cta.link} 
                className="banner-cta-button"
              >
                {banners[current].cta.label}
              </a>
            </div>
          </div>
          
          <button 
            aria-label="Next" 
            onClick={() => swipe('left')} 
            className="banner-nav-button"
          >
            ›
          </button>
        </div>
        
        <div className="banner-indicators">
          {banners.map((_, idx) => (
            <span 
              key={idx} 
              className={`banner-indicator ${idx === current ? 'active' : ''}`}
              onClick={() => {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setCurrent(idx);
                intervalRef.current = setInterval(() => {
                  setCurrent((prev) => (prev + 1) % banners.length);
                }, 5000);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 