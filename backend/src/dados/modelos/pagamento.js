const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Pagamento = sequelize.define('Pagamento', {
  pedidoId: { type: DataTypes.INTEGER, allowNull: false },
  valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  forma: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'APROVADO', 'RECUSADO'),
    allowNull: false,
    defaultValue: 'PENDENTE'
  },
  idTransacaoMock: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'pagamentos',
  underscored: true,
  createdAt: 'criado_em',
  updatedAt: false
});

module.exports = Pagamento;
