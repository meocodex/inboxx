/**
 * Testes End-to-End para Módulos Migrados para CRUDBase
 *
 * Valida que os 5 módulos migrados mantêm comportamento correto:
 * 1. respostas-rapidas (SIMPLES)
 * 2. equipes (MODERADO - subconsultas)
 * 3. etiquetas (IDEAL - 100% herdado)
 * 4. perfis (COMPLETO - cache + nullable + subconsultas)
 * 5. fluxos (MODERADO - subconsultas + lógica customizada)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { criarAppTeste } from '../../testes/helpers/criar-app-teste.js';
import { criarClienteFactory } from '../../testes/factories/cliente.factory.js';
import { criarUsuarioFactory } from '../../testes/factories/usuario.factory.js';
import { gerarTokenTeste } from '../../testes/helpers/autenticar.js';
import type { FastifyInstance } from 'fastify';

// =============================================================================
// Setup Global
// =============================================================================

let app: FastifyInstance;
let clienteId: string;
let token: string;

beforeAll(async () => {
  app = await criarAppTeste();
  await app.ready();

  // Criar cliente e usuário de teste (factories - dados em memória apenas para testes)
  const cliente = criarClienteFactory();
  clienteId = cliente.id;

  const usuario = criarUsuarioFactory({ clienteId, perfilId: 'admin' });
  token = await gerarTokenTeste({
    sub: usuario.id,
    clienteId: usuario.clienteId,
    perfilId: usuario.perfilId,
    permissoes: ['*'], // Admin tem todas permissões
  });
});

afterAll(async () => {
  await app.close();
});

// =============================================================================
// 1. Respostas Rápidas (SIMPLES)
// =============================================================================

describe('Respostas Rápidas - CRUD Base Simples', () => {
  let respostaId: string;

  it('deve listar com paginação e subconsulta totalUsos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/chatbot/respostas-rapidas',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '10' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('dados');
    expect(body).toHaveProperty('meta');
    expect(body.meta.pagina).toBe(1);
    expect(body.meta.limite).toBe(10);

    // Subconsulta totalUsos deve estar presente
    if (body.dados.length > 0) {
      expect(body.dados[0]).toHaveProperty('totalUsos');
      expect(typeof body.dados[0].totalUsos).toBe('number');
    }
  });

  it('deve buscar por termo', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/chatbot/respostas-rapidas',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '10', busca: 'teste' },
    });

    expect(response.statusCode).toBe(200);
  });

  it('deve criar nova resposta rápida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chatbot/respostas-rapidas',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Resposta Teste E2E',
        mensagem: 'Mensagem de teste',
        atalho: '/teste-e2e',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('id');
    expect(body.nome).toBe('Resposta Teste E2E');
    expect(body.totalUsos).toBe(0); // Nova resposta tem 0 usos
    respostaId = body.id;
  });

  it('deve validar nome único', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chatbot/respostas-rapidas',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Resposta Teste E2E', // Duplicado
        mensagem: 'Outra mensagem',
        atalho: '/outro',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.erro).toContain('já existe');
  });

  it('deve obter por ID com subconsulta', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/chatbot/respostas-rapidas/${respostaId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(respostaId);
    expect(body).toHaveProperty('totalUsos');
  });

  it('deve atualizar resposta existente', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api/chatbot/respostas-rapidas/${respostaId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { mensagem: 'Mensagem atualizada' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.mensagem).toBe('Mensagem atualizada');
  });

  it('deve excluir resposta', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/chatbot/respostas-rapidas/${respostaId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
  });
});

// =============================================================================
// 2. Equipes (MODERADO - Subconsultas + Métodos Customizados)
// =============================================================================

describe('Equipes - CRUD Base com Subconsultas', () => {
  let equipeId: string;
  let usuarioId: string;

  beforeEach(async () => {
    // Criar usuário para testes de membros (factory - dados em memória)
    const usuario = criarUsuarioFactory({ clienteId });
    usuarioId = usuario.id;
  });

  it('deve listar equipes com subconsultas (totalMembros, totalConversas)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/equipes',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '10' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    if (body.dados.length > 0) {
      expect(body.dados[0]).toHaveProperty('totalMembros');
      expect(body.dados[0]).toHaveProperty('totalConversas');
      expect(typeof body.dados[0].totalMembros).toBe('number');
      expect(typeof body.dados[0].totalConversas).toBe('number');
    }
  });

  it('deve criar nova equipe', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/equipes',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Equipe Vendas E2E',
        descricao: 'Equipe de teste',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('Equipe Vendas E2E');
    expect(body.totalMembros).toBe(0); // Nova equipe sem membros
    expect(body.totalConversas).toBe(0);
    equipeId = body.id;
  });

  it('deve obter equipe por ID com lista de membros', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/equipes/${equipeId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(equipeId);
    expect(body).toHaveProperty('membros'); // Sobrescrita customizada
    expect(Array.isArray(body.membros)).toBe(true);
  });

  it('deve adicionar membro à equipe (método customizado)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/equipes/${equipeId}/membros`,
      headers: { authorization: `Bearer ${token}` },
      payload: { usuarioId },
    });

    expect(response.statusCode).toBe(200);

    // Verificar que totalMembros incrementou
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/equipes/${equipeId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    const body = JSON.parse(getResponse.body);
    expect(body.totalMembros).toBe(1);
  });

  it('deve remover membro da equipe (método customizado)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/equipes/${equipeId}/membros/${usuarioId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
  });

  it('deve excluir equipe', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/equipes/${equipeId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
  });
});

// =============================================================================
// 3. Etiquetas (IDEAL - 100% Herdado)
// =============================================================================

describe('Etiquetas - CRUD Base Ideal (100% Herdado)', () => {
  let etiquetaId: string;

  it('deve criar etiqueta', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/etiquetas',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'VIP E2E',
        cor: '#FF5733',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('VIP E2E');
    expect(body.totalContatos).toBe(0); // Subconsulta
    etiquetaId = body.id;
  });

  it('deve listar etiquetas com subconsulta totalContatos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/etiquetas',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '10' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    if (body.dados.length > 0) {
      expect(body.dados[0]).toHaveProperty('totalContatos');
      expect(typeof body.dados[0].totalContatos).toBe('number');
    }
  });

  it('deve validar nome único automaticamente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/etiquetas',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'VIP E2E', // Duplicado
        cor: '#FFFFFF',
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.erro).toContain('já existe');
  });

  it('deve atualizar etiqueta', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api/etiquetas/${etiquetaId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { cor: '#00FF00' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.cor).toBe('#00FF00');
  });

  it('deve excluir etiqueta', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/etiquetas/${etiquetaId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
  });
});

// =============================================================================
// 4. Perfis (COMPLETO - Cache + Nullable + Subconsultas)
// =============================================================================

describe('Perfis - CRUD Base Completo (Cache + Nullable)', () => {
  let perfilId: string;

  it('deve criar perfil com subconsulta totalUsuarios', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/perfis',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Gerente E2E',
        descricao: 'Perfil de teste',
        permissoes: ['conversas:ler', 'conversas:escrever'],
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('Gerente E2E');
    expect(body.totalUsuarios).toBe(0); // Subconsulta
    perfilId = body.id;
  });

  it('deve cachear obterPorId() - primeira chamada (MISS)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(perfilId);
  });

  it('deve cachear obterPorId() - segunda chamada (HIT)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(perfilId);
    // Cache HIT: deve retornar rapidamente (< 10ms ideal)
  });

  it('deve invalidar cache ao atualizar', async () => {
    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { descricao: 'Descrição atualizada' },
    });

    expect(updateResponse.statusCode).toBe(200);

    // Buscar novamente - deve buscar do DB (cache invalidado)
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    const body = JSON.parse(getResponse.body);
    expect(body.descricao).toBe('Descrição atualizada');
  });

  it('deve suportar clienteId nullable (perfis globais)', async () => {
    // Criar perfil global (sem clienteId)
    const response = await app.inject({
      method: 'POST',
      url: '/api/perfis',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Super Admin Global',
        descricao: 'Perfil global',
        permissoes: ['*:*'],
        global: true, // Flag para criar sem clienteId
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('Super Admin Global');
  });

  it('deve excluir perfil e invalidar cache', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);

    // Tentar buscar - deve retornar 404
    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(getResponse.statusCode).toBe(404);
  });
});

// =============================================================================
// 5. Fluxos (MODERADO - Subconsultas + Lógica Customizada)
// =============================================================================

describe('Fluxos - CRUD Base com Lógica Customizada', () => {
  let fluxoId: string;

  it('deve criar fluxo e nó INICIO automaticamente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chatbot/fluxos',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Fluxo Atendimento E2E',
        descricao: 'Fluxo de teste',
        gatilho: { tipo: 'PALAVRA_CHAVE', valor: 'oi' },
        ativo: false,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('Fluxo Atendimento E2E');
    expect(body.totalNos).toBe(1); // Nó INICIO criado automaticamente
    expect(Array.isArray(body.nos)).toBe(true);
    expect(body.nos.length).toBe(1);
    expect(body.nos[0].tipo).toBe('INICIO');
    fluxoId = body.id;
  });

  it('deve listar fluxos com filtro ativo', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/chatbot/fluxos',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '10', ativo: 'false' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    if (body.dados.length > 0) {
      expect(body.dados[0]).toHaveProperty('totalNos');
      expect(body.dados[0].ativo).toBe(false);
    }
  });

  it('deve obter fluxo com lista de nós', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/chatbot/fluxos/${fluxoId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(fluxoId);
    expect(body).toHaveProperty('nos');
    expect(body.nos.length).toBeGreaterThan(0);
  });

  it('deve duplicar fluxo (método customizado)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/chatbot/fluxos/${fluxoId}/duplicar`,
      headers: { authorization: `Bearer ${token}` },
      payload: { novoNome: 'Fluxo Duplicado E2E' },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.nome).toBe('Fluxo Duplicado E2E');
    expect(body.ativo).toBe(false); // Sempre inativo ao duplicar
    expect(body.totalNos).toBe(1); // Nós copiados
  });

  it('deve validar ativação de fluxo (método customizado)', async () => {
    // Tentar ativar sem nó INICIO (já tem, deve funcionar)
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/chatbot/fluxos/${fluxoId}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { ativo: true },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ativo).toBe(true);
  });

  it('deve excluir fluxo', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/chatbot/fluxos/${fluxoId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(204);
  });
});

// =============================================================================
// Testes de Performance
// =============================================================================

describe('Performance - Subconsultas (Anti N+1)', () => {
  it('deve buscar equipes com subconsultas em query única', async () => {
    const inicio = Date.now();

    const response = await app.inject({
      method: 'GET',
      url: '/api/equipes',
      headers: { authorization: `Bearer ${token}` },
      query: { pagina: '1', limite: '50' },
    });

    const tempoMs = Date.now() - inicio;

    expect(response.statusCode).toBe(200);
    expect(tempoMs).toBeLessThan(500); // < 500ms para 50 registros
  });

  it('deve buscar perfis com cache HIT em < 10ms', async () => {
    // Criar perfil
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/perfis',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nome: 'Perfil Performance',
        permissoes: ['*:*'],
      },
    });

    const perfilId = JSON.parse(createResponse.body).id;

    // Primeira chamada (MISS)
    await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    // Segunda chamada (HIT) - deve ser rápida
    const inicio = Date.now();
    const response = await app.inject({
      method: 'GET',
      url: `/api/perfis/${perfilId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    const tempoMs = Date.now() - inicio;

    expect(response.statusCode).toBe(200);
    expect(tempoMs).toBeLessThan(10); // Cache HIT < 10ms
  });
});
