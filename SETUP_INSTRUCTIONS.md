# CDP Onramp Complete Setup Instructions

## 🚀 Quick Start

This guide will help you set up CDP Onramp with Embedded Wallets integration for a complete Web3 onboarding experience.

## Prerequisites

- Node.js 18+ (Node.js 21 is NOT supported)
- A Coinbase Developer Platform account
- Basic knowledge of Next.js and React

## Step 1: Install the Package

```bash
 
cdp-onramp
```

Choose your integration type:
- **Next.js Basic Onramp**: Simple onramp with embedded wallet
- **Next.js Guest Checkout**: Guest checkout + embedded wallet
- **React Component**: Reusable components only
- **Documentation Only**: Just the docs

## Step 2: CDP Portal Setup

### 2.1 Create CDP Project

1. Visit [CDP Portal](https://portal.cdp.coinbase.com)
2. Create a new project or select existing
3. Note your **Project ID** from the dashboard

### 2.2 Generate API Credentials

1. Go to API Keys section
2. Click "Create API Key"
3. Copy your:
   - **API Key Name** (format: `your-key-name-here`)
   - **Private Key** (base64 encoded string)

### 2.3 Configure CORS (CRITICAL)

1. Go to [Embedded Wallets CORS Settings](https://portal.cdp.coinbase.com/products/embedded-wallets/cors)
2. Add your origins:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Save changes (takes effect immediately)

**Without CORS configuration, embedded wallets will NOT work!**

## Step 3: Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# CDP Project ID for Embedded Wallets
NEXT_PUBLIC_CDP_PROJECT_ID=your-actual-project-id

# CDP API Configuration for Onramp Session Tokens
CDP_API_KEY_NAME=your-actual-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-actual-base64-private-key

# Next.js Configuration
NEXTAUTH_SECRET=generate-a-random-32-character-string
NEXTAUTH_URL=http://localhost:3000
```

### Finding Your Credentials

#### Project ID
1. CDP Portal → Dashboard
2. Copy the Project ID shown at the top

#### API Key Name & Private Key
1. CDP Portal → API Keys
2. Create new key if needed
3. Copy both the name and the base64-encoded private key

**Example formats:**
```env
# ✅ Correct API Key Name format
CDP_API_KEY_NAME=my-api-key-name

# ✅ Correct Private Key format (base64)
CDP_API_KEY_PRIVATE_KEY=OXusYW9IfpUotUV4h8yLi5lAfjMBCFMa8f+ncFB9TPTiVFnSnpCXwkI6i4BcmhVxIOYDNqO7hjVI02ji0aPM2w==

# ✅ Alternative PEM format (older keys)
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIExample...
-----END EC PRIVATE KEY-----"
```

## Step 4: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14.2.31
- CDP React components
- CDP Hooks
- Required UI components
- JWT and validation libraries

## Step 5: Start Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your integration!

## Step 6: Test the Flow

### 6.1 Connect Embedded Wallet
1. Click "Connect Wallet" button
2. Enter your email address
3. Check email for OTP code
4. Enter OTP to complete wallet creation
5. Your wallet address will appear

### 6.2 Test Onramp Purchase
1. Configure purchase amount ($5-$500 for guest checkout)
2. Select asset (USDC recommended for 0% fees)
3. Click "Buy Crypto" button
4. Session token generates automatically
5. Coinbase Onramp opens with your wallet pre-filled
6. Complete purchase flow

## Troubleshooting

### Common Issues

#### 1. Embedded Wallet Won't Load
**Symptom**: Wallet auth button doesn't appear or errors
**Solution**: 
- ✅ Check CORS configuration at CDP Portal
- ✅ Verify `NEXT_PUBLIC_CDP_PROJECT_ID` is correct
- ✅ Ensure you're using `http://localhost:3000` exactly

#### 2. Session Token Fails
**Symptom**: "Failed to create session token" error
**Solution**:
- ✅ Check `CDP_API_KEY_NAME` format
- ✅ Verify `CDP_API_KEY_PRIVATE_KEY` is base64 encoded
- ✅ Ensure wallet is connected first

#### 3. Wallet Address Validation Error
**Symptom**: "Invalid wallet address" in console
**Solution**:
- ✅ Connect wallet first before trying onramp
- ✅ Check that wallet connection completed successfully

#### 4. OTP Email Not Received
**Solution**:
- ✅ Check spam folder
- ✅ Ensure email is valid
- ✅ Try different email if needed
- ✅ Check CDP Portal for any restrictions

### Debug Mode

Enable debugging in development:

```typescript
// components/cdp-provider.tsx
const cdpConfig = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID!,
  debugging: true, // Enable for development
  // ... other config
};
```

### Console Debugging

Check browser console for detailed error messages:
- CDP authentication errors
- Wallet connection issues
- Session token problems

## Production Deployment

### Environment Variables

Set these in your deployment platform:

```env
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id
CDP_API_KEY_NAME=your-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
```

### CORS Update

Add your production domain to CDP CORS settings:
```
https://yourdomain.com
```

### Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] API keys rotated if exposed
- [ ] Error handling implemented
- [ ] Loading states added

## Example User Flow

1. **User visits your app**
2. **User clicks "Connect Wallet"**
3. **User enters email for embedded wallet**
4. **User receives and enters OTP**
5. **Wallet is created and connected**
6. **User configures purchase amount**
7. **User clicks "Buy Crypto"**
8. **Session token generated server-side**
9. **Coinbase Onramp opens with wallet pre-filled**
10. **User completes purchase (guest checkout or Coinbase account)**
11. **Crypto delivered to embedded wallet**

## Advanced Configuration

### Custom Themes

```typescript
// components/cdp-provider.tsx
const theme: Theme = {
  primaryColor: '#0052FF',
  borderRadius: '8px',
  // ... other theme options
};

<CDPReactProvider config={cdpConfig} app={appConfig} theme={theme}>
```

### Multiple Networks

```typescript
// Support multiple blockchains
const sessionToken = await fetch('/api/onramp/session', {
  method: 'POST',
  body: JSON.stringify({
    addresses: [{
      address: walletAddress,
      blockchains: ['base', 'ethereum', 'polygon']
    }],
    assets: ['USDC', 'ETH']
  })
})
```

### Guest Checkout Limits

- **Minimum**: $5 per transaction
- **Maximum**: $500 per week
- **Geographic**: US residents only
- **Payment**: Debit cards and Apple Pay

## Support Resources

- **Documentation**: Check included `docs/` folder
- **CDP Discord**: [#onramp channel](https://discord.com/invite/cdp)
- **CDP Portal Help**: Built-in support chat
- **GitHub Issues**: Report package issues

## Success Indicators

✅ Embedded wallet connects successfully  
✅ Wallet address shows in UI  
✅ Session token generates without errors  
✅ Onramp opens with correct wallet address  
✅ Purchase flow completes end-to-end  

Your CDP Onramp integration is now ready for production! 🎉