import type { ComponentPropsWithoutRef } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost'

type ButtonAsAnchorProps = ComponentPropsWithoutRef<'a'> & {
  as?: 'a'
  variant?: Variant
  withArrow?: boolean
}

type ButtonAsButtonProps = ComponentPropsWithoutRef<'button'> & {
  as: 'button'
  variant?: Variant
  withArrow?: boolean
}

type ButtonProps = ButtonAsAnchorProps | ButtonAsButtonProps

const Arrow = () => (
  <svg
    className={styles.arrow}
    viewBox="0 0 12 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M1 5h10M7 1l4 4-4 4" />
  </svg>
)

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    withArrow = false,
    children,
    className,
    ...rest
  } = props

  const classes = [
    styles.btn,
    variant === 'primary' ? styles.primary : styles.ghost,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (props.as === 'button') {
    return (
      <button
        {...(rest as ComponentPropsWithoutRef<'button'>)}
        className={classes}
      >
        {children}
        {withArrow && <Arrow />}
      </button>
    )
  }

  return (
    <a {...(rest as ComponentPropsWithoutRef<'a'>)} className={classes}>
      {children}
      {withArrow && <Arrow />}
    </a>
  )
}
