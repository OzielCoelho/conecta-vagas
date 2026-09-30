# CVAG-003 — Autorização de perfis

## Matriz aplicada

| Papel | Consulta | Atualização |
| --- | --- | --- |
| STUDENT | `GET /students/me` consulta o próprio perfil; `GET /applications/me` consulta as próprias candidaturas | `PUT /students/:id` somente quando o perfil pertence ao usuário do JWT |
| COMPANY | `GET /companies/me` consulta o próprio perfil; `GET /students` lista perfis visíveis; `GET /applications/job/:jobId` consulta candidaturas de vaga da própria empresa | `PUT /companies/:id` somente quando o perfil pertence ao usuário do JWT |
| COORDINATOR | `GET /students` lista perfis visíveis; rotas de candidaturas seguem os guards existentes | `PUT /students/:id` e `PUT /companies/:id` podem atualizar qualquer perfil, conforme permissão já declarada nas rotas |

A identidade e o papel são obtidos de `request.user` somente após `jwtVerify`. Os
DTOs e schemas de atualização não aceitam `userId` ou `role`; campos extras são
descartados pelo validador e nunca participam da decisão de propriedade. Usuários
autenticados sem permissão recebem `403` com mensagem genérica; token ausente ou
inválido recebe `401`.

## Dados de candidatos

`GET /students` mantém o filtro `isVisible: true` e seleciona somente os campos
usados no diretório/feed: `id`, `name`, `course`, `skills`, `availability`,
`headline`, `summary`, `city`, `state`, `semester`, `university`, `portfolio` e
`photoUrl`. `userId`, `cr` e timestamps não são retornados. A consulta de
candidaturas por vaga aplica a mesma projeção ao estudante relacionado. A empresa
só consulta candidaturas quando a vaga pertence à empresa autenticada; o coordenador
mantém o acesso autorizado pela rota.

As respostas públicas de vagas selecionam da empresa apenas `id`, `name` e `about`,
que são os campos usados pelo frontend. O `userId` pode ser selecionado em uma
consulta interna para encaminhar notificações, mas não integra a resposta pública.
Consultas de candidaturas ranqueadas também usam a projeção pública do estudante.

## Evidências locais

Os testes de rota cobrem proprietário, tentativa entre contas com identidade/papel
forjados no corpo, coordenador, token ausente e token inválido. Nas tentativas
negadas, verificam que não há persistência nem notificação. Testes de repositório
verificam o filtro de visibilidade e a projeção tanto no diretório quanto nas
candidaturas e nas respostas de vagas. Validação local: `39` testes passaram em `5` arquivos; `tsc --noEmit`
terminou sem diagnósticos.

## Pendências de entrega

Takashi deve confirmar a abrangência da permissão de atualização do coordenador
antes do merge. A abertura do PR vinculado ao CVAG-003, execução da CI remota e
revisão de Emanuel ainda estão pendentes; os testes locais não substituem essas
aprovações.