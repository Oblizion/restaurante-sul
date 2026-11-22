const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const LogAuditoria = sequelize.define('LogAuditoria', {
  usuarioId: { type: DataTypes.INTEGER, allowNull: true },
  acao: { type: DataTypes.STRING, allowNull: false },
  entidade: { type: DataTypes.STRING, allowNull: false },
  entidadeId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'logs_auditoria',
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = LogAuditoria;
