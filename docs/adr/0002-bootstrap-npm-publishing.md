# ADR 0002: Bootstrap the first npm beta with a protected short-lived token

- Status: accepted
- Date: 2026-07-30
- Decider: trsoliu
- Owner: trsoliu

## Context

`react-audio-native` has no npm package record yet, so npm Trusted Publishing cannot be configured
for its first publication. The shared `@trsoliu/audio-core@1.0.0-beta.1` must already be public, and
the stable release remains blocked by the device-smoke gate.

## Decision

Use a one-day npm granular token only in the protected `npm` GitHub Environment. A manual workflow
on `main` requires the exact `publish-beta.1` confirmation, pins third-party Actions to immutable
commits, installs core from the public registry, runs every release gate and publishes
`react-audio-native@1.0.0-beta.1` with `next` and signed provenance. Exact-version checks and bounded
registry retries make reruns idempotent.

npm requires `latest` while a package has no stable version. The initial beta may therefore be
reachable through both `latest` and the documented `next` channel. Publishing stable `1.0.0` will
move `latest` to the stable version.

After beta verification, configure npm Trusted Publishing for `release.yml`, delete the GitHub
Environment secret and revoke the bootstrap token. The bootstrap workflow is never used for a
stable release.

## Consequences

- The first package record can be created without committing or exposing credentials locally.
- All publishing happens from an auditable default-branch workflow with provenance.
- The short-lived token creates a temporary risk window and must be removed after registry-consumer
  and Vue `legacy` finalization checks pass.
- Bare `npm install react-audio-native` can resolve the beta until stable exists; documentation must
  identify it as a prerelease and recommend `react-audio-native@next` during validation.

## References

- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)
