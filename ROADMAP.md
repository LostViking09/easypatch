# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### BUGS

### 🟡 Refactoring Recommendations

#### 1. **[App.tsx](file:///c:/Users/boton/Projects/easypatch/src/App.tsx) is too large (708 lines)**

This `Editor` component is a god component. It manages ~25 `useState` calls, handles printing, URL sharing, navigation, creation, import, keyboard shortcuts, and renders the entire layout. Per your own code-guide rule ("#1: aim for under 150-200 lines"), this is 3.5× over budget.

Suggested extractions:

- **Print logic** → `usePrint()` hook (lines 89–178): `isPrintModalOpen`, `printOptions`, `isPrinting`, `printTrigger`, `handleConfirmPrint`, and the print `useEffect`
- **Share logic** → `useShare()` hook (lines 94–215): `isShareModalOpen`, `shareUrl`, `handleShare`, URL hash import logic, `sharedPatchData`
- **Print view JSX** → `<PrintRenderer />` component (lines 493–630): That massive print render block
- **Modal open/close state** → A single `useModalState()` reducer or record, rather than 10+ individual booleans

#### 2. **[usePatchState.ts](file:///c:/Users/boton/Projects/easypatch/src/hooks/usePatchState.ts) is too large (742 lines)**

The `saveEdit` function alone is ~220 lines of stereo link bookkeeping. Extract:

- `saveStereoEdit()` → Pure function handling stereo link logic
- `handleUpdateStageboxes` → Could be its own `useStageboxManagement()` hook
- `handleCreateNewProject` (line 489) looks like dead code — `App.tsx` has its own `handleNewPatch` that duplicates this logic

#### 3. **[SubSnakesModal.tsx](file:///c:/Users/boton/Projects/easypatch/src/components/SubSnakesModal.tsx) (740 lines)** and **[EditModal.tsx](file:///c:/Users/boton/Projects/easypatch/src/components/EditModal.tsx) (771 lines)**

Both are way over the 200-line guideline. The create-form, list, and delete-confirm dialog in SubSnakesModal could each be their own component. The SubSnake port grid and the group combobox in EditModal are reusable extraction candidates.

#### 4. **Excessive use of `any`**

[AppModals.tsx](file:///c:/Users/boton/Projects/easypatch/src/features/Modals/AppModals.tsx) has `any` in its props interface (lines 23–28, 54–57). `usePatchState.ts` uses `any` for its setter callbacks (lines 54, 61, 68, 75). This violates the code guide rule "Avoid using `any`."

#### 5. **Color picker pattern is copy-pasted 3+ times**

The custom color picker UI (palette swatches + pipette `<input type="color">`) is nearly identical in:

- `SubSnakesModal.tsx` (twice — create and edit forms)
- `AssignSubSnakeModal.tsx`
- `EditModal.tsx`

This should be a reusable `<ColorPicker palette={...} value={...} onChange={...} />` component.

#### 6. **`package.json` has misplaced dependencies**

`vite`, `@tailwindcss/vite`, and `@vitejs/plugin-react` are build-time tools listed under `dependencies` instead of `devDependencies`. Also `dotenv` and `express` are production deps but seem like they might be for a server script — they bloat the dependency tree if unused at runtime.

---

### 1. Better StageBox size presets

- **Goal:** Replace stagebox size presets with usual stageboxes from different brands.
- **Presets to add:**

### 2. Snippets

- **Goal:** Quickly insert data, like 8 drum channels from a snippet list into the patch

### 3. Monitor level template

- **Goal:** Allow users to set a monitor levels for each channel per monitor send.

### 4. Multiple top-level IO boxes

```

```
