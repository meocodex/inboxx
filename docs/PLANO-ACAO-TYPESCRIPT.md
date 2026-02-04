# Plano de Ação - Arquitetura TypeScript Inboxx

**Sprint:** 24 (próxima sprint recomendada)
**Estimativa:** 8-10 dias úteis
**Prioridade:** MÉDIA-ALTA
**Status:** 📋 PLANEJAMENTO

---

## 📋 Resumo Executivo

Implementar arquitetura TypeScript avançada no sistema Inboxx para alcançar 100% type-safety, melhorar DX (Developer Experience) e reduzir bugs relacionados a tipos.

**ROI Estimado:**
- ⬇️ 70% redução em bugs de tipo
- ⬇️ 60% tempo de onboarding de novos devs
- ⬇️ 50% tempo de code review
- ⬆️ 100% autocomplete coverage

---

## 🎯 Objetivos SMART

| Objetivo | Métrica | Meta | Prazo |
|----------|---------|------|-------|
| **Type Coverage** | % de tipos explícitos | 100% | Sprint 24 |
| **JSDoc Coverage** | % com documentação | 100% | Sprint 24 |
| **Zero Erros TS** | Erros de compilação | 0 | Contínuo |
| **Migração Componentes** | Componentes migrados | 6/6 | Sprint 24 |
| **Migração Páginas** | Páginas migradas | 13/13 | Sprint 25 |

---

## 📅 Cronograma Detalhado

### Semana 1: Migração de Componentes (5 dias)

#### Dia 1 (4h) - Setup e SidebarSecundaria
- [x] ✅ Criar `layout.tipos.ts` (CONCLUÍDO)
- [x] ✅ Atualizar `tipos/index.ts` (CONCLUÍDO)
- [ ] Migrar `SidebarSecundaria.tsx`
- [ ] Adicionar JSDoc faltante
- [ ] Testar autocomplete

**Entregável:** 1 componente migrado com 100% type-safety

---

#### Dia 2 (4h) - MenuLateral e CardItem
- [ ] Migrar `MenuLateral.tsx`
- [ ] Migrar `CardItem.tsx`
- [ ] Criar type guards necessários
- [ ] Validar builds

**Entregável:** 3 componentes migrados

---

#### Dia 3 (4h) - EstadoVazio e CabecalhoPagina
- [ ] Migrar `EstadoVazio.tsx`
- [ ] Migrar `CabecalhoPagina.tsx`
- [ ] Adicionar exemplos de uso
- [ ] Documentar patterns

**Entregável:** 5 componentes migrados

---

#### Dia 4 (4h) - FiltrosRapidos e Validação
- [ ] Migrar `FiltrosRapidos.tsx` (se existir)
- [ ] Rodar `tsc --noEmit` - zero erros
- [ ] Testar build de produção
- [ ] Validar autocomplete em todos os componentes

**Entregável:** 6 componentes migrados, 0 erros

---

#### Dia 5 (4h) - Code Review e Ajustes
- [ ] Code review interno
- [ ] Ajustar feedback
- [ ] Atualizar documentação se necessário
- [ ] Preparar PR

**Entregável:** PR pronto para merge

---

### Semana 2: Migração de Páginas (5 dias)

#### Dia 6 (4h) - Páginas Principais (Contatos, Dashboard)
- [ ] Migrar `Contatos.tsx`
- [ ] Migrar `Dashboard.tsx`
- [ ] Substituir union types inline
- [ ] Adicionar type guards

**Entregável:** 2 páginas migradas

---

#### Dia 7 (4h) - Módulos de Comunicação (Conversas, Campanhas)
- [ ] Migrar `Conversas.tsx`
- [ ] Migrar `Campanhas.tsx`
- [ ] Validar tipos de mensagens
- [ ] Testar fluxos

**Entregável:** 4 páginas migradas

---

#### Dia 8 (4h) - Ferramentas (Chatbot, Kanban, Agenda)
- [ ] Migrar `Chatbot.tsx`
- [ ] Migrar `Kanban.tsx`
- [ ] Migrar `Agenda.tsx`
- [ ] Validar tipos de estados

**Entregável:** 7 páginas migradas

---

#### Dia 9 (4h) - Gestão (Usuários, Canais, Etiquetas)
- [ ] Migrar `Usuarios.tsx`
- [ ] Migrar `Canais.tsx`
- [ ] Migrar `Etiquetas.tsx`
- [ ] Migrar `Relatorios.tsx`

**Entregável:** 11 páginas migradas

---

#### Dia 10 (4h) - Finalizações e Testes
- [ ] Migrar `Configuracoes.tsx`
- [ ] Migrar páginas de autenticação
- [ ] Rodar suite de testes completa
- [ ] Validação final

**Entregável:** 13 páginas migradas, 100% coverage

---

## 👥 Responsabilidades

### TypeScript Lead (você ou dev sênior):
- Revisar PRs de migração
- Garantir padrões de qualidade
- Resolver problemas técnicos complexos
- Mentorar equipe

