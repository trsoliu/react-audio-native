# Agent guide

This is the authoritative repository contract for AI coding agents. Human instructions in the
active task take precedence. Keep edits bounded, preserve unrelated work and support claims with
fresh tests.

## Read first

1. Read `README.md`, `DESIGN.md`, `docs/project-map/index.mdx` and the relevant ADR.
2. For documentation work, read `@aicode-nexus/silen/agent/manifest.json`; the deployed site
   contract is generated at `/react-audio-native/.well-known/silen/manifest.json`.
3. Inspect both staged and unstaged changes before editing.

## Architecture

- `packages/react-audio-native`: React component, headless Hook, imperative handle, package CSS and
  public type re-exports.
- `apps/demo-react`: shadcn/ui product Demo; Demo dependencies never enter the npm package.
- `apps/compatibility-lab`: capability and protocol-neutral Bridge probe.
- `fixtures/vite-react` and `fixtures/next`: React 18 consumer and React 19 SSR build evidence.
- `docs`: Silen site, project map, ADRs, release policy and public AI knowledge base.
- `@trsoliu/audio-core`: external framework-free state contract, published from the Vue repository.

React is an adapter over audio-core. Do not create a second playback state machine in a component or
Hook.

## Non-negotiable behavior

- Use TypeScript for source, tests, scripts and configuration. JSON, CSS, JSX markup, Markdown and
  static assets are intentional exceptions.
- Create media controllers only after a real audio element is attached. Module import and SSR render
  must not touch DOM or media globals.
- Keep StrictMode mount/unmount idempotent and remove all listeners, animation frames, group and
  Media Session ownership during cleanup.
- Drive state from standard media events; do not add ready-state polling or persistent timers.
- Detect capabilities, not user agents, and fall back to native controls when required.
- Keep `AUTOPLAY_BLOCKED` recoverable, source errors structured and WebView Bridge protocols neutral.
- Keep instances independent unless both `exclusive` and the same `group` are set.
- Media Session is opt-in; waveforms render only caller-provided peaks.
- Use `forwardRef` for `AudioPlayerHandle` and keep `useAudioPlayer()` callback-ref based.
- Use `lucide-react` in the package. shadcn/Radix/Tailwind/CVA/Sonner are Demo-only.
- Published CSS contains no Tailwind Preflight, global utilities, OKLCH or `color-mix()` output.
- Do not edit generated `dist`, `.next`, coverage, `.silen/dist` or dependency folders.

## Required workflow

Add or update a failing regression test before behavior changes. Then run:

```bash
pnpm security:audit
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm docs:build
pnpm docs:index
pnpm docs:audit
pnpm docs:eval
pnpm test:pack
pnpm test:e2e
```

The adapter must remain at least 85% for statements/functions/lines and 80% for branches. Component
JavaScript must remain below 25 KB gzip and CSS below 12 KB gzip. Pack checks must continue to prove
SSR import safety, ESM/CJS/type correctness and no Demo dependency leakage.

## Documentation and change records

- Update `CHANGELOG.md` and add a Changeset for user-visible package behavior.
- Update `docs/project-map/index.mdx` when module boundaries or ownership change.
- Update compatibility, release and device-smoke pages with contract changes.
- Run Silen build, audit and eval after documentation edits.
- Keep Silen as a root development dependency and `docs` as a content directory rather than a pnpm
  workspace; otherwise its dependency links become public Markdown routes.
- Keep the isolated Silen SSR plugin in `docs/.silen/config.ts`; it prevents ancestor
  `node_modules` from introducing a second React runtime during static rendering.
- `pnpm docs:mcp` is read-only. Never add `--allow-write` without explicit authorization.
- Public Agent inputs contain no secrets, local absolute paths, credentials or private endpoints.

## Cross-repository and release safety

- `@trsoliu/audio-core` is published first from `trsoliu/vue-audio-native`.
- A stable React version must never depend on a prerelease core range; `test:pack` enforces this.
- Remove local workspace overrides and verify the registry core before CI or publication.
- Prereleases use `next`; do not publish stable while `docs/device-smoke.md` has pending rows.
- Stable publishing uses GitHub Actions OIDC Trusted Publishing with provenance.
- This project targets React DOM and WebViews, not React Native native SDKs.
- Never commit npm auth, registry tokens, device recordings or local filesystem paths.

## Git

Use focused commits on `codex/*` branches. Do not force-push, rewrite public history, bypass failed
checks, or merge before required CI is green.
