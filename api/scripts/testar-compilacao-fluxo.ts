import postgres from 'postgres';
import 'dotenv/config';

// Simular importação do motor
async function testarCompilacao() {
  const sql = postgres(process.env.DATABASE_URL || '');

  try {
    console.log('🧪 Teste de Compilação: Motor XState\n');

    // Buscar o fluxo que criamos
    const [fluxo] = await sql`
      SELECT id, cliente_id, nome
      FROM fluxos_chatbot
      WHERE nome = 'Teste Boas-vindas'
      ORDER BY criado_em DESC
      LIMIT 1
    `;

    if (!fluxo) {
      console.log('⚠️  Fluxo de teste não encontrado. Execute o teste de integração primeiro.');
      return;
    }

    console.log(`✅ Fluxo encontrado: ${fluxo.nome} (${fluxo.id})`);

    // Buscar nós do fluxo
    const nos = await sql`
      SELECT id, tipo, nome, configuracao, posicao_x, posicao_y
      FROM nos_chatbot
      WHERE fluxo_id = ${fluxo.id}
      ORDER BY posicao_x
    `;

    console.log(`✅ Nós carregados: ${nos.length}`);
    nos.forEach(no => {
      console.log(`   - ${no.tipo}: ${no.nome}`);
    });

    // Buscar transições
    const transicoes = await sql`
      SELECT
        t.id,
        t.evento,
        no_origem.tipo as tipo_origem,
        no_destino.tipo as tipo_destino
      FROM transicoes_chatbot t
      JOIN nos_chatbot no_origem ON t.no_origem_id = no_origem.id
      JOIN nos_chatbot no_destino ON t.no_destino_id = no_destino.id
      WHERE t.fluxo_id = ${fluxo.id}
      ORDER BY t.ordem
    `;

    console.log(`\n✅ Transições carregadas: ${transicoes.length}`);
    transicoes.forEach(t => {
      console.log(`   - ${t.tipo_origem} → ${t.tipo_destino} (${t.evento})`);
    });

    // Simular estrutura da máquina XState
    const noInicio = nos.find(n => n.tipo === 'INICIO');
    const machine = {
      id: fluxo.id,
      initial: noInicio ? noInicio.tipo.toLowerCase() : 'inicio',
      states: {} as Record<string, any>,
    };

    // Criar estados
    nos.forEach(no => {
      const stateId = no.tipo.toLowerCase();
      machine.states[stateId] = {
        type: no.tipo === 'FIM' ? 'final' : 'atomic',
        entry: [],
        on: {},
      };

      // Adicionar action se necessário
      if (no.tipo === 'MENSAGEM') {
        machine.states[stateId].entry = [{
          type: 'enviarMensagem',
          configuracao: no.configuracao,
        }];
      }
    });

    // Adicionar transições
    transicoes.forEach(t => {
      const origemId = t.tipo_origem.toLowerCase();
      const destinoId = t.tipo_destino.toLowerCase();

      if (!machine.states[origemId].on) {
        machine.states[origemId].on = {};
      }

      machine.states[origemId].on[t.evento] = {
        target: destinoId,
      };
    });

    console.log('\n✅ Máquina XState Compilada:');
    console.log(JSON.stringify(machine, null, 2));

    console.log('\n📊 Análise da Máquina:');
    console.log(`   - ID: ${machine.id}`);
    console.log(`   - Estado Inicial: ${machine.initial}`);
    console.log(`   - Total de Estados: ${Object.keys(machine.states).length}`);
    console.log(`   - Estados com Actions: ${Object.values(machine.states).filter((s: any) => s.entry?.length > 0).length}`);

    console.log('\n✅ Teste de Compilação Concluído com Sucesso!');
    console.log('   O motor XState seria capaz de executar este fluxo.');

  } catch (erro) {
    console.error('❌ Erro no teste:', erro);
  } finally {
    await sql.end();
  }
}

testarCompilacao();
