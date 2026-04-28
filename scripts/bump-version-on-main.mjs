import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function getHeadPackageVersion() {
  try {
    const headPackageJson = run('git', ['show', 'HEAD:package.json'])
    return JSON.parse(headPackageJson).version
  } catch {
    return null
  }
}

function getWorkingPackageVersion() {
  const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  return JSON.parse(packageJson).version
}

function main() {
  if (process.env.SKIP_LOCAL_VERSION_BUMP === '1') {
    return
  }

  const branchName = run('git', ['branch', '--show-current'])

  if (branchName !== 'main') {
    return
  }

  const headVersion = getHeadPackageVersion()
  const workingVersion = getWorkingPackageVersion()

  if (headVersion !== null && workingVersion !== headVersion) {
    return
  }

  execFileSync('npm', ['run', 'version:patch'], {
    stdio: 'inherit',
  })

  const filesToStage = ['package.json']

  if (existsSync(new URL('../package-lock.json', import.meta.url))) {
    filesToStage.push('package-lock.json')
  }

  execFileSync('git', ['add', ...filesToStage], {
    stdio: 'inherit',
  })
}

main()
