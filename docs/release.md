# Release policy

1. Run `pnpm security:audit`, lint, typecheck, coverage, build, package and browser gates.
2. Publish `@trsoliu/audio-core@1.0.0-beta.1` before the matching React prerelease.
3. Install the registry tarballs in clean Vite and Next consumers; workspace links are not evidence.
4. Publish React prereleases from Changesets `beta` pre mode with `--tag next` while any required
   device smoke row is pending.
5. Merge a beta release PR after registry-core and automated gates pass; merge a stable release PR
   only after all device evidence is attached.
6. Stable releases use GitHub Actions Trusted Publishing with an npm environment, OIDC
   `id-token: write`, Node 24, npm 12 and provenance.

The stable publish step is additionally guarded by `pnpm release:verify-devices`. It parses all four
required rows in `docs/device-smoke.md` and stops unless every status is exactly `通过`; creating or
updating a Changesets release PR remains possible while evidence is pending.

In pre mode, Changesets retains source changeset files. The workflow therefore publishes only
after every non-empty changeset for the publishable package appears in the `pre.json` consumed
list, which proves the beta version PR has been merged; private Demo/fixture changesets do not block
npm publication, while other pending package changesets create or update that PR instead. The
triggering push must also add a consumed changeset and change the package version, so only the
version PR merge can publish. The previous default-branch SHA must remain an ancestor of the pushed
`HEAD`, and the complete diff may contain only prerelease state, the publishable manifest,
generated package changelog and lockfile. This supports multi-commit rebase merges without allowing
unrelated source changes. A failed publish is retried from its original Actions run; a later ordinary
`main` commit cannot publish that version. The workflow then verifies every publishable manifest is
`*-beta.N`.
If the original run can no longer be rerun, a manual dispatch on `main` requires the previous
default-branch SHA and exact release HEAD SHA from the failed push. The checked-out `HEAD` must
still equal that supplied release SHA, and live `origin/main` must resolve to the same commit,
before the complete allowlisted version transition is accepted. Both push and manual paths repeat
the live remote check immediately before npm publication, so any later or racing commit keeps
release closed.
Because Changesets rejects a custom publish tag during active pre mode, a typed publisher checks
the exact registry version and runs `npm publish --tag next --provenance` only when it is absent.
An existing version is skipped only after bounded fresh/no-cache reads, including retries for
transient registry failures, show `next` resolving to that exact version. Outside active pre mode,
the stable path must pass `release:verify-devices`. Both
paths use Trusted Publishing, short-lived OIDC credentials and provenance; neither reads an npm
token. The release job runs only on `main`; manual dispatch from the generated release branch
cannot publish. Before invoking npm, the publisher also verifies that the package's exact
`@trsoliu/audio-core` version is already present in the public registry.

The initial pre-state records `react-audio-v1` as consumed because it is already represented by
the public beta. `clear-react-api-docs`, committed after that publication, remains the only pending
input to the next version PR.

No workflow may rename the package when npm ownership is missing. It must stop and report the
authorization blocker.

The initial beta was published by a protected manual workflow on `main` after an explicit
confirmation and every release gate. A bounded granular token with a 2026-10-28 expiry ceiling was
scoped to the protected `npm` GitHub Environment while GitHub OIDC supplied signed provenance. The
owner elected to retain the token until expiry after the registry and clean consumer checks passed;
the temporary workflow and GitHub secret were removed, so it is disconnected from project
publishing.

`publishConfig.registry` pins the destination to the official npm registry even when the machine
uses an install mirror. `next` is the documented prerelease channel. npm requires a `latest` tag
while a brand-new package has no stable version, so the first beta can temporarily be reachable
through both tags; stable `1.0.0` will move `latest` to the stable version.

`react-audio-native` now trusts `trsoliu/react-audio-native`'s `.github/workflows/release.yml`, the
protected `npm` Environment and `npm publish` only. All later releases must use that OIDC binding.
The retained bootstrap token must never be restored to GitHub, a workflow or local npm
configuration and expires on 2026-10-28.
