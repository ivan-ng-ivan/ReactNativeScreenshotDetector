# react-native-screenshot-detector

Detect when the user takes a **screenshot** (iOS & Android) and when the screen is
being **recorded / captured** (iOS only) in React Native — via a simple listener
API.

> Privacy-friendly: the library only tells you _that_ a screenshot or capture
> happened. It never accesses or exposes the screenshot image.

## Features

- 📸 Screenshot detection on **iOS** and **Android**
- 🔴 Screen recording / capture detection on **iOS** (start & stop)
- 🧩 Built as a React Native **Turbo Native Module** (New Architecture)
- 🔔 Simple subscription API with automatic cleanup
- 🟦 Written in TypeScript with full type definitions

## Platform support

| Capability                          | iOS        | Android                 |
| ----------------------------------- | ---------- | ----------------------- |
| Screenshot detection                | ✅ iOS 15+ | ✅ Android 14+ (API 34) |
| Screen recording/capture detection  | ✅ iOS 15+ | ❌ Not supported        |

Android has **no public API** to detect that a third-party app is recording the
screen, so recording detection is **iOS only**. On Android the recording APIs are
safe no-ops (`isScreenCaptureSupported` is `false`).

## Requirements

- React Native **0.81+** with the **New Architecture enabled** (the default in 0.81)
- iOS **15.0+**
- Android **14+ (API level 34)** at runtime for screenshot detection

## Installation

```sh
npm install @ivan-ng-ivan/react-native-screenshot-detector
```

or

```sh
yarn add @ivan-ng-ivan/react-native-screenshot-detector
```

### iOS

```sh
cd ios && pod install
```

### Android

No manual steps. The library declares the required
`android.permission.DETECT_SCREEN_CAPTURE` permission and merges it into your app
automatically. It is a normal (non-runtime) permission — the user is not prompted.
Screenshot detection uses the official `Activity.registerScreenCaptureCallback`
API, which only fires while your app is in the foreground.

## Usage

```tsx
import { useEffect } from 'react';
import { Alert } from 'react-native';
import {
  addScreenshotListener,
  addScreenCaptureListener,
  isScreenBeingCaptured,
  isScreenCaptureSupported,
} from '@ivan-ng-ivan/react-native-screenshot-detector';

function useScreenshotGuard() {
  useEffect(() => {
    const screenshotSub = addScreenshotListener(() => {
      Alert.alert('Screenshot detected', 'Please respect content privacy.');
    });

    // iOS only — never fires on Android.
    const captureSub = addScreenCaptureListener(({ isCapturing }) => {
      console.log('Screen capture is now', isCapturing ? 'ON' : 'OFF');
    });

    return () => {
      screenshotSub.remove();
      captureSub.remove();
    };
  }, []);
}

// One-off query (iOS reflects UIScreen.isCaptured; Android resolves false)
const capturing = await isScreenBeingCaptured();

// Feature-detect at runtime
if (isScreenCaptureSupported) {
  // safe to rely on capture events
}
```

## API

### `addScreenshotListener(listener: () => void): Subscription`

Calls `listener` whenever the user takes a screenshot (iOS & Android). Returns a
subscription — call `.remove()` to stop listening.

### `addScreenCaptureListener(listener: (event: { isCapturing: boolean }) => void): Subscription`

Calls `listener` when screen recording/capture starts or stops. **iOS only**
(never fires on Android). Returns a subscription with `.remove()`.

### `isScreenBeingCaptured(): Promise<boolean>`

Resolves whether the screen is currently being captured. Reflects
`UIScreen.isCaptured` on iOS; resolves `false` on Android.

### `isScreenCaptureSupported: boolean`

`true` on iOS, `false` on Android.

## How it works

- **iOS:** observes `UIApplication.userDidTakeScreenshotNotification` for
  screenshots and `UIScreen.capturedDidChangeNotification` / `UIScreen.isCaptured`
  for recording, mirroring, and AirPlay.
- **Android:** registers an `Activity.ScreenCaptureCallback` via
  `registerScreenCaptureCallback` (API 34+), tied to your activity's lifecycle.

## Publishing to npm (for maintainers)

Before publishing:

1. This package is published under the scoped name
   `@ivan-ng-ivan/react-native-screenshot-detector`. Scoped packages are private
   by default, so `publishConfig.access` is set to `public` in `package.json`.
2. Set/bump the `version` in `package.json` (e.g. `0.1.0`).
3. Build and inspect the published contents:
   ```sh
   nvm use            # Node 22 (see .nvmrc)
   yarn               # install dependencies
   yarn prepare       # build lib/ with builder-bob
   npm pack --dry-run # inspect the tarball before publishing
   ```
4. Create an npm account, enable 2FA, then `npm login`.
5. Publish: `npm publish --access public`.

## ⚠️ Disclaimer — use at your own risk

**This software is provided "as is", without warranty of any kind.** The author
(ivan-ng-ivan / ivan-ng-ivan) is **not responsible** for any legal issues, losses,
damages, data leaks, hacks, or any consequence arising from the violation of any
laws or regulations resulting from the use of this library.

**By installing and using this library in your project, you acknowledge and agree
that you accept all risk yourself.** It is your responsibility to ensure your use
of screenshot / screen-capture detection complies with all applicable laws,
regulations, app-store policies, and privacy requirements in your jurisdiction.

## License

[MIT](LICENSE) © 2026 ivan-ng-ivan

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
