import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateJWT, createSessionToken } from '@/lib/cdp-auth'

// Input validation schema for guest checkout
const sessionTokenSchema = z.object({
  guestCheckout: z.boolean().optional(),
  userAddress: z.string().optional(),
  assets: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = sessionTokenSchema.parse(body)

    // For guest checkout, userAddress can be null
    if (!validatedData.userAddress && !validatedData.guestCheckout) {
      return NextResponse.json(
        { error: 'User address is required for regular onramp' },
        { status: 400 }
      )
    }

    // Generate CDP JWT
    const jwt = await generateJWT()
    
    // Create session token with CDP API
    const requestBody = validatedData.guestCheckout 
      ? {
          // Guest checkout doesn't require specific addresses
          addresses: [],
          assets: validatedData.assets || ['ETH', 'USDC']
        }
      : {
          addresses: [
            {
              address: validatedData.userAddress!,
              blockchains: ['base']
            }
          ],
          assets: validatedData.assets || ['ETH', 'USDC']
        }

    const sessionToken = await createSessionToken(jwt, requestBody)
    
    return NextResponse.json({ 
      sessionToken,
      expiresIn: 300 // 5 minutes
    })
    
  } catch (error) {
    console.error('Session token creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('CDP_API_KEY')) {
      return NextResponse.json(
        { error: 'Server configuration error. Please check your CDP API credentials.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create session token. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create session tokens.' },
    { status: 405 }
  )
}