# SchoolScope tutoring preview

Public adult demo: https://tutor-web-preview.up.railway.app/tutor/demo
Local demo: http://localhost:3000/tutor/demo

## Start locally

The private `.env` is already configured. PostgreSQL persists in the existing SchoolScope Docker volume.

```sh
pnpm install --frozen-lockfile
pnpm docker:up
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev:all
```

If Next.js is already running, keep it and run `pnpm tutor:controller` in a second terminal. Do not start a second copy of the controller against the same database: it closes active sessions during startup recovery. Local testing and the hosted preview use separate databases and budget ledgers.

The demo flow is Year 4 / NSW → Fractions → adult confirmation and processing consent → start → upload a worksheet or use the sample → Talk with Ripple (or type) → try a question → Parent view → End lesson → Lesson notes/history. Microphone permission is requested only after pressing Talk. Unsupported or denied microphones leave typed participation available. Parent view mutes a microphone already running on that same device.

## Runtime and records

Next.js authorizes AllAuth parent sessions and signed anonymous visitor cookies, checks mutation origins, and forwards only signed requests to the internal controller. The controller runs separately with PostgreSQL-backed admission, transcripts, workspace operations, uploads and usage reservations. Its health endpoint exposes no credentials or user data. Use one controller replica. It owns the sideband connection and all AI calls; client data-channel commands are disabled.

`gpt-live-1` uses the `ripple` voice with client delegation. The backend uses `gpt-6-luna` and permits one `gpt-6-sol` review per turn when needed. Supported tools produce schema-validated teaching steps: fraction bars, equations, number lines, geometry, worked steps, questions, feedback and worksheet highlights. Uploaded text cannot create arbitrary HTML, execute code or select server tools. Maths is AI-generated practice guidance, not a formal grade or a guarantee of correctness.

Photos are decoded/re-encoded with metadata stripped, bounded to 1,400 pixels. PDFs are limited to five pages per lesson and rebuilt without annotations/catalog actions. There are at most three files and 10 MB per input file. Images/PDFs are passed only to the vision backend, with the exact attachment identifier for valid highlights. Backend input counting rejects requests above 10,000 tokens; outputs are bounded to 1,200 tokens. Preview URLs expire after a minute and still require the owning browser/parent. PDFs are rendered with the bundled PDF.js worker, not embedded executable documents.

The versioned curriculum registry gives broad Australian year-band teaching context and links to official sources. NSW uses Stage 2/3 language and Victoria points to Curriculum 2.0. It does not claim exact syllabus-outcome mapping, school endorsement, or knowledge of what a school taught this week. Only country, state, year and selected maths topic reach the model; the application's child name, exact school and parent contact details do not.

No raw audio is recorded by the application. Synthetic audio may be captured only by local browser verification, outside the application. Public demo content expires after 24 hours and private content after 30 days; the controller cleans expired records and objects every minute. Explicit deletion removes content while retaining a detached, anonymous cost ledger. Analytics and advertising scripts are disabled across this preview deployment.

## Limits and operations

Usage quotas are disabled at the owner's request for unrestricted proof-of-concept testing (`TUTOR_ENFORCE_LIMITS=false`). There are no application trial, daily-spend, concurrent-session, teaching-call or ten-minute session caps. Cost reporting still records model/voice usage; it does not enforce a ceiling. Upload-size/type checks, authorization, moderation and the administrator pause switch remain enabled. A native voice connection may still end under the provider's transport/session rules; start another lesson to reconnect.

The original admission caps remain opt-in behind `TUTOR_ENFORCE_LIMITS=true` for a later controlled trial, but neither local nor public preview enables that setting. Budget reservations are estimates until final usage is confirmed. Application records expire under the existing 24-hour demo / 30-day private retention policy.

The controller still closes disconnected sessions after missing learner heartbeats for 60 seconds and responds to the administrator pause switch. Shutdown closes native voice sessions and discards outdated work. These are resource/privacy cleanup controls, not testing quotas. SSE readers reconnect and resume by event sequence. A final usage event confirms provider finalization; a socket close alone does not.

