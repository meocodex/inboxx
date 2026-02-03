import postgres from 'postgres';
import 'dotenv/config';

async function testar() {
  const sql = postgres(process.env.DATABASE_URL || '');

  try {
    // Verificar se a tabela existe
    const result = await sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'execucoes_fluxo'
      ORDER BY ordinal_position
    `;

    console.log('✅ Tabela execucoes_fluxo encontrada:');
    console.log(result.map(r => `  - ${r.column_name}: ${r.data_type}`).join('\n'));

    // Verificar índices
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'execucoes_fluxo'
    `;

    console.log('\n✅ Índices criados:');
    console.log(indexes.map(i => `  - ${i.indexname}`).join('\n'));

    // Contar registros
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM execucoes_fluxo`;
    console.log(`\n📊 Total de execuções: ${count}`);
  } catch (erro) {
    console.error('❌ Erro:', erro);
  } finally {
    await sql.end();
  }
}

testar();
