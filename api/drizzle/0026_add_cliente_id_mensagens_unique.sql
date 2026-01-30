-- Migration: Adicionar cliente_id e UNIQUE constraint em mensagens
-- Ref: ALTA-002 - Prevenir duplicatas de webhooks

-- Passo 1: Adicionar coluna cliente_id NULLABLE
ALTER TABLE mensagens ADD COLUMN cliente_id UUID;

-- Passo 2: Popular com dados existentes (pegar cliente_id da conversa)
UPDATE mensagens m
SET cliente_id = c.cliente_id
FROM conversas c
WHERE m.conversa_id = c.id;

-- Passo 3: Tornar NOT NULL após popular
ALTER TABLE mensagens
  ALTER COLUMN cliente_id SET NOT NULL;

-- Passo 4: Adicionar foreign key
ALTER TABLE mensagens
  ADD CONSTRAINT fk_mensagens_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- Passo 5: Criar índice para performance
CREATE INDEX idx_mensagens_cliente ON mensagens(cliente_id);

-- Passo 6: Limpar duplicatas existentes (mantém a mais recente)
DELETE FROM mensagens a USING mensagens b
WHERE a.id_externo = b.id_externo
  AND a.cliente_id = b.cliente_id
  AND a.id_externo IS NOT NULL
  AND a.enviado_em < b.enviado_em;

-- Passo 7: Criar índice UNIQUE (apenas para registros com id_externo)
CREATE UNIQUE INDEX unique_mensagem_id_externo
ON mensagens(cliente_id, id_externo)
WHERE id_externo IS NOT NULL;

-- Análise de estatísticas
ANALYZE mensagens;
