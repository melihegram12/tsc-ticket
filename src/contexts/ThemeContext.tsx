'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange';

interface ThemeContextType {
    theme: Theme;
    colorScheme: ColorScheme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Color scheme definitions
const colorSchemes: Record<ColorScheme, { primary: string; hue: number }> = {
    blue: { primary: '#3b82f6', hue: 217 },
    green: { primary: '#10b981', hue: 160 },
    purple: { primary: '#8b5cf6', hue: 258 },
    red: { primary: '#ef4444', hue: 0 },
    orange: { primary: '#f97316', hue: 24 },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [colorScheme, setColorSchemeState] = useState<ColorScheme>('blue');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Load saved preferences
    useEffect(() => {
        const savedTheme = localStorage.getItem('tsc-theme') as Theme | null;
        const savedColor = localStorage.getItem('tsc-color-scheme') as ColorScheme | null;

        if (savedTheme) setThemeState(savedTheme);
        if (savedColor) setColorSchemeState(savedColor);
    }, []);

    // Resolve system theme and apply
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolvedTheme = () => {
            let resolved: 'light' | 'dark';
            if (theme === 'system') {
                resolved = mediaQuery.matches ? 'dark' : 'light';
            } else {
                resolved = theme;
            }
            setResolvedTheme(resolved);

            // Apply to document
            document.documentElement.setAttribute('data-theme', resolved);
            document.documentElement.classList.toggle('dark', resolved === 'dark');
        };

        updateResolvedTheme();
        mediaQuery.addEventListener('change', updateResolvedTheme);

        return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }, [theme]);

    // Apply color scheme
    useEffect(() => {
        const scheme = colorSchemes[colorScheme];
        document.documentElement.setAttribute('data-color-scheme', colorScheme);
        document.documentElement.style.setProperty('--color-scheme-hue', String(scheme.hue));
    }, [colorScheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('tsc-theme', newTheme);
    };

    const setColorScheme = (newScheme: ColorScheme) => {
        setColorSchemeState(newScheme);
        localStorage.setItem('tsc-color-scheme', newScheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, colorScheme, resolvedTheme, setTheme, setColorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
