"use client";

import { useIsInitialized } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";

export function WalletAuth() {
  const isInitialized = useIsInitialized();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center space-x-2 text-white">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
        <span className="text-sm">Loading wallet...</span>
      </div>
    );
  }

  return <AuthButton />;
}