import { db } from "@vercel/postgres";

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Usuário não informado" });
  }

  const client = await db.connect();

  try {
    const [consultas, exames, registrosDiarios] = await Promise.all([
      client.sql`SELECT * FROM consultas WHERE username = ${username} ORDER BY data DESC`,
      client.sql`SELECT * FROM exames WHERE username = ${username} ORDER BY data DESC`,
      client.sql`SELECT * FROM registros_diarios WHERE username = ${username} ORDER BY data DESC`,
    ]);

    res.status(200).json({
      consultas: consultas.rows,
      exames: exames.rows,
      registrosDiarios: registrosDiarios.rows,
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    client.release();
  }
}
