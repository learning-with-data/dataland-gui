# AGENTS.md

## Project Overview
This repository contains `dataland-gui`, the standalone GUI application for the Dataland project. It is a React application built with Vite that provides a visual code editor and additional GUI tools.

## Project Structure
- `/dataland-gui`: React frontend.
    - `src/`: Application source code.
    - `test/`: Unit and integration tests.

## Development Workflows

### dataland-gui
- **Development**: Run `npm start` to launch the Vite dev server.
- **Building**: 
    - `npm run build` (as a UMD library).
    - `npm run build-demo` (as a demo application).
- **Testing**: 
    - Unit tests: `npm run test:unit` (Vitest).
    - Integration tests: `npm test` (runs both Vitest and Cypress). 
    - *Note*: For Cypress coverage, use `npm run start:coverage` before running tests.

## Engineering Guidelines

### Agent Workflow
- **Review First**: Do not implement any code changes before proposing a plan and asking for a review.
- **Continuous Validation**: Run `npm run lint` after every JavaScript code change operation to ensure code quality and consistency.

### General Standards
- **Consistency**: Follow existing patterns in the codebase.
- **Testing**: Any new feature in `dataland-gui` should be accompanied by corresponding tests in the `test/` directory.
- **Dependencies**: Prefer existing dependencies (e.g., `lodash`, `immutable`, `dayjs`, `react-redux`) over adding new ones.
