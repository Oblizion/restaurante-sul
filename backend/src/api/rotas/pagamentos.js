const express = require('express');
const pagamentoServico = require('../../aplicacao/pagamentoServico');
const { exigirLogin, exigirPerfil } = require('../middlewares/autenticacao');
const enviarErro = require('../error');

const router = express.Router();

router.post('/', exigirLogin, exigirPerfil('CLIENTE', 'ATENDENTE', 'GERENTE'), async (req, res, next) => {
  try {
    const resultado = await pagamentoServico.pagar(req.usuario, req.body);

    // pagamento recusado: o registro foi salvo, mas a resposta segue o padrão de erro
    if (resultado.status === 'RECUSADO') {
      return enviarErro(req, res, 402, 'PAGAMENTO_RECUSADO', resultado.mensagem, [
        { field: 'pagamento', issue: 'Transação ' + resultado.idTransacao }
      ]);
    }

    res.status(201).json(resultado);
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
