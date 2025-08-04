"use client"

import { useState } from 'react'
import { Wallet, Copy, Check } from 'lucide-react'

interface WalletDisplayProps {
  address: string
  className?: string
}

export function WalletDisplay({ address, className = "" }: WalletDisplayProps) {
  const [addressCopied, setAddressCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  if (!address) return null

  return (
    <div className={`mb-4 ${className}`}>
      <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-green-400" />
          <span className="text-white text-sm font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleCopyAddress}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title={addressCopied ? "Copied!" : "Copy address"}
        >
          {addressCopied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  )
}