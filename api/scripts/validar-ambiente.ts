#!/usr/bin/env tsx
/**
 * Script para validar ambiente antes do deploy
 */

import 'dotenv/config';
import { env } from '../src/configuracao/ambiente.js';

console.log('');
console.log('🔍 Validando Ambiente para Deploy');
console.log('='.repeat(60));
console.log('');

let erros = 0;
let avisos = 0;

// 1. Verificar variáveis obrigatórias
console.log('📋 Verificando variáveis de ambiente...');

const variaveisObrigatorias = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'COOKIE_SECRET',
  'META_WEBHOOK_VERIFY_TOKEN',
  'META_APP_SECRET',
];

for (const variavel of variaveisObrigatorias) {
  const valor = env[variavel as keyof typeof env];
  if (valor) {
    console.log(`   ✅ ${variavel}: configurado`);
  } else {
    console.log(`   ❌ ${variavel}: AUSENTE`);
    erros++;
  }
}

console.log('');

// 2. Verificar valores seguros
console.log('🔒 Verificando segurança dos secrets...');

const valoresInseguros = [
  'GERE_UMA_CHAVE',
  'DEFINA_TOKEN',
  'COPIE_DO_PAINEL',
  'sua-chave-secreta',
  'exemplo',
  'test',
  'minimo-32-caracteres',
];

const camposCriticos = ['JWT_SECRET', 'COOKIE_SECRET', 'META_WEBHOOK_VERIFY_TOKEN'];

for (const campo of camposCriticos) {
  const valor = env[campo as keyof typeof env] as string;
  const inseguro = valoresInseguros.some(v => valor?.includes(v));

  if (inseguro) {
    console.log(`   ❌ ${campo}: Valor inseguro detectado!`);
    erros++;
  } else if (valor && valor.length >= 32) {
    console.log(`   ✅ ${campo}: Seguro (${valor.length} caracteres)`);
  } else {
    console.log(`   ⚠️  ${campo}: Muito curto (${valor?.length || 0} caracteres)`);
    avisos++;
  }
}

console.log('');

// 3. Verificar ambiente
console.log('🌍 Ambiente:');
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PORT: ${env.PORT}`);
console.log(`   STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);

console.log('');

// 4. Resumo
console.log('='.repeat(60));
if (erros > 0) {
  console.log(`❌ ${erros} erro(s) encontrado(s)`);
  console.log('');
  console.log('Execute: ./scripts/gerar-secrets.sh');
  console.log('E copie os valores para o arquivo .env');
  process.exit(1);
} else if (avisos > 0) {
  console.log(`⚠️  ${avisos} aviso(s)`);
  console.log('✅ Ambiente OK para continuar (com avisos)');
} else {
  console.log('✅ Ambiente OK - Pronto para deploy!');
}

console.log('');
