interface Props {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: Props) {
  return <div className={`skeleton${className ? ` ${className}` : ''}`} style={style} aria-hidden="true" />
}
