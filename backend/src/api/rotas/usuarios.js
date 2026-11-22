const express = require('express');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');
const { Usuario } = require('../../dados/modelos');

const router = express.Router();

router.get('/', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['senhaHash'] }
    });
    res.json(usuarios);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
