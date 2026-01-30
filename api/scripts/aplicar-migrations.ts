#!/usr/bin/env tsx
/**
 * Script para aplicar migrations manualmente
 * Uso: npx tsx scripts/aplicar-migrations.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

console.log('🔧 Conectando ao banco de dados...');
const queryClient = postgres(databaseUrl);
const db = drizzle(queryClient);

const migrations = [
  '0024_add_cliente_id_nos_chatbot.sql',
  '0025_add_indices_transicoes.sql',
  '0026_add_cliente_id_mensagens_unique.sql',
];

async function aplicarMigrations() {
  try {
    for (const migrationFile of migrations) {
      const migrationPath = join(__dirname, '..', 'drizzle', migrationFile);

      console.log(`\n📝 Aplicando: ${migrationFile}`);

      try {
        const sql = readFileSync(migrationPath, 'utf-8');

        // Dividir em statements (ignorar comentários)
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await queryClient.unsafe(statement);
          }
        }

        console.log(`   ✅ ${migrationFile} aplicada com sucesso`);
      } catch (error: any) {
        // Ignorar erros de "já existe"
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`   ⚠️  ${migrationFile} já aplicada (ignorando)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Todas as migrations foram aplicadas com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao aplicar migrations:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

aplicarMigrations();
