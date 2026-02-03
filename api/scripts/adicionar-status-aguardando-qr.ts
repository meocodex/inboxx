#!/usr/bin/env tsx

import 'dotenv/config';
import postgres from 'postgres';

async function adicionarStatusAguardandoQR() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('Verificando enum StatusConexao...\n');

    // Verificar valores atuais do enum
    const valoresAtuais = await sql`
      SELECT enum_range(NULL::public."StatusConexao") AS valores
    `;
    console.log('Valores atuais:', valoresAtuais[0].valores);

    // Verificar se AGUARDANDO_QR já existe
    if (valoresAtuais[0].valores.includes('AGUARDANDO_QR')) {
      console.log('\n✅ Status AGUARDANDO_QR já existe no enum!');
      await sql.end();
      process.exit(0);
    }

    console.log('\n📝 Adicionando AGUARDANDO_QR ao enum...');

    // Adicionar novo valor ao enum
    await sql`
      ALTER TYPE public."StatusConexao" ADD VALUE 'AGUARDANDO_QR'
    `;

    console.log('✅ Status AGUARDANDO_QR adicionado com sucesso!');

    // Verificar valores finais
    const valoresFinais = await sql`
      SELECT enum_range(NULL::public."StatusConexao") AS valores
    `;
    console.log('\nValores finais:', valoresFinais[0].valores);

    await sql.end();
    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro);
    await sql.end();
    process.exit(1);
  }
}

adicionarStatusAguardandoQR();
