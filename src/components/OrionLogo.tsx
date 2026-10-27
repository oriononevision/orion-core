type MarkProps = {
  className?: string
  size?: number
  title?: string
}

/** Icône seule — étoile 4 branches + anneau orbital brisé */
export function OrionMark({ className, size = 28, title }: MarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M44.8 19.2 A18 18 0 0 1 44.8 44.8"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M19.2 44.8 A18 18 0 0 1 19.2 19.2"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M32 4
           C33.1 23.4 41.2 31.2 60 32
           C41.2 32.8 33.1 40.6 32 60
           C30.9 40.6 22.8 32.8 4 32
           C22.8 31.2 30.9 23.4 32 4Z"
        fill="currentColor"
      />
    </svg>
  )
}

type LogoProps = {
  className?: string
  markSize?: number
  showWordmark?: boolean
}

/** Logo complet — icône + wordmark ORION */
export function OrionLogo({
  className,
  markSize = 28,
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={`orion-logo${className ? ` ${className}` : ''}`}>
      <OrionMark size={markSize} />
      {showWordmark ? <span className="orion-logo__word">ORION</span> : null}
    </span>
  )
}

export default OrionLogo
