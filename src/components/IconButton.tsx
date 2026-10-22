import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

/** Square button whose accessible name comes from `label`. */
export function IconButton({ label, children, className = '', ...rest }: IconButtonProps) {
  return (
    <button type="button" className={`lt-icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
