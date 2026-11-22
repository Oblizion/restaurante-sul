const express = require('express');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');
const { LogAuditoria } = require('../../dados/modelos');
const lerPaginacao = require('../../aplicacao/paginacao');

const router = express.Router();

router.get('/', exigirLogin, exigirPerfil('GERENTE'), async (req, res, next) => {
  try {
    const { page, limit, offset } = lerPaginacao(req.query);
    const { count, rows } = await LogAuditoria.findAndCountAll({
      limit,
      offset,
      order: [['id', 'DESC']]
    });
    res.json({ page, limit, total: count, itens: rows });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
