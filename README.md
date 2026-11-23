# Restaurante Sul - API

Projeto da disciplina de Back-End. É uma API para uma rede de restaurantes, feita com Node.js,
Express, Sequelize e SQLite. Ela cuida de cardápio por unidade, estoque, pedidos, pagamento
simulado, programa de fidelidade e logs de auditoria.

## Como rodar

Precisa ter o Node.js (versão 18 ou mais) e o Git instalados.

1. Clonar o projeto e instalar as dependências:

```
git clone https://github.com/Oblizion/restaurante-sul.git
cd restaurante-sul/backend
npm install
```

2. Criar o arquivo `.env` na pasta `backend`, copiando o `.env.example`:

```
copy .env.example .env
```

Dentro do `.env` ficam três variáveis:

- `PORTA`: porta da API (3000)
- `JWT_SEGREDO`: texto usado para assinar o token. Troque por um texto grande qualquer
- `BANCO_ARQUIVO`: onde fica o banco SQLite (`./banco.sqlite`)

3. Criar os usuários de teste:

```
npm run semente
```

4. Ligar a API:

```
npm run dev
```

A API abre em `http://localhost:3000`. Para ver se está funcionando, abra
`http://localhost:3000/status`.

As tabelas do banco são criadas sozinhas quando a API liga. Se eu mudar alguma tabela, é só
apagar o arquivo `banco.sqlite` e rodar a semente de novo.

## Usuários de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Gerente | gerente@restaurantesul.com | Gerente@123 |
| Atendente | atendente@restaurantesul.com | Atendente@123 |
| Cozinha | cozinha@restaurantesul.com | Cozinha@123 |

O cliente se cadastra pela própria API, em `POST /auth/cadastro`.

## Swagger

Com a API ligada, a documentação fica em `http://localhost:3000/docs`.

Para testar uma rota protegida: faça o login em `/auth/login`, copie o `accessToken`, clique no
botão **Authorize** e cole só o token.

## Testes

As regras do domínio (status do pedido, permissões, pontos da fidelidade) têm testes
automáticos que não precisam do banco nem da API ligada. Na pasta `backend`:

```
npm test
```

### Testes com o Postman

Na pasta `postman` tem dois arquivos:

- `Restaurante Sul API.postman_collection.json`: a coleção, com 41 requisições e 69 validações automáticas
- `Local.postman_environment.json`: o ambiente, que já traz o `base_url`

Para rodar:

1. No Postman, clicar em **Import** e escolher os dois arquivos.
2. Selecionar o ambiente **Local** no canto de cima, à direita.
3. Ligar a API com o banco novo (`npm run semente` e `npm run dev`).
4. Clicar com o botão direito na coleção, **Run collection** e depois **Run**.

As pastas precisam rodar na ordem. A primeira faz os logins e guarda os tokens no ambiente, e as
outras usam esses tokens. Se der tudo certo, aparece 0 falhas.

Os testes cobrem os códigos 200, 201, 401, 402, 403, 404, 409, 422 e 503. O 402 é o
pagamento recusado e o 503 é a falha do gateway.

## Rotas

| Método | Rota | Quem acessa |
|---|---|---|
| GET | /status | todos |
| POST | /auth/cadastro | todos |
| POST | /auth/login | todos |
| GET | /auth/eu | usuário logado |
| GET | /usuarios | gerente |
| GET | /unidades | todos |
| POST | /unidades | gerente |
| GET | /unidades/:id/cardapio | todos |
| GET | /produtos | todos |
| POST | /produtos | gerente |
| PUT | /produtos/:id | gerente |
| DELETE | /produtos/:id | gerente |
| POST | /estoque/movimentos | gerente e atendente |
| GET | /estoque/unidade/:unidadeId | gerente e atendente |
| POST | /pedidos | cliente, atendente e gerente |
| GET | /pedidos | usuário logado |
| GET | /pedidos/:id | usuário logado |
| PATCH | /pedidos/:id/status | depende do status |
| POST | /pagamentos | cliente, atendente e gerente |
| GET | /fidelidade/saldo | cliente |
| POST | /fidelidade/consentimento | cliente |
| POST | /fidelidade/resgatar | cliente |
| GET | /auditoria | gerente |

O cliente só enxerga os próprios pedidos. A lista de pedidos aceita os filtros `canalPedido`,
`status`, `page` e `limit`. Exemplo: `GET /pedidos?canalPedido=APP`.

