-- =============================================================================
-- Migração: Row-Level Security (RLS) para Multi-Tenancy
-- =============================================================================
-- OBJETIVO: Isolar dados por cliente no nível do banco de dados
-- MÉTODO: PostgreSQL RLS + Políticas baseadas em contexto de sessão
-- IMPACTO: Defesa em profundidade - isolamento além da camada de aplicação
-- =============================================================================

-- =============================================================================
-- 1. Função para obter cliente_id do contexto da sessão
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_cliente_id()
RETURNS UUID AS $$
DECLARE
  cliente_id_str TEXT;
BEGIN
  -- Obter cliente_id do contexto da sessão (SET LOCAL app.cliente_id)
  cliente_id_str := current_setting('app.cliente_id', true);

  -- Se não estiver definido, retornar NULL (usado para SUPER_ADMIN)
  IF cliente_id_str IS NULL OR cliente_id_str = '' THEN
    RETURN NULL;
  END IF;

  -- Converter string para UUID
  RETURN cliente_id_str::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 2. Habilitar RLS em todas as tabelas multi-tenant
-- =============================================================================

-- Conversas e relacionadas
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_internas ENABLE ROW LEVEL SECURITY;

-- Contatos
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_etiquetas ENABLE ROW LEVEL SECURITY;

-- Campanhas
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_agendadas ENABLE ROW LEVEL SECURITY;

-- Chatbot
ALTER TABLE fluxos_chatbot ENABLE ROW LEVEL SECURITY;
ALTER TABLE nos_chatbot ENABLE ROW LEVEL SECURITY;
ALTER TABLE transicoes_chatbot ENABLE ROW LEVEL SECURITY;

-- Kanban
ALTER TABLE quadros_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE colunas_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_kanban ENABLE ROW LEVEL SECURITY;

-- Outros módulos
ALTER TABLE conexoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_rapidas ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. Políticas RLS - SELECT (Leitura)
-- =============================================================================

-- Conversas
CREATE POLICY conversas_select_policy ON conversas
  FOR SELECT
  USING (
    cliente_id = get_current_cliente_id()
    OR get_current_cliente_id() IS NULL -- SUPER_ADMIN pode ver tudo
  );

-- Mensagens
CREATE POLICY mensagens_select_policy ON mensagens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
        AND (conversas.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Notas Internas
CREATE POLICY notas_internas_select_policy ON notas_internas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = notas_internas.conversa_id
        AND (conversas.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Contatos
CREATE POLICY contatos_select_policy ON contatos
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Contatos Etiquetas
CREATE POLICY contatos_etiquetas_select_policy ON contatos_etiquetas
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Campanhas
CREATE POLICY campanhas_select_policy ON campanhas
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Campanhas Log
CREATE POLICY campanhas_log_select_policy ON campanhas_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campanhas
      WHERE campanhas.id = campanhas_log.campanha_id
        AND (campanhas.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Mensagens Agendadas
CREATE POLICY mensagens_agendadas_select_policy ON mensagens_agendadas
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Chatbot - Fluxos
CREATE POLICY fluxos_chatbot_select_policy ON fluxos_chatbot
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Chatbot - Nós
CREATE POLICY nos_chatbot_select_policy ON nos_chatbot
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fluxos_chatbot
      WHERE fluxos_chatbot.id = nos_chatbot.fluxo_id
        AND (fluxos_chatbot.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Chatbot - Transições
CREATE POLICY transicoes_chatbot_select_policy ON transicoes_chatbot
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nos_chatbot
      JOIN fluxos_chatbot ON fluxos_chatbot.id = nos_chatbot.fluxo_id
      WHERE nos_chatbot.id = transicoes_chatbot.no_origem_id
        AND (fluxos_chatbot.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Kanban - Quadros
CREATE POLICY quadros_kanban_select_policy ON quadros_kanban
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Kanban - Colunas
CREATE POLICY colunas_kanban_select_policy ON colunas_kanban
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quadros_kanban
      WHERE quadros_kanban.id = colunas_kanban.quadro_id
        AND (quadros_kanban.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Kanban - Cartões
CREATE POLICY cartoes_kanban_select_policy ON cartoes_kanban
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colunas_kanban
      JOIN quadros_kanban ON quadros_kanban.id = colunas_kanban.quadro_id
      WHERE colunas_kanban.id = cartoes_kanban.coluna_id
        AND (quadros_kanban.cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL)
    )
  );

-- Conexões
CREATE POLICY conexoes_select_policy ON conexoes
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Usuários
CREATE POLICY usuarios_select_policy ON usuarios
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Equipes
CREATE POLICY equipes_select_policy ON equipes
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Etiquetas
CREATE POLICY etiquetas_select_policy ON etiquetas
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Compromissos
CREATE POLICY compromissos_select_policy ON compromissos
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- Respostas Rápidas
CREATE POLICY respostas_rapidas_select_policy ON respostas_rapidas
  FOR SELECT
  USING (cliente_id = get_current_cliente_id() OR get_current_cliente_id() IS NULL);

-- =============================================================================
-- 4. Políticas RLS - INSERT (Criação)
-- =============================================================================

-- Conversas
CREATE POLICY conversas_insert_policy ON conversas
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Mensagens
CREATE POLICY mensagens_insert_policy ON mensagens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = mensagens.conversa_id
        AND conversas.cliente_id = get_current_cliente_id()
    )
  );

-- Notas Internas
CREATE POLICY notas_internas_insert_policy ON notas_internas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversas
      WHERE conversas.id = notas_internas.conversa_id
        AND conversas.cliente_id = get_current_cliente_id()
    )
  );

