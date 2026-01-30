import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { criarAppTeste } from '../../../testes/helpers/criar-app-teste.js';
import type { FastifyInstance } from 'fastify';

// =============================================================================
// Teste Simulado de Login (com mock do serviço)
// =============================================================================

describe('Teste Simulado - Login com admin@admin.com', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await criarAppTeste();

    // Mock do serviço de autenticação
    const mockResultadoLogin = {
      usuario: {
        id: 'user-123',
        nome: 'Admin',
        email: 'admin@admin.com',
        clienteId: 'client-123',
        perfil: {
          id: 'perfil-super-admin',
          nome: 'SUPER_ADMIN',
          permissoes: ['*'],
        },
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImNsaWVudGVJZCI6ImNsaWVudC0xMjMiLCJwZXJmaWxJZCI6InBlcmZpbC1zdXBlci1hZG1pbiIsImlhdCI6MTcwNjU1MzYwMCwiZXhwIjoxNzA2NjQwMDAwfQ.fake_signature',
      refreshToken: 'refresh_token_fake_1234567890abcdef',
    };

    // Registrar rota de login mockada
    app.post('/api/autenticacao/entrar', async (request, reply) => {
      const { email, senha } = request.body as { email: string; senha: string };

      // Validar campos
      if (!email || !senha) {
        return reply.status(400).send({
          erro: 'Dados inválidos',
        });
      }

      // Validar formato de email
      if (!email.includes('@')) {
        return reply.status(400).send({
          erro: 'Email inválido',
        });
      }

      // Simular autenticação
      if (email === 'admin@admin.com' && senha === 'admin123') {
        console.log('✅ Login bem-sucedido:', email);
        return reply.status(200).send({
          usuario: mockResultadoLogin.usuario,
          token: mockResultadoLogin.accessToken,
          refreshToken: mockResultadoLogin.refreshToken,
        });
      }

      // Credenciais inválidas
      console.log('❌ Credenciais inválidas:', email);
      return reply.status(401).send({
        erro: 'Credenciais invalidas',
      });
    });

    // Registrar rota de perfil mockada
    app.get('/api/autenticacao/perfil', async (request, reply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ erro: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);

      // Aceitar o token mockado
      if (token === mockResultadoLogin.accessToken) {
        return reply.status(200).send({
          id: mockResultadoLogin.usuario.id,
          nome: mockResultadoLogin.usuario.nome,
          email: mockResultadoLogin.usuario.email,
        });
      }

      return reply.status(401).send({ erro: 'Token inválido' });
    });

    await app.ready();
    console.log('🚀 Servidor de teste pronto');
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve fazer login com sucesso usando admin@admin.com / admin123', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'admin@admin.com',
        senha: 'admin123',
      },
    });

    // Validar status code
    expect(response.statusCode).toBe(200);

    // Parsear resposta
    const body = JSON.parse(response.body);

    // Validar estrutura da resposta
    expect(body).toHaveProperty('usuario');
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('refreshToken');

    // Validar dados do usuário
    expect(body.usuario).toHaveProperty('id');
    expect(body.usuario).toHaveProperty('nome');
    expect(body.usuario).toHaveProperty('email');
    expect(body.usuario.email).toBe('admin@admin.com');
    expect(body.usuario.nome).toBe('Admin');

    // Validar tokens
    expect(body.token).toBeTruthy();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(50); // JWT deve ser longo

    expect(body.refreshToken).toBeTruthy();
    expect(typeof body.refreshToken).toBe('string');

    // Validar que não retorna senha
    expect(body.usuario).not.toHaveProperty('senha');
    expect(body.usuario).not.toHaveProperty('senhaHash');

    console.log('\n✅ Login simulado bem-sucedido!');
    console.log('👤 Usuário:', body.usuario.nome);
    console.log('📧 Email:', body.usuario.email);
    console.log('🔑 Token:', body.token.substring(0, 50) + '...');
    console.log('🔄 Refresh Token:', body.refreshToken.substring(0, 50) + '...');
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'admin@admin.com',
        senha: 'senhaErrada123',
      },
    });

    // Deve retornar 401 Unauthorized
    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');
    expect(body.erro.toLowerCase()).toMatch(/credenciais inv[aá]lidas/);

    console.log('\n✅ Senha incorreta rejeitada corretamente');
    console.log('🚫 Erro:', body.erro);
  });

  it('deve rejeitar login com email inexistente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'usuario@naoexiste.com',
        senha: 'qualquerSenha',
      },
    });

    // Deve retornar 401 Unauthorized (não revela se email existe ou não)
    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');
    expect(body.erro.toLowerCase()).toMatch(/credenciais inv[aá]lidas/);

    console.log('\n✅ Email inexistente rejeitado corretamente');
    console.log('🚫 Erro:', body.erro);
  });

  it('deve validar campos obrigatórios', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'admin@admin.com',
        // Senha ausente
      },
    });

    // Deve retornar 400 Bad Request
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');

    console.log('\n✅ Validação de campos obrigatórios funcionando');
    console.log('🚫 Erro:', body.erro);
  });

  it('deve validar formato de email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'email-invalido',
        senha: 'admin123',
      },
    });

    // Deve retornar 400 Bad Request
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');

    console.log('\n✅ Validação de formato de email funcionando');
    console.log('🚫 Erro:', body.erro);
  });

  it('deve usar o token para acessar endpoint protegido', async () => {
    // 1. Fazer login
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/autenticacao/entrar',
      payload: {
        email: 'admin@admin.com',
        senha: 'admin123',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const { token } = JSON.parse(loginResponse.body);

    // 2. Usar token para acessar endpoint protegido
    const perfilResponse = await app.inject({
      method: 'GET',
      url: '/api/autenticacao/perfil',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    // Deve retornar 200 OK
    expect(perfilResponse.statusCode).toBe(200);

    const perfil = JSON.parse(perfilResponse.body);
    expect(perfil).toHaveProperty('id');
    expect(perfil).toHaveProperty('email');
    expect(perfil.email).toBe('admin@admin.com');

    console.log('\n✅ Token JWT funcionando em endpoint protegido');
    console.log('👤 Perfil acessado:', perfil.nome);
  });

  it('deve rejeitar token inválido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/autenticacao/perfil',
      headers: {
        authorization: 'Bearer token-invalido-xyz123',
      },
    });

    // Deve retornar 401 Unauthorized
    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');

    console.log('\n✅ Token inválido rejeitado corretamente');
    console.log('🚫 Erro:', body.erro);
  });

  it('deve rejeitar acesso sem token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/autenticacao/perfil',
      // Sem header authorization
    });

    // Deve retornar 401 Unauthorized
    expect(response.statusCode).toBe(401);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('erro');

    console.log('\n✅ Acesso sem token rejeitado corretamente');
    console.log('🚫 Erro:', body.erro);
  });
});
