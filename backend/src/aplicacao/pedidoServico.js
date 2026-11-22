const sequelize = require('../dados/database');
const { Usuario, Unidade, Produto, Estoque, Pedido, ItemPedido } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');
const lerPaginacao = require('./paginacao');
const auditoria = require('./auditoria');

const CANAIS = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'];
const STATUS = ['AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

function resumoDoPedido(pedido) {
  return {
    pedidoId: pedido.id,
    clienteId: pedido.clienteId,
    unidadeId: pedido.unidadeId,
    canalPedido: pedido.canalPedido,
    status: pedido.status,
    total: Number(pedido.total),
    criadoEm: pedido.criado_em
  };
}

async function criar(usuarioLogado, dados) {
  const { canalPedido, unidadeId, itens } = dados;
  const detalhes = [];

  if (!CANAIS.includes(canalPedido)) {
    detalhes.push({ field: 'canalPedido', issue: 'Use um destes valores: ' + CANAIS.join(', ') });
  }
  if (!Number.isInteger(unidadeId)) {
    detalhes.push({ field: 'unidadeId', issue: 'Informe o id da unidade (número inteiro)' });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    detalhes.push({ field: 'itens', issue: 'Envie ao menos um item' });
  } else {
    itens.forEach((item, i) => {
      if (!Number.isInteger(item.produtoId)) {
        detalhes.push({ field: 'itens[' + i + '].produtoId', issue: 'Informe o id do produto' });
      }
      if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
        detalhes.push({ field: 'itens[' + i + '].quantidade', issue: 'A quantidade deve ser um inteiro maior que zero' });
      }
    });
  }

  // cliente comum compra para si; atendente/gerente informam o cliente
  let clienteId = usuarioLogado.id;
  if (usuarioLogado.perfil !== 'CLIENTE') {
    if (Number.isInteger(dados.clienteId)) {
      clienteId = dados.clienteId;
    } else {
      detalhes.push({ field: 'clienteId', issue: 'Informe o cliente do pedido' });
    }
  }

  if (detalhes.length > 0) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', detalhes);
  }

  const unidade = await Unidade.findByPk(unidadeId);
  if (!unidade || !unidade.ativa) {
    throw new ErroNegocio(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.');
  }

  if (clienteId !== usuarioLogado.id) {
    const cliente = await Usuario.findByPk(clienteId);
    if (!cliente) {
      throw new ErroNegocio(404, 'CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado.');
    }
  }

  // tudo ou nada: se algum item falhar, nada é gravado nem baixado do estoque
  return sequelize.transaction(async (t) => {
    let total = 0;
    const linhas = [];

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];

      const produto = await Produto.findByPk(item.produtoId, { transaction: t });
      if (!produto || !produto.ativo) {
        throw new ErroNegocio(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.', [
          { field: 'itens[' + i + '].produtoId', issue: 'Produto ' + item.produtoId + ' não existe' }
        ]);
      }

      const estoque = await Estoque.findOne({
        where: { unidadeId, produtoId: produto.id },
        transaction: t
      });
      const saldo = estoque ? estoque.quantidade : 0;

      if (item.quantidade > saldo) {
        throw new ErroNegocio(409, 'ESTOQUE_INSUFICIENTE',
          'Não há quantidade suficiente para um ou mais itens.', [
            { field: 'itens[' + i + '].quantidade', issue: 'Disponível: ' + saldo }
          ]);
      }

      estoque.quantidade = saldo - item.quantidade;
      await estoque.save({ transaction: t });

      total += Number(produto.preco) * item.quantidade;
      linhas.push({
        produtoId: produto.id,
        quantidade: item.quantidade,
        precoUnitario: Number(produto.preco)
      });
    }

    total = Math.round(total * 100) / 100;

    const pedido = await Pedido.create({
      clienteId,
      unidadeId,
      canalPedido,
      status: 'AGUARDANDO_PAGAMENTO',
      total
    }, { transaction: t });

    for (const linha of linhas) {
      await ItemPedido.create({ pedidoId: pedido.id, ...linha }, { transaction: t });
    }

    await auditoria.registrar(usuarioLogado.id, 'CRIAR_PEDIDO', 'Pedido', pedido.id, t);

    return { ...resumoDoPedido(pedido), itens: linhas };
  });
}

async function listar(usuarioLogado, query) {
  const { page, limit, offset } = lerPaginacao(query);
  const where = {};

  if (query.canalPedido) {
    if (!CANAIS.includes(query.canalPedido)) {
      throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Filtro inválido.', [
        { field: 'canalPedido', issue: 'Use um destes valores: ' + CANAIS.join(', ') }
      ]);
    }
    where.canalPedido = query.canalPedido;
  }

  if (query.status) {
    if (!STATUS.includes(query.status)) {
      throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Filtro inválido.', [
        { field: 'status', issue: 'Use um destes valores: ' + STATUS.join(', ') }
      ]);
    }
    where.status = query.status;
  }

  // cliente só enxerga os próprios pedidos
  if (usuarioLogado.perfil === 'CLIENTE') {
    where.clienteId = usuarioLogado.id;
  }

  const { count, rows } = await Pedido.findAndCountAll({
    where,
    limit,
    offset,
    order: [['id', 'DESC']]
  });

  return { page, limit, total: count, itens: rows.map(resumoDoPedido) };
}

async function buscar(usuarioLogado, id) {
  const pedido = await Pedido.findByPk(id, {
    include: [{ model: ItemPedido, as: 'itens' }]
  });

  if (!pedido) {
    throw new ErroNegocio(404, 'PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.');
  }
  if (usuarioLogado.perfil === 'CLIENTE' && pedido.clienteId !== usuarioLogado.id) {
    throw new ErroNegocio(403, 'ACESSO_NEGADO', 'Este pedido pertence a outro cliente.');
  }

  return {
    ...resumoDoPedido(pedido),
    itens: pedido.itens.map((i) => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoUnitario: Number(i.precoUnitario)
    }))
  };
}

module.exports = { criar, listar, buscar };
