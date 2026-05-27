import type { ReactNode } from 'react'

interface HeaderProps {
  className?: string
  title?: string | ReactNode
  leftContent?: ReactNode
  rightContent?: ReactNode
}

export default function Header({ className, title, leftContent, rightContent }: HeaderProps) {
  return (
    <header className={`header${className ? ` ${className}` : ''}`}>
      <div className="header__top">
        <div className="header__left">{leftContent}</div>
        {title && <div className="header__title">{title}</div>}
        <div className="header__right">{rightContent}</div>
      </div>
    </header>
  )
}
