import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'light' | 'dark' | 'primary'
  hover?: boolean
  glow?: boolean
  float?: boolean
  onClick?: () => void
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
  float = false,
  onClick
}) => {
  const baseClasses = 'card-glass'
  const variantClasses = {
    default: '',
    light: 'glass-light',
    dark: 'glass-dark',
    primary: 'glass-primary'
  }

  const animationClasses = [
    glow && 'pulse-glow',
    float && 'float-animation'
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        hover && 'hover:transform hover:scale-105',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface GlassButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'accent' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'glass',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  href
}) => {
  const baseClasses = 'btn-glass'
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    accent: 'btn-accent',
    glass: ''
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )

  if (href) {
    return (
      <a href={href} className={classes} style={{ textDecoration: 'none' }}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  )
}

interface GlassInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  className?: string
  disabled?: boolean
}

export const GlassInput: React.FC<GlassInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className,
  disabled = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn('input-glass', className)}
    />
  )
}

interface GlassNavProps {
  children: React.ReactNode
  className?: string
}

export const GlassNav: React.FC<GlassNavProps> = ({
  children,
  className
}) => {
  return (
    <nav className={cn('nav-glass', className)}>
      {children}
    </nav>
  )
}

interface LoadingGlassProps {
  message?: string
  className?: string
}

export const LoadingGlass: React.FC<LoadingGlassProps> = ({
  message = '加载中...',
  className
}) => {
  return (
    <div className={cn('loading-glass', className)}>
      <div className="spinner-glass"></div>
      <p>{message}</p>
    </div>
  )
}

interface GlassContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
  padding = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      'mx-auto',
      maxWidthClasses[maxWidth],
      padding && 'px-4 py-8',
      className
    )}>
      {children}
    </div>
  )
}
