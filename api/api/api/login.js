// /api/login.js
import { db } from "@vercel/postgres";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  // Configurar CORS para desenvolvimento
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Permitir apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username, password } = req.body;

  // Validações
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Formato inválido" });
  }

  const client = await db.connect();

  try {
    // Buscar usuário no banco
    const result = await client.sql`
      SELECT id, username, password_hash FROM users WHERE username = ${username}
    `;

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const user = result.rows[0];

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    // Login bem-sucedido
    return res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      username: user.username,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    client.release();
  }
}
