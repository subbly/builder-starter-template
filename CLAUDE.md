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

`daemon/` holds the sandbox daemon: a small Node 24 server that runs under its own systemd unit, outside pm2 and `main`. It serves `/version`, `/stats` and `/output` on `/run/subbly/daemon.sock`, and `/version` and `/output` on port 29170. Every other TCP path needs a daemon token (`Authorization: Bearer`), checked by `bundle/token.mjs`; a refused token gets a 401 with its reason. Every TCP response, the `OPTIONS` preflight included, carries exact-origin CORS for the Builder origins in `bundle/contract.mjs`.

- `/output` streams the dev server output (`.subbly/logs/output.log`) as SSE with a resumable cursor in `Last-Event-ID`: `bundle/output-log.mjs` resolves a cursor against the live file and pm2-logrotate's archives, `bundle/output.mjs` follows the file, and `bundle/event-stream.mjs` writes the first comment, the heartbeats and the `expired` frame at the token's `exp`. The cursor needs plain archives: `template.ts` pins pm2 and pm2-logrotate and sets `compress false`. Change those pins only with the cursor tests and a rotation check.

- `daemon/bundle/` is every file the sandbox gets: the `.mjs` sources (plain ESM, no dependencies, no build step), `install.sh`, `subbly-daemon.service` and the committed `manifest.json` (`{ build, protocol }`).
- After any change under `daemon/bundle/`, run `pnpm daemon:manifest` and commit the new `manifest.json`. The build is a hash of the other files. Bump the protocol (`node daemon/manifest.mjs --protocol <n>`) only on a contract break. The template build refuses a stale manifest.
- `daemon/keys/<environment>.json` is the environment's key file (`{ iss, keys }`, each key an Ed25519 public JWK with its `kid`, at most two). The template build writes it to `/etc/subbly/daemon-keys.json`, outside the bundle, so a key change never changes the build. The daemon reloads it on `systemctl reload subbly-daemon` and keeps its keys if the new file does not load. `production.json` holds no key until the production signer is made.
- `pnpm daemon:test` runs the daemon's own tests (`node --test`). `daemon/test/token-vectors.json` is the shared token vector file: the subbly-builder web app keeps a byte-identical copy for its `sign` suite. Change it here, then copy it there.
- The template build copies `daemon/bundle` and runs its `install.sh`. Existing sandboxes get the same files through a sandbox migration in the subbly-builder monorepo, which carries its own copy and the expected build and protocol. A daemon change ships both: a template release and a new sandbox version.
- Memory is a first-class requirement. Run `pnpm daemon:smoke` (10 minutes) for every daemon change and `pnpm daemon:soak` (60 minutes) before each rollout step. Both need `E2B_API_KEY` and a `*-dev` template in `E2B_TEMPLATE` or `--template`, create one dev sandbox and kill it at the end.
