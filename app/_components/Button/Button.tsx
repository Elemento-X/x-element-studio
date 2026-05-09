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

  // Defense-in-depth against CWE-1022 (reverse tabnabbing): any caller that
  // passes target="_blank" gets rel="noreferrer" enforced, regardless of any
  // explicit rel they provided. Trade-off: callers needing a custom rel
  // alongside _blank must own both attributes themselves (currently nobody does).
  const { target, ...anchorRest } = rest as ComponentPropsWithoutRef<'a'>

  if (target === '_blank') {
    return (
      <a
        {...anchorRest}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
        {withArrow && <Arrow />}
      </a>
    )
  }

  return (
    // eslint-disable-next-line react/jsx-no-target-blank -- _blank handled above; this branch is provably non-blank.
    <a {...anchorRest} target={target} className={classes}>
      {children}
      {withArrow && <Arrow />}
    </a>
  )
}
