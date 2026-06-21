#import "ScreenshotDetector.h"
#import <UIKit/UIKit.h>

@implementation ScreenshotDetector {
  id<NSObject> _screenshotObserver;
  id<NSObject> _captureObserver;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self startObserving];
  }
  return self;
}

- (void)startObserving
{
  __weak __typeof(self) weakSelf = self;
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;

  _screenshotObserver =
      [center addObserverForName:UIApplicationUserDidTakeScreenshotNotification
                          object:nil
                           queue:NSOperationQueue.mainQueue
                      usingBlock:^(__unused NSNotification *note) {
                        [weakSelf emitOnScreenshot];
                      }];

  _captureObserver =
      [center addObserverForName:UIScreenCapturedDidChangeNotification
                          object:nil
                           queue:NSOperationQueue.mainQueue
                      usingBlock:^(__unused NSNotification *note) {
                        [weakSelf emitOnScreenCapture:UIScreen.mainScreen.isCaptured];
                      }];
}

- (void)stopObserving
{
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
  if (_screenshotObserver) {
    [center removeObserver:_screenshotObserver];
    _screenshotObserver = nil;
  }
  if (_captureObserver) {
    [center removeObserver:_captureObserver];
    _captureObserver = nil;
  }
}

// Guard emits so a screenshot taken before JS wires up the event callback is a no-op
// rather than invoking an empty std::function.
- (void)emitOnScreenshot
{
  if (_eventEmitterCallback) {
    [super emitOnScreenshot];
  }
}

- (void)emitOnScreenCapture:(BOOL)value
{
  if (_eventEmitterCallback) {
    [super emitOnScreenCapture:value];
  }
}

- (void)isScreenBeingCaptured:(RCTPromiseResolveBlock)resolve
                       reject:(__unused RCTPromiseRejectBlock)reject
{
  resolve(@(UIScreen.mainScreen.isCaptured));
}

- (void)invalidate
{
  [self stopObserving];
}

- (void)dealloc
{
  [self stopObserving];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeScreenshotDetectorSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ScreenshotDetector";
}

@end
