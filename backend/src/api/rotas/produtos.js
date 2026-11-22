const express = require('express');
const catalogoServico = require('../../aplicacao/catalogoServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await catalogoServico.listarProdutos(req.query));
  } catch (erro) {
    next(erro);
  }
});

router.post('/', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    const produto = await catalogoServico.criarProduto(req.body);
    res.status(201).json(produto);
  } catch (erro) {
    next(erro);
  }
});

router.put('/:id', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    res.json(await catalogoServico.atualizarProduto(req.params.id, req.body));
  } catch (erro) {
    next(erro);
  }
});

router.delete('/:id', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    await catalogoServico.desativarProduto(req.params.id);
    res.status(204).send();
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
