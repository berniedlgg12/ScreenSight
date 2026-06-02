'use client';

import { createContext, useState, ReactNode, useContext, Dispatch, SetStateAction } from 'react';

export type DataMode = 'real';

interface ModeContextType {
  mode: DataMode;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  // Always fixed to 'real' now that simulation is removed
  const [mode] = useState<DataMode>('real');

  return (
    <ModeContext.Provider value={{ mode }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    return { mode: 'real' as const };
  }
  return context;
};
