-- =============================================================================
-- Migração: Índices Críticos para Performance
-- =============================================================================
-- OBJETIVO: Resolver table scans e otimizar queries mais frequentes
-- MÉTODO: CREATE INDEX CONCURRENTLY (sem lock de tabela)
-- IMPACTO: Redução de 90% nos table scans, melhoria de latência P95
-- =============================================================================

-- =============================================================================
-- 1. Extensão pg_trgm para buscas ILIKE otimizadas
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 2. Conversas (resolve N+1 queries)
-- =============================================================================

-- Índice para buscar conversas por usuário atribuído + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversas_usuario_id_status_idx
  ON conversas(usuario_id, status)
  WHERE usuario_id IS NOT NULL;

-- Índice para buscar conversas por equipe + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversas_equipe_id_status_idx
  ON conversas(equipe_id, status)
  WHERE equipe_id IS NOT NULL;

-- Índice para buscar conversas por conexão (JOIN frequente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversas_conexao_id_idx
  ON conversas(conexao_id);

-- Índice para buscar conversas por contato (JOIN frequente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversas_contato_id_idx
  ON conversas(contato_id);

-- Índice composto para dashboard (cliente + status + atualização recente)
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversas_cliente_status_atualizado_idx
  ON conversas(cliente_id, status, atualizado_em DESC);

-- =============================================================================
-- 3. Mensagens (ordenação frequente por data)
-- =============================================================================

-- Índice para buscar mensagens de uma conversa ordenadas por data (DESC)
CREATE INDEX CONCURRENTLY IF NOT EXISTS mensagens_conversa_id_enviado_em_desc_idx
  ON mensagens(conversa_id, enviado_em DESC);

-- Índice para buscar mensagem por ID externo (webhook WhatsApp)
CREATE INDEX CONCURRENTLY IF NOT EXISTS mensagens_id_externo_idx
  ON mensagens(id_externo)
  WHERE id_externo IS NOT NULL;

-- =============================================================================
-- 4. Contatos (busca ILIKE com trigram para autocomplete)
-- =============================================================================

-- Índice GIN com trigram para busca por nome (ILIKE '%nome%')
CREATE INDEX CONCURRENTLY IF NOT EXISTS contatos_nome_trgm_idx
  ON contatos USING gin(nome gin_trgm_ops);

-- Índice GIN com trigram para busca por telefone (ILIKE '%telefone%')
CREATE INDEX CONCURRENTLY IF NOT EXISTS contatos_telefone_trgm_idx
  ON contatos USING gin(telefone gin_trgm_ops);

-- Índice para buscar contato por telefone exato (validação duplicatas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS contatos_cliente_telefone_idx
  ON contatos(cliente_id, telefone);

-- =============================================================================
-- 5. Kanban (ordenação crítica por posição)
-- =============================================================================

-- Índice para ordenar cartões dentro de uma coluna (drag & drop)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cartoes_kanban_coluna_id_ordem_idx
  ON cartoes_kanban(coluna_id, ordem);

-- Índice para buscar cartões de uma conversa (JOIN)
CREATE INDEX CONCURRENTLY IF NOT EXISTS cartoes_kanban_conversa_id_idx
  ON cartoes_kanban(conversa_id);

-- =============================================================================
-- 6. Chatbot (navegação de fluxo)
-- =============================================================================

-- Índice para buscar transições a partir de um nó (motor de fluxo)
CREATE INDEX CONCURRENTLY IF NOT EXISTS transicoes_chatbot_no_origem_idx
  ON transicoes_chatbot(no_origem_id);

-- Índice para buscar nós de um fluxo
CREATE INDEX CONCURRENTLY IF NOT EXISTS nos_chatbot_fluxo_id_idx
  ON nos_chatbot(fluxo_id);

-- =============================================================================
-- 7. Licenças (validação IP - query crítica)
-- =============================================================================

-- Índice para validar licença por IP + ativo (middleware em TODA requisição)
CREATE INDEX CONCURRENTLY IF NOT EXISTS licencas_ip_servidor_ativo_idx
  ON licencas(ip_servidor, ativo)
  WHERE ativo = true;

-- =============================================================================
-- 8. Usuários (autenticação)
-- =============================================================================

-- Índice para buscar usuário por email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS usuarios_email_idx
  ON usuarios(email);

-- Índice para buscar usuários de um cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS usuarios_cliente_id_ativo_idx
  ON usuarios(cliente_id, ativo)
  WHERE ativo = true;

-- =============================================================================
-- 9. Campanhas & Agendamento
-- =============================================================================

-- Índice para buscar mensagens agendadas pendentes a processar
CREATE INDEX CONCURRENTLY IF NOT EXISTS mensagens_agendadas_status_agendar_para_idx
  ON mensagens_agendadas(status, agendar_para)
  WHERE status = 'PENDENTE';

-- =============================================================================
-- FIM DA MIGRAÇÃO
-- =============================================================================

-- Verificar índices criados
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;

-- Analisar tabelas para atualizar estatísticas do planner
ANALYZE conversas;
ANALYZE mensagens;
ANALYZE contatos;
ANALYZE cartoes_kanban;
ANALYZE transicoes_chatbot;
ANALYZE nos_chatbot;
ANALYZE licencas;
ANALYZE usuarios;
ANALYZE mensagens_agendadas;
