# API Endpoints - CRM WhatsApp Omnichannel

Base URL: `http://localhost:3335/api`

## Autenticacao

Todos os endpoints protegidos requerem header:
```
Authorization: Bearer <token>
```

---

## Saude

### GET /saude
Health check da API.

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T00:00:00.000Z",
  "versao": "1.0.0",
  "servicos": {
    "api": { "status": "ok" },
    "banco": { "status": "ok", "latencia": 2 },
    "cache": { "status": "ok", "latencia": 1 }
  }
}
```

---

## Autenticacao

### POST /autenticacao/entrar
Login do usuario.

**Body:**
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "dados": {
    "accessToken": "eyJ...",
    "refreshToken": "abc...",
    "usuario": {
      "id": "uuid",
      "nome": "Nome",
      "email": "email@email.com",
      "clienteId": "uuid",
      "perfil": {
        "id": "uuid",
        "nome": "Administrador",
        "permissoes": ["*"]
      }
    }
  }
}
```

### POST /autenticacao/renovar
Renova o access token.

**Body:**
```json
{
  "refreshToken": "abc..."
}
```

### POST /autenticacao/sair
Logout (invalida refresh token).

### GET /autenticacao/eu
Retorna dados do usuario autenticado.

---

## Usuarios

### GET /usuarios
Lista usuarios do cliente.

**Query:**
- `pagina` (default: 1)
- `limite` (default: 20)
- `busca` - Busca por nome ou email
- `equipeId` - Filtrar por equipe
- `ativo` - true/false

### GET /usuarios/:id
Obtem usuario por ID.

### POST /usuarios
Cria novo usuario.

**Body:**
```json
{
  "nome": "Nome do Usuario",
  "email": "email@email.com",
  "senha": "senha123",
  "perfilId": "uuid",
  "equipeId": "uuid"
}
```

### PUT /usuarios/:id
Atualiza usuario.

### DELETE /usuarios/:id
Desativa usuario.

---

## Equipes

### GET /equipes
Lista equipes.

### GET /equipes/:id
Obtem equipe com membros.

### POST /equipes
Cria equipe.

**Body:**
```json
{
  "nome": "Suporte",
  "descricao": "Equipe de suporte"
}
```

### PUT /equipes/:id
Atualiza equipe.

### DELETE /equipes/:id
Remove equipe.

### POST /equipes/:id/membros
Adiciona membros a equipe.

**Body:**
```json
{
  "usuarioIds": ["uuid1", "uuid2"]
}
```

---

## Conexoes

### GET /conexoes
Lista conexoes WhatsApp/Instagram.

### GET /conexoes/:id
Obtem conexao.

### POST /conexoes
Cria conexao.

**Body:**
```json
{
  "nome": "WhatsApp Principal",
  "canal": "WHATSAPP",
  "telefone": "+5511999999999"
}
```

### PUT /conexoes/:id
Atualiza conexao.

### DELETE /conexoes/:id
Remove conexao.

### POST /conexoes/:id/conectar
Inicia conexao (gera QR Code).

### POST /conexoes/:id/desconectar
Desconecta.

---

## Contatos

### GET /contatos
Lista contatos.

**Query:**
- `pagina`, `limite`
- `busca` - Nome, telefone ou email
- `etiquetaId` - Filtrar por etiqueta

### GET /contatos/:id
Obtem contato com conversas.

### POST /contatos
Cria contato.

**Body:**
```json
{
  "nome": "Cliente",
  "telefone": "+5511999999999",
  "email": "cliente@email.com",
  "etiquetaIds": ["uuid1", "uuid2"]
}
```

### PUT /contatos/:id
Atualiza contato.

### DELETE /contatos/:id
Remove contato.

### POST /contatos/:id/etiquetas
Atribui etiquetas.

---

## Etiquetas

### GET /etiquetas
Lista etiquetas.

### POST /etiquetas
Cria etiqueta.

