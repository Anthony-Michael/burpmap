## Contributing

Thank you for contributing! This project values readability first.

### Branching

- `main`: production-ready.
- `develop`: integration branch (if used).
- Feature branches: `feat/short-description`.
- Fix branches: `fix/short-description`.

### Commit Style

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.
- Keep messages imperative and concise; include context if needed in body.

### PR Checklist

- Small, focused changes. Clear title and description.
- Includes tests when behavior changes or is added.
- Passes: `typecheck`, `lint`, `format`, `test` locally.
- Follows `CODING_STANDARDS.md` and avoids unnecessary complexity.

### Code Review Rules (Readability-first)

- Prefer clarity over cleverness; ask for simpler designs where possible.
- Request naming improvements when intent isn’t obvious.
- Encourage smaller components and extracted utilities/hooks.
- Flag magic numbers, implicit assumptions, and unclear error handling.
- Ensure imports are ordered and unused code removed.

### Getting Started

1. Install dependencies: `npm ci`.
2. Create a branch.
3. Make changes following our standards.
4. Run quality checks and tests.
5. Open a PR.
