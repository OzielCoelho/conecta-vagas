# Conecta Vagas

Plataforma full stack para aproximar estudantes e empresas por meio da publicação de vagas, candidaturas e análise de compatibilidade entre perfis.

## Funcionalidades

- Cadastro e autenticação com JWT.
- Perfis com os papéis `STUDENT`, `COMPANY` e `COORDINATOR`.
- Criação e edição de perfis de estudantes e empresas.
- Publicação, consulta e gerenciamento de vagas.
- Candidatura de estudantes às vagas.
- Cálculo de compatibilidade entre estudante e vaga.
- Acompanhamento do status das candidaturas.
- Notificações de vagas, candidaturas e atualizações de perfil.
- Exportação de candidaturas em CSV para coordenadores.
- Interface responsiva e modo de demonstração no frontend.

## Tecnologias

### Backend

- Node.js e TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- JWT e bcryptjs
- Vitest

### Frontend

- React 19
- React Router
- TypeScript
- Vite

## Estrutura do projeto

```text
conecta_vagas/
├── apps/
│   └── web/                 # Aplicação React
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── services/
│           ├── auth/
│           └── notifications/
├── prisma/
│   ├── migrations/          # Migrations do banco
│   └── schema.prisma        # Modelos e enums do Prisma
├── src/
│   ├── modules/             # Domínios da API
│   ├── shared/              # Prisma, erros e middlewares
│   ├── tests/               # Testes automatizados
│   └── server.ts            # Entrada da API
├── .env.example
├── package.json
└── prisma.config.ts
```

## Pré-requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL 14 ou superior, instalado localmente ou executado via Docker
- Docker (opcional, recomendado para o banco local)

## Configuração

### 1. Obtenha o projeto

```bash
git clone https://github.com/silv0007/conecta_vagas.git
cd conecta_vagas
```

### 2. Instale as dependências do backend

```bash
npm install
```

### 3. Instale as dependências do frontend

```bash
cd apps/web
npm install
cd ../..
```

### 4. Configure o PostgreSQL

Com Docker, crie um banco dedicado ao projeto:

```bash
docker run -d \
  --name conecta-vagas-postgres \
  -e POSTGRES_PASSWORD=12345 \
  -e POSTGRES_DB=conectavagas \
  -p 5432:5432 \
  postgres:17-alpine
```

Nas próximas execuções, basta iniciar o container existente:

```bash
docker start conecta-vagas-postgres
```

Se preferir uma instalação local do PostgreSQL, crie o banco `conectavagas` e ajuste a `DATABASE_URL` conforme seu usuário, senha, host e porta.

### 5. Configure o backend

Crie `.env` na raiz, usando `.env.example` como referência:

```env
DATABASE_URL="postgresql://postgres:12345@localhost:5432/conectavagas"
JWT_SECRET="troque_por_uma_chave_longa_e_aleatoria"
PORT=3333
```

Variáveis:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL de conexão com o PostgreSQL |
| `JWT_SECRET` | Sim | Chave usada para assinar tokens JWT |
| `PORT` | Não | Porta da API; o padrão é `3333` |

Não publique o `.env` ou credenciais reais no repositório.

### 6. Configure o frontend

Crie `apps/web/.env`, usando `apps/web/.env.example` como referência:

```env
VITE_API_URL=http://localhost:3333
```

### 7. Gere o Prisma Client e aplique as migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

Para criar uma migration durante o desenvolvimento após modificar o schema:

```bash
npx prisma migrate dev --name descricao_da_alteracao
```

## Executando em desenvolvimento

Abra dois terminais.

No primeiro, inicie a API a partir da raiz:

```bash
npm run dev
```

No segundo, inicie o frontend:

```bash
cd apps/web
npm run dev
```

Acesse:

- Frontend: <http://localhost:5173>
- API: <http://localhost:3333>
- Verificação da API: <http://localhost:3333/health>

O endpoint de verificação deve responder:

```json
{
  "status": "ok"
}
```

## Build e testes

### Backend

```bash
npm run build
npm test
```

### Frontend

```bash
cd apps/web
npm run build
```

O build do frontend é gerado em `apps/web/dist`.

## Scripts disponíveis

### Raiz

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia a API com recarregamento automático |
| `npm run build` | Compila o backend TypeScript |
| `npm test` | Executa os testes com Vitest |

### `apps/web`

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Verifica os tipos e gera o build do frontend |
| `npm run preview` | Serve localmente o build de produção |

## Autenticação

As rotas protegidas esperam um token JWT no cabeçalho:

```http
Authorization: Bearer SEU_TOKEN
```

Exemplo de login:

