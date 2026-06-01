# Como rodar o projeto Conecta Vagas

Guia rapido pra subir o backend e o frontend localmente.

---

## Pre-requisitos

- Node.js 20 ou superior (voce ja tem v20.19.0)
- npm (vem junto com o Node)
- PostgreSQL rodando em `localhost:5432`
  - usuario: `postgres`
  - senha: `12345`
  - database: `conectavagas` (precisa existir antes de rodar as migrations)

---

## 1) Backend (API Fastify + Prisma)

A pasta do backend e a **raiz do projeto**: `C:\Users\lipe_\Downloads\conecta\conecta_vagas`

### Primeira vez (setup)

```powershell
# instalar dependencias (so na primeira vez ou quando mudar o package.json)
npm install

# gerar o Prisma Client (precisa rodar uma vez antes de subir a API)
npx prisma generate

# aplicar as migrations no banco (cria as tabelas)
npx prisma migrate deploy
```

### Subir a API em modo dev

```powershell
npm run dev
```

Se tudo deu certo, aparece no terminal:

```
🚀 Server running at http://localhost:3333
```

Pra testar, abre no navegador: <http://localhost:3333/health>
Deve responder `{"status":"ok"}`.

### Variaveis de ambiente do backend

Arquivo `.env` na raiz (ja existe). Variaveis usadas:

```
DATABASE_URL="postgresql://postgres:12345@localhost:5432/conectavagas"
JWT_SECRET="dev_secret_conecta_vagas"
PORT=3333
```

---

## 2) Frontend (React + Vite)

A pasta do frontend e: `apps\web`

### Primeira vez (setup)

```powershell
cd apps\web
npm install
```

### Subir o frontend em modo dev

```powershell
# de dentro de apps\web
npm run dev
```

O Vite vai mostrar a URL no terminal (geralmente <http://localhost:5173>).

### Variaveis de ambiente do frontend

Arquivo `.env` dentro de `apps\web` (se nao existir, copia de `.env.example`):

```
VITE_API_URL=http://localhost:3333
```

Essa URL precisa apontar pra API que voce subiu no passo anterior.

---

## Ordem recomendada pra desenvolver

1. Garantir que o PostgreSQL esta rodando.
2. Em um terminal, na raiz do projeto: `npm run dev` (sobe a API na porta 3333).
3. Em **outro terminal**, dentro de `apps\web`: `npm run dev` (sobe o frontend na 5173).
4. Abrir o navegador em <http://localhost:5173>.

---

## Problemas comuns

- **"Cannot connect to database"**: Postgres nao esta rodando ou a senha/usuario do `.env` nao bate.
- **"JWT_SECRET nao configurado"**: o `.env` da raiz sumiu ou nao tem essa variavel.
- **Frontend nao acha a API**: confere se `VITE_API_URL` em `apps\web\.env` esta apontando pra `http://localhost:3333` e se o backend esta no ar.
- **Erro do Prisma com tabela faltando**: rodar `npx prisma migrate deploy` na raiz.
