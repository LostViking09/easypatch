# EasyPatch Code Guide

## 1. Tech Stack & Tools
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (Strict mode)
- **Icons**: `lucide-react`
- **Animations**: `motion`

## 2. Refactoring & Component Size Directives
- **Rule #1 (Size Limit)**: Break down large components. Aim for components strictly under 150-250 lines. Files should never exceed 300 lines without a very good architectural reason.
- **Rule #2 (Separation of Concerns)**: UI components should only handle presentation. Business logic and state management should be extracted into separate hooks or context providers.
- **Rule #3 (State Management)**: Do not introduce new libraries for state management unless explicitly requested; use React's built-in hooks first.
- **Rule #4 (Modal Management)**: Group modals into container components (like `AppModals.tsx`) rather than cluttering main page layouts.
- **Rule #5 (Custom Hooks)**: Any complex local state (e.g., drag-to-select logic, timeouts for toasts) MUST be extracted into custom hooks within `src/hooks/`.

## 3. Target Directory Structure
Please adhere to this structure when creating new files or moving existing ones:
- `src/components/`: Reusable, purely presentational UI components (e.g., Button, Modal, Card).
- `src/features/`: Domain-specific, complex components and specific sections of the app (e.g., `Header`, `PatchGrid`, `MultiEditBar`, `Modals`). Always use dedicated feature folders.
- `src/hooks/`: Custom React hooks for encapsulating state and side effects (e.g., `useMultiSelect`, `usePatchState`, `useToast`).
- `src/services/`: External integrations (e.g., API/local-first sync logic).
- `src/types/`: Shared TypeScript interfaces and types (e.g., Patch item definitions).
- `src/utils/`: Pure helper functions and application constants.

## 4. Styling Conventions
- Strictly use **Tailwind CSS v4** utility classes for styling. 
- Avoid inline styles (`style={{...}}`) or external CSS files (other than the main `index.css`). Inline styles are only permissible for deeply dynamic properties (e.g. CSS Grid calculated columns) or complex print hacks.
- Construct dynamic classes carefully (e.g., using template literals or a utility like `clsx`/`tailwind-merge` if available).

## 5. TypeScript & Best Practices
- Avoid using `any`. Define proper interfaces for all props, state, and API responses.
- Prefix boolean variables/state with `is`, `has`, or `should` (e.g., `isSidebarOpen`, `hasChanges`).
- Extract complex `useEffect` logic or API calls into custom hooks to keep component bodies clean and readable.
