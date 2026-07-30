# Release policy

1. Run `pnpm security:audit`, lint, typecheck, coverage, build, package and browser gates.
2. Publish the exact `@trsoliu/audio-core` version before the matching React version; stable
   `react-audio-native@1.0.0` consumes public `@trsoliu/audio-core@1.0.0`.
3. Install the registry tarballs in clean Vite and Next consumers; workspace links are not evidence.
4. Publish React prereleases from Changesets `beta` pre mode with `--tag next`.
5. Merge a beta release PR after registry-core and automated gates pass; merge a stable release PR
   only after the documented stable evidence path is complete.
6. Stable releases use GitHub Actions Trusted Publishing with an npm environment, OIDC
   `id-token: write`, Node 24, npm 12 and provenance.

The stable publish step is additionally guarded by `pnpm release:verify-stable`. It accepts either
all four required rows marked exactly `通过`, or all rows retained with supported statuses plus a
complete maintainer decision recording identity, ISO date, exact stable version coverage,
successful automated assessment and explicit remaining-risk acceptance. It also checks every
publishable manifest is stable and covered by that decision. Creating or updating a Changesets
release PR remains possible while either evidence path is incomplete.

Stable publication is also bound to the generated version transition. The triggering push must
remove a package changeset, advance the manifest to a stable version and contain only Changesets
state, manifests, package changelogs, the managed package README install section and the lockfile.
The workflow verifies the event's previous SHA is an ancestor and the requested release SHA is still
the live `main` head, then repeats that remote-head check immediately before npm publication.
Ordinary source or documentation pushes can update a release PR but cannot publish a stable package
directly.

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
the stable path must pass `release:verify-stable`. Both
paths use Trusted Publishing, short-lived OIDC credentials and provenance; neither reads an npm
token. The release job runs only on `main`; manual dispatch from the generated release branch
cannot publish. Before invoking npm, the publisher also verifies that the package's exact
`@trsoliu/audio-core` version is already present in the public registry.

The initial pre-state records `react-audio-v1` as consumed because it is already represented by
the public beta. The later `clear-react-api-docs` and `react-core-beta-two` changesets were consumed
by the OIDC release PR that published `react-audio-native@1.0.0-beta.2`.

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
through both tags; stable `1.0.0` moves `latest` to the stable version.

`react-audio-native` now trusts `trsoliu/react-audio-native`'s `.github/workflows/release.yml`, the
protected `npm` Environment and `npm publish` only. All later releases must use that OIDC binding.
The retained bootstrap token must never be restored to GitHub, a workflow or local npm
configuration and expires on 2026-10-28.
