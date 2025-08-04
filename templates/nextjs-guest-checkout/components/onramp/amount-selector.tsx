import { DollarSign } from 'lucide-react'

interface AmountSelectorProps {
  amount: number
  onAmountChange: (amount: number) => void
  presetAmounts?: number[]
  minAmount?: number
  maxAmount?: number
}

export function AmountSelector({ 
  amount, 
  onAmountChange, 
  presetAmounts = [25, 50, 100, 250, 500],
  minAmount = 5,
  maxAmount = 500
}: AmountSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-white font-medium mb-3 flex items-center gap-2">
        <DollarSign size={18} />
        Select Amount (USD)
      </label>
      
      {/* Preset Amounts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {presetAmounts.map((preset) => (
          <button
            key={preset}
            onClick={() => onAmountChange(preset)}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              amount === preset
                ? 'bg-white text-slate-900 shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>

      {/* Custom Amount Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">$</span>
        <input
          type="number"
          min={minAmount}
          max={maxAmount}
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
          className="w-full pl-8 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
          placeholder="Custom amount"
        />
      </div>
      
      <p className="text-slate-400 text-xs mt-2">
        Min: ${minAmount} • Max: ${maxAmount} per week • 0% fees on USDC
      </p>
    </div>
  )
}