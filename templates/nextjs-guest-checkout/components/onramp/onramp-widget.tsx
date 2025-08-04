"use client"

import { useState } from 'react'
import { useCurrentUser, useEvmAddress, useSignOut, useSignInWithEmail, useVerifyEmailOTP } from '@coinbase/cdp-hooks'
import { OnrampHeader } from './onramp-header'
import { AmountSelector } from './amount-selector'
import { WalletDisplay } from './wallet-display'
import { AuthFlow } from './auth-flow'
import { OnrampButton } from './onramp-button'
import { OnrampFooter } from './onramp-footer'

interface OnrampWidgetProps {
  className?: string
  logoSrc?: string
  logoAlt?: string
  description?: string
  presetAmounts?: number[]
  minAmount?: number
  maxAmount?: number
  defaultAmount?: number
  footerText?: string
  footerHref?: string
}

export function OnrampWidget({
  className = "",
  logoSrc,
  logoAlt,
  description,
  presetAmounts,
  minAmount = 5,
  maxAmount = 500,
  defaultAmount = 50,
  footerText,
  footerHref
}: OnrampWidgetProps) {
  const [amount, setAmount] = useState(defaultAmount)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [flowId, setFlowId] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'signed-in'>('email')
  const [authLoading, setAuthLoading] = useState(false)
  
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

  return (
    <div className={`w-full max-w-md ${className}`}>
      <OnrampHeader 
        logoSrc={logoSrc}
        logoAlt={logoAlt}
        description={description}
      />

      {/* Main Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        
        <AmountSelector 
          amount={amount}
          onAmountChange={setAmount}
          presetAmounts={presetAmounts}
          minAmount={minAmount}
          maxAmount={maxAmount}
        />

        <WalletDisplay address={evmAddress || ""} />

        {/* Authentication or Purchase Flow */}
        {!currentUser ? (
          authStep !== 'signed-in' && (
            <AuthFlow
              authStep={authStep}
              email={email}
              otp={otp}
              authLoading={authLoading}
              onEmailChange={setEmail}
              onOtpChange={setOtp}
              onEmailSubmit={handleEmailSubmit}
              onOtpSubmit={handleOtpSubmit}
              onBackToEmail={() => setAuthStep('email')}
            />
          )
        ) : (
          <OnrampButton
            amount={amount}
            isLoading={isLoading}
            minAmount={minAmount}
            maxAmount={maxAmount}
            onBuyUSDC={handleBuyUSDC}
            onSignOut={handleSignOut}
          />
        )}
      </div>

      <OnrampFooter 
        text={footerText}
        href={footerHref}
      />
    </div>
  )
}