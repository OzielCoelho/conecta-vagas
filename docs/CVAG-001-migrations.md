# CVAG-001 — Sincronização do banco

A migration `20260928150000_sync_profiles_notifications` complementa a migration
inicial, que permanece inalterada. O schema Prisma continua sendo o contrato atual.

## Alterações

- Student: headline, summary, city, state, semester, university, cr e photoUrl.
- Company: logoUrl, commercialPhone, legalName, tradeName, cultureDescription e businessSector.
- Notification: tabela, enums NotificationType e NotificationCategory, chaves
  estrangeiras para destinatário e autor, e os dois índices de consulta por usuário.
- Student.availability: conversão de TEXT para TEXT[].

Todos os campos adicionados aos perfis são opcionais no banco, preservando registros
antigos. A obrigatoriedade na entrada da API de empresas será alinhada no CVAG-002.

## Conversão de availability

`USING ARRAY["availability"]::TEXT[]` preserva exatamente o texto antigo como um
único elemento. `MANHA` vira `['MANHA']`; texto vazio vira `['']`; `MANHA,TARDE`,
`{MANHA,NOITE}` e textos livres continuam sendo um único elemento, sem interpretação,
normalização ou perda de informação. Não se presume um formato para dados antigos.
Valores fora de MANHA/TARDE/NOITE precisam de revisão funcional posterior; a migration
preserva esses valores, mas não os torna automaticamente válidos para edição na API.
A restrição NOT NULL é removida para corresponder ao SQL de listas gerado pelo Prisma.
Os registros existentes não recebem NULL nessa conversão.

A migration usa BEGIN/COMMIT: conversão e criação das estruturas são atômicas.
ALTER TYPE pode reescrever a tabela e manter um bloqueio; dimensionar a janela de
manutenção com uma cópia representativa antes de aplicar em banco compartilhado.

## Validação reproduzível

Requisitos: dependências instaladas (`npm ci`), Node compatível com o projeto,
Docker ativo e acesso à imagem postgres:17-alpine (local ou pelo registry).

```bash
npm run test:migrations
```

O script ignora a DATABASE_URL recebida e cria seu próprio PostgreSQL, com porta
aleatória vinculada a 127.0.0.1, credenciais fictícias e nome exclusivo. Não monta
volumes existentes. Remove o container e seus volumes ao terminar.

São testados dois bancos:

1. Vazio: aplicação de todas as migrations versionadas.
2. Legado sintético: SQL inicial, cinco estudantes com diferentes textos de
   disponibilidade e registro da migration inicial com migrate resolve. Isso simula
   o ponto de partida antigo sem depender de dados privados.

Em ambos: migrate deploy duas vezes, ausência de diferenças entre banco e schema
(migrate diff --exit-code), prisma generate, inicialização da API, cadastro/login,
criação e consulta de perfis com os novos campos, vaga, candidatura, consulta de
candidaturas e notificações persistidas. No legado, também verifica a preservação
das disponibilidades e dos dados originais dos estudantes.

O job migrations em .github/workflows/ci.yml executa esse mesmo teste. A ampliação
completa da CI e o bloqueio da publicação Docker continuam no CVAG-007.

## Aplicação em outro ambiente

Banco novo, com DATABASE_URL explicitamente apontando para o destino correto:

```bash
npx prisma migrate deploy
npx prisma generate
```

Banco com dados: obter backup e verificar sua restauração, conferir o histórico de
migrations e testar primeiro em uma cópia segura. A cópia sintética automatizada não
substitui a validação de uma cópia do banco atual. Não executar reset ou db push como
atalho. Somente aplicar no banco compartilhado após autorização e planejamento da
janela de manutenção.

Se o banco recebeu alterações manuais ou db push, ele pode já conter colunas ou
notificações. Esta migration pressupõe o estado da migration inicial e falhará em
caso de estruturas duplicadas. Comparar o schema e o histórico antes de prosseguir;
não usar IF NOT EXISTS ou migrate resolve para ocultar divergências. O uso de resolve
no teste é restrito ao banco descartável cujo SQL inicial acabou de ser aplicado.

## Falha e rollback

Se o SQL falhar antes do COMMIT, a transação desfaz suas alterações. O Prisma pode
registrar a tentativa como falha: investigar e corrigir a causa na cópia segura antes
de marcar a tentativa como rolled-back com migrate resolve e tentar novamente.

Após sucesso não existe rollback automático sem risco: listas novas podem conter
vários valores e notificações podem ter sido criadas. Não converter de volta nem
remover tabelas/colunas automaticamente. Preferir uma migration corretiva; se uma
restauração for indispensável, interromper escritas, preservar um backup adicional
e restaurar o backup validado mediante autorização explícita, considerando os dados
produzidos depois dele.

## Limites das evidências

O teste não lê nem modifica o banco atual. Validação de uma cópia real, execução
remota da CI e revisão do PR devem ser registradas separadamente. Os erros de tipos
já existentes do módulo de empresas pertencem ao CVAG-002; os testes HTTP usam a
execução TypeScript da API e não substituem uma compilação bem-sucedida.

## Evidências locais — 28/09/2026

Branch: `fix/CVAG-001-sincroniza-migrations`.

- `npm run test:migrations`: aprovado nos cenários fresh e legacy, usando PostgreSQL 17.
- `migrate deploy`: aprovado e reaplicação sem novas alterações em ambos os cenários.
- `migrate diff --exit-code`: código 0 em ambos; banco corresponde ao schema.
- `prisma generate`: aprovado após migrations em ambos.
- Cinco valores legados preservados exatamente como arrays de um elemento.
- Fluxos HTTP de perfis, candidaturas e notificações aprovados nos dois bancos.
- `npx vitest run --dir src/tests`: 12 testes aprovados.
- Banco atual: não acessado nem alterado.
- Cópia real do banco atual: pendente.
- Pull Request, revisão e resultado remoto da CI: pendentes.

A execução padrão de `npm test` ainda pode encontrar testes compilados em `dist`,
problema anterior a este card. A regressão acima usa o mesmo recorte de testes do
workflow existente; a padronização desse comando permanece no CVAG-007.
