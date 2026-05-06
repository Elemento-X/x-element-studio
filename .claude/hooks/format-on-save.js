const { execSync } = require('child_process')
const { existsSync } = require('fs')
const parseInput = require('./parse-hook-input')

const JS_EXTENSIONS = /\.(ts|tsx|js|jsx|json|css)$/
const PY_EXTENSIONS = /\.py$/

parseInput().then(({ filePath }) => {
  if (!filePath) process.exit(0)

  try {
    if (JS_EXTENSIONS.test(filePath)) {
      if (
        !existsSync('node_modules/.bin/prettier') &&
        !existsSync('node_modules/.bin/prettier.cmd')
      ) {
        process.exit(0)
      }
      execSync(`npx --no-install prettier --write ${JSON.stringify(filePath)}`, {
        stdio: 'ignore',
        timeout: 10000,
      })
    } else if (PY_EXTENSIONS.test(filePath)) {
      // Detect available Python formatter: ruff > black > skip
      try {
        execSync('ruff --version', { stdio: 'ignore' })
        execSync(`ruff format ${JSON.stringify(filePath)}`, { stdio: 'ignore', timeout: 10000 })
      } catch {
        try {
          execSync('black --version', { stdio: 'ignore' })
          execSync(`black --quiet ${JSON.stringify(filePath)}`, { stdio: 'ignore', timeout: 10000 })
        } catch {
          // No Python formatter available — skip silently
        }
      }
    }
  } catch (err) {
    process.stderr.write(`Formatter falhou em ${filePath}: ${err.message || 'erro desconhecido'}.`)
  }

  process.exit(0)
})
