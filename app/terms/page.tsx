'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import StyleSwitcher from '../../components/StyleSwitcher';

export default function TermsPage() {
  const t = (key: string) => key;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#0B4422] mb-4">{t('termsTitle')}</h1>
          <p className="text-sm text-gray-600 mb-8">{t('termsLastUpdated')}</p>

          <div className="space-y-6">
            <section>
              <p className="text-[#0B4422] leading-relaxed">{t('termsIntro')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsUse')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsUseDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsDisclaimer')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsDisclaimerDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsLimitations')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsLimitationsDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsRevisions')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsRevisionsDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsLinks')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsLinksDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsModifications')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsModificationsDesc')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('termsGoverningLaw')}</h2>
              <p className="text-[#0B4422] leading-relaxed">{t('termsGoverningLawDesc')}</p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h1 className="text-3xl font-bold text-[#0B4422] mb-4">{t('privacyTitle')}</h1>
            
            <div className="space-y-6">
              <section>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyIntro')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacyCollection')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyCollectionDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacyUse')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyUseDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacySharing')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacySharingDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacySecurity')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacySecurityDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacyCookies')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyCookiesDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacyRights')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyRightsDesc')}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#0B4422] mb-3">{t('privacyContact')}</h2>
                <p className="text-[#0B4422] leading-relaxed">{t('privacyContactDesc')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <StyleSwitcher />
    </>
  );
} 