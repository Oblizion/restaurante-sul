const { LogAuditoria } = require('../dados/modelos');

async function registrar(usuarioId, acao, entidade, entidadeId, transacao) {
  await LogAuditoria.create(
    { usuarioId, acao, entidade, entidadeId },
    { transaction: transacao }
  );
}

module.exports = { registrar };
