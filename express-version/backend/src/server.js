require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { MOCK_MODE } = require('./services/aiService');

const PORT = process.env.PORT || 4200;

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`Sales Role Play API jalan di port ${PORT}`);
    if (MOCK_MODE) {
      console.log('OPENAI_API_KEY tidak diset — AI service jalan dalam mode mock.');
    }
  });
}

start().catch((err) => {
  console.error('Gagal start server:', err);
  process.exit(1);
});
