import type { FastifyError } from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';

import { env } from '../../configuracao/ambiente.js';
import { capturarErro } from '../../infraestrutura/observabilidade/index.js';

export class ErroBase extends Error {
  public readonly statusCode: number;
  public readonly codigo: string;
  public readonly detalhes?: unknown;

  constructor(
    mensagem: string,
    statusCode = 500,
    codigo = 'ERRO_INTERNO',
    detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalhes = detalhes;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    const resultado: Record<string, unknown> = {
      erro: this.message,
      codigo: this.codigo,
    };
    if (this.detalhes) {
      resultado.detalhes = this.detalhes;
    }
    return resultado;
  }
}

export const tratadorErrosGlobal = (
  erro: FastifyError | ErroBase | ZodError | Error,
  req: FastifyRequest,
  res: FastifyReply,
) => {
  // Log detalhado para diagnóstico em produção
  req.log.error({
    err: {
      message: erro.message,
      stack: erro.stack,
      name: erro.name,
      type: erro.constructor?.name,
    },
    url: req.url,
    method: req.method,
    ip: req.ip,
    body: req.body,
    headers: {
      origin: req.headers.origin,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']?.substring(0, 100),
    },
  });

  if (erro instanceof ErroBase) {
    return res.status(erro.statusCode).send(erro.toJSON());
  }

  if (erro instanceof ZodError) {
    const detalhes = erro.errors.map((e) => ({
      campo: e.path.join('.'),
      mensagem: e.message,
    }));

    return res.status(400).send({
      erro: 'Erro de validacao',
      codigo: 'ERRO_VALIDACAO',
      detalhes,
    });
  }

  if ('statusCode' in erro && typeof erro.statusCode === 'number') {
    return res.status(erro.statusCode).send({
      erro: erro.message,
      codigo: 'ERRO_FASTIFY',
    });
  }

  // Capturar erros inesperados no Sentry (nao erros de dominio/validacao)
  capturarErro(erro instanceof Error ? erro : new Error(String(erro)), {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  const mensagemErro =
    env.NODE_ENV === 'production' ? 'Erro interno do servidor' : erro.message;

  return res.status(500).send({
    erro: mensagemErro,
    codigo: 'ERRO_INTERNO',
  });
};
