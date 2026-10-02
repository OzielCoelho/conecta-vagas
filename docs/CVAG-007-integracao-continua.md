# CVAG-007 — Integração contínua

## Fluxo

`.github/workflows/ci.yml` executa em push, pull_request e workflow_dispatch.
Três jobs obrigatórios rodam de forma independente:

| Job | Verificações |
| --- | --- |
| tests | npm ci, prisma generate, tipos do backend, build e testes após o build |
| frontend | npm ci pelo lockfile do frontend, tipos e build de produção, sem deploy |
| migrations | PostgreSQL descartável, deploy em banco vazio/legado sintético, comparação com schema, geração do client, fluxos HTTP e concorrência |

O PostgreSQL é iniciado pelo script test:migrations no próprio runner, com Docker,
porta aleatória local e credenciais fictícias. Não usa banco compartilhado. Os
containers e volumes temporários são removidos ao final. A geração do client ocorre
antes da API e dos testes que dependem dele. Node 22 e instalação com npm ci são
usados em todos os jobs; o cache armazena downloads npm e é baseado no lockfile de
cada aplicação, sem reaproveitar node_modules.

A verificação de tipos do backend usa tsconfig.check.json e também cobre os scripts
TypeScript de integração, sem emitir arquivos.

`npm test` agora restringe a descoberta a src/tests. O backend é compilado antes dos
testes na CI, garantindo que testes CommonJS gerados em dist não sejam executados.

## Publicação Docker

O job publish declara `needs: [tests, frontend, migrations]`. Se qualquer validação
falhar, for cancelada ou não executar, a publicação não é iniciada. Não há
continue-on-error nem always() nesse caminho.

A publicação ocorre somente no repositório Uninorte-Extensao/conecta-vagas, branch
main, em push ou execução manual do workflow de validações. Pull requests, outras
branches e forks executam apenas as verificações. As tags dev e sha-${github.sha}
continuam sendo publicadas com os secrets DOCKERHUB_USERNAME e DOCKERHUB_TOKEN.
Somente esses secrets são repassados ao workflow reutilizável.

`.github/workflows/docker-publish.yml` passa a aceitar apenas workflow_call e é
chamado pelo job publish, no mesmo commit validado. Ele não tem mais disparo
independente por push ou botão manual que permita contornar as verificações.
Execuções de publicação são serializadas pelo grupo docker-publish-main.

Para executar manualmente: Actions → Validações do projeto → Run workflow.
Na main do repositório principal, uma execução bem-sucedida também publica a API.
Em outras branches, executa somente as validações.

## Cenário controlado de falha

Na execução manual, habilitar simulate_failure faz o job do backend terminar com
exit 1 depois dos testes. O job publish deve ficar skipped; login no Docker Hub e
build/push não devem executar. A opção é falsa por padrão e não altera arquivos.
Para testar o bloqueio completo após a integração, executar na main do repositório
principal com simulate_failure=true. Não usar uma execução normal da main como
simulação: ela publica a imagem quando todas as verificações passam.

## Validação local

```bash
npm ci
npx prisma generate
npm run typecheck
npm run build
npm test
npm run test:migrations
npm ci --prefix apps/web
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
```

Para generate e os testes unitários, fornecer DATABASE_URL fictícia ou configuração
local válida; a importação do Prisma exige essa variável mesmo quando não acessa o
banco. O script test:migrations sempre substitui DATABASE_URL pela conexão de seu
próprio container descartável. Nunca apontar os testes para produção.

Os workflows foram conferidos com actionlint. A reprodução local usa uma cópia
limpa em /tmp, sem .env, client Prisma gerado ou node_modules preexistentes. A
validação negativa insere um erro TypeScript apenas nessa cópia e verifica que o
comando de tipos falha; o arquivo temporário é removido depois.

## Pendências de entrega

Commit e push ficam com o usuário. Ainda é necessário abrir o PR, obter revisão,
registrar a CI remota bem-sucedida e executar o cenário manual de falha controlada.
Não houve publicação Docker durante a validação local.

Caso existam regras de proteção de branch com nomes de checks obrigatórios,
atualizar os nomes para os exibidos neste workflow, incluindo o job de frontend.
Alterações de proteção do repositório não fazem parte desta implementação local.

Referência: [workflows reutilizáveis do GitHub](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

## Evidências locais — 01/10/2026

- Instalações npm ci de backend e frontend aprovadas em cópia limpa.
- Geração do Prisma Client, typecheck e build do backend aprovados.
- 73 testes aprovados após a compilação, sem coletar testes de dist.
- Typecheck e build do frontend aprovados.
- Migrations e integração HTTP aprovadas nos cenários fresh e legacy.
- Testes reais de concorrência aprovados nos dois bancos descartáveis.
- actionlint 1.7.12: nenhum diagnóstico nos dois workflows.
- Erro TypeScript deliberado em um script temporário retornou TS2322 e código
  diferente de zero; após remoção, typecheck voltou a passar.
- Não houve commit, push, publicação de imagem ou alteração do banco atual.

A falha local comprova a detecção pelo comando. O bloqueio efetivo do job publish
pelo agendador do GitHub ainda precisa da execução remota controlada descrita acima.
