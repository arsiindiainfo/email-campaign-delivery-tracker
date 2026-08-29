# Contributing

This is a portfolio project by Arsi India Info, but the workflow below is the
same one used internally and is worth following if you're proposing changes.

## Branch naming

`<type>/<short-description>`, e.g. `feat/campaign-pause-resume`,
`fix/webhook-dedup-race`, `docs/deployment-guide`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Keep the subject
line under ~70 characters; explain *why* in the body when it isn't obvious
from the diff.

## Pull requests

- One logical change per PR.
- CI must pass: backend lint/build/test/e2e, frontend lint/build/test, Docker
  image builds, and the license-header check.
- New source files need the standard copyright header (see any existing
  file's first line) — CI's `license-header-check` job enforces this.

## Code style

- Backend: ESLint + Prettier, enforced by `npm run lint` in `backend/`.
- Frontend: ESLint + Prettier, enforced by `npm run lint` in `frontend/`.
- Both run in CI; there are no local pre-commit hooks wired up by default; the
  same lint config used in `npm run lint` can be wired via `lint-staged` if
  you want a local gate — see `backend/package.json`'s `lint-staged` block.
