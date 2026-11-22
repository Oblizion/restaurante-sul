const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ItemPedido = sequelize.define('ItemPedido', {
  pedidoId: { type: DataTypes.INTEGER, allowNull: false },
  produtoId: { type: DataTypes.INTEGER, allowNull: false },
  quantidade: { type: DataTypes.INTEGER, allowNull: false },
  precoUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: 'itens_pedido',
  underscored: true,
  timestamps: false
});

module.exports = ItemPedido;
