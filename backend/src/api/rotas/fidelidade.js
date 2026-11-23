const express = require('express');
const fidelidadeServico = require('../../aplicacao/fidelidadeServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');

const router = express.Router();

// programa de fidelidade é só para clientes
router.use(exigirLogin, exigirPerfil('CLIENTE'));

router.get('/saldo', async (req, res, next) => {
  try {
    res.json(await fidelidadeServico.consultar(req.usuario));
  } catch (erro) {
    next(erro);
  }
});

router.post('/consentimento', async (req, res, next) => {
  try {
    res.json(await fidelidadeServico.definirConsentimento(req.usuario, req.body));
  } catch (erro) {
    next(erro);
  }
});

router.post('/resgatar', async (req, res, next) => {
  try {
    const resultado = await fidelidadeServico.resgatar(req.usuario, req.body);
    res.status(201).json(resultado);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
