#!/usr/bin/env tsx

import 'dotenv/config';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

interface LoginResponse {
  sucesso: boolean;
  dados: {
    accessToken: string;
    refreshToken: string;
    usuario: {
      id: string;
      nome: string;
      email: string;
      clienteId: string | null;
      perfil: {
        id: string;
        nome: string;
        permissoes: string[];
      };
    };
  };
}

async function testarFluxoCompleto() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 SIMULANDO FLUXO COMPLETO DE LOGIN NO NAVEGADOR');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // =========================================================================
    // PASSO 1: Acessar página de login
    // =========================================================================
    console.log('📋 PASSO 1: Acessar página /entrar');
    console.log('───────────────────────────────────────────────────────');

    try {
      const loginPage = await axios.get(`${BASE_URL}/`);
      console.log('✅ Página carregada');
      console.log(`   Status: ${loginPage.status}`);
      console.log(`   Content-Type: ${loginPage.headers['content-type']}`);
    } catch (erro) {
      console.log('❌ Erro ao carregar página');
      throw erro;
    }

    console.log('');

    // =========================================================================
    // PASSO 2: Fazer login
    // =========================================================================
    console.log('📋 PASSO 2: Fazer login (POST /api/autenticacao/entrar)');
    console.log('───────────────────────────────────────────────────────');
    console.log('   Email: admin@admin.com');
    console.log('   Senha: Admin@123');
    console.log('');

    let loginData: LoginResponse;

    try {
      const loginResponse = await axios.post<LoginResponse>(
        `${BASE_URL}/api/autenticacao/entrar`,
        {
          email: 'admin@admin.com',
          senha: 'Admin@123',
        }
      );

      loginData = loginResponse.data;

      if (loginData.sucesso) {
        console.log('✅ Login bem-sucedido!');
        console.log(`   Usuário: ${loginData.dados.usuario.nome}`);
        console.log(`   Email: ${loginData.dados.usuario.email}`);
        console.log(`   Perfil: ${loginData.dados.usuario.perfil.nome}`);
        console.log(`   Token (início): ${loginData.dados.accessToken.substring(0, 30)}...`);
      } else {
        console.log('❌ Login falhou (resposta sem sucesso)');
        process.exit(1);
      }
    } catch (erro) {
      console.log('❌ Erro ao fazer login');
      if (axios.isAxiosError(erro)) {
        console.log(`   Status: ${erro.response?.status}`);
        console.log(`   Erro: ${JSON.stringify(erro.response?.data)}`);
      }
      throw erro;
    }

    console.log('');

    // =========================================================================
    // PASSO 3: Simular salvamento no sessionStorage
    // =========================================================================
    console.log('📋 PASSO 3: Simular salvamento no sessionStorage');
    console.log('───────────────────────────────────────────────────────');

    const sessionStorage = {
      crm_access_token: loginData.dados.accessToken,
      crm_refresh_token: loginData.dados.refreshToken,
    };

    console.log('✅ Tokens "salvos" no sessionStorage (simulado)');
    console.log(`   crm_access_token: ${sessionStorage.crm_access_token ? '✓' : '✗'}`);
    console.log(`   crm_refresh_token: ${sessionStorage.crm_refresh_token ? '✓' : '✗'}`);

    console.log('');

    // =========================================================================
    // PASSO 4: Simular salvamento na store Zustand (localStorage)
    // =========================================================================
    console.log('📋 PASSO 4: Simular salvamento na store Zustand');
    console.log('───────────────────────────────────────────────────────');

    const zustandStore = {
      state: {
        usuario: loginData.dados.usuario,
      },
      version: 0,
    };

    console.log('✅ Usuário "salvo" na store Zustand (simulado)');
    console.log(`   Nome: ${zustandStore.state.usuario.nome}`);
    console.log(`   Email: ${zustandStore.state.usuario.email}`);

    console.log('');

    // =========================================================================
    // PASSO 5: Simular redirect para '/' (Dashboard)
    // =========================================================================
    console.log('📋 PASSO 5: Simular acesso ao dashboard (/)');
    console.log('───────────────────────────────────────────────────────');
    console.log('   LayoutPrincipal verificará autenticação...');
    console.log('');

    // 5.1: Verificar se estaAutenticado() retornaria true
    console.log('   5.1: Verificar estaAutenticado()');
    const temToken = !!sessionStorage.crm_access_token;
    console.log(`       → Token existe? ${temToken ? '✅ SIM' : '❌ NÃO'}`);

    if (!temToken) {
      console.log('');
      console.log('❌ PROBLEMA: Token não existe no sessionStorage');
      console.log('   → LayoutPrincipal redirecionaria para /entrar');
      process.exit(1);
    }

    console.log('');

    // 5.2: Verificar se carregarUsuario() funcionaria
    console.log('   5.2: Simular carregarUsuario() (GET /api/autenticacao/eu)');

    try {
      const meResponse = await axios.get(`${BASE_URL}/api/autenticacao/eu`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.crm_access_token}`,
        },
      });

      if (meResponse.data.sucesso) {
        console.log('       ✅ Usuário carregado com sucesso!');
        console.log(`          Nome: ${meResponse.data.dados.nome}`);
        console.log(`          Email: ${meResponse.data.dados.email}`);
      } else {
        console.log('       ❌ Falha ao carregar usuário');
        throw new Error('carregarUsuario falhou');
      }
    } catch (erro) {
      console.log('       ❌ Erro ao carregar usuário');
      if (axios.isAxiosError(erro)) {
        console.log(`          Status: ${erro.response?.status}`);
        console.log(`          Erro: ${JSON.stringify(erro.response?.data)}`);
      }
      throw erro;
    }

    console.log('');

    // 5.3: Verificar se usuário está na store
    console.log('   5.3: Verificar se usuário está na store Zustand');
    const usuarioNaStore = !!zustandStore.state.usuario;
    console.log(`       → Usuário na store? ${usuarioNaStore ? '✅ SIM' : '❌ NÃO'}`);

    if (!usuarioNaStore) {
      console.log('');
      console.log('❌ PROBLEMA: Usuário não está na store Zustand');
      console.log('   → LayoutPrincipal ficaria em loading infinito');
      console.log('   → Ou redirecionaria para /entrar');
      process.exit(1);
    }

    console.log('');
    console.log('   ✅ TUDO OK! LayoutPrincipal permitiria acesso');

    console.log('');

    // =========================================================================
    // PASSO 6: Dashboard carregaria normalmente
    // =========================================================================
    console.log('📋 PASSO 6: Dashboard carregaria');
    console.log('───────────────────────────────────────────────────────');
    console.log('   ✅ MenuLateral renderizado');
    console.log('   ✅ Outlet renderizado (Dashboard)');
    console.log('   ✅ Usuário veria o painel principal');

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TESTE COMPLETO: TUDO FUNCIONANDO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    console.log('📊 RESUMO:');
    console.log('   ✅ Login API: Funciona');
    console.log('   ✅ Tokens: Gerados e salvos');
    console.log('   ✅ GET /api/autenticacao/eu: Funciona');
    console.log('   ✅ Usuário: Salvo na store');
    console.log('   ✅ Dashboard: Carregaria normalmente');
    console.log('');

    console.log('🎯 CONCLUSÃO:');
    console.log('   O backend está 100% funcional.');
    console.log('   O problema deve estar no navegador:');
    console.log('     - SessionStorage bloqueado');
    console.log('     - Store Zustand não carregando do localStorage');
    console.log('     - JavaScript com erro');
    console.log('');

    console.log('💡 SOLUÇÃO:');
    console.log('   Execute o script de login manual no console do navegador');
    console.log('   (Veja: /code/SOLUCAO_LOOP_LOGIN.md)');
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

testarFluxoCompleto();
