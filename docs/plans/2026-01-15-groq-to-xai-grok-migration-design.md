# Design: Replace Groq with xAI Grok Provider

**Date:** 2026-01-15
**Status:** Approved

## Overview

Replace Groq model provider with xAI's Grok models throughout the Openwork desktop application.

## Background

- **Groq** (groq.com) - Fast inference hardware company, currently integrated but disabled ("Coming Soon")
- **xAI Grok** (x.ai) - xAI's AI models, OpenAI-compatible API

## Migration Details

| Aspect | Groq (remove) | xAI Grok (add) |
|--------|---------------|----------------|
| Provider ID | `groq` | `xai` |
| Display name | Groq | xAI (Grok) |
| API endpoint | `api.groq.com/openai/v1/models` | `api.x.ai/v1/models` |
| Env var | `GROQ_API_KEY` | `XAI_API_KEY` |
| Key prefix | (none) | `xai-` |
| Models | - | `grok-4` (256K), `grok-3` (131K) |

## Files to Modify

### Source Files (8)

1. **`packages/shared/src/types/provider.ts`**
   - Change `ApiKeyProvider` type: `'groq'` → `'xai'`
   - Add xAI to `DEFAULT_PROVIDERS` with Grok models

2. **`apps/desktop/src/main/ipc/handlers.ts`**
   - Update `ALLOWED_API_KEY_PROVIDERS`: `'groq'` → `'xai'`
   - Change validation endpoint to `https://api.x.ai/v1/models`

3. **`apps/desktop/src/main/opencode/adapter.ts`**
   - Change `GROQ_API_KEY` → `XAI_API_KEY` environment variable

4. **`apps/desktop/src/main/opencode/config-generator.ts`**
   - Change `'groq'` → `'xai'` in `enabled_providers`

5. **`apps/desktop/src/main/store/secureStorage.ts`**
   - Update `ApiKeyProvider` type
   - Change key retrieval from `'groq'` to `'xai'`

6. **`apps/desktop/src/preload/index.ts`**
   - Update `addApiKey()` type signature

7. **`apps/desktop/src/renderer/lib/accomplish.ts`**
   - Update type signature

8. **`apps/desktop/src/renderer/components/layout/SettingsDialog.tsx`**
   - Add xAI to `API_KEY_PROVIDERS` with `xai-` prefix
   - Remove from `COMING_SOON_PROVIDERS`

### Test Files (4)

1. **`apps/desktop/__tests__/unit/main/ipc/handlers.unit.test.ts`**
   - Update mocks for xAI provider

2. **`apps/desktop/__tests__/integration/main/store/appSettings.integration.test.ts`**
   - Update model selection tests

3. **`apps/desktop/__tests__/integration/main/store/secureStorage.integration.test.ts`**
   - Update `getAllApiKeys()` tests

4. **`apps/desktop/__tests__/integration/main/opencode/config-generator.integration.test.ts`**
   - Update `enabled_providers` tests

## Implementation Details

### Type Changes (`provider.ts`)

```typescript
// ApiKeyProvider type
type ApiKeyProvider = 'anthropic' | 'openai' | 'google' | 'xai' | 'custom';

// New xAI provider in DEFAULT_PROVIDERS
{
  id: 'xai',
  name: 'xAI',
  models: [
    { id: 'grok-4', name: 'Grok 4', contextWindow: 256000 },
    { id: 'grok-3', name: 'Grok 3', contextWindow: 131000 },
  ],
  requiresApiKey: true,
  apiKeyEnvVar: 'XAI_API_KEY',
  baseUrl: 'https://api.x.ai',
}
```

### Validation Endpoint (`handlers.ts`)

```typescript
case 'xai':
  response = await fetchWithTimeout(
    'https://api.x.ai/v1/models',
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${sanitizedKey}` },
    },
    API_KEY_VALIDATION_TIMEOUT_MS
  );
  break;
```

### Environment Variable (`adapter.ts`)

```typescript
if (apiKeys.xai) {
  env.XAI_API_KEY = apiKeys.xai;
  console.log('[OpenCode CLI] Using xAI API key from settings');
}
```

### UI Settings (`SettingsDialog.tsx`)

```typescript
const API_KEY_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', prefix: 'sk-ant-', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', placeholder: 'sk-...' },
  { id: 'google', name: 'Google AI', prefix: 'AIza', placeholder: 'AIza...' },
  { id: 'xai', name: 'xAI (Grok)', prefix: 'xai-', placeholder: 'xai-...' },
] as const;

// Remove 'groq' from COMING_SOON_PROVIDERS entirely
```

## References

- [xAI API Documentation](https://docs.x.ai/docs/overview)
- [xAI Models](https://docs.x.ai/docs/models)
- [OpenCode xAI Provider](https://opencode.ai/docs/providers/)
- [OpenCode xAI Integration PR](https://github.com/opencode-ai/opencode/pull/307)
