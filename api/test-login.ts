import { db } from './src/infraestrutura/banco/drizzle.servico.js';
import { usuarios, perfis } from './src/infraestrutura/banco/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { verificarSenha } from './src/compartilhado/utilitarios/criptografia.js';

async function testarLogin() {
  console.log('====================================');
  console.log('TESTE DE LOGIN - admin@admin.com');
  console.log('====================================\n');

  const email = 'admin@admin.com';
  const senha = 'admin123';

  try {
    console.log('1. Buscando usuario no banco...');

    const resultado = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        senhaHash: usuarios.senhaHash,
        clienteId: usuarios.clienteId,
        perfilId: usuarios.perfilId,
        ativo: usuarios.ativo,
        perfil: {
          id: perfis.id,
          nome: perfis.nome,
          permissoes: perfis.permissoes,
        },
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true)))
      .limit(1);

    console.log('Resultado da query:', JSON.stringify(resultado, null, 2));

    if (resultado.length === 0) {
      console.log('\n❌ ERRO: Usuario nao encontrado ou inativo');
      process.exit(1);
    }

    const usuario = resultado[0];

    if (!usuario.perfil || !usuario.perfil.id) {
      console.log('\n❌ ERRO: Perfil nao encontrado para o usuario');
      console.log('Usuario:', usuario);
      process.exit(1);
    }

    console.log('\n✅ Usuario encontrado:');
    console.log('   ID:', usuario.id);
    console.log('   Nome:', usuario.nome);
    console.log('   Email:', usuario.email);
    console.log('   Cliente ID:', usuario.clienteId);
    console.log('   Perfil ID:', usuario.perfilId);
    console.log('   Perfil Nome:', usuario.perfil.nome);
    console.log('   Permissoes:', usuario.perfil.permissoes);

    console.log('\n2. Verificando senha...');
    const senhaValida = await verificarSenha(senha, usuario.senhaHash);

    if (!senhaValida) {
      console.log('\n❌ ERRO: Senha invalida');
      console.log('   Hash armazenado:', usuario.senhaHash.substring(0, 20) + '...');
      process.exit(1);
    }

    console.log('✅ Senha valida');

    console.log('\n====================================');
    console.log('✅ LOGIN SERIA REALIZADO COM SUCESSO');
    console.log('====================================\n');

    process.exit(0);
  } catch (erro) {
    console.error('\n❌ ERRO durante o teste:', erro);
    process.exit(1);
  }
}

testarLogin();
