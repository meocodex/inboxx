-- Migration: Adicionar cliente_id a nos_chatbot
-- Parte 1: Adicionar coluna NULLABLE e popular dados
-- Severidade: CRÍTICA - Isolamento Multi-Tenant
-- Ref: CRIT-001

-- Passo 1: Adicionar coluna NULLABLE primeiro
ALTER TABLE nos_chatbot ADD COLUMN cliente_id UUID;

-- Passo 2: Popular com dados existentes (pegar cliente_id do fluxo pai)
UPDATE nos_chatbot n
SET cliente_id = f.cliente_id
FROM fluxos_chatbot f
WHERE n.fluxo_id = f.id;

-- Passo 3: Tornar NOT NULL após popular
ALTER TABLE nos_chatbot
  ALTER COLUMN cliente_id SET NOT NULL;

-- Passo 4: Adicionar foreign key
ALTER TABLE nos_chatbot
  ADD CONSTRAINT fk_nos_cliente
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;

-- Passo 5: Criar índice para performance
CREATE INDEX idx_nos_chatbot_cliente ON nos_chatbot(cliente_id);

-- Passo 6: Criar índices compostos para performance
CREATE INDEX idx_nos_chatbot_cliente_fluxo ON nos_chatbot(cliente_id, fluxo_id);
