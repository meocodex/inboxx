import 'dotenv/config';
import postgres from 'postgres';
import { hashSenha } from './src/compartilhado/utilitarios/criptografia.js';

const sql = postgres(process.env.DATABASE_URL!);

async function seed() {
  console.log('Criando seed inicial...\n');

  // 1. Criar plano padrao
  const [plano] = await sql`
    INSERT INTO planos (nome, descricao, preco_mensal, limites, recursos, ativo)
    VALUES (
      'Plano Inicial',
      'Plano padrao do sistema',
      0,
      '{"maxUsuarios": 999, "maxConexoes": 99, "maxContatos": 999999}'::jsonb,
      '{"whatsapp": true, "chatbot": true, "campanhas": true, "kanban": true, "relatorios": true}'::jsonb,
      true
    )
    RETURNING id, nome
  `;
  console.log('Plano criado:', plano.nome, '(' + plano.id + ')');

  // 2. Criar perfil SUPER_ADMIN (sem cliente - global)
  const [perfil] = await sql`
    INSERT INTO perfis (cliente_id, nome, descricao, permissoes, editavel)
    VALUES (
      NULL,
      'SUPER_ADMIN',
      'Administrador da plataforma',
      ARRAY['*'],
      false
    )
    RETURNING id, nome
  `;
  console.log('Perfil criado:', perfil.nome, '(' + perfil.id + ')');

  // 3. Criar senha hash
  const senhaPlana = 'admin123';
  const senhaHash = await hashSenha(senhaPlana);
  console.log('Senha hasheada com sucesso');

  // 4. Criar usuario super admin (sem cliente_id)
  const [usuario] = await sql`
    INSERT INTO usuarios (cliente_id, perfil_id, nome, email, senha_hash, ativo)
    VALUES (
      NULL,
      ${perfil.id},
      'Super Admin',
      'admin@admin.com',
      ${senhaHash},
      true
    )
    RETURNING id, nome, email
  `;
  console.log('Usuario criado:', usuario.nome, '-', usuario.email, '(' + usuario.id + ')');

  console.log('\n========================================');
  console.log('Seed concluido com sucesso!');
  console.log('========================================');
  console.log('Email:  admin@admin.com');
  console.log('Senha:  admin123');
  console.log('========================================');

  await sql.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
