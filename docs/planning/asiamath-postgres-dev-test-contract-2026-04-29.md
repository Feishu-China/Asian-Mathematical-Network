# Asiamath Postgres Dev/Test Contract

> Date: 2026-04-29  
> Scope: `DR-003` / `PMB-003`

## 1. Official default contract

- Official local default uses one local PostgreSQL instance on `127.0.0.1:5432`.
- `DATABASE_URL` is the development/runtime database URL:
  `postgresql://postgres:postgres@127.0.0.1:5432/asiamath_dev?schema=public`
- `TEST_DATABASE_URL` is the test database URL:
  `postgresql://postgres:postgres@127.0.0.1:5432/asiamath_test?schema=public`
- Dev and test are separated by database name, not by default port.
- `5433` is not an official default. It is a local override only when the machine cannot use `5432`.

## 2. Env-loading rule

- `backend/.env.example` is documentation. It does nothing until copied to `backend/.env`.
- Backend app runtime commands in the `backend` workspace are allowed to rely on `backend/.env`.
  This covers the supported runtime path `cd backend && npm run dev` and `cd backend && npm run start`.
- Backend test does not auto-load `TEST_DATABASE_URL` from the shell for you.
  `cd backend && npm test` depends on `TEST_DATABASE_URL` already being exported in the shell.
- Root seed and integration scripts do not auto-read `backend/.env`.
  `npm run seed:demo`, `npm run seed:review`, `npm run test:portal:int`, and `npm run test:grant:int` all require `DATABASE_URL` to be exported before the command starts.
- Do not assume that running a command from the repo root will magically pick up `backend/.env`.
  If the command is not a backend runtime command, export the env explicitly.

## 3. Official override rule

- Preferred override: keep the official dev/test shape, change only the local port in `backend/.env`.
- If `5432` is unavailable, copy `backend/.env.example` to `backend/.env` and update both URLs together.
- Recommended `5433` override:
  `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public"`
  `TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_test?schema=public"`
- Do not change tracked defaults in `backend/.env.example` just because one machine uses `5433`.
- Explicit exception: if you intentionally run dev and test on different PostgreSQL instances, override `TEST_DATABASE_URL` separately in your shell or local `backend/.env`. That is a local exception, not the project default.

## 4. Command contract

- Uses `backend/.env` as the supported default path:
  `cd backend && npm run dev`
  `cd backend && npm run start`
- Requires env to be exported first:
  `cd backend && npm test`
  `cd backend && DATABASE_URL="$TEST_DATABASE_URL" ../node_modules/.bin/prisma migrate reset --force --skip-seed`
  `npm run seed:demo`
  `npm run seed:review`
  `npm run test:portal:int`
  `npm run test:grant:int`
- Safe habit: if you are about to run a test, seed, or integration command, export env first even if you already have `backend/.env`.

## 5. Minimal commands from zero

### 5.1 Default `5432` path

```bash
cd backend
cp .env.example .env
createdb -h 127.0.0.1 -p 5432 -U postgres asiamath_dev
createdb -h 127.0.0.1 -p 5432 -U postgres asiamath_test
set -a
source .env
set +a
npm run dev
```

### 5.2 Verify backend test contract

```bash
cd backend
set -a
source .env
set +a
npm test
```

### 5.3 Verify root seed / integration contract

```bash
set -a
source backend/.env
set +a
npm run seed:demo
```

`npm run test:portal:int` and `npm run test:grant:int` follow the same rule: export `DATABASE_URL` first, then run the command from the repo root.

## 6. Failure triage

- Error says PostgreSQL at `127.0.0.1:5432` is unreachable:
  your machine is not using the official default port, so override both URLs in `backend/.env` to the real port such as `5433`.
- `npm test` fails because `TEST_DATABASE_URL` is empty or wrong:
  re-export env from `backend/.env` before running the command.
- Root seed or integration script throws `DATABASE_URL must be set`:
  you ran it without exporting env in the current shell; `backend/.env` is not auto-read by those root commands.
