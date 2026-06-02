'use client';

import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

export type DataMode = 'real' | 'demo';

interface ModeContextType {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>('real');

  useEffect(() => {
    const savedMode = localStorage.getItem('screensight_data_mode') as DataMode;
    if (savedMode && (savedMode === 'real' || savedMode === 'demo')) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: DataMode) => {
    setModeState(newMode);
    localStorage.setItem('screensight_data_mode', newMode);
    // Refresh page to reset all fleet hooks and caches
    window.location.reload();
  };

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    return { mode: 'real' as const, setMode: () => {} };
  }
  return context;
};
