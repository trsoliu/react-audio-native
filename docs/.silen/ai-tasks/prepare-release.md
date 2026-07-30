---
id: prepare-release
title: Prepare a React Audio Native release
contractVersion: 1
mode: write
requiresExplicitAuthorization: true
references:
  - cli:build
  - cli:ai
  - artifact:silen-manifest
  - artifact:llms
  - mcp:read
---

# Prepare a React Audio Native release

## Goal

Prepare a reviewable prerelease or stable package after its exact audio-core dependency exists in the
registry.

## Steps

1. Confirm requested version, dist-tag and corresponding core version.
2. Remove local core overrides and install from the public registry.
3. Read release and device-smoke pages, then run every code, docs, package and browser gate.
4. Build clean Vite and Next consumers from registry artifacts.
5. Record versions, CI URLs, registry queries and device evidence.

## Verification

1. Run the complete repository quality, package, docs and browser gates.
2. Query the public registry and install the exact core and adapter artifacts in clean consumers.
3. For a stable release, verify every required device-smoke row contains dated real-device evidence.

## Stop conditions

Stop on missing core publication, npm authority, failed gate, prerelease core under a stable React
version or pending stable device evidence.
