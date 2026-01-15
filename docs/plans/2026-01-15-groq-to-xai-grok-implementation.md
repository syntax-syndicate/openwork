# Groq to xAI Grok Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Groq model provider with xAI's Grok models throughout the Openwork desktop application.

**Architecture:** Global search-and-replace of 'groq' with 'xai' across type definitions, IPC handlers, secure storage, OpenCode adapter/config, preload, renderer, and UI settings. Update API validation endpoint from groq.com to x.ai. Add Grok models to DEFAULT_PROVIDERS. Update all test files to use 'xai' instead of 'groq'.

**Tech Stack:** TypeScript, Electron, React, Vitest

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `packages/shared/src/types/provider.ts:187`

**Step 1: Update ApiKeyProvider type and add xAI provider**

In `packages/shared/src/types/provider.ts`, the `ApiKeyProvider` type needs to be imported from `secureStorage.ts` but is actually defined there. First, update the shared types to add xAI to DEFAULT_PROVIDERS.

Find this block (around line 106-120):
```typescript
  {
    id: 'local',
    name: 'Local Models',
    requiresApiKey: false,
    models: [
      {
        id: 'ollama',
        displayName: 'Ollama (Local)',
        provider: 'local',
        fullId: 'ollama/llama3',
        supportsVision: false,
      },
    ],
  },
];
```

Insert BEFORE the closing `];` (after the local provider block):
```typescript
  {
    id: 'xai',
    name: 'xAI',
    requiresApiKey: true,
    apiKeyEnvVar: 'XAI_API_KEY',
    baseUrl: 'https://api.x.ai',
    models: [
      {
        id: 'grok-4',
        displayName: 'Grok 4',
        provider: 'xai' as ProviderType,
        fullId: 'xai/grok-4',
        contextWindow: 256000,
        supportsVision: true,
      },
      {
        id: 'grok-3',
        displayName: 'Grok 3',
        provider: 'xai' as ProviderType,
        fullId: 'xai/grok-3',
        contextWindow: 131000,
        supportsVision: false,
      },
    ],
  },
```

**Step 2: Update ProviderType to include 'xai'**

Change line 5:
```typescript
export type ProviderType = 'anthropic' | 'openai' | 'google' | 'local' | 'custom';
```
To:
```typescript
export type ProviderType = 'anthropic' | 'openai' | 'google' | 'xai' | 'local' | 'custom';
```

**Step 3: Run typecheck**

```bash
pnpm typecheck
```
Expected: May show errors in other files referencing 'groq' - those will be fixed in subsequent tasks.

**Step 4: Commit**

```bash
git add packages/shared/src/types/provider.ts
git commit -m "feat: add xAI provider type and Grok models to DEFAULT_PROVIDERS

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Secure Storage

**Files:**
- Modify: `apps/desktop/src/main/store/secureStorage.ts:187-201`

**Step 1: Update ApiKeyProvider type**

Change line 187:
```typescript
export type ApiKeyProvider = 'anthropic' | 'openai' | 'google' | 'groq' | 'custom';
```
To:
```typescript
export type ApiKeyProvider = 'anthropic' | 'openai' | 'google' | 'xai' | 'custom';
```

**Step 2: Update getAllApiKeys function**

Change lines 192-201:
```typescript
export async function getAllApiKeys(): Promise<Record<ApiKeyProvider, string | null>> {
  const [anthropic, openai, google, groq, custom] = await Promise.all([
    getApiKey('anthropic'),
    getApiKey('openai'),
    getApiKey('google'),
    getApiKey('groq'),
    getApiKey('custom'),
  ]);

  return { anthropic, openai, google, groq, custom };
}
```
To:
```typescript
export async function getAllApiKeys(): Promise<Record<ApiKeyProvider, string | null>> {
  const [anthropic, openai, google, xai, custom] = await Promise.all([
    getApiKey('anthropic'),
    getApiKey('openai'),
    getApiKey('google'),
    getApiKey('xai'),
    getApiKey('custom'),
  ]);

  return { anthropic, openai, google, xai, custom };
}
```

**Step 3: Run typecheck**

```bash
pnpm typecheck
```

**Step 4: Commit**

```bash
git add apps/desktop/src/main/store/secureStorage.ts
git commit -m "refactor: replace groq with xai in secure storage

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update IPC Handlers

**Files:**
- Modify: `apps/desktop/src/main/ipc/handlers.ts:66,784-795`

**Step 1: Update ALLOWED_API_KEY_PROVIDERS**

Change line 66:
```typescript
const ALLOWED_API_KEY_PROVIDERS = new Set(['anthropic', 'openai', 'google', 'groq', 'custom']);
```
To:
```typescript
const ALLOWED_API_KEY_PROVIDERS = new Set(['anthropic', 'openai', 'google', 'xai', 'custom']);
```

**Step 2: Update API validation endpoint**

Change lines 784-795:
```typescript
        case 'groq':
          response = await fetchWithTimeout(
            'https://api.groq.com/openai/v1/models',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sanitizedKey}`,
              },
            },
            API_KEY_VALIDATION_TIMEOUT_MS
          );
          break;
