const Usuario = require('./usuario');
const Unidade = require('./unidade');
const Produto = require('./produto');
const Estoque = require('./estoque');
const Pedido = require('./pedido');
const ItemPedido = require('./itemPedido');
const Pagamento = require('./pagamento');
const LogAuditoria = require('./logAuditoria');

Unidade.hasMany(Estoque, { foreignKey: 'unidadeId' });
Estoque.belongsTo(Unidade, { foreignKey: 'unidadeId' });

Produto.hasMany(Estoque, { foreignKey: 'produtoId' });
Estoque.belongsTo(Produto, { foreignKey: 'produtoId' });

Usuario.hasMany(Pedido, { foreignKey: 'clienteId' });
Pedido.belongsTo(Usuario, { foreignKey: 'clienteId' });

Unidade.hasMany(Pedido, { foreignKey: 'unidadeId' });
Pedido.belongsTo(Unidade, { foreignKey: 'unidadeId' });

Pedido.hasMany(ItemPedido, { foreignKey: 'pedidoId', as: 'itens' });
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedidoId' });

Produto.hasMany(ItemPedido, { foreignKey: 'produtoId' });
ItemPedido.belongsTo(Produto, { foreignKey: 'produtoId' });

Pedido.hasMany(Pagamento, { foreignKey: 'pedidoId', as: 'pagamentos' });
Pagamento.belongsTo(Pedido, { foreignKey: 'pedidoId' });

Usuario.hasMany(LogAuditoria, { foreignKey: 'usuarioId' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = {
  Usuario, Unidade, Produto, Estoque,
  Pedido, ItemPedido, Pagamento, LogAuditoria
};
