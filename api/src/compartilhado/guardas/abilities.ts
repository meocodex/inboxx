import { AbilityBuilder, PureAbility, createMongoAbility } from '@casl/ability';

// =============================================================================
// Tipos
// =============================================================================

/**
 * Ações disponíveis no sistema.
 * Mapeadas a partir do formato "recurso:acao" usado nas permissões.
 */
type Acao = string;
type Sujeito = string;

export type AppAbility = PureAbility<[Acao, Sujeito]>;

// =============================================================================
// Construtor de Abilities
// =============================================================================

/**
 * Constrói uma instância CASL Ability a partir das permissões do usuário.
 *
 * Formato das permissões:
 * - "*" = acesso total (super admin) → can('manage', 'all')
 * - "recurso:*" = todas as ações no recurso → can('manage', 'recurso')
 * - "recurso:acao" = ação específica → can('acao', 'recurso')
 */
export function construirAbilities(permissoes: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  for (const permissao of permissoes) {
    if (permissao === '*') {
      can('manage', 'all');
      break;
    }

    const partes = permissao.split(':');
    if (partes.length !== 2) continue;

    const [recurso, acao] = partes;

    if (acao === '*') {
      can('manage', recurso);
    } else {
      can(acao, recurso);
    }
  }

  return build();
}

// =============================================================================
// Verificação de Permissão via CASL
// =============================================================================

/**
 * Verifica se as permissões concedem acesso a uma ação/recurso.
 * Mantém compatibilidade com o formato "recurso:acao".
 */
export function verificarAbility(
  permissoes: string[],
  permissaoNecessaria: string,
): boolean {
  const ability = construirAbilities(permissoes);
  const [recurso, acao] = permissaoNecessaria.split(':');
  return ability.can(acao, recurso);
}
