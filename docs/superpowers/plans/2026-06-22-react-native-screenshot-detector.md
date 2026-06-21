# React Native Screenshot Detector — Implementation Plan

> **For agentic workers:** Inline execution (superpowers:executing-plans) in this TaskSync session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publishable RN 0.81 library that detects user screenshots (iOS + Android) and screen recording (iOS only), with a listener API, full tests, and two example apps.

**Architecture:** Turbo Native Module (New Architecture, backward-compatible) scaffolded with `create-react-native-library`. Swift (iOS) observes `UIApplication.userDidTakeScreenshotNotification` and `UIScreen.capturedDidChangeNotification`; Kotlin (Android) uses `Activity.registerScreenCaptureCallback` (API 34). A TS wrapper exposes a reference-counted listener API over the native event emitter.

**Tech Stack:** React Native 0.81.0, Node 22, TypeScript, react-native-builder-bob, Jest, XCTest, JUnit/Robolectric, CocoaPods, Gradle.

**Conventions:** Commit as `ivan-ng-ivan <ivan-ng-ivan@users.noreply.github.com>`. Do NOT push (user holds pushes). Do NOT `npm publish` without explicit user confirmation. Run Node via `export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"`.

---

### Task 1: Scaffold the library skeleton

**Files:** generates `src/`, `ios/`, `android/`, `example/`, `package.json`, `tsconfig.json`, `babel.config.js`, `*.podspec`, builder-bob/jest config.

- [ ] Scaffold into a temp dir, then merge into the existing repo (preserve `.git`, regenerate `LICENSE`/`README.md`):

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
npx --yes create-react-native-library@latest react-native-screenshot-detector \
  --slug react-native-screenshot-detector \
  --description "Detect device screenshots (iOS & Android) and screen recording (iOS) in React Native." \
  --author-name "ivan-ng-ivan" --author-email "ivan-ng-ivan@users.noreply.github.com" \
  --author-url "https://github.com/ivan-ng-ivan" \
  --repo-url "https://github.com/ivan-ng-ivan/ReactNativeScreenshotDetector" \
  --type turbo-module --languages kotlin-swift --example vanilla \
  --tools jest --tools eslint --react-native-version 0.81.0 \
  --no-interactive --directory /tmp/rnsd-build
