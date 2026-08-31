# Manual de Contribuição — Conecta Vagas

Este documento define o fluxo padrão para desenvolvedores que irão contribuir com o projeto **Conecta Vagas**.

Repositório oficial:

```text
https://github.com/Uninorte-Extensao/conecta-vagas
```

O objetivo deste manual é garantir que todos trabalhem de forma organizada, preservem o histórico do projeto e evitem alterações diretas ou acidentais na branch `main`.

---

## 1. Como o projeto está organizado no GitHub

O repositório oficial pertence à organização:

```text
Uninorte-Extensao/conecta-vagas
```

Cada desenvolvedor deverá criar um **fork** do repositório oficial para sua própria conta do GitHub.

O fluxo esperado será:

```text
Uninorte-Extensao/conecta-vagas
        ↑
        │ Pull Request
        │
usuario/conecta-vagas
        ↑
        │ git push
        │
computador do desenvolvedor
```

### Termos utilizados neste manual

- **Repositório oficial / upstream**: `Uninorte-Extensao/conecta-vagas`
- **Fork / origin**: cópia do repositório criada na conta pessoal do desenvolvedor
- **main**: branch principal e estável do projeto
- **branch de trabalho**: branch criada para implementar uma tarefa específica
- **Pull Request (PR)**: solicitação para integrar uma branch do fork ao repositório oficial

---

## 2. Regras principais

1. **Não desenvolver diretamente na `main`.**
2. Toda tarefa deve ser feita em uma branch própria.
3. Todo código deve entrar no repositório oficial por **Pull Request**.
4. Antes de iniciar uma tarefa, atualizar a `main` local com a `main` oficial.
5. Não fazer `push --force` na `main`.
6. Não enviar senhas, tokens, chaves, arquivos `.env` ou outros segredos ao GitHub.
7. Conferir os arquivos antes de executar `git add` e `git commit`.
8. Não fazer merge de branches históricas apenas porque o GitHub mostra o botão **Compare & pull request**.
9. Não apagar branches antigas do repositório oficial sem autorização.
10. Em caso de dúvida envolvendo histórico, conflitos ou `reset`, pedir ajuda antes de executar comandos destrutivos.

---

# 3. Configuração inicial do desenvolvedor

Esta parte é feita apenas uma vez em cada computador.

## 3.1. Ter uma conta no GitHub

O desenvolvedor precisa possuir uma conta em:

```text
https://github.com
```

O repositório oficial atualmente é público, portanto é possível visualizá-lo e criar um fork. Permissões adicionais na organização poderão ser concedidas quando necessário.

---

## 3.2. Instalar o Git

Verifique se o Git está instalado:

```bash
git --version
```

Se retornar uma versão, por exemplo:

```text
git version 2.x.x
```

está funcionando.

---

## 3.3. Configurar nome e e-mail do Git

O nome e o e-mail são registrados nos commits.

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Confira:

```bash
git config --global user.name
git config --global user.email
```

Preferencialmente utilize um e-mail associado à sua conta do GitHub para que os commits sejam corretamente atribuídos ao seu perfil.

---

# 4. Configuração de acesso ao GitHub

## Opção recomendada: SSH

Teste se o computador já está autenticado:

```bash
ssh -T git@github.com
```

Quando configurado corretamente, o GitHub exibirá uma mensagem informando que a autenticação foi realizada.

### Caso ainda não possua uma chave SSH

