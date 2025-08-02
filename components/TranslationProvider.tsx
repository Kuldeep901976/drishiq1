'use client';

import { memo } from 'react';

interface TranslationProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const TranslationProvider = memo(({ children }: TranslationProviderProps) => {
  return <>{children}</>;
});

TranslationProvider.displayName = 'TranslationProvider';

export default TranslationProvider; 