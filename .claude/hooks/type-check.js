const { execSync } = require('child_process')
const { existsSync } = require('fs')
const parseInput = require('./parse-hook-input')

parseInput().then(({ filePath }) => {
  if (!filePath) process.exit(0)

  const normalized = filePath.replace(/\\/g, '/')
  if (
    !normalized.includes('/src/') &&
    !normalized.includes('/app/') &&
    !normalized.includes('/lib/')
  ) {
    process.exit(0)
  }

  try {
    if (/\.(ts|tsx)$/.test(filePath) && existsSync('tsconfig.json')) {
      if (!existsSync('node_modules/.bin/tsc') && !existsSync('node_modules/.bin/tsc.cmd')) {
        process.exit(0)
      }
      // TypeScript
      try {
        execSync('npx --no-install tsc --noEmit --pretty 2>&1', {
          encoding: 'utf8',
          timeout: 30000,
          stdio: 'pipe',
        })
      } catch (err) {
        const output = (err.stdout || '').trim()
        if (output) {
          const relevantLines = output
            .split('\n')
            .filter(
              (line) => line.includes(filePath.replace(/\\/g, '/')) || line.includes(filePath),
            )
            .join('\n')

          if (relevantLines) {
            process.stderr.write(`TypeScript errors em ${filePath}:\n${relevantLines}`)
          } else {
            process.stderr.write(
              `TypeScript errors no projeto (não necessariamente neste arquivo). Rode 'npx tsc --noEmit' para ver todos.`,
            )
          }
        }
      }
    } else if (/\.py$/.test(filePath)) {
      // Python type check: mypy > pyright > skip
      let typeCmd = null
      try {
        execSync('mypy --version', { stdio: 'ignore' })
        typeCmd = `mypy --no-error-summary ${JSON.stringify(filePath)}`
      } catch {
        try {
          execSync('pyright --version', { stdio: 'ignore' })
          typeCmd = `pyright ${JSON.stringify(filePath)}`
        } catch {
          // No Python type checker available
        }
      }

      if (typeCmd) {
        try {
          execSync(`${typeCmd} 2>&1`, { encoding: 'utf8', timeout: 30000, stdio: 'pipe' })
        } catch (err) {
          const output = (err.stdout || '').trim()
          if (output) {
            process.stderr.write(`Type errors em ${filePath}:\n${output}`)
          }
        }
      }
    }
  } catch {}

  // Non-blocking — type errors are warnings
  process.exit(0)
})
