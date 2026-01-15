# Settings Wizard Refinements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the settings wizard UX with renamed section, current model display, and improved post-selection behavior.

**Architecture:** Simple state additions and text changes in existing components. Add currentModel state to SettingsDialog, display it above wizard, and modify completion behavior to reset wizard instead of closing dialog.

**Tech Stack:** React, TypeScript

---

### Task 1: Rename "API Keys" to "My API Keys"

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/settings/ApiKeysSection.tsx:75`
- Test: `apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.integration.test.tsx`

**Step 1: Update the section title**

In `ApiKeysSection.tsx`, change line 75 from:
```tsx
<h2 className="mb-4 text-base font-medium text-foreground">API Keys</h2>
```
to:
```tsx
<h2 className="mb-4 text-base font-medium text-foreground">My API Keys</h2>
```

**Step 2: Update test assertion**

In `ApiKeysSection.integration.test.tsx`, update the test that checks for "API Keys" to check for "My API Keys":
```tsx
expect(screen.getByText('My API Keys')).toBeInTheDocument();
```

**Step 3: Run tests**

Run: `pnpm test --filter=@accomplish/desktop -- ApiKeysSection`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/ApiKeysSection.tsx apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.integration.test.tsx
git commit -m "refactor: rename API Keys section to My API Keys"
```

---

### Task 2: Add Current Model Display Section

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/SettingsDialog.tsx`
- Modify: `apps/desktop/src/renderer/components/layout/settings/ChooseModelType.tsx`

**Step 1: Add currentModel state and fetch in SettingsDialog.tsx**

Add state after line 43:
```tsx
const [currentModel, setCurrentModel] = useState<{ provider: string; model: string } | null>(null);
```

Add fetch function in useEffect after fetchVersion (around line 86):
```tsx
const fetchCurrentModel = async () => {
  try {
    const model = await accomplish.getSelectedModel();
    setCurrentModel(model);
  } catch (err) {
    console.error('Failed to fetch current model:', err);
  }
};
```

Call it after fetchVersion():
```tsx
fetchCurrentModel();
```

**Step 2: Pass currentModel to ChooseModelType**

Update the ChooseModelType usage in renderWizardStep (around line 182):
```tsx
case 'choose-type':
  return <ChooseModelType onSelect={handleModelTypeSelect} currentModel={currentModel} />;
```

**Step 3: Update ChooseModelType component to display current model**

In `ChooseModelType.tsx`, update the interface:
```tsx
interface ChooseModelTypeProps {
  onSelect: (type: ModelType) => void;
  currentModel?: { provider: string; model: string } | null;
}
```

Update the component signature:
```tsx
export default function ChooseModelType({ onSelect, currentModel }: ChooseModelTypeProps) {
```

Add current model display at the top of the return, before the "Choose Model" heading:
```tsx
return (
  <div className="space-y-4">
    {currentModel && (
      <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Model</div>
        <div className="text-sm font-medium text-foreground">{currentModel.model}</div>
      </div>
    )}
    <h2 className="text-lg font-medium text-foreground">Choose Model</h2>
    ...
```

**Step 4: Run tests**

Run: `pnpm test --filter=@accomplish/desktop`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/SettingsDialog.tsx apps/desktop/src/renderer/components/layout/settings/ChooseModelType.tsx
git commit -m "feat: add current model display above wizard"
```

---

### Task 3: Change Post-Selection Behavior (Stay on Settings, Don't Close)

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/SettingsDialog.tsx:135-141`

**Step 1: Modify handleModelDone to reset wizard instead of closing**

Change the handleModelDone function from:
```tsx
const handleModelDone = (modelName: string) => {
  setCompletionMessage(`Model set to ${modelName}`);
  // Close dialog after brief delay
  setTimeout(() => {
    onOpenChange(false);
  }, 1500);
};
```

to:
```tsx
const handleModelDone = async (modelName: string) => {
  setCompletionMessage(`Model set to ${modelName}`);
  // Refresh current model
  const accomplish = getAccomplish();
  const model = await accomplish.getSelectedModel();
  setCurrentModel(model);
  // Reset wizard after showing success message (2.5s instead of 1.5s)
  setTimeout(() => {
    setCompletionMessage(null);
    setWizardStep('choose-type');
    setSelectedModelType(null);
    setSelectedProvider(null);
  }, 2500);
};
```

**Step 2: Run tests**

Run: `pnpm test --filter=@accomplish/desktop`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/SettingsDialog.tsx
git commit -m "feat: stay on settings page after model selection with 2.5s popup"
```

---

### Task 4: Update SettingsDialog Tests

**Files:**
- Modify: `apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

**Step 1: Update test assertions that expect dialog to close**

Find any tests that check for `onOpenChange(false)` after model selection and update them to instead check that the wizard resets.

**Step 2: Add test for current model display**

Add a new test:
```tsx
it('should display current model when one is set', async () => {
  // Arrange
  mockGetSelectedModel.mockResolvedValue({ provider: 'anthropic', model: 'claude-opus-4-5' });
  render(<SettingsDialog {...defaultProps} />);

  // Assert
  await waitFor(() => {
    expect(screen.getByText('Current Model')).toBeInTheDocument();
    expect(screen.getByText('claude-opus-4-5')).toBeInTheDocument();
  });
});
```

**Step 3: Run all tests**

Run: `pnpm test --filter=@accomplish/desktop`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx
git commit -m "test: update tests for new settings wizard behavior"
```

---

### Task 5: Final Verification

**Step 1: Run full test suite**

Run: `pnpm test --filter=@accomplish/desktop`
Expected: All tests PASS

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Manual verification (optional)**

Run: `pnpm dev`
Verify:
1. "My API Keys" section title shows correctly
2. Current model displays above Cloud/Local choice
3. After selecting a model, success message shows for 2.5s
4. After success, wizard resets to choose-type instead of closing dialog
