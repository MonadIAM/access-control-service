# Agent instructions

## Changes and validation

- Read the full [Makefile](Makefile) before choosing commands. Prefer its targets;
  command implementations live in `package.json`. See README.md for usage.
- After changes, run `make tsc` and `make lint` before reporting completion.
  Lint checks the whole project. Report failed or blocked checks explicitly.
- `make lint-fix` (`pnpm run lint:fix`) is the only permitted automatic fix:
  it fixes Prettier violations and prints changed paths. Fix all other ESLint
  errors manually. Do not use full-config `eslint --fix` or loop automatic fixes.
- When tests change, run the changed files with
  `pnpm run utest --runTestsByPath <unit-test-paths>` and/or
  `pnpm run itest --runTestsByPath <integration-test-paths>` as applicable.
  Select paths from your changes; avoid `--onlyChanged` including user changes.
- When fixtures/helpers change, run their affected tests. `--findRelatedTests`
  can help, but verify its selection. Run the full relevant `make utest`/`make itest`
  suite when test configuration changes or affected tests cannot be identified.
- Makefile test targets do not forward arguments; use pnpm scripts for scoped runs.
  Other checks are manual tools for the user unless explicitly requested.

## Dependency navigation

- Resolve `@monadiam/shared` through the installed dependency; the sibling checkout
  may differ. Verify NestJS provider registrations separately from type contracts.