**Body:**
```json
{
  "nome": "VIP",
  "cor": "#FF0000"
}
```

### PUT /etiquetas/:id
Atualiza etiqueta.

### DELETE /etiquetas/:id
Remove etiqueta.

---

## Conversas

### GET /conversas
Lista conversas.

**Query:**
- `pagina`, `limite`
- `status` - ABERTA, EM_ATENDIMENTO, AGUARDANDO, ENCERRADA
- `atendenteId` - Filtrar por atendente
- `contatoId` - Filtrar por contato

### GET /conversas/:id
Obtem conversa com mensagens.

### POST /conversas
Cria conversa.

**Body:**
```json
{
  "contatoId": "uuid",
  "conexaoId": "uuid"
}
```

### PUT /conversas/:id
Atualiza conversa.

### POST /conversas/:id/atribuir
Atribui atendente.

**Body:**
```json
{
  "atendenteId": "uuid"
}
```

### POST /conversas/:id/encerrar
Encerra conversa.

### POST /conversas/:id/reabrir
Reabre conversa.

---

## Mensagens

### GET /conversas/:conversaId/mensagens
Lista mensagens da conversa.

### POST /conversas/:conversaId/mensagens
Envia mensagem.

**Body:**
```json
{
  "tipo": "TEXTO",
  "conteudo": "Ola, como posso ajudar?"
}
```

### GET /conversas/:conversaId/mensagens/:id
Obtem mensagem.

---

## Notas Internas

### GET /conversas/:conversaId/notas
Lista notas da conversa.

### POST /conversas/:conversaId/notas
Cria nota.

**Body:**
```json
{
  "conteudo": "Cliente solicitou desconto"
}
```

### PUT /conversas/:conversaId/notas/:id
Atualiza nota.

### DELETE /conversas/:conversaId/notas/:id
Remove nota.

---

## Chatbot - Fluxos

### GET /chatbot/fluxos
Lista fluxos.

### GET /chatbot/fluxos/:id
Obtem fluxo com nos.

### POST /chatbot/fluxos
Cria fluxo.

**Body:**
```json
{
  "nome": "Atendimento Inicial",
  "descricao": "Fluxo de boas-vindas",
  "gatilho": "oi|ola|bom dia"
}
```

### PUT /chatbot/fluxos/:id
Atualiza fluxo.

### DELETE /chatbot/fluxos/:id
Remove fluxo.

### POST /chatbot/fluxos/:id/ativar
Ativa fluxo.

### POST /chatbot/fluxos/:id/desativar
Desativa fluxo.

---

## Chatbot - Nos

### GET /chatbot/fluxos/:fluxoId/nos
Lista nos do fluxo.

### POST /chatbot/fluxos/:fluxoId/nos
Cria no.

**Body:**
```json
{
  "tipo": "MENSAGEM",
  "dados": {
    "mensagem": "Bem-vindo! Como posso ajudar?"
  },
  "ordem": 1
}
```

Tipos de no: MENSAGEM, PERGUNTA, CONDICAO, ACAO, ESPERA, TRANSFERIR

### PUT /chatbot/fluxos/:fluxoId/nos/:id
Atualiza no.

### DELETE /chatbot/fluxos/:fluxoId/nos/:id
Remove no.

---

## Respostas Rapidas

### GET /respostas-rapidas
Lista respostas rapidas.

### POST /respostas-rapidas
Cria resposta rapida.

**Body:**
```json
{
  "titulo": "Horario de Funcionamento",
  "atalho": "/horario",
  "conteudo": "Funcionamos de segunda a sexta, das 9h as 18h."
}
```

### PUT /respostas-rapidas/:id
Atualiza resposta.

### DELETE /respostas-rapidas/:id
Remove resposta.

---

## Campanhas

### GET /campanhas
Lista campanhas.

**Query:**
- `pagina`, `limite`
- `status` - RASCUNHO, AGENDADA, EM_ANDAMENTO, PAUSADA, CONCLUIDA, CANCELADA

