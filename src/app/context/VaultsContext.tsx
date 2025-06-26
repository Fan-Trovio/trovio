"use client";

import { createContext, useState, ReactNode, useContext } from 'react';

interface Vault {
  vaultAmount: string;
  clubName: string;
  xProfileUrl: string;
  announcementTweetUrl: string;
}

interface VaultsContextType {
  vaults: Vault[];
  addVault: (vault: Vault) => void;
}

const VaultsContext = createContext<VaultsContextType | undefined>(undefined);

export function VaultsProvider({ children }: { children: ReactNode }) {
  const [vaults, setVaults] = useState<Vault[]>([]);

  const addVault = (vault: Vault) => {
    setVaults(prevVaults => [...prevVaults, vault]);
  };

  return (
    <VaultsContext.Provider value={{ vaults, addVault }}>
      {children}
    </VaultsContext.Provider>
  );
}

export function useVaults() {
  const context = useContext(VaultsContext);
  if (context === undefined) {
    throw new Error('useVaults must be used within a VaultsProvider');
  }
  return context;
} 