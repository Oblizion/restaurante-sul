require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./database');
const { Usuario } = require('./modelos');

const usuarios = [
  { nome: 'Gerente Teste', email: 'gerente@restaurantesul.com', senha: 'Gerente@123', perfil: 'GERENTE' },
  { nome: 'Atendente Teste', email: 'atendente@restaurantesul.com', senha: 'Atendente@123', perfil: 'ATENDENTE' },
  { nome: 'Cozinha Teste', email: 'cozinha@restaurantesul.com', senha: 'Cozinha@123', perfil: 'COZINHA' }
];

async function executar() {
  await sequelize.sync();

  for (const u of usuarios) {
    const existe = await Usuario.findOne({ where: { email: u.email } });
    if (existe) {
      console.log(u.perfil + ' já existe.');
      continue;
    }
    await Usuario.create({
      nome: u.nome,
      email: u.email,
      senhaHash: await bcrypt.hash(u.senha, 10),
      perfil: u.perfil,
      consentimentoLgpd: true,
      dataConsentimento: new Date()
    });
    console.log(u.perfil + ' criado.');
  }

  await sequelize.close();
}

executar();
