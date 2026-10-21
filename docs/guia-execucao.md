# Guia de execucao

## Pre-requisitos

- Node.js 20.19+ e npm.
- PostgreSQL 14+ local ou Docker.
- Git.

## Instalacao

Na raiz:

~~~
npm install
npx prisma generate
~~~

No frontend:

~~~
cd apps/web
npm install
cd ../..
~~~

## Banco de dados

Com Docker:

~~~
docker run --name conecta-vagas-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=conectavagas -p 5432:5432 -d postgres:17-alpine
~~~

Para um container existente:

~~~
docker start conecta-vagas-postgres
npx prisma migrate deploy
~~~

## Variaveis de ambiente

Crie .env na raiz usando .env.example:

~~~
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/conectavagas"
JWT_SECRET="troque_por_uma_chave_longa_e_aleatoria"
PORT=3333
JWT_TTL_SECONDS=3600
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=60000
~~~

Crie apps/web/.env usando apps/web/.env.example:

~~~
VITE_API_URL=http://localhost:3333
~~~

Nao publique arquivos .env, tokens ou senhas.

## Execucao

Terminal 1, na raiz:

~~~
npm run dev
~~~

Terminal 2, em apps/web:

~~~
npm run dev
~~~

Acesse http://localhost:5173. A API responde em http://localhost:3333 e o health check em /health.

## Testes e build

Na raiz:

~~~
npm test
npm run typecheck
npm run build
~~~

No frontend:

~~~
cd apps/web
npm run typecheck
npm run build
~~~

## Problemas comuns

- Banco indisponivel: confirme PostgreSQL ou o container.
- Variavel ausente: compare .env com .env.example.
- Tabela ausente: execute npx prisma migrate deploy.
- Frontend sem API: confira VITE_API_URL e a porta 3333.
- Node incompativel: use Node.js 20.19+ para o Vite atual.
