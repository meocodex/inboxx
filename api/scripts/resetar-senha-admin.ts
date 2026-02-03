#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { usuarios } from '../src/infraestrutura/banco/schema/index.js';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

async function resetarSenha() {
  try {
    console.log('🔄 Resetando senha do admin...\n');

    const novaSenha = 'Admin@123';
    const senhaHash = await hash(novaSenha, 10);

    // Atualizar senha do primeiro usuário
    const [usuario] = await db
      .update(usuarios)
      .set({ senhaHash: senhaHash })
      .where(eq(usuarios.email, 'admin@admin.com'))
      .returning();

    if (usuario) {
      console.log('✅ Senha resetada com sucesso!\n');
      console.log('═══════════════════════════════════════');
      console.log('📋 CREDENCIAIS DE ACESSO');
      console.log('═══════════════════════════════════════');
      console.log(`Email: ${usuario.email}`);
      console.log(`Senha: Admin@123`);
      console.log(`Nome: ${usuario.nome}`);
      console.log('═══════════════════════════════════════\n');
    } else {
      console.log('✗ Usuário não encontrado!');
    }

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro);
    process.exit(1);
  }
}

resetarSenha();
