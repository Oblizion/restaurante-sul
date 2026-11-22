const express = require('express');
const estoqueServico = require('../../aplicacao/estoqueServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');

const router = express.Router();

router.post('/movimentos', exigirLogin, exigirPerfil('GERENTE', 'ATENDENTE'), async (req, res, next) => {
  try {
    const resultado = await estoqueServico.movimentar(req.body);
    res.status(201).json(resultado);
  } catch (erro) {
    next(erro);
  }
});

router.get('/unidade/:unidadeId', exigirLogin, exigirPerfil('GERENTE', 'ATENDENTE'), async (req, res, next) => {
  try {
    res.json(await estoqueServico.saldoDaUnidade(req.params.unidadeId));
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
