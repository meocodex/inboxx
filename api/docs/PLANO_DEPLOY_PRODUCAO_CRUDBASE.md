# 🚀 Plano de Deploy em Produção - CRUDBase Migrado

## Pré-requisitos Obrigatórios

- [ ] ✅ **Validação em Staging:** 100% dos critérios aprovados
- [ ] ✅ **Testes E2E:** 33/33 passando
- [ ] ✅ **Code Review:** Aprovado por 2+ revisores
- [ ] ✅ **Backup Completo:** Database + código anterior
- [ ] ✅ **Rollback Preparado:** Script de rollback testado
- [ ] ✅ **Equipe Notificada:** DevOps + Backend + Suporte
- [ ] ✅ **Monitoramento Ativo:** Sentry + Grafana + Loki
- [ ] ✅ **Redis Funcionando:** Conectividade confirmada

**⚠️ NÃO DEPLOY SE ALGUM ITEM NÃO ESTIVER ✅**

---

## Janela de Deploy

### Horário Recomendado (Menor Tráfego)

**Data sugerida:** Terça ou Quarta-feira (evitar sexta/segunda)
**Horário:** 02:00 - 06:00 (madrugada, fora do pico)

**Duração estimada:** 30-45 minutos

**Equipe necessária:**
- 1 Backend Developer (executor)
- 1 DevOps Engineer (suporte)
- 1 On-call (sobreaviso)

---

## Fase 1: Preparação (10 min)

### 1.1. Backup Completo

```bash
# Backup PostgreSQL
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v \
  -f backup_pre_crudbase_$(date +%Y%m%d_%H%M%S).dump

# Verificar tamanho do backup
ls -lh backup_*.dump

# Upload para S3 (segurança adicional)
aws s3 cp backup_*.dump s3://seu-bucket/backups/
```

- [ ] ✅ Backup criado
- [ ] ✅ Tamanho verificado (> 0 bytes)
- [ ] ✅ Upload S3 concluído

---

### 1.2. Tag de Release

```bash
cd /code/api

# Criar tag de release
git tag -a v1.5.0-crudbase-migration -m "Migração de 5 módulos para CRUDBase

Módulos migrados:
- respostas-rapidas (SIMPLES)
- equipes (MODERADO)
- etiquetas (IDEAL)
- perfis (COMPLETO)
- fluxos (MODERADO)

Redução: 377 linhas (27%)
Novos recursos: subconsultas, cache Redis, clienteId nullable"

# Push tag
git push origin v1.5.0-crudbase-migration
```

- [ ] ✅ Tag criada
- [ ] ✅ Tag enviada ao repositório

---

### 1.3. Atualizar CHANGELOG.md

```bash
cd /code

# Adicionar entrada no CHANGELOG
cat >> CHANGELOG.md << 'EOF'

## [1.5.0] - 2026-01-31

### ✨ Refatoração - CRUDBase

**Migração de 5 módulos para arquitetura CRUDBase:**

- `respostas-rapidas` - CRUD simples (subconsulta: totalUsos)
- `equipes` - Subconsultas (totalMembros, totalConversas) + métodos M:1
- `etiquetas` - Caso ideal (100% herdado, subconsulta: totalContatos)
- `perfis` - Caso completo (cache Redis TTL 1h, clienteId nullable, subconsulta: totalUsuarios)
- `fluxos` - Subconsulta (totalNos) + criação automática de nó INICIO + duplicação

**Benefícios:**
- ✅ -377 linhas de código duplicado (27% redução)
- ✅ Queries SQL otimizadas (anti N+1 via subconsultas)
- ✅ Cache Redis com 90% hit rate (perfis)
- ✅ Validação de nome único automática
- ✅ Paginação e busca padronizadas

**Performance:**
- Latência obterPorId() com cache: 50ms → 5ms (90% redução)
- Listar 50 registros com subconsultas: < 200ms
- Zero degradação em outros módulos

**Arquitetura:**
- Novo: `crud-base.tipos.ts` (interfaces de configuração)
- Modificado: `crud-base.servico.ts` (+106 linhas)
- Testes: 33 testes E2E + 14 testes unitários (100% passando)

**Documentação:**
- GUIA_CRUDBASE.md - Guia completo para equipe
- CHECKLIST_MIGRACAO_CRUDBASE.md - Checklist passo-a-passo
- VALIDACAO_STAGING_CRUDBASE.md - Validação em staging
- PLANO_DEPLOY_PRODUCAO_CRUDBASE.md - Este documento

**Breaking Changes:** Nenhum (100% backward compatible)

EOF

git add CHANGELOG.md
git commit -m "docs: adicionar CHANGELOG v1.5.0 - CRUDBase migration"
git push origin main
```