### Desenvolvedores:
- Executar migração de componentes
- Adicionar JSDoc
- Criar testes
- Documentar patterns encontrados

### QA:
- Validar builds
- Testar funcionalidades
- Reportar regressões
- Validar autocomplete

---

## 🚦 Critérios de Aceitação

### Para cada componente migrado:

- [ ] ✅ Todas as interfaces importadas de `layout.tipos.ts`
- [ ] ✅ Zero interfaces locais duplicadas
- [ ] ✅ JSDoc completo em props complexas
- [ ] ✅ Exemplos de uso em comentários
- [ ] ✅ `tsc --noEmit` sem erros
- [ ] ✅ Autocomplete funcionando 100%
- [ ] ✅ Build de produção OK
- [ ] ✅ Testes passando (se existirem)

### Para cada página migrada:

- [ ] ✅ Union types substituídos por tipos importados
- [ ] ✅ Type guards onde necessário
- [ ] ✅ Branded types para IDs
- [ ] ✅ Props type-safe em todos os componentes
- [ ] ✅ Sem erros de TypeScript
- [ ] ✅ Funcionalidade preservada (sem regressões)

---

## 🔧 Ferramentas e Scripts

### Script de Migração Automática

```bash
#!/bin/bash
# /code/scripts/migrate-component.sh

COMPONENT=$1
BACKUP_DIR="/code/web/src/componentes/layout/.backup"

if [ -z "$COMPONENT" ]; then
  echo "Uso: ./migrate-component.sh <nome-do-componente>"
  exit 1
fi

# 1. Backup
mkdir -p "$BACKUP_DIR"
cp "/code/web/src/componentes/layout/$COMPONENT.tsx" "$BACKUP_DIR/"

# 2. Adicionar import de tipos (manual via editor)
echo "✅ Backup criado em: $BACKUP_DIR/$COMPONENT.tsx"
echo "📝 Próximos passos:"
echo "  1. Adicionar: import type { ... } from '@/tipos/layout.tipos';"
echo "  2. Remover interfaces locais duplicadas"
echo "  3. Rodar: npm run type-check"
```

### Comandos Úteis

```bash
# Validar TypeScript
npm run type-check  # ou: npx tsc --noEmit

# Build de produção
npm run build

# Testar autocomplete (no VSCode)
# Ctrl+Space em qualquer prop

# Verificar imports não usados
npx eslint src/componentes/layout/*.tsx --fix

# Contar tipos exportados
grep -c "export \(type\|interface\)" web/src/tipos/layout.tipos.ts
```

---

## 📊 Métricas de Acompanhamento

### Dashboard de Progresso

| Sprint | Componentes | Páginas | Type Coverage | Erros TS |
|--------|-------------|---------|---------------|----------|
| **23** (atual) | 0/6 | 0/13 | 85% | 0 |
| **24** (meta) | 6/6 | 7/13 | 95% | 0 |
| **25** (meta) | 6/6 | 13/13 | 100% | 0 |

### KPIs Semanais

Medir toda sexta-feira:

- ✅ Componentes migrados
- ✅ Páginas migradas
- ✅ Erros de TypeScript
- ✅ Tempo médio de autocomplete
- ✅ Bugs reportados relacionados a tipos

---

## ⚠️ Riscos e Mitigações

### Risco 1: Regressões em Produção
**Probabilidade:** BAIXA
**Impacto:** ALTO

**Mitigação:**
- ✅ Testes automatizados antes de merge
- ✅ Validação manual de funcionalidades
- ✅ Deploy gradual (canary deployment)
- ✅ Rollback plan preparado

---

### Risco 2: Tempo de Migração Maior que Estimado
**Probabilidade:** MÉDIA
**Impacto:** MÉDIO

**Mitigação:**
- ✅ Buffer de 20% no cronograma
- ✅ Priorizar componentes críticos primeiro
- ✅ Migração incremental (pode pausar)
- ✅ Documentação detalhada para acelerar

---

### Risco 3: Resistência da Equipe
**Probabilidade:** BAIXA
**Impacto:** MÉDIO

**Mitigação:**
- ✅ Apresentar benefícios claros (ROI)
- ✅ Treinar equipe em patterns novos
- ✅ Mostrar autocomplete funcionando
- ✅ Celebrar quick wins

---

### Risco 4: Performance de TypeScript
**Probabilidade:** BAIXA
**Impacto:** BAIXO

**Mitigação:**
- ✅ Monitorar tempo de compilação
- ✅ Usar `skipLibCheck` se necessário
- ✅ Project references se projeto crescer
- ✅ Incremental compilation

---

## 🎯 Quick Wins (Semana 1)

Ações que podem ser feitas IMEDIATAMENTE com alto impacto:

### Quick Win 1: Exportar Tipos Locais (30 min)
```bash
# Adicionar 'export' em tipos não exportados
git grep -l "^type.*=" web/src/componentes/layout/
# Adicionar 'export' em cada tipo encontrado
```

