---
id: migrate-from-vue
title: Migrate a Vue Audio Native consumer to React
contractVersion: 1
mode: write
requiresExplicitAuthorization: true
references:
  - mcp:search
  - mcp:read
  - artifact:markdown-routes
---

# Migrate a Vue Audio Native consumer to React

## Goal

Map a consumer to React components and callbacks while preserving shared audio state and host Bridge
semantics.

## Steps

1. Inventory Vue props, events, slots and exposed methods used by the consumer.
2. Map shared data and commands directly, then translate framework bindings using the migration page.
3. Replace Vue legacy event names with typed React callbacks.
4. Add SSR, StrictMode, cleanup and consumer interaction regression tests.
5. Verify a clean Vite or Next build.

## Verification

1. Run the consumer's typecheck, focused player tests and production build.
2. Verify SSR import, StrictMode remount, callback cleanup and browser playback behavior.
3. Inspect the dependency lockfile and diff to confirm the intended React and core versions.

## Stop conditions

Stop before dependency or source writes unless the user explicitly authorized the consumer migration.
