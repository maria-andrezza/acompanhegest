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
    rejectUnauthorized: false, // necessário para Neon
  },
});

const app = express();
const PORT = 3000;

// ==================== MIDDLEWARES ====================
app.use(express.json());

// ⚠️ IMPORTANTE: ROTAS DA API ANTES do express.static
// Se o static ficar antes, o Express tenta servir pastas/arquivos ao invés de executar as rotas dinâmicas

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Rota de registro
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  // ... (seu código atual permanece igual)
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
  // ... (seu código atual)
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

// ==================== ROTAS DE DADOS ====================

// Salvar consulta
app.post("/api/consultas", async (req, res) => {
  /* seu código atual */
});

// Buscar consultas
app.get("/api/consultas/:username", async (req, res) => {
  /* seu código atual */
});

// Salvar exame
app.post("/api/exames", async (req, res) => {
  /* seu código atual */
});

// Buscar exames
app.get("/api/exames/:username", async (req, res) => {
  /* seu código atual */
});

// Salvar registro diário
app.post("/api/registros-diarios", async (req, res) => {
  /* seu código atual */
});

// Buscar registros diários
app.get("/api/registros-diarios/:username", async (req, res) => {
  /* seu código atual */
});

// ✅ ROTA QUE ESTAVA DANDO 404
app.get("/api/todos-dados/:username", async (req, res) => {
  const { username } = req.params;
  console.log(`📡 Rota /api/todos-dados acessada para usuário: ${username}`);

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
    console.error("Erro ao carregar todos os dados:", error);
    res.status(500).json({ error: "Erro ao carregar dados" });
  }
});

// ==================== ARQUIVOS ESTÁTICOS (DEVE FICAR NO FINAL) ====================
app.use(express.static("."));

// ==================== TESTE DE CONEXÃO ====================
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erro ao conectar no Neon:", err.message);
  } else {
    console.log("✅ Conectado ao Neon com sucesso!");
    release();
  }
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`\n🌸 AcompanheGest rodando em http://localhost:${PORT}`);
  console.log(`📝 Acesse: http://localhost:${PORT}/login.html\n`);
});