Crie uma chave:

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```

Depois, adicione a chave pública à sua conta do GitHub em:

```text
GitHub → Settings → SSH and GPG keys → New SSH key
```

A chave pública normalmente está em:

```text
~/.ssh/id_ed25519.pub
```

Para visualizar:

```bash
cat ~/.ssh/id_ed25519.pub
```

Nunca compartilhe o arquivo privado:

```text
~/.ssh/id_ed25519
```

---

# 5. Criando o fork

Acesse:

```text
https://github.com/Uninorte-Extensao/conecta-vagas
```

Clique em:

```text
Fork
```

Escolha sua conta pessoal como **Owner**.

O nome pode permanecer:

```text
conecta-vagas
```

Para novos desenvolvedores, copiar somente a `main` é suficiente para iniciar novos trabalhos. Caso seja necessário consultar branches históricas no próprio fork, a opção de copiar apenas a `main` pode ser desmarcada.

Depois clique em:

```text
Create fork
```

O resultado será algo semelhante a:

```text
seu-usuario/conecta-vagas
```

---

# 6. Clonando o fork

O desenvolvedor deve clonar **o próprio fork**, e não o repositório oficial.

Usando SSH:

```bash
git clone git@github.com:SEU-USUARIO/conecta-vagas.git
```

Exemplo:

```bash
git clone git@github.com:joaosilva/conecta-vagas.git
```

Entre na pasta:

```bash
cd conecta-vagas
```

---

# 7. Configurando os remotes

Após o clone, normalmente existirá apenas:

```text
origin → seu fork
```

Confira:

```bash
git remote -v
```

Deverá aparecer algo semelhante a:

```text
origin  git@github.com:SEU-USUARIO/conecta-vagas.git (fetch)
origin  git@github.com:SEU-USUARIO/conecta-vagas.git (push)
```

Agora adicione o repositório oficial como `upstream`:

```bash
git remote add upstream git@github.com:Uninorte-Extensao/conecta-vagas.git
```

Confira novamente:

```bash
git remote -v
```

O resultado esperado é:

```text
origin    git@github.com:SEU-USUARIO/conecta-vagas.git (fetch)
origin    git@github.com:SEU-USUARIO/conecta-vagas.git (push)
upstream  git@github.com:Uninorte-Extensao/conecta-vagas.git (fetch)
upstream  git@github.com:Uninorte-Extensao/conecta-vagas.git (push)
```

### Significado

```text
origin   = seu fork
upstream = repositório oficial da instituição
```

---

# 8. Conferindo a configuração

Execute:

```bash
git branch -vv
git remote -v
git status
```

Na `main`, o ideal é que apareça algo semelhante a:

```text
* main abc1234 [origin/main] ...
```

Isso indica que sua `main` local acompanha a `main` do seu fork.

---

# 9. Fluxo padrão antes de começar qualquer tarefa

Sempre comece atualizando sua `main`.

## 9.1. Voltar para a main

```bash
git switch main
```

## 9.2. Buscar alterações do repositório oficial

```bash
git fetch upstream
```

Esse comando apenas baixa as referências; ele não altera seus arquivos automaticamente.

## 9.3. Atualizar a main local

```bash
git merge --ff-only upstream/main
```

## 9.4. Atualizar também a main do seu fork

```bash
git push origin main
```

Agora:

```text
upstream/main
      ↓
main local
      ↓
origin/main
```

estão sincronizadas.

---

# 10. Criando uma branch para trabalhar

Nunca faça a implementação diretamente na `main`.

Depois de atualizar a `main`, crie uma nova branch:

```bash
git switch -c TIPO/nome-da-tarefa
```

Exemplos:

```bash
git switch -c feat/cadastro-empresa
git switch -c fix/corrige-login
git switch -c docs/atualiza-readme
git switch -c test/adiciona-testes-vagas
git switch -c refactor/organiza-services
git switch -c infra/configura-docker
git switch -c ci/configura-github-actions
```

---

# 11. Padrão recomendado para nomes de branches

| Prefixo | Utilização |
|---|---|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de erro |
| `docs/` | Documentação |
| `test/` | Testes |
| `refactor/` | Refatoração sem mudança de regra de negócio |
| `infra/` | Infraestrutura, Docker, ambientes, deploy |
| `ci/` | CI/CD e GitHub Actions |
| `chore/` | Manutenção geral |

Utilize nomes curtos, claros e em letras minúsculas.

Exemplo recomendado:

```text
feat/filtro-de-vagas
```

Evite:

```text
novaBranch
branch-do-joao
alteracao
coisa-nova
```

---

# 12. Durante o desenvolvimento

A qualquer momento, confira o estado do repositório:

```bash
git status
```

Veja as diferenças ainda não adicionadas ao commit:

```bash
git diff
```

Veja um resumo:

```bash
git diff --stat
```

---

# 13. Adicionando arquivos ao commit

É recomendável adicionar apenas os arquivos relacionados à tarefa.

Exemplo:

```bash
git add src/modules/companies/company.service.ts
```

Para adicionar vários arquivos específicos:

```bash
git add arquivo1 arquivo2 arquivo3
```

`git add .` pode ser utilizado quando o desenvolvedor já conferiu todas as alterações e tem certeza de que todos os arquivos devem fazer parte do commit.

Depois confira:

```bash
git status
```

E veja exatamente o que será commitado:

```bash
git diff --staged
```

---

# 14. Fazendo commits

O commit deve representar uma alteração lógica e compreensível.

Formato recomendado:

```text
tipo: descrição curta
```

Exemplos:

```bash
git commit -m "feat: adiciona filtro de vagas"
git commit -m "fix: corrige validação do cadastro"
git commit -m "docs: atualiza instruções de execução"
git commit -m "test: adiciona testes do serviço de empresas"
git commit -m "infra: configura ambiente Docker"
git commit -m "ci: adiciona workflow de testes"
```

### Evite mensagens como

```text
alteração
mudanças
ajustes
commit
final
agora vai
corrigindo
```

A mensagem deve permitir entender o objetivo do commit sem abrir o código.

---

# 15. Enviando a branch para o fork

Na primeira vez que enviar a nova branch:

```bash
git push -u origin nome-da-branch
```

Exemplo:

```bash
git push -u origin feat/filtro-de-vagas
```

Depois disso, enquanto permanecer na mesma branch, normalmente basta:

```bash
git push
```

---

# 16. Criando o Pull Request

Após o push, o GitHub normalmente mostra:

```text
Compare & pull request
```

Clique nesse botão.

Antes de criar o PR, confira os campos.

## Destino

```text
base repository: Uninorte-Extensao/conecta-vagas
base: main
```

## Origem

```text
head repository: SEU-USUARIO/conecta-vagas
compare: sua-branch
```

Fluxo correto:

```text
SEU-USUARIO/conecta-vagas:sua-branch
                ↓
