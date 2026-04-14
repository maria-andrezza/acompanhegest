// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Rota de health check (DEVE SER A PRIMEIRA ROTA API)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "API funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Rota de registro
app.post("/api/register", async (req, res) => {
  // ... seu código
});

// Rota de login
app.post("/api/login", async (req, res) => {
  // ... seu código
});

// Rota de verificação de sessão
app.post("/api/verificar-sessao", async (req, res) => {
  // ... seu código
});

// ==================== ROTAS DE DADOS ====================

// Salvar consulta
app.post("/api/consultas", async (req, res) => {
  const { username, especialidade, data, achados } = req.body;
  try {
    await pool.query(
      "INSERT INTO consultas (username, especialidade, data, achados) VALUES ($1, $2, $3, $4)",
      [username, especialidade, data, achados],
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar consulta" });
  }
});

// Buscar consultas
app.get("/api/consultas/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM consultas WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar consultas" });
  }
});

// Salvar exame
app.post("/api/exames", async (req, res) => {
  const { username, tipo, valor, data } = req.body;
  try {
    await pool.query(
      "INSERT INTO exames (username, tipo, valor, data) VALUES ($1, $2, $3, $4)",
      [username, tipo, valor, data],
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar exame" });
  }
});

// Buscar exames
app.get("/api/exames/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM exames WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar exames" });
  }
});

// Salvar registro diário
app.post("/api/registros-diarios", async (req, res) => {
  const { username, data, peso, pressao, sintomas } = req.body;
  try {
    await pool.query(
      "INSERT INTO registros_diarios (username, data, peso, pressao, sintomas) VALUES ($1, $2, $3, $4, $5)",
      [username, data, peso, pressao, sintomas],
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar registro diário" });
  }
});

// Buscar registros diários
app.get("/api/registros-diarios/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM registros_diarios WHERE username = $1 ORDER BY data DESC",
      [username],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar registros diários" });
  }
});

// Buscar todos os dados
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

// ==================== ARQUIVOS ESTÁTICOS ====================
app.use(express.static("."));

// ==================== CATCH-ALL ====================
// Isso deve ser a ÚLTIMA rota
app.get("*", (req, res) => {
  if (req.url.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile("login.html", { root: "." });
});

// Export para Vercel
export default app;

// Servidor local
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log(`🌸 Servidor rodando em http://localhost:3000`);
  });
}
