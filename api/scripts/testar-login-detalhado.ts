#!/usr/bin/env tsx

import { chromium } from 'playwright';

const URL_BASE = 'https://2026-crm.crylab.easypanel.host';

async function testarLoginDetalhado() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE DETALHADO DE LOGIN');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 URL: ${URL_BASE}`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar TODOS os logs do console
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`   🔴 ERROR: ${text}`);
    } else if (type === 'warn') {
      console.log(`   🟡 WARN: ${text}`);
    } else if (text.includes('[AUTH]') || text.includes('401') || text.includes('500')) {
      console.log(`   📋 LOG: ${text}`);
    }
  });

  // Capturar erros de página
  page.on('pageerror', (error) => {
    console.log(`   🔴 PAGE ERROR: ${error.message}`);
  });

  // Capturar requisições com erro
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();

    if (url.includes('/api/')) {
      const path = url.split('/api')[1];
      if (status >= 400) {
        console.log(`   🔴 API ERROR: ${response.request().method()} /api${path} → ${status}`);
        try {
          const body = await response.text();
          console.log(`      Response: ${body.substring(0, 200)}`);
        } catch {}
      } else {
        console.log(`   ✅ API OK: ${response.request().method()} /api${path} → ${status}`);
      }
    }
  });

  try {
    // =========================================================================
    // PASSO 1: Limpar storage e acessar login
    // =========================================================================
    console.log('📋 PASSO 1: Acessar página de login');
    console.log('───────────────────────────────────────────────────────');

    await page.goto(`${URL_BASE}/entrar`, { waitUntil: 'networkidle' });

    // Limpar storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('   Storage limpo');

    await page.reload({ waitUntil: 'networkidle' });
    console.log('   Página recarregada');

    // =========================================================================
    // PASSO 2: Preencher e submeter formulário
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 2: Fazer login');
    console.log('───────────────────────────────────────────────────────');

    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'Admin@123');
    console.log('   Credenciais preenchidas');

    // Aguardar resposta do login
    const [loginResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/autenticacao/entrar'), { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    const loginStatus = loginResponse.status();
    const loginBody = await loginResponse.json();

    console.log(`   Login Response: ${loginStatus}`);
    if (loginStatus === 200 && loginBody.sucesso) {
      console.log(`   ✅ Usuário: ${loginBody.dados.usuario.nome}`);
      console.log(`   ✅ Token: ${loginBody.dados.accessToken.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Erro: ${JSON.stringify(loginBody)}`);
    }

    // Aguardar processamento
    await page.waitForTimeout(3000);

    // =========================================================================
    // PASSO 3: Verificar estado após login
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 3: Verificar estado após login');
    console.log('───────────────────────────────────────────────────────');

    const urlAtual = page.url();
    console.log(`   URL: ${urlAtual}`);

    const storage = await page.evaluate(() => {
      return {
        localStorage: {
          token: localStorage.getItem('crm_access_token'),
          refresh: localStorage.getItem('crm_refresh_token'),
          zustand: localStorage.getItem('crm-auth-storage'),
        },
        sessionStorage: {
          token: sessionStorage.getItem('crm_access_token'),
          refresh: sessionStorage.getItem('crm_refresh_token'),
        },
      };
    });

    console.log('');
    console.log('   📦 LocalStorage:');
    console.log(`      crm_access_token: ${storage.localStorage.token ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`      crm_refresh_token: ${storage.localStorage.refresh ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`      crm-auth-storage: ${storage.localStorage.zustand ? '✅ Presente' : '❌ Ausente'}`);

    console.log('');
    console.log('   📦 SessionStorage:');
    console.log(`      crm_access_token: ${storage.sessionStorage.token ? '✅ Presente' : '❌ Ausente'}`);
    console.log(`      crm_refresh_token: ${storage.sessionStorage.refresh ? '✅ Presente' : '❌ Ausente'}`);

    if (storage.localStorage.zustand) {
      try {
        const zustand = JSON.parse(storage.localStorage.zustand);
        console.log(`      Zustand usuario: ${zustand.state?.usuario?.nome || '❌ Ausente'}`);
      } catch {}
    }

    // =========================================================================
    // PASSO 4: Verificar se está no dashboard ou no login
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 4: Verificar página atual');
    console.log('───────────────────────────────────────────────────────');

    if (urlAtual.includes('/entrar')) {
      console.log('   ❌ PROBLEMA: Ainda está na página de login!');

      // Capturar screenshot
      await page.screenshot({ path: '/tmp/login-erro.png', fullPage: true });
      console.log('   📷 Screenshot: /tmp/login-erro.png');

      // Verificar mensagem de erro na tela
      const erroNaTela = await page.locator('[class*="destructive"], [class*="error"], .text-red').textContent().catch(() => null);
      if (erroNaTela) {
        console.log(`   ❌ Erro na tela: ${erroNaTela}`);
      }

    } else {
      console.log('   ✅ Redirecionado para dashboard!');

      // Verificar elementos do dashboard
      await page.waitForTimeout(2000);

      const temMenu = await page.locator('nav, aside').count();
      console.log(`   Menu lateral: ${temMenu > 0 ? '✅' : '❌'}`);

      await page.screenshot({ path: '/tmp/dashboard-ok.png', fullPage: true });
      console.log('   📷 Screenshot: /tmp/dashboard-ok.png');
    }

    // =========================================================================
    // PASSO 5: Testar refresh
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 5: Testar REFRESH (F5)');
    console.log('───────────────────────────────────────────────────────');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const urlAposRefresh = page.url();
    console.log(`   URL após refresh: ${urlAposRefresh}`);

    if (urlAposRefresh.includes('/entrar')) {
      console.log('   ❌ PROBLEMA: Refresh causou logout!');
    } else {
      console.log('   ✅ Continua logado após refresh');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('TESTE CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════════');

  } catch (erro) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ ERRO NO TESTE');
    console.log('═══════════════════════════════════════════════════════');
    console.error(erro);

    await page.screenshot({ path: '/tmp/erro-teste.png', fullPage: true });
    console.log('📷 Screenshot: /tmp/erro-teste.png');

  } finally {
    await browser.close();
  }
}

testarLoginDetalhado();
