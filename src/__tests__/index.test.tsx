import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

// Controllable mock of the codegen TurboModule. Variables are `mock`-prefixed so
// the hoisted jest.mock factory is allowed to reference them.
const mockScreenshotListeners = new Set<() => void>();
const mockCaptureListeners = new Set<(value: boolean) => void>();
const mockState = { isCaptured: false };

jest.mock('../NativeScreenshotDetector', () => ({
  __esModule: true,
  default: {
    onScreenshot: (listener: () => void) => {
      mockScreenshotListeners.add(listener);
      return { remove: () => mockScreenshotListeners.delete(listener) };
    },
    onScreenCapture: (listener: (value: boolean) => void) => {
      mockCaptureListeners.add(listener);
      return { remove: () => mockCaptureListeners.delete(listener) };
    },
    isScreenBeingCaptured: () => Promise.resolve(mockState.isCaptured),
  },
}));

function emitScreenshot() {
  mockScreenshotListeners.forEach((listener) => listener());
}

function emitCapture(value: boolean) {
  mockState.isCaptured = value;
  mockCaptureListeners.forEach((listener) => listener(value));
}

import {
  addScreenCaptureListener,
  addScreenshotListener,
  isScreenBeingCaptured,
  isScreenCaptureSupported,
} from '../index';

describe('react-native-screenshot-detector', () => {
  beforeEach(() => {
    mockScreenshotListeners.clear();
    mockCaptureListeners.clear();
    mockState.isCaptured = false;
  });

  it('invokes the screenshot listener when a screenshot event fires', () => {
    const callback = jest.fn();
    const subscription = addScreenshotListener(callback);

    emitScreenshot();

    expect(callback).toHaveBeenCalledTimes(1);
    subscription.remove();
  });

  it('stops invoking the screenshot listener after remove()', () => {
    const callback = jest.fn();
    const subscription = addScreenshotListener(callback);

    subscription.remove();
    emitScreenshot();

    expect(callback).not.toHaveBeenCalled();
  });

  it('passes { isCapturing } to the screen-capture listener', () => {
    const callback = jest.fn();
    const subscription = addScreenCaptureListener(callback);

    emitCapture(true);
    expect(callback).toHaveBeenCalledWith({ isCapturing: true });

    emitCapture(false);
    expect(callback).toHaveBeenLastCalledWith({ isCapturing: false });

    subscription.remove();
  });

  it('stops invoking the capture listener after remove()', () => {
    const callback = jest.fn();
    const subscription = addScreenCaptureListener(callback);

    subscription.remove();
    emitCapture(true);

    expect(callback).not.toHaveBeenCalled();
  });

  it('resolves the current capture state from the native module', async () => {
    await expect(isScreenBeingCaptured()).resolves.toBe(false);

    emitCapture(true);
    await expect(isScreenBeingCaptured()).resolves.toBe(true);
  });

  it('reports capture support based on the platform', () => {
    expect(isScreenCaptureSupported).toBe(Platform.OS === 'ios');
  });

  it('supports multiple independent screenshot subscriptions', () => {
    const first = jest.fn();
    const second = jest.fn();
    const firstSub = addScreenshotListener(first);
    const secondSub = addScreenshotListener(second);

    emitScreenshot();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    firstSub.remove();
    emitScreenshot();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);

    secondSub.remove();
  });
});
