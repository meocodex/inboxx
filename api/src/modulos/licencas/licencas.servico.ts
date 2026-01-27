import { eq, and, gt } from 'drizzle-orm';

import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { licencas, clientes, planos } from '../../infraestrutura/banco/schema/index.js';
import { cacheUtils } from '../../infraestrutura/cache/redis.servico.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import { CACHE_TTL } from '../../configuracao/constantes.js';
import {
  validarChaveLicenca,
  calcularDiasRestantes,
  type LicencaValidada,
} from './validador-licenca.js';

// =============================================================================
// Tipos
// =============================================================================

export interface StatusLicenca {
  ativa: boolean;
  expiraEm: Date;
  diasRestantes: number;
  ipServidor: string;
  hostname: string | null;
  cliente: {
    id: string;
    nome: string;
  };
  plano: {
    id: string;
    nome: string;
  };
}

// =============================================================================
// Constantes
// =============================================================================

const PREFIXO_LICENCA = 'licenca:';

// =============================================================================
// Servico de Licencas
// =============================================================================

class LicencasServico {
  // ---------------------------------------------------------------------------
  // Obter Status da Licenca
  // ---------------------------------------------------------------------------
  async obterStatus(clienteId: string): Promise<StatusLicenca> {
    const result = await db
      .select({
        id: licencas.id,
        ativa: licencas.ativa,
        expiraEm: licencas.expiraEm,
        ipServidor: licencas.ipServidor,
        hostname: licencas.hostname,
        clienteId: clientes.id,
        clienteNome: clientes.nome,
        planoId: planos.id,
        planoNome: planos.nome,
      })
      .from(licencas)
      .innerJoin(clientes, eq(licencas.clienteId, clientes.id))
      .innerJoin(planos, eq(clientes.planoId, planos.id))
      .where(and(eq(licencas.clienteId, clienteId), eq(licencas.ativa, true)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Nenhuma licenca ativa encontrada para este cliente');
    }

    const licenca = result[0];

    return {
      ativa: licenca.ativa && licenca.expiraEm > new Date(),
      expiraEm: licenca.expiraEm,
      diasRestantes: calcularDiasRestantes(licenca.expiraEm),
      ipServidor: licenca.ipServidor,
      hostname: licenca.hostname,
      cliente: {
        id: licenca.clienteId,
        nome: licenca.clienteNome,
      },
      plano: {
        id: licenca.planoId,
        nome: licenca.planoNome,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Verificar Licenca por Chave
  // ---------------------------------------------------------------------------
  async verificarPorChave(chave: string, ipServidor: string): Promise<LicencaValidada> {
    const resultado = await validarChaveLicenca(chave, ipServidor);

    if (!resultado.valida || !resultado.licenca) {
      throw new ErroValidacao(resultado.motivo || 'Licenca invalida');
    }

    // Atualizar ultima verificacao
    await this.atualizarUltimaVerificacao(resultado.licenca.id);

    return resultado.licenca;
  }

  // ---------------------------------------------------------------------------
  // Atualizar Ultima Verificacao
  // ---------------------------------------------------------------------------
  async atualizarUltimaVerificacao(licencaId: string): Promise<void> {
    await db
      .update(licencas)
      .set({ ultimaVerificacao: new Date() })
      .where(eq(licencas.id, licencaId));
  }

  // ---------------------------------------------------------------------------
  // Verificar se Cliente Possui Licenca Valida
  // ---------------------------------------------------------------------------
  async clientePossuiLicencaValida(clienteId: string): Promise<boolean> {
    // Tentar cache primeiro
    const cacheKey = `${PREFIXO_LICENCA}valida:${clienteId}`;
    const cached = await cacheUtils.obter<boolean>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    // Buscar no banco
    const result = await db
      .select({ id: licencas.id })
      .from(licencas)
      .where(and(
        eq(licencas.clienteId, clienteId),
        eq(licencas.ativa, true),
        gt(licencas.expiraEm, new Date()),
      ))
      .limit(1);

    const valida = result.length > 0;

    // Salvar no cache (TTL curto para validacao frequente)
    await cacheUtils.definir(cacheKey, valida, 300); // 5 minutos

    return valida;
  }

  // ---------------------------------------------------------------------------
  // Invalidar Cache de Licenca
  // ---------------------------------------------------------------------------
  async invalidarCache(clienteId: string): Promise<void> {
    await cacheUtils.removerPorPadrao(`${PREFIXO_LICENCA}*${clienteId}*`);
  }
}

export const licencasServico = new LicencasServico();
