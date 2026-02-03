/**
 * Helper centralizado para formatar respostas da API
 * Garante consistência em todas as rotas
 */

// =============================================================================
// Tipos
// =============================================================================

interface MetaPaginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface RespostaLista<T> {
  sucesso: true;
  dados: T[];
  meta: MetaPaginacao;
}

interface RespostaSucesso<T> {
  sucesso: true;
  dados: T;
  mensagem?: string;
}

interface RespostaErro {
  sucesso: false;
  erro: string;
  detalhes?: Record<string, unknown>;
}

// =============================================================================
// Formatadores
// =============================================================================

/**
 * Formata resposta de lista paginada
 *
 * @param dados - Array de dados a retornar
 * @param meta - Metadados de paginação
 * @returns Resposta formatada com sucesso, dados e meta
 *
 * @example
 * ```typescript
 * const resultado = await servico.listar(clienteId, query);
 * return reply.send(formatarRespostaLista(resultado.dados, resultado.meta));
 * ```
 */
export function formatarRespostaLista<T>(
  dados: T[],
  meta: MetaPaginacao
): RespostaLista<T> {
  return {
    sucesso: true,
    dados,
    meta,
  };
}

/**
 * Formata resposta de sucesso com dados
 *
 * @param dados - Dados a retornar
 * @param mensagem - Mensagem opcional de sucesso
 * @returns Resposta formatada com sucesso e dados
 *
 * @example
 * ```typescript
 * const usuario = await servico.criar(clienteId, dados);
 * return reply.send(formatarRespostaSucesso(usuario, 'Usuário criado com sucesso'));
 * ```
 */
export function formatarRespostaSucesso<T>(
  dados: T,
  mensagem?: string
): RespostaSucesso<T> {
  const resposta: RespostaSucesso<T> = {
    sucesso: true,
    dados,
  };

  if (mensagem) {
    resposta.mensagem = mensagem;
  }

  return resposta;
}

/**
 * Formata resposta de erro
 *
 * @param erro - Mensagem de erro
 * @param detalhes - Detalhes adicionais do erro (opcional)
 * @returns Resposta formatada com erro
 *
 * @example
 * ```typescript
 * return reply.status(400).send(formatarRespostaErro('Dados inválidos', { campo: 'email' }));
 * ```
 */
export function formatarRespostaErro(
  erro: string,
  detalhes?: Record<string, unknown>
): RespostaErro {
  const resposta: RespostaErro = {
    sucesso: false,
    erro,
  };

  if (detalhes) {
    resposta.detalhes = detalhes;
  }

  return resposta;
}

/**
 * Formata resposta simples de sucesso (sem dados)
 *
 * @param mensagem - Mensagem de sucesso
 * @returns Resposta formatada com mensagem
 *
 * @example
 * ```typescript
 * await servico.excluir(clienteId, id);
 * return reply.send(formatarRespostaSimplesSuccesso('Registro excluído com sucesso'));
 * ```
 */
export function formatarRespostaSimplesSuccesso(mensagem: string) {
  return {
    sucesso: true,
    mensagem,
  };
}
