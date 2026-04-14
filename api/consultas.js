import { db } from "@vercel/postgres";

export default async function handler(req, res) {
  const client = await db.connect();

  try {
    if (req.method === "POST") {
      const { username, especialidade, data, achados } = req.body;
      if (!username)
        return res.status(400).json({ error: "Usuário não informado" });

      await client.sql`
        INSERT INTO consultas (username, especialidade, data, achados)
        VALUES (${username}, ${especialidade}, ${data}, ${achados})
      `;
      return res.status(201).json({ success: true });
    } else if (req.method === "GET") {
      const { username } = req.query;
      if (!username)
        return res.status(400).json({ error: "Usuário não informado" });

      const result = await client.sql`
        SELECT * FROM consultas WHERE username = ${username} ORDER BY data DESC
      `;
      return res.status(200).json(result.rows);
    } else {
      return res.status(405).json({ error: "Método não permitido" });
    }
  } catch (error) {
    console.error("Erro em /api/consultas:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    client.release();
  }
}
