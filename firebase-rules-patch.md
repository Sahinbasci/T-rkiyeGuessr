# Firebase RTDB Rules Patch — meta/serverNow

## What This Changes
Adds a `meta` node under `rooms/$roomId` that allows the host to write `serverNow` using `serverTimestamp()`. The watchdog (Effect 6) reads this for server-authoritative elapsed time calculation.

## Exact Change
Add the following block BEFORE the `"$other"` catch-all rule (currently line 108):

```json
"meta": {
  "serverNow": {
    ".validate": "newData.parent().parent().child('hostId').val() == auth.uid"
  }
},
```

### Where to Insert
Between `"roundEndLock"` (line 104-106) and `"$other"` (line 108-110):

```
        "roundEndLock": {
          ... (existing)
        },

        "meta": {
          "serverNow": {
            ".validate": "newData.parent().parent().child('hostId').val() == auth.uid"
          }
        },

        "$other": {
          ".validate": false
        },
```

## Rule Explanation

- `newData.parent().parent().child('hostId').val() == auth.uid`
  - `newData` = the serverNow value being written
  - `.parent()` = meta node
  - `.parent()` = room node ($roomId)
  - `.child('hostId')` = post-write hostId
  - This ensures only the current host can write serverNow
- No `.read` rule needed — reads are inherited from `$roomId` level (`auth != null`)
- `serverTimestamp()` produces a number value — `newData.parent().parent()` correctly navigates from the serverNow field up to the room level
- No `newData.isNumber()` check needed — `serverTimestamp()` resolves to a number at the server, and the validate rule runs post-resolution

## Why serverTimestamp() Works
Firebase RTDB's `serverTimestamp()` sends `{".sv": "timestamp"}` which the server resolves to the current Unix timestamp (a number) BEFORE validate rules run. So `newData.parent().parent().child('hostId')` sees the resolved state.

## Deployment Checklist
1. Open Firebase Console → Realtime Database → Rules
2. Add the `"meta"` block between `"roundEndLock"` and `"$other"`
3. Click "Publish"
4. Verify in Rules Playground:
   - Auth: uid = (host's uid)
   - Location: rooms/TESTID/meta/serverNow
   - Type: write
   - Data: 1707700000000 (any number)
   - Should: ALLOW
5. Verify non-host write is DENIED:
   - Auth: uid = (non-host uid)
   - Same location
   - Should: DENY
6. Verify watchdog logs show "server" instead of "client time fallback":
   - Start a game, wait for watchdog tick during "playing"
   - Console should show: `[MP] Watchdog using server time` (no fallback warning)

## Rollback
Remove the `"meta"` block. Watchdog falls back to `Date.now()` automatically.
