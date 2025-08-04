# CDP Onramp Guest Checkout

Interactive CLI to quickly set up CDP Onramp guest checkout with embedded wallets for Next.js applications. Features a beautiful glassmorphism UI, email/OTP authentication, and seamless onramp integration.

## ✨ Features

- **🚀 Interactive CLI**: One-command setup with optional CDP configuration
- **💎 Beautiful UI**: Elegant glassmorphism design with dark theme
- **👤 Embedded Wallets**: Email/OTP authentication without external wallet needed
- **💳 Guest Checkout**: Buy crypto without Coinbase account required
- **🔒 Secure by Default**: Server-side JWT generation and session tokens
- **⚡ Next.js 14**: Built with App Router and TypeScript
- **🎨 Tailwind CSS**: Responsive design with custom components

## 🚀 Quick Start

### Installation

```bash
npx cdp-onramp-demo
```

The CLI will:
1. Ask where you want to create the project
2. Optionally configure your CDP credentials (skippable)
3. Set up the complete Next.js application
4. Generate .env file if credentials provided

### Manual Installation

```bash
npm install -g cdp-onramp-demo
cdp-onramp-demo
```

## 🎯 What You Get

### Generated Project Structure

```
your-project/
├── app/
│   ├── api/onramp/session/route.ts  # Session token generation
│   ├── globals.css                   # Dark theme styling
│   ├── layout.tsx                   # CDP provider setup
│   └── page.tsx                     # Main guest checkout UI
├── components/
│   ├── cdp-provider.tsx             # Embedded wallet provider
│   ├── button-3d.tsx                # Custom 3D buttons
│   └── ui/text-shimmer.tsx          # Animated text effects
├── lib/
│   ├── cdp-auth.ts                  # JWT generation utilities
│   └── utils.ts                     # Helper functions
├── .env.example                     # Configuration template
└── package.json                     # Dependencies & scripts
```

### Key Features

- **Email/OTP Authentication**: Users sign in with email and verification code
- **Embedded Wallet Creation**: Automatic wallet generation for authenticated users  
- **Guest Checkout Flow**: Buy crypto without needing existing Coinbase account
- **Preset Amounts**: Quick selection buttons ($25, $50, $100, $250, $500)
- **Custom Amount Input**: Users can enter any amount between $5-$500
- **Glassmorphism UI**: Beautiful dark theme with frosted glass effects
- **Responsive Design**: Works perfectly on mobile and desktop

## 🔧 Setup Instructions

### 1. Get CDP Credentials

Visit [CDP Portal](https://portal.cdp.coinbase.com) and:

1. Create a new project
2. Get your **Project ID** from Embedded Wallets section
3. Generate **API Keys** (Key Name + Private Key)
4. Configure domains for CORS (important!)

### 2. Configure Environment

Copy `.env.example` to `.env` and add your credentials:

```env
# CDP Project ID for Embedded Wallets
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id-here

# CDP API Configuration for Onramp Session Tokens  
CDP_API_KEY_NAME=organizations/your-org-id/apiKeys/your-key-id
CDP_API_KEY_PRIVATE_KEY=your-base64-encoded-private-key-here

# Next.js Configuration
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Domain Configuration (Important!)

Configure your domains in CDP Portal or authentication will fail:

- **Embedded Wallets CORS**: https://portal.cdp.coinbase.com/products/embedded-wallets/cors
- **Onramp Domain**: https://portal.cdp.coinbase.com/products/onramp

Add both:
- `http://localhost:3000` (development)  
- `https://your-domain.com` (production)

## 🚀 Development

### Run the Development Server

```bash
cd your-project
npm install
npm run dev
```

Visit `http://localhost:3000` to see your guest checkout application.

### Key Components

#### Main Page (`app/page.tsx`)
The main UI with email authentication and onramp integration:

```typescript
export default function Home() {
  const [amount, setAmount] = useState(50)
  const currentUser = useCurrentUser()
  const evmAddress = useEvmAddress()
  
  const handleBuyUSDC = async () => {
    // Create session token and open onramp
    const response = await fetch('/api/onramp/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        evmAddress 
          ? { userAddress: evmAddress, assets: ['USDC'] }
          : { guestCheckout: true, assets: ['USDC'] }
      )
    })
    
    const { sessionToken } = await response.json()
    window.open(`https://pay.coinbase.com/buy/select-asset?sessionToken=${sessionToken}`)
  }
}
```

#### Session Token API (`app/api/onramp/session/route.ts`)
Secure server-side JWT generation:

```typescript
export async function POST(request: NextRequest) {
  const jwt = await generateJWT()
  
  const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })
  
  return NextResponse.json({ sessionToken: data.token })
}
```

## 💎 UI Components

### Button3D Component
Custom 3D button with hover effects:

```typescript
<Button3D
  onClick={handleAction}
  isLoading={loading}
  size="lg"
  className="w-full"
  style={{ background: 'linear-gradient(to bottom, #333333, #222222)' }}
>
  Buy ${amount} USDC
</Button3D>
```

### TextShimmer Component
Animated shimmer text effect:

```typescript
<TextShimmer 
  duration={3}
  className="text-xs [--base-color:#94a3b8] [--base-gradient-color:#ffffff]"
>
  Powered by Coinbase Developer Platform
</TextShimmer>
```

## 🔒 Security Features

- **Server-side JWT generation**: API keys never exposed to client
- **Session token authentication**: Secure onramp initialization
- **Input validation**: Proper amount and address validation  
- **CORS protection**: Domain-based access control
- **Environment variables**: Sensitive data properly configured

## 📊 Guest Checkout Limits

- **Minimum**: $5 per transaction
- **Maximum**: $500 per week per user
- **Geographic**: US residents only
- **Payment Methods**: Debit cards and Apple Pay
- **Assets**: USDC purchases (0% fees!)

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check CDP Project ID in environment variables
   - Ensure domains are configured in CDP Portal

2. **"Session token expired"**
   - Tokens expire after 5 minutes
   - Generate new token for each purchase

3. **"Guest checkout unavailable"**
   - Verify user is in the US
   - Check amount is between $5-$500
   - Ensure guest checkout is enabled for your CDP project

### Getting Help

- **Discord**: [CDP Discord](https://discord.com/invite/cdp) - #onramp channel
- **GitHub**: [Report issues](https://github.com/Must-be-Ash/onramp-demo/issues)
- **Documentation**: [CDP Developer Portal](https://portal.cdp.coinbase.com)

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Add environment variables in Vercel dashboard
# Update CDP Portal with your production domain
```

### Other Platforms

The generated Next.js app works with any platform supporting Node.js:
- Netlify
- Railway  
- AWS Amplify
- Self-hosted

## 📝 License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the Coinbase Developer Platform team