```
To:
```typescript
        case 'xai':
          response = await fetchWithTimeout(
            'https://api.x.ai/v1/models',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${sanitizedKey}`,
              },
            },
            API_KEY_VALIDATION_TIMEOUT_MS
          );
          break;
```

**Step 3: Run typecheck**

```bash
pnpm typecheck
```

**Step 4: Commit**

```bash
git add apps/desktop/src/main/ipc/handlers.ts
git commit -m "refactor: replace groq with xai in IPC handlers

- Update ALLOWED_API_KEY_PROVIDERS set
- Update validation endpoint to api.x.ai/v1/models

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update OpenCode Adapter

**Files:**
- Modify: `apps/desktop/src/main/opencode/adapter.ts:376-379`

**Step 1: Update environment variable for xAI**

Change lines 376-379:
```typescript
    if (apiKeys.groq) {
      env.GROQ_API_KEY = apiKeys.groq;
      console.log('[OpenCode CLI] Using Groq API key from settings');
    }
```
To:
```typescript
    if (apiKeys.xai) {
      env.XAI_API_KEY = apiKeys.xai;
      console.log('[OpenCode CLI] Using xAI API key from settings');
    }
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/desktop/src/main/opencode/adapter.ts
git commit -m "refactor: replace GROQ_API_KEY with XAI_API_KEY in adapter

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update OpenCode Config Generator

**Files:**
- Modify: `apps/desktop/src/main/opencode/config-generator.ts:370`

**Step 1: Update enabled_providers**

Change line 370:
```typescript
    enabled_providers: ['anthropic', 'openai', 'google', 'groq'],
```
To:
```typescript
    enabled_providers: ['anthropic', 'openai', 'google', 'xai'],
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/desktop/src/main/opencode/config-generator.ts
git commit -m "refactor: replace groq with xai in OpenCode config

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Preload Script

**Files:**
- Modify: `apps/desktop/src/preload/index.ts:45`

**Step 1: Update addApiKey type signature**

Change lines 44-48:
```typescript
  addApiKey: (
    provider: 'anthropic' | 'openai' | 'google' | 'groq' | 'custom',
    key: string,
    label?: string
  ): Promise<unknown> =>
```
To:
```typescript
  addApiKey: (
    provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'custom',
    key: string,
    label?: string
  ): Promise<unknown> =>
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/desktop/src/preload/index.ts
git commit -m "refactor: replace groq with xai in preload script

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Renderer Accomplish Library

**Files:**
- Modify: `apps/desktop/src/renderer/lib/accomplish.ts:46`

**Step 1: Update addApiKey type signature**

Change line 46:
```typescript
  addApiKey(provider: 'anthropic' | 'openai' | 'google' | 'groq' | 'custom', key: string, label?: string): Promise<ApiKeyConfig>;
```
To:
```typescript
  addApiKey(provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'custom', key: string, label?: string): Promise<ApiKeyConfig>;
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/lib/accomplish.ts
git commit -m "refactor: replace groq with xai in renderer accomplish lib

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update Settings Dialog UI

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/SettingsDialog.tsx:24-33`

**Step 1: Add xAI to API_KEY_PROVIDERS and remove from COMING_SOON**

Change lines 24-33:
```typescript
const API_KEY_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', prefix: 'sk-ant-', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', placeholder: 'sk-...' },
  { id: 'google', name: 'Google AI', prefix: 'AIza', placeholder: 'AIza...' },
] as const;

// Coming soon providers (displayed but not selectable)
const COMING_SOON_PROVIDERS = [
  { id: 'groq', name: 'Groq' },
] as const;
```
To:
```typescript
const API_KEY_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', prefix: 'sk-ant-', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', placeholder: 'sk-...' },
  { id: 'google', name: 'Google AI', prefix: 'AIza', placeholder: 'AIza...' },
  { id: 'xai', name: 'xAI (Grok)', prefix: 'xai-', placeholder: 'xai-...' },
] as const;

// Coming soon providers (displayed but not selectable)
const COMING_SOON_PROVIDERS = [] as const;
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/SettingsDialog.tsx
git commit -m "feat: enable xAI (Grok) in settings UI

- Add xAI to API_KEY_PROVIDERS with xai- prefix
- Remove groq from COMING_SOON_PROVIDERS

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update Unit Tests - Handlers

**Files:**
- Modify: `apps/desktop/__tests__/unit/main/ipc/handlers.unit.test.ts`

**Step 1: Update mock getAllApiKeys**

Change lines 157-165:
```typescript
  getAllApiKeys: vi.fn(() =>
    Promise.resolve({
      anthropic: mockApiKeys['anthropic'] || null,
      openai: mockApiKeys['openai'] || null,
      google: mockApiKeys['google'] || null,
      groq: mockApiKeys['groq'] || null,
      custom: mockApiKeys['custom'] || null,
    })
  ),
```
To:
```typescript
  getAllApiKeys: vi.fn(() =>
    Promise.resolve({
      anthropic: mockApiKeys['anthropic'] || null,
      openai: mockApiKeys['openai'] || null,
      google: mockApiKeys['google'] || null,
      xai: mockApiKeys['xai'] || null,
      custom: mockApiKeys['custom'] || null,
    })
  ),
```

**Step 2: Update test data around line 1018-1024**

Change:
```typescript
      mockApiKeys = {
        anthropic: 'sk-ant-12345678',
        openai: null,
        google: 'AIza1234567890',
        groq: null,
        custom: null,
      };
```
To:
```typescript
      mockApiKeys = {
        anthropic: 'sk-ant-12345678',
        openai: null,
        google: 'AIza1234567890',
        xai: null,
        custom: null,
      };
```

**Step 3: Run tests**

```bash
pnpm -F @accomplish/desktop test
```
Expected: PASS

**Step 4: Commit**

```bash
git add apps/desktop/__tests__/unit/main/ipc/handlers.unit.test.ts
git commit -m "test: update handlers unit tests for xai provider

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update Integration Tests - Secure Storage

**Files:**
- Modify: `apps/desktop/__tests__/integration/main/secureStorage.integration.test.ts`

**Step 1: Update getAllApiKeys test assertions**

Change lines 240-246:
```typescript
      expect(result).toEqual({
        anthropic: null,
        openai: null,
        google: null,
        groq: null,
        custom: null,
      });
```
To:
```typescript
      expect(result).toEqual({
        anthropic: null,
        openai: null,
        google: null,
        xai: null,
        custom: null,
      });
```

**Step 2: Update second getAllApiKeys test assertion (lines 347-353)**

Change:
```typescript
      expect(result).toEqual({
        anthropic: null,
        openai: null,
        google: null,
        groq: null,
        custom: null,
      });
```
To:
```typescript
      expect(result).toEqual({
        anthropic: null,
        openai: null,
        google: null,
        xai: null,
        custom: null,
      });
```

**Step 3: Run integration tests**

```bash
pnpm -F @accomplish/desktop test
```
Expected: PASS

**Step 4: Commit**

```bash
git add apps/desktop/__tests__/integration/main/secureStorage.integration.test.ts
git commit -m "test: update secureStorage integration tests for xai provider

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Integration Tests - Config Generator

**Files:**
- Modify: `apps/desktop/__tests__/integration/main/opencode/config-generator.integration.test.ts`

**Step 1: Review config-generator tests**

The test at line 162-165 checks that `enabled_providers` contains the providers. It currently checks for 'anthropic', 'openai', 'google'. After our change, 'xai' will be in the list instead of 'groq'.

Since the test only asserts that specific providers are present (not that groq is present), no changes are needed here unless there's a specific test for groq.

**Step 2: Run integration tests to verify**

```bash
pnpm -F @accomplish/desktop test
```
Expected: PASS (tests don't explicitly check for groq)

**Step 3: Commit (only if changes needed)**

If tests pass without changes, skip this commit.

---

## Task 12: Full Test Suite and Build Verification

**Step 1: Run full test suite**

```bash
pnpm test
```
Expected: All tests PASS

**Step 2: Run typecheck**

```bash
pnpm typecheck
```
Expected: No errors

**Step 3: Run lint**

```bash
pnpm lint
```
Expected: No errors

**Step 4: Run build**

```bash
pnpm build
```
Expected: Build succeeds

**Step 5: Final commit (if any remaining changes)**

```bash
git status
```

If there are any uncommitted changes:
```bash
git add -A
git commit -m "chore: fix any remaining groq to xai migration issues

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `packages/shared/src/types/provider.ts` | Add | xAI to ProviderType, Grok models to DEFAULT_PROVIDERS |
| `apps/desktop/src/main/store/secureStorage.ts` | Replace | 'groq' → 'xai' in ApiKeyProvider and getAllApiKeys |
| `apps/desktop/src/main/ipc/handlers.ts` | Replace | 'groq' → 'xai' in ALLOWED_API_KEY_PROVIDERS and validation |
| `apps/desktop/src/main/opencode/adapter.ts` | Replace | GROQ_API_KEY → XAI_API_KEY |
| `apps/desktop/src/main/opencode/config-generator.ts` | Replace | 'groq' → 'xai' in enabled_providers |
| `apps/desktop/src/preload/index.ts` | Replace | 'groq' → 'xai' in type signature |
| `apps/desktop/src/renderer/lib/accomplish.ts` | Replace | 'groq' → 'xai' in type signature |
| `apps/desktop/src/renderer/components/layout/SettingsDialog.tsx` | Replace | Add xAI provider, remove Groq from coming soon |
| `apps/desktop/__tests__/unit/main/ipc/handlers.unit.test.ts` | Replace | 'groq' → 'xai' in mocks |
| `apps/desktop/__tests__/integration/main/secureStorage.integration.test.ts` | Replace | 'groq' → 'xai' in assertions |

## xAI API Details

| Property | Value |
|----------|-------|
| Base URL | `https://api.x.ai` |
| Validation endpoint | `https://api.x.ai/v1/models` |
| Auth header | `Authorization: Bearer <key>` |
| API key prefix | `xai-` |
| Environment variable | `XAI_API_KEY` |
| Models | `grok-4` (256K), `grok-3` (131K) |
