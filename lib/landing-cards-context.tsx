'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface LandingBlogCard {
  id: number;
  title: string;
  description: string;
  iconId: string;
  link: string;
  isActive: boolean;
  order: number;
}

// Default landing cards with translation keys
const defaultLandingCards: LandingBlogCard[] = [
  {
    id: 1,
    title: 'blog.cards.self_awareness.title',
    description: 'blog.cards.self_awareness.description',
    iconId: 'self-awareness-icon',
    link: '/blog/how-to-build-self-awareness',
    isActive: true,
    order: 1
  },
  {
    id: 2,
    title: 'blog.cards.growth_journey.title',
    description: 'blog.cards.growth_journey.description',
    iconId: 'growth-journey-icon',
    link: '/blog/personal-growth-journeys',
    isActive: true,
    order: 2
  },
  {
    id: 3,
    title: 'blog.cards.decision_making.title',
    description: 'blog.cards.decision_making.description',
    iconId: 'decision-making-icon',
    link: '/blog/mindful-decision-making',
    isActive: true,
    order: 3
  }
];

interface LandingCardsContextType {
  landingCards: LandingBlogCard[];
  setLandingCards: (cards: LandingBlogCard[]) => void;
  updateLandingCard: (id: number, card: LandingBlogCard) => void;
  deleteLandingCard: (id: number) => void;
  getActiveCards: () => LandingBlogCard[];
}

const LandingCardsContext = createContext<LandingCardsContextType | undefined>(undefined);

export const useLandingCards = () => {
  const context = useContext(LandingCardsContext);
  if (context === undefined) {
    throw new Error('useLandingCards must be used within a LandingCardsProvider');
  }
  return context;
};

interface LandingCardsProviderProps {
  children: ReactNode;
}

export const LandingCardsProvider: React.FC<LandingCardsProviderProps> = ({ children }) => {
  const [landingCards, setLandingCards] = useState<LandingBlogCard[]>(defaultLandingCards);

  const updateLandingCard = (id: number, card: LandingBlogCard) => {
    setLandingCards(prev => prev.map(c => c.id === id ? card : c));
  };

  const deleteLandingCard = (id: number) => {
    setLandingCards(prev => prev.filter(c => c.id !== id));
  };

  const getActiveCards = () => {
    return landingCards.filter(card => card.isActive).sort((a, b) => a.order - b.order);
  };

  const value: LandingCardsContextType = {
    landingCards,
    setLandingCards,
    updateLandingCard,
    deleteLandingCard,
    getActiveCards
  };

  return (
    <LandingCardsContext.Provider value={value}>
      {children}
    </LandingCardsContext.Provider>
  );
}; 