// Regras do programa de fidelidade (descritas em docs/regras-de-negocio.md)

const REAIS_POR_PONTO = 10;             // 1 ponto a cada R$ 10 em pedido entregue
const MULTIPLICADOR_APP = 2;            // promoção: pedido pelo APP vale pontos em dobro
const REAIS_POR_PONTO_RESGATADO = 0.10; // cada ponto resgatado vale R$ 0,10

function calcularPontos(totalDoPedido, canalPedido) {
  let pontos = Math.floor(totalDoPedido / REAIS_POR_PONTO);
  if (canalPedido === 'APP') {
    pontos = pontos * MULTIPLICADOR_APP;
  }
  return pontos;
}

function calcularDescontoReais(pontos) {
  return Math.round(pontos * REAIS_POR_PONTO_RESGATADO * 100) / 100;
}

module.exports = {
  REAIS_POR_PONTO,
  MULTIPLICADOR_APP,
  REAIS_POR_PONTO_RESGATADO,
  calcularPontos,
  calcularDescontoReais
};
