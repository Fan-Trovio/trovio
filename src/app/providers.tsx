'use client';

import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

import { config } from '../wagmi';
import { VaultsProvider } from './context/VaultsContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
            ...darkTheme.accentColors.purple,
        overlayBlur: 'small',
      })}
    >
        <VaultsProvider>
          {children}
        </VaultsProvider>
      </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
