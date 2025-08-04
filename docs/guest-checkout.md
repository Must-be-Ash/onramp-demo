# CDP Onramp Guest Checkout

Guest checkout allows users to purchase cryptocurrency without a Coinbase account using debit cards or Apple Pay. This feature is perfect for onboarding new Web3 users who don't want to create additional accounts.

## Overview

Guest checkout enables:
- **Debit card payments** for US residents
- **Apple Pay integration** for faster checkout
- **$5 - $500 weekly limits** per user
- **No account creation** required
- **Instant onboarding** to Web3

## Limits and Requirements

### Transaction Limits
- **Minimum**: $5 per transaction
- **Maximum**: $500 per week per user
- **Geographic**: US residents only
- **Age**: 18+ years old

### Supported Payment Methods
- Visa/Mastercard debit cards
- Apple Pay (iOS and macOS)
- Bank account linking (coming soon)

### Supported Assets
Guest checkout supports all major cryptocurrencies available on Coinbase Onramp:
- USDC (0% fees!)
- ETH, BTC, SOL
- Base network tokens
- And many more

## Implementation

### 1. Basic Guest Checkout Component

```tsx
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Apple } from "lucide-react"

interface GuestCheckoutProps {
  onStartGuestCheckout: (paymentMethod: "CARD" | "APPLE_PAY") => void
  estimatedUSDAmount: number
  isLoading?: boolean
}

export function GuestCheckout({ 
  onStartGuestCheckout, 
  estimatedUSDAmount,
  isLoading = false 
}: GuestCheckoutProps) {
  const isWithinLimits = estimatedUSDAmount >= 5 && estimatedUSDAmount <= 500

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Guest Checkout</CardTitle>
        <CardDescription>
          No Coinbase account needed. Pay with your debit card.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-center text-sm text-gray-600">
          Purchase ${estimatedUSDAmount.toFixed(2)} in USDC
        </div>

        <Button
          onClick={() => onStartGuestCheckout("CARD")}
          disabled={!isWithinLimits || isLoading}
          className="w-full flex items-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          {isLoading ? "Loading..." : "Pay with Debit Card"}
        </Button>

        <Button
          onClick={() => onStartGuestCheckout("APPLE_PAY")}
          disabled={!isWithinLimits || isLoading}
          className="w-full flex items-center gap-2 bg-black hover:bg-gray-800"
        >
          <Apple className="h-4 w-4" />
          {isLoading ? "Loading..." : "Pay with Apple Pay"}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 2. Guest Checkout Flow Handler

```tsx
import { useSessionToken } from '@/hooks/useSessionToken'
import { generateOnrampUrl } from '@/lib/cdp-auth'

function useGuestCheckout() {
  const { createToken } = useSessionToken()
  
  const startGuestCheckout = async (
    paymentMethod: "CARD" | "APPLE_PAY",
    params: {
      walletAddress: string
      amount: number
      asset?: string
    }
  ) => {
    try {
      // Create session token
      const sessionToken = await createToken({
        addresses: [{
          address: params.walletAddress,
          blockchains: ["base", "ethereum"]
        }],
        assets: [params.asset || "USDC"]
      })
      
      // Build onramp URL with guest checkout parameters
      const url = new URL('https://pay.coinbase.com/buy/select-asset')
      url.searchParams.set('sessionToken', sessionToken)
      url.searchParams.set('presetFiatAmount', params.amount.toString())
      url.searchParams.set('defaultAsset', params.asset || 'USDC')
      url.searchParams.set('defaultExperience', 'buy')
      
      // Add payment method preference
      if (paymentMethod === 'APPLE_PAY') {
        url.searchParams.set('defaultPaymentMethod', 'apple_pay')
      }
      
      // Open onramp in new window
      window.open(url.toString(), '_blank')
      
    } catch (error) {
      console.error('Failed to start guest checkout:', error)
      throw error
    }
  }
  
  return { startGuestCheckout }
}
```

### 3. Complete Integration Example

```tsx
"use client"

import { useState } from "react"
import { GuestCheckout } from "@/components/GuestCheckout"
import { useGuestCheckout } from "@/hooks/useGuestCheckout"

