const jwt = require('jsonwebtoken');
const enviarErro = require('../error');

function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return enviarErro(req, res, 401, 'TOKEN_AUSENTE', 'Envie o token no cabeçalho Authorization.');
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SEGREDO);
    next();
  } catch (erro) {
    enviarErro(req, res, 401, 'TOKEN_INVALIDO', 'Token inválido ou expirado.');
  }
}

function exigirPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return enviarErro(req, res, 403, 'ACESSO_NEGADO', 'Seu perfil não tem permissão para esta ação.');
    }
    next();
  };
}

module.exports = { exigirLogin, exigirPerfil };
