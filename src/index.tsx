import { Platform } from 'react-native';
import NativeScreenshotDetector from './NativeScreenshotDetector';

export type Subscription = { remove(): void };

export type ScreenCaptureEvent = { isCapturing: boolean };

/**
 * Whether screen-capture / recording detection is supported on this platform.
 * `true` on iOS, `false` on Android (Android has no public API for it).
 */
export const isScreenCaptureSupported: boolean = Platform.OS === 'ios';

/**
 * Subscribe to screenshot events. Supported on iOS and Android.
 * Call `.remove()` on the returned subscription to stop listening.
 */
export function addScreenshotListener(listener: () => void): Subscription {
  return NativeScreenshotDetector.onScreenshot(listener);
}

/**
 * Subscribe to screen capture / recording changes. iOS only.
 * On Android this never fires (`isScreenCaptureSupported` is `false`).
 */
export function addScreenCaptureListener(
  listener: (event: ScreenCaptureEvent) => void
): Subscription {
  return NativeScreenshotDetector.onScreenCapture((isCapturing: boolean) =>
    listener({ isCapturing })
  );
}

/**
 * Resolve whether the screen is currently being captured.
 * Reflects `UIScreen.isCaptured` on iOS; resolves `false` on Android.
 */
export function isScreenBeingCaptured(): Promise<boolean> {
  return NativeScreenshotDetector.isScreenBeingCaptured();
}
