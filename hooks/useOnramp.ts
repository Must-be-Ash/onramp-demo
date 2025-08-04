/**
 * React hook for CDP Onramp integration
 * Provides high-level functions for starting onramp flows
 */

import { useState, useCallback } from 'react'
import { useSessionToken } from './useSessionToken'
import { buildOnrampUrl, validateGuestCheckoutAmount, STORAGE_UTILS } from '../utils'

interface OnrampParams {
  walletAddress: string
  blockchains?: string[]
  amount?: number
  asset?: string
  paymentMethod?: 'apple_pay' | 'debit_card'
  redirectUrl?: string
  partnerUserId?: string
}

interface UseOnrampReturn {
  startOnramp: (params: OnrampParams) => Promise<void>
  startGuestCheckout: (params: OnrampParams & { paymentMethod: 'apple_pay' | 'debit_card' }) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

export function useOnramp(): UseOnrampReturn {
  const { createToken, loading: tokenLoading, error: tokenError } = useSessionToken()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOnramp = useCallback(async (params: OnrampParams) => {
    setLoading(true)
    setError(null)

    try {
      // Create session token
      const sessionToken = await createToken({
        addresses: [{
          address: params.walletAddress,
          blockchains: params.blockchains || ['base', 'ethereum']
        }],
        assets: params.asset ? [params.asset] : undefined
      })

      // Build onramp URL
      const onrampUrl = buildOnrampUrl({
        sessionToken,
        presetFiatAmount: params.amount,
        defaultAsset: params.asset,
        defaultNetwork: params.blockchains?.[0],
        redirectUrl: params.redirectUrl,
        partnerUserId: params.partnerUserId,
        defaultPaymentMethod: params.paymentMethod
      })

      // Store user preferences
      STORAGE_UTILS.storeUserPreferences({
        preferredAsset: params.asset,
        preferredNetwork: params.blockchains?.[0],
        preferredPaymentMethod: params.paymentMethod
      })

      // Open onramp in new window
      window.open(onrampUrl, '_blank', 'noopener,noreferrer')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start onramp'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [createToken])

  const startGuestCheckout = useCallback(async (
    params: OnrampParams & { paymentMethod: 'apple_pay' | 'debit_card' }
  ) => {
    setLoading(true)
    setError(null)

    try {
      // Validate amount for guest checkout
      if (params.amount) {
        const validation = validateGuestCheckoutAmount(params.amount)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }
      }

      // Start onramp with guest checkout parameters
      await startOnramp({
        ...params,
        asset: params.asset || 'USDC' // Default to USDC for guest checkout
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start guest checkout'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [startOnramp])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    startOnramp,
    startGuestCheckout,
    loading: loading || tokenLoading,
    error: error || tokenError,
    clearError
  }
}

/**
 * Hook for onramp with user preferences
 * Automatically applies stored user preferences
 */
export function useOnrampWithPreferences(): UseOnrampReturn & {
  userPreferences: any
  updatePreferences: (preferences: any) => void
} {
  const baseHook = useOnramp()
  const [userPreferences, setUserPreferences] = useState(() => 
    STORAGE_UTILS.getUserPreferences()
  )

  const startOnrampWithPreferences = useCallback(async (params: OnrampParams) => {
    // Apply user preferences as defaults
    const paramsWithPreferences = {
      asset: userPreferences.preferredAsset || 'USDC',
      paymentMethod: userPreferences.preferredPaymentMethod,
      blockchains: userPreferences.preferredNetwork ? [userPreferences.preferredNetwork] : undefined,
      ...params // User-provided params override preferences
    }

    return baseHook.startOnramp(paramsWithPreferences)
  }, [baseHook.startOnramp, userPreferences])

  const startGuestCheckoutWithPreferences = useCallback(async (
    params: OnrampParams & { paymentMethod: 'apple_pay' | 'debit_card' }
  ) => {
    const paramsWithPreferences = {
      asset: userPreferences.preferredAsset || 'USDC',
      blockchains: userPreferences.preferredNetwork ? [userPreferences.preferredNetwork] : undefined,
      ...params
    }

    return baseHook.startGuestCheckout(paramsWithPreferences)
  }, [baseHook.startGuestCheckout, userPreferences])

  const updatePreferences = useCallback((preferences: any) => {
    const newPreferences = { ...userPreferences, ...preferences }
    setUserPreferences(newPreferences)
    STORAGE_UTILS.storeUserPreferences(newPreferences)
  }, [userPreferences])

  return {
    ...baseHook,
    startOnramp: startOnrampWithPreferences,
    startGuestCheckout: startGuestCheckoutWithPreferences,
    userPreferences,
    updatePreferences
  }
}

/**
 * Hook for batch onramp operations
 * Allows creating onramp flows for multiple wallets/amounts
 */
export function useBatchOnramp(): {
  startBatchOnramp: (batches: Array<OnrampParams>) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
  progress: { completed: number; total: number }
} {
  const { createToken } = useSessionToken()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  const startBatchOnramp = useCallback(async (batches: Array<OnrampParams>) => {
    setLoading(true)
    setError(null)
    setProgress({ completed: 0, total: batches.length })

    try {
      for (let i = 0; i < batches.length; i++) {
        const params = batches[i]
        
        // Create session token for this batch
        const sessionToken = await createToken({
          addresses: [{
            address: params.walletAddress,
            blockchains: params.blockchains || ['base', 'ethereum']
          }],
          assets: params.asset ? [params.asset] : undefined
        })

        // Build and open onramp URL
        const onrampUrl = buildOnrampUrl({
          sessionToken,
          presetFiatAmount: params.amount,
          defaultAsset: params.asset,
          defaultNetwork: params.blockchains?.[0],
          redirectUrl: params.redirectUrl,
          partnerUserId: params.partnerUserId
        })

        // Open with slight delay to avoid popup blocking
        setTimeout(() => {
          window.open(onrampUrl, '_blank', 'noopener,noreferrer')
        }, i * 500) // 500ms delay between opens

        setProgress({ completed: i + 1, total: batches.length })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start batch onramp'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [createToken])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    startBatchOnramp,
    loading,
    error,
    clearError,
    progress
  }
}

/**
 * Hook for onramp analytics and tracking
 */
export function useOnrampAnalytics(): {
  trackOnrampStart: (params: OnrampParams) => void
  trackOnrampComplete: (params: OnrampParams & { transactionId?: string }) => void
  trackOnrampError: (params: OnrampParams & { error: string }) => void
} {
  const trackOnrampStart = useCallback((params: OnrampParams) => {
    // Your analytics implementation
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onramp_start', {
        asset: params.asset,
        amount: params.amount,
        payment_method: params.paymentMethod,
        blockchains: params.blockchains?.join(',')
      })
    }
    
    // Custom analytics
    console.log('Onramp started:', params)
  }, [])

  const trackOnrampComplete = useCallback((
    params: OnrampParams & { transactionId?: string }
  ) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onramp_complete', {
        asset: params.asset,
        amount: params.amount,
        transaction_id: params.transactionId,
        payment_method: params.paymentMethod
      })
    }
    
    console.log('Onramp completed:', params)
  }, [])

  const trackOnrampError = useCallback((
    params: OnrampParams & { error: string }
  ) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onramp_error', {
        asset: params.asset,
        amount: params.amount,
        error: params.error,
        payment_method: params.paymentMethod
      })
    }
    
    console.error('Onramp error:', params)
  }, [])

  return {
    trackOnrampStart,
    trackOnrampComplete,
    trackOnrampError
  }
}