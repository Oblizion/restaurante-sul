// Regras do pedido. Aqui não tem banco nem Express, só regra de negócio.

const CANAIS = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'];
const STATUS = ['AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

// de qual status para quais é permitido ir
// (EM_PREPARO só é alcançado pelo pagamento aprovado, nunca à mão)
const TRANSICOES = {
  AGUARDANDO_PAGAMENTO: ['CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: []
};

// quem pode mudar para cada status
const PERMISSOES = {
  PRONTO: ['COZINHA', 'GERENTE'],
  ENTREGUE: ['ATENDENTE', 'GERENTE'],
  CANCELADO: ['CLIENTE', 'ATENDENTE', 'GERENTE']
};

function podeMudarStatus(de, para) {
  return (TRANSICOES[de] || []).includes(para);
}

function perfisQuePodemMudarPara(status) {
  return PERMISSOES[status] || [];
}

module.exports = {
  CANAIS,
  STATUS,
  TRANSICOES,
  PERMISSOES,
  podeMudarStatus,
  perfisQuePodemMudarPara
};
