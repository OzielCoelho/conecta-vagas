# CVAG-002 — Contrato de empresas

## Campos e validação

| Campo | Cadastro | Atualização | Persistência |
| --- | --- | --- | --- |
| legalName | Obrigatório | Opcional; preservado se omitido | Nullable para compatibilidade com registros antigos |
| tradeName | Obrigatório | Opcional; preservado se omitido | Nullable para compatibilidade com registros antigos |
| name | Opcional; derivado de tradeName | Derivado dos nomes disponíveis | Sempre obrigatório |
| about / cultureDescription | Opcionais | Preservados se ambos omitidos | Sincronizados quando um deles é enviado |
| logoUrl, commercialPhone, businessSector | Opcionais | Preservados se omitidos | Opcionais |
| userId | Obtido do JWT | Não pode ser alterado por este contrato | Obrigatório na criação |

Os nomes enviados são aparados e devem ter entre 2 e 160 caracteres após trim.
A ausência de legalName/tradeName no POST é rejeitada pelo schema existente da rota.
Nomes em branco são rejeitados pelo serviço com status 400 e mensagem do campo.
As demais restrições de tamanho já definidas nas rotas são preservadas.

Na criação, name recebe tradeName. Na atualização, quando algum nome é enviado,
a prioridade é: tradeName enviado ou existente, legalName enviado ou existente,
name enviado ou existente. Assim, alterar apenas a razão social não substitui um
nome fantasia já cadastrado. Registros legados sem razão social/nome fantasia ainda
podem atualizar name. Atualizações de outros campos não reescrevem os nomes.

cultureDescription tem precedência sobre about se ambos forem enviados. O texto
escolhido é salvo nos dois campos, inclusive se for vazio para apagar a descrição.
Não foram alterados schema ou migrations; o contrato do banco é o do CVAG-001.

## Implementação

DTOs de entrada mantêm o contrato utilizado pelo frontend. Os tipos de persistência
CreateCompanyRecord e UpdateCompanyRecord são derivados dos tipos gerados pelo Prisma,
com name obrigatório na criação e legalName/tradeName normalizados pelo serviço.
Isso elimina a incompatibilidade entre DTO de entrada e payload enviado ao Prisma.

## Validação

```bash
npm run build
npx vitest run --dir src/tests
npm run test:migrations
```

Os testes de empresas usam as rotas, autenticação JWT e serviço reais, isolando o
repositório e as notificações. Cobrem cadastro sem name, campos ausentes, inválidos e
em branco, atualização parcial, precedência dos nomes, registros legados, descrições,
perfil duplicado e perfil inexistente.

O teste com PostgreSQL descartável do CVAG-001 também verifica atualização e consulta
persistidas, preservação de campos omitidos e rejeição de nome fantasia em branco
sem alteração do nome salvo. Não usa o banco atual. Os fluxos foram validados por
HTTP; não houve verificação manual da interface no navegador.

A execução dos testes fonte usa o mesmo recorte da CI. O problema preexistente de
npm test incluir testes compilados em dist permanece no escopo do CVAG-007.
A autorização por propriedade do perfil continua sendo tratada no CVAG-003.

## Branch e revisão

Branch: fix/CVAG-002-corrige-modulo-empresas, criada a partir de
fix/CVAG-001-sincroniza-migrations, pois o CVAG-001 ainda não estava na main remota.
Integrar o CVAG-001 antes de revisar o diff final deste card contra main, ou usar a
branch do CVAG-001 temporariamente como base do PR.

As alterações foram deixadas sem commit conforme solicitado. Commit, push, abertura
do PR, CI remota e revisão são etapas posteriores.
