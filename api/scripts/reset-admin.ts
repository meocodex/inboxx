import 'dotenv/config';
import postgres from 'postgres';
import argon2 from 'argon2';

const sql = postgres(process.env.DATABASE_URL!);

async function resetAdmin() {
  console.log('Resetando senha do admin...\n');

  // Hash da nova senha
  const novaSenha = 'admin123';
  const novoHash = await argon2.hash(novaSenha, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Verificar se usuário existe
  const usuarios = await sql`
    SELECT id, email, nome, ativo
    FROM usuarios
    WHERE email = 'admin@admin.com'
  `;

  if (usuarios.length === 0) {
    console.log('Usuário admin não existe. Criando...');

    // Buscar ou criar perfil SUPER_ADMIN
    let perfil = await sql`
      SELECT id FROM perfis WHERE nome = 'SUPER_ADMIN' LIMIT 1
    `;

    if (perfil.length === 0) {
      const [novoPerfil] = await sql`
        INSERT INTO perfis (cliente_id, nome, descricao, permissoes, editavel)
        VALUES (NULL, 'SUPER_ADMIN', 'Administrador da plataforma', ARRAY['*'], false)
        RETURNING id
      `;
      perfil = [novoPerfil];
      console.log('Perfil SUPER_ADMIN criado');
    }

    // Criar usuário
    await sql`
      INSERT INTO usuarios (cliente_id, perfil_id, nome, email, senha_hash, ativo)
      VALUES (NULL, ${perfil[0].id}, 'Super Admin', 'admin@admin.com', ${novoHash}, true)
    `;
    console.log('Usuário admin criado');
  } else {
    console.log('Usuário encontrado:', usuarios[0]);

    // Atualizar senha
    await sql`
      UPDATE usuarios
      SET senha_hash = ${novoHash},
          ativo = true
      WHERE email = 'admin@admin.com'
    `;
    console.log('Senha atualizada');
  }

  console.log('\n========================================');
  console.log('Admin resetado com sucesso!');
  console.log('========================================');
  console.log('Email:  admin@admin.com');
  console.log('Senha:  admin123');
  console.log('========================================');

  await sql.end();
  process.exit(0);
}

resetAdmin().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
