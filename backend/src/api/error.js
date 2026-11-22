function enviarErro(req, res, status, codigo, mensagem, detalhes = []) {
  res.status(status).json({
    error: codigo,
    message: mensagem,
    details: detalhes,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
}

module.exports = enviarErro;
