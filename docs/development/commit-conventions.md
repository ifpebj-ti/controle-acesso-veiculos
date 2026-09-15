# Commit Conventions

Each commit must represent one small, logical, and reviewable change.

## Format

```text
type(optional-scope): imperative description
```

## Types

- `feat`: add a user-facing feature.
- `fix`: fix a defect.
- `docs`: update documentation only.
- `test`: add or update tests.
- `chore`: perform maintenance or auxiliary work.
- `refactor`: improve internal code without changing behavior.
- `ci`: update workflows or automation.
- `build`: update build, Docker, dependency, or packaging configuration.

## Rules

- Write commit messages in English.
- Use lowercase in the subject line.
- Use the imperative mood.
- Do not end the subject line with a period.
- Keep the subject concise and focused.
- Use a body when context is needed.
- Reference the related issue in the body with `Refs #<number>`.
- Use `Closes #<number>` only in the pull request or final commit that completes the issue.
- Do not mix unrelated changes in one commit.

## Examples

```text
chore: add AI-assisted development guidelines
build: configure local PostgreSQL environment
feat: configure Entity Framework Core persistence
feat: add initial domain entities
feat: add initial database migration
feat: add API health check
docs: document local database setup
ci: add backend formatting validation
```

## Issues and Pull Requests

- Start each change from the appropriate form in `.github/ISSUE_TEMPLATE`.
- Keep the Issue scope, acceptance criteria, dependencies, risks, and exclusions
  current as decisions are made.
- Use `.github/PULL_REQUEST_TEMPLATE.md` when opening a Pull Request.
- Use `Refs #<number>` while acceptance criteria or required validations remain
  pending, and keep that Pull Request as a draft.
- Use `Closes #<number>` only when the Pull Request completes every acceptance
  criterion and is ready for human review.
- Never include credentials, tokens, real personal data, or exploitable security
  details in a public Issue or Pull Request.

## Releases and changelog

- Record notable unreleased changes in `CHANGELOG.md` as part of the related
  Issue instead of reconstructing release notes from memory.
- Follow Semantic Versioning from the first published release.
- Publish a tag and GitHub Release only from a reviewed commit on `main`.
- Do not describe historical work as a released version unless the corresponding
  tag and release were actually created.
