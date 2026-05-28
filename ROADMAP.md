# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### 1. App.tsx refactor

- It's obviously too large again

### 5. SubSnake View Excerpt (Read-Only)

- **Goal:** Provide a custom visual layout for specific subsnakes.
- **Tasks:**
  - Build a View Switcher (Main Grid vs SubSnakes).
  - Allow defining custom grid layouts (e.g., 3x4, 2x4) for a SubSnake.
  - _Constraint:_ This view will be **read-only** in the first iteration to simplify implementation. It will just display the data mapped in the main view.

### 6. Table View (Read-Only)

- **Goal:** A spreadsheet-style list view of all patch data.
- **Tasks:**
  - Create a new view mode accessible via the View Switcher.
  - Columns should include: Main IO, SubSnake IO, Group, Channel, Mic/DI type, Stand type, Notes.
  - _Constraint:_ This view will be **read-only** in the first iteration.

### 7. URL sharing

- **Goal:** Allow users to share their patch data via a URL.
- **Tasks:**
  - Create a URL sharing system.
  - Allow users to share their patch data via a URL.
