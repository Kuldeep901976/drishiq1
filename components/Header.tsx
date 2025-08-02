'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../lib/drishiq-i18n';

interface DropdownOption {
  label: string;
  icon?: string;
  action?: () => void;
}

interface DropdownMenu {
  label: string;
  options: DropdownOption[];
}

const Header: React.FC = () => {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const context = useLanguage();
  const t = context?.t || ((key: string) => key);
  
  // Initialize selectedLanguage from context or localStorage
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('drishiq-locale') || 'en';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown menus configuration
  const dropdownMenus: Record<string, DropdownMenu> = {
    'meet-yourself': {
      label: 'Meet Yourself',
      options: [
        { label: '🧍‍♂️ Living Solo', action: () => router.push('/sessions') },
        { label: '🙇‍♂️ Dependent', action: () => router.push('/sessions') },
        { label: '🧑‍🤝‍🧑 Support Giver', action: () => router.push('/support-details') },
        { 
          label: 'Problem Carrier',
          icon: '/assets/other-Icons/problem_carrier.png',
          action: () => router.push('/sessions')
        },
        { label: '🕵️‍♂️ Seeker', action: () => router.push('/sessions') },
        { label: '🏃‍♂️ Escaper', action: () => router.push('/sessions') },
        { label: '🧑‍🤝‍🧑 Connector', action: () => router.push('/community') },
        { label: '👷 Builder', action: () => router.push('/sessions') },
        { label: '🧘 Giver Beyond Self', action: () => router.push('/support-details') },
        { label: '🙋‍♂️ Rebooter', action: () => router.push('/sessions') }
      ]
    },
    'choose-path': {
      label: 'Choose Your Path',
      options: [
        { label: '🚪 Access Clarity', action: () => router.push('/priceplan-enhanced') },
        { label: '🎁 Gift Clarity', action: () => router.push('/priceplan-enhanced') },
        { label: '🤝 Support Others', action: () => router.push('/priceplan-enhanced') }
      ]
    },
    'unfiltered': {
      label: 'Unfiltered',
      options: [
        { label: '🎶 Music', action: () => router.push('/community') },
        { label: '📖 Stories', action: () => router.push('/blog') },
        { label: '🎨 Creations', action: () => router.push('/share-experience') },
        { label: '🎥 Videos', action: () => router.push('/video-experience') },
        { label: '🆘 People Seeking Help', action: () => router.push('/support-in-need') }
      ]
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownId: string) => {
    setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (option.action) {
      option.action();
    }
    setOpenDropdown(null);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    // Update language in context if available
    if (context && context.setLocale) {
      context.setLocale(lang);
    }
    // Store in localStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('drishiq-locale', lang);
      }
    } catch {
      // Ignore localStorage errors
    }
  };

     const handleProfileMouseEnter = () => {
     console.log('Mouse entered profile icon');
     setShowProfileDropdown(true);
   };

   const handleProfileMouseLeave = () => {
     console.log('Mouse left profile icon');
     setShowProfileDropdown(false);
   };

   const handleProfileClick = () => {
     console.log('Profile icon clicked');
     setShowProfileDropdown(!showProfileDropdown);
   };

                     const openQRPopup = () => {
        const qrWin = window.open("/drishiq_signup_qr.png", "_blank", "width=500,height=500");
        if (qrWin) qrWin.focus();
      };

  const handleProfileMenuItemClick = (action: string) => {
    switch (action) {
      case 'signin':
        router.push('/signin');
        break;
      case 'account':
        router.push('/profile');
        break;
      case 'enrich':
        router.push('/profile');
        break;
      case 'reset':
        router.push('/create-password');
        break;
      case 'settings':
        router.push('/profile');
        break;
      case 'theme':
        console.log('Theme toggle clicked');
        break;
      case 'support':
        router.push('/support-in-need');
        break;
      case 'about':
        router.push('/terms');
        break;
      case 'logout':
        console.log('Logout clicked');
        break;
      default:
        break;
    }
    setShowProfileDropdown(false);
  };

  const scrollToSection = (sectionId: string) => {
    // Check if we're on the landing page
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to landing page with section hash
      router.push(`/#${sectionId}`);
    }
  };

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'support':
        scrollToSection('support-privilege');
        break;
      case 'blog':
        scrollToSection('blog-insights');
        break;
      case 'voices':
        scrollToSection('testimonials-usersay');
        break;
      case 'bridge':
        scrollToSection('clarity-anchor');
        break;
      default:
        break;
    }
  };

  return (
    <>
                                                       <style dangerouslySetInnerHTML={{
           __html: `
             /* Version: ${Date.now()} */
             @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji:wght@400&display=swap');
             @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
            html, body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              height: 100%;
            }
                                                                                                                                                                                                                                                               .drishiq-header {
               display: flex;
               justify-content: space-between;
               align-items: center;
               padding: 0 0 0 32px;
               border-bottom: 1px solid #ccc;
               font-family: 'Poppins', sans-serif;
               background-color: #F8F6F4;
               height: 100px !important;
               position: sticky;
               top: 0;
               left: 0;
               right: 0;
               z-index: 1000;
             }
          .header-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
          }
                     .logo {
             height: 40px;
             margin-bottom: 0px;
             align-self: flex-start;
           }
                     .tagline {
             font-size: 15px;
             color: #0B4422;
             margin-top: -2px;
             margin-left: 12px;
           }
          .header-center {
            flex: 3;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            position: relative;
            padding-bottom: 0;
          }
                                           .nav-menu {
              display: flex;
              gap: 40px;
              font-size: 14px;
              font-weight: 500;
              color: #0B4422;
              align-items: flex-end;
              margin-top: 62px;
            }
                                           .nav-label {
              cursor: pointer;
              text-align: center;
              white-space: nowrap;
              color: #0B4422;
              font-weight: 500;
              padding: 8px 12px;
              border-radius: 8px;
              transition: background-color 0.2s ease;
              background: transparent;
            }
            
            .nav-label:hover {
              background-color: rgba(11, 68, 34, 0.1);
            }
          .dropdown {
            position: relative;
            cursor: pointer;
          }
                     .dropdown-menu {
             display: none;
             position: absolute;
             top: 120%;
             left: 0;
             background: #fff;
             padding: 2px 4px;
             border-radius: 8px;
             box-shadow: 0 4px 10px rgba(0,0,0,0.15);
             width: max-content;
             z-index: 10;
           }
          .dropdown-menu.open {
            display: block;
          }
                                           .dropdown-option {
              text-align: left;
              padding: 4px 8px;
              border: none;
              background: white;
              cursor: pointer;
              width: 100%;
              border-radius: 6px;
              transition: background-color 0.2s ease;
              margin-bottom: 2px;
              font-weight: 500;
              color: #0B4422;
              font-size: 13px;
            }
           .dropdown-option:hover {
             background-color: rgba(11, 68, 34, 0.1);
           }
           .dropdown-option:active {
             background-color: rgba(11, 68, 34, 0.2);
           }
          .header-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
                                                                                                                                                                                   .language-selector {
               margin-bottom: 8px;
               border-radius: 12px;
               padding: 4px 10px;
               background: linear-gradient(145deg, #ffffff, #e6e6e6);
               box-shadow: 
                 4px 4px 8px #d1d1d1,
                 -4px -4px 8px #ffffff,
                 inset 1px 1px 2px rgba(255,255,255,0.7),
                 inset -1px -1px 2px rgba(0,0,0,0.1);
               border: none;
               cursor: pointer;
               transition: all 0.3s ease;
               font-weight: 500;
               color: #0B4422;
               font-size: 13px;
               min-width: 80px;
             }
           
                       .language-selector option {
              background: white !important;
              color: #0B4422 !important;
              padding: 8px 12px;
              border: none;
              outline: none;
            }
            
                                    .language-selector option:hover,
            .language-selector option:focus {
              background: #0B4422 !important;
              color: white !important;
              border: none;
              outline: none;
            }
            
            .language-selector option:checked,
            .language-selector option:selected {
              background: white !important;
              color: #0B4422 !important;
              border: none;
              outline: none;
            }
                       .language-selector:hover {
              transform: translateY(-2px);
              box-shadow: 
                6px 6px 12px #d1d1d1,
                -6px -6px 12px #ffffff,
                inset 1px 1px 2px rgba(255,255,255,0.7),
                inset -1px -1px 2px rgba(0,0,0,0.1);
              color: #0B4422;
              background: linear-gradient(145deg, #f0f8f0, #e6f0e6);
            }
           .language-selector:active {
             transform: translateY(0px);
             box-shadow: 
               2px 2px 4px #d1d1d1,
               -2px -2px 4px #ffffff,
               inset 2px 2px 4px rgba(0,0,0,0.1),
               inset -2px -2px 4px rgba(255,255,255,0.7);
           }
           .profile-wrapper {
          position: relative;
          display: inline-block;
          }  
                                                                                                                                       .profile-icon {
                margin-top: 4px;
                padding: 0;
                border-radius: 50%;
                background: linear-gradient(145deg, #ffffff, #e6e6e6);
                box-shadow: 
                  6px 6px 12px #d1d1d1,
                  -6px -6px 12px #ffffff,
                  inset 1px 1px 2px rgba(255,255,255,0.7),
                  inset -1px -1px 2px rgba(0,0,0,0.1);
                cursor: pointer;
                width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                border: 2px solid #f0f0f0;
                transition: all 0.3s ease;
                position: relative;
                margin: 0 auto;
              }
              
              .profile-icon-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
              }
          .profile-icon:hover {
            transform: translateY(-2px);
            box-shadow: 
              10px 10px 20px #d1d1d1,
              -10px -10px 20px #ffffff,
              inset 2px 2px 4px rgba(255,255,255,0.7),
              inset -2px -2px 4px rgba(0,0,0,0.1);
          }
                     .profile-dropdown {
             position: fixed;
             top: 72px;
             right: 20px;
             background: white;
             border-radius: 10px;
             box-shadow: 0 4px 8px rgba(0,0,0,0.2);
             width: 240px;
             z-index: 999999;
             display: none;
             margin-top: 0px;
             max-height: 376px;
             overflow-y: auto;
             border-top: none;
           }
          .profile-dropdown.show {
            display: block !important;
          }
                                                                                                                                                                               .profile-header {
                text-align: center;
                padding: 8px 0.25rem 0.25rem 0.25rem;
                margin-bottom: -24px;
              }
          .profile-header img {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            display: block;
            margin: 0 auto;
          }
          .profile-header div {
            font-size: 0.85rem;
            color: #0B4422;
            padding-top: 4px;
          }
                     .qr-code {
             display: flex;
             align-items: center;
             justify-content: center;
             gap: 8px;
             padding: 0.75rem;
             cursor: pointer;
             background: white;
             margin: 6px;
             border-radius: 10px;
             transition: all 0.3s ease;
           }
           .qr-code:hover {
             background: #f8f8f8;
           }
                     .qr-code img {
             width: 24px;
             height: 24px;
             object-fit: contain;
             border-radius: 4px;
             transition: transform 0.3s ease;
           }
           .qr-code:hover img {
             transform: scale(3);
           }
          .qr-code span {
            font-size: 0.95rem;
            color: #0B4422;
          }
                                           .profile-item {
              padding: 6px 14px;
              font-size: 0.9rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              color: #0B4422;
              border-bottom: 1px solid #f5f5f5;
              background: linear-gradient(145deg, #ffffff, #f8f8f8);
              margin: 2px 6px;
              border-radius: 8px;
              transition: all 0.3s ease;
              box-shadow: 
                2px 2px 4px #e0e0e0,
                -2px -2px 4px #ffffff,
                inset 1px 1px 2px rgba(255,255,255,0.7),
                inset -1px -1px 2px rgba(0,0,0,0.05);
            }
           .profile-item:hover {
             transform: translateY(-2px);
             box-shadow: 
               4px 4px 8px #e0e0e0,
               -4px -4px 8px #ffffff,
               inset 1px 1px 2px rgba(255,255,255,0.7),
               inset -1px -1px 2px rgba(0,0,0,0.05);
           }
           .profile-item:active {
             transform: translateY(0px);
             box-shadow: 
               1px 1px 2px #e0e0e0,
               -1px -1px 2px #ffffff,
               inset 2px 2px 4px rgba(0,0,0,0.1),
               inset -2px -2px 4px rgba(255,255,255,0.7);
           }
          .profile-item i {
            margin-right: 12px;
            color: #0B4422;
          }
          .profile-item::after {
            content: '>';
            font-weight: bold;
            margin-left: auto;
            color: #0B4422;
          }
        `
      }} />
      
      <header className="drishiq-header">
        {/* Left: Logo and Tagline */}
        <div className="header-left">
          <Image 
            src="/assets/logo/Logo.png" 
            alt="Drishiq Logo" 
            width={200} 
            height={40} 
            className="logo"
            style={{ cursor: 'pointer' }}
            onClick={() => scrollToSection('about')}
          />
          <div 
            className="tagline" 
            style={{ cursor: 'pointer' }}
            onClick={() => scrollToSection('about')}
          >
            Intelligence of Perception
          </div>
        </div>

        {/* Center: Navigation */}
        <div className="header-center">
          <nav className="nav-menu">
            {/* Meet Yourself Dropdown */}
            <div className="dropdown nav-label" onClick={() => toggleDropdown('meet-yourself')}>
              <div className="dropdown-trigger-container">
                <span title="Step into your current reality — whether you're building, seeking, rebooting, or just getting by. Your life mode matters here.">
                  Meet Yourself
                </span>
                <span className="dropdown-arrow-span">▼</span>
              </div>
              <div className={`dropdown-menu ${openDropdown === 'meet-yourself' ? 'open' : ''}`}>
                <div className="dropdown-options-container">
                  {dropdownMenus['meet-yourself'].options.map((option, index) => (
                    <button
                      key={index}
                      className="dropdown-option"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.icon && (
                        <Image 
                          src={option.icon} 
                          alt="" 
                          width={16} 
                          height={16} 
                          className="profile-item-icon"
                        />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Static Navigation Items */}
            <div 
              className="nav-label" 
              title="Offer or receive session support — a community fund for clarity"
              onClick={() => handleMenuItemClick('support')}
            >
              Support
            </div>
            <div 
              className="nav-label" 
              title="Life-defining reads, feature stories, insights into the inner world"
              onClick={() => handleMenuItemClick('blog')}
            >
              Blog
            </div>
            <div 
              className="nav-label" 
              title="Spoken and written reflections, voices from all walks"
              onClick={() => handleMenuItemClick('voices')}
            >
              Voices
            </div>
            <div 
              className="nav-label" 
              title="A connection hub — where people in need meet those who can offer support"
              onClick={() => handleMenuItemClick('bridge')}
            >
              Bridge
            </div>

            {/* Choose Your Path Dropdown */}
            <div className="dropdown nav-label" onClick={() => toggleDropdown('choose-path')}>
              <div className="dropdown-trigger-container">
                <span title="Explore session plans, gifting options, and how to support others">
                  Choose Your Path
                </span>
                <span className="dropdown-arrow-span">▼</span>
              </div>
              <div className={`dropdown-menu ${openDropdown === 'choose-path' ? 'open' : ''}`}>
                <div className="dropdown-options-container">
                  {dropdownMenus['choose-path'].options.map((option, index) => (
                    <button
                      key={index}
                      className="dropdown-option"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Unfiltered Dropdown */}
            <div className="dropdown nav-label" onClick={() => toggleDropdown('unfiltered')}>
              <div className="dropdown-trigger-container">
                <span title="Explore music, writing, and stories shared from the heart">
                  Unfiltered
                </span>
                <span className="dropdown-arrow-span">▼</span>
              </div>
              <div className={`dropdown-menu ${openDropdown === 'unfiltered' ? 'open' : ''}`}>
                <div className="dropdown-options-container">
                  {dropdownMenus['unfiltered'].options.map((option, index) => (
                    <button
                      key={index}
                      className="dropdown-option"
                      onClick={() => handleOptionClick(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Right: Language Selector + Profile Icon */}
        <div className="header-right">
                     <select 
             className="language-selector"
             value={selectedLanguage}
             onChange={(e) => handleLanguageChange(e.target.value)}
             aria-label="Select language"
           >
             <option value="en">English</option>
             <option value="hi">हिंदी</option>
             <option value="bn">বাংলা</option>
             <option value="ta">தமிழ்</option>
             <option value="te">తెలుగు</option>
             <option value="mr">मराठी</option>
             <option value="es">Español</option>
             <option value="fr">Français</option>
             <option value="de">Deutsch</option>
             <option value="pt">Português</option>
             <option value="it">Italiano</option>
             <option value="nl">Nederlands</option>
             <option value="ru">Русский</option>
             <option value="zh">中文</option>
             <option value="ja">日本語</option>
             <option value="ko">한국어</option>
             <option value="ar">العربية</option>
           </select>
          
             <div className="profile-wrapper"
             onMouseEnter={handleProfileMouseEnter}
             onMouseLeave={handleProfileMouseLeave}
             ref={profileDropdownRef}>
                         <div className="profile-icon" onClick={handleProfileClick}>
             <Image 
               src="/profile_toggle.gif" 
               alt="Profile" 
               width={45} 
               height={45}
               className="profile-icon-image"
             />
             </div>
                         {/* Profile Dropdown Menu */}
             <div 
               className={`profile-dropdown ${showProfileDropdown ? 'show' : ''}`}
               onMouseEnter={handleProfileMouseEnter}
               onMouseLeave={handleProfileMouseLeave}
             >
                             <div className="profile-header">
                 <Image 
                   src="/profile_toggle.gif" 
                   alt="Profile Toggle" 
                   width={70} 
                   height={70}
                   className="profile-header-image"
                 />
               </div>
              
                                                                                                                                                                                                                     <div className="qr-code" onClick={openQRPopup}>
                     <Image 
                       src="/drishiq_signup_qr.png" 
                       alt="Drishiq Signup QR" 
                       width={24} 
                       height={24}
                       className="qr-code-image"
                     />
                     <span onClick={openQRPopup}>Sign Up</span>
                   </div>

                                                              <div className="profile-item" onClick={() => handleProfileMenuItemClick('signin')}>
                    <i className="fas fa-sign-in-alt" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Sign In
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('account')}>
                    <i className="fas fa-user" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Your Account
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('enrich')}>
                    <i className="fas fa-user-edit" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Enrich Your Profile
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('reset')}>
                    <i className="fas fa-key" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Reset Password
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('settings')}>
                    <i className="fas fa-cog" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Settings
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('theme')}>
                    <i className="fas fa-adjust" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Theme Toggle
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('support')}>
                    <i className="fas fa-life-ring" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Support
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('about')}>
                    <i className="fas fa-info-circle" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    About Drishiq
                  </div>

                  <div className="profile-item" onClick={() => handleProfileMenuItemClick('logout')}>
                    <i className="fas fa-sign-out-alt" style={{marginRight: '12px', color: '#0B4422'}}></i>
                    Log Out
                  </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header; 