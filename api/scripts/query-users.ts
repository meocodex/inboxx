import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT id, nome, email, perfil_id, cliente_id FROM usuarios LIMIT 10`;
  console.log(JSON.stringify(result, null, 2));
  await sql.end();
  process.exit(0);
}
main();
