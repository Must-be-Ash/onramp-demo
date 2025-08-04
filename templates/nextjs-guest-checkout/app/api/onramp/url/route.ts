import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateOnrampUrl } from '@/lib/cdp-auth'

// Input validation schema
const onrampUrlSchema = z.object({
  addresses: z.array(z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
    blockchains: z.array(z.string().min(1))
  })).min(1),
  assets: z.array(z.string()).optional(),
  defaultAsset: z.string().optional(),
  defaultNetwork: z.string().optional(),
  presetFiatAmount: z.number().min(5).max(500).optional(), // Guest checkout limits
  presetCryptoAmount: z.number().positive().optional(),
  redirectUrl: z.string().url().optional(),
  partnerUserId: z.string().max(50).optional() // CDP requirement
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = onrampUrlSchema.parse(body)

    // Generate complete onramp URL with session token
    const onrampUrl = await generateOnrampUrl({
      addresses: validatedData.addresses,
      assets: validatedData.assets,
      defaultAsset: validatedData.defaultAsset,
      defaultNetwork: validatedData.defaultNetwork,
      presetFiatAmount: validatedData.presetFiatAmount,
      presetCryptoAmount: validatedData.presetCryptoAmount,
      redirectUrl: validatedData.redirectUrl,
      partnerUserId: validatedData.partnerUserId
    })
    
    return NextResponse.json({ 
      url: onrampUrl,
      expiresIn: 300 // URL is valid for 5 minutes (session token lifetime)
    })
    
  } catch (error) {
    console.error('Onramp URL generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate onramp URL' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}