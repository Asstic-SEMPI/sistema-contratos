'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    primaryLight: string;
    primaryBorder: string;
    secondaryLight: string;
    secondaryBorder: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'sempi-padrao',
    name: '1. Padrão SEMPI RJ',
    description: 'Ameixa Profundo Institucional & Verde-Petróleo Técnico',
    colors: {
      primary: '#581526',
      primaryHover: '#420F1D',
      secondary: '#0D3B3E',
      secondaryHover: '#09292B',
      primaryLight: '#FDF2F4',
      primaryBorder: '#F3D1D9',
      secondaryLight: '#F0FDFA',
      secondaryBorder: '#CCFBF1',
    },
  },
  {
    id: 'safira-imperial',
    name: '2. Safira Executivo',
    description: 'Azul Marinho Soberano & Dourado Nobre',
    colors: {
      primary: '#1E3A8A',
      primaryHover: '#172554',
      secondary: '#B45309',
      secondaryHover: '#92400E',
      primaryLight: '#EFF6FF',
      primaryBorder: '#BFDBFE',
      secondaryLight: '#FFFBEB',
      secondaryBorder: '#FDE68A',
    },
  },
  {
    id: 'esmeralda',
    name: '3. Esmeralda Sustentável',
    description: 'Verde Floresta & Menta Metálico',
    colors: {
      primary: '#065F46',
      primaryHover: '#064E3B',
      secondary: '#0F766E',
      secondaryHover: '#115E59',
      primaryLight: '#ECFDF5',
      primaryBorder: '#A7F3D0',
      secondaryLight: '#F0FDFA',
      secondaryBorder: '#99F6E4',
    },
  },
  {
    id: 'grafite',
    name: '4. Grafite Minimalista',
    description: 'Slate Carvão Puro & Titânio Arquitetônico',
    colors: {
      primary: '#1E293B',
      primaryHover: '#0F172A',
      secondary: '#334155',
      secondaryHover: '#1E293B',
      primaryLight: '#F8FAFC',
      primaryBorder: '#CBD5E1',
      secondaryLight: '#F1F5F9',
      secondaryBorder: '#E2E8F0',
    },
  },
  {
    id: 'cobre-mogno',
    name: '5. Cobre & Mogno',
    description: 'Terracota Clássico & Bronze Envelhecido',
    colors: {
      primary: '#7C2D12',
      primaryHover: '#431407',
      secondary: '#9A3412',
      secondaryHover: '#7C2D12',
      primaryLight: '#FFF7ED',
      primaryBorder: '#FED7AA',
      secondaryLight: '#FFFBEB',
      secondaryBorder: '#FDE68A',
    },
  },
  {
    id: 'merlot-cobalto',
    name: '6. Merlot & Cobalto',
    description: 'Vinho Merlot Nobre & Azul Cobalto',
    colors: {
      primary: '#701A75',
      primaryHover: '#4A044E',
      secondary: '#1D4ED8',
      secondaryHover: '#1E40AF',
      primaryLight: '#FDF4FF',
      primaryBorder: '#F5D0FE',
      secondaryLight: '#EFF6FF',
      secondaryBorder: '#BFDBFE',
    },
  },
];

interface ThemeContextValue {
  currentThemeId: string;
  currentTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  availableThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sempi_sgc_user_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState<string>('sempi-padrao');

  const applyThemeVariables = (theme: ThemeDefinition) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--sempi-plum', theme.colors.primary);
    root.style.setProperty('--sempi-plum-hover', theme.colors.primaryHover);
    root.style.setProperty('--sempi-plum-light', theme.colors.primaryLight);
    root.style.setProperty('--sempi-plum-border', theme.colors.primaryBorder);
    root.style.setProperty('--sempi-teal', theme.colors.secondary);
    root.style.setProperty('--sempi-teal-hover', theme.colors.secondaryHover);
    root.style.setProperty('--sempi-teal-light', theme.colors.secondaryLight);
    root.style.setProperty('--sempi-teal-border', theme.colors.secondaryBorder);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) {
        setCurrentThemeId(saved);
        applyThemeVariables(found);
        return;
      }
    }
    applyThemeVariables(THEMES[0]);
  }, []);

  const setTheme = (themeId: string) => {
    const found = THEMES.find((t) => t.id === themeId);
    if (found) {
      setCurrentThemeId(themeId);
      localStorage.setItem(STORAGE_KEY, themeId);
      applyThemeVariables(found);
    }
  };

  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        currentThemeId,
        currentTheme,
        setTheme,
        availableThemes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um <ThemeProvider>');
  }
  return context;
}
