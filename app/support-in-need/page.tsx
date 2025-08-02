'use client';

import { useState } from 'react';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import SupporterForm from '../../components/SupporterForm';

interface SupporterFormData {
  // Personal Details Section
  shareDetails: boolean;
  fullName: string;
  email: string;
  city: string;
  country: string;
  
  // Cause Preferences Section
  supportSpecificCause: boolean;
  challenge: {
    domain: string;
    subCategory: string;
    specificChallenge: string;
    otherText: string;
    combinedValue: string;
  };
}

export default function SupporterDemoPage() {
  const [submittedData, setSubmittedData] = useState<SupporterFormData | null>(null);

  const handleFormSubmit = (data: SupporterFormData) => {
    setSubmittedData(data);
    
    // Here you would typically:
    // 1. Send data to your API
    // 2. Redirect to next step in invitation flow
    // 3. Show success message
  };

  return (
    <>
      <Header />
      
      <div className="min-h-screen pt-20 pb-20 bg-gradient-to-b from-white via-[#F5F7F6] to-[#F0F2F1]">
        <div className="container mx-auto px-4 py-8">
          {/* Form takes full width */}
          <div className="w-full">
            <SupporterForm 
              onSubmit={handleFormSubmit}
              className="mb-6"
            />
          </div>
        </div>
      </div>

      <Footer variant="full" userType="guest" />
    </>
  );
} 