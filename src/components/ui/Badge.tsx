import React from 'react'

type BadgeVariant =
  | 'default'
  | 'blue'
  | 'green'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'gray'
  | 'purple'
  | 'cyan'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'xs' | 'sm'
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-500',
  purple: 'bg-purple-100 text-purple-700',
  cyan: 'bg-cyan-100 text-cyan-700',
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const sizeClass = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
