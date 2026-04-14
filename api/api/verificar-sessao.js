import { db } from "@vercel/postgres";

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { username } = req.body;

  if (!username) {
    return res
      .status(400)
      .json({ valid: false, error: "Usuário não informado" });
  }

  const client = await db.connect();

  try {
    // Verifica se o usuário existe no banco
    const result = await client.sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ valid: false, error: "Usuário não encontrado" });
    }

    // Usuário existe e está ativo
    return res.status(200).json({
      valid: true,
      username: username,
      message: "Sessão válida",
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return res.status(500).json({ valid: false, error: "Erro interno" });
  } finally {
    client.release();
  }
}
