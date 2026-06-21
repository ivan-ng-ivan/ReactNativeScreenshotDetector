# React Native Screenshot Detector — Design Spec

- **Date:** 2026-06-22
- **Status:** Approved (pending written-spec review)
- **Author:** ivan-ng-ivan <ivan-ng-ivan@users.noreply.github.com>
- **Repo:** https://github.com/ivan-ng-ivan/ReactNativeScreenshotDetector

## 1. Overview

A React Native library that notifies app developers when the **user takes a
screenshot**, via a subscribable listener. As a secondary feature it reports
when the device screen is being **captured / recorded** (iOS only). The library
targets the React Native New Architecture (Turbo Modules) while remaining
backward compatible with the old architecture.

## 2. Goals & Non-Goals

### Goals
- Detect device screenshots on **iOS and Android** and invoke a JS listener.
- Detect screen capture/recording start & stop on **iOS** and invoke a JS listener.
- Ship as an installable npm package.
- Provide full automated tests (JS + native unit tests).
- Provide two standalone example apps (iOS and Android) that exercise the library.
- MIT licensed, with an explicit "use at your own risk" disclaimer.

### Non-Goals
- Detecting third-party screen recording on **Android** — no public API exists;
  explicitly unsupported and documented as such.
- Capturing or accessing screenshot image contents (privacy-respecting; the OS
  APIs only signal that a screenshot occurred).
- Preventing screenshots (this lib only *detects*; blocking is out of scope).

## 3. Requirements Traceability

| # | Requirement | Decision |
|---|-------------|----------|
| 1 | iOS + Android; min iOS, min Android | Min **iOS 15**, min **Android 14 (API 34)** |
| 2 | RN 0.81.0, Node 22 | RN `0.81.0`, Node 22 via `.nvmrc`; build with builder-bob |
| 3 | Screenshot listener | `addScreenshotListener(cb)` returning a `Subscription` |
| 4 | Mainly screenshot detection | Primary feature; first-class API + tests |
| 5 | Video recorder start/stop (nice-to-have) | **iOS only** via `UIScreen.isCaptured`; Android unsupported |
| 6 | Full test cases | Jest (JS/TS) + iOS XCTest + Android JUnit/Robolectric |
| 7 | iOS & Android example projects | **Two separate** example apps under `examples/` |
| 8 | npm install + pre-publish steps | builder-bob packaging + documented publish checklist |
| 9 | README usage + risk disclaimer | Usage docs + prominent "use at your own risk" section |
| 10 | MIT LICENSE | MIT, holder "2026 ivan-ng-ivan" (ivan-ng-ivan) |
| 11 | Suitable .gitignore | RN-library `.gitignore` covering JS/iOS/Android/examples |

## 4. Platform Capability Matrix

| Capability | iOS (15+) | Android (14+/API 34) |
|-----------|-----------|----------------------|
| Screenshot detection | ✅ `UIApplication.userDidTakeScreenshotNotification` | ✅ `Activity.registerScreenCaptureCallback` |
| Screen recording/capture detection | ✅ `UIScreen.isCaptured` + `UIScreen.capturedDidChangeNotification` | ❌ Not supported (no public API) |
| Screenshot image access | ❌ (by design) | ❌ (by design) |

Android requires the **normal** permission `android.permission.DETECT_SCREEN_CAPTURE`
(declared by the library manifest; not a runtime/dangerous permission). The
screenshot callback only fires while the host Activity is visible.

## 5. Architecture & Approach

**Chosen approach:** Scaffold with `create-react-native-library` generating a
**Turbo Native Module (New Architecture, backward-compatible)** using **Swift**
(iOS) and **Kotlin** (Android), TypeScript public API, `react-native-builder-bob`
for build output, Jest preconfigured.

**Alternatives considered:**
- *Hand-rolled legacy Bridge module* — simplest mentally, but the old
  architecture is being phased out and requires more boilerplate. Rejected.
- *New-Architecture-only Turbo Module* — cleanest, but breaks consumers still on
  the old architecture for negligible benefit. Rejected.

### 5.1 Repository layout

```
react-native-screenshot-detector/
├─ src/
│  ├─ index.tsx                       # public TS API + event wiring
│  ├─ NativeScreenshotDetector.ts     # codegen TurboModule spec
│  └─ __tests__/                      # Jest tests
├─ ios/
│  ├─ ScreenshotDetector.swift        # iOS implementation
│  └─ ScreenshotDetector.mm/.h        # bridge glue as needed
├─ android/
│  ├─ src/main/AndroidManifest.xml    # DETECT_SCREEN_CAPTURE permission
│  └─ src/main/java/com/screenshotdetector/
│     ├─ ScreenshotDetectorModule.kt
│     └─ ScreenshotDetectorPackage.kt
│  └─ src/test/...                    # JUnit/Robolectric tests
├─ examples/
│  ├─ ios-example/                    # standalone RN 0.81 app (screenshot + recording)
│  └─ android-example/                # standalone RN 0.81 app (screenshot)
├─ .nvmrc                             # 22
├─ .gitignore
├─ LICENSE                            # MIT (2026 ivan-ng-ivan)
├─ README.md
├─ package.json                       # builder-bob + codegenConfig + files whitelist
├─ tsconfig.json
└─ react-native-screenshot-detector.podspec
```

> **Note on two example apps:** This is heavier to maintain than the usual single
> shared example app produced by `create-react-native-library`. Done per explicit
> requirement #7. Each app depends on the library via a local path.

### 5.2 Public TypeScript API

