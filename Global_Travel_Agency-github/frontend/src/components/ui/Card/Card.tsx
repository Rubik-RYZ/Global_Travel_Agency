import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-parchment-border bg-surface-container-lowest p-6 shadow-paper ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
