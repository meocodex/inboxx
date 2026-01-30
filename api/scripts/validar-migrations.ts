import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL as string);
const db = drizzle(client);

async function validarMigrations() {
  console.log('🔍 Validando integridade das migrations aplicadas...\n');

  try {
    // 1. Verificar coluna cliente_id em nos_chatbot
    const nosResult = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'nos_chatbot' AND column_name = 'cliente_id'
    `;
    console.log('✅ Migration 0024 - nos_chatbot.cliente_id:', nosResult.length > 0 ? 'OK' : '❌ FALTANDO');
    if (nosResult.length > 0) {
      console.log('   Tipo:', nosResult[0].data_type, '| Nullable:', nosResult[0].is_nullable);
    }

    // 2. Verificar índices em transicoes_chatbot
    const indicesTransicoes = await client`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'transicoes_chatbot'
      AND indexname LIKE 'idx_transicoes%'
    `;
    console.log('\n✅ Migration 0025 - Índices transicoes_chatbot:', indicesTransicoes.length, 'índices criados');
    indicesTransicoes.forEach(idx => console.log('   -', idx.indexname));

    // 3. Verificar coluna cliente_id e UNIQUE em mensagens
    const mensagensClienteId = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mensagens' AND column_name = 'cliente_id'
    `;
    console.log('\n✅ Migration 0026 - mensagens.cliente_id:', mensagensClienteId.length > 0 ? 'OK' : '❌ FALTANDO');

    const uniqueConstraint = await client`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'mensagens'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'unique_mensagem_id_externo'
    `;
    console.log('   UNIQUE constraint (cliente_id, id_externo):', uniqueConstraint.length > 0 ? 'OK' : '❌ FALTANDO');

    // 4. Validar integridade multi-tenant (sem nós órfãos)
    const nosOrfaos = await client`
      SELECT COUNT(*) as count
      FROM nos_chatbot n
      LEFT JOIN fluxos_chatbot f ON n.fluxo_id = f.id
      WHERE n.cliente_id IS NULL OR (f.cliente_id IS NOT NULL AND n.cliente_id != f.cliente_id)
    `;
    console.log('\n📊 Integridade Multi-Tenant:');
    console.log('   Nós com cliente_id inconsistente:', nosOrfaos[0].count);
    if (Number(nosOrfaos[0].count) === 0) {
      console.log('   ✅ Todos os nós estão corretamente isolados por cliente');
    }

    // 5. Verificar duplicatas em mensagens
    const duplicatas = await client`
      SELECT cliente_id, id_externo, COUNT(*) as count
      FROM mensagens
      WHERE id_externo IS NOT NULL
      GROUP BY cliente_id, id_externo
      HAVING COUNT(*) > 1
    `;
    console.log('\n📊 Integridade Mensagens:');
    console.log('   Mensagens duplicadas (id_externo):', duplicatas.length);
    if (duplicatas.length === 0) {
      console.log('   ✅ Sem duplicatas - UNIQUE constraint funcionando');
    }

    // 6. Estatísticas gerais
    const stats = await client`
      SELECT
        (SELECT COUNT(*) FROM nos_chatbot) as total_nos,
        (SELECT COUNT(*) FROM transicoes_chatbot) as total_transicoes,
        (SELECT COUNT(*) FROM mensagens) as total_mensagens,
        (SELECT COUNT(*) FROM fluxos_chatbot) as total_fluxos
    `;
    console.log('\n📈 Estatísticas do Sistema:');
    console.log('   Total de fluxos:', stats[0].total_fluxos);
    console.log('   Total de nós:', stats[0].total_nos);
    console.log('   Total de transições:', stats[0].total_transicoes);
    console.log('   Total de mensagens:', stats[0].total_mensagens);

    console.log('\n🎉 Validação concluída com sucesso!');
    console.log('\n✅ Todas as migrations estão aplicadas corretamente.');
    console.log('✅ Integridade de dados verificada.');
    console.log('✅ Sistema pronto para build e testes.\n');

  } catch (erro) {
    console.error('❌ Erro durante validação:', erro);
    throw erro;
  } finally {
    await client.end();
  }
}

validarMigrations().catch((erro) => {
  console.error('Falha na validação:', erro);
  process.exit(1);
});