```bash
curl -X POST http://localhost:3333/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aluno@example.com","password":"123456"}'
```

## Principais rotas da API

### Usuários

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/users/register` | Público | Cadastra estudante ou empresa |
| `POST` | `/users/login` | Público | Autentica e retorna o token JWT |
| `GET` | `/users/me` | Autenticado | Retorna o usuário atual |
| `PATCH` | `/users/me` | Autenticado | Atualiza o e-mail |
| `PATCH` | `/users/password` | Autenticado | Atualiza a senha |

No cadastro público, `role` aceita `STUDENT` ou `COMPANY`. Contas de coordenador não são criadas pela rota pública.

### Estudantes

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/students` | Estudante | Cria o próprio perfil |
| `GET` | `/students/me` | Estudante | Obtém o próprio perfil |
| `GET` | `/students` | Empresa/coordenador | Lista estudantes |
| `PUT` | `/students/:id` | Estudante/coordenador | Atualiza um perfil |

### Empresas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/companies` | Empresa | Cria o próprio perfil |
| `GET` | `/companies/me` | Empresa | Obtém o próprio perfil |
| `PUT` | `/companies/:id` | Empresa/coordenador | Atualiza um perfil |

### Vagas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/jobs` | Empresa | Publica uma vaga |
| `GET` | `/jobs` | Autenticado | Lista vagas |
| `GET` | `/jobs/mine` | Empresa | Lista vagas da empresa atual |
| `GET` | `/jobs/:id` | Autenticado | Obtém uma vaga |
| `PUT` | `/jobs/:id` | Empresa/coordenador | Atualiza uma vaga |

Os modelos de trabalho aceitos são `REMOTE`, `IN_PERSON` e `HYBRID`.

### Candidaturas

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/applications` | Estudante | Candidata-se usando `jobId` |
| `GET` | `/applications/me` | Estudante | Lista as próprias candidaturas |
| `GET` | `/applications/job/:jobId` | Empresa/coordenador | Lista candidatos de uma vaga |
| `PATCH` | `/applications/:id/status` | Empresa/coordenador | Atualiza o status |
| `GET` | `/applications/export/csv` | Coordenador | Exporta candidaturas em CSV |

Fluxo de status permitido:

```text
SENT
├── UNDER_REVIEW
│   ├── INTERVIEW
│   │   ├── APPROVED
│   │   └── REJECTED
│   └── REJECTED
└── REJECTED
```

### Notificações

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/notifications` | Autenticado | Lista notificações do usuário |
| `PATCH` | `/notifications/read-all` | Autenticado | Marca todas como lidas |
| `PATCH` | `/notifications/:id/read` | Autenticado | Marca uma notificação como lida |
| `POST` | `/notifications/system` | Coordenador | Cria uma notificação do sistema |

## Modelo de dados

Os principais modelos são:

- `User`: credenciais e papel do usuário.
- `Student`: dados acadêmicos, habilidades e disponibilidade.
- `Company`: informações institucionais da empresa.
- `Job`: vaga associada a uma empresa.
- `Application`: candidatura de um estudante a uma vaga.
- `Notification`: notificações direcionadas aos usuários.

Um estudante pode se candidatar apenas uma vez a cada vaga.

## Solução de problemas

### A API não conecta ao banco

Confira se o PostgreSQL está ativo:

```bash
docker ps
docker exec conecta-vagas-postgres pg_isready -U postgres -d conectavagas
```

Verifique também usuário, senha, porta e banco definidos em `DATABASE_URL`.

### Tabelas não encontradas

```bash
npx prisma migrate deploy
```

### Prisma Client não encontrado

```bash
npx prisma generate
```

### `JWT_SECRET não configurado`

Crie o `.env` na raiz e defina `JWT_SECRET`.

### O frontend não acessa a API

Confirme que a API está em execução e que `VITE_API_URL` aponta para a URL correta. Reinicie o Vite depois de alterar o arquivo `.env`.

### A porta já está em uso

Altere `PORT` no `.env` do backend e atualize `VITE_API_URL` no frontend. Para o PostgreSQL via Docker, mapeie outra porta e atualize a `DATABASE_URL`.

## Recomendações para produção

- Use uma chave JWT longa e armazenada em um gerenciador de segredos.
- Restrinja o CORS aos domínios autorizados.
- Execute `npm audit` e avalie as atualizações de dependências.
- Utilize HTTPS.
- Configure backups do PostgreSQL.
- Use armazenamento de objetos para imagens, mantendo apenas as URLs no banco.
- Revise as permissões de atualização de perfis antes da publicação.

## Licença

Este projeto está configurado com a licença ISC no `package.json`.
