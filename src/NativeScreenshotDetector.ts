import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  /** Emitted when the user takes a screenshot. Supported on iOS and Android. */
  readonly onScreenshot: CodegenTypes.EventEmitter<void>;
  /** Emitted when screen capture/recording state changes. iOS only. */
  readonly onScreenCapture: CodegenTypes.EventEmitter<boolean>;
  /** Resolves whether the screen is currently being captured. iOS only; Android resolves `false`. */
  isScreenBeingCaptured(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ScreenshotDetector');
