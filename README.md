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
devserver needs to be running, so ensure that by running `npm run start:coverage &` before running
`npm test`. This starts the dev server with `VITE_COVERAGE=true`, which instruments the app so that
Cypress can collect code coverage for it (plain `npm start` leaves the app uninstrumented, and the
coverage report will be missing all the e2e data).