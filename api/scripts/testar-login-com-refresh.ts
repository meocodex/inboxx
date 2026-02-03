#!/usr/bin/env tsx

import { chromium } from 'playwright';

const URL_BASE = 'https://2026-crm.crylab.easypanel.host';

async function testarLoginComRefresh() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE LOGIN + REFRESH (Simulando uso real)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🌐 URL: ${URL_BASE}`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs do console
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('[AUTH]') || text.includes('401')) {
      console.log(`   📋 Console: ${text}`);
    }
  });

  // Capturar requisições de rede
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    if (url.includes('/api/')) {
      console.log(`   🌐 ${response.request().method()} ${url.split('/api')[1]} → ${status}`);
      if (status === 401) {
        console.log('   ⚠️  ERRO 401 DETECTADO!');
      }
    }
  });

  try {
    // =========================================================================
    // PASSO 1: Login
    // =========================================================================
    console.log('📋 PASSO 1: Fazer login');
    console.log('───────────────────────────────────────────────────────');

    await page.goto(`${URL_BASE}/entrar`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'Admin@123');

    const [loginResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/autenticacao/entrar')),
      page.click('button[type="submit"]'),
    ]);

    if (loginResponse.status() !== 200) {
      throw new Error(`Login falhou: ${loginResponse.status()}`);
    }

    console.log('✅ Login API: 200 OK');

    // Aguardar navegação
    await page.waitForURL(`${URL_BASE}/`, { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(2000);

    const urlAposLogin = page.url();
    console.log(`   URL após login: ${urlAposLogin}`);

    if (urlAposLogin.includes('/entrar')) {
      console.log('❌ PROBLEMA: Não redirecionou para dashboard!');

      // Debug
      const storage = await page.evaluate(() => ({
        token: !!sessionStorage.getItem('crm_access_token'),
        zustand: localStorage.getItem('crm-auth-storage'),
      }));
      console.log('   SessionStorage token:', storage.token);
      console.log('   LocalStorage zustand:', storage.zustand ? 'presente' : 'ausente');

      throw new Error('Redirect falhou');
    }

    console.log('✅ Redirecionado para dashboard');

    // Capturar estado antes do refresh
    const estadoAntes = await page.evaluate(() => ({
      token: sessionStorage.getItem('crm_access_token'),
      zustand: localStorage.getItem('crm-auth-storage'),
    }));

    console.log('');
    console.log('📋 ESTADO ANTES DO REFRESH:');
    console.log(`   Token: ${estadoAntes.token ? estadoAntes.token.substring(0, 30) + '...' : 'AUSENTE'}`);
    console.log(`   Zustand: ${estadoAntes.zustand ? 'presente' : 'AUSENTE'}`);

    // =========================================================================
    // PASSO 2: REFRESH da página
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 2: REFRESH da página (F5)');
    console.log('───────────────────────────────────────────────────────');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const urlAposRefresh = page.url();
    console.log(`   URL após refresh: ${urlAposRefresh}`);

    // Capturar estado após refresh
    const estadoDepois = await page.evaluate(() => ({
      token: sessionStorage.getItem('crm_access_token'),
      zustand: localStorage.getItem('crm-auth-storage'),
    }));

    console.log('');
    console.log('📋 ESTADO APÓS REFRESH:');
    console.log(`   Token: ${estadoDepois.token ? estadoDepois.token.substring(0, 30) + '...' : 'AUSENTE ❌'}`);
    console.log(`   Zustand: ${estadoDepois.zustand ? 'presente' : 'AUSENTE ❌'}`);

    if (urlAposRefresh.includes('/entrar')) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ PROBLEMA CONFIRMADO: Refresh causa logout!');
      console.log('═══════════════════════════════════════════════════════');

      // Analisar o que aconteceu
      if (!estadoDepois.token) {
        console.log('');
        console.log('🔍 CAUSA: Token foi removido do sessionStorage após refresh');
        console.log('   Isso é normal - sessionStorage NÃO persiste entre refreshes em alguns casos');
      }

      if (!estadoDepois.zustand) {
        console.log('');
        console.log('🔍 CAUSA: Zustand storage foi limpo');
      }

      await page.screenshot({ path: '/tmp/refresh-problema.png' });
      console.log('   Screenshot: /tmp/refresh-problema.png');

    } else {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ REFRESH OK: Usuário continua logado!');
      console.log('═══════════════════════════════════════════════════════');

      // Verificar menu lateral
      const menuExiste = await page.locator('nav, aside, [class*="sidebar"]').count();
      console.log(`   Menu lateral: ${menuExiste > 0 ? '✅' : '❌'}`);
    }

    // =========================================================================
    // PASSO 3: Navegar para outra página
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 3: Navegar para /conversas');
    console.log('───────────────────────────────────────────────────────');

    if (!urlAposRefresh.includes('/entrar')) {
      await page.goto(`${URL_BASE}/conversas`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const urlConversas = page.url();
      console.log(`   URL: ${urlConversas}`);

      if (urlConversas.includes('/entrar')) {
        console.log('❌ PROBLEMA: Navegação para /conversas redirecionou para login!');
      } else {
        console.log('✅ Navegação OK');
      }
    }

  } catch (erro) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ ERRO NO TESTE');
    console.log('═══════════════════════════════════════════════════════');
    console.error(erro);

    await page.screenshot({ path: '/tmp/erro-teste.png' });

  } finally {
    await browser.close();
  }
}

testarLoginComRefresh();
