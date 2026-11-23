// Documentação OpenAPI da API. A tela do Swagger fica em /docs
// e o JSON puro em /docs.json (veja server.js).

const respostaErro = (descricao) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
});

const corpoJson = (nomeSchema, exemplo) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/' + nomeSchema },
      example: exemplo
    }
  }
});

const ok = (descricao, schema) => ({
  description: descricao,
  content: { 'application/json': { schema } }
});

const protegido = [{ bearerAuth: [] }];

const parametroId = (nome, descricao) => ({
  name: nome, in: 'path', required: true, description: descricao,
  schema: { type: 'integer', example: 1 }
});

const paginacao = [
  { name: 'page', in: 'query', description: 'Página (começa em 1)', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', description: 'Itens por página (máximo 50)', schema: { type: 'integer', default: 10 } }
];

const respostasPadrao = {
  401: { $ref: '#/components/responses/NaoAutenticado' },
  403: { $ref: '#/components/responses/SemPermissao' }
};

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Restaurante Sul API',
    version: '1.0.0',
    description:
      'API de uma rede de restaurantes: cardápio por unidade, pedidos por canal ' +
      '(APP, TOTEM, BALCAO, PICKUP, WEB), pagamento simulado (mock), programa de fidelidade ' +
      'e auditoria. Autenticação com JWT e perfis CLIENTE, ATENDENTE, COZINHA e GERENTE.'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  tags: [
    { name: 'Saúde' },
    { name: 'Autenticação' },
    { name: 'Usuários' },
    { name: 'Unidades' },
    { name: 'Produtos' },
    { name: 'Estoque' },
    { name: 'Pedidos' },
    { name: 'Pagamentos' },
    { name: 'Fidelidade' },
    { name: 'Auditoria' }
  ],
  paths: {
    '/status': {
      get: {
        tags: ['Saúde'], summary: 'Verifica se a API está no ar',
        responses: { 200: ok('API funcionando', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) }
      }
    },

    '/auth/cadastro': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cadastra um cliente (exige consentimento LGPD)',
        description: 'Quem se cadastra pela API sempre entra com o perfil CLIENTE.',
        requestBody: corpoJson('Cadastro', {
          nome: 'Maria Silva', email: 'maria@email.com', senha: 'Senha@123', consentimentoLgpd: true
        }),
        responses: {
          201: ok('Cliente criado', { $ref: '#/components/schemas/UsuarioResumo' }),
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'], summary: 'Login (devolve o token JWT)',
        requestBody: corpoJson('Login', { email: 'gerente@restaurantesul.com', senha: 'Gerente@123' }),
        responses: {
          200: ok('Login realizado', { $ref: '#/components/schemas/TokenResposta' }),
          401: respostaErro('E-mail ou senha inválidos'),
          422: { $ref: '#/components/responses/DadosInvalidos' }
        }
      }
    },
    '/auth/eu': {
      get: {
        tags: ['Autenticação'], summary: 'Dados do usuário logado', security: protegido,
        responses: { 200: ok('Usuário', { $ref: '#/components/schemas/UsuarioResumo' }), 401: respostasPadrao[401] }
      }
    },

    '/usuarios': {
      get: {
        tags: ['Usuários'], summary: 'Lista usuários (só GERENTE)', security: protegido,
        parameters: paginacao,
        responses: { 200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }), ...respostasPadrao }
      }
    },

    '/unidades': {
      get: {
        tags: ['Unidades'], summary: 'Lista as unidades (público)', parameters: paginacao,
        responses: { 200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }) }
      },
      post: {
        tags: ['Unidades'], summary: 'Cria uma unidade (só GERENTE)', security: protegido,
        requestBody: corpoJson('UnidadeEntrada', { nome: 'Restaurante Sul Recife', cidade: 'Recife', endereco: 'Rua da Aurora, 100' }),
        responses: {
          201: ok('Unidade criada', { $ref: '#/components/schemas/Unidade' }),
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      }
    },
    '/unidades/{id}/cardapio': {
      get: {
        tags: ['Unidades'], summary: 'Cardápio da unidade com a quantidade disponível (público)',
        parameters: [parametroId('id', 'Id da unidade'), ...paginacao],
        responses: {
          200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }),
          404: { $ref: '#/components/responses/NaoEncontrado' }
        }
      }
    },

    '/produtos': {
      get: {
        tags: ['Produtos'], summary: 'Lista os produtos ativos (público)', parameters: paginacao,
        responses: { 200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }) }
      },
      post: {
        tags: ['Produtos'], summary: 'Cria um produto (só GERENTE)', security: protegido,
        requestBody: corpoJson('ProdutoEntrada', { nome: 'Baião de dois', descricao: 'Com queijo coalho', preco: 24.9, categoria: 'Pratos' }),
        responses: {
          201: ok('Produto criado', { $ref: '#/components/schemas/Produto' }),
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      }
    },
    '/produtos/{id}': {
      put: {
        tags: ['Produtos'], summary: 'Atualiza um produto (só GERENTE)', security: protegido,
        parameters: [parametroId('id', 'Id do produto')],
        requestBody: corpoJson('ProdutoEntrada', { nome: 'Baião de dois especial', preco: 27.5, categoria: 'Pratos' }),
        responses: {
          200: ok('Produto atualizado', { $ref: '#/components/schemas/Produto' }),
          404: { $ref: '#/components/responses/NaoEncontrado' },
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      },
      delete: {
        tags: ['Produtos'], summary: 'Desativa um produto (exclusão lógica, só GERENTE)', security: protegido,
        parameters: [parametroId('id', 'Id do produto')],
        responses: {
          204: { description: 'Produto desativado' },
          404: { $ref: '#/components/responses/NaoEncontrado' }, ...respostasPadrao
        }
      }
    },

    '/estoque/movimentos': {
      post: {
        tags: ['Estoque'], summary: 'Registra entrada ou saída de estoque (GERENTE e ATENDENTE)', security: protegido,
        requestBody: corpoJson('MovimentoEstoque', { unidadeId: 1, produtoId: 1, tipo: 'ENTRADA', quantidade: 10 }),
        responses: {
          201: ok('Movimento registrado', { type: 'object' }),
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      }
    },
    '/estoque/unidade/{unidadeId}': {
      get: {
        tags: ['Estoque'], summary: 'Saldo de estoque da unidade (GERENTE e ATENDENTE)', security: protegido,
        parameters: [parametroId('unidadeId', 'Id da unidade'), ...paginacao],
        responses: {
          200: ok('Saldo por produto', { $ref: '#/components/schemas/ListaPaginada' }),
          404: { $ref: '#/components/responses/NaoEncontrado' }, ...respostasPadrao
        }
      }
    },

    '/pedidos': {
      post: {
        tags: ['Pedidos'],
        summary: 'Cria um pedido (baixa o estoque da unidade)',
        description:
          'O preço de cada item vem do banco. A criação é tudo ou nada: se algum item não tiver ' +
          'estoque, nada é gravado. O pedido nasce como AGUARDANDO_PAGAMENTO.',
        security: protegido,
        requestBody: corpoJson('PedidoEntrada', {
          canalPedido: 'APP', unidadeId: 1, itens: [{ produtoId: 1, quantidade: 2 }]
        }),
        responses: {
          201: ok('Pedido criado', { $ref: '#/components/schemas/Pedido' }),
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      },
      get: {
        tags: ['Pedidos'],
        summary: 'Lista pedidos (cliente vê só os próprios), com filtros',
        security: protegido,
        parameters: [
          { name: 'canalPedido', in: 'query', description: 'Filtra pelo canal do pedido', schema: { $ref: '#/components/schemas/CanalPedido' } },
          { name: 'status', in: 'query', description: 'Filtra pelo status', schema: { $ref: '#/components/schemas/StatusPedido' } },
          ...paginacao
        ],
        responses: {
          200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }),
          422: { $ref: '#/components/responses/DadosInvalidos' }, 401: respostasPadrao[401]
        }
      }
    },
    '/pedidos/{id}': {
      get: {
        tags: ['Pedidos'], summary: 'Detalhe do pedido com os itens', security: protegido,
        parameters: [parametroId('id', 'Id do pedido')],
        responses: {
          200: ok('Pedido', { $ref: '#/components/schemas/Pedido' }),
          404: { $ref: '#/components/responses/NaoEncontrado' }, ...respostasPadrao
        }
      }
    },
    '/pedidos/{id}/status': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Muda o status do pedido',
        description:
          'Transições permitidas: AGUARDANDO_PAGAMENTO para CANCELADO; EM_PREPARO para PRONTO ou CANCELADO; ' +
          'PRONTO para ENTREGUE. PRONTO: COZINHA ou GERENTE. ENTREGUE: ATENDENTE ou GERENTE. ' +
          'CANCELADO: o próprio CLIENTE, ATENDENTE ou GERENTE (devolve os itens ao estoque). ' +
          'Ao entregar, o cliente que aceitou a fidelidade ganha pontos.',
        security: protegido,
        parameters: [parametroId('id', 'Id do pedido')],
        requestBody: corpoJson('StatusEntrada', { status: 'PRONTO' }),
        responses: {
          200: ok('Status alterado', {
            type: 'object',
            properties: {
              pedidoId: { type: 'integer' },
              statusAnterior: { type: 'string' },
              status: { type: 'string' }
            }
          }),
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      }
    },

    '/pagamentos': {
      post: {
        tags: ['Pagamentos'],
        summary: 'Paga um pedido no gateway simulado (mock)',
        description:
          'O campo simular controla o resultado do mock: APROVADO (padrão), RECUSADO ou FALHA. ' +
          'Aprovado: pedido vai para EM_PREPARO. Recusado: responde 402 e o pedido continua aguardando. ' +
          'Falha do gateway: 503.',
        security: protegido,
        requestBody: corpoJson('PagamentoEntrada', { pedidoId: 1, formaPagamento: 'PIX', simular: 'APROVADO' }),
        responses: {
          201: ok('Pagamento aprovado', { $ref: '#/components/schemas/PagamentoResposta' }),
          402: respostaErro('Pagamento recusado pelo gateway'),
          404: { $ref: '#/components/responses/NaoEncontrado' },
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' },
          503: respostaErro('Gateway de pagamento indisponível'), ...respostasPadrao
        }
      }
    },

    '/fidelidade/saldo': {
      get: {
        tags: ['Fidelidade'], summary: 'Saldo de pontos e últimos movimentos (só CLIENTE)', security: protegido,
        responses: { 200: ok('Saldo', { $ref: '#/components/schemas/Fidelidade' }), ...respostasPadrao }
      }
    },
    '/fidelidade/consentimento': {
      post: {
        tags: ['Fidelidade'], summary: 'Aceita ou sai do programa de fidelidade (só CLIENTE)',
        description: 'Sem aceitar o programa, o cliente não acumula nem resgata pontos.',
        security: protegido,
        requestBody: corpoJson('ConsentimentoFidelidade', { aceito: true }),
        responses: {
          200: ok('Consentimento atualizado', { type: 'object', properties: { aceitaFidelidade: { type: 'boolean' } } }),
          422: { $ref: '#/components/responses/DadosInvalidos' }, ...respostasPadrao
        }
      }
    },
    '/fidelidade/resgatar': {
      post: {
        tags: ['Fidelidade'], summary: 'Resgata pontos (cada ponto vale R$ 0,10) (só CLIENTE)', security: protegido,
        requestBody: corpoJson('ResgateFidelidade', { pontos: 5 }),
        responses: {
          201: ok('Resgate realizado', {
            type: 'object',
            properties: {
              pontosResgatados: { type: 'integer' },
              descontoReais: { type: 'number' },
              saldo: { type: 'integer' }
            }
          }),
          403: respostaErro('Sem consentimento no programa, ou perfil sem permissão'),
          409: { $ref: '#/components/responses/Conflito' },
          422: { $ref: '#/components/responses/DadosInvalidos' }, 401: respostasPadrao[401]
        }
      }
    },

    '/auditoria': {
      get: {
        tags: ['Auditoria'], summary: 'Lista os logs de auditoria (só GERENTE)', security: protegido,
        parameters: paginacao,
        responses: { 200: ok('Lista paginada', { $ref: '#/components/schemas/ListaPaginada' }), ...respostasPadrao }
      }
    }
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    responses: {
      NaoAutenticado: respostaErro('Token ausente, inválido ou expirado (401)'),
      SemPermissao: respostaErro('O perfil do usuário não tem permissão (403)'),
      NaoEncontrado: respostaErro('Recurso não encontrado (404)'),
      Conflito: respostaErro('Conflito com o estado atual: estoque, status, duplicidade (409)'),
      DadosInvalidos: respostaErro('Campos inválidos, com a lista em details (422)')
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'DADOS_INVALIDOS' },
          message: { type: 'string', example: 'Há campos inválidos na requisição.' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, issue: { type: 'string' } }
            }
          },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string', example: '/pedidos' }
        }
      },
      CanalPedido: { type: 'string', enum: ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'] },
      StatusPedido: {
        type: 'string',
        enum: ['AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO']
      },
      ListaPaginada: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          itens: { type: 'array', items: { type: 'object' } }
        }
      },
      Cadastro: {
        type: 'object', required: ['nome', 'email', 'senha', 'consentimentoLgpd'],
        properties: {
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 },
          consentimentoLgpd: { type: 'boolean', description: 'Precisa ser true' }
        }
      },
      Login: {
        type: 'object', required: ['email', 'senha'],
        properties: { email: { type: 'string' }, senha: { type: 'string' } }
      },
      UsuarioResumo: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, nome: { type: 'string' },
          email: { type: 'string' },
          perfil: { type: 'string', enum: ['CLIENTE', 'ATENDENTE', 'COZINHA', 'GERENTE'] }
        }
      },
      TokenResposta: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'integer', example: 3600 },
          user: { $ref: '#/components/schemas/UsuarioResumo' }
        }
      },
      UnidadeEntrada: {
        type: 'object', required: ['nome', 'cidade', 'endereco'],
        properties: { nome: { type: 'string' }, cidade: { type: 'string' }, endereco: { type: 'string' } }
      },
      Unidade: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, nome: { type: 'string' },
          cidade: { type: 'string' }, endereco: { type: 'string' }
        }
      },
      ProdutoEntrada: {
        type: 'object', required: ['nome', 'preco', 'categoria'],
        properties: {
          nome: { type: 'string' }, descricao: { type: 'string' },
          preco: { type: 'number', minimum: 0.01 }, categoria: { type: 'string' }
        }
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'integer' }, nome: { type: 'string' }, descricao: { type: 'string' },
          preco: { type: 'number' }, categoria: { type: 'string' }, ativo: { type: 'boolean' }
        }
      },
      MovimentoEstoque: {
        type: 'object', required: ['unidadeId', 'produtoId', 'tipo', 'quantidade'],
        properties: {
          unidadeId: { type: 'integer' }, produtoId: { type: 'integer' },
          tipo: { type: 'string', enum: ['ENTRADA', 'SAIDA'] },
          quantidade: { type: 'integer', minimum: 1 }
        }
      },
      PedidoEntrada: {
        type: 'object', required: ['canalPedido', 'unidadeId', 'itens'],
        properties: {
          canalPedido: { $ref: '#/components/schemas/CanalPedido' },
          unidadeId: { type: 'integer' },
          itens: {
            type: 'array', minItems: 1,
            items: {
              type: 'object', required: ['produtoId', 'quantidade'],
              properties: { produtoId: { type: 'integer' }, quantidade: { type: 'integer', minimum: 1 } }
            }
          }
        }
      },
      Pedido: {
        type: 'object',
        properties: {
          pedidoId: { type: 'integer' }, clienteId: { type: 'integer' }, unidadeId: { type: 'integer' },
          canalPedido: { $ref: '#/components/schemas/CanalPedido' },
          status: { $ref: '#/components/schemas/StatusPedido' },
          total: { type: 'number' }, criadoEm: { type: 'string', format: 'date-time' },
          itens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                produtoId: { type: 'integer' }, quantidade: { type: 'integer' },
                precoUnitario: { type: 'number' }
              }
            }
          }
        }
      },
      StatusEntrada: {
        type: 'object', required: ['status'],
        properties: { status: { $ref: '#/components/schemas/StatusPedido' } }
      },
      PagamentoEntrada: {
        type: 'object', required: ['pedidoId', 'formaPagamento'],
        properties: {
          pedidoId: { type: 'integer' },
          formaPagamento: { type: 'string', enum: ['PIX', 'CARTAO', 'MOCK'] },
          simular: { type: 'string', enum: ['APROVADO', 'RECUSADO', 'FALHA'], default: 'APROVADO' }
        }
      },
      PagamentoResposta: {
        type: 'object',
        properties: {
          pagamentoId: { type: 'integer' }, pedidoId: { type: 'integer' },
          valor: { type: 'number' }, forma: { type: 'string' },
          status: { type: 'string', example: 'APROVADO' },
          idTransacao: { type: 'string' }, mensagem: { type: 'string' },
          statusPedido: { $ref: '#/components/schemas/StatusPedido' }
        }
      },
      ConsentimentoFidelidade: {
        type: 'object', required: ['aceito'],
        properties: { aceito: { type: 'boolean' } }
      },
      ResgateFidelidade: {
        type: 'object', required: ['pontos'],
        properties: { pontos: { type: 'integer', minimum: 1 } }
      },
      Fidelidade: {
        type: 'object',
        properties: {
          aceitaFidelidade: { type: 'boolean' },
          saldo: { type: 'integer' },
          movimentos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' }, pedidoId: { type: 'integer', nullable: true },
                tipo: { type: 'string', enum: ['ACUMULO', 'RESGATE'] },
                pontos: { type: 'integer' }, criadoEm: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }
};
