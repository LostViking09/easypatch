# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### 4. SubSnake Support (Data Layer)
- **Goal:** Allow users to map main snake inputs to physical subsnakes on stage.
- **Tasks:**
  - Allow users to create and name SubSnakes (the system will auto-generate internal IDs so the user doesn't have to).
  - Add fields to the `Channel` type to track which SubSnake it belongs to, and what channel number it is on that SubSnake.

### 5. SubSnake View Excerpt (Read-Only)
- **Goal:** Provide a custom visual layout for specific subsnakes.
- **Tasks:**
  - Build a View Switcher (Main Grid vs SubSnakes).
  - Allow defining custom grid layouts (e.g., 3x4, 2x4) for a SubSnake.
  - *Constraint:* This view will be **read-only** in the first iteration to simplify implementation. It will just display the data mapped in the main view.

### 6. Table View (Read-Only)
- **Goal:** A spreadsheet-style list view of all patch data.
- **Tasks:**
  - Create a new view mode accessible via the View Switcher.
  - Columns should include: Main IO, SubSnake IO, Group, Channel, Mic/DI type, Stand type, Notes.
  - *Constraint:* This view will be **read-only** in the first iteration. 

---

## 🚀 In Progress
*(None currently active)*
