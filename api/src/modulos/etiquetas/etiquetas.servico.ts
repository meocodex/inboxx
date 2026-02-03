import { sql } from 'drizzle-orm';
import { etiquetas } from '../../infraestrutura/banco/schema/index.js';
import { CRUDBase } from '../../compartilhado/servicos/crud-base.servico.js';
import type {
  CriarEtiquetaDTO,
  AtualizarEtiquetaDTO,
  ListarEtiquetasQuery,
} from './etiquetas.schema.js';

// =============================================================================
// Tipos
// =============================================================================

export interface Etiqueta {
  id: string;
  clienteId: string;
  nome: string;
  cor: string;
  criadoEm: Date;
  totalContatos?: number;
}

// =============================================================================
// Subconsultas
// =============================================================================

const totalContatosSubquery = sql<number>`(
  SELECT count(*) FROM contatos_etiquetas WHERE contatos_etiquetas.etiqueta_id = ${etiquetas.id}
)`.mapWith(Number);

// =============================================================================
// Serviço de Etiquetas (Refatorado com CRUDBase)
// =============================================================================

/**
 * Serviço de gestão de etiquetas
 *
 * Herda operações CRUD básicas da classe CRUDBase com:
 * - Subconsulta: totalContatos injetada automaticamente
 * - Validação de nome único herdada
 * - Paginação e busca automáticas
 *
 * @example Antes (175 linhas) → Depois (~65 linhas) = 63% redução
 */
class EtiquetasServico extends CRUDBase<
  typeof etiquetas,
  Etiqueta,
  CriarEtiquetaDTO,
  AtualizarEtiquetaDTO
> {
  constructor() {
    super(etiquetas, 'Etiqueta', {
      camposBusca: ['nome'],
      subconsultas: {
        totalContatos: () => totalContatosSubquery,
      },
    });
  }

  // Todos os métodos CRUD são herdados automaticamente!
  // - listar() - Com paginação, busca e subconsulta totalContatos
  // - obterPorId() - Com subconsulta totalContatos
  // - criar() - Com validação de nome único
  // - atualizar() - Com validação de nome único
  // - excluir() - Com verificação de existência
}

// Exportar instância singleton
export const etiquetasServico = new EtiquetasServico();

// =============================================================================
// COMPARAÇÃO: Antes vs Depois
// =============================================================================

/*
ANTES (etiquetas.servico.original.ts): ~175 linhas
- 5 métodos CRUD implementados manualmente
- Subconsulta SQL injetada manualmente em SELECT (listar e obterPorId)
- Validação de nome único duplicada em criar() e atualizar()
- Paginação implementada manualmente
- Contagem manual em atualizar()

DEPOIS (etiquetas.servico.ts): ~65 linhas (com JSDoc)
- Herda TODOS os 5 métodos CRUD da classe base
- Subconsulta injetada automaticamente via configuração
- Validação de nome único herdada da classe base
- Paginação e busca automáticas
- ZERO código boilerplate

BENEFÍCIOS:
1. ~63% menos código (175 → 65 linhas)
2. 100% dos métodos herdados (máxima reutilização)
3. Subconsulta type-safe e centralizada
4. Consistência garantida pela classe base
5. Foco total em lógica de negócio (neste caso: nenhuma!)

SUBCONSULTA:
- totalContatos: COUNT de contatos_etiquetas.etiqueta_id
- Injetada automaticamente em listar() e obterPorId()

MÉTODOS HERDADOS:
✅ listar(clienteId, query) - Paginação + busca por nome + totalContatos
✅ obterPorId(clienteId, id) - Com totalContatos
✅ criar(clienteId, dados) - Com validação de nome único
✅ atualizar(clienteId, id, dados) - Com validação de nome único
✅ excluir(clienteId, id) - Com verificação de existência

NOTA: Este é o caso IDEAL de uso da CRUDBase!
- CRUD puro sem lógica customizada
- 1 subconsulta simples
- Validação padrão (nome único)
- Redução massiva de código (63%)
*/
