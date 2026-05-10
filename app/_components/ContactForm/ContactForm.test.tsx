/**
 * @owner: @tester (Maclean)
 *
 * ContactForm component tests — DOM behavior under jsdom + RTL +
 * userEvent. We test the *user-visible* contract, not implementation:
 *
 *   - Renders all required fields with correct labels and aria-*
 *   - "Specify type" field shows up only when engagement === 'other'
 *     (the EngagementOtherField subcomponent's useWatch wiring)
 *   - Form submission invokes fetch with the correct envelope and a
 *     valid JSON body
 *   - Success state: replaces the form with the brief-received block
 *   - Error mapping by status/code:
 *       429 → ERROR_RATE_LIMIT
 *       400 + VALIDATION_ERROR → ERROR_VALIDATION
 *       503 → ERROR_DISABLED
 *       fetch throws → ERROR_NETWORK
 *   - Submit button shows "Sending…" while in flight (disabled state)
 *   - Honeypot field is in the DOM but visually hidden (aria-hidden)
 *
 * Determinism: fetch is mocked. No clock dependency. RTL cleanup runs
 * automatically via vitest.setup.tsx.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './ContactForm'

const validForm = {
  name: 'Maclean',
  email: 'maclean@example.com',
  message: 'A real-world brief that meets the 20-character minimum easily.',
}

function makeFetchOk() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: { ok: true } }),
  })
}

function makeFetchError(status: number, code?: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => (code ? { error: { code } } : {}),
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', makeFetchOk())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name$/i), validForm.name)
  await user.type(screen.getByLabelText(/^email$/i), validForm.email)
  await user.selectOptions(screen.getByLabelText(/engagement$/i), 'new-project')
  await user.type(screen.getByLabelText(/^message$/i), validForm.message)
}

describe('ContactForm — render', () => {
  it('renders all required fields with accessible labels', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/engagement$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^message$/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /send brief/i }),
    ).toBeInTheDocument()
  })

  it('hides the honeypot field via aria-hidden', () => {
    const { container } = render(<ContactForm />)
    const honeypotWrap = container.querySelector('[aria-hidden="true"]')
    expect(honeypotWrap).toBeTruthy()
    // The hidden input is inside the wrap
    const hiddenInput = honeypotWrap?.querySelector('input')
    expect(hiddenInput).toBeTruthy()
    expect(hiddenInput?.getAttribute('tabindex')).toBe('-1')
  })

  it('does NOT show "Specify type" until engagement is "other"', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    expect(screen.queryByLabelText(/specify type/i)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/engagement$/i), 'other')
    expect(await screen.findByLabelText(/specify type/i)).toBeInTheDocument()
  })
})

describe('ContactForm — submission', () => {
  it('POSTs JSON to /api/contact and shows the brief-received state on 200', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: /send brief/i }))

    await waitFor(() =>
      expect(screen.getByText(/brief received/i)).toBeInTheDocument(),
    )
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (fetch as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/contact')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(body.name).toBe(validForm.name)
    expect(body.email).toBe(validForm.email)
    expect(body.engagement).toBe('new-project')
    expect(body.message).toBe(validForm.message)
  })

  it('shows the rate-limit error on 429', async () => {
    vi.stubGlobal('fetch', makeFetchError(429, 'RATE_LIMITED'))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /send brief/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/rate limit/i),
    )
  })

  it('shows the validation error message on 400 + VALIDATION_ERROR', async () => {
    vi.stubGlobal('fetch', makeFetchError(400, 'VALIDATION_ERROR'))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /send brief/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /fix the fields marked invalid/i,
      ),
    )
  })

  it('shows the disabled message on 503', async () => {
    vi.stubGlobal('fetch', makeFetchError(503, 'DISABLED'))
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /send brief/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/form is paused/i),
    )
  })

  it('shows the network error when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /send brief/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/connection failed/i),
    )
  })
})

describe('ContactForm — submitting state', () => {
  it('shows "Sending…" and disables the submit button while in flight', async () => {
    let resolve!: (value: unknown) => void
    const pending = new Promise((r) => {
      resolve = r
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValueOnce(
        pending.then(() => ({
          ok: true,
          status: 200,
          json: async () => ({ data: { ok: true } }),
        })),
      ),
    )

    const user = userEvent.setup()
    render(<ContactForm />)
    await fillRequired(user)
    await user.click(screen.getByRole('button', { name: /send brief/i }))

    // While in flight, the button shows "Sending…" and is disabled
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled(),
    )

    resolve(undefined)
    await waitFor(() =>
      expect(screen.getByText(/brief received/i)).toBeInTheDocument(),
    )
  })
})
