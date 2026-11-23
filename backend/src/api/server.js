require('dotenv').config();
const express = require('express');
const sequelize = require('../dados/database');
require('../dados/modelos');
const ErroNegocio = require('../aplicacao/errorNegocio');
const enviarErro = require('./error');
const rotasAutenticacao = require('./rotas/autenticacao');
const rotasUsuarios = require('./rotas/usuarios');
const rotasUnidades = require('./rotas/unidades');
const rotasProdutos = require('./rotas/produtos');
const rotasEstoque = require('./rotas/estoque');
const rotasPedidos = require('./rotas/pedidos');
const rotasPagamentos = require('./rotas/pagamentos');
const rotasAuditoria = require('./rotas/auditoria');
const rotasFidelidade = require('./rotas/fidelidade');

const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', rotasAutenticacao);
app.use('/usuarios', rotasUsuarios);
app.use('/unidades', rotasUnidades);
app.use('/produtos', rotasProdutos);
app.use('/estoque', rotasEstoque);
app.use('/pedidos', rotasPedidos);
app.use('/pagamentos', rotasPagamentos);
app.use('/auditoria', rotasAuditoria);
app.use('/fidelidade', rotasFidelidade);

app.use((req, res) => {
  enviarErro(req, res, 404, 'ROTA_NAO_ENCONTRADA', 'Rota não encontrada.');
});

app.use((erro, req, res, next) => {
  if (erro instanceof ErroNegocio) {
    return enviarErro(req, res, erro.status, erro.codigo, erro.message, erro.detalhes);
  }
  if (erro.type === 'entity.parse.failed') {
    return enviarErro(req, res, 400, 'JSON_INVALIDO', 'O corpo da requisição não é um JSON válido.');
  }
  console.error(erro);
  enviarErro(req, res, 500, 'ERRO_INTERNO', 'Erro inesperado no servidor.');
});

const porta = process.env.PORTA || 3000;

sequelize.sync().then(() => {
  app.listen(porta, () => {
    console.log('API rodando na porta ' + porta);
  });
});
