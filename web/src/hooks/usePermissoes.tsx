import { useMemo, useCallback } from 'react';
import { useUsuario } from '@/stores';

// =============================================================================
// Hook de Permissões
// =============================================================================

export function usePermissoes() {
  const usuario = useUsuario();
  const permissoes = useMemo(
    () => usuario?.perfil?.permissoes || [],
    [usuario]
  );

  // ---------------------------------------------------------------------------
  // Verificar Permissão
  // ---------------------------------------------------------------------------
  const temPermissao = useCallback(
    (permissaoNecessaria: string): boolean => {
      // Super admin tem acesso a tudo
      if (permissoes.includes('*')) return true;

      // Permissão exata
      if (permissoes.includes(permissaoNecessaria)) return true;

      // Permissão com wildcard (ex: usuarios:* para usuarios:criar)
      const [recurso] = permissaoNecessaria.split(':');
      return permissoes.includes(`${recurso}:*`);
    },
    [permissoes]
  );

  // ---------------------------------------------------------------------------
  // Verificar Múltiplas Permissões (OR)
  // ---------------------------------------------------------------------------
  const temAlgumaPermissao = useCallback(
    (permissoesNecessarias: string[]): boolean => {
      return permissoesNecessarias.some((p) => temPermissao(p));
    },
    [temPermissao]
  );

  // ---------------------------------------------------------------------------
  // Verificar Todas as Permissões (AND)
  // ---------------------------------------------------------------------------
  const temTodasPermissoes = useCallback(
    (permissoesNecessarias: string[]): boolean => {
      return permissoesNecessarias.every((p) => temPermissao(p));
    },
    [temPermissao]
  );

  // ---------------------------------------------------------------------------
  // Permissões de Módulos Comuns
  // ---------------------------------------------------------------------------
  const podeVerUsuarios = temPermissao('usuarios:visualizar');
  const podeCriarUsuarios = temPermissao('usuarios:criar');
  const podeEditarUsuarios = temPermissao('usuarios:editar');
  const podeExcluirUsuarios = temPermissao('usuarios:excluir');

  const podeVerConversas = temPermissao('conversas:visualizar');
  const podeAtenderConversas = temPermissao('conversas:atender');
  const podeTransferirConversas = temPermissao('conversas:transferir');

  const podeVerContatos = temPermissao('contatos:visualizar');
  const podeCriarContatos = temPermissao('contatos:criar');
  const podeEditarContatos = temPermissao('contatos:editar');

  const podeVerCampanhas = temPermissao('campanhas:visualizar');
  const podeCriarCampanhas = temPermissao('campanhas:criar');
  const podeGerenciarCampanhas = temPermissao('campanhas:gerenciar');

  const podeVerKanban = temPermissao('kanban:visualizar');
  const podeGerenciarKanban = temPermissao('kanban:gerenciar');

  const podeVerRelatorios = temPermissao('relatorios:visualizar');
  const podeVerConfiguracoes = temPermissao('configuracoes:visualizar');

  const eSuperAdmin = permissoes.includes('*');
  const eAdmin = temPermissao('usuarios:*') && temPermissao('equipes:*');

  return {
    // Função genérica
    temPermissao,
    temAlgumaPermissao,
    temTodasPermissoes,
    permissoes,

    // Permissões específicas
    podeVerUsuarios,
    podeCriarUsuarios,
    podeEditarUsuarios,
    podeExcluirUsuarios,
    podeVerConversas,
    podeAtenderConversas,
    podeTransferirConversas,
    podeVerContatos,
    podeCriarContatos,
    podeEditarContatos,
    podeVerCampanhas,
    podeCriarCampanhas,
    podeGerenciarCampanhas,
    podeVerKanban,
    podeGerenciarKanban,
    podeVerRelatorios,
    podeVerConfiguracoes,

    // Roles
    eSuperAdmin,
    eAdmin,
  };
}

// =============================================================================
// Componente de Proteção por Permissão
// =============================================================================

interface PermissaoGuardaProps {
  permissao: string | string[];
  modo?: 'all' | 'any';
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissaoGuarda({
  permissao,
  modo = 'any',
  fallback = null,
  children,
}: PermissaoGuardaProps) {
  const { temPermissao, temAlgumaPermissao, temTodasPermissoes } = usePermissoes();

  const permissoes = Array.isArray(permissao) ? permissao : [permissao];

  const temAcesso =
    modo === 'all'
      ? temTodasPermissoes(permissoes)
      : permissoes.length === 1
        ? temPermissao(permissoes[0])
        : temAlgumaPermissao(permissoes);

  if (!temAcesso) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
