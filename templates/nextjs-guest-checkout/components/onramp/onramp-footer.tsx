import { TextShimmer } from '@/components/ui/text-shimmer'

interface OnrampFooterProps {
  text?: string
  href?: string
  className?: string
}

export function OnrampFooter({ 
  text = "Powered by Coinbase Developer Platform",
  href = "https://portal.cdp.coinbase.com/",
  className = ""
}: OnrampFooterProps) {
  return (
    <div className={`text-center mt-6 ${className}`}>
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block cursor-pointer hover:scale-105 transition-transform duration-200"
      >
        <TextShimmer 
          duration={3}
          className="text-xs [--base-color:#94a3b8] [--base-gradient-color:#ffffff] dark:[--base-color:#64748b] dark:[--base-gradient-color:#f8fafc]"
        >
          {text}
        </TextShimmer>
      </a>
    </div>
  )
}