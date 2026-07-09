# V1 Implementation Plan

This version stays framework-free and offline-first.

## Files

- `index.html` - app shell and layout
- `styles.css` - visual system and responsive layout
- `app.js` - state, editor CRUD, preview logic, local storage
- `manifest.webmanifest` - PWA metadata
- `service-worker.js` - offline caching
- `README.md` - project overview and run notes

## Build Order

### 1. App shell

Goal:
- create the static page layout for the session list, editor, and preview

Deliverables:
- header with primary actions
- left sidebar for sessions
- center editor for blocks and steps
- right preview panel

### 2. Session model

Goal:
- support saved sessions in browser local storage

Deliverables:
- default sample session
- create session
- rename session
- switch selected session

### 3. Block editor

Goal:
- manage repeatable blocks inside a session

Deliverables:
- add block
- rename block
- set repeat count
- duplicate block
- remove block

### 4. Step editor

Goal:
- edit individual timed steps in each block

Deliverables:
- add step
- rename step
- edit step duration
- edit color, sound, vibration, and note
- duplicate step
- remove step

### 5. Flattened chain preview

Goal:
- show the exact execution order produced by repeated blocks

Deliverables:
- render each step in play order
- show round number for repeated blocks
- show block and step names together

### 6. Timer player

Goal:
- turn the chain into a live playback experience

Deliverables:
- start, pause, resume
- next and previous step
- finish state
- progress display

### 7. PWA polish

Goal:
- make the app installable and usable offline

Deliverables:
- manifest
- service worker
- offline cache
- app-like launch behavior

## Non-Goals For V1

- user accounts
- cloud sync
- shared sessions
- nested repeat blocks
- backend API

