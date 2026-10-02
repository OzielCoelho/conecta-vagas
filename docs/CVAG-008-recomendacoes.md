# CVAG-008 — Recomendações de vagas por compatibilidade

## Recuperação histórica

O commit cb055fb da branch feat/backend-matching-recommendations foi comparado
com a main atual. Ele alterava JobController.getAll para filtrar vagas de
empresas e adicionava MatchService.buildJustification com um parâmetro de
disponibilidade escalar.

O filtro de getAll foi descartado: a arquitetura atual já possui GET /jobs/mine
para empresas, e misturar esse comportamento no endpoint geral poderia alterar o
contrato de coordenadores e estudantes. A justificativa foi adaptada para o modelo
atual, em que Student.availability é uma lista.

Nenhum arquivo histórico foi aplicado diretamente. A implementação atual usa
StudentRepository, JobRepository e a autenticação existente.

## Contrato atual

GET /jobs/recommended exige JWT com papel STUDENT e não aceita identificador de
aluno na URL ou na query. O usuário é obtido exclusivamente de request.user.id.

Cada item retorna apenas dados públicos da vaga e da empresa, além de:

- compatibilityScore: inteiro de 1 a 100;
- justifications: motivos determinísticos do score.

Vagas inativas e vagas com score zero não são retornadas. Perfil inexistente gera
404; perfil sem curso, habilidade ou disponibilidade preenchidos retorna [].

## Regra de compatibilidade

O score é a soma de:

- 60%: proporção de habilidades da vaga presentes no perfil;
- 25%: curso do perfil igual ao curso solicitado pela vaga;
- 15%: pelo menos uma disponibilidade do perfil igual à da vaga.

As comparações ignoram maiúsculas/minúsculas e espaços nas extremidades. Habilidades
repetidas não aumentam a pontuação. A faixa é limitada naturalmente a 0–100 e o
resultado é arredondado para inteiro.

A ordenação é previsível: score decrescente, data de criação mais recente primeiro
e, em último caso, ID em ordem crescente.

## Evidências locais

Os testes cobrem score, justificativas, perfil incompleto, perfil ausente, vagas
inativas, ausência de vagas compatíveis, ordenação, dados públicos e autorização
da rota. A validação completa de build, testes, migrations e CI deve ser registrada
após a execução nesta branch.