Uninorte-Extensao/conecta-vagas:main
```

---

# 17. Título e descrição do Pull Request

O título deve explicar claramente o que foi alterado.

Exemplo:

```text
Adiciona filtro de vagas por área
```

Descrição recomendada:

```markdown
## O que foi feito
- Adicionado filtro de vagas por área.
- Ajustada consulta de vagas.
- Atualizados testes relacionados.

## Como testar
1. Iniciar a aplicação.
2. Acessar a listagem de vagas.
3. Selecionar uma área no filtro.
4. Confirmar que apenas as vagas correspondentes são exibidas.

## Observações
- Não houve alteração no banco de dados.
```

Quando aplicável, inclua screenshots, passos de teste e informações sobre migrations ou mudanças de configuração.

---

# 18. Antes de solicitar o merge

O desenvolvedor deve verificar:

- [ ] A aplicação inicia sem erros.
- [ ] A funcionalidade foi testada.
- [ ] Não foram enviados arquivos desnecessários.
- [ ] Não existem segredos ou credenciais no commit.
- [ ] Os commits possuem mensagens claras.
- [ ] O PR possui título e descrição compreensíveis.
- [ ] A branch está atualizada com a `main`, quando necessário.
- [ ] Testes automatizados passam, quando existentes.

---

# 19. Atualizando uma branch enquanto o PR está aberto

Se outro desenvolvedor alterar a `main` antes do seu PR ser integrado:

```bash
git fetch upstream
```

Entre na sua branch:

```bash
git switch feat/minha-tarefa
```

Integre a `main` oficial:

```bash
git merge upstream/main
```

Se não houver conflitos:

```bash
git push
```

O Pull Request será atualizado automaticamente.

---

# 20. Resolvendo conflitos

Ao executar:

```bash
git merge upstream/main
```

pode aparecer um conflito.

Confira:

```bash
git status
```

O Git indicará os arquivos conflitantes.

Dentro do arquivo, podem aparecer marcações como:

```text
<<<<<<< HEAD
seu código
=======
código vindo da main
>>>>>>> upstream/main
```

O desenvolvedor deve editar o arquivo e manter a versão correta, removendo essas marcações.

Depois:

```bash
git add arquivo-resolvido
```

Quando todos os conflitos forem resolvidos:

```bash
git commit
```

E então:

```bash
git push
```

Se não tiver certeza de qual código deve permanecer, não escolha arbitrariamente. Converse com o responsável pela outra alteração ou com a equipe.

---

# 21. Depois que o Pull Request for aprovado e mergeado

Volte para a `main`:

```bash
git switch main
```

Atualize as referências do repositório oficial:

```bash
git fetch upstream
```

Atualize sua `main` local:

```bash
git merge --ff-only upstream/main
```

Atualize a `main` do seu fork:

```bash
git push origin main
```

---

# 22. Apagando a branch concluída

Depois que o PR foi mergeado, a branch de trabalho normalmente pode ser removida.

Apagar localmente:

```bash
git branch -d nome-da-branch
```

Exemplo:

```bash
git branch -d feat/filtro-de-vagas
```

Apagar no fork:

```bash
git push origin --delete nome-da-branch
```

Exemplo:

```bash
git push origin --delete feat/filtro-de-vagas
```

Isso não apaga o código que já foi incorporado à `main`.

---

# 23. Fluxo completo resumido

## Antes de começar

```bash
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
```

## Criar a branch

```bash
git switch -c feat/minha-tarefa
```

## Desenvolver e conferir

```bash
git status
git diff
```

## Preparar o commit

```bash
git add arquivo1 arquivo2
git diff --staged
git status
```

## Commitar

```bash
git commit -m "feat: descrição da alteração"
```

## Enviar para o fork

```bash
git push -u origin feat/minha-tarefa
```

## Abrir Pull Request

```text
SEU-USUARIO:feat/minha-tarefa
          ↓
