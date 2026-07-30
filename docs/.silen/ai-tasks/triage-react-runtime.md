---
id: triage-react-runtime
title: Triage a React, SSR or WebView playback issue
contractVersion: 1
mode: read
references:
  - mcp:search
  - mcp:read
  - mcp:backlinks
  - artifact:ai-index
---

# Triage a React, SSR or WebView playback issue

## Goal

Locate whether a failure belongs to import-time SSR, callback-ref lifecycle, shared core state,
browser capability, media source or host WebView behavior without changing code.

## Steps

1. Read the architecture, browser/WebView and compatibility pages.
2. Record React version, render mode, engine, host, MIME sources and structured error.
3. Compare component, Hook, Vite and Next paths and identify the first divergent boundary.
4. Check whether the same core behavior reproduces in the Vue repository.
5. Report a minimal reproduction and missing evidence.

## Stop conditions

Do not modify code or release state without explicit user authorization.
