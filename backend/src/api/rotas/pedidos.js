const express = require('express');
const pedidoServico = require('../../aplicacao/pedidoServico');
const statusServico = require('../../aplicacao/statusServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');

const router = express.Router();

router.post('/', exigirLogin, exigirPerfil('CLIENTE', 'ATENDENTE', 'GERENTE'), async (req, res, next) => {
  try {
    const pedido = await pedidoServico.criar(req.usuario, req.body);
    res.status(201).json(pedido);
  } catch (erro) {
    next(erro);
  }
});

router.get('/', exigirLogin, async (req, res, next) => {
  try {
    res.json(await pedidoServico.listar(req.usuario, req.query));
  } catch (erro) {
    next(erro);
  }
});

router.get('/:id', exigirLogin, async (req, res, next) => {
  try {
    res.json(await pedidoServico.buscar(req.usuario, req.params.id));
  } catch (erro) {
    next(erro);
  }
});

router.patch('/:id/status', exigirLogin, async (req, res, next) => {
  try {
    res.json(await statusServico.atualizar(req.usuario, req.params.id, req.body));
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
