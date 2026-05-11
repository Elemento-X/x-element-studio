'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  type Control,
  type FieldError,
  type FieldErrors,
  type UseFormRegister,
  useForm,
  useWatch,
} from 'react-hook-form'
import {
  type ContactInput,
  contactSchema,
  ENGAGEMENT_OPTIONS,
} from '@/lib/contact/schema'
import { Button } from '../Button/Button'
import styles from './ContactForm.module.css'

// Public — Next inlines this at build time when prefixed NEXT_PUBLIC_*.
// Empty string = Turnstile disabled (graceful degrade per the env contract).
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; messageKey: ErrorKey }

type ErrorKey = 'network' | 'rateLimit' | 'validation' | 'disabled' | 'generic'

// Isolated subcomponent for the conditional "Engagement detail" field.
// Calling useWatch here (instead of `watch()` in the parent) keeps the
// invalidation scoped to this subtree — the parent's render output
// stays memoizable by the React Compiler. Lint warning
// (react-hooks/incompatible-library) goes away as a side effect.
interface EngagementOtherFieldProps {
  control: Control<ContactInput>
  register: UseFormRegister<ContactInput>
  error?: FieldError
  disabled: boolean
}

function EngagementOtherField({
  control,
  register,
  error,
  disabled,
}: EngagementOtherFieldProps) {
  const t = useTranslations('contactForm.fields')
  const engagement = useWatch({ control, name: 'engagement' })
  if (engagement !== 'other') return null
  return (
    <div className={`${styles.field} ${styles.fieldEnter}`}>
      <label htmlFor="contact-other" className={styles.label}>
        {t('engagementOther')}
      </label>
      <input
        id="contact-other"
        type="text"
        className={styles.input}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'contact-other-error' : undefined}
        disabled={disabled}
        {...register('engagementOther')}
      />
      {error && (
        <span id="contact-other-error" className={styles.error}>
          {error.message}
        </span>
      )}
    </div>
  )
}

export function ContactForm() {
  const t = useTranslations('contactForm')
  const tFields = useTranslations('contactForm.fields')
  const tSubmit = useTranslations('contactForm.submit')
  const tErrors = useTranslations('contactForm.errors')
  const tSuccess = useTranslations('contactForm.success')

  const [state, setState] = useState<SubmitState>({ status: 'idle' })
  // Token from Cloudflare Turnstile widget callback. Only attached to
  // the submit body when Turnstile is enabled (TURNSTILE_SITE_KEY set).
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      company: '',
      engagementOther: '',
      message: '',
      honeypot: '',
    },
  })

  // When the form fails validation on submit, RHF marks fields as
  // aria-invalid but doesn't programmatically focus the first error.
  // Keyboard / screen-reader users would have to tab back manually to
  // find the failure. Focus the first errored field in DOM order so
  // the user lands directly on what they need to fix.
  const FIELD_ORDER: Array<keyof ContactInput> = [
    'name',
    'email',
    'company',
    'engagement',
    'engagementOther',
    'message',
  ]
  const onInvalid = (formErrors: FieldErrors<ContactInput>) => {
    const first = FIELD_ORDER.find((f) => formErrors[f])
    if (first) setFocus(first)
  }

  const onSubmit = async (data: ContactInput) => {
    setState({ status: 'submitting' })
    try {
      // Attach Turnstile token (if any) to the submit body. The server
      // only enforces it when both keys are configured; sending it
      // unconditionally is safe and keeps the client code simple.
      const payload = TURNSTILE_SITE_KEY ? { ...data, turnstileToken } : data

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        reset()
        setState({ status: 'success' })
        return
      }

      const body = (await res.json().catch(() => ({}))) as {
        error?: { code?: string }
      }
      const code = body.error?.code

      let messageKey: ErrorKey = 'generic'
      if (res.status === 429) messageKey = 'rateLimit'
      else if (res.status === 400 && code === 'VALIDATION_ERROR')
        messageKey = 'validation'
      else if (res.status === 503) messageKey = 'disabled'

      setState({ status: 'error', messageKey })
    } catch {
      setState({ status: 'error', messageKey: 'network' })
    }
  }

  if (state.status === 'success') {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successEyebrow}>{tSuccess('eyebrow')}</span>
        <p className={styles.successBody}>{tSuccess('body')}</p>
      </div>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      aria-label={t('ariaLabel')}
    >
      {/* Honeypot — visually hidden, off-screen, tab-skipped. Bots fill
          this; humans don't. Server returns silent 200 if tripped. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label>
          {t('honeypotLabel')}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('honeypot')}
          />
        </label>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="contact-name" className={styles.label}>
            {tFields('name')}
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className={styles.input}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            disabled={isSubmitting}
            {...register('name')}
          />
          {errors.name && (
            <span id="contact-name-error" className={styles.error}>
              {errors.name.message}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-email" className={styles.label}>
            {tFields('email')}
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={styles.input}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            disabled={isSubmitting}
            {...register('email')}
          />
          {errors.email && (
            <span id="contact-email-error" className={styles.error}>
              {errors.email.message}
            </span>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-company" className={styles.label}>
          {tFields('company')}{' '}
          <span className={styles.optional}>{tFields('companyOptional')}</span>
        </label>
        <input
          id="contact-company"
          type="text"
          autoComplete="organization"
          className={styles.input}
          aria-invalid={errors.company ? 'true' : 'false'}
          aria-describedby={
            errors.company ? 'contact-company-error' : undefined
          }
          disabled={isSubmitting}
          {...register('company')}
        />
        {errors.company && (
          <span id="contact-company-error" className={styles.error}>
            {errors.company.message}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-engagement" className={styles.label}>
          {tFields('engagement')}
        </label>
        <select
          id="contact-engagement"
          className={styles.select}
          aria-invalid={errors.engagement ? 'true' : 'false'}
          aria-describedby={
            errors.engagement ? 'contact-engagement-error' : undefined
          }
          defaultValue=""
          disabled={isSubmitting}
          {...register('engagement')}
        >
          <option value="" disabled>
            {tFields('engagementPlaceholder')}
          </option>
          {ENGAGEMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.engagement && (
          <span id="contact-engagement-error" className={styles.error}>
            {errors.engagement.message}
          </span>
        )}
      </div>

      <EngagementOtherField
        control={control}
        register={register}
        error={errors.engagementOther}
        disabled={isSubmitting}
      />

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>
          {tFields('message')}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className={styles.textarea}
          aria-invalid={errors.message ? 'true' : 'false'}
          aria-describedby={
            errors.message ? 'contact-message-error' : 'contact-message-help'
          }
          disabled={isSubmitting}
          {...register('message')}
        />
        <span id="contact-message-help" className={styles.help}>
          {tFields('messageHelp')}
        </span>
        {errors.message && (
          <span id="contact-message-error" className={styles.error}>
            {errors.message.message}
          </span>
        )}
      </div>

      {TURNSTILE_SITE_KEY && (
        <div className={styles.turnstile}>
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken('')}
            onError={() => setTurnstileToken('')}
            options={{ theme: 'dark', size: 'flexible' }}
          />
        </div>
      )}

      <div className={styles.actions}>
        <Button
          as="button"
          type="submit"
          variant="primary"
          withArrow
          disabled={
            isSubmitting || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
          }
          className={styles.submitBone}
        >
          {isSubmitting ? tSubmit('submitting') : tSubmit('idle')}
        </Button>
        {state.status === 'error' && (
          <span
            className={styles.errorBanner}
            role="alert"
            aria-live="assertive"
          >
            {tErrors(state.messageKey)}
          </span>
        )}
      </div>
    </form>
  )
}
