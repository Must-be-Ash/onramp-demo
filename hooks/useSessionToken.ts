/**
 * React hook for managing CDP Onramp session tokens
 * Handles creation, caching, and automatic retry logic
 */

import { useState, useCallback, useEffect } from 'react'
import { STORAGE_UTILS, SESSION_TOKEN_UTILS, ERROR_UTILS, retryWithBackoff } from '../utils'

interface SessionTokenParams {
  addresses: Array<{
    address: string
    blockchains: string[]
  }>
  assets?: string[]
}

interface UseSessionTokenReturn {
  createToken: (params: SessionTokenParams) => Promise<string>
  loading: boolean
  error: string | null
  clearError: () => void
  tokenCreatedAt: number | null
  remainingTime: number
}

export function useSessionToken(): UseSessionTokenReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenCreatedAt, setTokenCreatedAt] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  // Update remaining time every second
  useEffect(() => {
    if (!tokenCreatedAt) return

    const interval = setInterval(() => {
      const remaining = SESSION_TOKEN_UTILS.getRemainingTime(tokenCreatedAt)
      setRemainingTime(remaining)
      
      if (remaining <= 0) {
        setTokenCreatedAt(null)
        STORAGE_UTILS.clearSessionToken()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [tokenCreatedAt])

  const createToken = useCallback(async (params: SessionTokenParams): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      // Check for valid cached token first
      const cachedToken = STORAGE_UTILS.getValidSessionToken()
      if (cachedToken) {
        const createdAtStr = localStorage.getItem(STORAGE_UTILS.keys.SESSION_CREATED_AT)
        if (createdAtStr) {
          setTokenCreatedAt(parseInt(createdAtStr))
          setRemainingTime(SESSION_TOKEN_UTILS.getRemainingTime(parseInt(createdAtStr)))
        }
        setLoading(false)
        return cachedToken
      }

      // Create new token with retry logic
      const token = await retryWithBackoff(async () => {
        const response = await fetch('/api/onramp/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        if (!data.sessionToken) {
          throw new Error('No session token returned from server')
        }

        return data.sessionToken
      })

      // Store token and set timestamps
      const now = Date.now()
      STORAGE_UTILS.storeSessionToken(token)
      setTokenCreatedAt(now)
      setRemainingTime(SESSION_TOKEN_UTILS.EXPIRATION_TIME)

      return token

    } catch (err) {
      const errorMessage = ERROR_UTILS.getUserFriendlyMessage(err)
      setError(errorMessage)
      console.error('Session token creation failed:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    createToken,
    loading,
    error,
    clearError,
    tokenCreatedAt,
    remainingTime
  }
}

/**
 * Hook for session token with automatic refresh
 * Automatically refreshes token when it's about to expire
 */
export function useSessionTokenWithRefresh(
  params: SessionTokenParams,
  refreshThreshold: number = 60000 // Refresh 1 minute before expiration
): UseSessionTokenReturn & { 
  token: string | null
  autoRefresh: boolean
  setAutoRefresh: (enabled: boolean) => void
} {
  const baseHook = useSessionToken()
  const [token, setToken] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !baseHook.tokenCreatedAt || baseHook.remainingTime > refreshThreshold) {
      return
    }

    const refreshToken = async () => {
      try {
        STORAGE_UTILS.clearSessionToken() // Force new token creation
        const newToken = await baseHook.createToken(params)
        setToken(newToken)
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }

    const timeoutId = setTimeout(refreshToken, baseHook.remainingTime - refreshThreshold)
    return () => clearTimeout(timeoutId)
  }, [baseHook.tokenCreatedAt, baseHook.remainingTime, refreshThreshold, autoRefresh, params])

  // Update token when created
  useEffect(() => {
    if (baseHook.tokenCreatedAt) {
      const cachedToken = STORAGE_UTILS.getValidSessionToken()
      setToken(cachedToken)
    }
  }, [baseHook.tokenCreatedAt])

  return {
    ...baseHook,
    token,
    autoRefresh,
    setAutoRefresh
  }
}

/**
 * Hook for managing multiple session tokens for different wallet addresses
 */
export function useMultiSessionToken(): {
  createTokenForAddress: (address: string, blockchains: string[], assets?: string[]) => Promise<string>
  createTokensForAddresses: (addresses: Array<{ address: string; blockchains: string[] }>, assets?: string[]) => Promise<string>
  loading: boolean
  error: string | null
  clearError: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokenCache = new Map<string, { token: string; createdAt: number }>()

  const createTokenForAddress = useCallback(async (
    address: string, 
    blockchains: string[], 
    assets?: string[]
  ): Promise<string> => {
    const cacheKey = `${address}-${blockchains.join(',')}-${assets?.join(',') || ''}`
    
    // Check cache first
    const cached = tokenCache.get(cacheKey)
    if (cached && !SESSION_TOKEN_UTILS.isLikelyExpired(cached.createdAt)) {
      return cached.token
    }

    setLoading(true)
    setError(null)

    try {
      const token = await retryWithBackoff(async () => {
        const response = await fetch('/api/onramp/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [{ address, blockchains }],
            assets
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data.sessionToken
      })

      // Cache the token
      tokenCache.set(cacheKey, { token, createdAt: Date.now() })
      return token

    } catch (err) {
      const errorMessage = ERROR_UTILS.getUserFriendlyMessage(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTokensForAddresses = useCallback(async (
    addresses: Array<{ address: string; blockchains: string[] }>,
    assets?: string[]
  ): Promise<string> => {
    setLoading(true)
    setError(null)

    try {
      const token = await retryWithBackoff(async () => {
        const response = await fetch('/api/onramp/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses, assets })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data.sessionToken
      })

      return token

    } catch (err) {
      const errorMessage = ERROR_UTILS.getUserFriendlyMessage(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    createTokenForAddress,
    createTokensForAddresses,
    loading,
    error,
    clearError
  }
}