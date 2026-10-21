# Conecta Vagas

Plataforma full stack para aproximar estudantes e empresas por meio de vagas, candidaturas e compatibilidade de perfis.

## Execucao rapida

- Frontend: http://localhost:5173
- API: http://localhost:3333
- Health check: http://localhost:3333/health
- Guia completo: [docs/guia-execucao.md](docs/guia-execucao.md)

~~~
git clone https://github.com/Uninorte-Extensao/conecta-vagas.git
cd conecta-vagas
npm install && npx prisma generate && npx prisma migrate deploy
~~~

Em outro terminal:

~~~
cd apps/web && npm install && npm run dev
~~~

Crie os arquivos .env a partir de .env.example. Nunca publique segredos.

## Funcionalidades

- Cadastro e autenticacao JWT para estudantes, empresas e coordenacao.
- Perfis, vagas, candidaturas e acompanhamento de status.
- Matching deterministico entre perfil e vaga.
- Notificacoes e exportacao de candidaturas em CSV.
- Modo demonstrativo no frontend.

## Tecnologias

React, React Router, TypeScript e Vite no frontend; Node.js, TypeScript, Fastify, Prisma e PostgreSQL no backend; JWT, bcryptjs, CORS, rate limit, Vitest e GitHub Actions na qualidade e seguranca.

## Estrutura

~~~
apps/web/       frontend React
src/            API Fastify e testes do backend
prisma/         schema e migrations
docs/           guias e documentacao de arquitetura
~~~

## Arquitetura

- [Diagrama editavel](docs/arquitetura-conecta-vagas.drawio)
- [Diagrama visual](docs/arquitetura-conecta-vagas.svg)

~~~
Usuario -> React/Vite -> API Fastify -> Prisma -> PostgreSQL
~~~

Storage de objetos e Groq/LLM sao possibilidades futuras.

## Desenvolvimento e validacao

Na raiz:

~~~
npm run dev
npm test
npm run typecheck
~~~

No frontend:

~~~
npm run dev
npm run typecheck
npm run build
~~~

Consulte o [guia de execucao](docs/guia-execucao.md) para PostgreSQL, Docker, variaveis de ambiente, migrations e problemas comuns.

## Equipe

Projeto academico de extensao desenvolvido pela equipe Conecta Vagas.
