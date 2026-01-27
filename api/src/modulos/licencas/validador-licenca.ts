import { eq } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { licencas } from '../../infraestrutura/banco/schema/index.js';

// =============================================================================
// Tipos
// =============================================================================

export interface LicencaValidada {
  id: string;
  clienteId: string;
  chave: string;
  ipServidor: string;
  hostname: string | null;
  ativa: boolean;
  expiraEm: Date;
}

export interface ResultadoValidacao {
  valida: boolean;
  licenca?: LicencaValidada;
  motivo?: string;
}

// =============================================================================
// Validador de Licenca
// =============================================================================

/**
 * Valida uma chave de licenca para um determinado IP.
 */
export async function validarChaveLicenca(
  chave: string,
  ipServidor: string
): Promise<ResultadoValidacao> {
  const resultado = await db
    .select()
    .from(licencas)
    .where(eq(licencas.chave, chave))
    .limit(1);

  const licenca = resultado[0];

  if (!licenca) {
    return {
      valida: false,
      motivo: 'Chave de licenca nao encontrada',
    };
  }

  // Verificar se esta ativa
  if (!licenca.ativa) {
    return {
      valida: false,
      motivo: 'Licenca desativada',
    };
  }

  // Verificar expiracao
  if (licenca.expiraEm < new Date()) {
    return {
      valida: false,
      motivo: 'Licenca expirada',
    };
  }

  // Verificar IP (se configurado)
  if (licenca.ipServidor && licenca.ipServidor !== ipServidor) {
    return {
      valida: false,
      motivo: `IP do servidor nao autorizado. Esperado: ${licenca.ipServidor}, Recebido: ${ipServidor}`,
    };
  }

  return {
    valida: true,
    licenca: {
      id: licenca.id,
      clienteId: licenca.clienteId,
      chave: licenca.chave,
      ipServidor: licenca.ipServidor,
      hostname: licenca.hostname,
      ativa: licenca.ativa,
      expiraEm: licenca.expiraEm,
    },
  };
}

/**
 * Verifica se uma licenca esta expirada.
 */
export function verificarExpiracao(expiraEm: Date): boolean {
  return expiraEm < new Date();
}

/**
 * Calcula dias restantes da licenca.
 */
export function calcularDiasRestantes(expiraEm: Date): number {
  const agora = new Date();
  const diff = expiraEm.getTime() - agora.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
