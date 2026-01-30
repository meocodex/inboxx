import { redis, cacheUtils } from './src/infraestrutura/cache/redis.servico.js';

async function testarRedis() {
  console.log('====================================');
  console.log('TESTE DE CONEXAO REDIS');
  console.log('====================================\n');

  try {
    console.log('1. Status do Redis:', redis.status);

    if (redis.status !== 'ready' && redis.status !== 'connect') {
      console.log('   Redis nao conectado. Tentando conectar...');
      await redis.connect();
      console.log('   Conectado! Novo status:', redis.status);
    } else {
      console.log('   ✅ Redis ja conectado');
    }

    console.log('\n2. Testando operacao PING...');
    const pong = await redis.ping();
    console.log('   Resposta:', pong);

    console.log('\n3. Testando cacheUtils.definir()...');
    await cacheUtils.definir('teste:chave', { valor: 'teste' }, 60);
    console.log('   ✅ Valor definido');

    console.log('\n4. Testando cacheUtils.obter()...');
    const valor = await cacheUtils.obter<{ valor: string }>('teste:chave');
    console.log('   Valor obtido:', valor);

    console.log('\n5. Testando cacheUtils.remover()...');
    await cacheUtils.remover('teste:chave');
    console.log('   ✅ Chave removida');

    console.log('\n6. Verificando disponibilidade...');
    console.log('   cacheUtils.disponivel():', cacheUtils.disponivel());

    console.log('\n====================================');
    console.log('✅ REDIS FUNCIONANDO CORRETAMENTE');
    console.log('====================================\n');

    await redis.quit();
    process.exit(0);
  } catch (erro) {
    console.error('\n❌ ERRO no Redis:', erro);
    if (erro instanceof Error) {
      console.error('   Mensagem:', erro.message);
      console.error('   Stack:', erro.stack);
    }
    process.exit(1);
  }
}

testarRedis();