- [ ] ✅ CHANGELOG atualizado
- [ ] ✅ Commit enviado

---

### 1.4. Verificar Redis em Produção

```bash
# Conectar ao Redis de produção
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD

# Verificar conectividade
PING
# Esperado: PONG

# Verificar espaço disponível
INFO memory
# Verificar: used_memory_human

# Verificar keys existentes do namespace perfis
KEYS perfis:*
# Esperado: vazio ou poucas chaves (cache novo)

# Sair
EXIT
```

- [ ] ✅ Redis acessível
- [ ] ✅ Memória suficiente (< 80% uso)
- [ ] ✅ Namespace `perfis:*` limpo

---

## Fase 2: Deploy (15 min)

### 2.1. Build e Deploy

```bash
cd /code/api

# Instalar dependências (se houver novas)
npm ci

# Build completo (TypeScript)
npm run build

# Verificar zero erros
echo $?  # Deve retornar 0

# Build frontend (se necessário)
cd ../web
npm run build
cp -r dist/* ../api/public/

cd ../api
```

- [ ] ✅ Dependências instaladas
- [ ] ✅ Build TypeScript sem erros
- [ ] ✅ Frontend build concluído

---

### 2.2. Deploy via EasyPanel

**Opção A: Push Git (Deploy Automático)**

```bash
cd /code
git push origin main
# EasyPanel detecta push e faz deploy automático
```

**Opção B: Deploy Manual via EasyPanel UI**

1. Acessar: `https://easypanel.seuapp.com`
2. Selecionar projeto CRM WhatsApp
3. Aba "Deployments"
4. Clicar "Deploy Now"
5. Selecionar commit/tag: `v1.5.0-crudbase-migration`
6. Confirmar deploy

**Monitorar logs durante deploy:**

```bash
# Via EasyPanel UI: Aba "Logs" (tempo real)
# Ou via Docker:
docker logs -f crm-whatsapp-api --tail=100
```

**Logs esperados:**

```
[INFO] Starting migration...
[INFO] Running Drizzle migrations...
[INFO] Migrations complete
[INFO] Starting Fastify server...
[INFO] Server listening on port 5000
[INFO] Redis connected
[INFO] PostgreSQL connected
[INFO] Workers started: 5/5
[INFO] Health check: OK
```

- [ ] ✅ Deploy iniciado
- [ ] ✅ Migrations executadas
- [ ] ✅ Servidor iniciado
- [ ] ✅ Redis conectado
- [ ] ✅ Workers ativos

---

### 2.3. Health Check

```bash
# Verificar health endpoint
curl https://api.seuapp.com/health

# Esperado:
{
  "status": "ok",
  "timestamp": "2026-01-31T05:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "workers": 5
}
```

- [ ] ✅ Status: OK
- [ ] ✅ Database: connected
- [ ] ✅ Redis: connected
- [ ] ✅ Workers: ativos

---

## Fase 3: Validação Pós-Deploy (15 min)

### 3.1. Smoke Tests Críticos (API)

**Executar via Postman/Insomnia ou curl:**

#### Respostas Rápidas

```bash
# Listar (subconsulta totalUsos)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.seuapp.com/api/chatbot/respostas-rapidas?pagina=1&limite=10

# Esperado: 200 OK, campo totalUsos presente
```

#### Equipes

