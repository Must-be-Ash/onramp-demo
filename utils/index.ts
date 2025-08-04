/**
 * CDP Onramp Utilities
 * Utility functions for common onramp integration patterns
 */

/**
 * Validate wallet address format (Ethereum-compatible)
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate amount for guest checkout limits
 */
export function validateGuestCheckoutAmount(amount: number): {
  isValid: boolean
  error?: string
} {
  if (amount < 5) {
    return { isValid: false, error: 'Minimum amount is $5 for guest checkout' }
  }
  
  if (amount > 500) {
    return { isValid: false, error: 'Maximum amount is $500 per week for guest checkout' }
  }
  
  return { isValid: true }
}

/**
 * Supported blockchain networks
 */
export const SUPPORTED_BLOCKCHAINS = [
  'ethereum',
  'bitcoin',
  'base',
  'polygon',
  'arbitrum',
  'optimism',
  'solana',
  'avalanche'
] as const

export type SupportedBlockchain = typeof SUPPORTED_BLOCKCHAINS[number]

/**
 * Common cryptocurrency assets
 */
export const COMMON_ASSETS = [
  'USDC',
  'ETH',
  'BTC',
  'SOL',
  'MATIC',
  'AVAX',
  'OP'
] as const

export type CommonAsset = typeof COMMON_ASSETS[number]

/**
 * Guest checkout configuration
 */
export const GUEST_CHECKOUT_CONFIG = {
  minimumAmount: 5,
  maximumAmount: 500,
  supportedCountries: ['US'],
  supportedPaymentMethods: ['CARD', 'APPLE_PAY'] as const
} as const

/**
 * Build onramp URL with session token and parameters
 */
export function buildOnrampUrl(params: {
  sessionToken: string
  presetFiatAmount?: number
  presetCryptoAmount?: number
  defaultAsset?: string
  defaultNetwork?: string
  redirectUrl?: string
  partnerUserId?: string
  defaultPaymentMethod?: 'apple_pay' | 'debit_card'
}): string {
  const url = new URL('https://pay.coinbase.com/buy/select-asset')
  
  // Required parameter
  url.searchParams.set('sessionToken', params.sessionToken)
  
  // Optional parameters
  if (params.presetFiatAmount) {
    url.searchParams.set('presetFiatAmount', params.presetFiatAmount.toString())
  }
  
  if (params.presetCryptoAmount) {
    url.searchParams.set('presetCryptoAmount', params.presetCryptoAmount.toString())
  }
  
  if (params.defaultAsset) {
    url.searchParams.set('defaultAsset', params.defaultAsset)
  }
  
  if (params.defaultNetwork) {
    url.searchParams.set('defaultNetwork', params.defaultNetwork)
  }
  
  if (params.redirectUrl) {
    url.searchParams.set('redirectUrl', params.redirectUrl)
  }
  
  if (params.partnerUserId) {
    url.searchParams.set('partnerUserId', params.partnerUserId)
  }
  
  if (params.defaultPaymentMethod) {
    url.searchParams.set('defaultPaymentMethod', params.defaultPaymentMethod)
  }
  
  return url.toString()
}

/**
 * Format wallet address for display (truncated)
 */
export function formatWalletAddress(address: string, chars: number = 4): string {
  if (!isValidWalletAddress(address)) {
    return address
  }
  
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Check if Apple Pay is available in the current environment
 */
export function isApplePayAvailable(): boolean {
  if (typeof window === 'undefined') return false
  
  return !!(
    window.ApplePaySession && 
    ApplePaySession.canMakePayments && 
    ApplePaySession.canMakePayments()
  )
}

/**
 * Generate a random partner user ID
 */
export function generatePartnerUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Session token expiration utilities
 */
export const SESSION_TOKEN_UTILS = {
  EXPIRATION_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  /**
   * Check if a session token is likely expired
   * (based on creation time, not actual token validation)
   */
  isLikelyExpired(createdAt: number): boolean {
    return Date.now() - createdAt > this.EXPIRATION_TIME
  },
  
  /**
   * Get remaining time before expiration
   */
  getRemainingTime(createdAt: number): number {
    const elapsed = Date.now() - createdAt
    return Math.max(0, this.EXPIRATION_TIME - elapsed)
  }
}

/**
 * Error handling utilities
 */
export const ERROR_UTILS = {
  /**
   * Check if error is likely due to expired session token
   */
  isExpiredTokenError(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    return message.includes('expired') || 
           message.includes('invalid token') ||
           message.includes('unauthorized')
  },
  
  /**
   * Check if error is due to rate limiting
   */
  isRateLimitError(error: any): boolean {
    return error?.status === 429 || 
           error?.message?.toLowerCase().includes('rate limit')
  },
  
  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any): string {
    if (this.isExpiredTokenError(error)) {
      return 'Session expired. Please try again.'
    }
    
    if (this.isRateLimitError(error)) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    
    if (error?.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }
    
    return 'Something went wrong. Please try again.'
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Local storage utilities for session management
 */
export const STORAGE_UTILS = {
  keys: {
    SESSION_TOKEN: 'cdp_onramp_session_token',
    SESSION_CREATED_AT: 'cdp_onramp_session_created_at',
    USER_PREFERENCES: 'cdp_onramp_user_preferences'
  },
  
  /**
   * Store session token with timestamp
   */
  storeSessionToken(token: string): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(this.keys.SESSION_TOKEN, token)
    localStorage.setItem(this.keys.SESSION_CREATED_AT, Date.now().toString())
  },
  
  /**
   * Get stored session token if not expired
   */
  getValidSessionToken(): string | null {
    if (typeof window === 'undefined') return null
    
    const token = localStorage.getItem(this.keys.SESSION_TOKEN)
    const createdAtStr = localStorage.getItem(this.keys.SESSION_CREATED_AT)
    
    if (!token || !createdAtStr) return null
    
    const createdAt = parseInt(createdAtStr)
    if (SESSION_TOKEN_UTILS.isLikelyExpired(createdAt)) {
      this.clearSessionToken()
      return null
    }
    
    return token
  },
  
  /**
   * Clear stored session token
   */
  clearSessionToken(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.keys.SESSION_TOKEN)
    localStorage.removeItem(this.keys.SESSION_CREATED_AT)
  },
  
  /**
   * Store user preferences
   */
  storeUserPreferences(preferences: {
    preferredAsset?: string
    preferredNetwork?: string
    preferredPaymentMethod?: string
  }): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(preferences))
  },
  
  /**
   * Get user preferences
   */
  getUserPreferences(): any {
    if (typeof window === 'undefined') return {}
    
    const stored = localStorage.getItem(this.keys.USER_PREFERENCES)
    return stored ? JSON.parse(stored) : {}
  }
}