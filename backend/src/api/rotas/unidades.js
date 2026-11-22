const express = require('express');
const catalogoServico = require('../../aplicacao/catalogoServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await catalogoServico.listarUnidades(req.query));
  } catch (erro) {
    next(erro);
  }
});

router.get('/:id/cardapio', async (req, res, next) => {
  try {
    res.json(await catalogoServico.cardapioDaUnidade(req.params.id, req.query));
  } catch (erro) {
    next(erro);
  }
});

router.post('/', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    const unidade = await catalogoServico.criarUnidade(req.body);
    res.status(201).json(unidade);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
