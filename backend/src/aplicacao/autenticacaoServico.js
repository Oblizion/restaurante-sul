const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../dados/modelos');
const ErroNegocio = require('./errorNegocio');

const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function cadastrar(dados) {
  const { nome, email, senha, consentimentoLgpd } = dados;
  const detalhes = [];

  if (!nome || nome.trim() === '') {
    detalhes.push({ field: 'nome', issue: 'Nome é obrigatório' });
  }
  if (!email || !formatoEmail.test(email)) {
    detalhes.push({ field: 'email', issue: 'E-mail inválido' });
  }
  if (!senha || senha.length < 6) {
    detalhes.push({ field: 'senha', issue: 'A senha precisa ter no mínimo 6 caracteres' });
  }
  if (consentimentoLgpd !== true) {
    detalhes.push({ field: 'consentimentoLgpd', issue: 'É necessário aceitar o uso dos dados' });
  }

  if (detalhes.length > 0) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Há campos inválidos na requisição.', detalhes);
  }

  const jaExiste = await Usuario.findOne({ where: { email } });
  if (jaExiste) {
    throw new ErroNegocio(409, 'EMAIL_JA_CADASTRADO', 'Já existe um usuário com este e-mail.');
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // quem se cadastra pela API sempre entra como CLIENTE
  const usuario = await Usuario.create({
    nome: nome.trim(),
    email,
    senhaHash,
    perfil: 'CLIENTE',
    consentimentoLgpd: true,
    dataConsentimento: new Date()
  });

  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
}

async function login(dados) {
  const { email, senha } = dados;

  if (!email || !senha) {
    throw new ErroNegocio(422, 'DADOS_INVALIDOS', 'Informe e-mail e senha.', [
      { field: 'email/senha', issue: 'Campos obrigatórios' }
    ]);
  }

  const usuario = await Usuario.findOne({ where: { email } });
  const senhaConfere = usuario && await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaConfere) {
    throw new ErroNegocio(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.');
  }

  const token = jwt.sign(
    { id: usuario.id, perfil: usuario.perfil },
    process.env.JWT_SEGREDO,
    { expiresIn: '1h' }
  );

  return {
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil }
  };
}

module.exports = { cadastrar, login };
