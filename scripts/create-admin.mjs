// Uso: npm run admin:create -- email@exemplo.com "Seu Nome" senha
// Se o e-mail ja existir, a conta e promovida a administradora (a senha nao muda).
import bcrypt from "bcryptjs";
import pg from "pg";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Uso: npm run admin:create -- email@exemplo.com "Seu Nome" senha');
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const hash = await bcrypt.hash(password, 12);
await client.query(
  `insert into users (name, email, password_hash, role) values ($1, lower($2), $3, 'admin')
   on conflict (email) do update set role = 'admin'`,
  [name, email, hash],
);
await client.end();
console.log(`Administrador pronto: ${email}`);
