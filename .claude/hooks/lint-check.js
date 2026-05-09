const { execSync } = require('child_process')
const parseInput = require('./parse-hook-input')

const JS_EXTENSIONS = /\.(ts|tsx|js|jsx)$/
const PY_EXTENSIONS = /\.py$/

parseInput().then(({ filePath }) => {
  if (!filePath) process.exit(0)

  const normalized = filePath.replace(/\\/g, '/')

  // Skip config/hook files
  if (
    !normalized.includes('/src/') &&
    !normalized.includes('/app/') &&
    !normalized.includes('/lib/') &&
    !normalized.includes('/components/') &&
    !normalized.includes('/hooks/') &&
    !normalized.includes('/utils/')
  ) {
    process.exit(0)
  }

  try {
    if (JS_EXTENSIONS.test(filePath)) {
      // Only run if eslint is locally installed; skip otherwise (avoids npx
      // pulling latest ESLint v10 which requires flat config).
      const { existsSync } = require('fs')
      if (
        !existsSync('node_modules/.bin/eslint') &&
        !existsSync('node_modules/.bin/eslint.cmd')
      ) {
        process.exit(0)
      }
      try {
        const result = execSync(
          `npx --no-install eslint --no-error-on-unmatched-pattern ${JSON.stringify(filePath)} 2>&1`,
          { encoding: 'utf8', timeout: 15000 },
        )
        if (result.trim()) {
          process.stderr.write(
            `Lint warnings em ${filePath}:\n${result.trim()}`,
          )
        }
      } catch (err) {
        const output = (err.stdout || '').trim()
        if (output) {
          process.stderr.write(
            `Lint errors em ${filePath}:\n${output}\n\nCorrija antes de continuar.`,
          )
          process.exit(2)
        }
      }
    } else if (PY_EXTENSIONS.test(filePath)) {
      // Detect available Python linter: ruff > flake8 > skip
      let lintCmd = null
      try {
        execSync('ruff --version', { stdio: 'ignore' })
        lintCmd = `ruff check ${JSON.stringify(filePath)}`
      } catch {
        try {
          execSync('flake8 --version', { stdio: 'ignore' })
          lintCmd = `flake8 ${JSON.stringify(filePath)}`
        } catch {
          // No Python linter available
        }
      }

      if (lintCmd) {
        try {
          const result = execSync(`${lintCmd} 2>&1`, {
            encoding: 'utf8',
            timeout: 15000,
          })
          if (result.trim()) {
            process.stderr.write(
              `Lint warnings em ${filePath}:\n${result.trim()}`,
            )
          }
        } catch (err) {
          const output = (err.stdout || err.stderr || '').trim()
          if (output) {
            process.stderr.write(
              `Lint errors em ${filePath}:\n${output}\n\nCorrija antes de continuar.`,
            )
            process.exit(2)
          }
        }
      }
    }
  } catch {}

  process.exit(0)
})
