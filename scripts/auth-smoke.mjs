import assert from 'node:assert/strict'
const origin = process.env.SMOKE_APP_ORIGIN || 'http://localhost:3000'
const project = process.env.SMOKE_ALLAUTH_PROJECT || process.env.ALLAUTH_PROJECT || 'schoolscope-development'
const request = (path, options) => fetch(`${origin}${path}`, { redirect: 'manual', ...options })
const session = await request('/api/allauth/get-session')
assert.equal(session.status, 200)
assert.equal(await session.json(), null)
assert.equal((await request('/api/auth/me')).status, 401)
const dashboard = await request('/dashboard')
assert.equal(dashboard.status, 307)
assert.match(dashboard.headers.get('location'), /\/(login|sign-in)$/)
assert.equal((await request('/api/allauth/admin/list-users')).status, 404)
assert.equal((await request('/api/allauth/sign-out', {
  method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}',
})).status, 403)
const config = await request('/api/allauth/sdk/config')
assert.equal(config.status, 200)
const policy = await config.json()
assert.equal(policy.branding.name, 'SchoolScope')
assert.equal(typeof policy.emailVerificationRequired, 'boolean')
const forged = await request('/api/auth/me', { headers: { cookie: `allauth_project_${project}.session_token=forged-token` } })
assert.equal(forged.status, 401)
console.log('PASS: native configuration, anonymous/forged sessions, protected dashboard, admin allowlist and cross-origin rejection')
