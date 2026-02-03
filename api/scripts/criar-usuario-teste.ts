#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { usuarios, clientes, perfis } from '../src/infraestrutura/banco/schema/index.js';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

async function criarUsuarioTeste() {
  try {
    console.log('🔍 Verificando se usuário teste existe...');

    // Verificar se já existe
    const usuarioExistente = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, 'admin@teste.com'))
      .limit(1);

    if (usuarioExistente.length > 0) {
      console.log('✓ Usuário teste já existe!');
      console.log(`  Email: admin@teste.com`);
      console.log(`  Senha: Admin@123`);
      console.log(`  ID: ${usuarioExistente[0].id}`);
      process.exit(0);
    }

    console.log('📝 Criando usuário teste...');

    // Buscar cliente e perfil
    const [cliente] = await db.select().from(clientes).limit(1);
    const [perfil] = await db.select().from(perfis).where(eq(perfis.nome, 'Admin')).limit(1);

    if (!cliente) {
      console.error('✗ Nenhum cliente encontrado no banco!');
      console.log('  Execute o seed de clientes primeiro.');
      process.exit(1);
    }

    if (!perfil) {
      console.error('✗ Perfil Admin não encontrado!');
      process.exit(1);
    }

    // Hash da senha
    const senhaHash = await hash('Admin@123', 10);

    // Criar usuário
    const [usuario] = await db
      .insert(usuarios)
      .values({
        clienteId: cliente.id,
        perfilId: perfil.id,
        nome: 'Administrador Teste',
        email: 'admin@teste.com',
        senha: senhaHash,
        ativo: true,
      })
      .returning();

    console.log('✅ Usuário teste criado com sucesso!');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 CREDENCIAIS DE ACESSO');
    console.log('═══════════════════════════════════════');
    console.log(`Email: admin@teste.com`);
    console.log(`Senha: Admin@123`);
    console.log(`ID: ${usuario.id}`);
    console.log(`Cliente: ${cliente.nome}`);
    console.log(`Perfil: ${perfil.nome}`);
    console.log('═══════════════════════════════════════');
    console.log('');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao criar usuário teste:');
    console.error(erro);
    process.exit(1);
  }
}

criarUsuarioTeste();
