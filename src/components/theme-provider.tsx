"use client"
 
import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { STORAGE_KEYS, THEME_COLORS } from "@/lib/constants"

// Create theme context
type ThemeContextType = {
  currentTheme: string;
  setTheme: (theme: string) => void;
  isSystemTheme: boolean;
  toggleTheme: () => void;
  themeColors: typeof THEME_COLORS.light;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Create theme provider component
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, systemTheme, resolvedTheme } = props;
  
  const currentTheme = resolvedTheme || theme || "light";
  const isSystemTheme = theme === "system";
  
  // Get the current theme colors
  const themeColors = currentTheme === "dark" 
    ? THEME_COLORS.dark 
    : THEME_COLORS.light;
  
  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };
  
  // Apply theme to CSS variables
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      // Apply brand colors
      root.style.setProperty('--brand-primary', themeColors.brand.primary);
      root.style.setProperty('--brand-secondary', themeColors.brand.secondary);
      root.style.setProperty('--brand-tertiary', themeColors.brand.tertiary);
      root.style.setProperty('--brand-accent', themeColors.brand.accent);
      
      // Apply UI colors
      root.style.setProperty('--ui-background', themeColors.ui.background);
      root.style.setProperty('--ui-foreground', themeColors.ui.foreground);
      root.style.setProperty('--ui-card', themeColors.ui.card);
      root.style.setProperty('--ui-border', themeColors.ui.border);
      root.style.setProperty('--ui-hover', themeColors.ui.hover);
      
      // Apply status colors
      root.style.setProperty('--status-success', themeColors.status.success);
      root.style.setProperty('--status-warning', themeColors.status.warning);
      root.style.setProperty('--status-error', themeColors.status.error);
      root.style.setProperty('--status-info', themeColors.status.info);
      
      // Apply text colors
      root.style.setProperty('--text-primary', themeColors.text.primary);
      root.style.setProperty('--text-secondary', themeColors.text.secondary);
      root.style.setProperty('--text-tertiary', themeColors.text.tertiary);
      root.style.setProperty('--text-disabled', themeColors.text.disabled);
      root.style.setProperty('--text-on-primary', themeColors.text.onPrimary);
    }
  }, [themeColors, currentTheme]);
  
  // useEffect to handle mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by only rendering after mounted
  if (!mounted) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: currentTheme as string,
        setTheme,
        isSystemTheme,
        toggleTheme,
        themeColors,
      }}
    >
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeContext.Provider>
  );
}

// Hook for using the theme context
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}