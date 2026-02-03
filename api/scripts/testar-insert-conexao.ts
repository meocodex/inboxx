#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { conexoes } from '../src/infraestrutura/banco/schema/index.js';

async function testarInsert() {
  try {
    console.log('Testando INSERT na tabela conexoes...\n');

    const [conexao] = await db
      .insert(conexoes)
      .values({
        clienteId: '4b2f6def-ec3e-4329-a823-0354c0ff4549',
        nome: 'Teste Direto',
        canal: 'WHATSAPP',
        provedor: 'UAIZAP',
        credenciais: {},
        configuracoes: null,
        status: 'AGUARDANDO_QR',
      })
      .returning();

    console.log('✅ INSERT bem-sucedido!');
    console.log('Conexão criada:', conexao);

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro no INSERT:');
    console.error(erro);
    process.exit(1);
  }
}

testarInsert();
