import { criarServidor } from './src/servidor.js';

async function testarLoginAPI() {
  console.log('====================================');
  console.log('TESTE DE LOGIN VIA API');
  console.log('====================================\n');

  try {
    console.log('1. Iniciando servidor Fastify...');
    const app = await criarServidor();

    console.log('2. Servidor criado com sucesso');

    console.log('\n3. Testando rota POST /api/autenticacao/entrar...');

    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'admin@admin.com',
        senha: 'admin123',
      },
    });

    console.log('\nStatus:', response.statusCode);
    console.log('Headers:', response.headers);
    console.log('Body:', response.body);

    if (response.statusCode === 200) {
      console.log('\n✅ LOGIN REALIZADO COM SUCESSO');
      const dados = JSON.parse(response.body);
      console.log('\nToken gerado:', dados.dados.accessToken?.substring(0, 50) + '...');
      console.log('Usuario:', dados.dados.usuario.nome);
    } else {
      console.log('\n❌ ERRO NO LOGIN');
      console.log('Status Code:', response.statusCode);
      try {
        const erro = JSON.parse(response.body);
        console.log('Erro:', JSON.stringify(erro, null, 2));
      } catch {
        console.log('Body (raw):', response.body);
      }
    }

    await app.close();
    process.exit(response.statusCode === 200 ? 0 : 1);
  } catch (erro) {
    console.error('\n❌ ERRO FATAL:', erro);
    if (erro instanceof Error) {
      console.error('Stack:', erro.stack);
    }
    process.exit(1);
  }
}

testarLoginAPI();
