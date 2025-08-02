'use client';

import React, { useEffect, useState } from 'react';

interface ChallengeOption {
  value: string;
  label: string;
  children?: ChallengeOption[];
}

interface ChallengeSelectorProps {
  onSelectionChange: (selection: {
    domain: string;
    subCategory: string;
    specificChallenge: string;
    otherText: string;
    combinedValue: string;
  }) => void;
  variant?: 'invitation' | 'support';
  required?: boolean;
  initialValues?: {
    domain?: string;
    subCategory?: string;
    specificChallenge?: string;
    otherText?: string;
  };
  className?: string;
}

// Static data structure for challenges
const CHALLENGE_DATA: ChallengeOption[] = [
  {
    value: 'personal',
    label: 'Personal Challenges',
    children: [
      {
        value: 'relationships',
        label: 'Relationships',
        children: [
          { value: 'communication', label: 'Communication Issues' },
          { value: 'trust', label: 'Trust & Intimacy' },
          { value: 'conflict', label: 'Conflict Resolution' },
          { value: 'boundaries', label: 'Setting Boundaries' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'emotional',
        label: 'Emotional Well-being',
        children: [
          { value: 'anxiety', label: 'Anxiety & Stress' },
          { value: 'depression', label: 'Depression & Mood' },
          { value: 'self-esteem', label: 'Self-esteem Issues' },
          { value: 'grief', label: 'Grief & Loss' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'health',
        label: 'Health & Wellness',
        children: [
          { value: 'work-life-balance', label: 'Work-Life Balance' },
          { value: 'sleep', label: 'Sleep Issues' },
          { value: 'exercise', label: 'Exercise & Fitness' },
          { value: 'nutrition', label: 'Nutrition & Diet' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'other',
        label: 'Other'
      }
    ]
  },
  {
    value: 'professional',
    label: 'Professional Challenges',
    children: [
      {
        value: 'career',
        label: 'Career Development',
        children: [
          { value: 'advancement', label: 'Career Advancement' },
          { value: 'skills', label: 'Skill Development' },
          { value: 'direction', label: 'Career Direction' },
          { value: 'transition', label: 'Career Transition' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'workplace',
        label: 'Workplace Issues',
        children: [
          { value: 'leadership', label: 'Leadership Challenges' },
          { value: 'teamwork', label: 'Team Collaboration' },
          { value: 'performance', label: 'Performance Issues' },
          { value: 'workload', label: 'Workload Management' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'business',
        label: 'Business & Entrepreneurship',
        children: [
          { value: 'startup', label: 'Startup Challenges' },
          { value: 'growth', label: 'Business Growth' },
          { value: 'strategy', label: 'Strategic Planning' },
          { value: 'finances', label: 'Financial Management' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'other',
        label: 'Other'
      }
    ]
  },
  {
    value: 'spiritual',
    label: 'Spiritual & Personal Growth',
    children: [
      {
        value: 'purpose',
        label: 'Purpose & Meaning',
        children: [
          { value: 'life-purpose', label: 'Finding Life Purpose' },
          { value: 'values', label: 'Clarifying Values' },
          { value: 'meaning', label: 'Search for Meaning' },
          { value: 'spiritual-growth', label: 'Spiritual Growth' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'mindfulness',
        label: 'Mindfulness & Awareness',
        children: [
          { value: 'meditation', label: 'Meditation Practice' },
          { value: 'present-moment', label: 'Present Moment Awareness' },
          { value: 'mindful-living', label: 'Mindful Living' },
          { value: 'inner-peace', label: 'Inner Peace' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        value: 'other',
        label: 'Other'
      }
    ]
  },
  {
    value: 'other',
    label: 'Other'
  }
];

const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  onSelectionChange,
  variant = 'invitation',
  required = false,
  initialValues = {},
  className = ''
}) => {
  const [domain, setDomain] = useState(initialValues.domain || '');
  const [subCategory, setSubCategory] = useState(initialValues.subCategory || '');
  const [specificChallenge, setSpecificChallenge] = useState(initialValues.specificChallenge || '');
  const [otherText, setOtherText] = useState(initialValues.otherText || '');

  // Get available options based on current selection
  const getSubCategories = () => {
    if (!domain) return [];
    const domainOption = CHALLENGE_DATA.find(d => d.value === domain);
    return domainOption?.children || [];
  };

  const getSpecificChallenges = () => {
    if (!domain || !subCategory) return [];
    const domainOption = CHALLENGE_DATA.find(d => d.value === domain);
    const subCategoryOption = domainOption?.children?.find(s => s.value === subCategory);
    return subCategoryOption?.children || [];
  };

  // Reset dependent dropdowns when parent changes
  useEffect(() => {
    if (domain !== initialValues.domain) {
      setSubCategory('');
      setSpecificChallenge('');
      setOtherText('');
    }
  }, [domain, initialValues.domain]);

  useEffect(() => {
    if (subCategory !== initialValues.subCategory) {
      setSpecificChallenge('');
      setOtherText('');
    }
  }, [subCategory, initialValues.subCategory]);

  // Notify parent of changes
  useEffect(() => {
    const combinedValue = [domain, subCategory, specificChallenge]
      .filter(Boolean)
      .map(value => {
        const allOptions = [...CHALLENGE_DATA, ...getSubCategories(), ...getSpecificChallenges()];
        const option = allOptions.find(opt => opt.value === value);
        return option?.label || value;
      })
      .join(' > ');

    onSelectionChange({
      domain,
      subCategory,
      specificChallenge,
      otherText,
      combinedValue
    });
  }, [domain, subCategory, specificChallenge, otherText, onSelectionChange]);

  // Check if "Other" is selected at any level
  const showOtherText = domain === 'other' || subCategory === 'other' || specificChallenge === 'other';

  // Styling based on variant
  const getStyles = () => {
    if (variant === 'invitation') {
      return {
        container: 'space-y-4',
        select: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent bg-white',
        label: 'block text-sm font-medium text-gray-700 mb-2',
        otherInput: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B4422] focus:border-transparent bg-white',
        required: 'text-red-500 ml-1'
      };
    } else {
      return {
        container: 'space-y-4',
        select: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
        label: 'block text-sm font-medium text-gray-700 mb-2',
        otherInput: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
        required: 'text-red-500 ml-1'
      };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Level 1: Domain of Life */}
      <div>
        <label className={styles.label}>
          Domain of Life {required && <span className={styles.required}>*</span>}
        </label>
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className={styles.select}
          required={required}
        >
          <option value="">Select Domain of Life</option>
          {CHALLENGE_DATA.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Level 2: Sub-category */}
      <div>
        <label className={styles.label}>
          Sub-category
        </label>
        <select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          className={styles.select}
          disabled={!domain}
        >
          <option value="">Select Sub-category</option>
          {getSubCategories().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Level 3: Specific Challenge */}
      <div>
        <label className={styles.label}>
          Specific Challenge
        </label>
        <select
          value={specificChallenge}
          onChange={(e) => setSpecificChallenge(e.target.value)}
          className={styles.select}
          disabled={!subCategory}
        >
          <option value="">Select Specific Challenge</option>
          {getSpecificChallenges().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Other Text Input */}
      {showOtherText && (
        <div>
          <label className={styles.label}>
            Please specify
          </label>
          <textarea
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            className={styles.otherInput}
            rows={3}
            placeholder="Please describe your specific challenge..."
          />
        </div>
      )}
    </div>
  );
};

export default ChallengeSelector; 