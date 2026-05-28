# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### BUGS

-

### 0. Choose what to print

- Settings to choose what to print. Options:
  - Input grid
  - Output grid
  - Subsnakes (selectable subsnakes)
  - Table view: input
  - Table view: output

### 1. Snippets

- **Goal:** Quickly insert data, like 8 drum channels from a snippet list into the patch

### 2. Table View (Read-Only)

- **Goal:** A spreadsheet-style list view of all patch data.
- **Tasks:**
  - Create a new view mode accessible via the View Switcher.
  - Columns should include: A block of color, Main IO, SubSnake IO, Group, Channel, Mic/DI type, Stand type, Notes.
  - _Constraint:_ This view will be **read-only** in the first iteration.

### 3. URL sharing

- **Goal:** Allow users to share their patch data via a URL.
- **Tasks:**
  - Create a URL sharing system.
  - Allow users to share their patch data via a URL.

### 4. Monitor level template

- **Goal:** Allow users to set a monitor levels for each channel per monitor send.

### 5. Multiple top-level IO boxes
