# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### 4. Multi select refinements

- Multi-select is now broken, clicking something selects then instantly deselects it
- implement drag to select (painting selection)
- Implement mass assign to subsnake (incrementally from selection)
  - Planned event flow:
    - User selects channels 4-8 and 10
    - User clicks "assign to subsnake" button
    - User chooses subsnake
    - User selects first channel in subsnake (e.g. #6)
    - Channels mapped: main4->sub1, main5->sub2, main6->sub3, main7->sub4, main8->sub5, main10->sub6
    - Warning, if mapping overwrites already mapped channels
- Implement mass group and color assign

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

---

## 🚀 In Progress

_(None currently active)_

---

## ✅ Completed

### 4. SubSnake Support (Data Layer & UI Mapping)

- **Goal:** Allow users to map main snake inputs to physical subsnakes on stage.
- **Status:** Integrated data models, management modals, dynamic size auto-grid pickers, paint-select gestures, and bulk mapping displacements.
