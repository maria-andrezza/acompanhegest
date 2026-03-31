// ==================== AcompanheGest - Script Principal ====================
let dadosApp = null;
let usuarioAtual = null;

// Tamanhos do bebê por semana
const tamanhosBebe = {
  4: "semente de papoula",
  8: "framboesa",
  12: "limão",
  16: "abacate",
  20: "banana",
  24: "espiga de milho",
  28: "berinjela",
  32: "abacaxi",
  36: "melão",
  40: "melancia",
};

// Desenvolvimento por semana
const desenvolvimento = {
  12: "O bebê já tem dedos formados e começa a se mexer!",
  16: "Os olhos e ouvidos estão se desenvolvendo. O bebê já ouve sua voz!",
  20: "O bebê já reconhece sua voz! Continue conversando com ele(a).",
  24: "Os pulmões estão se desenvolvendo. O bebê já reage a sons externos.",
  28: "O bebê abre e fecha os olhos. Já tem ciclos de sono definidos.",
  32: "O bebê ganha peso rapidamente. Os ossos estão se fortalecendo.",
  36: "O bebê já está na posição para o nascimento. Continue monitorando os movimentos!",
  40: "Qualquer dia é dia! O bebê está pronto para conhecer o mundo!",
};

function salvarDados() {
  if (usuarioAtual && dadosApp) {
    localStorage.setItem(
      `acompanhegest_dados_${usuarioAtual}`,
      JSON.stringify(dadosApp),
    );
  }
}

function carregarDados() {
  usuarioAtual = getUsuarioAtual();
  if (!usuarioAtual) {
    window.location.href = "login.html";
    return;
  }

  const saved = localStorage.getItem(`acompanhegest_dados_${usuarioAtual}`);
  if (saved) {
    try {
      dadosApp = JSON.parse(saved);
    } catch (e) {
      console.warn("Erro ao carregar dados");
    }
  }

  if (!dadosApp) {
    dadosApp = {
      config: {
        nome: "",
        altura: 0,
        pesoPreGestacional: 0,
        dpp: "",
        nomeBebe: "",
        sexoBebe: "Menina",
      },
      registrosPeso: [],
      pressaoArterial: [],
      movimentosFetais: [],
      sintomas: [],
      exames: [],
      consultas: [],
    };
  }
}