Os canais de pedido são APP, TOTEM, BALCAO, PICKUP e WEB.

## Regras do sistema

**Pedido**
- O preço dos itens vem do banco, e o cliente não consegue mandar o preço.
- O estoque da unidade é baixado quando o pedido é criado. Se faltar estoque em algum item,
  nada é salvo e a API responde 409.
- Quando o pedido é cancelado, os itens voltam para o estoque.

**Status do pedido**
- Todo pedido começa em AGUARDANDO_PAGAMENTO.
- Quando o pagamento é aprovado, vai para EM_PREPARO (automático).
- A cozinha ou o gerente muda de EM_PREPARO para PRONTO.
- O atendente ou o gerente muda de PRONTO para ENTREGUE.
- Pode cancelar (CANCELADO) enquanto está aguardando pagamento ou em preparo. Quem pode: o
  próprio cliente, o atendente ou o gerente.
- Qualquer outra mudança responde 409.

**Pagamento**
Não existe cobrança de verdade, é um gateway simulado. O campo `simular` escolhe o resultado:
`APROVADO` (padrão), `RECUSADO` (responde 402 e o pedido continua aguardando pagamento) ou
`FALHA` (responde 503). As formas aceitas são PIX, CARTAO e MOCK.

**Fidelidade**
- O cliente precisa aceitar o programa (`POST /fidelidade/consentimento` com `aceito: true`) e
  pode sair quando quiser.
- Quando o pedido é entregue, ganha 1 ponto a cada R$ 10,00 do total.
- Promoção: pedidos feitos pelo canal APP valem pontos em dobro.
- Cada ponto resgatado vale R$ 0,10.
- Quem não aceitou o programa não ganha nem resgata pontos.
- Mais detalhes em `docs/regras-de-negocio.md`.

## Erros

Todos os erros da API voltam no mesmo formato:

```json
{
  "error": "DADOS_INVALIDOS",
  "message": "Há campos inválidos na requisição.",
  "details": [{ "field": "email", "issue": "E-mail inválido" }],
  "timestamp": "2026-11-23T12:00:00.000Z",
  "path": "/auth/cadastro"
}
```

## Segurança e LGPD

- As senhas são guardadas com hash (bcryptjs), e o hash nunca aparece nas respostas.
- O login devolve um token JWT que vale 1 hora. Cada rota confere o perfil do usuário.
- Se o e-mail ou a senha estiverem errados, a mensagem é a mesma nos dois casos.
- O cadastro só funciona com `consentimentoLgpd: true`, e a data do consentimento é salva.
- Quem se cadastra pela API sempre vira cliente.
- Pedido, pagamento, mudança de status e fidelidade ficam registrados na tabela `logs_auditoria`.

## Pastas

```
restaurante-sul
├── backend
│   └── src
│       ├── api         rotas, middlewares, erro padrão, swagger e server.js
│       ├── aplicacao   serviços com as regras do sistema
│       ├── dados       banco, models, gateway mock e semente
│       └── dominio     regras de pedido, pagamento e fidelidade (sem banco)
├── docs                DER e regras de negócio
└── postman             coleção e ambiente
```

As rotas (`api`) chamam os serviços (`aplicacao`). Os serviços usam as regras do `dominio` e os
models (`dados`). O `dominio` não depende de nenhuma outra camada.

O diagrama do banco (DER) está em `docs/der.png`.

## Uso de IA

Durante o desenvolvimento deste projeto, utilizei ferramentas de inteligência artificial (Gemini e ChatGPT) apenas como apoio de estudo, organização de documentação e revisão técnica, seguindo as diretrizes da disciplina. Todo o código-fonte, modelagem e testes foram validados e executados localmente por mim.

- **Ferramentas utilizadas:** Gemini e ChatGPT.
- **Onde houve auxílio:**
  - Esclarecimento de conceitos sobre estruturação de APIs REST em camadas com Express, validação de dados e configuração do Swagger/OpenAPI.
  - Revisão ortográfica e organização da estrutura deste `README.md` e do documento técnico final.
  - Apoio para entender boas práticas de tratamento padronizado de erros HTTP (401, 403, 409, 422) e registro de consentimento conforme a LGPD.
- **Exemplos de consultas realizadas:**
  - *"Como estruturar um retorno de erro padronizado em JSON no Express"*
  - *"Quais são os requisitos obrigatórios de entrega e testes no roteiro da trilha Back-End"*
  - *"Revisão de clareza e ortografia para documentação técnica de projeto"*