-- Contatos
CREATE POLICY contatos_insert_policy ON contatos
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Contatos Etiquetas
CREATE POLICY contatos_etiquetas_insert_policy ON contatos_etiquetas
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Campanhas
CREATE POLICY campanhas_insert_policy ON campanhas
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Chatbot - Fluxos
CREATE POLICY fluxos_chatbot_insert_policy ON fluxos_chatbot
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Kanban - Quadros
CREATE POLICY quadros_kanban_insert_policy ON quadros_kanban
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Conexões
CREATE POLICY conexoes_insert_policy ON conexoes
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Usuários
CREATE POLICY usuarios_insert_policy ON usuarios
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Equipes
CREATE POLICY equipes_insert_policy ON equipes
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Etiquetas
CREATE POLICY etiquetas_insert_policy ON etiquetas
  FOR INSERT
  WITH CHECK (cliente_id = get_current_cliente_id());

-- =============================================================================
-- 5. Políticas RLS - UPDATE (Atualização)
-- =============================================================================

-- Conversas
CREATE POLICY conversas_update_policy ON conversas
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Contatos
CREATE POLICY contatos_update_policy ON contatos
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Campanhas
CREATE POLICY campanhas_update_policy ON campanhas
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Chatbot - Fluxos
CREATE POLICY fluxos_chatbot_update_policy ON fluxos_chatbot
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Kanban - Quadros
CREATE POLICY quadros_kanban_update_policy ON quadros_kanban
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Conexões
CREATE POLICY conexoes_update_policy ON conexoes
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- Usuários
CREATE POLICY usuarios_update_policy ON usuarios
  FOR UPDATE
  USING (cliente_id = get_current_cliente_id())
  WITH CHECK (cliente_id = get_current_cliente_id());

-- =============================================================================
-- 6. Políticas RLS - DELETE (Exclusão)
-- =============================================================================

-- Conversas
CREATE POLICY conversas_delete_policy ON conversas
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- Contatos
CREATE POLICY contatos_delete_policy ON contatos
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- Campanhas
CREATE POLICY campanhas_delete_policy ON campanhas
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- Chatbot - Fluxos
CREATE POLICY fluxos_chatbot_delete_policy ON fluxos_chatbot
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- Kanban - Quadros
CREATE POLICY quadros_kanban_delete_policy ON quadros_kanban
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- Etiquetas
CREATE POLICY etiquetas_delete_policy ON etiquetas
  FOR DELETE
  USING (cliente_id = get_current_cliente_id());

-- =============================================================================
-- 7. Verificação das Políticas Criadas
-- =============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- =============================================================================
-- 8. Teste de RLS (Executar manualmente após deploy)
-- =============================================================================

/*
-- Teste 1: Definir contexto do cliente A
SET app.cliente_id = 'cliente-a-uuid-aqui';
SELECT COUNT(*) FROM conversas; -- Deve retornar apenas conversas do cliente A

-- Teste 2: Tentar inserir conversa de outro cliente (deve falhar)
INSERT INTO conversas (cliente_id, contato_id, conexao_id, status)
VALUES ('cliente-b-uuid', 'contato-uuid', 'conexao-uuid', 'ABERTA');
-- Erro: RLS bloqueou (cliente_id diferente do contexto)

-- Teste 3: Resetar contexto (SUPER_ADMIN)
RESET app.cliente_id;
SELECT COUNT(*) FROM conversas; -- Deve retornar todas as conversas

-- Teste 4: Verificar isolamento entre clientes
SET app.cliente_id = 'cliente-a-uuid';
SELECT COUNT(*) FROM conversas WHERE cliente_id = 'cliente-b-uuid';
-- Deve retornar 0 (RLS bloqueou acesso)
*/

-- =============================================================================
-- FIM DA MIGRAÇÃO
-- =============================================================================

COMMENT ON FUNCTION get_current_cliente_id() IS 'Retorna o cliente_id do contexto da sessão para RLS multi-tenant';
