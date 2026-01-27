import { faker } from '@faker-js/faker/locale/pt_BR';

// =============================================================================
// Tipos
// =============================================================================

export interface UsuarioFactory {
  id: string;
  clienteId: string;
  perfilId: string;
  equipeId: string | null;
  nome: string;
  email: string;
  senha: string;
  telefone: string | null;
  avatarUrl: string | null;
  ativo: boolean;
  online: boolean;
  ultimoAcesso: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

// =============================================================================
// Factory de Usuario
// =============================================================================

export function criarUsuarioFactory(overrides: Partial<UsuarioFactory> = {}): UsuarioFactory {
  const agora = new Date();

  return {
    id: faker.string.uuid(),
    clienteId: faker.string.uuid(),
    perfilId: faker.string.uuid(),
    equipeId: faker.datatype.boolean() ? faker.string.uuid() : null,
    nome: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    senha: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4AqZxLXgH.xGKz8W', // "senha123" hashed
    telefone: faker.datatype.boolean() ? faker.phone.number({ style: 'national' }) : null,
    avatarUrl: faker.datatype.boolean() ? faker.image.avatar() : null,
    ativo: true,
    online: faker.datatype.boolean(),
    ultimoAcesso: faker.date.recent(),
    criadoEm: agora,
    atualizadoEm: agora,
    ...overrides,
  };
}

// =============================================================================
// Factory de Usuario Admin
// =============================================================================

export function criarUsuarioAdminFactory(overrides: Partial<UsuarioFactory> = {}): UsuarioFactory {
  return criarUsuarioFactory({
    nome: 'Admin Sistema',
    email: 'admin@sistema.com',
    ativo: true,
    online: true,
    ...overrides,
  });
}

// =============================================================================
// Factory de Multiplos Usuarios
// =============================================================================

export function criarUsuariosFactory(
  quantidade: number,
  overrides: Partial<UsuarioFactory> = {}
): UsuarioFactory[] {
  return Array.from({ length: quantidade }, () => criarUsuarioFactory(overrides));
}
