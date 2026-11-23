const sequelize = require('../dados/database');
const { Usuario, MovimentoFidelidade } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');
const auditoria = require('./auditoria');

// as regras de pontos e resgate ficam em dominio/fidelidade.js
const regras = require('../dominio/fidelidade');

async function calcularSaldo(clienteId, transacao) {
  const soma = await MovimentoFidelidade.sum('pontos', {
    where: { clienteId },
    transaction: transacao
  });
  return soma || 0;
}

// Chamada pelo statusServico quando o pedido vira ENTREGUE.
// Sem consentimento do cliente, nenhum ponto é registrado.
async function acumular(pedido, atorId, transacao) {
  const cliente = await Usuario.findByPk(pedido.clienteId, { transaction: transacao });
  if (!cliente || !cliente.aceitaFidelidade) {
    return null;
  }

  const pontos = regras.calcularPontos(Number(pedido.total), pedido.canalPedido);
  if (pontos <= 0) {
    return null;
  }

  await MovimentoFidelidade.create({
    clienteId: cliente.id,
    pedidoId: pedido.id,
    pontos,
    tipo: 'ACUMULO'
  }, { transaction: transacao });

  await auditoria.registrar(atorId, 'FIDELIDADE_ACUMULO', 'Pedido', pedido.id, transacao);
  return pontos;
}

async function definirConsentimento(usuarioLogado, dados) {
  if (typeof dados.aceito !== 'boolean') {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', [
      { field: 'aceito', issue: 'Envie true ou false' }
    ]);
  }

  const usuario = await Usuario.findByPk(usuarioLogado.id);
  usuario.aceitaFidelidade = dados.aceito;
  await usuario.save();

  await auditoria.registrar(usuario.id,
    dados.aceito ? 'FIDELIDADE_ADESAO' : 'FIDELIDADE_SAIDA', 'Usuario', usuario.id);

  return { aceitaFidelidade: usuario.aceitaFidelidade };
}

async function consultar(usuarioLogado) {
  const usuario = await Usuario.findByPk(usuarioLogado.id);
  const saldo = await calcularSaldo(usuario.id);

  const movimentos = await MovimentoFidelidade.findAll({
    where: { clienteId: usuario.id },
    order: [['id', 'DESC']],
    limit: 10
  });

  return {
    aceitaFidelidade: usuario.aceitaFidelidade,
    saldo,
    movimentos: movimentos.map((m) => ({
      id: m.id,
      pedidoId: m.pedidoId,
      tipo: m.tipo,
      pontos: m.pontos,
      criadoEm: m.criado_em
    }))
  };
}

async function resgatar(usuarioLogado, dados) {
  const { pontos } = dados;

  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', [
      { field: 'pontos', issue: 'Informe um número inteiro maior que zero' }
    ]);
  }

  const usuario = await Usuario.findByPk(usuarioLogado.id);
  if (!usuario.aceitaFidelidade) {
    throw new ErroNegocio(403, 'CONSENTIMENTO_FIDELIDADE_NECESSARIO',
      'Aceite o programa de fidelidade para resgatar pontos.');
  }

  return sequelize.transaction(async (t) => {
    const saldo = await calcularSaldo(usuario.id, t);

    if (pontos > saldo) {
      throw new ErroNegocio(409, 'SALDO_INSUFICIENTE', 'Você não tem pontos suficientes.', [
        { field: 'pontos', issue: 'Saldo atual: ' + saldo }
      ]);
    }

    await MovimentoFidelidade.create({
      clienteId: usuario.id,
      pontos: -pontos,
      tipo: 'RESGATE'
    }, { transaction: t });

    await auditoria.registrar(usuario.id, 'FIDELIDADE_RESGATE', 'Usuario', usuario.id, t);

    return {
      pontosResgatados: pontos,
      descontoReais: regras.calcularDescontoReais(pontos),
      saldo: saldo - pontos
    };
  });
}

module.exports = { acumular, definirConsentimento, consultar, resgatar };
