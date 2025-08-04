import { LogOut } from 'lucide-react'
import { Button3D } from '@/components/button-3d'

interface OnrampButtonProps {
  amount: number
  isLoading: boolean
  minAmount?: number
  maxAmount?: number
  onBuyUSDC: () => void
  onSignOut: () => void
}

export function OnrampButton({
  amount,
  isLoading,
  minAmount = 5,
  maxAmount = 500,
  onBuyUSDC,
  onSignOut
}: OnrampButtonProps) {
  return (
    <div className="space-y-3">
      <Button3D
        onClick={onBuyUSDC}
        disabled={amount < minAmount || amount > maxAmount}
        isLoading={isLoading}
        size="lg"
        className="w-full text-lg font-semibold"
        style={{
          background: 'linear-gradient(to bottom, #333333, #222222)',
        }}
      >
        {isLoading ? 'Processing...' : `Buy $${amount} USDC`}
      </Button3D>
      
      <button
        onClick={onSignOut}
        className="w-full text-slate-400 hover:text-slate-300 transition-colors text-xs flex items-center justify-center gap-1"
      >
        <LogOut size={12} />
        Sign Out
      </button>
    </div>
  )
}