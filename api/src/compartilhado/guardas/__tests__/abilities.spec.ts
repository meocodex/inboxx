import { describe, it, expect } from 'vitest';
import { construirAbilities, verificarAbility } from '../abilities.js';

// =============================================================================
// construirAbilities
// =============================================================================

describe('construirAbilities', () => {
  it('deve criar ability com wildcard "*" (super admin)', () => {
    const ability = construirAbilities(['*']);
    expect(ability.can('criar', 'usuarios')).toBe(true);
    expect(ability.can('excluir', 'conversas')).toBe(true);
    expect(ability.can('qualquer', 'coisa')).toBe(true);
  });

  it('deve criar ability com permissao exata "recurso:acao"', () => {
    const ability = construirAbilities(['usuarios:criar']);
    expect(ability.can('criar', 'usuarios')).toBe(true);
    expect(ability.can('excluir', 'usuarios')).toBe(false);
  });

  it('deve criar ability com wildcard de recurso "recurso:*"', () => {
    const ability = construirAbilities(['usuarios:*']);
    expect(ability.can('criar', 'usuarios')).toBe(true);
    expect(ability.can('excluir', 'usuarios')).toBe(true);
    expect(ability.can('listar', 'usuarios')).toBe(true);
    expect(ability.can('criar', 'conversas')).toBe(false);
  });

  it('deve criar ability com multiplas permissoes', () => {
    const ability = construirAbilities(['usuarios:criar', 'conversas:*', 'contatos:listar']);
    expect(ability.can('criar', 'usuarios')).toBe(true);
    expect(ability.can('excluir', 'usuarios')).toBe(false);
    expect(ability.can('criar', 'conversas')).toBe(true);
    expect(ability.can('excluir', 'conversas')).toBe(true);
    expect(ability.can('listar', 'contatos')).toBe(true);
    expect(ability.can('criar', 'contatos')).toBe(false);
  });

  it('deve criar ability vazia com array vazio', () => {
    const ability = construirAbilities([]);
    expect(ability.can('criar', 'usuarios')).toBe(false);
    expect(ability.can('listar', 'conversas')).toBe(false);
  });

  it('deve ignorar permissoes com formato invalido', () => {
    const ability = construirAbilities(['invalido', 'usuarios:criar']);
    expect(ability.can('criar', 'usuarios')).toBe(true);
    expect(ability.can('invalido', 'all')).toBe(false);
  });
});

// =============================================================================
// verificarAbility
// =============================================================================

describe('verificarAbility', () => {
  it('deve verificar permissao com wildcard "*"', () => {
    expect(verificarAbility(['*'], 'usuarios:criar')).toBe(true);
    expect(verificarAbility(['*'], 'conversas:listar')).toBe(true);
  });

  it('deve verificar permissao exata', () => {
    expect(verificarAbility(['usuarios:criar'], 'usuarios:criar')).toBe(true);
    expect(verificarAbility(['usuarios:criar'], 'usuarios:excluir')).toBe(false);
  });

  it('deve verificar permissao wildcard de recurso', () => {
    expect(verificarAbility(['usuarios:*'], 'usuarios:criar')).toBe(true);
    expect(verificarAbility(['usuarios:*'], 'conversas:criar')).toBe(false);
  });

  it('deve negar para array vazio', () => {
    expect(verificarAbility([], 'usuarios:criar')).toBe(false);
  });

  it('deve funcionar com multiplas permissoes', () => {
    const perms = ['usuarios:criar', 'usuarios:listar', 'conversas:*'];
    expect(verificarAbility(perms, 'usuarios:criar')).toBe(true);
    expect(verificarAbility(perms, 'conversas:excluir')).toBe(true);
    expect(verificarAbility(perms, 'campanhas:criar')).toBe(false);
  });
});
