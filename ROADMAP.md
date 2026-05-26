# EasyPatch Roadmap & Backlog

This document serves as the central repository for planned features, refined ideas, and future architecture plans. When starting a new feature, pick one from this list, create a specific Implementation Plan, and move it to "In Progress".

## 📦 Backlog

### 1. UI/UX Polish (Framer Motion)
- **Goal:** Add subtle, fast animations using Framer Motion to make the app feel premium without slowing down the user workflow.
- **Tasks:**
  - Implement `<motion.div layout>` for grid items so they rearrange smoothly during drag-and-drop.
  - Add very fast (e.g., 50-100ms) micro-interactions for modals and buttons.
  - *Constraint:* Never artificially increase wait times; workflow speed is the #1 priority.

### 2. Smart Grouping Rework
- **Goal:** Improve the UI for selecting existing groups and prioritize neighbor groups.
- **Tasks:**
  - Replace the native `<datalist>` in the Edit Modal with a custom Combobox/Dropdown.
  - *Logic:* When opening the dropdown, check the channel immediately before and after the currently selected channel. If they have groups, push those group names to the top of the suggestion list.
  - Ensure users can still easily type to create brand new groups.

### 3. Grid Limits & Safe Resizing
- **Goal:** Allow grid sizes up to 128 inputs, support one-sided patches, and prevent data loss on resize.
- **Tasks:**
  - Increase input box limit to 128.
  - Allow creating patches with *only* inputs or *only* outputs (e.g., 0 inputs).
  - Refactor "New Project" into "Resize Grid".
  - *Logic:* When resizing, map existing channel data to the new grid. If the new grid is smaller and data falls out of bounds, warn the user before proceeding.

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

### 7. Stereo Channel Support
- **Goal:** Visually and functionally link stereo pairs without hacking the "Group" system.
- **Tasks:**
  - Add `stereoLink` (next/prev) to the `Channel` type.
  - Visually link the cells in the grid (e.g., a bracket `[`).
  - Ensure stereo pairs inherit group appearances together.
  - *Warning Logic:* If a user tries to link an even channel to the next odd channel (e.g., Ch 2 to Ch 3), show a non-blocking warning that consoles usually require odd+even pairings (e.g., 1-2, 3-4).

---

## 🚀 In Progress
*(None currently active)*

## ✅ Completed
- Remove AI Integration (offline-first, removed `@google/genai` dependency and configuration).
- Refactor `App.tsx` into modular hooks and components.
