const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Estoque = sequelize.define('Estoque', {
  unidadeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'unidade_produto'
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'unidade_produto'
  },
  quantidade: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  tableName: 'estoques',
  underscored: true,
  timestamps: false
});

module.exports = Estoque;
