const sequelize = require('../dados/database');
const { Unidade, Produto, Estoque } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');

async function movimentar(dados) {
  const { unidadeId, produtoId, tipo, quantidade } = dados;
  const detalhes = [];

  if (!Number.isInteger(unidadeId)) {
    detalhes.push({ field: 'unidadeId', issue: 'Informe o id da unidade (número inteiro)' });
  }
  if (!Number.isInteger(produtoId)) {
    detalhes.push({ field: 'produtoId', issue: 'Informe o id do produto (número inteiro)' });
  }
  if (tipo !== 'ENTRADA' && tipo !== 'SAIDA') {
    detalhes.push({ field: 'tipo', issue: 'Use ENTRADA ou SAIDA' });
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    detalhes.push({ field: 'quantidade', issue: 'A quantidade deve ser um inteiro maior que zero' });
  }
  if (detalhes.length > 0) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', detalhes);
  }

  const unidade = await Unidade.findByPk(unidadeId);
  if (!unidade) {
    throw new ErroNegocio(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.');
  }
  const produto = await Produto.findByPk(produtoId);
  if (!produto) {
    throw new ErroNegocio(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.');
  }

  return sequelize.transaction(async (t) => {
    let linha = await Estoque.findOne({ where: { unidadeId, produtoId }, transaction: t });
    const saldoAtual = linha ? linha.quantidade : 0;

    if (tipo === 'SAIDA' && quantidade > saldoAtual) {
      throw new ErroNegocio(409, 'ESTOQUE_INSUFICIENTE', 'Não há quantidade suficiente em estoque.', [
        { field: 'quantidade', issue: 'Disponível: ' + saldoAtual }
      ]);
    }

    const novoSaldo = tipo === 'ENTRADA' ? saldoAtual + quantidade : saldoAtual - quantidade;

    if (linha) {
      linha.quantidade = novoSaldo;
      await linha.save({ transaction: t });
    } else {
      linha = await Estoque.create({ unidadeId, produtoId, quantidade: novoSaldo }, { transaction: t });
    }

    return { unidadeId, produtoId, tipo, quantidade, saldoAtual: novoSaldo };
  });
}

async function saldoDaUnidade(unidadeId) {
  const unidade = await Unidade.findByPk(unidadeId);
  if (!unidade) {
    throw new ErroNegocio(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.');
  }

  const linhas = await Estoque.findAll({
    where: { unidadeId },
    include: [{ model: Produto, attributes: ['id', 'nome'] }]
  });

  return {
    unidadeId: unidade.id,
    itens: linhas.map((l) => ({
      produtoId: l.Produto.id,
      nome: l.Produto.nome,
      quantidade: l.quantidade
    }))
  };
}

module.exports = { movimentar, saldoDaUnidade };
