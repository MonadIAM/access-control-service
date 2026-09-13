# Notes

A registry of deliberate deviations from the default approach used in this service. Each entry is a reusable reason: if a new case falls under an already-described reason, the same ID from this file is used instead of adding a new one with the same substance under a different wording.

> This file does not track where each ID is used - that's `grep`'s job, not the document's. Only the reason itself is recorded here.

Marker in code: `// NOTE[TAG-ID]: see NOTES.md#TAG-ID`.

----

<details>
<summary><strong>SQL</strong></summary>

Deviations from building queries through mikro-orm (ORM / Entity QB) in favor of kysely as a plain SQL compiler. kysely is used exclusively to build `{sql, parameters}` via `.compile()` - no connection of its own, no integration into mikro-orm. Execution always goes through `EntityManager.execute()`; the transaction context is owned by mikro-orm.

#### SQL-01

`UNION` of several independent `SELECT` branches consumed by one `INSERT`. Neither Entity QB (`insertFrom`/`insertSelect` take a single source) nor mikro-orm's non-entity QB provide a union combinator at the level required for an insert.

#### SQL-02

A join or subquery-in-`IN` (incl. array-based via `whereIn`/`onIn`) on a column-level condition that isn't a modeled entity relation - whether a self-join on the same table or a join across two tables with no direct relation between them. Entity QB's `.join()` only works over relation paths with object-shaped conditions; an arbitrary column-level join can't be expressed that way.

#### SQL-03

`UPDATE` with a self-referencing expression in the value (`col = col +/- N`). `update()` on both mikro-orm QBs only accepts literal parameter values in `data` - the value always ends up as a bound query parameter, raw expressions aren't supported there by either builder (verified against `@mikro-orm/sql` source).

#### SQL-04

A single SQL statement combining several operations through multiple CTEs (incl. a data-modifying CTE like `DELETE ... RETURNING` used for its side effect) and `ON CONFLICT ... DO UPDATE`. This kind of orchestration isn't modeled by any single entity or QB flow.

#### SQL-05

An ad-hoc JSON-shaped aggregation (`jsonb_build_object`/`json_agg`, incl. over CTEs) producing a custom read DTO - e.g. a nodes/edges graph - that is not a projection of any single entity. No QB models this shape directly.

#### SQL-06

Combining several independent derived-table subqueries via `UNION`/`NOT EXISTS`-style set operations across tables that aren't in a relation with each other, to resolve a derived result (e.g. an effective-permission or precedence computation) that is then joined or aggregated further. mikro-orm's non-entity QB (`NativeQueryBuilder`) has no union combinator at all.

</details>

----
