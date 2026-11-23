// Testes das regras do domínio. Não precisam de banco nem da API ligada.
// Para rodar:  npm test

const test = require('node:test');
const assert = require('node:assert');
const pedido = require('../src/dominio/pedido');
const pagamento = require('../src/dominio/pagamento');
const fidelidade = require('../src/dominio/fidelidade');

test('canais de pedido aceitos', () => {
  assert.deepStrictEqual(pedido.CANAIS, ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB']);
});

test('pedido aguardando pagamento só pode ser cancelado à mão', () => {
  assert.strictEqual(pedido.podeMudarStatus('AGUARDANDO_PAGAMENTO', 'CANCELADO'), true);
  assert.strictEqual(pedido.podeMudarStatus('AGUARDANDO_PAGAMENTO', 'EM_PREPARO'), false);
  assert.strictEqual(pedido.podeMudarStatus('AGUARDANDO_PAGAMENTO', 'ENTREGUE'), false);
});

test('fluxo normal: EM_PREPARO -> PRONTO -> ENTREGUE', () => {
  assert.strictEqual(pedido.podeMudarStatus('EM_PREPARO', 'PRONTO'), true);
  assert.strictEqual(pedido.podeMudarStatus('PRONTO', 'ENTREGUE'), true);
});

test('pedido entregue ou cancelado não muda mais', () => {
  assert.strictEqual(pedido.podeMudarStatus('ENTREGUE', 'CANCELADO'), false);
  assert.strictEqual(pedido.podeMudarStatus('CANCELADO', 'PRONTO'), false);
});

test('quem pode mudar para cada status', () => {
  assert.deepStrictEqual(pedido.perfisQuePodemMudarPara('PRONTO'), ['COZINHA', 'GERENTE']);
  assert.deepStrictEqual(pedido.perfisQuePodemMudarPara('ENTREGUE'), ['ATENDENTE', 'GERENTE']);
  assert.ok(pedido.perfisQuePodemMudarPara('CANCELADO').includes('CLIENTE'));
  assert.deepStrictEqual(pedido.perfisQuePodemMudarPara('EM_PREPARO'), []);
});

test('formas de pagamento e simulações do mock', () => {
  assert.deepStrictEqual(pagamento.FORMAS, ['PIX', 'CARTAO', 'MOCK']);
  assert.deepStrictEqual(pagamento.SIMULACOES, ['APROVADO', 'RECUSADO', 'FALHA']);
});

test('fidelidade: 1 ponto a cada R$ 10', () => {
  assert.strictEqual(fidelidade.calcularPontos(55, 'WEB'), 5);
  assert.strictEqual(fidelidade.calcularPontos(9.9, 'WEB'), 0);
});

test('promoção: pedido pelo APP vale pontos em dobro', () => {
  assert.strictEqual(fidelidade.calcularPontos(55, 'APP'), 10);
});

test('resgate: cada ponto vale R$ 0,10', () => {
  assert.strictEqual(fidelidade.calcularDescontoReais(5), 0.5);
  assert.strictEqual(fidelidade.calcularDescontoReais(100), 10);
});