```ts
export type Subscription = { remove(): void };

/** Screenshot taken by the user. Works on iOS and Android. */
export function addScreenshotListener(cb: () => void): Subscription;

/** Screen capture/recording state changed. iOS only; no-op on Android. */
export function addScreenCaptureListener(
  cb: (event: { isCapturing: boolean }) => void
): Subscription;

/** Current capture state. iOS reflects UIScreen.isCaptured; Android resolves false. */
export function isScreenBeingCaptured(): Promise<boolean>;

/** True on iOS, false on Android. */
export const isScreenCaptureSupported: boolean;
```

The native module is wrapped so consumers never touch `NativeEventEmitter`
directly. Subscriptions are reference-counted: native observers are registered
on first listener and torn down when the last listener is removed.

### 5.3 iOS implementation (min 15, Swift)

- **Screenshot:** observe `UIApplication.userDidTakeScreenshotNotification`;
  emit a `screenshot` event.
- **Recording/capture:** observe `UIScreen.capturedDidChangeNotification`; read
  `UIScreen.main.isCaptured`; emit `screenCapture` with `{ isCapturing }`. Covers
  screen recording, mirroring, and AirPlay. `isScreenBeingCaptured()` returns the
  current `isCaptured` value.
- Observers added/removed based on JS listener reference counts.

### 5.4 Android implementation (min API 34, Kotlin)

- **Screenshot:** use `Activity.registerScreenCaptureCallback(executor, callback)`
  on the current Activity; emit a `screenshot` event. Register when the first
  listener is added and the Activity is available; unregister on host
  pause/destroy and when the last listener is removed.
- Declare `<uses-permission android:name="android.permission.DETECT_SCREEN_CAPTURE"/>`.
- Guard all calls with `Build.VERSION.SDK_INT >= 34`.
- **Recording:** unsupported. `addScreenCaptureListener` is a no-op,
  `isScreenBeingCaptured()` resolves `false`, `isScreenCaptureSupported` is `false`.

### 5.5 Event flow

```
Native OS event ──▶ Native module ──▶ event emitter ──▶ JS wrapper ──▶ consumer callback
(screenshot /                          (screenshot /                    (addScreenshotListener /
 capture change)                        screenCapture)                   addScreenCaptureListener)
```

## 6. Testing Strategy (req #6)

- **Jest (JS/TS):**
  - `addScreenshotListener` registers and fires the callback on emitted events.
  - `addScreenCaptureListener` fires with correct `isCapturing` payloads.
  - Android branch: recording APIs are no-ops; `isScreenCaptureSupported === false`.
  - Subscription `remove()` stops callbacks; native teardown on last removal.
  - Mocks for `NativeModules` + event emitter.
- **iOS XCTest:** posting `userDidTakeScreenshotNotification` /
  `capturedDidChangeNotification` causes the module to emit the corresponding event.
- **Android JUnit + Robolectric (@Config sdk = 34):** module registers the
  screen-capture callback against a mock Activity and forwards invocations as events.
- Example apps provide manual/visual verification on real devices/simulators.

## 7. Packaging & npm Publish Checklist (req #8)

> **Gate:** Do NOT run `npm publish` until the user explicitly confirms.

1. Verify the name is free: `npm view react-native-screenshot-detector`
   (a 404 means available; otherwise fall back to scoped
   `@ivan-ng-ivan/react-native-screenshot-detector` with `publishConfig.access=public`).
2. Complete `package.json`: `name`, `version` `0.1.0`, `description`, `keywords`,
   `repository`, `author` (ivan-ng-ivan), `license` MIT, `homepage`, `bugs`,
   `main`/`module`/`types`/`react-native`/`source`, `files` whitelist
   (`lib`, `src`, `android`, `ios`, `*.podspec`, `README.md`, `LICENSE`),
   `peerDependencies` (react, react-native), builder-bob config, `codegenConfig`.
3. `nvm use 22`, install deps, build with builder-bob (`prepare`), then
   `npm pack` and inspect the tarball contents.
4. Create an npm account, **enable 2FA**, `npm login`.
5. `npm publish` (`--access public` if scoped). Optionally use `release-it`
   (bundled by the scaffold) for version bump + changelog + git tag.

## 8. Tooling & Conventions

- **Node:** 22 (`.nvmrc`), current shell on 23 → run `nvm use` before building.
- **Git:** commits authored as ivan-ng-ivan <ivan-ng-ivan@users.noreply.github.com>; pushes via SSH key
  `~/.ssh/id_ed25519_ivanng299`; origin switched to the `git@github.com:` URL.
- **.gitignore:** node_modules, builder-bob `lib/`, iOS `Pods/`/`build/`/`*.xcworkspace`
  user data, Android `.gradle/`/`build/`, `.DS_Store`, logs, coverage, plus example
  app build artifacts.

## 9. README Contents (req #9)

- Install instructions (`npm i react-native-screenshot-detector`), iOS pod install,
  Android note about API 34 + `DETECT_SCREEN_CAPTURE`.
- Usage examples: add/remove screenshot listener; iOS capture listener; cleanup.
- Platform support table; explicit note that recording detection is **iOS only**.
- **Disclaimer / Use at your own risk** (prominent): the author is not responsible
  for any legal issues, loss, data leak, hack, or violation of laws resulting from
  use; installing and using the library means you accept all risk yourself.
- MIT license reference.

## 10. Risks & Mitigations

- **Android screenshot callback requires a visible Activity** — document that
  detection only works while the app is foregrounded; manage lifecycle internally.
- **Two example apps increase maintenance** — keep each minimal and focused.
- **Min iOS 15 / Android 14** — documented clearly; Android 14 is required by the
  official screenshot API.
- **npm name availability** — verified before publish; scoped fallback ready.

## 11. Out of Scope / Future

- Android recording detection (revisit if a public API appears).
- Screenshot prevention / secure-flag helpers.
- E2E (Detox/Maestro) automation — manual example verification for now.
