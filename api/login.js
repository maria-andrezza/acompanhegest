import { db } from "@vercel/postgres";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  const client = await db.connect();

  try {
    const result = await client.sql`
      SELECT id, username, password_hash FROM users WHERE username = ${username}
    `;

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isValid = await bcrypt.compare(
      password,
      result.rows[0].password_hash,
    );

    if (!isValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    res.status(200).json({ success: true, username });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    client.release();
  }
}
