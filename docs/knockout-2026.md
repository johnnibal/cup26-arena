# Knockout stage — 2026 World Cup format (future feature)

This document describes the **planned** knockout pipeline for Cup26 Arena. It is **not implemented** yet: no migrations, tables, or application logic should be assumed to exist until a dedicated implementation pass.

---

## Competition rules (2026)

- **12** groups of **4** teams each.
- **Top 2** from each group qualify → **24** teams.
- The **8 best third-place** teams (from the 12 group thirds) also qualify.
- **Round of 32** field = **32** teams total.

---

## Planned implementation order

1. **Group standings** — Calculate standings from group-stage results only (points, goal difference, goals scored, head-to-head, etc., following the official tie-break order for the tournament).
2. **Within-group ranking** — Rank positions **1–4** inside each group from those standings.
3. **Third-place pool** — Rank all **12** third-place finishers using the rules published for ranking third-placed teams across groups; select the **top 8** as qualifiers.
4. **Store qualified teams** — Persist who advanced, with enough metadata to audit and to regenerate knockouts if a group result is corrected (e.g. group position, rank among thirds).
5. **Round of 32 generation** — Build R32 match rows using a **`bracket_slots`** (or equivalent) table: each slot defines how **home** and **away** are populated from qualified teams (group winners, runners-up, third-place slots). Pairing logic in code should **read configuration**, not encode unofficial FIFA pairings.
6. **Admin review** — Generated knockout fixtures should be **reviewable**; an admin **approves** them before they are treated as official for predictions, locks, and public UI.

---

## Design constraints

- **Do not assume unofficial bracket pairings.** The exact mapping from groups and third-place ranks to R32 games must be **data-driven** so it can be updated when FIFA releases the final matrix.
- **`bracket_slots` must be configurable in the database** (or equivalent persisted config). Application code should interpret slots generically (e.g. “home = 1A”, “away = third-place rank 5 among qualifiers”), not hard-coded `if (group === 'X')` branches for the 2026 grid.
- A future iteration may add a **versioned bracket definition** per tournament edition so seed data can change without rewriting core algorithms.

---

## Why `bracket_slots` (conceptual)

Third-place assignment to specific R32 games is historically a **fixed but document-specific** mapping. Storing that mapping as **rows** allows:

- Updating the official FIFA pairing table without code deploys.
- Testing and admin preview of generated fixtures before go-live.
- Clear separation between **standings math** (deterministic from results) and **slot assignment** (tournament-specific configuration).

---

## Out of scope for this document

- SQL migrations, table shapes, or RLS.
- API routes, UI flows, or changes to existing `matches` / prediction logic.
- Confirmation of FIFA’s published 2026 third-place ranking procedure beyond “follow official regulations when implementing.”

When implementation starts, replace or extend this doc with concrete schema notes and admin workflow details.
