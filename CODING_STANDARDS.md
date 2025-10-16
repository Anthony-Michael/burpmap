## Coding Standards (Code Complete–grade)

These standards optimize for clarity, simplicity, and low cognitive load in a Next.js + TypeScript +
Tailwind project.

### 1) Clarity over cleverness

- Prefer straightforward solutions. If a simpler approach reads clearly, choose it.
- Avoid premature optimization; measure first.

### 2) Single Responsibility

- Each module/component/function should do one thing well.
- Split code when responsibilities or abstractions diverge.

### 3) Naming

- Use descriptive, intention-revealing names (full words over abbreviations).
- Functions: verb or verb-phrase. Variables: noun or noun-phrase.
- Avoid 1–2 letter names except for trivial indices.

### 4) Comments

- Comment only non-obvious rationale, invariants, or caveats.
- Avoid restating what the code plainly communicates.

### 5) Types and Safety

- Use strict TypeScript. Prefer explicit types for public APIs.
- Avoid `any`; model unknowns precisely. Handle null/undefined explicitly.

### 6) Testing

- Use Vitest + Testing Library with jsdom for UI behaviors.
- Write tests for significant logic, edge cases, and regressions.

### 7) Structure and Boundaries

- Keep components small. Extract hooks/utilities for reusable logic.
- Respect clear boundaries among UI, domain logic, and data access.

### 8) Complexity Limits

- Keep cyclomatic complexity low. Refactor when functions grow complex.
- Enforce limits via ESLint rules (depth/params/statements/lines).

### 9) Formatting and Imports

- Prettier governs formatting; ESLint governs correctness.
- Enforce deterministic import ordering and eliminate unused imports.

### 10) Refactoring Discipline

- Prefer incremental, behavior-preserving refactors.
- Keep PRs focused and reviewable; update tests as you refactor.

### 11) Accessibility & UX

- Follow semantic HTML. Ensure keyboard and screen-reader support.
- Favor predictable interactions and helpful error states.

### 12) Performance

- Render only what’s necessary. Memoize thoughtfully and measure impact.
- Defer non-critical work; avoid blocking the main thread.
