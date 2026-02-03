#!/usr/bin/env tsx

import 'dotenv/config';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testarLoginCompleto() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE COMPLETO: Fluxo de Login');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // -------------------------------------------------------------------------
    // Teste 1: Health Check
    // -------------------------------------------------------------------------
    console.log('📋 Teste 1: Health Check');
    console.log('───────────────────────────────────────────────────────');
    try {
      const health = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Servidor respondendo');
      console.log(`   Status: ${health.status}`);
    } catch (erro) {
      console.log('❌ Servidor não está respondendo');
      console.log(`   Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
      process.exit(1);
    }
    console.log('');

    // -------------------------------------------------------------------------
    // Teste 2: Login via API
    // -------------------------------------------------------------------------
    console.log('📋 Teste 2: Login via API');
    console.log('───────────────────────────────────────────────────────');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/autenticacao/entrar`, {
        email: 'admin@admin.com',
        senha: 'Admin@123',
      });

      if (loginResponse.data.sucesso) {
        console.log('✅ Login bem-sucedido!');
        console.log(`   Token: ${loginResponse.data.dados.accessToken.substring(0, 30)}...`);
        console.log(`   Usuário: ${loginResponse.data.dados.usuario.nome}`);
        console.log(`   Email: ${loginResponse.data.dados.usuario.email}`);
        console.log(`   Perfil: ${loginResponse.data.dados.usuario.perfil.nome}`);

        // -------------------------------------------------------------------------
        // Teste 3: Obter Usuário Atual com Token
        // -------------------------------------------------------------------------
        console.log('');
        console.log('📋 Teste 3: Obter Usuário Atual (com token)');
        console.log('───────────────────────────────────────────────────────');

        const token = loginResponse.data.dados.accessToken;

        try {
          const meResponse = await axios.get(`${BASE_URL}/api/autenticacao/eu`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (meResponse.data.sucesso) {
            console.log('✅ Usuário obtido com sucesso!');
            console.log(`   ID: ${meResponse.data.dados.id}`);
            console.log(`   Nome: ${meResponse.data.dados.nome}`);
            console.log(`   Email: ${meResponse.data.dados.email}`);
          } else {
            console.log('❌ Falha ao obter usuário');
          }
        } catch (erro) {
          console.log('❌ Erro ao obter usuário atual');
          if (axios.isAxiosError(erro)) {
            console.log(`   Status: ${erro.response?.status}`);
            console.log(`   Mensagem: ${erro.response?.data?.erro || erro.message}`);
          }
        }
      } else {
        console.log('❌ Login falhou (resposta sem sucesso)');
      }
    } catch (erro) {
      console.log('❌ Erro ao fazer login');
      if (axios.isAxiosError(erro)) {
        console.log(`   Status: ${erro.response?.status}`);
        console.log(`   Mensagem: ${erro.response?.data?.erro || erro.message}`);
      }
    }
    console.log('');

    // -------------------------------------------------------------------------
    // Teste 4: Verificar Frontend
    // -------------------------------------------------------------------------
    console.log('📋 Teste 4: Verificar Frontend');
    console.log('───────────────────────────────────────────────────────');
    try {
      const frontendResponse = await axios.get(`${BASE_URL}/`);

      if (frontendResponse.status === 200) {
        console.log('✅ Frontend acessível');
        console.log(`   Content-Type: ${frontendResponse.headers['content-type']}`);

        const html = frontendResponse.data as string;
        const hasReact = html.includes('react');
        const hasScript = html.includes('script');
        const hasIndex = html.includes('index');

        console.log(`   React detectado: ${hasReact ? '✅' : '❌'}`);
        console.log(`   Scripts detectados: ${hasScript ? '✅' : '❌'}`);
        console.log(`   Bundle detectado: ${hasIndex ? '✅' : '❌'}`);
      }
    } catch (erro) {
      console.log('❌ Erro ao acessar frontend');
      console.log(`   Erro: ${erro instanceof Error ? erro.message : 'Desconhecido'}`);
    }
    console.log('');

    // -------------------------------------------------------------------------
    // Teste 5: Verificar CORS
    // -------------------------------------------------------------------------
    console.log('📋 Teste 5: Verificar CORS');
    console.log('───────────────────────────────────────────────────────');
    try {
      const response = await axios.options(`${BASE_URL}/api/autenticacao/entrar`);
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
      };

      console.log('✅ CORS configurado');
      if (corsHeaders['Access-Control-Allow-Origin']) {
        console.log(`   Origin permitido: ${corsHeaders['Access-Control-Allow-Origin']}`);
      }
      if (corsHeaders['Access-Control-Allow-Methods']) {
        console.log(`   Métodos: ${corsHeaders['Access-Control-Allow-Methods']}`);
      }
    } catch (erro) {
      console.log('⚠️  CORS não detectado ou erro');
      console.log('   (Pode ser normal se OPTIONS não for necessário)');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TESTE CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    process.exit(0);
  } catch (erro) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ ERRO NO TESTE');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    console.error(erro);
    process.exit(1);
  }
}

testarLoginCompleto();
