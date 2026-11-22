const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Produto = sequelize.define('Produto', {
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.STRING, allowNull: true },
  preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  categoria: { type: DataTypes.STRING, allowNull: false },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'produtos',
  underscored: true,
  timestamps: false
});

module.exports = Produto;
