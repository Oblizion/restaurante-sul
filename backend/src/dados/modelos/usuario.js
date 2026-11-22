const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senhaHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  perfil: {
    type: DataTypes.ENUM('CLIENTE', 'ATENDENTE', 'COZINHA', 'GERENTE'),
    allowNull: false,
    defaultValue: 'CLIENTE'
  },
  consentimentoLgpd: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dataConsentimento: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = Usuario;
