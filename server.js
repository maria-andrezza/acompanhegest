import express from "express";
import bcrypt from "bcrypt";
import pg from "pg";

const { Pool } = pg;

// CONEXÃO DIRETA COM NEON
const connectionString =
  "postgresql://neondb_owner:npg_qNL8ZPsiXOu2@ep-falling-river-amskzp6n-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("."));

// Testar conexão com o banco
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erro ao conectar no Neon:", err.message);
  } else {
    console.log("✅ Conectado ao Neon com sucesso!");
    release();
  }
});

// ==================== AUTENTICAÇÃO ====================

// Rota de registro
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  if (password.length < 4) {
    return res
      .status(400)
      .json({ error: "Senha deve ter no mínimo 4 caracteres" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash],
    );

    console.log(`✅ Usuário criado: ${username}`);
    res
      .status(201)
      .json({ success: true, message: "Usuário criado com sucesso" });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota de login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
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

    console.log(`✅ Login realizado: ${username}`);
    res.json({ success: true, username });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// Rota de verificação de sessão
app.post("/api/verificar-sessao", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ valid: false });
  }

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    res.json({ valid: result.rows.length > 0 });
  } catch (error) {
    console.error("Erro na verificação:", error);
    res.status(500).json({ valid: false });
  }
});

// ==================== CONSULTAS ====================

// Salvar consulta
app.post("/api/consultas", async (req, res) => {
  const { username, especialidade, data, achados } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: "Usuário e data são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO consultas (username, especialidade, data, achados) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, especialidade, data, achados],
    );
    console.log(`✅ Consulta salva para ${username}`);
    res.status(201).json({ success: true, consulta: result.rows[0] });
  } catch (error) {
    console.error("Erro ao salvar consulta:", error);
    res.status(500).json({ error: "Erro ao salvar consulta" });
  }
});

// Buscar todas consultas do usuário
app.get("/api/consultas/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM consultas WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    res.status(500).json({ error: "Erro ao buscar consultas" });
  }
});

// ==================== EXAMES ====================

// Salvar exame
app.post("/api/exames", async (req, res) => {
  const { username, tipo, valor, data } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: "Usuário e data são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO exames (username, tipo, valor, data) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, tipo, valor, data],
    );
    console.log(`✅ Exame salvo para ${username}`);
    res.status(201).json({ success: true, exame: result.rows[0] });
  } catch (error) {
    console.error("Erro ao salvar exame:", error);
    res.status(500).json({ error: "Erro ao salvar exame" });
  }
});

// Buscar todos exames do usuário
app.get("/api/exames/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM exames WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar exames:", error);
    res.status(500).json({ error: "Erro ao buscar exames" });
  }
});

// ==================== REGISTROS DIÁRIOS ====================

// Salvar registro diário
app.post("/api/registros-diarios", async (req, res) => {
  const { username, data, peso, pressao, sintomas } = req.body;

  if (!username || !data) {
    return res.status(400).json({ error: "Usuário e data são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO registros_diarios (username, data, peso, pressao, sintomas) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, data, peso, pressao, sintomas],
    );
    console.log(`✅ Registro diário salvo para ${username}`);
    res.status(201).json({ success: true, registro: result.rows[0] });
  } catch (error) {
    console.error("Erro ao salvar registro diário:", error);
    res.status(500).json({ error: "Erro ao salvar registro diário" });
  }
});

// Buscar todos registros diários do usuário
app.get("/api/registros-diarios/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM registros_diarios WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar registros diários:", error);
    res.status(500).json({ error: "Erro ao buscar registros diários" });
  }
});

// ==================== CARREGAR TODOS OS DADOS ====================

// Carregar todos os dados do usuário de uma vez
app.get("/api/todos-dados/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const [consultas, exames, registrosDiarios] = await Promise.all([
      pool.query(
        "SELECT * FROM consultas WHERE username = $1 ORDER BY data DESC",
        [username],
      ),
      pool.query(
        "SELECT * FROM exames WHERE username = $1 ORDER BY data DESC",
        [username],
      ),
      pool.query(
        "SELECT * FROM registros_diarios WHERE username = $1 ORDER BY data DESC",
        [username],
      ),
    ]);

    res.json({
      consultas: consultas.rows,
      exames: exames.rows,
      registrosDiarios: registrosDiarios.rows,
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    res.status(500).json({ error: "Erro ao carregar dados" });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`\n🌸 AcompanheGest rodando em http://localhost:${PORT}`);
  console.log(`📝 Acesse: http://localhost:${PORT}/login.html\n`);
});
