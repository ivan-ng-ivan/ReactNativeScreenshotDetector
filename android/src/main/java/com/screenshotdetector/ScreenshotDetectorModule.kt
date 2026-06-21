package com.screenshotdetector

import android.app.Activity
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

class ScreenshotDetectorModule(reactContext: ReactApplicationContext) :
  NativeScreenshotDetectorSpec(reactContext), LifecycleEventListener {

  private var screenCaptureCallback: Activity.ScreenCaptureCallback? = null
  private var registeredActivity: Activity? = null

  init {
    reactContext.addLifecycleEventListener(this)
    registerScreenCaptureCallback()
  }

  override fun invalidate() {
    unregisterScreenCaptureCallback()
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  // Android exposes no public API to detect third-party screen recording,
  // so capture detection is unsupported and always resolves false.
  override fun isScreenBeingCaptured(promise: Promise) {
    promise.resolve(false)
  }

  override fun onHostResume() {
    registerScreenCaptureCallback()
  }

  override fun onHostPause() {
    unregisterScreenCaptureCallback()
  }

  override fun onHostDestroy() {
    unregisterScreenCaptureCallback()
  }

  private fun registerScreenCaptureCallback() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      registerScreenCaptureCallbackApi34()
    }
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private fun registerScreenCaptureCallbackApi34() {
    if (screenCaptureCallback != null) return
    val activity = currentActivity ?: return
    val callback = Activity.ScreenCaptureCallback { emitOnScreenshot() }
    activity.registerScreenCaptureCallback(activity.mainExecutor, callback)
    screenCaptureCallback = callback
    registeredActivity = activity
  }

  private fun unregisterScreenCaptureCallback() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      unregisterScreenCaptureCallbackApi34()
    }
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  private fun unregisterScreenCaptureCallbackApi34() {
    val callback = screenCaptureCallback ?: return
    registeredActivity?.let { activity ->
      try {
        activity.unregisterScreenCaptureCallback(callback)
      } catch (_: IllegalStateException) {
        // The callback was not registered on this activity; safe to ignore.
      }
    }
    screenCaptureCallback = null
    registeredActivity = null
  }

  companion object {
    const val NAME = NativeScreenshotDetectorSpec.NAME
  }
}
