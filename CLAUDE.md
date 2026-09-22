# subbly-builder-default

## Versioning

The root `package.json` and `main/package.json` must always carry the same version. The root is the template release version tracked by changesets and CHANGELOG.md. The `main/` one is the site version that ships to users. Since 1.2.1 they move together.

Release steps:

1. Write a changeset in `.changeset/` describing the change. Do not commit the changeset file, or the changelog entry gets a commit hash prefix.
2. Run `pnpm release`. This bumps the root `package.json` and adds the CHANGELOG.md entry.
3. Set `main/package.json` to the same version by hand. Changesets does not touch it.
4. Commit as `chore(release): X.Y.Z` with CHANGELOG.md, `package.json` and `main/package.json` together.

Never bump one file without the other.
