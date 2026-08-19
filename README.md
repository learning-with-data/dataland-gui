# dataland-gui

> GUI (code editor + more) for the Dataland project

## About

This is the standalone GUI app for the Dataland project. The block-based editor is powered by
[Blockly](https://developers.google.com/blockly).

For more information about the Dataland project, visit <https://learning-with-data.github.io/>.

## Getting Started

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies

    ```
    cd path/to/dataland-gui
    npm install
    ```
3. Start your app in development mode

    ```
    npm start
    ```

## Configuration

The app reads configuration from environment variables defined in a `.env` file at the project root.
Copy `.env.example` to `.env` and adjust the values as needed.

The **AI Helper** feature (the "AI Helper" button in the header and the chat panel it opens) is
behind a build-time feature flag and is **off by default**. It is enabled by setting
`VITE_AI_ENABLED=true` in `.env`:

```env
# Enable the AI Helper feature (off by default)
VITE_AI_ENABLED=true
```

Other AI-related variables control the feature's behavior once it is enabled (see `.env.example` for
the full list): `VITE_AI_API_BASE_URL`, `VITE_AI_MODEL_NAME`, and `VITE_AI_API_KEY` point the AI at
a model API, and `VITE_AI_VISION` is an independent switch that lets the AI view the current chart
image (it has no effect unless `VITE_AI_ENABLED` is also true). `VITE_AI_MAX_TURNS` caps how many
model round-trips a single chat turn may make.

## Building

You can build the project in two different modes:

- **As a library**: To build the project as a UMD library (for use in other projects):
    ```
    npm run build
    ```
- **As a demo**: To build the demo application for deployment:
    ```
    npm run build-demo
    ```

## Testing

Run `npm test` and all the tests in the `test/` directory will be run. For the integration tests, the
devserver needs to be running, so ensure that by running `npm run cypress:coverage &` before running
`npm test`. This starts the dev server with `VITE_COVERAGE=true` (which instruments the app so that
Cypress can collect code coverage for it — plain `npm start` leaves the app uninstrumented, and the
coverage report will be missing all the e2e data) **and** `VITE_AI_ENABLED=true` (the AI Helper
feature is off by default, and the integration tests exercise it, so it must be enabled for that run).

`npm run start:coverage` is the same without `VITE_AI_ENABLED=true`; use it when you want a
coverage-instrumented dev server with the AI Helper left off.