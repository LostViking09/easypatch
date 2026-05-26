---
trigger: always_on
description: Core architectural and coding guidelines for the EasyPatch project
---

# EasyPatch Code Guide

## 1. Tech Stack & Tools
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (Strict mode)
- **Icons**: `lucide-react`
- **Animations**: `motion`

## 2. Refactoring Directives
- **Rule #1**: Break down large components. Aim for components under 150-200 lines.
- **Rule #2**: Separate concerns. UI components should only handle presentation. Business logic and state should be extracted.
- **Rule #3**: Do not introduce new libraries for state management unless explicitly requested; use React's built-in hooks first.

## 3. Target Directory Structure
Please adhere to this structure when creating new files or moving existing ones:
- `src/components/`: Reusable, purely presentational UI components (e.g., Button, Modal, Card).
- `src/features/`: Domain-specific, complex components (e.g., PatchGrid, FastInputPanel).
- `src/hooks/`: Custom React hooks for encapsulating state and side effects.
- `src/services/`: External integrations (e.g., Google GenAI API logic).
- `src/types/`: Shared TypeScript interfaces and types (e.g., Patch item definitions).
- `src/utils/`: Pure helper functions and application constants.

## 4. Styling Conventions
- Strictly use **Tailwind CSS v4** utility classes for styling. 
- Avoid inline styles (`style={{...}}`) or external CSS files (other than the main `index.css`).
- Construct dynamic classes carefully (e.g., using template literals or a utility like `clsx`/`tailwind-merge` if available).

## 5. TypeScript & Best Practices
- Avoid using `any`. Define proper interfaces for all props, state, and API responses.
- Prefix boolean variables/state with `is`, `has`, or `should` (e.g., `isSidebarOpen`, `hasChanges`).
- Extract complex `useEffect` logic or API calls into custom hooks to keep component bodies clean and readable.