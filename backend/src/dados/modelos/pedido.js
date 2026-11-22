const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Pedido = sequelize.define('Pedido', {
  clienteId: { type: DataTypes.INTEGER, allowNull: false },
  unidadeId: { type: DataTypes.INTEGER, allowNull: false },
  canalPedido: {
    type: DataTypes.ENUM('APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('AGUARDANDO_PAGAMENTO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'AGUARDANDO_PAGAMENTO'
  },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: 'pedidos',
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = Pedido;
