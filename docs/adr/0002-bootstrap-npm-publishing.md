# ADR 0002: Bootstrap the first npm beta with a protected short-lived token

- Status: accepted; bootstrap completed; token retained until expiry
- Date: 2026-07-30
- Decider: trsoliu
- Owner: trsoliu

## Context

`react-audio-native` has no npm package record yet, so npm Trusted Publishing cannot be configured
for its first publication. The shared `@trsoliu/audio-core@1.0.0-beta.1` must already be public, and
the stable release remains blocked by the device-smoke gate.

## Decision

Use a bounded npm granular token only in the protected `npm` GitHub Environment. The operator
selected a 90-day expiry ceiling on 2026-07-30 and, after verifying the OIDC cutover, elected to
retain the disconnected token until its 2026-10-28 expiry. A manual workflow
on `main` requires the exact `publish-beta.1` confirmation, pins third-party Actions to immutable
commits, installs core from the public registry, runs every release gate and publishes
`react-audio-native@1.0.0-beta.1` with `next` and signed provenance. Exact-version checks and bounded
registry retries make reruns idempotent.

npm requires `latest` while a package has no stable version. The initial beta may therefore be
reachable through both `latest` and the documented `next` channel. Publishing stable `1.0.0` will
move `latest` to the stable version.

After beta verification, configure npm Trusted Publishing for `release.yml` and delete the GitHub
Environment secret. The retained npm-account token must not be restored to a repository, workflow
or local npm configuration. The bootstrap workflow is never used for a stable release.

After the clean Vite, Nuxt, React and Next registry consumers passed and Vue `legacy` was finalized,
the temporary workflow and GitHub Environment secret were removed. Immutable Actions runs and Git
history retain the bootstrap audit trail.

## Consequences

- The first package record can be created without committing or exposing credentials locally.
- All publishing happens from an auditable default-branch workflow with provenance.
- The retained token creates a residual risk window until 2026-10-28; the owner accepts that risk
  while keeping the credential disconnected from repository publishing.
- Bare `npm install react-audio-native` can resolve the beta until stable exists; documentation must
  identify it as a prerelease and recommend `react-audio-native@next` during validation.

## Follow-up actions

- [x] Publish `react-audio-native@1.0.0-beta.1` with signed provenance.
- [x] Complete clean Vite, Nuxt, React and Next registry-consumer verification.
- [x] Delete the GitHub bootstrap secret and retire the temporary workflow.
- [x] Configure npm Trusted Publishing for `release.yml`.
- [x] Record the owner's decision to retain the disconnected token until 2026-10-28 and confirm it
  is absent from the GitHub Environment and all release workflows.

## References

- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)
