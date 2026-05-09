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
    },
  },
]

export default eslintConfig
