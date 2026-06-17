# Firebase Room Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add room expiry, low-frequency cleanup, and immediate room deletion for closed/empty Firebase rooms without changing gameplay rules or reading the full `rooms` list during normal multiplayer sync.

**Architecture:** Keep all changes inside `app.js`. Add shared room-lease helpers (`createdAt`, `updatedAt`, `expiresAt`), wire them into the existing room write paths, and add one bounded cleanup query that only scans expired rooms by `expiresAt` and deletes at most 20 at a time.

**Tech Stack:** Browser-side JavaScript in `app.js`, Firebase Realtime Database queries and updates, lightweight verification with local script parsing/checks.

---

### Task 1: Add shared room lease and cleanup helpers

**Files:**
- Modify: `C:\Users\H\Documents\桌游\app.js`

- [ ] Add constants for room TTL, cleanup batch size, and cleanup cooldown.
- [ ] Add helpers that return `{ updatedAt, expiresAt }` and apply the same lease fields to room objects built in memory.
- [ ] Add `async function cleanupExpiredRooms()` that queries `rooms` with `orderByChild("expiresAt").endAt(Date.now()).limitToFirst(20)`, skips the current room, skips recently updated rooms, and deletes only the matched expired rooms.
- [ ] Add a small wrapper/guard so cleanup stays low-frequency and does not block normal per-turn sync.

### Task 2: Extend room lifetime on important room writes

**Files:**
- Modify: `C:\Users\H\Documents\桌游\app.js`

- [ ] Add `createdAt`, `updatedAt`, and `expiresAt` when creating a room.
- [ ] Extend `updatedAt` and `expiresAt` on important lobby/game actions: join room, ready toggle, board selection/random board, AI add/remove/difficulty, kick, chat send, action confirm, host sync/round resolution, overseas-trade choice, end-game science choice, return to room, and lobby leave-host transfer.
- [ ] Make sure in-memory room rebuilds such as `prepareMultiplayerGameRoom(...)` and `returnToOnlineRoom(...)` also carry forward `expiresAt`.

### Task 3: Delete rooms immediately when they are truly closed

**Files:**
- Modify: `C:\Users\H\Documents\桌游\app.js`

- [ ] Change host room close to remove `rooms/{roomCode}` directly instead of writing `status: "closed"` first.
- [ ] Keep the existing “all players left” path deleting the room root immediately when no players remain.
- [ ] Preserve the current local UI exit behavior after deletion so players still return to the online entry screen cleanly.

### Task 4: Trigger cleanup only at low-frequency host-safe entry points

**Files:**
- Modify: `C:\Users\H\Documents\桌游\app.js`

- [ ] Trigger one low-frequency cleanup attempt when opening the online page.
- [ ] Trigger one cleanup attempt before the host creates a room.
- [ ] Trigger one cleanup attempt after the host returns a finished game back to the lobby.
- [ ] Do not trigger cleanup from per-turn sync, normal join flow, or ordinary player actions.

### Task 5: Verify behavior and prepare Firebase rules note

**Files:**
- Modify: `C:\Users\H\Documents\桌游\app.js`

- [ ] Re-run the baseline checks and confirm they flip from failing to passing.
- [ ] Parse `app.js` to ensure syntax stays valid.
- [ ] Check the source text for the expected markers: `expiresAt` on room writes, bounded expired-room query, skip-current-room guard, and direct `roomRef.remove()` on close.
- [ ] Report the Realtime Database rules merge snippet for `.indexOn: ["expiresAt"]` without overwriting the user’s existing rules.
