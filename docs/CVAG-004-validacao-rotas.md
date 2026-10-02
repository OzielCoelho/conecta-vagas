# CVAG-004 — Validação das rotas da API

Os schemas são aplicados no Fastify antes dos controllers. O servidor rejeita
propriedades desconhecidas e converte falhas de validação em `400` com a mensagem
genérica `Dados da requisição inválidos.`. Os guards de autenticação e autorização
permanecem nas mesmas rotas.

## Vagas

| Rota | Contrato |
| --- | --- |
| `POST /jobs` | Body estrito. Obrigatórios: `title` (3–160), `description` (1–5000), `skills` (1–30 strings, cada uma 1–80) e `model` (`REMOTE`, `IN_PERSON`, `HYBRID`). Opcionais: `location` e `course` (1–160), `availability` (`MANHA`, `TARDE`, `NOITE`). `companyId` não é aceito; a empresa é obtida do usuário autenticado. |
| `GET /jobs` | Sem query string. |
| `GET /jobs/mine` | Sem query string. |
| `GET /jobs/:id` | `id` UUID; sem query string. |
| `PUT /jobs/:id` | `id` UUID; body parcial não vazio com campos de criação e `isActive` booleano opcional. Campos extras são rejeitados. |

## Candidaturas

| Rota | Contrato |
| --- | --- |
| `POST /applications` | Body estrito com `jobId` UUID obrigatório. O aluno é identificado pelo JWT, não pelo body. |
| `GET /applications/me` | Sem query string. |
| `GET /applications/job/:jobId` | `jobId` UUID; sem query string. |
| `PATCH /applications/:id/status` | `id` UUID; body estrito com `status` obrigatório: `SENT`, `UNDER_REVIEW`, `INTERVIEW`, `APPROVED` ou `REJECTED`. |
| `GET /applications/export/csv` | Sem query string. |

## Notificações

| Rota | Contrato |
| --- | --- |
| `GET /notifications` | Query opcional `limit`, inteiro entre 1 e 50; sem outros filtros. O default do serviço permanece 20. |
| `PATCH /notifications/read-all` | Sem parâmetros ou query string; não consome body. |
| `PATCH /notifications/:id/read` | `id` UUID; sem query string; não consome body. |
| `POST /notifications/system` | Body estrito: `title` (1–160) e `message` (1–1200) obrigatórios; `linkUrl` até 500; `recipientUserId` UUID ou `recipientRole` (`STUDENT`, `COMPANY`, `COORDINATOR`). Os dois seletores não podem ser enviados juntos. |

## Validação local

Os testes verificam requisições válidas, campos ausentes, enum inválido, UUID
malformado, query fora dos limites, tamanhos máximos, propriedades extras e a
rejeição antes de chamar os serviços. A suíte completa passou com `61` testes em `6`
arquivos. `tsc --noEmit` terminou sem erros.

Os testes e a compilação foram executados localmente. A CI do GitHub, abertura do PR
vinculado ao CVAG-004 e revisão antes do merge continuam pendentes.