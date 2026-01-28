import 'dotenv/config';
import postgres from 'postgres';
import { hashSenha } from './src/compartilhado/utilitarios/criptografia.js';

const sql = postgres(process.env.DATABASE_URL!);

async function seed() {
  console.log('Criando cliente e admin...\n');

  // 1. Buscar plano existente
  const [plano] = await sql`SELECT id FROM planos LIMIT 1`;
  if (!plano) {
    console.error('Nenhum plano encontrado. Execute o seed inicial primeiro.');
    process.exit(1);
  }
  console.log('Plano encontrado:', plano.id);

  // 2. Criar cliente (tenant)
  const [cliente] = await sql`
    INSERT INTO clientes (nome, email, telefone, documento, plano_id, ativo)
    VALUES (
      'Empresa Demo',
      'contato@empresa.com',
      '+5511999999999',
      '12345678000100',
      ${plano.id},
      true
    )
    RETURNING id, nome
  `;
  console.log('Cliente criado:', cliente.nome, '(' + cliente.id + ')');

  // 3. Criar perfil ADMIN_CLIENTE para este cliente
  const [perfil] = await sql`
    INSERT INTO perfis (cliente_id, nome, descricao, permissoes, editavel)
    VALUES (
      ${cliente.id},
      'ADMIN_CLIENTE',
      'Administrador do cliente',
      ARRAY['*'],
      false
    )
    RETURNING id, nome
  `;
  console.log('Perfil criado:', perfil.nome, '(' + perfil.id + ')');

  // 4. Criar usuario admin do cliente
  const senhaHash = await hashSenha('admin123');

  const [usuario] = await sql`
    INSERT INTO usuarios (cliente_id, perfil_id, nome, email, senha_hash, ativo)
    VALUES (
      ${cliente.id},
      ${perfil.id},
      'Admin Empresa',
      'admin@empresa.com',
      ${senhaHash},
      true
    )
    RETURNING id, nome, email
  `;
  console.log('Usuario criado:', usuario.nome, '-', usuario.email);

  console.log('\n========================================');
  console.log('Cliente criado com sucesso!');
  console.log('========================================');
  console.log('Email:  admin@empresa.com');
  console.log('Senha:  admin123');
  console.log('Perfil: ADMIN_CLIENTE');
  console.log('========================================');

  await sql.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
