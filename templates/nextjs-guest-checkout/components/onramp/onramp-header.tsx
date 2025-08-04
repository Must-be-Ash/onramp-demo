interface OnrampHeaderProps {
  logoSrc?: string
  logoAlt?: string
  description?: string
}

export function OnrampHeader({ 
  logoSrc = "/logo.svg", 
  logoAlt = "Logo",
  description = "Embedded Wallets + Onramp demo"
}: OnrampHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <img 
          src={logoSrc} 
          alt={logoAlt} 
          className="h-12 w-auto"
        />
      </div>
      <p className="text-slate-300 text-sm">
        {description}
      </p>
    </div>
  )
}