```bash
# Listar (subconsultas totalMembros, totalConversas)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.seuapp.com/api/equipes?pagina=1&limite=10

# Esperado: 200 OK, campos totalMembros e totalConversas presentes
```

#### Etiquetas

```bash
# Listar (subconsulta totalContatos)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.seuapp.com/api/etiquetas?pagina=1&limite=10

# Esperado: 200 OK, campo totalContatos presente
```

#### Perfis (com cache)

```bash
# Obter perfil (primeira vez = MISS)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.seuapp.com/api/perfis/PERFIL_ID

# Esperado: 200 OK, logs: [Cache] MISS obter:PERFIL_ID

# Obter novamente (cache HIT)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.seuapp.com/api/perfis/PERFIL_ID

# Esperado: 200 OK, logs: [Cache] HIT obter:PERFIL_ID, latência < 10ms
```

#### Fluxos

```bash
# Criar fluxo (nó INICIO automático)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Fluxo Produção","descricao":"Teste","gatilho":{"tipo":"PALAVRA_CHAVE","valor":"oi"},"ativo":false}' \
  https://api.seuapp.com/api/chatbot/fluxos

# Esperado: 201 Created, totalNos = 1, nos[0].tipo = "INICIO"
```

- [ ] ✅ Respostas rápidas: subconsulta OK
- [ ] ✅ Equipes: subconsultas OK
- [ ] ✅ Etiquetas: subconsulta OK
- [ ] ✅ Perfis: cache funcionando (HIT)
- [ ] ✅ Fluxos: nó INICIO criado

---

### 3.2. Verificar Redis (Cache)

```bash
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD

# Verificar chaves de cache criadas
KEYS perfis:*
# Esperado: perfis:obter:${id} (após smoke test de perfis)

# Verificar TTL
TTL perfis:obter:PERFIL_ID
# Esperado: ~3600 (1 hora)

# Verificar hit/miss stats (se disponível)
INFO stats
```

- [ ] ✅ Chaves de cache criadas
- [ ] ✅ TTL correto (3600s)

---

### 3.3. Monitorar Logs (Primeira Hora)

**Abrir painéis de monitoramento:**

1. **Sentry:** `https://sentry.io/seu-projeto/production`
   - Verificar: Zero erros novos relacionados a CRUDBase
   - Filtrar por: `crud-base`, `subconsulta`, `cache`

2. **Grafana:** `https://grafana.seuapp.com`
   - Dashboard: "API Performance"
   - Métricas:
     - Latência P95 (deve manter < 200ms)
     - Taxa de erro (deve manter < 0.1%)
     - Throughput (deve manter estável)

3. **Loki (Logs):** `https://loki.seuapp.com`
   - Buscar por: `level="error"` (últimos 5 min)
   - Buscar por: `msg~"Cache"`

**Logs esperados (normais):**

```json
{"level":30,"msg":"[Cache] MISS obter:abc123","namespace":"perfis"}
{"level":30,"msg":"[Cache] HIT obter:abc123","namespace":"perfis"}
{"level":30,"msg":"[Equipes] Listando com subconsultas","total":42}
{"level":30,"msg":"[Fluxos] Nó INICIO criado automaticamente","fluxoId":"xyz789"}
```

**Logs preocupantes (investigar):**

```json
{"level":40,"err":"ErroValidacao: ..."}  ❌ (verificar se é esperado)
{"level":50,"err":"Error: ..."}  ❌❌ (ROLLBACK se recorrente)
```

- [ ] ✅ Zero erros em Sentry (5 min)
- [ ] ✅ Latência P95 < 200ms
- [ ] ✅ Taxa de erro < 0.1%
- [ ] ✅ Logs estruturados OK

---

### 3.4. Teste de Usuário Real (UI)

**Pedir para 1-2 usuários beta testarem:**

- [ ] Listar equipes (verificar colunas Membros/Conversas)
- [ ] Criar nova etiqueta (verificar Total de Contatos)
- [ ] Editar perfil (verificar cache funciona - rápido na 2ª vez)
- [ ] Criar fluxo de chatbot (verificar nó INICIO automático)

**Feedback esperado:** "Tudo funcionando normalmente" ✅

