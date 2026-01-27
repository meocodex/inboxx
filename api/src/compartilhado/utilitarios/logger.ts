import { pino } from 'pino';

import { env } from '../../configuracao/ambiente.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
          },
        }
      : undefined,
});

export const criarLoggerFilho = (modulo: string) => {
  return logger.child({ modulo });
};