```

- [ ] Copy everything except `/tmp/rnsd-build/.git` into the repo root; keep existing `.git`.
- [ ] Verify `yarn install` succeeds at the repo root.

### Task 2: Public TypeScript API + codegen spec

**Files:** Create `src/NativeScreenshotDetector.ts` (codegen TurboModule spec), `src/index.tsx` (public API).

- [ ] Codegen spec exposes `addListener`/`removeListeners` (for the event emitter), `isScreenBeingCaptured(): Promise<boolean>`, and `isScreenCaptureSupported(): boolean`.
- [ ] `src/index.tsx` public API (reference-counted subscriptions over `NativeEventEmitter`):

```ts
export type Subscription = { remove(): void };
export function addScreenshotListener(cb: () => void): Subscription;
export function addScreenCaptureListener(cb: (e: { isCapturing: boolean }) => void): Subscription;
export function isScreenBeingCaptured(): Promise<boolean>;
export const isScreenCaptureSupported: boolean;
```

- [ ] Events: native emits `"ScreenshotDetector_screenshot"` and `"ScreenshotDetector_screenCapture"` ({ isCapturing }). On Android, capture listener registers but never fires; `isScreenCaptureSupported === Platform.OS === 'ios'`.

### Task 3: iOS implementation (Swift, min 15)

**Files:** `ios/ScreenshotDetector.swift`, `ios/ScreenshotDetector.mm` (event emitter glue), podspec deployment target 15.

- [ ] On `startObserving`/first listener: add observers for `UIApplication.userDidTakeScreenshotNotification` (emit screenshot) and `UIScreen.capturedDidChangeNotification` (emit `{ isCapturing: UIScreen.main.isCaptured }`).
- [ ] `isScreenBeingCaptured` resolves `UIScreen.main.isCaptured`; `isScreenCaptureSupported` returns `true`.
- [ ] Remove observers on `stopObserving`/invalidate.

### Task 4: Android implementation (Kotlin, min API 34)

**Files:** `android/src/main/java/com/screenshotdetector/ScreenshotDetectorModule.kt`, `AndroidManifest.xml` (+`DETECT_SCREEN_CAPTURE`), `build.gradle` (compileSdk 34+).

- [ ] On first listener + Activity available: `activity.registerScreenCaptureCallback(mainExecutor) { emit screenshot }` guarded by `SDK_INT >= 34`; unregister on host pause/destroy/last-removal.
- [ ] `isScreenBeingCaptured` resolves `false`; `isScreenCaptureSupported` returns `false`; capture listener is a no-op.
- [ ] Implement `LifecycleEventListener` to re-register/unregister with foreground/background.

### Task 5: Jest tests (JS/TS)

**Files:** `src/__tests__/index.test.tsx`, mock for the native module + emitter.

- [ ] `addScreenshotListener` fires callback on emitted screenshot event; `remove()` stops it.
- [ ] `addScreenCaptureListener` fires with `{ isCapturing }` on iOS-mock; no-op assertions for Android-mock.
- [ ] `isScreenBeingCaptured` resolves the mocked native value; `isScreenCaptureSupported` matches platform.
- [ ] Reference counting: native `addListener` called once for multiple JS listeners; teardown on last remove.
- [ ] Run: `yarn test` → all pass.

### Task 6: Native unit tests

**Files:** `ios/Tests/ScreenshotDetectorTests.swift` (XCTest), `android/src/test/java/com/screenshotdetector/ScreenshotDetectorModuleTest.kt` (JUnit + Robolectric `@Config(sdk=[34])`).

- [ ] iOS: posting the two notifications triggers emitted events (use a spy emitter).
- [ ] Android: with a Robolectric Activity, adding a listener registers the screen-capture callback; invoking it emits a screenshot event; `isScreenCaptureSupported` false.

### Task 7: Two example apps

**Files:** `examples/ios-example/`, `examples/android-example/` (each a runnable RN 0.81 app wired to the local library), demo screen using the listeners.

- [ ] Base the apps on the scaffolded `example/` (already wired to the local lib); produce two separate apps under `examples/`.
- [ ] iOS example demo: subscribe to screenshot + capture listeners, show on-screen log + alert.
- [ ] Android example demo: subscribe to screenshot listener, show on-screen log + alert; note recording unsupported.
- [ ] Update root `package.json` workspaces + each app's metro/babel to resolve the local library.

### Task 8: Package metadata for npm

**Files:** `package.json`.

- [ ] `name` `react-native-screenshot-detector` (verify free via `npm view`; else scope `@ivan-ng-ivan/...`), `version` `0.1.0`, `description`, `keywords`, `repository`, `author` ivan-ng-ivan, `license` MIT, `homepage`, `bugs`, builder-bob outputs, `codegenConfig`, `files` whitelist (`lib`, `src`, `android`, `ios`, `*.podspec`, `README.md`, `LICENSE`), peerDeps react/react-native.

### Task 9: Docs, license, ignore, node version

**Files:** `README.md`, `LICENSE`, `.gitignore`, `.nvmrc`.

- [ ] `.nvmrc` = `22`.
- [ ] `LICENSE` MIT, holder `2026 ivan-ng-ivan`.
- [ ] `.gitignore` covers node_modules, builder-bob `lib/`, iOS `Pods/`/`build/`/xcuserdata, Android `.gradle/`/`build/`, `.DS_Store`, logs, coverage, example app artifacts.
- [ ] `README.md`: features, platform support table, install, iOS pod install, Android API-34 + `DETECT_SCREEN_CAPTURE` note, usage examples, recording-iOS-only note, pre-publish checklist, and a prominent **Disclaimer / Use at your own risk** (no liability for legal issues, loss, leak, hack, law violations; install+use = accept all risk), MIT reference.

### Task 10: Verify

- [ ] `yarn` (install), `yarn typescript` (tsc), `yarn lint`, `yarn test` (Jest), `yarn prepare` (builder-bob build) → all green.
- [ ] `npm pack --dry-run` → inspect tarball contents match `files` whitelist.
- [ ] (Best effort) `pod install` for iOS example; `./gradlew :app:assembleDebug` for Android example.

### Task 11: Commit (local only — DO NOT PUSH)

```bash
git add -A && git commit -m "feat: implement screenshot/recording detector library, tests, examples, docs"
```

---

## Self-Review

- **Spec coverage:** reqs 1–11 each map to Tasks 1–11 (platforms/min OS → T1,T3,T4,T9; RN0.81/Node22 → T1,T9; listeners → T2; screenshot focus → T2–T6; recording iOS → T2,T3; tests → T5,T6; examples → T7; npm → T8,T10; README+disclaimer → T9; MIT → T9; .gitignore → T9). No gaps.
- **No placeholders:** event names, API signatures, native notification constants, permission name all concrete.
- **Type consistency:** `Subscription`, `addScreenshotListener`, `addScreenCaptureListener`, `isScreenBeingCaptured`, `isScreenCaptureSupported`, event ids `ScreenshotDetector_screenshot` / `ScreenshotDetector_screenCapture` used consistently across T2/T3/T4/T5/T6.
