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

`daemon/` holds the sandbox daemon: a small Node 24 server that runs under its own systemd unit, outside pm2 and `main`. It serves `/version`, `/stats`, `/output`, `/status` and `/watch` on `/run/subbly/daemon.sock`, and all of them but `/stats` on port 29170. Every other TCP path needs a daemon token (`Authorization: Bearer`), checked by `src/token/verdict.mjs`; a refused token gets a 401 with its reason. Every TCP response, the `OPTIONS` preflight included, carries exact-origin CORS for the Builder origins in `src/contract.mjs`.

- `/output` streams the dev server output (`.subbly/logs/output.log`) as SSE with a resumable cursor in `Last-Event-ID`: `src/output/output-log.mjs` resolves a cursor against the live file and pm2-logrotate's archives, `src/output/output.mjs` follows the file, and `src/server/event-stream.mjs` writes the first comment, the heartbeats and the `expired` frame at the token's `exp`. `subbly-dev` logs with pm2's `log_type: 'json'`, so each line of the file is one log record (one pipe read: `message`, `timestamp`, `type` `out` or `err`), and `src/output/record.mjs` turns it into the frame's `{ ts, stream, text, truncated? }`. Keep the JSON log type: the console groups and the agent's `scripts/dev-log.sh -n <records>` text view both read records. The cursor needs plain archives: `template.ts` pins pm2 and pm2-logrotate and sets `compress false`. Change those pins only with the cursor tests and a rotation check.

- `daemon/src/` is the daemon: `main.mjs` and `contract.mjs` at its root, one folder per concept (`server`, `token`, `output`, `status`, `watch`, `facts`), plain ESM with no dependencies and no build step, each test next to its source as `*.test.mjs`, and the committed `manifest.json` (`{ build, protocol }`). `daemon/install/` holds `install.sh` and `subbly-daemon.service`. `daemon/vendor/` holds the `@parcel/watcher` binding and its licence.
- The shipped files are `daemon/install/`, `daemon/vendor/` and every `.mjs` under `daemon/src/` but the tests. `install.sh` puts the `.mjs` files, `manifest.json` and the binding under `/opt/subbly/daemon/<build>/` at the same relative paths, so the unit runs `current/src/main.mjs`.
- After any change to a shipped file, run `pnpm daemon:manifest` and commit the new `manifest.json`. The build is a hash of the shipped files. Bump the protocol (`node daemon/manifest.mjs --protocol <n>`) only on a contract break. The template build refuses a stale manifest.
- `daemon/keys/<environment>.json` is the environment's key file (`{ iss, keys }`, each key an Ed25519 public JWK with its `kid`, at most two). The template build writes it to `/etc/subbly/daemon-keys.json`, outside the bundle, so a key change never changes the build. The daemon reloads it on `systemctl reload subbly-daemon` and keeps its keys if the new file does not load. `production.json` holds no key until the production signer is made.
- `pnpm daemon:test` runs the daemon's own tests (`node --test`). `daemon/src/token/token-vectors.json` is the shared token vector file: the subbly-builder web app keeps a byte-identical copy for its `sign` suite. Change it here, then copy it there.
- The template build copies `daemon/src`, `daemon/vendor` and `daemon/install` and runs `install/install.sh`. Existing sandboxes get the daemon when a sandbox version reprovisions them on the new template. The subbly-builder monorepo carries only the expected build and protocol (`Daemon.expected`). A daemon change ships both: a template release and the new `Daemon.expected`.
- Memory is a first-class requirement. Run `pnpm daemon:smoke` (10 minutes) for every daemon change and `pnpm daemon:soak` (60 minutes) before each rollout step. Both need `E2B_API_KEY` and a `*-dev` template in `E2B_TEMPLATE` or `--template`, create one dev sandbox and kill it at the end.