function calcularDiasRestantes() {
  if (!dadosApp.config.dpp) return 0;
  const hoje = new Date();
  const dpp = new Date(dadosApp.config.dpp);
  const diff = Math.ceil((dpp - hoje) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function calcularIdadeGestacional() {
  if (!dadosApp.config.dpp) return { semanas: 0, dias: 0 };
  const hoje = new Date();
  const dpp = new Date(dadosApp.config.dpp);
  const totalDiasGestacao = 280;
  const diasRestantes = calcularDiasRestantes();
  const diasPassados = totalDiasGestacao - diasRestantes;
  const semanas = Math.floor(diasPassados / 7);
  const dias = diasPassados % 7;
  return { semanas: Math.max(0, semanas), dias: Math.max(0, dias) };
}

function getTamanhoBebe(semanas) {
  if (semanas <= 4) return tamanhosBebe[4];
  if (semanas <= 8) return tamanhosBebe[8];
  if (semanas <= 12) return tamanhosBebe[12];
  if (semanas <= 16) return tamanhosBebe[16];
  if (semanas <= 20) return tamanhosBebe[20];
  if (semanas <= 24) return tamanhosBebe[24];
  if (semanas <= 28) return tamanhosBebe[28];
  if (semanas <= 32) return tamanhosBebe[32];
  if (semanas <= 36) return tamanhosBebe[36];
  return tamanhosBebe[40];
}

function getDesenvolvimento(semanas) {
  if (semanas <= 12) return desenvolvimento[12];
  if (semanas <= 16) return desenvolvimento[16];
  if (semanas <= 20) return desenvolvimento[20];
  if (semanas <= 24) return desenvolvimento[24];
  if (semanas <= 28) return desenvolvimento[28];
  if (semanas <= 32) return desenvolvimento[32];
  if (semanas <= 36) return desenvolvimento[36];
  return desenvolvimento[40];
}

function gerarAlertas() {
  const alerts = [];
  const idade = calcularIdadeGestacional();

  // Verificar sintomas recentes
  const sintomasRecentes = dadosApp.sintomas.slice(-3);
  const ultimoSintoma = sintomasRecentes[sintomasRecentes.length - 1];
  if (ultimoSintoma) {
    alerts.push({
      tipo: "success",
      mensagem: `Você relatou "${ultimoSintoma.descricao}" recentemente.`,
    });
  }

  // Verificar recomendações de consultas
  const ultimaConsulta = dadosApp.consultas[dadosApp.consultas.length - 1];
  if (ultimaConsulta && ultimaConsulta.recomendacoes) {
    alerts.push({
      tipo: "success",
      mensagem: `${ultimaConsulta.especialidade} recomendou: "${ultimaConsulta.recomendacoes}". Lembre-se de seguir! 💪`,
    });
  }

  // Verificar pressão
  const ultimaPressao =
    dadosApp.pressaoArterial[dadosApp.pressaoArterial.length - 1];
  if (ultimaPressao) {
    const [sist] = ultimaPressao.valores.split("/").map(Number);
    if (sist >= 140) {
      alerts.push({
        tipo: "critical",
        mensagem: `⚠️ Pressão alta registrada (${ultimaPressao.valores}). Procure atendimento médico!`,
      });
    }
  }

  // Verificar movimentos
  const ultimoMovimento =
    dadosApp.movimentosFetais[dadosApp.movimentosFetais.length - 1];
  if (
    ultimoMovimento &&
    ultimoMovimento.quantidade < 10 &&
    idade.semanas >= 28
  ) {
    alerts.push({
      tipo: "critical",
      mensagem: `⚠️ Poucos movimentos fetais (${ultimoMovimento.quantidade}/hora). Observe e procure ajuda se persistir.`,
    });
  }

  return alerts;
}

function renderizarTudo() {
  renderizarHeader();
  renderizarCardBebe();
  renderizarAlertas();
  renderizarResumoSemana();
  renderizarUltimosRegistros();
  renderizarPeso();
  renderizarPressao();
  renderizarMovimentos();
  renderizarSintomas();
  renderizarExames();
  renderizarConsultas();
  renderizarInsights();
}

function renderizarHeader() {
  const nome = dadosApp.config.nome || "Mamãe";
  document.getElementById("nomeUsuario").innerHTML = nome;

  const nomeBebe = dadosApp.config.nomeBebe || "seu bebê";
  document.getElementById("nomeBebeHeader").innerHTML = nomeBebe;

  const idade = calcularIdadeGestacional();
  document.getElementById("semanasDias").innerHTML =
    `${idade.semanas} sem ${idade.dias} dias`;

  const percentual = (idade.semanas / 40) * 100;
  document.getElementById("progressoBarra").style.width = `${percentual}%`;

  const diasRestantes = calcularDiasRestantes();
  document.getElementById("diasRestantes").innerHTML = diasRestantes;
}

function renderizarCardBebe() {
  const nomeBebe = dadosApp.config.nomeBebe || "Aguardando nome";
  document.getElementById("bebeNome").innerHTML = nomeBebe;

  const idade = calcularIdadeGestacional();
  const tamanho = getTamanhoBebe(idade.semanas);
  document.getElementById("bebeTamanho").innerHTML =
    `É do tamanho de um(a) ${tamanho}! ${idade.semanas >= 12 ? "🍈" : "🌸"}`;

  const sexo = dadosApp.config.sexoBebe || "Menina";
  const sexoIcon = sexo === "Menina" ? "👧" : sexo === "Menino" ? "👦" : "❓";
  document.getElementById("bebeSexo").innerHTML = `${sexoIcon} ${sexo}`;
  document.getElementById("bebeIcone").innerHTML =
    sexo === "Menina" ? "👧" : sexo === "Menino" ? "👦" : "👶";

  const desenvolvimentoTexto = getDesenvolvimento(idade.semanas);
  document.getElementById("desenvolvimento").innerHTML =
    `<strong>Semana ${idade.semanas}</strong> — ${desenvolvimentoTexto}`;
}

function renderizarAlertas() {
  const alerts = gerarAlertas();
  const container = document.getElementById("alertasContainer");

  if (alerts.length === 0) {
    container.innerHTML = `
            <div class="alerta-card success">
                <strong>✨ Tudo bem por aqui!</strong><br>
                Continue cuidando de você e do seu bebê! 💖
            </div>
        `;
    return;
  }

  container.innerHTML = alerts
    .map(
      (alert) => `
        <div class="alerta-card ${alert.tipo === "critical" ? "critical" : "success"}">
            ${alert.mensagem}
        </div>
    `,
    )
    .join("");
}

function renderizarResumoSemana() {
  const idade = calcularIdadeGestacional();
  const container = document.getElementById("resumoSemana");
  container.innerHTML = `
        <p>🌸 <strong>${idade.semanas} semanas</strong> de gestação</p>
        <p>📏 Tamanho do bebê: <strong>${getTamanhoBebe(idade.semanas)}</strong></p>
        <p>💡 ${getDesenvolvimento(idade.semanas)}</p>
    `;
}

function renderizarUltimosRegistros() {
  const container = document.getElementById("ultimosRegistros");
  let html = "";

  const ultimoPeso = dadosApp.registrosPeso[dadosApp.registrosPeso.length - 1];
  if (ultimoPeso) {
    html += `<div class="registro-item">⚖️ Último peso: <strong>${ultimoPeso.peso} kg</strong> em ${new Date(ultimoPeso.data).toLocaleDateString("pt-BR")}</div>`;
  }

  const ultimaPressao =
    dadosApp.pressaoArterial[dadosApp.pressaoArterial.length - 1];
  if (ultimaPressao) {
    html += `<div class="registro-item">❤️ Última pressão: <strong>${ultimaPressao.valores} mmHg</strong></div>`;
  }

  const ultimoMovimento =
    dadosApp.movimentosFetais[dadosApp.movimentosFetais.length - 1];
  if (ultimoMovimento) {
    html += `<div class="registro-item">👶 Últimos movimentos: <strong>${ultimoMovimento.quantidade}</strong> movimentos/hora</div>`;
  }

  if (html === "") {
    html =
      '<div class="empty-state">Nenhum registro ainda. Comece a acompanhar sua gestação! 💖</div>';
  }

  container.innerHTML = html;
}

function renderizarPeso() {
  const grafico = document.getElementById("graficoPeso");
  const lista = document.getElementById("listaPesos");

  if (dadosApp.registrosPeso.length === 0) {
    grafico.innerHTML =
      '<div class="empty-state">Nenhum registro de peso</div>';
    lista.innerHTML = "";
    return;
  }

  const ultimos = dadosApp.registrosPeso.slice(-7);
  grafico.innerHTML = ultimos
    .map(
      (r) => `
        <div class="barra-peso">
            <div class="barra" style="height: ${Math.max(40, r.peso * 1.5)}px;"></div>
            <div>${r.peso}kg</div>
            <div style="font-size: 10px;">${new Date(r.data).toLocaleDateString("pt-BR").slice(0, 5)}</div>
        </div>
    `,
    )
    .join("");

  lista.innerHTML =
    "<strong>📋 Histórico:</strong><br>" +
    dadosApp.registrosPeso
      .slice()
      .reverse()
      .slice(0, 5)
      .map(
        (r) =>
          `<div class="registro-item">${new Date(r.data).toLocaleDateString("pt-BR")}: ${r.peso} kg</div>`,
      )
      .join("");
}

function renderizarPressao() {
  const div = document.getElementById("listaPressao");
  if (dadosApp.pressaoArterial.length === 0) {
    div.innerHTML = '<div class="empty-state">Nenhuma medição de pressão</div>';
    return;
  }
  div.innerHTML = dadosApp.pressaoArterial
    .slice()
    .reverse()
    .map(
      (p) => `
        <div class="registro-item">📅 ${new Date(p.data).toLocaleDateString("pt-BR")}: ${p.valores} mmHg</div>
    `,
    )
    .join("");
}

function renderizarMovimentos() {
  const div = document.getElementById("listaMovimentos");
  if (dadosApp.movimentosFetais.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhum registro de movimentos</div>';
    return;
  }
  div.innerHTML = dadosApp.movimentosFetais
    .slice()
    .reverse()
    .map(
      (m) => `
        <div class="registro-item">📅 ${new Date(m.data).toLocaleDateString("pt-BR")}: ${m.quantidade} movimentos/hora</div>
    `,
    )
    .join("");
}

function renderizarSintomas() {
  const div = document.getElementById("listaSintomas");
  if (dadosApp.sintomas.length === 0) {
    div.innerHTML = '<div class="empty-state">Nenhum sintoma registrado</div>';
    return;
  }
  div.innerHTML = dadosApp.sintomas
    .slice()
    .reverse()
    .map(
      (s) => `
        <div class="registro-item">📅 ${new Date(s.data).toLocaleDateString("pt-BR")}: ${s.descricao}</div>
    `,
    )
    .join("");
}

function renderizarExames() {
  const div = document.getElementById("listaExames");
  if (dadosApp.exames.length === 0) {
    div.innerHTML = '<div class="empty-state">Nenhum exame registrado</div>';
    return;
  }
  div.innerHTML = dadosApp.exames
    .slice()
    .reverse()
    .map(
      (e) => `
        <div class="registro-item">🔬 ${e.nome} - ${new Date(e.data).toLocaleDateString("pt-BR")}: ${e.valor} ${e.unidade}</div>
    `,
    )
    .join("");
}

function renderizarConsultas() {
  const div = document.getElementById("listaConsultas");
  if (dadosApp.consultas.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhuma consulta registrada</div>';
    return;
  }
  div.innerHTML = dadosApp.consultas
    .slice()
    .reverse()
    .map(
      (c) => `
        <div class="registro-item">👩‍⚕️ ${c.especialidade} - ${new Date(c.data).toLocaleDateString("pt-BR")}<br>💡 ${c.recomendacoes || "Acompanhamento de rotina"}</div>
    `,
    )
    .join("");
}

function renderizarInsights() {
  const div = document.getElementById("insightsContainer");
  const idade = calcularIdadeGestacional();
  const ultimoPeso =
    dadosApp.registrosPeso[dadosApp.registrosPeso.length - 1]?.peso || 0;
  const pesoInicial = dadosApp.config.pesoPreGestacional || 0;
  const ganhoTotal = ultimoPeso - pesoInicial;

  div.innerHTML = `
        <div class="registro-item">📈 Ganho total: ${ganhoTotal > 0 ? ganhoTotal.toFixed(1) : "---"} kg (meta 5-9kg)</div>
        <div class="registro-item">📊 Percentil: ${ultimoPeso > 0 ? (ultimoPeso < 65 ? "Abaixo da média" : ultimoPeso < 72 ? "Dentro da média" : "Acima da média") : "Registre seu peso"}</div>
        <div class="registro-item">💡 ${idade.semanas <= 12 ? "Foque em ácido fólico e hidratação" : idade.semanas <= 28 ? "Aumente o consumo de cálcio" : "Descanse bastante e monitore os movimentos"}</div>
    `;
}

// ========== FUNÇÕES DE ADIÇÃO ==========
function adicionarPeso() {
  const peso = prompt("⚖️ Digite seu peso atual (kg):", "");
  if (peso && !isNaN(parseFloat(peso))) {
    dadosApp.registrosPeso.push({
      data: new Date().toISOString().slice(0, 10),
      peso: parseFloat(peso),
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Peso registrado!");
  }
}

function adicionarPressao() {
  const sistolica = prompt("❤️ Pressão sistólica (máxima):", "");
  const diastolica = prompt("❤️ Pressão diastólica (mínima):", "");
  if (sistolica && diastolica) {
    dadosApp.pressaoArterial.push({
      data: new Date().toISOString().slice(0, 10),
      valores: `${sistolica}/${diastolica}`,
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Pressão registrada!");
  }
}

function adicionarMovimento() {
  const quantidade = prompt("👶 Quantos movimentos em 1 hora?", "");
  if (quantidade && !isNaN(parseInt(quantidade))) {
    dadosApp.movimentosFetais.push({
      data: new Date().toISOString().slice(0, 10),
      quantidade: parseInt(quantidade),
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Movimentos registrados!");
  }
}

function adicionarSintoma() {
  const sintoma = prompt("📝 Como você está se sentindo?", "");
  if (sintoma && sintoma.trim()) {
    dadosApp.sintomas.push({
      data: new Date().toISOString().slice(0, 10),
      descricao: sintoma,
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Sintoma registrado!");
  }
}

function adicionarExame() {
  const nome = prompt("🔬 Nome do exame:", "");
  const valor = prompt("📊 Valor:", "");
  const unidade = prompt("📏 Unidade:", "");
  if (nome && valor) {
    dadosApp.exames.push({
      nome: nome,
      data: new Date().toISOString().slice(0, 10),
      valor: parseFloat(valor),
      unidade: unidade || "",
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Exame registrado!");
  }
}

function adicionarConsulta() {
  const especialidade = prompt("👩‍⚕️ Especialidade:", "");
  const recomendacoes = prompt("💡 Recomendações:", "");
  if (especialidade) {
    dadosApp.consultas.push({
      especialidade: especialidade,
      data: new Date().toISOString().slice(0, 10),
      recomendacoes: recomendacoes || "",
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Consulta registrada!");
  }
}

function salvarConfig() {
  dadosApp.config = {
    nome: document.getElementById("nome").value,
    altura: parseFloat(document.getElementById("altura").value) || 0,
    pesoPreGestacional:
      parseFloat(document.getElementById("pesoPre").value) || 0,
    dpp: document.getElementById("dpp").value,
    nomeBebe: document.getElementById("nomeBebe").value,
    sexoBebe: document.getElementById("sexoBebe").value,
  };
  salvarDados();
  renderizarTudo();
  alert("✅ Informações salvas!");
}

// ========== INICIALIZAÇÃO ==========
carregarDados();
renderizarTudo();

// Preencher formulário de perfil
if (dadosApp.config.dpp) {
  document.getElementById("nome").value = dadosApp.config.nome;
  document.getElementById("altura").value = dadosApp.config.altura;
  document.getElementById("pesoPre").value = dadosApp.config.pesoPreGestacional;
  document.getElementById("dpp").value = dadosApp.config.dpp;
  document.getElementById("nomeBebe").value = dadosApp.config.nomeBebe;
  document.getElementById("sexoBebe").value = dadosApp.config.sexoBebe;
}
