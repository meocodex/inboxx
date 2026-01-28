import { z } from 'zod';
import { paginacaoComOrdenacaoSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarPerfilBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional().nullable(),
  permissoes: z.array(z.string()).min(1, 'Perfil deve ter pelo menos uma permissao'),
});

export const atualizarPerfilBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
  permissoes: z.array(z.string()).min(1, 'Perfil deve ter pelo menos uma permissao').optional(),
});

export const listarPerfisQuerySchema = paginacaoComOrdenacaoSchema.extend({
  ordenarPor: z.enum(['nome', 'criadoEm']).default('nome'),
});

// =============================================================================
// Types
// =============================================================================

export type CriarPerfilDTO = z.infer<typeof criarPerfilBodySchema>;
export type AtualizarPerfilDTO = z.infer<typeof atualizarPerfilBodySchema>;
export type ListarPerfisQuery = z.infer<typeof listarPerfisQuerySchema>;

// =============================================================================
// Permissoes Disponiveis
// =============================================================================

export const PERMISSOES_DISPONIVEIS = {
  // Recursos base
  recursos: [
    'clientes',
    'usuarios',
    'equipes',
    'perfis',
    'conversas',
    'contatos',
    'campanhas',
    'chatbot',
    'conexoes',
    'kanban',
    'relatorios',
    'configuracoes',
  ],
  // Acoes
  acoes: ['listar', 'visualizar', 'criar', 'editar', 'excluir'],
  // Permissoes especiais
  especiais: [
    '*', // Super admin - acesso total
    'conversas:proprias', // Apenas conversas atribuidas
    'relatorios:basico', // Relatorios basicos
    'relatorios:avancado', // Relatorios avancados
  ],
};

export function gerarTodasPermissoes(): string[] {
  const permissoes: string[] = [];

  for (const recurso of PERMISSOES_DISPONIVEIS.recursos) {
    for (const acao of PERMISSOES_DISPONIVEIS.acoes) {
      permissoes.push(`${recurso}:${acao}`);
    }
    permissoes.push(`${recurso}:*`);
  }

  permissoes.push(...PERMISSOES_DISPONIVEIS.especiais);

  return permissoes;
}
