import { z } from 'zod';

const ambienteSchema = z.object({
  // Aplicacao
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(5000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Banco de dados
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL deve ser uma URL valida')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL deve comecar com postgresql:// ou postgres://',
    ),
  PGBOUNCER_URL: z
    .string()
    .url('PGBOUNCER_URL deve ser uma URL valida')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'PGBOUNCER_URL deve comecar com postgresql:// ou postgres://',
    )
    .optional(),

  // Redis
  REDIS_URL: z
    .string()
    .url('REDIS_URL deve ser uma URL valida')
    .refine(
      (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
      'REDIS_URL deve comecar com redis:// ou rediss://',
    ),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no minimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Cookies
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET deve ter no minimo 32 caracteres'),

  // CORS (opcional em dev)
  CORS_ORIGINS: z.string().optional(),

  // Storage (local por padrao, S3/MinIO opcional)
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),

  // S3/MinIO (opcional - so necessario se STORAGE_DRIVER=s3)
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true), // true para MinIO

  // Meta Cloud API (WhatsApp Business)
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(16, 'META_WEBHOOK_VERIFY_TOKEN deve ter no minimo 16 caracteres'),
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET é obrigatório'),
  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_BUSINESS_ACCOUNT_ID: z.string().optional(),

  // UaiZap (provedor alternativo)
  UAIZAP_API_URL: z.string().url().optional(),
  UAIZAP_API_KEY: z.string().optional(),

  // Webhooks
  WEBHOOK_WHITELIST_IPS: z.string().optional(), // ex: "192.168.1.1,10.0.0.1"

  // Meilisearch (busca - opcional)
  MEILI_URL: z.string().url().optional(),
  MEILI_MASTER_KEY: z.string().optional(),

  // Sentry (monitoramento de erros - opcional)
  SENTRY_DSN: z.string().url().optional(),

  // OpenTelemetry (observabilidade - opcional)
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_METRICS_PORT: z.coerce.number().min(1).max(65535).default(9464),
});

const resultado = ambienteSchema.safeParse(process.env);

if (!resultado.success) {
  console.error('');
  console.error('='.repeat(60));
  console.error('ERRO: Variaveis de ambiente invalidas ou ausentes');
  console.error('='.repeat(60));
  console.error('');

  const errosFormatados = resultado.error.issues.map((issue) => ({
    variavel: issue.path.join('.'),
    mensagem: issue.message,
  }));

  console.error('Problemas encontrados:');
  errosFormatados.forEach(({ variavel, mensagem }) => {
    console.error(`  - ${variavel}: ${mensagem}`);
  });

  console.error('');
  console.error('Verifique o arquivo .env e tente novamente.');
  console.error('Use .env.exemplo como referencia.');
  console.error('='.repeat(60));

  process.exit(1);
}

// Validar valores inseguros em produção
if (resultado.data.NODE_ENV === 'production') {
  const valoresInseguros = [
    'GERE_UMA_CHAVE',
    'DEFINA_TOKEN',
    'COPIE_DO_PAINEL',
    'COPIE_DA_PLATAFORMA',
    'crm_webhook',
    'sua-chave-secreta',
    'sua_senha',
    'exemplo',
    'test',
    'demo',
  ];

  const camposCriticos = [
    'JWT_SECRET',
    'COOKIE_SECRET',
    'META_APP_SECRET',
    'META_WEBHOOK_VERIFY_TOKEN',
  ];

  for (const campo of camposCriticos) {
    const valor = resultado.data[campo as keyof typeof resultado.data] as string;
    if (!valor || valoresInseguros.some(v => valor.includes(v))) {
      console.error('');
      console.error('🚨 ERRO DE SEGURANÇA: Valor inseguro detectado em produção!');
      console.error(`Variável: ${campo}`);
      console.error('Valores de exemplo NÃO podem ser usados em produção.');
      console.error('Execute: ./scripts/gerar-secrets.sh para gerar valores seguros');
      console.error('');
      process.exit(1);
    }
  }
}

export const env = resultado.data;

export type Ambiente = z.infer<typeof ambienteSchema>;
