import postgres from 'postgres';
import 'dotenv/config';
import crypto from 'crypto';

async function testarFluxo() {
  const sql = postgres(process.env.DATABASE_URL || '');

  try {
    console.log('🧪 Teste de Integração: Criando fluxo de teste\n');

    // 1. Buscar um cliente existente
    const [cliente] = await sql`SELECT id FROM clientes LIMIT 1`;
    if (!cliente) {
      console.log('⚠️  Nenhum cliente encontrado no banco. Execute o seed primeiro.');
      return;
    }

    console.log(`✅ Cliente encontrado: ${cliente.id}`);

    // 2. Criar fluxo de teste
    const fluxoId = crypto.randomUUID();
    await sql`
      INSERT INTO fluxos_chatbot (id, cliente_id, nome, descricao, gatilho, ativo, criado_em, atualizado_em)
      VALUES (
        ${fluxoId},
        ${cliente.id},
        'Teste Boas-vindas',
        'Fluxo de teste automático',
        ${{
          tipo: 'PRIMEIRA_MENSAGEM',
          palavrasChave: []
        }}::jsonb,
        true,
        NOW(),
        NOW()
      )
    `;
    console.log(`✅ Fluxo criado: ${fluxoId}`);

    // 3. Criar nó INICIO
    const noInicioId = crypto.randomUUID();
    await sql`
      INSERT INTO nos_chatbot (id, cliente_id, fluxo_id, tipo, nome, configuracao, posicao_x, posicao_y)
      VALUES (
        ${noInicioId},
        ${cliente.id},
        ${fluxoId},
        'INICIO',
        'Início',
        '{}'::jsonb,
        0,
        0
      )
    `;
    console.log(`✅ Nó INICIO criado: ${noInicioId}`);

    // 4. Criar nó MENSAGEM
    const noMensagemId = crypto.randomUUID();
    await sql`
      INSERT INTO nos_chatbot (id, cliente_id, fluxo_id, tipo, nome, configuracao, posicao_x, posicao_y)
      VALUES (
        ${noMensagemId},
        ${cliente.id},
        ${fluxoId},
        'MENSAGEM',
        'Boas-vindas',
        ${{ mensagem: 'Olá! Bem-vindo ao nosso atendimento automático. Como posso ajudar?' }}::jsonb,
        200,
        0
      )
    `;
    console.log(`✅ Nó MENSAGEM criado: ${noMensagemId}`);

    // 5. Criar nó FIM
    const noFimId = crypto.randomUUID();
    await sql`
      INSERT INTO nos_chatbot (id, cliente_id, fluxo_id, tipo, nome, configuracao, posicao_x, posicao_y)
      VALUES (
        ${noFimId},
        ${cliente.id},
        ${fluxoId},
        'FIM',
        'Fim',
        '{}'::jsonb,
        400,
        0
      )
    `;
    console.log(`✅ Nó FIM criado: ${noFimId}`);

    // 6. Criar transições
    const transicao1Id = crypto.randomUUID();
    await sql`
      INSERT INTO transicoes_chatbot (id, fluxo_id, no_origem_id, no_destino_id, evento, ordem, criado_em)
      VALUES (
        ${transicao1Id},
        ${fluxoId},
        ${noInicioId},
        ${noMensagemId},
        'PROXIMO',
        0,
        NOW()
      )
    `;
    console.log(`✅ Transição INICIO → MENSAGEM criada`);

    const transicao2Id = crypto.randomUUID();
    await sql`
      INSERT INTO transicoes_chatbot (id, fluxo_id, no_origem_id, no_destino_id, evento, ordem, criado_em)
      VALUES (
        ${transicao2Id},
        ${fluxoId},
        ${noMensagemId},
        ${noFimId},
        'PROXIMO',
        0,
        NOW()
      )
    `;
    console.log(`✅ Transição MENSAGEM → FIM criada`);

    // 7. Verificar estrutura criada
    const [fluxo] = await sql`
      SELECT
        f.nome,
        f.ativo,
        f.gatilho,
        COUNT(DISTINCT n.id) as total_nos,
        COUNT(DISTINCT t.id) as total_transicoes
      FROM fluxos_chatbot f
      LEFT JOIN nos_chatbot n ON n.fluxo_id = f.id
      LEFT JOIN transicoes_chatbot t ON t.fluxo_id = f.id
      WHERE f.id = ${fluxoId}
      GROUP BY f.id, f.nome, f.ativo, f.gatilho
    `;

    console.log('\n📊 Estrutura do Fluxo Criado:');
    console.log(`   Nome: ${fluxo.nome}`);
    console.log(`   Ativo: ${fluxo.ativo}`);
    console.log(`   Gatilho: ${JSON.stringify(fluxo.gatilho)}`);
    console.log(`   Nós: ${fluxo.total_nos}`);
    console.log(`   Transições: ${fluxo.total_transicoes}`);

    console.log('\n✅ Teste de Integração Concluído com Sucesso!');
    console.log(`\n💡 Fluxo ID: ${fluxoId}`);
    console.log('   Este fluxo será ativado na primeira mensagem de qualquer conversa nova.');

  } catch (erro) {
    console.error('❌ Erro no teste:', erro);
  } finally {
    await sql.end();
  }
}

testarFluxo();
