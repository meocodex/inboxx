import { ErroBase } from './erro-base.js';

/**
 * Erro de validacao de dados (400 Bad Request)
 */
export class ErroValidacao extends ErroBase {
  constructor(mensagem: string, detalhes?: unknown) {
    super(mensagem, 400, 'ERRO_VALIDACAO', detalhes);
  }
}

/**
 * Recurso nao encontrado (404 Not Found)
 */
export class ErroNaoEncontrado extends ErroBase {
  constructor(mensagem = 'Recurso nao encontrado') {
    super(mensagem, 404, 'NAO_ENCONTRADO');
  }
}

/**
 * Nao autorizado - credenciais invalidas (401 Unauthorized)
 */
export class ErroNaoAutorizado extends ErroBase {
  constructor(mensagem = 'Nao autorizado') {
    super(mensagem, 401, 'NAO_AUTORIZADO');
  }
}

/**
 * Sem permissao - autenticado mas sem acesso (403 Forbidden)
 */
export class ErroSemPermissao extends ErroBase {
  constructor(mensagem = 'Sem permissao para esta acao') {
    super(mensagem, 403, 'SEM_PERMISSAO');
  }
}

/**
 * Conflito - recurso ja existe (409 Conflict)
 */
export class ErroConflito extends ErroBase {
  constructor(mensagem: string) {
    super(mensagem, 409, 'CONFLITO');
  }
}

/**
 * Limite excedido - rate limit ou quota (429 Too Many Requests)
 */
export class ErroLimiteExcedido extends ErroBase {
  constructor(mensagem = 'Limite de requisicoes excedido') {
    super(mensagem, 429, 'LIMITE_EXCEDIDO');
  }
}
