const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Cada linha e uma entrada ou saida de pontos do cliente.
// ACUMULO tem pontos positivos, RESGATE tem pontos negativos.
const MovimentoFidelidade = sequelize.define('MovimentoFidelidade', {
  clienteId: { type: DataTypes.INTEGER, allowNull: false },
  pedidoId: { type: DataTypes.INTEGER, allowNull: true },
  pontos: { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('ACUMULO', 'RESGATE'),
    allowNull: false
  }
}, {
  tableName: 'movimentos_fidelidade',
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = MovimentoFidelidade;
