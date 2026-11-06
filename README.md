# SchoolScope

Australian school profiles, community events and family calendars. Built with Next.js 16, React 19, PostgreSQL, Prisma 7 and AllAuth.

## Run locally

Requirements: pnpm 10.24 and Docker. The project pins Node 24.13.0 through `.npmrc`, so pnpm downloads and uses the matching runtime.

```sh
pnpm install --frozen-lockfile
cp env-template.txt .env # only on first setup; preserve an existing .env
```

Set the server-only `ALLAUTH_PROXY_SECRET` in `.env` using the selected AllAuth Development environment. The current local setup already has this private file configured. Do not commit credentials.

```sh
pnpm docker:up
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev --hostname 127.0.0.1
```

Open [localhost:3000](http://localhost:3000). The database uses port 55443 locally and persists in the Docker `postgres_data` volume. Change `POSTGRES_PORT` and the port in `DATABASE_URL` together if necessary. The compose default remains 55442 for existing setups. Stop PostgreSQL with `pnpm docker:down`; this preserves its volume.

The idempotent seed imports 10,868 schools from `data/SchoolData.xlsx`. It creates no login accounts. Sign up or continue with Google through AllAuth at `/sign-in` or `/sign-up`. Legacy password test accounts in earlier documentation no longer provide access.

## Authentication

SchoolScope uses the pinned AllAuth React SDK 1.4.4, vendored from the official versioned archive. Its SHA-256 is `bf3896199f789253fbaf0acb6a8c7f8975912bf8bec1118c54668c67ac9896ee`.

The SDK components share one provider, use same-origin `/api/allauth/*` endpoints, and keep native credentials in HttpOnly cookies. The official server proxy signs upstream requests and enforces its endpoint and origin allowlists. The browser receives no integration secret. Enabled sign-in providers and verification/password policies come from the selected environment. Recovery routes are `/forgot-password` and `/reset-password`; `/login` and `/register` remain aliases.

Server authorization validates the native session against AllAuth, requires a verified email, and links its immutable subject to `users.allauthId`. An existing SchoolScope record may be linked by its matching verified email only when it has no different AllAuth identity. Application user IDs, admin permissions, children, events and other related data remain local. AllAuth platform roles never grant SchoolScope administrator rights.

The new migration removes the previous provider mapping and creates the AllAuth mapping. Historical applied migrations remain unchanged so deployed databases retain a valid migration history. Existing provider sessions do not transfer; users must sign in with AllAuth using the same verified email to regain their existing records. This is identity linking, not a password or credential import.

The configured local target is the dedicated **SchoolScope** workspace, **SchoolScope Development**, slug `schoolscope-development`. Development and Production identities and secrets are separate.

## Validation

```sh
pnpm typecheck
pnpm build
pnpm test:auth-smoke # requires the local dev server and configured AllAuth environment
```

## Railway production configuration

Before deploying this authentication migration, provision/select SchoolScope's Production environment in AllAuth, register the exact public application origin, and set these Railway variables:

- `DATABASE_URL`: the existing production database.
- `NEXT_PUBLIC_APP_URL`: the exact HTTPS application origin.
- `ALLAUTH_URL`: `https://allauth.co`.
- `ALLAUTH_PROJECT`: the returned Production slug.
- `ALLAUTH_PROXY_SECRET`: that environment's server-only integration secret.

Verify each desired social provider for that environment. Google, Apple and Microsoft controls appear only when AllAuth advertises them. Optional application email requires `RESEND_API_KEY`; authentication email is handled by AllAuth. The build works without an application email credential, and attempting delivery without it fails explicitly.

Run `pnpm db:migrate:deploy` before serving the new application. The custom production server also runs migrations at startup, but its legacy error handler continues booting on migration failure; verify migrations explicitly during deployment. Remove obsolete provider variables from Railway after the cutover, and verify login, logout, recovery and existing-user data on the public origin. The local setup does not deploy or change Railway/Cloudflare.

## Live tutoring preview

A separate adult-only proof of concept is available at [SchoolScope Tutor](https://tutor-web-preview.up.railway.app/tutor/demo). Run both local processes with `pnpm dev:all`. See [tutoring setup and operations](docs/TUTORING.md) for limits, privacy, testing, and the real-child activation gate.
