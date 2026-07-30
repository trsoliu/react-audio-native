# Release policy

1. Run `pnpm security:audit`, lint, typecheck, coverage, build, package and browser gates.
2. Publish `@trsoliu/audio-core@1.0.0-beta.1` before the matching React prerelease.
3. Install the registry tarballs in clean Vite and Next consumers; workspace links are not evidence.
4. Publish React prereleases with `--tag next` while any required device smoke row is pending.
5. Merge the Changesets release PR only after all device evidence is attached.
6. Stable releases use GitHub Actions Trusted Publishing with an npm environment, OIDC
   `id-token: write`, Node 24, npm 12 and provenance.

The stable publish step is additionally guarded by `pnpm release:verify-devices`. It parses all four
required rows in `docs/device-smoke.md` and stops unless every status is exactly `通过`; creating or
updating a Changesets release PR remains possible while evidence is pending.

No workflow may rename the package when npm ownership is missing. It must stop and report the
authorization blocker.

The initial beta was published by a protected manual workflow on `main` after an explicit
confirmation and every release gate. A short-lived granular token was scoped to the protected
`npm` GitHub Environment while GitHub OIDC supplied signed provenance. After the registry and clean
consumer checks passed, the temporary workflow and GitHub secret were removed.

`publishConfig.registry` pins the destination to the official npm registry even when the machine
uses an install mirror. `next` is the documented prerelease channel. npm requires a `latest` tag
while a brand-new package has no stable version, so the first beta can temporarily be reachable
through both tags; stable `1.0.0` will move `latest` to the stable version.

All later releases must use `.github/workflows/release.yml` with npm Trusted Publishing. The
one-day bootstrap token must be revoked on npm and must never be restored to GitHub.
