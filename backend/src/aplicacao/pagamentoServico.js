const sequelize = require('../dados/database');
const gateway = require('../dados/gatewayMock');
const { Pedido, Pagamento } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');
const auditoria = require('./auditoria');

const FORMAS = ['PIX', 'CARTAO', 'MOCK'];
const SIMULACOES = ['APROVADO', 'RECUSADO', 'FALHA'];

async function pagar(usuarioLogado, dados) {
  const { pedidoId, formaPagamento } = dados;
  const simular = dados.simular || 'APROVADO';
  const detalhes = [];

  if (!Number.isInteger(pedidoId)) {
    detalhes.push({ field: 'pedidoId', issue: 'Informe o id do pedido (número inteiro)' });
  }
  if (!FORMAS.includes(formaPagamento)) {
    detalhes.push({ field: 'formaPagamento', issue: 'Use um destes valores: ' + FORMAS.join(', ') });
  }
  if (!SIMULACOES.includes(simular)) {
    detalhes.push({ field: 'simular', issue: 'Use um destes valores: ' + SIMULACOES.join(', ') });
  }
  if (detalhes.length > 0) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', detalhes);
  }

  const pedido = await Pedido.findByPk(pedidoId);
  if (!pedido) {
    throw new ErroNegocio(404, 'PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.');
  }
  if (usuarioLogado.perfil === 'CLIENTE' && pedido.clienteId !== usuarioLogado.id) {
    throw new ErroNegocio(403, 'ACESSO_NEGADO', 'Este pedido pertence a outro cliente.');
  }

  // evita pagar duas vezes o mesmo pedido
  if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
    throw new ErroNegocio(409, 'PEDIDO_NAO_AGUARDA_PAGAMENTO',
      'O pedido está com status ' + pedido.status + ' e não aceita pagamento.');
  }

  // chamada ao gateway: se ele cair, o pedido continua aguardando pagamento
  let resposta;
  try {
    resposta = gateway.processarPagamento(Number(pedido.total), formaPagamento, simular);
  } catch (erro) {
    throw new ErroNegocio(503, 'GATEWAY_INDISPONIVEL',
      'O serviço de pagamento está indisponível. Tente novamente em instantes.');
  }

  return sequelize.transaction(async (t) => {
    const pagamento = await Pagamento.create({
      pedidoId: pedido.id,
      valor: pedido.total,
      forma: formaPagamento,
      status: resposta.aprovado ? 'APROVADO' : 'RECUSADO',
      idTransacaoMock: resposta.idTransacao
    }, { transaction: t });

    if (resposta.aprovado) {
      pedido.status = 'EM_PREPARO';
      await pedido.save({ transaction: t });
    }

    const acao = resposta.aprovado ? 'PAGAMENTO_APROVADO' : 'PAGAMENTO_RECUSADO';
    await auditoria.registrar(usuarioLogado.id, acao, 'Pagamento', pagamento.id, t);

    return {
      pagamentoId: pagamento.id,
      pedidoId: pedido.id,
      valor: Number(pedido.total),
      forma: formaPagamento,
      status: pagamento.status,
      idTransacao: resposta.idTransacao,
      mensagem: resposta.mensagem,
      statusPedido: pedido.status
    };
  });
}

module.exports = { pagar };
