# CVAG-005 — Candidaturas somente em vagas ativas

## Regra aplicada

O estado disponível no modelo atual é `Job.isActive`. Não existem enums separados
para vagas encerradas ou indisponíveis: esses estados são representados por false.

O serviço de candidaturas consulta a vaga e verifica isActive antes de criar a
candidatura, calcular a compatibilidade ou emitir notificações. O estado é obtido
do banco; a requisição aceita somente jobId e o aluno é obtido da identidade do JWT.

| Situação | Resposta |
| --- | --- |
| Aluno com perfil, vaga ativa e sem candidatura anterior | 201 |
| Vaga inativa | 409 — Esta vaga não está mais disponível para candidaturas. |
| Vaga inexistente | 404 — Vaga não encontrada. |
| Candidatura já existente | 409 — Você já se candidatou a esta vaga. |
| Aluno sem perfil | 404 |
| Empresa ou coordenador tentando se candidatar | 403 |
| Token ausente ou inválido | 401 |
| Identificador inválido ou campos extras no corpo | 400 |

A verificação de duplicidade preexistente permanece prioritária. Portanto, uma
candidatura repetida a uma vaga posteriormente encerrada continua retornando o
conflito de duplicidade. A restrição única studentId/jobId no banco é preservada.

O frontend já lista apenas vagas ativas e mostra a mensagem retornada pela API caso
uma vaga seja encerrada após o carregamento. Os botões da lista e dos detalhes também
ficam desabilitados quando o objeto da vaga informa isActive false.

## Testes

```bash
npm run build
npx vitest run --dir src/tests
npm run test:migrations
npm --prefix apps/web run build
```

`application-create.test.ts` executa rota, autenticação, controller e serviço reais,
isolando repositórios, cálculo de score e notificações. Cobre vaga ativa, inativa,
inexistente, duplicidade, ausência de perfil, papéis não autorizados, tokens inválidos
e tentativa de fornecer estado/identidade pelo corpo. Recusas verificam ausência de
persistência, cálculo e envio de notificações.

O teste de integração usa apenas PostgreSQL descartável. Cria uma vaga, encerra-a e
tenta a candidatura pela API. Também testa vaga inexistente, duplicidade e tentativa
por empresa; compara as contagens de candidaturas e notificações antes/depois das
recusas. Executa os cenários em banco novo e em banco com dados legados sintéticos.

## Evidências e pendências

- 73 testes aprovados em 7 arquivos.
- Integração aprovada em banco vazio e legado sintético.
- Builds de backend e frontend aprovados.
- Banco atual não acessado nem alterado.
- Validação da interface no navegador, PR, CI remota e revisão: pendentes.
- Branch: fix/CVAG-005-bloqueia-vagas-inativas, baseada em upstream/main após CVAG-004.
- Alterações deixadas sem commit para revisão do usuário.

## Concorrência

Além da verificação antecipada no serviço, o repositório consulta a vaga com
SELECT FOR UPDATE dentro da mesma transação da criação. O bloqueio é mantido até
a gravação, serializando a candidatura com alterações do estado da vaga. Se o
encerramento adquirir o bloqueio primeiro, a candidatura espera e recebe 409 após
o encerramento ser confirmado. Se a candidatura adquirir o bloqueio primeiro,
ela é registrada enquanto a vaga está ativa e o encerramento espera sua conclusão.

Duas candidaturas simultâneas do mesmo aluno continuam protegidas pela restrição
única; o erro P2002 é traduzido em 409, sem expor detalhes internos.

O teste scripts/test-application-concurrency.ts, chamado pelo teste de migrations,
mantém uma transação de encerramento aberta, confirma pelo pg_stat_activity que a
candidatura aguarda o bloqueio, e só então libera o commit. Verifica zero candidaturas
para a vaga encerrada. Também dispara duas criações simultâneas e verifica uma única
candidatura persistida, com conflito para a segunda.