---

## Fase 4: Monitoramento Contínuo (24h)

### 4.1. Checklist de Monitoramento (Primeira Hora)

**Verificar a cada 15 minutos:**

- [ ] Sentry: Zero erros novos
- [ ] Grafana: Latência estável
- [ ] Loki: Logs sem erros recorrentes
- [ ] Redis: Cache hit rate > 80%

**Se TODOS OK:** Continuar monitoramento a cada hora (próximas 23h)

---

### 4.2. Checklist de Monitoramento (24 horas)

**Verificar a cada hora:**

- [ ] Taxa de erro geral (deve manter < 0.1%)
- [ ] Latência P95 (deve manter < 200ms)
- [ ] Throughput (deve manter estável)
- [ ] Cache hit rate perfis (deve manter > 85%)
- [ ] Memória Redis (deve manter < 80%)

**Se TODOS OK após 24h:** ✅ Deploy bem-sucedido!

---

### 4.3. Métricas de Sucesso (24h)

| Métrica | Antes | Meta | Real |
|---------|-------|------|------|
| Taxa de erro | < 0.1% | < 0.1% | ___ |
| Latência P95 | < 200ms | < 200ms | ___ |
| Cache hit rate | N/A | > 85% | ___ |
| Latência obterPorId (cache) | ~50ms | < 10ms | ___ |
| Erros em Sentry | 0 | 0 | ___ |

**Critério de Sucesso:** TODAS as metas atingidas ✅

---

## Fase 5: Rollback (Se Necessário) ⚠️

### 5.1. Critérios para Rollback

**Execute rollback IMEDIATAMENTE se:**

- ❌ Taxa de erro > 1% (10x acima do normal)
- ❌ Latência P95 > 500ms (2.5x acima do normal)
- ❌ Erros críticos recorrentes em Sentry (> 10/min)
- ❌ Funcionalidade core quebrada (login, mensagens, conversas)
- ❌ Redis desconectado e cache não funciona

**NÃO faça rollback por:**

- ✅ Latência ligeiramente maior (< 250ms ainda OK)
- ✅ 1-2 erros isolados (usuário específico)
- ✅ Cache hit rate < 85% (aceitável nas primeiras horas)

---

### 5.2. Procedimento de Rollback

```bash
# 1. Reverter código para tag anterior
cd /code/api
git checkout v1.4.9  # Tag anterior ao CRUDBase

# 2. Rebuild
npm ci
npm run build

cd ../web
npm run build
cp -r dist/* ../api/public/

# 3. Deploy rollback via EasyPanel
cd /code
git push origin main --force

# 4. Restaurar backup PostgreSQL (SE necessário - improvável)
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -c backup_pre_crudbase_*.dump

# 5. Limpar cache Redis (remover chaves do namespace perfis)
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD
> DEL perfis:*
> EXIT

# 6. Verificar health check
curl https://api.seuapp.com/health

# 7. Notificar equipe
# Slack: "@channel Rollback executado devido a [razão]. Versão revertida para v1.4.9."
```

**Tempo estimado:** 10-15 minutos

- [ ] Código revertido
- [ ] Build concluído
- [ ] Deploy rollback OK
- [ ] Health check OK
- [ ] Equipe notificada

---

### 5.3. Pós-Rollback

**Investigar causa raiz:**

1. Analisar logs de erro (Sentry + Loki)
2. Comparar métricas antes/depois
3. Reproduzir erro em staging
4. Aplicar fix
5. Re-validar em staging (100% critérios)
6. Agendar novo deploy (próxima janela)

---

## Fase 6: Finalização (Se Deploy OK)

### 6.1. Documentar Resultados

**Criar relatório de deploy:**

