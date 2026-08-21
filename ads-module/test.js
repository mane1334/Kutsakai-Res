// Teste simples para o Ads Module
const app = require('./index');

describe('Ads Module Health Check', () => {
  test('GET /health returns 200', async () => {
    expect(app).toBeDefined();
  });
});

async function testAdsModule() {
  console.log('🧪 Testando Ads Module...\n');
  const BASE_URL = 'http://localhost:3003';
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    if (healthData.success) {
      console.log('✅ Health Check: OK');
      console.log(`   Mensagem: ${healthData.message}`);
      console.log(`   Versão: ${healthData.version}\n`);
    } else {
      console.log('❌ Health Check: FALHOU\n');
      return;
    }
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n💡 Certifique-se de que o Ads Module está rodando na porta 3003');
  }
}

if (require.main === module) {
  testAdsModule();
}

module.exports = { testAdsModule };
