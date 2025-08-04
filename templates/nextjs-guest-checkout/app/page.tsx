"use client"

import { useState } from 'react'
import { Button3D } from '@/components/button-3d'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { useCurrentUser, useEvmAddress, useSignOut, useIsInitialized, useSignInWithEmail, useVerifyEmailOTP } from '@coinbase/cdp-hooks'
import { DollarSign, Wallet, Copy, LogOut, Mail, Check } from 'lucide-react'

export default function Home() {
  const [amount, setAmount] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [flowId, setFlowId] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'signed-in'>('email')
  const [authLoading, setAuthLoading] = useState(false)
  
  const isInitialized = useIsInitialized()
  const currentUser = useCurrentUser()
  const evmAddress = useEvmAddress()
  const signOut = useSignOut()
  const signInWithEmail = useSignInWithEmail()
  const verifyEmailOTP = useVerifyEmailOTP()

  const handleBuyUSDC = async () => {
    setIsLoading(true)
    
    try {
      // Create session token - use wallet address if available, otherwise guest checkout
      const response = await fetch('/api/onramp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          evmAddress 
            ? { userAddress: evmAddress, assets: ['USDC'] }
            : { guestCheckout: true, assets: ['USDC'] }
        )
      })
      
      if (!response.ok) throw new Error('Failed to create session token')
      
      const { sessionToken } = await response.json()
      
      // Build onramp URL
      const url = new URL('https://pay.coinbase.com/buy/select-asset')
      url.searchParams.set('sessionToken', sessionToken)
      url.searchParams.set('presetFiatAmount', amount.toString())
      url.searchParams.set('defaultAsset', 'USDC')
      url.searchParams.set('defaultNetwork', 'base')
      
      // Open onramp in new window
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      
    } catch (error) {
      console.error('Failed to start onramp:', error)
      alert('Failed to start purchase. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAddress = async () => {
    if (!evmAddress) return
    
    try {
      await navigator.clipboard.writeText(evmAddress)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const handleSignOut = () => {
    signOut()
    setAuthStep('email')
    setEmail("")
    setOtp("")
    setFlowId(null)
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) return
    
    setAuthLoading(true)
    try {
      const { flowId: newFlowId } = await signInWithEmail({ email })
      setFlowId(newFlowId)
      setAuthStep('otp')
    } catch (error) {
      console.error('Email sign-in failed:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    if (!flowId || !otp.trim()) return
    
    setAuthLoading(true)
    try {
      await verifyEmailOTP({ flowId, otp })
      setAuthStep('signed-in')
    } catch (error) {
      console.error('OTP verification failed:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const presetAmounts = [25, 50, 100, 250, 500]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="h-12 w-auto"
            />
          </div>
          <p className="text-slate-300 text-sm">
            Embedded Wallets + Onramp demo
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          
          {/* Amount Selection */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3 flex items-center gap-2">
              <DollarSign size={18} />
              Select Amount (USD)
            </label>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    amount === preset
                      ? 'bg-white text-slate-900 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="number"
                min="5"
                max="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Custom amount"
              />
            </div>
            
            <p className="text-slate-400 text-xs mt-2">
              Min: $5 • Max: $500 per week • 0% fees on USDC
            </p>
          </div>

          {/* Wallet Section - Show Connected Wallet Info */}
          {currentUser && evmAddress && (
            <div className="mb-4">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-400" />
                  <span className="text-white text-sm font-medium">
                    {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
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
          )}

          {/* Connect Wallet or Buy Button */}
          {!currentUser ? (
            authStep === 'email' ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
                <Button3D
                  onClick={handleEmailSubmit}
                  disabled={!email.trim() || authLoading}
                  isLoading={authLoading}
                  size="lg"
                  className="w-full text-lg font-semibold"
                  style={{
                    background: 'linear-gradient(to bottom, #333333, #222222)',
                  }}
                >
                  {authLoading ? 'Sending...' : 'Sign In'}
                </Button3D>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white text-sm text-center">
                  Check your email for the verification code
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <Button3D
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6 || authLoading}
                  isLoading={authLoading}
                  size="lg"
                  className="w-full text-lg font-semibold"
                  style={{
                    background: 'linear-gradient(to bottom, #333333, #222222)',
                  }}
                >
                  {authLoading ? 'Verifying...' : 'Verify Code'}
                </Button3D>
                <button
                  onClick={() => setAuthStep('email')}
                  className="w-full text-slate-400 hover:text-slate-300 transition-colors text-sm"
                >
                  Back to email
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <Button3D
                onClick={handleBuyUSDC}
                disabled={amount < 5 || amount > 500}
                isLoading={isLoading}
                size="lg"
                className="w-full text-lg font-semibold"
                style={{
                  background: 'linear-gradient(to bottom, #333333, #222222)',
                }}
              >
                {isLoading ? 'Processing...' : `Buy $${amount} USDC`}
              </Button3D>
              
              <button
                onClick={handleSignOut}
                className="w-full text-slate-400 hover:text-slate-300 transition-colors text-xs flex items-center justify-center gap-1"
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a 
            href="https://portal.cdp.coinbase.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <TextShimmer 
              duration={3}
              className="text-xs [--base-color:#94a3b8] [--base-gradient-color:#ffffff] dark:[--base-color:#64748b] dark:[--base-gradient-color:#f8fafc]"
            >
              Powered by Coinbase Developer Platform
            </TextShimmer>
          </a>
        </div>
      </div>
    </main>
  )
}