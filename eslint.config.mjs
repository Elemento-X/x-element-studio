import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: [
      'docs/**',
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'playwright/.cache/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/jsx-no-target-blank': [
        'error',
        { enforceDynamicLinks: 'always', warnOnSpreadAttributes: true },
      ],
      // CI gate against XSS regression. The middleware CSP runs without
      // a nonce on script-src (Next 16 + Turbopack incompatibility — see
      // middleware.ts), so `dangerouslySetInnerHTML` would amplify any
      // XSS into RCE-level execution. Block at lint time, not at PR
      // review time. See @security audit 2026-05-10 for context.
      'react/no-danger': 'error',
    },
  },
]

export default eslintConfig