### GET /campanhas/:id
Obtem campanha.

### POST /campanhas
Cria campanha.

**Body:**
```json
{
  "nome": "Black Friday",
  "descricao": "Promocao de novembro",
  "conexaoId": "uuid",
  "mensagem": "Aproveite 50% de desconto!",
  "filtroEtiquetas": ["uuid1"]
}
```

### PUT /campanhas/:id
Atualiza campanha.

### DELETE /campanhas/:id
Remove campanha (apenas RASCUNHO).

### POST /campanhas/:id/preparar
Prepara campanha (gera logs).

### POST /campanhas/:id/agendar
Agenda campanha.

**Body:**
```json
{
  "agendadaPara": "2026-01-25T10:00:00Z"
}
```

### POST /campanhas/:id/iniciar
Inicia campanha.

### POST /campanhas/:id/pausar
Pausa campanha.

### POST /campanhas/:id/cancelar
Cancela campanha.

### GET /campanhas/:id/logs
Lista logs de envio.

---

## Mensagens Agendadas

### GET /mensagens-agendadas
Lista mensagens agendadas.

### POST /mensagens-agendadas
Agenda mensagem individual.

**Body:**
```json
{
  "contatoId": "uuid",
  "conexaoId": "uuid",
  "conteudo": "Lembrete: sua reuniao e amanha!",
  "agendarPara": "2026-01-22T09:00:00Z"
}
```

### GET /mensagens-agendadas/:id
Obtem mensagem agendada.

### PUT /mensagens-agendadas/:id
Atualiza mensagem.

### DELETE /mensagens-agendadas/:id
Cancela mensagem.

### POST /mensagens-agendadas/:id/enviar
Envia imediatamente.

---

## Kanban - Quadros

### GET /kanban/quadros
Lista quadros.

### GET /kanban/quadros/:id
Obtem quadro com colunas e cartoes.

### POST /kanban/quadros
Cria quadro (com colunas padrao).

**Body:**
```json
{
  "nome": "Pipeline de Vendas",
  "descricao": "Acompanhamento de leads"
}
```

### PUT /kanban/quadros/:id
Atualiza quadro.

### DELETE /kanban/quadros/:id
Remove quadro.

### GET /kanban/quadros/:id/estatisticas
Estatisticas do quadro.

---

## Kanban - Colunas

### GET /kanban/quadros/:quadroId/colunas
Lista colunas.

### POST /kanban/quadros/:quadroId/colunas
Cria coluna.

**Body:**
```json
{
  "nome": "Negociacao",
  "cor": "#FFA500"
}
```

### PUT /kanban/quadros/:quadroId/colunas/:id
Atualiza coluna.

### DELETE /kanban/quadros/:quadroId/colunas/:id
Remove coluna (sem cartoes).

### PATCH /kanban/quadros/:quadroId/colunas/reordenar
Reordena colunas.

**Body:**
```json
{
  "colunas": [
    { "id": "uuid1", "ordem": 0 },
    { "id": "uuid2", "ordem": 1 }
  ]
}
```

---

## Kanban - Cartoes

### GET /kanban/quadros/:quadroId/colunas/:colunaId/cartoes
Lista cartoes.

### POST /kanban/quadros/:quadroId/colunas/:colunaId/cartoes
Cria cartao.

**Body:**
```json
{
  "titulo": "Lead - Empresa ABC",
  "descricao": "Interessado no plano Enterprise",
  "contatoId": "uuid",
  "valor": 50000,
  "dataLimite": "2026-02-01"
}
```

### PUT /kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id
Atualiza cartao.

### DELETE /kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id
Remove cartao.

### POST /kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id/mover
Move cartao para outra coluna.

**Body:**
```json
{
  "colunaDestinoId": "uuid",
  "ordem": 0
}
```

---

## Agendamento - Compromissos

### GET /agendamento/compromissos
Lista compromissos.

