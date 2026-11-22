const sequelize = require('../dados/database');
const { Pedido, ItemPedido, Estoque } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');
const auditoria = require('./auditoria');

// de qual status para quais é permitido ir
// (EM_PREPARO só é alcançado pelo pagamento aprovado, nunca à mão)
const TRANSICOES = {
  AGUARDANDO_PAGAMENTO: ['CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: []
};

// quem pode mudar para cada status
const PERMISSOES = {
  PRONTO: ['COZINHA', 'GERENTE'],
  ENTREGUE: ['ATENDENTE', 'GERENTE'],
  CANCELADO: ['CLIENTE', 'ATENDENTE', 'GERENTE']
};

async function atualizar(usuarioLogado, id, dados) {
  const novoStatus = dados.status;

  if (!Object.keys(TRANSICOES).includes(novoStatus)) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Status inválido.', [
      { field: 'status', issue: 'Use um destes valores: ' + Object.keys(TRANSICOES).join(', ') }
    ]);
  }

  const pedido = await Pedido.findByPk(id);
  if (!pedido) {
    throw new ErroNegocio(404, 'PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.');
  }

  if (!TRANSICOES[pedido.status].includes(novoStatus)) {
    throw new ErroNegocio(409, 'TRANSICAO_INVALIDA',
      'Não é possível mudar de ' + pedido.status + ' para ' + novoStatus + '.');
  }

  const perfisPermitidos = PERMISSOES[novoStatus] || [];
  if (!perfisPermitidos.includes(usuarioLogado.perfil)) {
    throw new ErroNegocio(403, 'ACESSO_NEGADO', 'Seu perfil não pode colocar o pedido neste status.');
  }
  if (usuarioLogado.perfil === 'CLIENTE' && pedido.clienteId !== usuarioLogado.id) {
    throw new ErroNegocio(403, 'ACESSO_NEGADO', 'Este pedido pertence a outro cliente.');
  }

  return sequelize.transaction(async (t) => {
    // cancelamento devolve os itens ao estoque da unidade
    if (novoStatus === 'CANCELADO') {
      const itens = await ItemPedido.findAll({ where: { pedidoId: pedido.id }, transaction: t });

      for (const item of itens) {
        const linha = await Estoque.findOne({
          where: { unidadeId: pedido.unidadeId, produtoId: item.produtoId },
          transaction: t
        });
        if (linha) {
          linha.quantidade = linha.quantidade + item.quantidade;
          await linha.save({ transaction: t });
        } else {
          await Estoque.create({
            unidadeId: pedido.unidadeId,
            produtoId: item.produtoId,
            quantidade: item.quantidade
          }, { transaction: t });
        }
      }
    }

    const statusAnterior = pedido.status;
    pedido.status = novoStatus;
    await pedido.save({ transaction: t });

    await auditoria.registrar(usuarioLogado.id, 'STATUS_' + statusAnterior + '_PARA_' + novoStatus,
      'Pedido', pedido.id, t);

    return { pedidoId: pedido.id, statusAnterior, status: novoStatus };
  });
}

module.exports = { atualizar };
