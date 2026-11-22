const { Op } = require('sequelize');
const { Unidade, Produto, Estoque } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');
const lerPaginacao = require('./paginacao');

function dadosInvalidos(detalhes) {
  return new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', detalhes);
}

async function criarUnidade(dados) {
  const detalhes = [];
  ['nome', 'cidade', 'endereco'].forEach((campo) => {
    if (!dados[campo] || String(dados[campo]).trim() === '') {
      detalhes.push({ field: campo, issue: 'Campo obrigatório' });
    }
  });
  if (detalhes.length > 0) throw dadosInvalidos(detalhes);

  return Unidade.create({
    nome: dados.nome.trim(),
    cidade: dados.cidade.trim(),
    endereco: dados.endereco.trim()
  });
}

async function listarUnidades(query) {
  const { page, limit, offset } = lerPaginacao(query);
  const { count, rows } = await Unidade.findAndCountAll({
    where: { ativa: true },
    limit,
    offset,
    order: [['nome', 'ASC']]
  });
  return { page, limit, total: count, itens: rows };
}

function validarProduto(dados, parcial) {
  const detalhes = [];

  if (!parcial || dados.nome !== undefined) {
    if (!dados.nome || String(dados.nome).trim() === '') {
      detalhes.push({ field: 'nome', issue: 'Nome é obrigatório' });
    }
  }
  if (!parcial || dados.categoria !== undefined) {
    if (!dados.categoria || String(dados.categoria).trim() === '') {
      detalhes.push({ field: 'categoria', issue: 'Categoria é obrigatória' });
    }
  }
  if (!parcial || dados.preco !== undefined) {
    if (typeof dados.preco !== 'number' || dados.preco <= 0) {
      detalhes.push({ field: 'preco', issue: 'O preço deve ser um número maior que zero' });
    }
  }
  if (detalhes.length > 0) throw dadosInvalidos(detalhes);
}

async function criarProduto(dados) {
  validarProduto(dados, false);
  return Produto.create({
    nome: dados.nome.trim(),
    descricao: dados.descricao || null,
    preco: dados.preco,
    categoria: dados.categoria.trim()
  });
}

async function buscarProduto(id) {
  const produto = await Produto.findByPk(id);
  if (!produto) {
    throw new ErroNegocio(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.');
  }
  return produto;
}

async function atualizarProduto(id, dados) {
  const produto = await buscarProduto(id);
  validarProduto(dados, true);

  ['nome', 'descricao', 'preco', 'categoria'].forEach((campo) => {
    if (dados[campo] !== undefined) produto[campo] = dados[campo];
  });
  await produto.save();
  return produto;
}

async function desativarProduto(id) {
  const produto = await buscarProduto(id);
  produto.ativo = false;
  await produto.save();
}

async function listarProdutos(query) {
  const { page, limit, offset } = lerPaginacao(query);
  const { count, rows } = await Produto.findAndCountAll({
    where: { ativo: true },
    limit,
    offset,
    order: [['nome', 'ASC']]
  });
  return { page, limit, total: count, itens: rows };
}

async function cardapioDaUnidade(unidadeId, query) {
  const unidade = await Unidade.findByPk(unidadeId);
  if (!unidade || !unidade.ativa) {
    throw new ErroNegocio(404, 'UNIDADE_NAO_ENCONTRADA', 'Unidade não encontrada.');
  }

  const { page, limit, offset } = lerPaginacao(query);

  const { count, rows } = await Estoque.findAndCountAll({
    where: { unidadeId, quantidade: { [Op.gt]: 0 } },
    include: [{ model: Produto, where: { ativo: true } }],
    limit,
    offset,
    order: [[Produto, 'nome', 'ASC']]
  });

  const itens = rows.map((linha) => ({
    produtoId: linha.Produto.id,
    nome: linha.Produto.nome,
    descricao: linha.Produto.descricao,
    preco: linha.Produto.preco,
    categoria: linha.Produto.categoria,
    quantidadeDisponivel: linha.quantidade
  }));

  return { unidade: { id: unidade.id, nome: unidade.nome }, page, limit, total: count, itens };
}

module.exports = {
  criarUnidade,
  listarUnidades,
  criarProduto,
  atualizarProduto,
  desativarProduto,
  listarProdutos,
  cardapioDaUnidade
};
