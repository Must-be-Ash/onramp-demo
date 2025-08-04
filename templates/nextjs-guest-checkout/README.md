# CDP Onramp Integration with Guest Checkout

This integration provides a complete implementation of Coinbase Onramp with guest checkout functionality, supporting both Apple Pay and debit card payments for users without Coinbase accounts.

## Features

- **Session Token Authentication**: Secure server-side token generation
- **Guest Checkout**: Apple Pay and debit card support for non-Coinbase users  
- **Rate Limiting**: Built-in protection against API abuse
- **TypeScript Support**: Full type safety for better development experience
- **Error Handling**: Comprehensive error management and user feedback

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure your CDP credentials:

```env
# CDP API Configuration
CDP_API_KEY_NAME=your_api_key_name
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\nyour_private_key_here\n-----END EC PRIVATE KEY-----"

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your onramp integration in action.

## Core Implementation

### Session Token Generation

The heart of secure onramp integration is server-side session token generation:

```typescript
// app/api/onramp/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateJWT, createSessionToken } from '@/lib/cdp-auth'

export async function POST(request: NextRequest) {
  try {
    const { addresses, assets } = await request.json()
    
    // Generate CDP JWT
    const jwt = await generateJWT()
    
    // Create session token
    const sessionToken = await createSessionToken(jwt, {
      addresses,
      assets: assets || ['USDC', 'ETH']
    })
    
    return NextResponse.json({ sessionToken })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    )
  }
}
```

### Guest Checkout Component

A React component that handles the guest checkout flow:

```typescript
// components/GuestCheckout.tsx
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
      
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={() => onStartGuestCheckout("CARD")}
            disabled={!isWithinLimits || isLoading}
            className="w-full"
          >
            Pay with Debit Card
          </Button>
          
          <Button
            onClick={() => onStartGuestCheckout("APPLE_PAY")}
            disabled={!isWithinLimits || isLoading}
            className="w-full bg-black hover:bg-gray-800"
          >
            Pay with Apple Pay
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Security Best Practices

### JWT Authentication

```typescript
// lib/cdp-auth.ts
import { SignJWT } from 'jose'
import crypto from 'crypto'

export async function generateJWT(): Promise<string> {
  const privateKey = crypto.createPrivateKey({
    key: process.env.CDP_API_KEY_PRIVATE_KEY!,
    format: 'pem'
  })

  const jwt = await new SignJWT({})
    .setProtectedHeader({ 
      alg: 'ES256',
      kid: process.env.CDP_API_KEY_NAME!,
      typ: 'JWT'
    })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)

  return jwt
}
```

### Input Validation

```typescript
import { z } from 'zod'

const sessionTokenSchema = z.object({
  addresses: z.array(z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
    blockchains: z.array(z.string())
  })),
  assets: z.array(z.string()).optional()
})
```

## Guest Checkout Limits

Guest checkout has specific limitations:

- **Minimum**: $5 per transaction
- **Maximum**: $500 per week
- **Availability**: US residents only
- **Payment Methods**: Debit cards and Apple Pay

## API Endpoints

### Create Session Token
- **POST** `/api/onramp/session`
- Creates a secure session token for onramp initialization

### Generate Onramp URL
- **POST** `/api/onramp/url`
- Generates the complete onramp URL with session token

## Troubleshooting

### Common Issues

1. **Session Token Expires**
   - Tokens expire after 5 minutes and are single-use
   - Generate a new token for each session

2. **Guest Checkout Limits**
   - Ensure amounts are between $5-$500
   - Weekly limits apply per user

3. **JWT Authentication Errors**
   - Verify your CDP API key format
   - Check key name matches your CDP project

## Resources

- [CDP Onramp Documentation](https://docs.cdp.coinbase.com/onramp-offramp/docs/onramp-overview)
- [Session Token API Reference](https://docs.cdp.coinbase.com/api-reference/onramp-offramp/create-session-token)
- [Guest Checkout Guide](https://docs.cdp.coinbase.com/onramp-offramp/docs/onramp-overview#guest-checkout)

## Support

For questions and support:
- [CDP Discord](https://discord.com/invite/cdp) - #onramp channel
- [CDP Documentation](https://docs.cdp.coinbase.com)
- [GitHub Issues](https://github.com/coinbase/cdp-onramp-docs/issues)