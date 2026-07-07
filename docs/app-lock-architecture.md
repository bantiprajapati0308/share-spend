# ShareSpend App Lock Architecture

## 1. Folder Structure

```text
src/
  components/security/
    AutoLockSelector.jsx
    ConfirmPin.jsx
    CreatePin.jsx
    ForgotPinModal.jsx
    LockScreen.jsx
    PinDots.jsx
    PinPad.jsx
    SecurityCard.jsx
    Security.module.scss
  context/
    SecurityContext.jsx
  hooks/
    useActivityTracker.js
    useAppLock.js
    useAutoLock.js
    usePinVerification.js
    useSessionLock.js
    useVisibilityTracker.js
  pages/settings/security/
    SecuritySettings.jsx
  routes/
    ProtectedRoute.jsx
  services/security/
    activity.service.js
    hash.service.js
    pin.service.js
    security.service.js
    session.service.js
```

## 2. Firestore Schema

```text
users/{uid}/settings/security
```

```js
{
  enabled: false,
  pinHash: "",
  pinLength: 4,
  autoLockAfter: 60,
  lockOnRefresh: true,
  lockOnTabHidden: true,
  failedAttempts: 0,
  lockUntil: null,
  requirePasswordForReset: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

PIN, hash, and salt are never stored in browser storage. Runtime values are limited to `sessionStorage`: `appUnlocked`, `unlockTime`, `lastBackgroundTime`, and `lastActivityTime`.

## 3. Complete Flow Diagrams

Enable Lock:

```text
Security Settings
  -> Enable switch
  -> Create PIN
  -> Confirm PIN
  -> hashPin(pin, uid)
  -> write users/{uid}/settings/security
  -> reset failedAttempts and lockUntil
  -> session unlocked
  -> dashboard available
```

Disable Lock:

```text
Security Settings
  -> Disable App Lock
  -> update security.enabled = false
  -> clear pinHash, failedAttempts, lockUntil
  -> clear session runtime keys
  -> dashboard remains available
```

Unlock:

```text
App locked
  -> User enters 4 digit PIN
  -> verifyPin(uid, pin)
  -> compare hashed input with Firestore pinHash
  -> success?
      yes -> reset failedAttempts -> sessionService.unlock() -> dashboard
      no  -> increment failedAttempts -> possibly set lockUntil -> lock screen
```

Forgot PIN:

```text
Lock Screen
  -> Forgot PIN
  -> Enter Firebase password
  -> reauthenticateWithCredential()
  -> Create new PIN
  -> Confirm new PIN
  -> hash and save pinHash
  -> reset failedAttempts and lockUntil
  -> session unlocked
```

Auto Lock:

```text
App unlocked
  -> activity tracker records mouse/keyboard/touch/scroll
  -> interval compares Date.now() - lastActivityTime
  -> greater than autoLockAfter?
      yes -> sessionService.lock() -> Lock Screen
      no  -> continue
```

Session Lock:

```text
Manual Lock Now or controller lock()
  -> remove appUnlocked and unlockTime
  -> set isLocked true
  -> render LockScreen before app routes
```

Background Lock:

```text
visibilitychange hidden or window blur
  -> store lastBackgroundTime
window focus or visible
  -> compare elapsed time with autoLockAfter
  -> elapsed exceeded and lockOnTabHidden enabled?
      yes -> lock
      no  -> refresh lastActivityTime
```

Refresh Lock:

```text
App bootstrap
  -> read Firestore security settings
  -> enabled?
      no  -> app
      yes -> navigation type is reload and lockOnRefresh?
          yes -> lock screen
          no  -> read sessionStorage appUnlocked
              true -> app
              false -> lock screen
```

## 4. Context Design

`SecurityContext` owns the controller state: `settings`, `isLocked`, `isLoading`, and `error`. It exposes `unlock()`, `lock()`, `verifyPin()`, `enableLock()`, `disableLock()`, `changePin()`, `resetPin()`, `updateAutoLock()`, `updatePreferences()`, and `refreshSettings()`.

## 5. Hook Design

`useAppLock()` reads context. `useSessionLock()` maps lock/unlock to `sessionStorage`. `useActivityTracker()` handles inactivity. `useVisibilityTracker()` handles background, focus, blur, and tab visibility. `useAutoLock()` composes inactivity locking. `usePinVerification()` is available for focused PIN verification screens.

## 6. Service Layer

`security.service.js` is the Firestore API boundary. `hash.service.js` uses Web Crypto PBKDF2-SHA-256. `session.service.js` is the only browser runtime storage boundary. `pin.service.js` owns PIN validation and input helpers. `activity.service.js` owns timing helpers.

## 7. Controller Logic

```text
App Start
  -> Firebase Auth resolved
  -> SecurityProvider reads Firestore
  -> App Lock enabled?
      no  -> ProtectedRoute renders app
      yes -> Check refresh policy and sessionStorage
          unlocked session allowed -> app
          otherwise -> LockScreen
```

## 8. React Components

Reusable security components are `PinPad`, `PinDots`, `CreatePin`, `ConfirmPin`, `ForgotPinModal`, `AutoLockSelector`, `SecurityCard`, and `LockScreen`.

## 9. UI Pages

`SecuritySettings.jsx` provides Enable Switch, PIN status, Auto Lock bottom sheet, Change PIN, Lock Now, refresh/background toggles, and Disable Lock.

## 10. Routing

`/settings/security` is added to the authenticated app routes. `ProtectedRoute` blocks all authenticated routes with `LockScreen` when the app is locked.

## 11. Firestore APIs

Implemented methods: `getAppLock`, `enableAppLock`, `disableAppLock`, `verifyPin`, `changePin`, `resetPin`, `updateAutoLock`, `updateFailedAttempts`, and `resetFailedAttempts`.

## 12. Utility Functions

`hashPin(pin, uid)` and `comparePin(pin, uid, savedHash)` use browser crypto. Session helpers only write approved runtime keys.

## 13. Security Best Practices

Plain PIN is never persisted. Hashes are never put in session or local storage. Failed attempts are persisted server-side in the user security document. Reset requires Firebase reauthentication. Firestore rules allow users to access only their own `settings` documents.

## 14. Error Handling

Firestore load failure falls back to an unlocked app with a context error so existing users are not blocked by a transient read failure. PIN verification failures increment attempts. Five wrong attempts sets `lockUntil` for five minutes. Password reset errors are shown in the modal.

## 15. Future Enhancements

Future hardening can add Cloud Function verification, per-device trusted sessions, biometric WebAuthn unlock, encrypted local metadata, remote logout of sessions, and audit events under a server-only collection.
