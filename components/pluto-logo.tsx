interface PlutoLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function PlutoLogo({ className = "", size = "md", showText = true }: PlutoLogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-xl" },
    md: { icon: 48, text: "text-2xl" },
    lg: { icon: 64, text: "text-4xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Planet Circle with gradient */}
        <defs>
          <linearGradient id="planetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Planet Ring (behind planet) */}
        <ellipse
          cx="32"
          cy="34"
          rx="28"
          ry="8"
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="2.5"
          opacity="0.6"
        />
        
        {/* Planet Body */}
        <circle cx="32" cy="32" r="18" fill="url(#planetGradient)" />
        
        {/* Planet Highlight */}
        <ellipse cx="26" cy="26" rx="6" ry="5" fill="white" opacity="0.25" />
        
        {/* ECG Line across planet */}
        <path
          d="M14 32 L22 32 L24 28 L26 36 L28 24 L30 40 L32 32 L34 32 L36 28 L38 36 L40 32 L50 32"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Small stars/dots */}
        <circle cx="8" cy="12" r="1.5" fill="#3B82F6" opacity="0.6" />
        <circle cx="56" cy="16" r="1" fill="#10B981" opacity="0.6" />
        <circle cx="52" cy="52" r="1.5" fill="#06B6D4" opacity="0.5" />
        <circle cx="12" cy="48" r="1" fill="#3B82F6" opacity="0.5" />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} text-foreground tracking-tight`}>
          Pluto
        </span>
      )}
    </div>
  )
}
