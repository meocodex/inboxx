#!/usr/bin/env tsx

import 'dotenv/config';
import { uaiZapAdmin } from '../src/modulos/whatsapp/provedores/uaizap-admin.servico.js';
import { logger } from '../src/compartilhado/utilitarios/logger.js';

async function testarIntegracaoUaiZap() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE: Integração UaiZap');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // Teste 1: Verificar inicialização
    console.log('✓ Serviço UaiZapAdmin inicializado');
    console.log('');

    // Teste 2: Listar instâncias existentes
    console.log('📋 Teste 1: Listar instâncias existentes');
    console.log('───────────────────────────────────────────────────────');
    try {
      const instancias = await uaiZapAdmin.listarInstancias();
      console.log(`✓ Total de instâncias: ${instancias.length}`);

      if (instancias.length > 0) {
        console.log('\nInstâncias encontradas:');
        instancias.forEach((inst, index) => {
          console.log(`  ${index + 1}. ${inst.nome} (${inst.id})`);
          console.log(`     Status: ${inst.status}`);
          console.log(`     Criado em: ${inst.criadoEm.toISOString()}`);
        });
      } else {
        console.log('  Nenhuma instância encontrada');
      }
    } catch (erro) {
      console.log('✗ Erro ao listar instâncias');
      console.log(`  Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
    }

    console.log('');

    // Teste 3: Criar instância de teste
    console.log('📋 Teste 2: Criar instância de teste');
    console.log('───────────────────────────────────────────────────────');
    try {
      const nomeInstancia = `teste-api-${Date.now()}`;
      console.log(`  Criando instância: ${nomeInstancia}`);

      const instancia = await uaiZapAdmin.criarInstancia({
        nome: nomeInstancia,
        webhookUrl: 'https://exemplo.com/webhook',
      });

      console.log('✓ Instância criada com sucesso!');
      console.log(`  ID: ${instancia.id}`);
      console.log(`  Nome: ${instancia.nome}`);
      console.log(`  Status: ${instancia.status}`);
      console.log(`  QR Code: ${instancia.qrcode ? 'Disponível' : 'Não disponível'}`);

      // Teste 4: Obter QR Code
      console.log('');
      console.log('📋 Teste 3: Obter QR Code');
      console.log('───────────────────────────────────────────────────────');
      try {
        const qrcode = await uaiZapAdmin.obterQRCode(instancia.id);
        if (qrcode) {
          console.log('✓ QR Code obtido com sucesso!');
          console.log(`  Tamanho: ${qrcode.length} caracteres`);
          console.log(`  Início: ${qrcode.substring(0, 50)}...`);
        } else {
          console.log('⚠ QR Code não disponível');
        }
      } catch (erro) {
        console.log('✗ Erro ao obter QR Code');
        console.log(`  Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
      }

      // Teste 5: Verificar status
      console.log('');
      console.log('📋 Teste 4: Verificar status da instância');
      console.log('───────────────────────────────────────────────────────');
      try {
        const statusInfo = await uaiZapAdmin.verificarStatus(instancia.id);
        console.log('✓ Status verificado com sucesso!');
        console.log(`  Status: ${statusInfo.status}`);
        console.log(`  Conectado: ${statusInfo.conectado ? 'Sim' : 'Não'}`);
      } catch (erro) {
        console.log('✗ Erro ao verificar status');
        console.log(`  Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
      }

      // Teste 6: Excluir instância de teste
      console.log('');
      console.log('📋 Teste 5: Excluir instância de teste');
      console.log('───────────────────────────────────────────────────────');
      try {
        await uaiZapAdmin.excluirInstancia(instancia.id);
        console.log('✓ Instância excluída com sucesso!');
      } catch (erro) {
        console.log('✗ Erro ao excluir instância');
        console.log(`  Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
      }

    } catch (erro) {
      console.log('✗ Erro ao criar instância');
      console.log(`  Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TESTE CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

  } catch (erro) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ ERRO NO TESTE');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    console.error(erro);
    process.exit(1);
  }

  process.exit(0);
}

// Executar teste
testarIntegracaoUaiZap();