Uninorte-Extensao:main
```

## Depois do merge

```bash
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
git branch -d feat/minha-tarefa
git push origin --delete feat/minha-tarefa
```

---

# 24. Arquivos que não devem ser enviados

Nunca envie ao GitHub:

```text
.env
.env.local
.env.production
chaves privadas
senhas
tokens
credenciais de banco
credenciais de serviços cloud
arquivos de certificado privados
```

Antes de commitar, execute:

```bash
git status
```

Se um arquivo sensível aparecer, não faça `git add` nele.

Arquivos sensíveis e gerados automaticamente devem estar devidamente configurados no `.gitignore`.

---

# 25. Cuidados com arquivos gerados automaticamente

Arquivos criados por builds, compiladores, IDEs ou gerenciadores de dependência nem sempre devem ser versionados.

Exemplos que merecem atenção:

```text
node_modules/
dist/
build/
*.tsbuildinfo
arquivos temporários de IDE
logs
```

Antes de adicionar um arquivo gerado automaticamente, verifique se ele realmente pertence ao repositório.

> Observação: arquivos de lock, como `package-lock.json`, normalmente são versionados quando a alteração de dependências é intencional.

---

# 26. O que não fazer

## Não desenvolver diretamente na main

Evite:

```bash
git switch main
# editar arquivos
git add .
git commit -m "alterações"
git push
```

Crie uma branch antes.

---

## Não usar force push na main

Evite:

```bash
git push --force origin main
```

ou:

```bash
git push -f upstream main
```

---

## Não fazer push diretamente para o upstream

O fluxo normal é:

```text
branch local
   ↓
origin (fork)
   ↓
Pull Request
   ↓
