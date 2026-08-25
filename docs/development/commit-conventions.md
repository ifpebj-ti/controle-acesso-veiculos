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