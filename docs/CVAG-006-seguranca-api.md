# CVAG-006 — Autenticação e segurança da API

## JWT e ciclo da sessão

Tokens emitidos pelo login usam HS256 e expiram após JWT_TTL_SECONDS (3600 segundos
por padrão; limite de 1 dia). A API exige exp, id e role e rejeita tokens ausentes,
alterados, expirados ou sem expiração com 401. A verificação criptográfica é feita
no backend; o frontend apenas lê exp para controlar a interface.

Não há refresh token nem renovação automática. Ao expirar, a sessão é removida e as
rotas protegidas voltam a exigir login. Um timer e verificações ao retornar o foco
ou a visibilidade da aba cobrem abas suspensas. Respostas 401 autenticadas também
encerram a sessão correspondente. Um 401 por senha atual incorreta no formulário de
alteração de senha mantém a sessão; token expirado nessa mesma rota encerra a sessão.
Respostas antigas não devem restaurar uma sessão encerrada ou derrubar outra sessão.

Logout é local: não revoga imediatamente uma cópia de um JWT já emitido. Trocar a
senha também não revoga esses tokens antes da expiração. Revogação centralizada e
refresh tokens exigiriam um mecanismo adicional, fora desta alteração.

## Armazenamento no frontend

A sessão passa de localStorage para sessionStorage, que limita a persistência ao
contexto da aba e mantém a experiência de recarregar a página. Navegadores podem
restaurar sessões ao reabrir abas; a expiração continua obrigatória. Se o navegador
bloquear o armazenamento, usa memória, sem persistência ao recarregar.

A chave antiga do localStorage é removida, sem migrar tokens antigos. Após atualizar,
os usuários devem fazer login novamente. Cookies HttpOnly não foram introduzidos:
isso mudaria o transporte da autenticação e exigiria tratamento de CSRF e cookies
entre origens. sessionStorage continua acessível ao JavaScript e não elimina XSS.

## Configuração

| Variável | Padrão | Efeito |
| --- | --- | --- |
| JWT_SECRET | Obrigatória | Segredo de assinatura; manter fora do repositório |
| JWT_TTL_SECONDS | 3600 | Duração do token em segundos, de 1 até 86400 |
| CORS_ORIGINS | http://localhost:5173,http://127.0.0.1:5173 | Lista de origens exatas autorizadas |
| AUTH_RATE_LIMIT_MAX | 10 | Requisições por IP e rota sensível em cada janela |
| AUTH_RATE_LIMIT_WINDOW_MS | 60000 | Duração da janela em milissegundos |

Valores numéricos inválidos ou origens com curingas/caminhos impedem a inicialização,
sem imprimir os valores. Origem HTTP(S) inclui protocolo, host e porta, sem barra
final. Configurar explicitamente o domínio publicado antes de usar outro frontend.

Origens não autorizadas recebem 403 antes do controller. Requisições sem Origin
continuam permitidas para health checks, ferramentas e chamadas entre servidores.
CORS não substitui autenticação e autorização e não impede clientes fora do navegador
de omitir ou forjar Origin.

## Limitação de tentativas

@fastify/rate-limit protege POST /users/login, POST /users/register,
PATCH /users/password e PATCH /users/me. Todas as tentativas contam, inclusive
falhas de autenticação e payloads inválidos. Excesso retorna 429 com mensagem genérica
e Retry-After. Demais rotas não compartilham esses contadores.

O contador usa o IP da conexão, sem confiar em X-Forwarded-For enviado pelo cliente.
Atrás de proxy, usuários podem compartilhar o mesmo limite. A implantação deve definir
quais proxies são confiáveis antes de alterar trustProxy; não habilitar confiança
irrestrita. O armazenamento do limitador é em memória por processo: reinicia com a
API e não é compartilhado entre réplicas. Uma implantação distribuída exigiria store
compartilhado. Nenhum desses limites usa a identidade fornecida no corpo da requisição.

## Logs e erros

Logs de requisições não incluem corpo, cabeçalhos de autenticação ou query strings.
Há redação adicional de Authorization e cookies. Erros internos geram mensagem fixa
com o identificador da requisição, sem serializar exceções/stack que possam carregar
SQL, credenciais ou dados de entrada. Respostas internas também são genéricas.
JWT_SECRET e credenciais de teste não são impressos. O token é retornado somente na
resposta de login, como exige o contrato Bearer existente.

A fábrica buildApp em src/app.ts contém a configuração real usada por src/server.ts
e pelos testes de segurança, evitando testes de uma configuração paralela.

## Validação

```bash
npm run typecheck
npm test
npm run typecheck --prefix apps/web
npm run build
npm run build --prefix apps/web
npm run test:migrations
```

npm test executa a suíte do backend e os testes de sessão em apps/web/tests. Os
últimos usam eventos e armazenamento simulados, sem depender de um navegador real.
Os testes de API cobrem os três papéis, expiração, ausência/adulteração do token,
origens autorizadas e recusadas, preflight, 429 nas quatro rotas, IPs distintos,
X-Forwarded-For forjado e ausência de valores sensíveis em logs/respostas.

O teste de migrations valida os fluxos HTTP com a configuração real do servidor em
PostgreSQL descartável. Não utiliza o banco atual. Validação manual no navegador,
PR, revisão e execução remota da CI permanecem pendentes. Alterações sem commit.

Referências: [JWT](https://github.com/fastify/fastify-jwt) e
[rate limiting](https://github.com/fastify/fastify-rate-limit).

## Evidências locais

- 101 testes do backend e 17 testes de sessão do frontend aprovados (118 no total).
- Verificações de tipos de backend/frontend e builds aprovados.
- Integração HTTP aprovada nos bancos fresh e legacy, incluindo concorrência.
- Nenhuma alteração no banco atual ou no .env local; exemplos usam apenas valores fictícios.
- Não houve commit, push ou publicação durante esta implementação.

## Revisão antes do commit

O fallback em memória foi ajustado para não recuperar a sessão do usuário anterior
quando a gravação no sessionStorage falha (por exemplo, quota excedida). O teste
reproduziu a falha antes da correção e passou depois. Cadastro com resposta tardia
também verifica se a sessão mudou antes de iniciar o login automático.
