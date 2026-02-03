import postgres from 'postgres';
import fs from 'fs';
import 'dotenv/config';

async function main() {
  const sql = postgres(process.env.DATABASE_URL || '');

  const script = fs.readFileSync('/tmp/create_execucoes_fluxo.sql', 'utf-8');

  await sql.unsafe(script);

  await sql.end();

  console.log('✅ Tabela execucoes_fluxo criada com sucesso');
}

main().catch(console.error);
