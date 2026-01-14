/**
 * useTheme Hook for Lightning Tennis
 * Provides access to theme context throughout the app
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { ThemeContextType } from '../types/theme';

// Custom hook for using theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