### Focused lesson cards

The learner sees one question at a time, with its relevant visual and multiple-choice options. Tap a choice, say A/B/C/D or the answer, or type it. All paths use the same teaching backend and current visible-card context. New questions slide into focus; swipe or use Previous/Next to review immutable earlier question snapshots. Reviewing an old card updates the tutor's context so “this question” is unambiguous. Newer intent cancels outdated in-flight work. The active workspace is kept compact while the full card history remains in session events.

The transcript follows new spoken words unless the reader deliberately scrolls back, in which case Latest words returns to the live end. On phones, lessons scroll naturally so questions, visuals and answer choices remain readable. The persistent Learn, Talk, Type and My work controls open one task at a time; saved lessons and parent view show Learn, Chat and My work. Conversation, lesson notes and the photo/PDF worksheet panel remain available on demand. Shared SchoolScope colours, branding, rounded controls and at least 44-pixel touch targets connect the tutor with the family app. Inputs use 16-pixel text; reduced-motion preferences are respected. Desktop keeps the worksheet, lesson and conversation alongside one another.

AllAuth application administrators can use `/tutor/admin` for live spend/reservation totals and the pause/resume switch. Operators with the environment's database access can also run:

```sh
pnpm tutor:admin status
pnpm tutor:admin pause
pnpm tutor:admin resume
```

Pause ends active sessions and denies new ones. It does not delete history. For Railway, run the command in the tutor-controller environment with `railway ssh --service tutor-controller` so it uses that environment's private database. Do not run local `.env` commands and assume they changed the public preview.

## Hosting and activation

Railway project `SchoolScope Tutoring Preview` (`f723d9c6-b056-4fc8-961d-c891f058f485`), environment `preview`, contains `tutor-web`, `tutor-controller`, its own Postgres and the private `tutor-worksheets` bucket. The web container starts with migrations and reference-school seeding and fails startup if those steps fail. No production families were copied. The preview URL is registered in SchoolScope AllAuth Development alongside localhost.

Use `Dockerfile.tutoring` and the preview branch. Web starts with `pnpm tutor:web`; controller with `pnpm tutor:controller`. The controller listens on IPv6 for Railway private networking; it has no public domain. The OpenAI key and bucket credentials are configured only on the controller. Web has its server-only AllAuth secret and the internal signing secret. Never include `.env`, uploads or test captures in deployment archives. `.railwayignore` and `.dockerignore` enforce those exclusions.

Real child sessions are disabled by default. Enabling them requires both `TUTOR_CHILD_ENABLED=true` and `TUTOR_RETENTION_VERIFIED=true`, after suitable OpenAI retention support has actually been verified for the selected audio/image features and the parent-consent flow reviewed. Do not treat `store:false` as zero-data-retention approval. Before that activation, the current consent UI explicitly permits adult demonstration only and must be changed for a child pilot.

Private child-mode infrastructure restricts the device to one lesson, revokes the parent's native session when entering, and requires a fresh parent sign-in when exiting. Parent observation is from a separate authenticated parent browser/device. Existing ownership is enforced for every private attachment, event and session. Child mode cannot delete parent history or navigate to administration/siblings. These private-mode controls are implemented but real-child end-to-end acceptance remains gated.

## Checks

```sh
pnpm typecheck
pnpm build
pnpm test:tutor
# Database suite refuses any database not named schoolscope_tutor_tests:
DATABASE_URL='postgresql://schoolscope_user:schoolscope_password@localhost:55443/schoolscope_tutor_tests' pnpm test:tutor:db
# Creates a synthetic worksheet; makes real bounded AI calls:
SMOKE_APP_ORIGIN=https://tutor-web-preview.up.railway.app pnpm test:tutor:public
```

The public smoke test makes real bounded AI requests and consumes one public trial. Evidence is saved under ignored `output/tutoring/`; browser screenshots and synthetic voice capture are under ignored `output/playwright/`. Do not run live smoke tests repeatedly without checking the admission and spend ledger.