export default function OnrampPage() {
  const [amount, setAmount] = useState(50)
  const [isLoading, setIsLoading] = useState(false)
  const { startGuestCheckout } = useGuestCheckout()
  
  // Your user's wallet address (from wallet connection)
  const userWalletAddress = "0x742d35Cc6635C0532925a3b8D4b9dCfE0e"
  
  const handleGuestCheckout = async (paymentMethod: "CARD" | "APPLE_PAY") => {
    setIsLoading(true)
    
    try {
      await startGuestCheckout(paymentMethod, {
        walletAddress: userWalletAddress,
        amount: amount,
        asset: "USDC"
      })
    } catch (error) {
      alert("Failed to start checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Buy Crypto</h1>
      
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium mb-2">
            Amount (USD)
          </label>
          <input
            type="number"
            min="5"
            max="500"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <GuestCheckout
          onStartGuestCheckout={handleGuestCheckout}
          estimatedUSDAmount={amount}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
```

## URL Parameters for Guest Checkout

### Required Parameters
- `sessionToken`: Generated server-side session token
- `addresses`: Wallet addresses (handled in session token creation)

### Optional Parameters for Better UX
- `presetFiatAmount`: Pre-fill the USD amount
- `defaultAsset`: Default to USDC for simplicity
- `defaultPaymentMethod`: Set to `apple_pay` or `debit_card`
- `defaultExperience`: Set to `buy` (vs `send`)
- `redirectUrl`: Where to redirect after successful purchase
- `partnerUserId`: Track user across sessions

### Example URL
```javascript
const guestCheckoutUrl = `https://pay.coinbase.com/buy/select-asset?sessionToken=${token}&presetFiatAmount=50&defaultAsset=USDC&defaultPaymentMethod=apple_pay`
```

## User Experience Optimization

### 1. Clear Limit Communication

```tsx
function GuestCheckoutLimits() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h3 className="font-medium text-blue-900">Guest Checkout</h3>
      <ul className="text-sm text-blue-800 mt-1 space-y-1">
        <li>• $5 - $500 per week</li>
        <li>• US residents only</li>
        <li>• No account required</li>
        <li>• Instant delivery</li>
      </ul>
    </div>
  )
}
```

### 2. Amount Validation

```tsx
function validateGuestCheckoutAmount(amount: number): {
  isValid: boolean
  message?: string
} {
  if (amount < 5) {
    return { isValid: false, message: "Minimum $5 required for guest checkout" }
  }
  
  if (amount > 500) {
    return { isValid: false, message: "Maximum $500 per week for guest checkout" }
  }
  
  return { isValid: true }
}
```

### 3. Payment Method Detection

```tsx
function usePaymentMethodDetection() {
  const [supportsApplePay, setSupportsApplePay] = useState(false)
  
  useEffect(() => {
    // Check if Apple Pay is available
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setSupportsApplePay(true)
    }
  }, [])
  
  return { supportsApplePay }
}
```

## Error Handling

### Common Error Scenarios

1. **Amount Outside Limits**
```tsx
if (amount < 5 || amount > 500) {
  throw new Error("Amount must be between $5 and $500 for guest checkout")
}
```

2. **Geographic Restrictions**
```tsx
// Handle non-US users
if (userCountry !== 'US') {
  return (
    <div className="text-center p-6">
      <p>Guest checkout is currently only available for US residents.</p>
      <p>Please create a Coinbase account for full access.</p>
    </div>
  )
}
```

3. **Payment Method Unavailable**
```tsx
function PaymentMethodError({ method }: { method: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <p className="text-red-800">
        {method} is not available. Please try a different payment method.
      </p>
    </div>
  )
}
```

## Testing Guest Checkout

### Sandbox Testing

Guest checkout works in the CDP sandbox environment:

```typescript
// Use the same endpoints for sandbox testing
const SANDBOX_SESSION_TOKEN_URL = 'https://api.developer.coinbase.com/onramp/v1/token'
const SANDBOX_WIDGET_URL = 'https://pay.coinbase.com/buy/select-asset'
```

### Test Scenarios

1. **Valid amounts**: $5, $50, $500
2. **Invalid amounts**: $1, $501
3. **Different payment methods**: Card vs Apple Pay
4. **Network error handling**
5. **Session token expiration**

### Test Cards

Use these test card numbers in sandbox:
- **Visa**: 4111 1111 1111 1111
- **Mastercard**: 5555 5555 5555 4444
- **Declined**: 4000 0000 0000 0002

## Analytics and Tracking

### Track Guest Checkout Usage

```typescript
// Track guest checkout events
function trackGuestCheckout(event: string, data: any) {
  // Your analytics service
  analytics.track('Guest Checkout', {
    event,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    asset: data.asset,
    timestamp: new Date().toISOString()
  })
}

// Usage
trackGuestCheckout('initiated', { amount: 50, paymentMethod: 'APPLE_PAY', asset: 'USDC' })
trackGuestCheckout('completed', { amount: 50, paymentMethod: 'APPLE_PAY', asset: 'USDC' })
```

### A/B Testing Payment Methods

```typescript
function usePaymentMethodExperiment() {
  const [variant, setVariant] = useState<'cards-first' | 'apple-pay-first'>('cards-first')
  
  useEffect(() => {
    // Your A/B testing logic
    const testVariant = Math.random() > 0.5 ? 'apple-pay-first' : 'cards-first'
    setVariant(testVariant)
  }, [])
  
  return variant
}
```

## Best Practices

### 1. Progressive Enhancement
Start with basic debit card support, then add Apple Pay as an enhancement.

### 2. Clear Value Proposition
Emphasize the "no account needed" benefit to reduce friction.

### 3. Amount Presets
Offer common amounts ($10, $25, $50, $100) within guest checkout limits.

### 4. Mobile Optimization
Guest checkout users are often on mobile - optimize for touch interfaces.

### 5. Error Recovery
Provide clear next steps when guest checkout fails or isn't available.

## Migration from Account-Required Flow

### Before: Account Required
```tsx
// Old flow requiring Coinbase account
<button onClick={() => window.open(`https://coinbase.com/signup`)}>
  Create Account to Buy Crypto
</button>
```

### After: Guest Checkout Option
```tsx
// New flow with guest checkout option
<div className="space-y-4">
  <GuestCheckout 
    onStartGuestCheckout={handleGuestCheckout}
    estimatedUSDAmount={amount}
  />
  
  <div className="text-center">
    <p className="text-sm text-gray-600">or</p>
    <button onClick={() => window.open(`https://coinbase.com/signin`)}>
      Sign in to Coinbase for higher limits
    </button>
  </div>
</div>
```

## Resources

- [Guest Checkout API Reference](https://docs.cdp.coinbase.com/onramp-offramp/docs/onramp-overview#guest-checkout)
- [Apple Pay Integration Guide](https://developer.apple.com/apple-pay/)
- [Payment Method Testing](https://docs.cdp.coinbase.com/onramp-offramp/integration/sandbox-testing)
- [CDP Discord Support](https://discord.com/invite/cdp) - #onramp channel