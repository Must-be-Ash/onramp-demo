"use client";

import { CDPReactProvider, type Theme } from '@coinbase/cdp-react';

const cdpConfig = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
  basePath: "https://api.cdp.coinbase.com/platform",
  useMock: false,
  debugging: true, // Enable for development
};

const appConfig = {
  name: "CDP Onramp Integration",
  logoUrl: "/logo.png",
};

export function CDPProvider({ children }: { children: React.ReactNode }) {
  return (
    <CDPReactProvider config={cdpConfig} app={appConfig}>
      {children}
    </CDPReactProvider>
  );
}