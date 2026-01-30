-- Migration: Adicionar índices em transicoes_chatbot
-- Ref: ALTA-005 - Performance

-- Criar índices CONCURRENTLY (sem lock)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transicoes_fluxo
  ON transicoes_chatbot(fluxo_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transicoes_no_origem
  ON transicoes_chatbot(no_origem_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transicoes_no_destino
  ON transicoes_chatbot(no_destino_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transicoes_ordem
  ON transicoes_chatbot(fluxo_id, ordem);

-- Análise de estatísticas
ANALYZE transicoes_chatbot;