**Impacto:** +20% type coverage imediato

---

### Quick Win 2: Adicionar JSDoc Básico (1h)
```typescript
// Adicionar em cada interface:
/**
 * Props do [NomeComponente].
 */
export interface [Nome]Props { ... }
```

**Impacto:** +50% documentação

---

### Quick Win 3: Type Guards de Validação (1h)
```typescript
// Criar guards para tipos mais usados
export function isColorToken(v: unknown): v is ColorToken { ... }
export function isSidebarWidth(v: unknown): v is SidebarWidth { ... }
```

**Impacto:** Validação runtime type-safe

---

## 📚 Recursos de Aprendizado

### Para a Equipe

#### Vídeos (30min):
1. TypeScript Template Literals (10min)
2. Discriminated Unions Explained (10min)
3. Branded Types Pattern (10min)

#### Documentação (1h leitura):
1. `/docs/typescript-architecture-spec.md`
2. `/docs/typescript-examples.md`
3. TypeScript Handbook - Advanced Types

#### Hands-on (2h):
1. Migrar 1 componente simples
2. Testar autocomplete
3. Criar type guard customizado

---

## ✅ Definition of Done

Uma história/tarefa só está "Done" quando:

- [ ] ✅ Código migrado e commitado
- [ ] ✅ JSDoc completo
- [ ] ✅ `tsc --noEmit` retorna 0 erros
- [ ] ✅ Build de produção OK
- [ ] ✅ Autocomplete testado e funcionando
- [ ] ✅ Testes automatizados passando
- [ ] ✅ Code review aprovado
- [ ] ✅ Documentação atualizada
- [ ] ✅ PR merged

---

## 🎉 Celebração de Marcos

### Marco 1: Primeiro Componente Migrado
- 🎉 Compartilhar screenshot de autocomplete funcionando
- 📸 Demo em reunião de equipe

### Marco 2: 50% dos Componentes Migrados
- 🎉 Pizza para equipe
- 📊 Apresentar métricas de melhoria

### Marco 3: 100% Type Coverage
- 🎉 Happy hour de celebração
- 🏆 Publicar case study interno

---

## 📞 Contatos e Suporte

### TypeScript Lead:
- **Nome:** [Definir]
- **Slack:** [Canal]
- **Disponibilidade:** Seg-Sex 9h-18h

### Recursos:
- **Documentação:** `/docs/typescript-*.md`
- **Exemplos:** `/docs/typescript-examples.md`
- **Issues:** GitHub Issues com tag `typescript`
- **Dúvidas:** Slack #typescript-migration

---

## 📝 Checklist Diário (Para Devs)

Ao iniciar o dia:
- [ ] Pull da branch main
- [ ] Rodar `npm install` (se houver updates)
- [ ] Rodar `npm run type-check`

Ao finalizar uma migração:
- [ ] Rodar `npm run type-check`
- [ ] Testar autocomplete manualmente
- [ ] Commit com mensagem descritiva
- [ ] Push para branch

Ao final do dia:
- [ ] Atualizar dashboard de progresso
- [ ] Reportar blockers no Slack
- [ ] Preparar trabalho do próximo dia

---

## 🚀 Próximas Ações IMEDIATAS

### Esta Semana (Próximos 3 dias):

#### Ação 1: Review e Aprovação (2h)
- [ ] Product Owner revisar documentação
- [ ] Tech Lead aprovar arquitetura
- [ ] Definir data de início (Sprint 24?)

#### Ação 2: Preparação da Equipe (1 dia)
- [ ] Reunião de kickoff (1h)
- [ ] Treinar equipe em patterns (2h)
- [ ] Distribuir tarefas

#### Ação 3: Setup de Ambiente (30min)
- [ ] Criar branch `feature/typescript-migration`
- [ ] Configurar CI para validar tipos
- [ ] Preparar dashboard de métricas

---

## 📊 Relatório Final (Modelo)

Ao final da migração, preencher:

```markdown
# Relatório de Migração TypeScript - Sprint [X]

## Resultados
- Componentes migrados: X/6
- Páginas migradas: X/13
- Type coverage: X%
- Erros TypeScript: X
- Bugs encontrados: X
- Tempo total: X dias

## Aprendizados
1. [Lição 1]
2. [Lição 2]
3. [Lição 3]

## Próximos Passos
1. [Próximo passo 1]
2. [Próximo passo 2]

## Agradecimentos
- [Nome dev 1]
- [Nome dev 2]
```

---

## ✅ Status Final

**Status:** 📋 PRONTO PARA EXECUÇÃO

**Aprovações Necessárias:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] Equipe de Desenvolvimento

**Data de Início Proposta:** Sprint 24 (próxima sprint)

**Data de Conclusão Estimada:** Sprint 25 (2 sprints)

---

**Elaborado por:** TypeScript Pro Agent
**Data:** 04 de Fevereiro de 2026
**Versão:** 1.0.0
**Próxima Revisão:** Após aprovação do PO
