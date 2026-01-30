import type { TipoNo } from '../NoFluxo';

// =============================================================================
// ID Generator
// =============================================================================

let idContador = 0;
export const gerarId = () => `no_${Date.now()}_${idContador++}`;

// =============================================================================
// Nomes Padrão
// =============================================================================

export function obterNomePadrao(tipo: TipoNo): string {
  const nomes: Record<TipoNo, string> = {
    INICIO: 'Inicio do Fluxo',
    MENSAGEM: 'Nova Mensagem',
    PERGUNTA: 'Nova Pergunta',
    MENU: 'Novo Menu',
    CONDICAO: 'Nova Condicao',
    TRANSFERIR: 'Transferir',
    WEBHOOK: 'Webhook',
    ESPERAR: 'Esperar',
    ACAO: 'Nova Acao',
    FIM: 'Fim do Fluxo',
  };
  return nomes[tipo] || 'Novo No';
}

// =============================================================================
// Configurações Padrão
// =============================================================================

export function obterConfiguracaoPadrao(tipo: TipoNo): Record<string, unknown> {
  switch (tipo) {
    case 'MENSAGEM':
      return { mensagem: '' };
    case 'PERGUNTA':
      return { mensagem: '', variavel: '', validacao: 'TEXTO' };
    case 'MENU':
      return { mensagem: '', opcoes: [{ texto: 'Opcao 1', valor: '1' }] };
    case 'CONDICAO':
      return { condicoes: [] };
    case 'TRANSFERIR':
      return { equipeId: '', usuarioId: '', mensagem: '' };
    case 'WEBHOOK':
      return { url: '', metodo: 'POST', headers: {}, body: '' };
    case 'ESPERAR':
      return { duracao: 5, unidade: 'segundos' };
    default:
      return {};
  }
}
