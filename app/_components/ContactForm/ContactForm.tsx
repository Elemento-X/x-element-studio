'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  type Control,
  type FieldError,
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

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string }

const ERROR_NETWORK = 'Connection failed. Try again.'
const ERROR_RATE_LIMIT = 'Rate limit hit. Wait an hour.'
const ERROR_VALIDATION = 'Fix the fields marked invalid.'
const ERROR_DISABLED = 'Form is paused. Email contact@elemento-x.com.'
const ERROR_GENERIC =
  'Submit failed. Try again — or email contact@elemento-x.com.'

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
  const engagement = useWatch({ control, name: 'engagement' })
  if (engagement !== 'other') return null
  return (
    <div className={`${styles.field} ${styles.fieldEnter}`}>
      <label htmlFor="contact-other" className={styles.label}>
        Specify type
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
  const [state, setState] = useState<SubmitState>({ status: 'idle' })

  const {
    register,
    handleSubmit,
    control,
    reset,
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

  const onSubmit = async (data: ContactInput) => {
    setState({ status: 'submitting' })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

      let message: string = ERROR_GENERIC
      if (res.status === 429) message = ERROR_RATE_LIMIT
      else if (res.status === 400 && code === 'VALIDATION_ERROR')
        message = ERROR_VALIDATION
      else if (res.status === 503) message = ERROR_DISABLED

      setState({ status: 'error', message })
    } catch {
      setState({ status: 'error', message: ERROR_NETWORK })
    }
  }

  if (state.status === 'success') {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successEyebrow}>Brief received</span>
        <p className={styles.successBody}>
          Brief in. Response within 24 hours — yes, no, or how.
        </p>
      </div>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Contact form"
    >
      {/* Honeypot — visually hidden, off-screen, tab-skipped. Bots fill
          this; humans don't. Server returns silent 200 if tripped. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label>
          Leave this field empty
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
            Name
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
            Email
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
          Company <span className={styles.optional}>(optional)</span>
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
          Engagement
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
            Choose engagement
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
          Message
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
          One page. The system you want fixed. A measurable outcome.
        </span>
        {errors.message && (
          <span id="contact-message-error" className={styles.error}>
            {errors.message.message}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          as="button"
          type="submit"
          variant="primary"
          withArrow
          disabled={isSubmitting}
          className={styles.submitBone}
        >
          {isSubmitting ? 'Sending…' : 'Send brief'}
        </Button>
        {state.status === 'error' && (
          <span
            className={styles.errorBanner}
            role="alert"
            aria-live="assertive"
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  )
}
