// Simula um gateway de pagamento externo (não existe cobrança real).
// O campo "simular" permite testar os três resultados possíveis.
function processarPagamento(valor, forma, simular) {
  if (simular === 'FALHA') {
    throw new Error('Gateway fora do ar');
  }

  const idTransacao = 'MOCK-' + Date.now();

  if (simular === 'RECUSADO') {
    return { aprovado: false, idTransacao, mensagem: 'Pagamento recusado pelo gateway (simulação).' };
  }

  return { aprovado: true, idTransacao, mensagem: 'Pagamento aprovado (simulação).' };
}

module.exports = { processarPagamento };
