# Changelog

All notable project-level changes are documented here following Keep a Changelog. Package version
intent and generated package changelogs are managed by Changesets under `.changeset/`.

## Unreleased

- Updated the React package to consume the exact public `@trsoliu/audio-core@1.0.0-beta.2`
  prerelease before publishing the matching React beta.
- Added a mutually exclusive OIDC release path that waits until Changesets records every retained
  beta changeset for a publishable package as consumed, binds publication to an ancestor-verified
  versioning push, supports an exact-SHA-bound default-branch recovery after a failed release run,
  reconfirms the live remote branch immediately before publication,
  tolerates multi-commit rebase merges, and verifies exact `next` tags before
  treating registry versions as complete while retrying transient registry failures; stable
  publication still requires all four device-smoke rows.
- Expanded the React API and npm references with every public prop, callback payload, snapshot
  state, error code, command, Hook lifecycle rule, composition point and Bridge event; corrected
  the Vue-to-React mapping for `hint` and plain ReactNode control content.
- Fixed WebView Bridge teardown so removing an adapter happens before a simultaneous source switch.
- Pinned package publication to the official npm registry so local mirror settings cannot redirect a release.
- Added a manual, main-only beta bootstrap with immutable Actions, complete release gates,
  provenance, exact registry checks and bounded propagation retries.
- Documented npm's required `latest` alias for a new package with no stable release; `next` remains
  the authoritative prerelease channel.
- Added a machine-enforced stable-release device gate and preserved the generated Silen Agent
  Contract inside the GitHub Pages artifact.
- Retired the short-lived token bootstrap workflow after beta publication and clean
  registry-consumer verification; permanent releases use OIDC only.
- Configured the npm Trusted Publisher for the exact `release.yml` workflow, protected `npm`
  environment and publish-only permission.

### Added

- Typed React component, headless Hook, imperative handle, playlists, source fallback, Media Session,
  exclusive groups, WebView Bridge and SSR-safe imports.
- shadcn/ui Demo, browser capability lab, Vite/Next fixtures and five-project Playwright matrix.
- Explicit React 18 consumer type/build coverage alongside the React 19 Demo and Next fixture.
- Silen documentation site, project map, deterministic AI retrieval checks, public Agent Contract,
  `llms.txt` artifacts and GitHub Pages deployment.

### Changed

- Consume the shared core media-event precedence fix so late `canplay` events cannot overwrite a
  paused React player and buffering recovery returns to `playing` deterministically.
- Accept both npm 11 and npm 12 `npm pack --json` report shapes during package validation.

### Release boundary

- `react-audio-native@1.0.0-beta.1` is published with signed provenance and available through
  the documented `next` prerelease channel.
- Stable `1.0.0` remains blocked until iOS WKWebView, Android WebView and HarmonyOS ArkWeb smoke
  evidence is complete.

### Security

- Updated transitive development tooling away from vulnerable `ini` and `@hono/node-server`
  versions; published player tarballs remain isolated from documentation dependencies.
