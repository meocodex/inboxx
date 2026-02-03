#!/usr/bin/env tsx

import { chromium } from 'playwright';

const URL_BASE = 'https://2026-crm.crylab.easypanel.host';

async function testarLoginBrowser() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE LOGIN NO NAVEGADOR (Playwright)');
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
    const type = msg.type();
    if (type === 'error') {
      console.log(`   🔴 Console Error: ${msg.text()}`);
    } else if (msg.text().includes('[AUTH]')) {
      console.log(`   📋 ${msg.text()}`);
    }
  });

  // Capturar requisições de rede
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/autenticacao')) {
      console.log(`   🌐 ${response.request().method()} ${url} → ${response.status()}`);
    }
  });

  try {
    // =========================================================================
    // PASSO 1: Acessar página de login
    // =========================================================================
    console.log('📋 PASSO 1: Acessar página de login');
    console.log('───────────────────────────────────────────────────────');

    await page.goto(`${URL_BASE}/entrar`, { waitUntil: 'networkidle' });

    const titulo = await page.title();
    console.log(`✅ Página carregada: ${titulo}`);

    // Verificar se o formulário existe
    const formExists = await page.locator('form').count();
    console.log(`✅ Formulário encontrado: ${formExists > 0 ? 'SIM' : 'NÃO'}`);

    console.log('');

    // =========================================================================
    // PASSO 2: Preencher credenciais
    // =========================================================================
    console.log('📋 PASSO 2: Preencher credenciais');
    console.log('───────────────────────────────────────────────────────');

    await page.fill('input[type="email"]', 'admin@admin.com');
    console.log('✅ Email preenchido: admin@admin.com');

    await page.fill('input[type="password"]', 'Admin@123');
    console.log('✅ Senha preenchida: Admin@123');

    console.log('');

    // =========================================================================
    // PASSO 3: Clicar em Entrar
    // =========================================================================
    console.log('📋 PASSO 3: Clicar em Entrar');
    console.log('───────────────────────────────────────────────────────');

    // Aguardar resposta da API de login
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/autenticacao/entrar'),
        { timeout: 15000 }
      ),
      page.click('button[type="submit"]'),
    ]);

    const status = response.status();
    const body = await response.json();

    if (status === 200 && body.sucesso) {
      console.log('✅ Login API: Sucesso!');
      console.log(`   Usuário: ${body.dados.usuario.nome}`);
      console.log(`   Token: ${body.dados.accessToken.substring(0, 30)}...`);
    } else {
      console.log(`❌ Login API falhou: ${status}`);
      console.log(`   Erro: ${JSON.stringify(body)}`);
      throw new Error('Login API falhou');
    }

    console.log('');

    // =========================================================================
    // PASSO 4: Aguardar redirecionamento
    // =========================================================================
    console.log('📋 PASSO 4: Aguardar redirecionamento para dashboard');
    console.log('───────────────────────────────────────────────────────');

    // Aguardar até 10 segundos para a URL mudar
    await page.waitForURL(`${URL_BASE}/`, { timeout: 10000 }).catch(() => null);

    const urlAtual = page.url();
    console.log(`   URL atual: ${urlAtual}`);

    if (urlAtual.includes('/entrar')) {
      console.log('❌ PROBLEMA: Ainda está na página de login!');

      // Capturar screenshot para debug
      await page.screenshot({ path: '/tmp/login-erro.png' });
      console.log('   Screenshot salvo: /tmp/login-erro.png');

      // Verificar storage
      const sessionStorage = await page.evaluate(() => {
        return {
          accessToken: sessionStorage.getItem('crm_access_token'),
          refreshToken: sessionStorage.getItem('crm_refresh_token'),
        };
      });

      const localStorage = await page.evaluate(() => {
        return localStorage.getItem('crm-auth-storage');
      });

      console.log('');
      console.log('🔍 DIAGNÓSTICO:');
      console.log(`   SessionStorage access_token: ${sessionStorage.accessToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   SessionStorage refresh_token: ${sessionStorage.refreshToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   LocalStorage crm-auth-storage: ${localStorage ? '✅ Presente' : '❌ Ausente'}`);

      if (localStorage) {
        const parsed = JSON.parse(localStorage);
        console.log(`   Zustand usuario: ${parsed.state?.usuario?.nome || '❌ Ausente'}`);
      }

      throw new Error('Redirecionamento falhou - voltou para /entrar');
    }

    console.log('✅ Redirecionado para dashboard!');

    // =========================================================================
    // PASSO 5: Verificar dashboard carregou
    // =========================================================================
    console.log('');
    console.log('📋 PASSO 5: Verificar dashboard');
    console.log('───────────────────────────────────────────────────────');

    // Aguardar conteúdo carregar
    await page.waitForTimeout(2000);

    // Verificar se o menu lateral existe
    const menuLateral = await page.locator('nav, aside, [class*="menu"], [class*="sidebar"]').count();
    console.log(`   Menu lateral: ${menuLateral > 0 ? '✅ Presente' : '❌ Ausente'}`);

    // Verificar storage final
    const finalStorage = await page.evaluate(() => {
      return {
        accessToken: !!sessionStorage.getItem('crm_access_token'),
        refreshToken: !!sessionStorage.getItem('crm_refresh_token'),
        zustand: localStorage.getItem('crm-auth-storage'),
      };
    });

    console.log(`   Token no sessionStorage: ${finalStorage.accessToken ? '✅' : '❌'}`);
    console.log(`   Refresh no sessionStorage: ${finalStorage.refreshToken ? '✅' : '❌'}`);

    if (finalStorage.zustand) {
      const parsed = JSON.parse(finalStorage.zustand);
      console.log(`   Usuário no Zustand: ${parsed.state?.usuario?.nome || '❌'}`);
    }

    // Capturar screenshot do dashboard
    await page.screenshot({ path: '/tmp/dashboard.png' });
    console.log('   Screenshot salvo: /tmp/dashboard.png');

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TESTE COMPLETO: LOGIN FUNCIONANDO!');
    console.log('═══════════════════════════════════════════════════════');

  } catch (erro) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ ERRO NO TESTE');
    console.log('═══════════════════════════════════════════════════════');
    console.error(erro);

    // Capturar estado final
    const urlFinal = page.url();
    console.log(`   URL final: ${urlFinal}`);

    await page.screenshot({ path: '/tmp/login-erro-final.png' });
    console.log('   Screenshot salvo: /tmp/login-erro-final.png');

  } finally {
    await browser.close();
  }
}

testarLoginBrowser();
