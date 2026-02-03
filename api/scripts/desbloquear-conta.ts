#!/usr/bin/env tsx

import 'dotenv/config';
import { cacheUtils } from '../src/infraestrutura/cache/redis.servico.js';

async function desbloquearConta() {
  const email = process.argv[2] || 'admin@admin.com';

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔓 DESBLOQUEANDO CONTA');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Email: ${email}`);
  console.log('');

  try {
    // Verificar bloqueio atual
    const bloqueado = await cacheUtils.obter<boolean>(`bloqueio:${email}`);
    const tentativas = await cacheUtils.obter<number>(`tentativas:${email}`);

    console.log('📋 Estado atual:');
    console.log(`   Bloqueado: ${bloqueado ? '❌ SIM' : '✅ NÃO'}`);
    console.log(`   Tentativas: ${tentativas || 0}`);
    console.log('');

    // Remover bloqueio
    await cacheUtils.remover(`bloqueio:${email}`);
    console.log('✅ Bloqueio removido');

    // Remover contador de tentativas
    await cacheUtils.remover(`tentativas:${email}`);
    console.log('✅ Tentativas resetadas');

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 CONTA DESBLOQUEADA!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Agora você pode fazer login normalmente.');
    console.log('');

    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao desbloquear:', erro);
    process.exit(1);
  }
}

desbloquearConta();
