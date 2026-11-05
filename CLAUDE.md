# subbly-builder-default

## Versioning

The root `package.json` and `main/package.json` must always carry the same version. The root is the template release version tracked by changesets and CHANGELOG.md. The `main/` one is the site version that ships to users. Since 1.2.1 they move together.

Release steps:

1. Write a changeset in `.changeset/` describing the change. Do not commit the changeset file, or the changelog entry gets a commit hash prefix.
2. Run `pnpm release`. This bumps the root `package.json` and adds the CHANGELOG.md entry.
3. Set `main/package.json` to the same version by hand. Changesets does not touch it.
4. Commit as `chore(release): X.Y.Z` with CHANGELOG.md, `package.json` and `main/package.json` together.

Never bump one file without the other.

## Sandbox daemon

`daemon/` holds the sandbox daemon: a small Node 24 server that runs under its own systemd unit, outside pm2 and `main`, and serves `/version` and `/stats` on `/run/subbly/daemon.sock` and `/version` on port 29170.

- `daemon/bundle/` is every file the sandbox gets: the `.mjs` sources (plain ESM, no dependencies, no build step), `install.sh`, `subbly-daemon.service` and the committed `manifest.json` (`{ build, protocol }`).
- After any change under `daemon/bundle/`, run `pnpm daemon:manifest` and commit the new `manifest.json`. The build is a hash of the other files. Bump the protocol (`node daemon/manifest.mjs --protocol <n>`) only on a contract break. The template build refuses a stale manifest.
- The template build copies `daemon/bundle` and runs its `install.sh`. Existing sandboxes get the same files through a sandbox migration in the subbly-builder monorepo, which carries its own copy and the expected build and protocol. A daemon change ships both: a template release and a new sandbox version.
- Memory is a first-class requirement. Run `pnpm daemon:smoke` (10 minutes) for every daemon change and `pnpm daemon:soak` (60 minutes) before each rollout step. Both need `E2B_API_KEY` and a `*-dev` template in `E2B_TEMPLATE` or `--template`, create one dev sandbox and kill it at the end.
