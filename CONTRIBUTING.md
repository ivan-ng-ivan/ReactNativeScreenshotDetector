# Contributing

This guide covers the local development setup and the release process for this
library.

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or Xcode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/ScreenshotDetectorExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > react-native-screenshot-detector`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-screenshot-detector` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "ScreenshotDetectorExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
yarn typecheck
```

To check for linting errors, run the following:

```sh
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```



### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
  - `yarn lint`: lint files with [ESLint](https://eslint.org/).
    - `yarn test`: run unit tests with [Jest](https://jestjs.io/).
  - `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.
  
### Publishing a new release

Releases are published to npm under the scoped package name
`@ivan-ng-ivan/react-native-screenshot-detector`. To publish a new version:

1. Bump the `version` in `package.json` following [semver](https://semver.org/).
2. Build and inspect the package contents:
   ```sh
   nvm use            # Node version from .nvmrc
   yarn               # install dependencies
   yarn prepare       # build lib/ with react-native-builder-bob
   npm pack --dry-run # inspect the tarball before publishing
   ```
3. Log in to npm with an account that can publish to the `@ivan-ng-ivan` scope,
   with 2FA enabled: `npm login`.
4. Publish (the package is public via `publishConfig.access` in `package.json`):
   ```sh
   npm publish
   ```
