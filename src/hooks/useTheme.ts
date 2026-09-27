import { createContext, useContext, useEffect, useState } from "react";

// Dawn and dusk are the painted scenes; flat is the plain black-and-white
// look from v1, which follows the system's light/dark setting.
export type ThemeName = "dawn" | "dusk" | "flat";

export interface Theme {
  name: ThemeName;
  /** Dark palette: dusk, or flat on a dark-mode system */
  dark: boolean;
  flat: boolean;
}

const STORAGE_KEY = "bill-splitter:theme";

function systemDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
}

function initialTheme(): ThemeName {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (isThemeName(saved)) return saved;

  return systemDark() ? "dusk" : "dawn";
}

export function isThemeName(value: string | null): value is ThemeName {
  return value === "dawn" || value === "dusk" || value === "flat";
}

// `override` forces a theme for the current page without saving it, e.g. a
// shared receipt shown in the sharer's theme.
export function useThemeState(override?: ThemeName) {
  const [saved, setName] = useState<ThemeName>(initialTheme);
  const name = override ?? saved;
  const [prefersDark, setPrefersDark] = useState(systemDark);

  // Flat tracks the system setting live
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(query.matches);
    query?.addEventListener("change", onChange);

    return () => query?.removeEventListener("change", onChange);
  }, []);

  const theme: Theme = {
    name,
    dark: name === "dusk" || (name === "flat" && prefersDark),
    flat: name === "flat",
  };

  // Keep <html> in sync so the page background matches outside the React tree
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme.dark);
    document.documentElement.classList.toggle("theme-flat", theme.flat);
  }, [theme.dark, theme.flat]);

  const setTheme = (next: ThemeName) => {
    localStorage.setItem(STORAGE_KEY, next);
    setName(next);
  };

  return { theme, setTheme };
}

export const ThemeContext = createContext<Theme>({ name: "dusk", dark: true, flat: false });

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
