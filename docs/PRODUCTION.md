# SchoolScope production operations

## Services and identity

The main site is `https://schoolscope.com.au` (Railway fallback `https://schoolscope-production.up.railway.app`). Railway project `8f7d3a61-68fb-4fb3-88b5-de45699813bd`, environment `d4d962e4-0775-4537-8b30-ccbbfe52585d`, contains:

- `schoolscope` web: `af0535f0-e214-44df-b2cb-890697fb331b`, public port 8080.
- `tutor-controller`: `96fe3b83-cdba-48e5-859e-a4a453d82059`, private port 3001, exactly one replica and zero overlap.
- Existing `Postgres`: `df0ff603-06d9-4cf5-8802-59bd40f3ff36`.
- Private `tutor-worksheets` bucket: `b3939af0-9ef6-4ad8-bbe5-7ba3503673f8`, Singapore.

Both app services build `Dockerfile.tutoring`. The Docker build reads the service's `NEXT_PUBLIC_APP_URL` build argument; the default is the main production origin. Web starts with migrations followed by Next.js on port 8080. Controller starts with migrations followed by `pnpm tutor:controller`. Migration failure prevents serving an incompatible schema. The controller has no public domain.

AllAuth uses the dedicated SchoolScope workspace's **Production** environment, exact slug `schoolscope-production`, with the two public origins above. The Development environment remains isolated for localhost and the tutor preview. Proxy secrets and the shared controller signing secret are private Railway variables. The controller references the existing web service's OpenAI key, the existing database, and the bucket's generated variables.

The identity migration retains application users, permissions, children, school records and events. Existing Clerk sessions and credentials do not transfer. Users must sign in through AllAuth with the same verified email to recover the matching existing application record. A different already-linked AllAuth subject cannot claim it. Keep a verified secure database dump, including the old provider mapping, before this migration; keep the accompanying previous configuration outside the repository for rollback.

## Adult tutoring gate

Production publishes the adult demonstration with a fictional learner. `TUTOR_CHILD_ENABLED=false` and `TUTOR_RETENTION_VERIFIED=false` remain in place on both app services. Do not enable real-child sessions as part of a design release. Existing upload privacy, ownership, origin, retention and content checks remain active. Raw microphone audio is not recorded by the app. Public demo content is deleted within 24 hours.

Usage quotas remain disabled under the owner's unrestricted-preview setting. Costs continue to be recorded. The operator pause switch remains available. The controller must remain a singleton: starting a second instance against the same database invokes recovery and closes existing sessions.

## Release verification

Before publishing:

```sh
pnpm typecheck
pnpm build
pnpm test:tutor
pnpm test:auth-smoke
```

Run `pnpm test:tutor:db` only with `DATABASE_URL` explicitly pointing to **schoolscope_tutor_tests**. This suite deletes its test tutoring tables and must never run against a live database.

After the exact web/controller deployments report success, verify the public origin:

```sh
SMOKE_APP_ORIGIN=https://schoolscope.com.au SMOKE_ALLAUTH_PROJECT=schoolscope-production pnpm test:auth-smoke
SMOKE_APP_ORIGIN=https://schoolscope.com.au pnpm test:tutor:public
```

The tutor smoke creates and stops one synthetic adult-demo session, makes bounded real AI calls, uploads a synthetic worksheet, and checks answers, focused cards, ownership, private image access, idempotency, drawing, notes, CSRF and saved summary. Evidence is written under ignored `output/tutoring/`. Synthetic audio can verify WebRTC transport, transcription, delegated teaching and a complete spoken answer without accessing a real microphone. Check the phone homepage, tutor setup, lesson controls and history in the browser as well.

The earlier tutor preview remains a separate project and database at `https://tutor-web-preview.up.railway.app`. Never use its development identity, database or cost ledger as evidence for production acceptance. Inspect each environment's actual source commit and deployment before reporting it live.
