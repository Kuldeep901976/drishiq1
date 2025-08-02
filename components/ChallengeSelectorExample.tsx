'use client';

import React, { useState } from 'react';
import ChallengeSelector from './ChallengeSelector';

// Example usage in Invitation Form
export const InvitationFormExample: React.FC = () => {
  const [challengeSelection, setChallengeSelection] = useState({
    domain: '',
    subCategory: '',
    specificChallenge: '',
    otherText: '',
    combinedValue: ''
  });

  const handleChallengeChange = (selection: any) => {
    setChallengeSelection(selection);
    console.log('Challenge Selection:', selection);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-[#0B4422] mb-6">Create Invitation</h2>
      
      <form className="space-y-6">
        {/* Other form fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
            placeholder="Enter name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent"
            placeholder="Enter email..."
          />
        </div>

        {/* Challenge Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenge/Problem (Optional)
          </label>
          <ChallengeSelector
            onSelectionChange={handleChallengeChange}
            variant="invitation"
            required={false}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#0B4422] text-white px-6 py-3 rounded-lg hover:bg-[#1a6b3a] transition-colors"
        >
          Create Invitation
        </button>
      </form>

      {/* Display selected values */}
      {challengeSelection.combinedValue && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Selected Challenge:</h3>
          <p className="text-gray-700">{challengeSelection.combinedValue}</p>
          {challengeSelection.otherText && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Additional details:</p>
              <p className="text-gray-700">{challengeSelection.otherText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Example usage in Support Form
export const SupportFormExample: React.FC = () => {
  const [challengeSelection, setChallengeSelection] = useState({
    domain: '',
    subCategory: '',
    specificChallenge: '',
    otherText: '',
    combinedValue: ''
  });

  const handleChallengeChange = (selection: any) => {
    setChallengeSelection(selection);
    console.log('Support Challenge Selection:', selection);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-blue-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Request Support</h2>
      
      <form className="space-y-6">
        {/* Other form fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Number *
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter contact number..."
          />
        </div>

        {/* Challenge Selector with different styling */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What challenge are you facing? *
          </label>
          <ChallengeSelector
            onSelectionChange={handleChallengeChange}
            variant="support"
            required={true}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Support
        </button>
      </form>

      {/* Display selected values */}
      {challengeSelection.combinedValue && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Challenge Summary:</h3>
          <p className="text-gray-700">{challengeSelection.combinedValue}</p>
          {challengeSelection.otherText && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Additional details:</p>
              <p className="text-gray-700">{challengeSelection.otherText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main example component
const ChallengeSelectorExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invitation' | 'support'>('invitation');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Challenge Selector Component Examples
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setActiveTab('invitation')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'invitation'
                  ? 'bg-[#0B4422] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Invitation Form
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'support'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Support Form
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'invitation' ? <InvitationFormExample /> : <SupportFormExample />}
      </div>
    </div>
  );
};

export default ChallengeSelectorExample; 