**Query:**
- `pagina`, `limite`
- `dataInicio`, `dataFim`
- `contatoId`

### GET /agendamento/compromissos/hoje
Compromissos de hoje.

### GET /agendamento/compromissos/proximos
Proximos compromissos.

### GET /agendamento/compromissos/estatisticas
Estatisticas da agenda.

### GET /agendamento/compromissos/:id
Obtem compromisso.

### POST /agendamento/compromissos
Cria compromisso.

**Body:**
```json
{
  "titulo": "Reuniao com Cliente",
  "descricao": "Apresentar proposta",
  "contatoId": "uuid",
  "dataHora": "2026-01-22T14:00:00Z",
  "duracaoMin": 60,
  "lembreteMin": 30
}
```

### PUT /agendamento/compromissos/:id
Atualiza compromisso.

### DELETE /agendamento/compromissos/:id
Remove compromisso.

---

## Agendamento - Lembretes

### GET /agendamento/compromissos/:compromissoId/lembretes
Lista lembretes.

### POST /agendamento/compromissos/:compromissoId/lembretes
Cria lembrete.

**Body:**
```json
{
  "enviarEm": "2026-01-22T13:30:00Z"
}
```

### PUT /agendamento/compromissos/:compromissoId/lembretes/:id
Atualiza lembrete.

### DELETE /agendamento/compromissos/:compromissoId/lembretes/:id
Remove lembrete.

---

## Relatorios

### GET /relatorios/conversas
Relatorio de conversas.

**Query (obrigatorios):**
- `dataInicio` - ISO date
- `dataFim` - ISO date

**Query (opcionais):**
- `canalId`
- `atendenteId`
- `equipeId`

### GET /relatorios/campanhas
Relatorio de campanhas.

**Query:**
- `dataInicio`, `dataFim` (obrigatorios)
- `status`

### GET /relatorios/kanban
Relatorio de kanban.

**Query:**
- `quadroId` (opcional)

### GET /relatorios/contatos
Relatorio de contatos.

**Query:**
- `dataInicio`, `dataFim` (obrigatorios)

---

## Dashboard

### GET /dashboard
Dashboard geral com metricas.

**Resposta:**
```json
{
  "sucesso": true,
  "dados": {
    "contatos": { "total": 150 },
    "conversas": {
      "total": 500,
      "abertas": 25,
      "hoje": 12,
      "mensagensHoje": 45
    },
    "campanhas": { "total": 10, "ativas": 2 },
    "kanban": {
      "quadros": 3,
      "cartoes": 45,
      "valorTotal": 250000
    },
    "agenda": { "compromissosHoje": 5 }
  }
}
```

### GET /dashboard/atividades
Atividades recentes.

**Query:**
- `limite` (default: 10)

### GET /dashboard/grafico-conversas
Conversas dos ultimos 7 dias.

### GET /dashboard/kanban
Resumo dos quadros kanban.

---

## Codigos de Erro

| Codigo | Descricao |
|--------|-----------|
| `NAO_AUTENTICADO` | Token nao fornecido |
| `TOKEN_INVALIDO` | Token invalido ou expirado |
| `SEM_PERMISSAO` | Permissao insuficiente |
| `NAO_ENCONTRADO` | Recurso nao encontrado |
| `VALIDACAO` | Erro de validacao |
| `CONFLITO` | Conflito (ex: email duplicado) |
| `ERRO_INTERNO` | Erro interno do servidor |

## Formato de Resposta

### Sucesso
```json
{
  "sucesso": true,
  "dados": { ... },
  "mensagem": "Operacao realizada com sucesso"
}
```

### Erro
```json
{
  "erro": "Mensagem de erro",
  "codigo": "CODIGO_ERRO"
}
```

### Lista Paginada
```json
{
  "sucesso": true,
  "dados": [ ... ],
  "paginacao": {
    "pagina": 1,
    "limite": 20,
    "total": 100,
    "totalPaginas": 5
  }
}
```
