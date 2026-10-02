import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

// Always provision our own disposable PostgreSQL. Never consume DATABASE_URL.
const container = `cvag001-test-${process.pid}-${Date.now()}`;
const password = 'disposable_test_only';
const run = (command, args, options = {}) => execFileSync(command, args, {
  encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000, ...options,
});
const docker = (...args) => run('docker', args);
const sql = (db, input) => run('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-At'], { input });
const prisma = (env, ...args) => run(process.execPath, ['node_modules/prisma/build/index.js', ...args], { env });
let api;

async function apiSmoke(env) {
  const socket = createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  api = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    env: { ...env, PORT: String(port), JWT_SECRET: 'disposable_migration_test_secret' },
    stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(`${base}/health`)).ok; } catch {}
    if (ready || api.exitCode !== null) break;
    await delay(100);
  }
  assert.ok(ready, 'API must start against migrated database');
  async function request(path, method = 'GET', body, token, status = 200) {
    const response = await fetch(base + path, { method, headers: {
      'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(response.status, status, `${method} ${path}`);
    return response.json();
  }
  async function account(role) {
    const body = { email: `${role.toLowerCase()}@example.test`, password: 'test_password', role, firstName: 'Aluno', lastName: 'Teste' };
    await request('/users/register', 'POST', body, undefined, 201);
    return (await request('/users/login', 'POST', {
      email: body.email,
      password: body.password,
    })).token;
  }
  const student = await account('STUDENT');
  const company = await account('COMPANY');
  const profile = { name: 'Aluno Teste', course: 'Computação', skills: ['TypeScript'], availability: ['MANHA', 'NOITE'], headline: 'Estudante', summary: 'Resumo', city: 'Manaus', state: 'AM', semester: '3', university: 'Universidade', cr: '9', photoUrl: 'https://example.test/student.png' };
  await request('/students', 'POST', profile, student, 201);
  const saved = await request('/students/me', 'GET', undefined, student);
  for (const [key, value] of Object.entries(profile)) assert.deepEqual(saved[key], value);
  const business = { legalName: 'Empresa Teste Ltda', tradeName: 'Empresa Teste', logoUrl: 'https://example.test/logo.png', commercialPhone: '92999999999', cultureDescription: 'Aprendizado', businessSector: 'Tecnologia' };
  await request('/companies', 'POST', business, company, 201);
  const savedBusiness = await request('/companies/me', 'GET', undefined, company);
  for (const [key, value] of Object.entries(business)) assert.equal(savedBusiness[key], value);
  assert.equal(savedBusiness.name, business.tradeName);
  await request(`/companies/${savedBusiness.id}`, 'PUT', { legalName: 'Nova Razão Ltda' }, company);
  let updatedBusiness = await request('/companies/me', 'GET', undefined, company);
  assert.equal(updatedBusiness.legalName, 'Nova Razão Ltda');
  assert.equal(updatedBusiness.name, business.tradeName);
  assert.equal(updatedBusiness.tradeName, business.tradeName);
  await request(`/companies/${savedBusiness.id}`, 'PUT', { tradeName: '  Novo Nome  ', about: '  Nova descrição  ' }, company);
  updatedBusiness = await request('/companies/me', 'GET', undefined, company);
  assert.equal(updatedBusiness.name, 'Novo Nome');
  assert.equal(updatedBusiness.tradeName, 'Novo Nome');
  assert.equal(updatedBusiness.about, 'Nova descrição');
  assert.equal(updatedBusiness.cultureDescription, 'Nova descrição');
  assert.equal(updatedBusiness.logoUrl, business.logoUrl);
  await request(`/companies/${savedBusiness.id}`, 'PUT', { tradeName: '  ' }, company, 400);
  assert.equal((await request('/companies/me', 'GET', undefined, company)).tradeName, 'Novo Nome');
  const job = await request('/jobs', 'POST', { title: 'Estágio', description: 'Desenvolvimento', skills: ['TypeScript'], model: 'REMOTE', course: 'Computação', availability: 'MANHA' }, company, 201);
  const application = await request('/applications', 'POST', { jobId: job.id }, student, 201);
  assert.ok(application.id);
  const applications = await request('/applications/me', 'GET', undefined, student);
  assert.ok(applications.some(item => item.id === application.id));
  await request('/notifications', 'GET', undefined, student);
  await request('/notifications', 'GET', undefined, company);
  await new Promise(resolve => { api.once('exit', resolve); api.kill(); });
  api = undefined;
}

try {
  docker('run', '--detach', '--rm', '--name', container, '--env', `POSTGRES_PASSWORD=${password}`, '--publish', '127.0.0.1::5432', 'postgres:17-alpine');
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { docker('exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'); ready = true; break; } catch {}
    await delay(100);
  }
  assert.ok(ready, 'Disposable PostgreSQL must start');
  const port = docker('port', container, '5432/tcp').trim().split(':').at(-1);
  for (const db of ['fresh', 'legacy']) {
    sql('postgres', `CREATE DATABASE ${db};`);
    const env = { ...process.env, DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/${db}` };
    if (db === 'legacy') {
      sql(db, readFileSync('prisma/migrations/20260329214837_init/migration.sql', 'utf8'));
      sql(db, `INSERT INTO "User" (id,email,password,role,"updatedAt") SELECT 'legacy-' || n, 'legacy-' || n || '@example.test', 'not-a-real-hash', 'STUDENT', NOW() FROM generate_series(1,5) n;
        INSERT INTO "Student" (id,name,course,skills,availability,"userId","updatedAt") SELECT 'legacy-' || n, 'Original', 'Computação', ARRAY['SQL'], value, 'legacy-' || n, NOW() FROM unnest(ARRAY['MANHA','', 'MANHA,TARDE', '{MANHA,NOITE}', ' manhã / noite ']) WITH ORDINALITY AS t(value,n);
        CREATE TABLE legacy_snapshot AS SELECT id, availability, name, skills, "userId" FROM "Student";`);
      prisma(env, 'migrate', 'resolve', '--applied', '20260329214837_init');
    }
    prisma(env, 'migrate', 'deploy');
    prisma(env, 'migrate', 'deploy'); // Re-running deploy must be a no-op.
    if (db === 'legacy') {
      assert.equal(sql(db, `SELECT count(*) FROM legacy_snapshot s JOIN "Student" t USING(id) WHERE t.availability = ARRAY[s.availability] AND t.name = s.name AND t.skills = s.skills AND t."userId" = s."userId";`).trim(), '5');
      sql(db, 'DROP TABLE legacy_snapshot;'); // Only our synthetic test snapshot.
    }
    prisma(env, 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code');
    prisma(env, 'generate');
    await apiSmoke(env);
    assert.ok(Number(sql(db, 'SELECT count(*) FROM "Notification";').trim()) > 0);
    console.log(`PASS ${db}: deploy twice, schema parity, generate, profiles, applications and notifications`);
  }
} finally {
  if (api) api.kill();
  try { docker('rm', '--force', '--volumes', container); } catch {}
}
