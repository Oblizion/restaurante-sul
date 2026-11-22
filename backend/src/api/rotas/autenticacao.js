const express = require('express');
const autenticacaoServico = require('../../aplicacao/autenticacaoServico');
const { exigirLogin } = require('../middlewares/autenticacao');
const { Usuario } = require('../../dados/modelos');

const router = express.Router();

router.post('/cadastro', async (req, res, next) => {
  try {
    const usuario = await autenticacaoServico.cadastrar(req.body);
    res.status(201).json(usuario);
  } catch (erro) {
    next(erro);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const resposta = await autenticacaoServico.login(req.body);
    res.status(200).json(resposta);
  } catch (erro) {
    next(erro);
  }
});

router.get('/eu', exigirLogin, async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nome', 'email', 'perfil']
    });
    res.json(usuario);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
