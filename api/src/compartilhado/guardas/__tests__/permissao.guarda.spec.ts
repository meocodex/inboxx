import { describe, it, expect } from 'vitest';
import {
  temPermissao,
  temTodasPermissoes,
  temAlgumaPermissao,
  criarGuardaPermissao,
} from '../permissao.guarda.js';
import { ErroSemPermissao } from '../../erros/index.js';

// =============================================================================
// temPermissao
// =============================================================================

describe('temPermissao', () => {
  it('deve conceder acesso total com wildcard "*"', () => {
    expect(temPermissao(['*'], 'usuarios:criar')).toBe(true);
    expect(temPermissao(['*'], 'conversas:listar')).toBe(true);
    expect(temPermissao(['*'], 'qualquer:coisa')).toBe(true);
  });

  it('deve conceder acesso com permissao exata', () => {
    expect(temPermissao(['usuarios:criar'], 'usuarios:criar')).toBe(true);
  });

  it('deve negar acesso com permissao diferente', () => {
    expect(temPermissao(['usuarios:criar'], 'usuarios:excluir')).toBe(false);
  });

  it('deve conceder acesso com wildcard de recurso "recurso:*"', () => {
    expect(temPermissao(['usuarios:*'], 'usuarios:criar')).toBe(true);
    expect(temPermissao(['usuarios:*'], 'usuarios:excluir')).toBe(true);
    expect(temPermissao(['usuarios:*'], 'usuarios:listar')).toBe(true);
  });

  it('deve negar acesso quando wildcard e de outro recurso', () => {
    expect(temPermissao(['usuarios:*'], 'conversas:criar')).toBe(false);
  });

  it('deve negar acesso com array vazio de permissoes', () => {
    expect(temPermissao([], 'usuarios:criar')).toBe(false);
  });

  it('deve verificar multiplas permissoes do usuario', () => {
    const permissoes = ['usuarios:criar', 'usuarios:listar', 'conversas:*'];
    expect(temPermissao(permissoes, 'usuarios:criar')).toBe(true);
    expect(temPermissao(permissoes, 'conversas:excluir')).toBe(true);
    expect(temPermissao(permissoes, 'campanhas:criar')).toBe(false);
  });
});

// =============================================================================
// temTodasPermissoes
// =============================================================================

describe('temTodasPermissoes', () => {
  it('deve retornar true quando possui todas as permissoes', () => {
    const permissoes = ['usuarios:criar', 'usuarios:listar', 'conversas:*'];
    expect(
      temTodasPermissoes(permissoes, ['usuarios:criar', 'usuarios:listar'])
    ).toBe(true);
  });

  it('deve retornar false quando falta alguma permissao', () => {
    const permissoes = ['usuarios:criar'];
    expect(
      temTodasPermissoes(permissoes, ['usuarios:criar', 'usuarios:excluir'])
    ).toBe(false);
  });

  it('deve retornar true para super admin', () => {
    expect(
      temTodasPermissoes(['*'], ['usuarios:criar', 'conversas:listar', 'campanhas:excluir'])
    ).toBe(true);
  });

  it('deve retornar true para array vazio de permissoes necessarias', () => {
    expect(temTodasPermissoes(['usuarios:criar'], [])).toBe(true);
  });
});

// =============================================================================
// temAlgumaPermissao
// =============================================================================

describe('temAlgumaPermissao', () => {
  it('deve retornar true quando possui pelo menos uma permissao', () => {
    const permissoes = ['usuarios:criar'];
    expect(
      temAlgumaPermissao(permissoes, ['usuarios:criar', 'usuarios:excluir'])
    ).toBe(true);
  });

  it('deve retornar false quando nao possui nenhuma permissao', () => {
    const permissoes = ['campanhas:criar'];
    expect(
      temAlgumaPermissao(permissoes, ['usuarios:criar', 'usuarios:excluir'])
    ).toBe(false);
  });

  it('deve retornar true para super admin', () => {
    expect(
      temAlgumaPermissao(['*'], ['qualquer:permissao'])
    ).toBe(true);
  });

  it('deve retornar false para array vazio de permissoes necessarias', () => {
    expect(temAlgumaPermissao(['usuarios:criar'], [])).toBe(false);
  });
});

// =============================================================================
// criarGuardaPermissao
// =============================================================================

describe('criarGuardaPermissao', () => {
  it('deve criar middleware que permite acesso com permissao correta', async () => {
    const guarda = criarGuardaPermissao('usuarios:criar');
    const request = {
      usuario: {
        id: 'user-123',
        clienteId: 'client-123',
        perfilId: 'perfil-123',
        permissoes: ['usuarios:criar'],
      },
    } as any;

    await expect(guarda(request, {} as any)).resolves.toBeUndefined();
  });

  it('deve criar middleware que nega acesso sem permissao', async () => {
    const guarda = criarGuardaPermissao('usuarios:excluir');
    const request = {
      usuario: {
        id: 'user-123',
        clienteId: 'client-123',
        perfilId: 'perfil-123',
        permissoes: ['usuarios:criar'],
      },
    } as any;

    await expect(guarda(request, {} as any)).rejects.toThrow(ErroSemPermissao);
  });

  it('deve lancar erro quando usuario nao esta autenticado', async () => {
    const guarda = criarGuardaPermissao('usuarios:criar');
    const request = {} as any; // sem usuario

    await expect(guarda(request, {} as any)).rejects.toThrow(ErroSemPermissao);
  });

  it('deve permitir super admin acessar qualquer recurso', async () => {
    const guarda = criarGuardaPermissao('qualquer:recurso');
    const request = {
      usuario: {
        id: 'admin-123',
        clienteId: null,
        perfilId: 'perfil-admin',
        permissoes: ['*'],
      },
    } as any;

    await expect(guarda(request, {} as any)).resolves.toBeUndefined();
  });
});
