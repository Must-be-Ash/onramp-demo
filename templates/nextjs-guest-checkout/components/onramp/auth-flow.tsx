import { Button3D } from '@/components/button-3d'

interface AuthFlowProps {
  authStep: 'email' | 'otp'
  email: string
  otp: string
  authLoading: boolean
  onEmailChange: (email: string) => void
  onOtpChange: (otp: string) => void
  onEmailSubmit: () => void
  onOtpSubmit: () => void
  onBackToEmail: () => void
}

export function AuthFlow({
  authStep,
  email,
  otp,
  authLoading,
  onEmailChange,
  onOtpChange,
  onEmailSubmit,
  onOtpSubmit,
  onBackToEmail
}: AuthFlowProps) {
  if (authStep === 'email') {
    return (
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
        />
        <Button3D
          onClick={onEmailSubmit}
          disabled={!email.trim() || authLoading}
          isLoading={authLoading}
          size="lg"
          className="w-full text-lg font-semibold"
          style={{
            background: 'linear-gradient(to bottom, #333333, #222222)',
          }}
        >
          {authLoading ? 'Sending...' : 'Sign In'}
        </Button3D>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-white text-sm text-center">
        Check your email for the verification code
      </p>
      <input
        type="text"
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent text-center text-2xl tracking-widest"
        maxLength={6}
      />
      <Button3D
        onClick={onOtpSubmit}
        disabled={otp.length !== 6 || authLoading}
        isLoading={authLoading}
        size="lg"
        className="w-full text-lg font-semibold"
        style={{
          background: 'linear-gradient(to bottom, #333333, #222222)',
        }}
      >
        {authLoading ? 'Verifying...' : 'Verify Code'}
      </Button3D>
      <button
        onClick={onBackToEmail}
        className="w-full text-slate-400 hover:text-slate-300 transition-colors text-sm"
      >
        Back to email
      </button>
    </div>
  )
}