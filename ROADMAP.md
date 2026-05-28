# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### BUGS

-

### 1. Seperate channel metadata

- **Goal:** Create seperate metadata fields for inputs, like mic, stand, notes (all of them strings)
- **Tasks:**
  - Create new data for inputs only, where there are seperate fields for:
    - mic
    - stand
    - other notes
  - Create inputs for these in the edit patch modal.
  - Make it so that if a field is empty, it is not displayed in the patch view.
- **Questions:**
  - How should we display the data? Just MIC | Stand | Notes (concatenated), or by icons or how would you recommend?

### 2. Snippets

- **Goal:** Quickly insert data, like 8 drum channels from a snippet list into the patch

### 3. Table View (Read-Only)

- **Goal:** A spreadsheet-style list view of all patch data.
- **Tasks:**
  - Create a new view mode accessible via the View Switcher.
  - Columns should include: Main IO, SubSnake IO, Group, Channel, Mic/DI type, Stand type, Notes.
  - _Constraint:_ This view will be **read-only** in the first iteration.

### 4. URL sharing

- **Goal:** Allow users to share their patch data via a URL.
- **Tasks:**
  - Create a URL sharing system.
  - Allow users to share their patch data via a URL.

### 5. Monitor level template

- **Goal:** Allow users to set a monitor levels for each channel per monitor send.
