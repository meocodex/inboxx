#!/usr/bin/env tsx

import 'dotenv/config';
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { usuarios, clientes, perfis } from '../src/infraestrutura/banco/schema/index.js';

async function listarDados() {
  try {
    console.log('📋 Listando dados do banco...\n');

    // Clientes
    const clientesData = await db.select().from(clientes).limit(5);
    console.log(`✓ Clientes: ${clientesData.length}`);
    clientesData.forEach(c => console.log(`  - ${c.nome} (${c.email})`));
    console.log('');

    // Perfis
    const perfisData = await db.select().from(perfis).limit(10);
    console.log(`✓ Perfis: ${perfisData.length}`);
    perfisData.forEach(p => console.log(`  - ${p.nome}`));
    console.log('');

    // Usuários
    const usuariosData = await db.select().from(usuarios).limit(5);
    console.log(`✓ Usuários: ${usuariosData.length}`);
    usuariosData.forEach(u => console.log(`  - ${u.nome} (${u.email})`));
    console.log('');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro:', erro);
    process.exit(1);
  }
}

listarDados();
