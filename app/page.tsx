'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BannerCarousel from '../components/BannerCarousel';
import Footer from '../components/Footer';
import HeaderUpdated from '../components/Header';
import LandingBlogCards from '../components/LandingBlogCards';
import { LanguageProvider, useLanguage } from '../lib/drishiq-i18n';

function HomePageContent() {
  const [animationStage, setAnimationStage] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const router = useRouter();
  const { t, isLoading } = useLanguage();

  // Handle hash navigation for about section
  useEffect(() => {
    if (window.location.hash === '#about') {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          aboutSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    }
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStage(1), 0),
      setTimeout(() => setAnimationStage(2), 1500),
      setTimeout(() => setAnimationStage(3), 3000),
      setTimeout(() => setAnimationStage(4), 4500),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Animation for rolling messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % 6); // 6 messages total
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;

  const handleExperienceClick = () => {
    router.push('/invitation');
  };

  return (
    <>
      <HeaderUpdated />
      <div className="flex-grow" style={{ marginTop: '-16px' }}>
        <style jsx>{`
          .container {
            max-width: 1400px;
            margin: auto;
            padding: 2rem;
          }

          .section {
            padding: 3rem 2rem;
          }

          .section-title {
            font-size: 2rem;
            margin-bottom: 0.2rem;
            text-align: center;
          }

          .motivational-container {
            position: relative;
            text-align: center;
            max-height: 120px;
            margin-top: 10px;
            margin-bottom: 10px;
          }

          .typewriter {
            position: relative;
            font-size: 1.2rem;
            white-space: nowrap;
            opacity: 0;
            margin-bottom: 2px;
            animation: fadeIn 0.8s ease-out forwards;
          }

          .line1 {
            animation-delay: 0s;
            color: #000080;
            font-size:18px;
            font-weight:300;
            margin-top: -64px;
          }

          .line2 {
            animation-delay: 1s;
            font-size:18px;
            font-weight:300;
            color: #0B4422;
            margin-top: -5px;
          }

          .line3 {
            animation-delay: 2s;
            color: #000080;
            font-size:18px;
            font-weight:500;
            margin-top: -5px;
            margin-bottom: 8px;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .glow-button {
            display: inline-block;
            opacity: 0;
            margin-top: 0px;
            padding: 0.6rem 1.2rem;
            font-size: 1rem;
            background-color: #0B4422;
            color: #fff;
            border: none;
            cursor: pointer;
            border-radius: 20px;
            animation: glow 1.5s ease-in-out infinite alternate, fadeIn 0.5s ease forwards;
            animation-delay: 2s, 2s;
          }

          @keyframes glow {
            0% {
              box-shadow: 0 0 5px #0B442280, 0 0 10px #0B442240;
            }
            100% {
              box-shadow: 0 0 12px #0B4422cc, 0 0 20px #0B4422;
            }
          }

          .hero-section {
            background: linear-gradient(#092e18, #F2F2F2);
            max-height: 420px;
            background-size: cover;
            background-position: center;
            color: #FFFFFF;
            text-align: center;
            padding: 5rem 1rem;
            margin-top: 24px;
          }

          .features-grid, .blog-grid {
            display: grid;
            gap: 1.5rem;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }

          .card {
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
          }

          .card img {
            width: 100%;
            height: 180px;
            object-fit: cover;
          }

          .card-content {
            padding: 1rem;
          }

          .features-cards .card:nth-child(odd) {
            background-color: #ffffff;
            transform: translateY(-5px);
            border: 1px solid #cce4d1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }

          .features-cards .card:hover {
            background-color: #ffffff;
            border: 1px solid #cce4d1;
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }

          .glow-button1 {
            display: inline-block;
            opacity: 0;
            margin-top: 40px;
            padding: 0.6rem 1.2rem;
            font-size: 1rem;
            background-color: #0B4422;
            display: inline-block;
            opacity: 0;
            color: #fff;
            border: none;
            cursor: pointer;
            border-radius: 20px;
            animation: glow 1.5s ease-in-out infinite alternate, fadeIn 0.5s ease forwards;
            animation-delay: 2s, 2s;
          }

            .testimonial {
            font-style: italic;
            background: #f0f0f0;
            border-left: 4px solid #0B4422;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .cta-section {
            text-align: center;
            background-color: #F2F2F2;
            color: #0B4422;
            padding: 3rem 1rem;
          }

          .button {
            display: inline-block;
            background: #0B4422;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 20px;
            font-weight: bold;
            text-decoration: none;
            transition: background-color 0.3s ease;
          }

          .button:hover {
            background-color: #083318;
          }

          .animated-arrow {
            display: inline-block;
            margin-left: 6px;
            animation: arrowMove 0.8s ease-in-out infinite alternate;
          }

          @keyframes arrowMove {
            from { transform: translateX(0); }
            to { transform: translateX(6px); }
          }

          .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0B4422;
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(45deg, #0B4422, #22c55e);
          border-radius: 2px;
        }

        .areas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .area-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 2rem;
          border-radius: 20px;
          border-left: 5px solid #0B4422;
          font-style: italic;
          font-size: 1.1rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .area-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0B4422, #166534);
          transition: left 0.4s ease;
          z-index: -1;
        }

        .area-card:hover {
          transform: translateX(15px) scale(1.02);
          color: white;
          border-left-color: #22c55e;
          box-shadow: 0 15px 35px rgba(11, 68, 34, 0.3);
        }

        .area-card:hover::before {
          left: 0;
        }

        /* Animation Styles for Rolling Messages */
        .animated-message {
          animation: fadeOutIn 1s ease-in-out;
        }

        @keyframes fadeOutIn {
          0% { opacity: 0; transform: translateY(10px); }
          50% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }


        `}</style>

        {/* Hero Section with Rolling Message Animation */}
                    <section className="hero-section">
          <div className="message-roller">
            <div className="animated-message" style={{ display: currentMessage === 0 ? 'block' : 'none' }}>
                            <h1>
                Something feels off — and you can't quite name it.
              </h1>
              <p>
                Discover with Drishiq the spaces that remain unexplored.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 🔍 Look Deeper
                </button>
            </div>
            <div className="animated-message" style={{ display: currentMessage === 1 ? 'block' : 'none' }}>
              <h1>
                The problem is clear, the path isn't.
              </h1>
              <p>
                Trace the blurry parts. Drishiq walks beside you through the unclear.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 🌟 Experience Edges
               </button>
            </div>
            <div className="animated-message" style={{ display: currentMessage === 2 ? 'block' : 'none' }}>
              <h1>
                You're tired of pretending it's all okay.
              </h1>
              <p>
                You don't have to carry that alone. Let Drishiq be with you in what's real.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 👤 Meet Yourself
               </button>
            </div>
            <div className="animated-message" style={{ display: currentMessage === 3 ? 'block' : 'none' }}>
              <h1>
                You don't need a fix. You just need a moment that sees you.
              </h1>
              <p>
                Work with Drishiq to let yourself be seen — not fixed, not judged.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 💪 Stand Tall
               </button>
            </div>
            <div className="animated-message" style={{ display: currentMessage === 4 ? 'block' : 'none' }}>
              <h1>
                Let's begin — gently.
              </h1>
              <p>
                This isn't a leap. Just a quiet step — when you're ready.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 🚀 Let's Begin
               </button>
            </div>
            <div className="animated-message" style={{ display: currentMessage === 5 ? 'block' : 'none' }}>
              <h1>
                You're trying, but not convinced.
              </h1>
              <p>
                Sometimes it's a hitch. Sometimes it's skill. Sometimes just support. Let's see what it is in your case.
              </p>
                             <button 
                 onClick={() => router.push('/invitation')}
                 className="banner-cta-button" 
                 style={{ 
                   background: '#0B4422',
                   color: '#fff',
                   padding: '0.8rem 2rem',
                   border: 'none',
                   borderRadius: '25px',
                   fontSize: '1.1rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   display: 'inline-block',
                   transition: 'all 0.3s ease',
                   boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                   textDecoration: 'none'
                 }}
               >
                 🤝 Drishiq Can Help
               </button>
            </div>
          </div>
        </section>
        <div style={{ marginTop: '0' }}>
          <BannerCarousel />
        </div>
        {/* About Section */}
        <section id="about" className="section" style={{ 
          background: '#fff',
          marginBottom: '-66px',
          paddingTop: 'calc(3rem - 20px)',
          paddingBottom: 'calc(3rem - 20px)',
          scrollMarginTop: '80px'
        }}>
          <div className="container">
            <h2 className="section-title" style={{ marginTop: '-2.5rem', color: '#0B4422' }}>
              <span 
                onClick={() => router.push('/invitation')} 
                style={{ 
                  cursor: 'pointer', 
                  color: '#0B4422',
                  textDecoration: 'underline',
                  textDecorationColor: 'transparent',
                  transition: 'text-decoration-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = '#0B4422'}
                onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
              >
                {t('about.heading')}
              </span>
            </h2>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2rem', color: '#374151', fontWeight: '400' }}>{t('about.description1')}</p>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2rem', color: '#374151', fontWeight: '400' }}>{t('about.description2')}</p>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '1.5rem', color: '#374151', fontWeight: '400' }}>
              {t('about.description3.prefix')} 🌟 
              <button 
                onClick={() => router.push('/invitation')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#0B4422', 
                  fontWeight: '700', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0',
                  margin: '0 0.5rem'
                }}
              >
                {t('about.join_button')}
              </button>
              {t('about.description3.suffix')}
            </p>
          </div>
        </section>

        <section className="section" style={{ 
          background: '#f5f5f5', 
          marginTop: '-3rem', 
          paddingTop: '2rem', 
          paddingBottom: '2rem',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            textAlign: 'center',
            position: 'relative',
            width: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            <h2 className="section-title" style={{marginBottom: '2rem', color: '#0B4422'}}>{t('areas.heading')}</h2>
            {/* Areas Slider Container */}
            <div style={{
              position: 'relative',
              maxWidth: '1400px',
              margin: '0 auto',
              overflow: 'hidden',
              width: '100%'
            }}>
              <style>{`
                .areas-slider-custom {
                  display: flex;
                  gap: 1.5rem;
                  width: max-content;
                  animation: slideLeftCustom 32s linear infinite;
                }
                .areas-slider-custom:hover {
                  animation-play-state: paused;
                }
                @keyframes slideLeftCustom {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .area-card-custom {
                  width: 350px;
                  height: 280px;
                  flex-shrink: 0;
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  position: relative;
                  background: #ffffff;
                  border-radius: 12px;
                  border: 1px solid rgba(0,0,0,0.08);
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
                  padding: 2.5rem;
                }
              `}</style>
              <div className="areas-slider-custom">
                {/* Card 1 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🔁</span>
                    {t('areas.card1.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card1.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card1.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🔎</span>
                    {t('areas.card2.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card2.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card2.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🎯</span>
                    {t('areas.card3.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card3.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card3.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🎾</span>
                    {t('areas.card4.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card4.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card4.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 5 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>💔</span>
                    {t('areas.card5.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card5.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card5.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 6 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🎓</span>
                    {t('areas.card6.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card6.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card6.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 7 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>💸</span>
                    {t('areas.card7.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card7.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card7.quote2')}
                    </p>
                  </div>
                </div>
                {/* Card 8 */}
                <div className="area-card-custom">
                  <h3 style={{marginBottom: '1.5rem', color: '#0B4422', fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.025em'}}>
                    <span style={{fontSize: '1.8rem', opacity: 0.9}}>🌐</span>
                    {t('areas.card8.title')}
                  </h3>
                  <div style={{fontSize: '1rem', lineHeight: '1.7', color: '#4b5563', fontWeight: 400}}>
                    <p style={{marginBottom: '1rem', fontStyle: 'italic', color: '#0B4422', opacity: 0.9, fontWeight: 500}}>
                      {t('areas.card8.quote1')}
                    </p>
                    <p style={{fontStyle: 'italic', color: '#6b7280'}}>
                      {t('areas.card8.quote2')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem', color: '#0B4422', fontStyle: 'italic' }}>
              {t('areas.not_seeing_challenge')} 
              <span onClick={() => router.push('/invitation')} style={{ 
                color: '#0B4422', 
                fontWeight: '700', 
                textDecoration: 'underline', 
                marginLeft: '0.5rem', 
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}>
                🔗 {t('areas.start_now')}
              </span>
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ background: '#fff', padding: '0.1rem 0' }}>
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '3rem' }}>
              {t('features.heading')}
            </h2>

            <div className="features-grid">
              <div className="card">
                <div className="card-content">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '1rem', color: '#0B4422' }}>
                    🧠 {t('features.card1.title')}
                  </h3>
                  <div style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', fontWeight: '400' }}>
                    {t('features.card1.description').split('\n').map((line, index) => (
                      <div key={index} style={{ marginBottom: '0.75rem' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#6b7280', marginTop: '1.5rem', fontWeight: '400' }}>
                    💬 "Finally, something that listens without jumping to conclusions."
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '1rem', color: '#0B4422' }}>
                    🌍 {t('features.card2.title')}
                  </h3>
                  <div style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', fontWeight: '400' }}>
                    {t('features.card2.description').split('\n').map((line, index) => (
                      <div key={index} style={{ marginBottom: '0.75rem' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#6b7280', marginTop: '1.5rem', fontWeight: '400' }}>
                    🌐 "Feels like it was built for me — in my language, my way."
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '1rem', color: '#0B4422' }}>
                    🗣️ {t('features.card3.title')}
                  </h3>
                  <div style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', fontWeight: '400' }}>
                    {t('features.card3.description').split('\n').map((line, index) => (
                      <div key={index} style={{ marginBottom: '0.75rem' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#6b7280', marginTop: '1.5rem', fontWeight: '400' }}>
                    🎧 "It understood what I couldn't even explain in words."
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-content">
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '1rem', color: '#0B4422' }}>
                    🤝 {t('features.card4.title')}
                  </h3>
                  <div style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', fontWeight: '400' }}>
                    {t('features.card4.description').split('\n').map((line, index) => (
                      <div key={index} style={{ marginBottom: '0.75rem' }}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#6b7280', marginTop: '1.5rem', fontWeight: '400' }}>
                    ❤️ "Even when I couldn't pay, someone had my back."
                  </p>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '1.2rem', color: '#0B4422', fontStyle: 'italic', fontWeight: '400' }}>
              {t('features.cta_description')}
            </p>

            <p style={{ textAlign: 'center', marginTop: 'calc(3rem - 70px)', fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', fontWeight: '400' }}>
              {t('features.try_now_cta')} <button onClick={() => router.push('/invitation')} className="banner-cta-button" style={{ cursor: 'pointer', background: '#0B4422', color: '#fff', padding: '0.8rem 2rem', border: 'none', borderRadius: '25px', fontSize: '1.1rem', fontWeight: '600', display: 'inline-block', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)', textDecoration: 'none' }}>{t('features.try_now_button')}</button>
            </p>
          </div>
        </section>

        {/* Support Section */}
        <section id="support-privilege" className="section" style={{ background: '#f5f5f5', marginBottom: '0', textAlign: 'center', color: '#0B4422', padding: '3rem 1rem', scrollMarginTop: '80px' }}>
          <div className="container">
            <h2
              className="section-title"
              style={{ marginTop: '-2.5rem', marginBottom: '2.5rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.3s' }}
              onClick={() => router.push('/support-in-need')}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#0B4422')}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
            >
              {t('support.heading')}
            </h2>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', marginBottom: '2.5rem', fontWeight: '400' }}>
              {t('support.description')}
            </p>

            <div style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2rem',
              marginTop: '3rem'
            }}>
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '15px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                width: '100%'
              }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0B4422', fontWeight: '600' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 400, color: '#374151', display: 'block', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                      🫖 {t('support.chai_seller_story')}
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 400, color: '#374151', display: 'block', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                      🛡️ {t('support.security_guard_story')}
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 400, color: '#374151', display: 'block', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                      🎓 {t('support.college_student_story')}
                    </span>
                </p>
                <p style={{ fontSize: '1.15rem', lineHeight: '1.7', fontStyle: 'italic', color: '#374151', fontWeight: '400' }}>
                  {t('support.not_looking_for_sympathy')}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: '1.15rem',
              lineHeight: '1.7',
              color: '#374151',
              marginTop: '2.5rem',
              marginBottom: '2.5rem',
              fontWeight: '400',
              textAlign: 'center'
            }}>
              {t('support.sponsorship_description')}
            </p>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <h3 style={{
                fontSize: '1.8rem',
                color: '#0B4422',
                marginBottom: '1rem',
                fontWeight: '700'
              }}>
                🎁 {t('support.sponsor_moment_heading')}
              </h3>
              <button
                onClick={() => router.push('/support-in-need')}
                className="banner-cta-button"
                style={{
                  fontSize: '1.1rem',
                  padding: '0.8rem 2rem',
                  marginTop: '0.5rem',
                  background: '#0B4422',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-block',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
              >
                💝 {t('support.become_supporter')}
              </button>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section id="blog-insights" className="section" style={{ background: '#fff', padding: '3rem 2rem', scrollMarginTop: '80px' }}>
          <div className="container">
            <h2
              className="section-title"
              style={{ marginTop: '-2.5rem', marginBottom: '2.5rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.3s' }}
              onClick={() => router.push('/blog')}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#0B4422')}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
            >
              {t('blog.heading')}
            </h2>

            <LandingBlogCards />
            
            <p style={{ textAlign: 'center', marginTop: 'calc(2rem - 20px - 24px)', marginBottom: 'calc(1rem - 20px)' }}>
              <button onClick={() => router.push('/blog')} className="banner-cta-button" style={{ background: '#0B4422', color: '#fff', padding: '0.8rem 2rem', border: 'none', borderRadius: '25px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', display: 'inline-block', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)', textDecoration: 'none' }}>{t('blog.read_more_button')}</button>
            </p>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials-usersay" className="section" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '4rem 2rem calc(2rem - 16px)', scrollMarginTop: '80px' }}>
          <div className="container" style={{ marginTop: '-10px' }}>
            <h2
              className="section-title"
              style={{ marginTop: '-2.5rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.3s' }}
              onClick={() => router.push('/testimonials')}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#0B4422')}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
            >
              {t('testimonials.heading')}
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#374151', textAlign: 'center' }}>
              ✨ {t('testimonials.real_stories')}
            </p>

            {/* Enhanced Testimonials Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Testimonial Card 1 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(11, 68, 34, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
              onClick={() => router.push('/testimonials')}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '20px',
                  background: '#0B4422',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  🌟 Featured Story
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#0B4422',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginRight: '1rem'
                    }}>
                      S
                    </div>
                    <div>
                      <h4 style={{ margin: '0', color: '#0B4422', fontWeight: '600' }}>Sarah M.</h4>
                      <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>Student, 22</p>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    fontStyle: 'italic',
                    marginBottom: '1rem'
                  }}>
                    "{t('testimonials.story1')}"
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                      {'★'.repeat(5)}
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Verified User</span>
                  </div>
                </div>
              </div>

              {/* Testimonial Card 2 */}
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(11, 68, 34, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
              onClick={() => router.push('/testimonials')}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '20px',
                  background: '#0B4422',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  💡 Clarity Found
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#0B4422',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginRight: '1rem'
                    }}>
                      M
                    </div>
                    <div>
                      <h4 style={{ margin: '0', color: '#0B4422', fontWeight: '600' }}>Michael R.</h4>
                      <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>Professional, 34</p>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    color: '#374151',
                    fontStyle: 'italic',
                    marginBottom: '1rem'
                  }}>
                    "{t('testimonials.story2')}"
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', color: '#fbbf24' }}>
                      {'★'.repeat(5)}
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Verified User</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div style={{
              textAlign: 'center',
              background: '#0B4422',
              borderRadius: '15px',
              padding: '2rem',
              color: 'white',
              marginTop: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', color: 'white' }}>
                {t('testimonials.one_story').replace(' —', '')}
              </h3>
              <button 
                onClick={() => router.push('/testimonials')}
                style={{
                  background: 'white',
                  color: '#0B4422',
                  border: 'none',
                  padding: '0.8rem 2rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255,255,255,0.3)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,255,255,0.3)';
                }}
              >
                ✨ {t('testimonials.share_story')}
              </button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="clarity-anchor" className="cta-section" style={{ marginBottom: '5rem', textAlign: 'center', color: '#0B4422', padding: '3rem 1rem', scrollMarginTop: '80px' }}>
          <h2
            className="section-title"
            style={{ marginTop: 'calc(-2.5rem + 15px)', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.3s' }}
            onClick={() => router.push('/invitation')}
            onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#0B4422')}
            onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
          >
            {t('cta.heading')}
          </h2>
          <p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2.5rem', color: '#374151', fontWeight: '400' }}>
            {t('cta.every_day_someone_stuck')}
          </p>
          <p style={{ fontSize: '1.15rem', lineHeight: '1.7', marginBottom: '2.5rem', color: '#374151', fontWeight: '400' }}>
            {t('cta.they_might_be')}
          </p>

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginTop: '3rem'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h3 style={{ fontSize: '1.4rem', color: '#0B4422', marginBottom: '1rem', fontWeight: '600' }}>
                💚 {t('cta.if_you_can_give')}
              </h3>
              <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', marginBottom: '1.5rem', fontWeight: '400' }}>
                {t('cta.a_quiet_shift')}
              </p>
              <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', marginBottom: '2rem', fontWeight: '400' }}>
                {t('cta.your_donation_helps_us')}
              </p>
              <button 
                onClick={() => router.push('/support-in-need')} 
                className="banner-cta-button"
                style={{ 
                  fontSize: '1.1rem', 
                  padding: '0.8rem 2rem',
                  marginTop: '0.5rem',
                  background: '#0B4422',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-block',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
              >
                🎁 {t('cta.sponsor_session')} →
              </button>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '15px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h3 style={{ fontSize: '1.4rem', color: '#0B4422', marginBottom: '1rem', fontWeight: '600' }}>
                🌱 {t('cta.if_you_need_help')}
              </h3>
              <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', marginBottom: '1.5rem', fontWeight: '400' }}>
                {t('cta.cant_afford_session')}
              </p>
              <p style={{ fontSize: '1.15rem', lineHeight: '1.7', color: '#374151', marginBottom: '2rem', fontWeight: '400' }}>
                {t('cta.tell_us_challenge')}
              </p>
              <button 
                onClick={() => router.push('/invitation')} 
                className="banner-cta-button"
                style={{ 
                  fontSize: '1.1rem', 
                  padding: '0.8rem 2rem',
                  marginTop: '0.5rem',
                  background: '#0B4422',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  boxShadow: '0 4px 15px rgba(11, 68, 34, 0.3)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-block',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none'
                }}
              >
                ✍️ {t('cta.share_challenge')} →
              </button>
            </div>
          </div>

          <p style={{ 
            textAlign: 'center', 
            marginTop: '3rem', 
            fontSize: '1.1rem', 
            color: '#0B4422',
            fontStyle: 'italic',
            fontWeight: '500'
          }}>
            {t('cta.we_hold_space')}
          </p>
        </section>
      </div>

      {/* Footer - Full variant with centralized ad management */}
      <Footer 
        variant="full"
        userType="guest"
      />
    </>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomePageContent />
    </LanguageProvider>
  );
} 
