# Regras de negócio

## Programa de fidelidade
- O cliente só participa se aceitar (POST /fidelidade/consentimento com aceito: true).
  Pode sair a qualquer momento enviando aceito: false.
- Pontos são acumulados quando o pedido muda para ENTREGUE:
  1 ponto a cada R$ 10,00 do total (parte inteira).
- Sem consentimento, nenhum ponto é registrado.
- Resgate (POST /fidelidade/resgatar): cada ponto vale R$ 0,10 de desconto.
  O saldo é a soma dos movimentos (ACUMULO positivo, RESGATE negativo).
- Resgatar mais pontos do que o saldo retorna 409 SALDO_INSUFICIENTE.
- Resgatar sem consentimento retorna 403 CONSENTIMENTO_FIDELIDADE_NECESSARIO.

## Promoção
- Pedidos feitos pelo canal APP valem pontos em dobro.
- A regra está em um único lugar (fidelidadeServico.js, constante MULTIPLICADOR_APP).

## Exemplo
Pedido de R$ 55,00 pelo APP, entregue: 5 pontos x 2 = 10 pontos.
Resgatando 5 pontos, o cliente ganha R$ 0,50 de desconto e fica com saldo 5.
