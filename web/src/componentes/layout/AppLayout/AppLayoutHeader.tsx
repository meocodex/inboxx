import { memo } from 'react';
import { CabecalhoPagina } from '../CabecalhoPagina';
import type { AppLayoutHeaderProps } from './types';

// =============================================================================
// APP LAYOUT HEADER - CABEÇALHO DA PÁGINA
// =============================================================================
//
// Wrapper para CabecalhoPagina com props simplificadas.
// Evita importação direta do CabecalhoPagina.
//
// =============================================================================

export const AppLayoutHeader = memo(({
  children,
  className,
  titulo,
  subtitulo,
  icone,
  acoes,
  comBorda = true,
}: AppLayoutHeaderProps) => {
  // Se tem children, renderiza direto (modo customizado)
  if (children) {
    return <>{children}</>;
  }

  // Se tem props, renderiza CabecalhoPagina
  if (titulo) {
    return (
      <CabecalhoPagina
        titulo={titulo}
        subtitulo={subtitulo}
        icone={icone}
        acoes={acoes}
        comBorda={comBorda}
        className={className}
      />
    );
  }

  // Sem props = não renderiza nada
  return null;
});

AppLayoutHeader.displayName = 'AppLayoutHeader';
