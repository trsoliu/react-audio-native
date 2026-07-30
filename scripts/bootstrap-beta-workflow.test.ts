import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(import.meta.dirname, '..')
const workflowPath = resolve(
  repositoryRoot,
  '.github/workflows/bootstrap-beta.yml',
)

describe('bootstrap npm beta workflow', () => {
  it('is a manual, main-only release with explicit confirmation', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).not.toMatch(/^\s+push:/m)
    expect(workflow).toContain("github.ref == 'refs/heads/main'")
    expect(workflow).toContain("inputs.confirm == 'publish-beta.1'")
    expect(workflow).toContain('environment: npm')
  })

  it('uses minimum permissions and the environment bootstrap secret', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).toContain('contents: read')
    expect(workflow).toContain('id-token: write')
    expect(workflow).not.toContain('contents: write')
    expect(workflow).toContain('secrets.NPM_BOOTSTRAP_TOKEN')
    expect(workflow).not.toMatch(/_authToken\s*[:=]\s*npm_/)
  })

  it('pins every action to an immutable commit', async () => {
    const workflow = await readFile(workflowPath, 'utf8')
    const actionReferences = [...workflow.matchAll(/uses:\s+[^@\s]+@([^\s]+)/g)]

    expect(actionReferences.length).toBeGreaterThan(0)
    for (const reference of actionReferences) {
      expect(reference[1]).toMatch(/^[a-f0-9]{40}$/)
    }
  })

  it('runs every release gate before publishing', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    const requiredCommands = [
      'pnpm security:audit',
      'pnpm lint',
      'pnpm typecheck',
      'pnpm test:coverage',
      'pnpm build',
      'pnpm docs:build',
      'pnpm docs:index',
      'pnpm docs:audit',
      'pnpm docs:eval',
      'pnpm test:pack',
      'pnpm test:e2e',
    ]

    for (const command of requiredCommands) {
      expect(workflow).toContain(command)
    }

    expect(workflow.indexOf('pnpm test:e2e')).toBeLessThan(
      workflow.indexOf('npm publish --tag next --access public'),
    )
  })

  it('checks the exact registry version and retries propagation', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).toContain(
      'https://registry.npmjs.org/react-audio-native/1.0.0-beta.1',
    )
    expect(workflow).toContain('for attempt in {1..12}')
    expect(workflow).toContain('sleep 5')
  })

  it('keeps next authoritative without trying to remove the first-version latest tag', async () => {
    const workflow = await readFile(workflowPath, 'utf8')

    expect(workflow).not.toContain(
      'npm dist-tag rm react-audio-native latest --registry=https://registry.npmjs.org',
    )
    expect(workflow).toContain(
      'npm requires a latest tag while a package has no stable version',
    )
    expect(workflow).toContain(
      'npm dist-tag add react-audio-native@1.0.0-beta.1 next',
    )
  })
})
