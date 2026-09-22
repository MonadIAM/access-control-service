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

## TypeScript navigation

- When connected, use `access-control-lsp` for types, namespace contracts, `Pick`
  and inherited generic methods: prefer focused hover, definition, signature-help
  and completion requests anchored to a specific usage.
- Pass this repository as `root` and relative file paths. Lines are one-based;
  columns are zero-based. If LSP is unavailable or incomplete, search source.
  An empty response does not prove a symbol is absent. Setup is in README.md.
- Resolve `@monadiam/shared` through the installed dependency; the sibling checkout
  may differ. Verify NestJS provider registrations separately from type contracts.

## Local code graph

- Graphify is optional for architecture and cross-file relationships. Query a
  current graph with `graphify query "<question>"`; use source search as fallback.
- Refresh stale data with `make graphify` before relying on it. Small edits in
  known files do not require a graph rebuild. Other graph commands are in Makefile.
- Keep `graphify-out/` untracked and never load the full graph JSON into context.
  Read `graphify-out/GRAPH_REPORT.md` only when a broad overview is needed.
- Verify graph conclusions against current source, especially runtime calls and
  dependency injection. An absent edge does not prove a dependency is absent.
- Keep extraction local and code-only; do not enable semantic extraction, remote
  backends or automatic hooks just to navigate code.
