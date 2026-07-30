# ADR 0002: Bootstrap the first npm beta with a protected short-lived token

- Status: accepted; bootstrap completed; stable gate superseded by ADR 0003; token retained until expiry
- Date: 2026-07-30
- Decider: trsoliu
- Owner: trsoliu

## Context

`react-audio-native` has no npm package record yet, so npm Trusted Publishing cannot be configured
for its first publication. The shared `@trsoliu/audio-core@1.0.0-beta.1` must already be public. At
the time of this bootstrap decision, stable publication was blocked by the device-only smoke gate;
ADR 0003 later replaced it with the dual-path evidence gate.

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

Routine follow-up betas use Changesets `beta` pre mode in the trusted `release.yml`. Because
Changesets retains source changeset files during pre mode, the workflow publishes only after every
non-empty changeset that targets the publishable package is recorded in `pre.json` as consumed by
the merged beta version PR; private Demo and fixture changesets do not block package publication.
It also confirms that the triggering push both added a consumed changeset and changed the
publishable manifest version. The event's previous default-branch SHA must remain an ancestor of
the pushed `HEAD`, and the complete tree diff is limited to prerelease state, the publishable
manifest, generated package changelog and lockfile. This supports multi-commit rebase merges
without allowing unrelated source changes. It then verifies the manifest remains `*-beta.N`.
Changesets rejects a custom publish tag during active pre mode, so a typed, idempotent publisher
checks the exact registry version, verifies `next` through bounded fresh/no-cache reads that
tolerate transient registry failures before skipping, and invokes
`npm publish --tag next --provenance` only when that version does not exist. The job is restricted
to `main`, and React publication requires its exact core dependency to exist on npm. Outside active
pre mode, the mutually exclusive stable branch still requires the stable evidence gate before
publication.

If the original release run cannot be rerun, a manual dispatch on `main` requires the previous
default-branch SHA and exact release HEAD SHA from the failed push. The checked-out `HEAD` must
still equal that supplied release SHA, and live `origin/main` must resolve to the same commit,
before the version-only diff and state transition are accepted. Both push and manual paths repeat
the live remote comparison immediately before npm publication, preserving the source-change and
default-branch boundary even when another push races a running job.

When pre mode was adopted, `react-audio-v1` was seeded as consumed because its contents were
already represented by the public beta manifest. The later `clear-react-api-docs` and
`react-core-beta-two` changesets were consumed by the OIDC release PR for
`react-audio-native@1.0.0-beta.2`; the latter pins the public
`@trsoliu/audio-core@1.0.0-beta.2` prerelease.

## Consequences

- The first package record can be created without committing or exposing credentials locally.
- All publishing happens from an auditable default-branch workflow with provenance.
- The retained token creates a residual risk window until 2026-10-28; the owner accepts that risk
  while keeping the credential disconnected from repository publishing.
- Bare `npm install react-audio-native` can resolve the beta until stable exists; documentation must
  identify it as a prerelease and recommend `react-audio-native@next` during validation.
- The workflow cannot use prerelease state to bypass stable publication: pre mode is restricted to
  `next`, while non-pre mode is restricted by the version-bound stable evidence gate.

## Follow-up actions

- [x] Publish `react-audio-native@1.0.0-beta.1` with signed provenance.
- [x] Publish `react-audio-native@1.0.0-beta.2` through OIDC Trusted Publishing with provenance.
- [x] Complete clean Vite, Nuxt, React and Next registry-consumer verification.
- [x] Delete the GitHub bootstrap secret and retire the temporary workflow.
- [x] Configure npm Trusted Publishing for `release.yml`.
- [x] Record the owner's decision to retain the disconnected token until 2026-10-28 and confirm it
      is absent from the GitHub Environment and all release workflows.

## References

- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm dist-tags](https://docs.npmjs.com/adding-dist-tags-to-packages/)
