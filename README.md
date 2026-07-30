# React Audio Native

Accessible, typed audio playback for React DOM, mobile browsers and embedded WebViews. The package
shares the same event-driven state contract as `vue-audio-native` and does not include React Native
native SDK bindings.

The component supports playlists, multi-format fallback, repeat modes, buffered seeking, playback
rate, Media Session, optional exclusive groups, structured errors and a protocol-neutral WebView
Bridge. Importing it during SSR does not create DOM or media objects.

## Workspace

```text
apps/demo-react             React / shadcn/ui interactive Demo
apps/compatibility-lab      Browser and WebView capability detection
packages/react-audio-native React component and headless Hook
fixtures/vite-react         Clean Vite consumer build
fixtures/next               Next SSR consumer build
docs                        Silen documentation, project map and AI knowledge base
```

## Development

Node.js 22.22.2 or newer and pnpm 11.17.0 are required.

```bash
corepack enable
pnpm install
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

Start the polished shadcn/ui Demo with `pnpm --filter demo-react dev`. Start the UA-independent
device probe with `pnpm --filter react-audio-compatibility-lab dev`.

Architecture decisions live in [`docs/adr`](docs/adr), the runtime baseline is documented in
[`docs/compatibility.md`](docs/compatibility.md), and the stable-release device gate is tracked in
[`docs/device-smoke.md`](docs/device-smoke.md). Start the documentation site with
`pnpm docs:dev --host 127.0.0.1 --port 5176`; after merge to `main`, GitHub Pages publishes it at
<https://trsoliu.github.io/react-audio-native/>.

AI clients should begin with [`AGENTS.md`](AGENTS.md). The Silen build emits `llms.txt`, complete
Markdown, deterministic search data and a public Agent Contract; `pnpm docs:mcp` starts the bounded
read-only local knowledge server.

## License

[MIT](LICENSE)
