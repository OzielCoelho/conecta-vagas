# Alinhamento do MVP e Regras de Teste - Conecta Vagas

Como fiquei responsável pela parte de BA (Requisitos) e QA (Testes), montei este documento para fechar o escopo do que realmente precisamos entregar no MVP e já deixar as regras de negócio mastigadas para quem for programar o banco e as rotas.

---

## 1. Escopo Fechado do MVP
Para o projeto sair a tempo e sem correria, cortei os excessos das sugestões do enunciado. Vamos focar no problema central: triagem lenta e falta de histórico.

**O que vai ter no sistema (Obrigatório):**
* Cadastro e login para alunos e empresas.
* Perfil do aluno preenchido por formulário (curso, habilidades, horário disponível e link de portfólio).
* Cadastro de vagas pela empresa (com os requisitos básicos).
* Sistema de match por pontuação (ranking automático).
* Tela da empresa mostrando os candidatos ordenados por quem pontuou mais.
* Atualização e histórico de status da candidatura (para o aluno saber onde está).
* Botão para a coordenação exportar um relatório simples em CSV.

**O que está fora do MVP (Cortado):**
* Upload de arquivo PDF (currículo). O aluno preencherá os dados direto nos campos do perfil para facilitar o algoritmo de match.
* Aprovação prévia de vagas pela coordenação. A vaga publicada entra direto para não travar o fluxo agora.
* Envio real de e-mails ou notificações. Vamos apenas registrar as mudanças no banco e mostrar na tela.

---

## 2. Regra do Match (Lógica do Ranking)
Para os desenvolvedores do backend: quando a empresa abrir a lista de candidatos de uma vaga, o sistema deve calcular a pontuação de cada aluno e ordenar do maior para o menor. 

A conta (máximo 100 pontos) funciona assim:
* **Curso bate com o da vaga:** +50 pontos.
* **Disponibilidade de horário bate com o da vaga:** +30 pontos.
* **Cada skill/habilidade que bate com a vaga:** +10 pontos (máximo de 20 pontos aqui).

---

## 3. Fluxo de Status da Candidatura
Tabela de transição para guiar a lógica das rotas da API e o mapeamento do banco de dados. Apenas a empresa pode avançar esses status.

| Status Atual | Ação / Gatilho | Próximo Status Permitido |
| :--- | :--- | :--- |
| **Enviado** | Empresa visualiza o perfil do aluno | Em Análise |
| **Em Análise** | Empresa chama para entrevista | Entrevista |
| **Entrevista** | Empresa aprova o candidato | Aprovado |
| **Qualquer status** | Empresa recusa o candidato | Reprovado |

---

## 4. Cenários de Teste (Mapeamento de QA)
Esses são os cenários obrigatórios em formato Gherkin para validar as regras críticas do sistema antes da entrega.

### Cenário 1: Cálculo do Match
  Dado que o Aluno faz o curso "Técnico em Informática" e tem a skill "JavaScript"
  E a Vaga pede o curso "Técnico em Informática" e a skill "JavaScript"
  Quando o sistema processar os candidatos da vaga
  Então a nota desse aluno especificamente deve ser 60
  E ele deve aparecer ordenado corretamente no ranking da empresa.

### Cenário 2: Bloqueio de Candidatura Duplicada
  Dado que o Aluno já se inscreveu na vaga "Estágio de Suporte"
  Quando ele tentar clicar em se candidatar de novo na mesma vaga
  Então o sistema deve bloquear a ação
  E retornar um erro 409 (Conflict) avisando que a inscrição já foi feita.