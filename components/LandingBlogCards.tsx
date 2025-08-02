'use client';

import Link from 'next/link';
import React from 'react';
import { useLanguage } from '../lib/drishiq-i18n';
import { useLandingCards } from '../lib/landing-cards-context';

// SVG Icon component
const BlogIcon: React.FC<{ iconId: string }> = ({ iconId }) => (
  <svg className="w-16 h-16 text-blue-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {iconId === 'self-awareness-icon' && (
      <>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6"/>
        <path d="M3 12h6m6 0h6"/>
        <path d="M4.93 4.93l4.24 4.24m4.24 4.24l4.24 4.24"/>
        <path d="M4.93 19.07l4.24-4.24m4.24 4.24l4.24-4.24"/>
      </>
    )}
    {iconId === 'growth-journey-icon' && (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
      </>
    )}
    {iconId === 'decision-making-icon' && (
      <>
        <path d="M9 11H1l8-8 8 8h-8v8z"/>
        <path d="M12 3v18"/>
        <path d="M8 7l4-4 4 4"/>
      </>
    )}
  </svg>
);

const LandingBlogCards: React.FC = () => {
  const { t } = useLanguage();
  const { getActiveCards } = useLandingCards();
  const cards = getActiveCards();

  return (
    <div className="blog-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)', 
      gap: '1.5rem',
      maxWidth: '100%'
    }}>
      {cards.map((card) => (
        <div key={card.id} className="card">
          <div className="card-icon-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '180px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <BlogIcon iconId={card.iconId} />
          </div>
          <div className="card-content">
            <h3>{t(card.title)}</h3>
            <p>{t(card.description)}</p>
            <Link href={card.link}>{t('blog.read_more')}</Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingBlogCards; 