upstream (oficial)
```

Mesmo que algum membro tenha permissão de escrita no repositório da organização, o fluxo por Pull Request deve ser mantido.

---

## Não usar comandos destrutivos sem entender o efeito

Tenha cuidado com:

```bash
git reset --hard
git clean -fd
git push --force
git checkout -- arquivo
git restore arquivo
```

Esses comandos podem apagar trabalho local.

Antes de utilizá-los, confirme que não há alterações importantes.

---

# 27. Branches históricas existentes no repositório oficial

O projeto foi migrado de um repositório anterior e algumas branches antigas foram preservadas para manter o histórico do trabalho.

Entre elas podem aparecer branches como:

```text
ajuste-visual
frontend1
feat/backend-matching-recommendations
feat/documentacao-ba-qa
feat/home-vagas-redesign
feat/home-vagas-tafaltando
feat/testes-qa-ajustados
```

O GitHub pode exibir avisos do tipo:

```text
had recent pushes
Compare & pull request
```

Isso não significa que essas branches precisam ser mergeadas.

Para tarefas novas, a regra é:

```text
criar a nova branch a partir da main atualizada
```

Só utilize uma branch histórica como base se houver uma orientação explícita da equipe.

---

# 28. Comandos úteis

## Ver a branch atual

```bash
git branch --show-current
```

## Listar branches locais

```bash
git branch
```

## Listar branches locais e remotas

```bash
git branch -a
```

## Ver remotes

```bash
git remote -v
```

## Ver estado atual

```bash
git status
```

## Ver histórico resumido

```bash
git log --oneline --graph --decorate --all
```

## Buscar atualizações do fork

```bash
git fetch origin
```

## Buscar atualizações do oficial

```bash
git fetch upstream
```

## Ver commits que estão no upstream e não estão na main local

```bash
git log main..upstream/main --oneline
```

## Ver commits da sua branch que ainda não estão na main

```bash
git log main..HEAD --oneline
```

---

# 29. Problemas comuns

## `Your branch is behind...`

A branch está desatualizada em relação ao remoto.

Se estiver na `main`, prefira sincronizar com o repositório oficial:

```bash
git fetch upstream
git merge --ff-only upstream/main
git push origin main
```

---

## `nothing to commit, working tree clean`

Significa que não existem alterações locais pendentes.

---

## `Your branch is up to date with 'origin/main'`

Significa que sua branch local está sincronizada com a `main` do seu fork.

Isso não garante, sozinho, que o fork está sincronizado com o repositório oficial. Para isso, faça:

```bash
git fetch upstream
git merge --ff-only upstream/main
```

---

## `fatal: remote upstream already exists`

O remote já foi configurado.

Confira:

```bash
git remote -v
```

---

## `Permission denied (publickey)`

Existe um problema na autenticação SSH.

Teste:

```bash
ssh -T git@github.com
```

Verifique se sua chave SSH foi adicionada à conta correta do GitHub.

---

## `rejected - non-fast-forward`

Não utilize `--force` automaticamente.

Primeiro descubra por que o remoto está à frente e sincronize sua branch corretamente.

---

# 30. Checklist de entrada de um novo desenvolvedor

Antes de começar a primeira tarefa, confirme:

- [ ] Possui conta no GitHub.
- [ ] Git instalado.
- [ ] `user.name` configurado.
- [ ] `user.email` configurado.
- [ ] SSH funcionando ou outro método de autenticação configurado.
- [ ] Fork de `Uninorte-Extensao/conecta-vagas` criado.
- [ ] Fork clonado localmente.
- [ ] `origin` aponta para o fork pessoal.
- [ ] `upstream` aponta para `Uninorte-Extensao/conecta-vagas`.
- [ ] `git fetch upstream` funciona.
- [ ] `main` está atualizada.
- [ ] Entendeu que toda tarefa deve ocorrer em uma branch própria.
- [ ] Entendeu que as alterações entram no oficial por Pull Request.

---

# 31. Checklist rápido antes de cada Pull Request

```text
[ ] Estou em uma branch de trabalho, não na main.
[ ] Minha alteração tem apenas os arquivos necessários.
[ ] Rodei git status.
[ ] Conferi git diff e/ou git diff --staged.
[ ] Não existe .env, token, senha ou segredo no commit.
[ ] A aplicação/testes funcionam.
[ ] Os commits possuem mensagens claras.
[ ] O PR aponta para Uninorte-Extensao/conecta-vagas:main.
[ ] Expliquei no PR o que foi alterado e como testar.
```

---

# 32. Fluxo visual final

```text
                 REPOSITÓRIO OFICIAL
          Uninorte-Extensao/conecta-vagas
                       main
                        ↑
                        │ Pull Request
                        │
                FORK DO DESENVOLVEDOR
              usuario/conecta-vagas
                        ↑
                        │ git push
                        │
              BRANCH DE DESENVOLVIMENTO
                  feat/minha-tarefa
                        ↑
                        │
                 COMPUTADOR LOCAL
```

Para receber alterações da equipe:

```text
upstream/main
     ↓
main local
     ↓
origin/main
```

Para enviar uma alteração:

```text
branch local
     ↓ git push
branch no fork
     ↓ Pull Request
upstream/main
```

---

# 33. Regra de ouro

Antes de executar qualquer comando Git que possa apagar, sobrescrever ou reescrever histórico, pare e verifique:

```bash
git status
git branch --show-current
git remote -v
```

Se ainda houver dúvida, não execute o comando destrutivo até entender exatamente o que ele fará.

---

## Repositório oficial

```text
Uninorte-Extensao/conecta-vagas
```

## Fluxo padrão

```text
Atualizar main → criar branch → desenvolver → commit → push para fork → PR → merge → sincronizar main → apagar branch concluída
```
