import { faker } from '@faker-js/faker/locale/pt_BR';

// =============================================================================
// Tipos
// =============================================================================

export interface ClienteFactory {
  id: string;
  planoId: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string | null;
  logoUrl: string | null;
  dominio: string | null;
  ativo: boolean;
  configuracoes: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

// =============================================================================
// Factory de Cliente
// =============================================================================

export function criarClienteFactory(overrides: Partial<ClienteFactory> = {}): ClienteFactory {
  const agora = new Date();

  return {
    id: faker.string.uuid(),
    planoId: faker.string.uuid(),
    nome: faker.company.name(),
    documento: faker.string.numeric(14), // CNPJ
    email: faker.internet.email().toLowerCase(),
    telefone: faker.datatype.boolean() ? faker.phone.number({ style: 'national' }) : null,
    logoUrl: faker.datatype.boolean() ? faker.image.url() : null,
    dominio: faker.datatype.boolean() ? faker.internet.domainName() : null,
    ativo: true,
    configuracoes: {},
    criadoEm: agora,
    atualizadoEm: agora,
    ...overrides,
  };
}

// =============================================================================
// Factory de Multiplos Clientes
// =============================================================================

export function criarClientesFactory(
  quantidade: number,
  overrides: Partial<ClienteFactory> = {}
): ClienteFactory[] {
  return Array.from({ length: quantidade }, () => criarClienteFactory(overrides));
}
