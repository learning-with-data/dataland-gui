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
3. Start your app

    ```
    npm start
    ```

## Testing

Run `npm test` and all the tests in the `test/` directory will be run. For the integration tests, the
devserver needs to be running, so ensure that by running `npm start &` before running `npm test`.