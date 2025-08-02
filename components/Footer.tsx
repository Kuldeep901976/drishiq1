'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/drishiq-i18n';

interface FooterProps {
  variant?: 'full' | 'minimal';
  userType?: 'guest' | 'enterprise' | 'authenticated';
}

const Footer: React.FC<FooterProps> = ({ variant = 'full', userType = 'guest' }) => {
  const { t } = useLanguage();

  return (
    <footer className="drishiq-footer">
      {/* Social Icons */}
      <div className="footer-social-container">
        <a href="#" className="social-icon">
          <Image 
            src="/assets/social-icons/linkedin.png" 
            alt={t('footer.social.linkedin')} 
            width={24}
            height={24}
          />
        </a>
        <a href="#" className="social-icon">
          <Image 
            src="/assets/social-icons/facebook.png" 
            alt={t('footer.social.facebook')} 
            width={24}
            height={24}
          />
        </a>
        <a href="#" className="social-icon">
          <Image 
            src="/assets/social-icons/youtube.jpg" 
            alt={t('footer.social.youtube')} 
            width={24}
            height={24}
            className="youtube"
          />
        </a>
      </div>
      
      {/* Contact Info and Links */}
      <p className="footer-contact-info">
        Contact: support@drishiq.com | <a href="/terms" className="footer-link">{t('footer.terms')}</a>
      </p>
      
      {/* Copyright */}
      <p className="footer-copyright">
        ©2025 Copyright - All rights reserved
      </p>
    </footer>
  );
};

export default Footer; 