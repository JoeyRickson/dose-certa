import React, { createContext, ReactNode, useContext } from 'react';
import { AppTheme, appThemes } from './theme';

const ThemeContext = createContext<AppTheme>(appThemes.rose);

export function ThemeProvider({ theme, children }: { theme: AppTheme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
