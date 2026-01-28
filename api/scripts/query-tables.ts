import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const colsPlanos = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'planos' ORDER BY ordinal_position`;
  console.log('Colunas planos:');
  colsPlanos.forEach(c => console.log(`  ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));

  await sql.end();
  process.exit(0);
}
main();
