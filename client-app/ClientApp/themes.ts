export interface Theme {
    name: string;
    colors: {
        background: string;
        surface: string;
        primary: string;
        secondary: string;
        text: string;
        textSecondary: string;
        border: string;
        success: string;
        error: string;
        warning: string;
        overlay: string;
        headerGradient: string[];
    };
    dark: boolean;
}

export const themes: Record<string, Theme> = {
    dark: {
        name: 'Dark',
        colors: {
            background: '#020617', // Slate 950
            surface: '#1e293b',    // Slate 800
            primary: '#3b82f6',    // Blue 500
            secondary: '#334155',  // Slate 700
            text: '#f8fafc',       // Slate 50
            textSecondary: '#cbd5e1', // Slate 300
            border: '#1e293b',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(2, 6, 23, 0.98)',
            headerGradient: ['#0f172a', '#1e293b', '#0f172a'],
        },
        dark: true,
    },
    light: {
        name: 'Light (Original)',
        colors: {
            background: '#f8fafc', // Slate 50
            surface: '#ffffff',    // White
            primary: '#4f46e5',    // Indigo 600 (from screenshot)
            secondary: '#e2e8f0',  // Slate 200
            text: '#0f172a',       // Slate 900
            textSecondary: '#64748b', // Slate 500
            border: '#e2e8f0',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(255, 255, 255, 0.95)',
            headerGradient: ['#991b1b', '#b91c1c', '#dc2626'], // Original Red Header
        },
        dark: false,
    },
    ocean: {
        name: 'Ocean',
        colors: {
            background: '#0c4a6e', // Sky 900
            surface: '#075985',    // Sky 800
            primary: '#38bdf8',    // Sky 400
            secondary: '#0369a1',  // Sky 700
            text: '#f0f9ff',       // Sky 50
            textSecondary: '#bae6fd', // Sky 200
            border: '#075985',
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            overlay: 'rgba(12, 74, 110, 0.95)',
            headerGradient: ['#082f49', '#0c4a6e', '#075985'],
        },
        dark: true,
    },
    sunset: {
        name: 'Sunset',
        colors: {
            background: '#451a03', // Amber 950
            surface: '#78350f',    // Amber 900
            primary: '#f59e0b',    // Amber 500
            secondary: '#92400e',  // Amber 800
            text: '#fffbeb',       // Amber 50
            textSecondary: '#fde68a', // Amber 200
            border: '#78350f',
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            overlay: 'rgba(69, 26, 3, 0.95)',
            headerGradient: ['#78350f', '#92400e', '#b45309'],
        },
        dark: true,
    },
    forest: {
        name: 'Forest',
        colors: {
            background: '#f0fdf4', // Green 50
            surface: '#ffffff',    // White
            primary: '#16a34a',    // Green 600
            secondary: '#dcfce7',  // Green 100
            text: '#14532d',       // Green 900
            textSecondary: '#166534', // Green 800
            border: '#bbf7d0',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(255, 255, 255, 0.95)',
            headerGradient: ['#14532d', '#166534', '#15803d'],
        },
        dark: false,
    },
    luxury: {
        name: 'Luxury',
        colors: {
            background: '#09090b', // Zinc 950
            surface: '#18181b',    // Zinc 900
            primary: '#d4af37',    // Gold
            secondary: '#27272a',  // Zinc 800
            text: '#fafafa',       // Zinc 50
            textSecondary: '#a1a1aa', // Zinc 400
            border: '#27272a',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(9, 9, 11, 0.98)',
            headerGradient: ['#000000', '#09090b', '#18181b'],
        },
        dark: true,
    },
};
