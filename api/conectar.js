// A Vercel injeta automaticamente o process.env.DATABASE_URL
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()"); // Testa a conexão
    client.release();
    res
      .status(200)
      .json({ status: "Conectado ao Neon!", serverTime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