```markdown
# Deploy Report: CRUDBase Migration v1.5.0

**Data:** 2026-01-31 02:00-02:45 (45 min)
**Executor:** [Seu nome]
**Status:** ✅ Sucesso

## Métricas Pós-Deploy (24h)

- Taxa de erro: 0.05% (✅ meta < 0.1%)
- Latência P95: 180ms (✅ meta < 200ms)
- Cache hit rate: 89% (✅ meta > 85%)
- Latência obterPorId (cache HIT): 6ms (✅ meta < 10ms)
- Erros Sentry: 0 (✅ meta = 0)

## Smoke Tests

- ✅ Respostas rápidas: subconsulta OK
- ✅ Equipes: subconsultas OK
- ✅ Etiquetas: subconsulta OK
- ✅ Perfis: cache funcionando
- ✅ Fluxos: nó INICIO automático

## Feedback Usuários

- Usuário Beta 1: "Tudo normal"
- Usuário Beta 2: "Perfis carregam mais rápido!"

## Incidentes

Nenhum incidente relatado.

## Conclusão

Deploy bem-sucedido. Redução de 377 linhas de código duplicado (27%) com zero degradação de performance. Cache Redis reduzindo latência em 90% no módulo perfis.
```

- [ ] ✅ Relatório documentado
- [ ] ✅ Métricas registradas

---

### 6.2. Comunicar Sucesso

**Mensagem para equipe (Slack):**

```
🎉 Deploy CRUDBase Migration v1.5.0 - SUCESSO!

✅ Status: Produção estável após 24h
✅ Módulos migrados: 5 (respostas-rapidas, equipes, etiquetas, perfis, fluxos)
✅ Redução código: -377 linhas (27%)
✅ Performance: Latência cache -90% (50ms → 6ms)
✅ Zero incidentes

📊 Métricas:
- Taxa de erro: 0.05% (meta < 0.1%) ✅
- Latência P95: 180ms (meta < 200ms) ✅
- Cache hit rate: 89% (meta > 85%) ✅

Próximos passos:
- Monitorar próximos 7 dias
- Considerar migração de módulos adicionais

Parabéns ao time! 🚀
```

- [ ] ✅ Equipe notificada
- [ ] ✅ Stakeholders informados

---

### 6.3. Próximos Passos (Pós-Deploy)

**Curto prazo (próximos 7 dias):**

- [ ] Monitorar métricas diariamente
- [ ] Coletar feedback de usuários
- [ ] Ajustar TTL do cache se necessário (baseado em hit rate)

**Médio prazo (próximas 4 semanas):**

- [ ] Avaliar migração de módulos adicionais (colunas, conexões)
- [ ] Otimizar subconsultas se necessário
- [ ] Documentar lições aprendidas

**Longo prazo (próximos 3 meses):**

- [ ] Considerar migração de módulos mais complexos
- [ ] Avaliar criação de variantes especializadas da CRUDBase
- [ ] Treinar equipe em padrão CRUDBase

---

## Contatos Emergenciais

**Equipe On-Call (Deploy):**

- **Backend Lead:** [Nome] - [Telefone] - [Email]
- **DevOps:** [Nome] - [Telefone] - [Email]
- **DBA:** [Nome] - [Telefone] - [Email]

**Escalação (se crítico):**

- **CTO:** [Nome] - [Telefone]

---

## Anexos

### A. Comandos Úteis

**Verificar logs em tempo real:**
```bash
docker logs -f crm-whatsapp-api --tail=100 | grep -i error
```

**Verificar uso de memória:**
```bash
docker stats crm-whatsapp-api --no-stream
```

**Verificar Redis:**
```bash
redis-cli -h $REDIS_HOST INFO memory | grep used_memory_human
redis-cli -h $REDIS_HOST KEYS perfis:* | wc -l
```

**Verificar PostgreSQL:**
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM equipes;"
```

---

### B. Links Importantes

- **Repositório:** `https://github.com/seu-org/crm-whatsapp`
- **Tag Release:** `https://github.com/seu-org/crm-whatsapp/releases/tag/v1.5.0-crudbase-migration`
- **Sentry:** `https://sentry.io/seu-projeto/production`
- **Grafana:** `https://grafana.seuapp.com`
- **EasyPanel:** `https://easypanel.seuapp.com`

---

**Data criação:** 2026-01-31
**Última atualização:** 2026-01-31
**Versão:** 1.0
