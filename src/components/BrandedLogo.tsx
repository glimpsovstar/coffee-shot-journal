interface BrandedLogoProps {
  variant: 'horizontal' | 'stacked';
  className?: string;
}

const LOGO_SRC = {
  horizontal: '/branding/logo_horizontal.svg',
  stacked: '/branding/logo_stacked.svg',
} as const;

export function BrandedLogo({ variant, className }: BrandedLogoProps) {
  return (
    <img
      src={LOGO_SRC[variant]}
      alt="coffee snob."
      className={className ?? `branded-logo branded-logo--${variant}`}
    />
  );
}
