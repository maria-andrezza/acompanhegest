// /api/register.js
import { db } from "@vercel/postgres";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  // Validações detalhadas
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Formato inválido" });
  }

  // Validar username (apenas letras, números e underscore)
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res
      .status(400)
      .json({
        error: "Usuário deve ter 3-20 caracteres (letras, números ou _)",
      });
  }

  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Senha deve ter no mínimo 4 caracteres" });
  }

  const client = await db.connect();

  try {
    // Verificar se usuário já existe
    const existing = await client.sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Este usuário já existe" });
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserir novo usuário
    await client.sql`
      INSERT INTO users (username, password_hash, created_at)
      VALUES (${username}, ${passwordHash}, NOW())
    `;

    return res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    client.release();
  }
}
