const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Unidade = sequelize.define('Unidade', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ativa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'unidades',
  underscored: true,
  timestamps: false
});

module.exports = Unidade;
