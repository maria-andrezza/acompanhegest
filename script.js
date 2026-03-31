// ==================== AcompanheGest - Script Principal ====================
let dadosApp = null;
let usuarioAtual = null;

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

function getPercentilPeso(peso, semanas) {
  if (semanas < 12) return "📊 Acompanhamento iniciando";
  if (peso < 65) return "🟢 Abaixo da média (percentil 25)";
  if (peso >= 65 && peso < 72) return "🟡 Dentro da média (percentil 50-75)";
  if (peso >= 72 && peso < 80) return "🟠 Acima da média (percentil 75-90)";
  return "🔴 Muito acima da média - Consulte nutricionista";
}

function gerarAlertasInteligentes() {
  const alerts = [];
  const idade = calcularIdadeGestacional();
  const ultimoPeso =
    dadosApp.registrosPeso[dadosApp.registrosPeso.length - 1]?.peso || 0;
  const pesoInicial = dadosApp.config.pesoPreGestacional || 0;
  const ganhoTotal = ultimoPeso - pesoInicial;

  // Pressão Arterial
  const pressoesRecentes = dadosApp.pressaoArterial.slice(-3);
  for (let p of pressoesRecentes) {
    const [sist, diast] = p.valores.split("/").map(Number);
    if (sist >= 140 || diast >= 90) {
      alerts.push({
        tipo: "critical",
        titulo: "⚠️ ALERTA DE PRESSÃO ALTA!",
        mensagem: `Pressão ${p.valores} mmHg registrada. Procure atendimento médico imediatamente.`,
      });
    } else if (sist >= 130 || diast >= 85) {
      alerts.push({
        tipo: "warning",
        titulo: "Atenção à Pressão Arterial",
        mensagem: `Pressão ${p.valores} mmHg. Reduza o consumo de sal, beba água e descanse.`,
      });
    }
  }

  // Movimentos fetais
  const movimentosRecentes = dadosApp.movimentosFetais.slice(-3);
  for (let m of movimentosRecentes) {
    if (m.quantidade < 10 && idade.semanas >= 28) {
      alerts.push({
        tipo: "critical",
        titulo: "🔴 ATENÇÃO: Poucos Movimentos!",
        mensagem: `${m.quantidade} movimentos registrados. Beba água gelada, deite-se e reconte. Se persistir, vá ao pronto-socorro.`,
      });
    } else if (m.quantidade < 10 && idade.semanas >= 24) {
      alerts.push({
        tipo: "warning",
        titulo: "Observe os Movimentos do Bebê",
        mensagem: `${m.quantidade} movimentos. O ideal é acima de 10 movimentos em 1 hora.`,
      });
    }
  }

  // Ferritina e Hemoglobina
  const ferritina = dadosApp.exames.find(
    (e) => e.nome.toLowerCase() === "ferritina",
  );
  const hemoglobina = dadosApp.exames.find(
    (e) => e.nome.toLowerCase() === "hemoglobina",
  );

  if (ferritina && ferritina.valor < 30) {
    alerts.push({
      tipo: "warning",
      titulo: "🥩 Ferritina Baixa Detectada",
      mensagem:
        "Aumente o consumo de alimentos ricos em ferro (carne, feijão, espinafre) e combine com vitamina C.",
    });
  }

  if (hemoglobina && hemoglobina.valor < 11) {
    alerts.push({
      tipo: "critical",
      titulo: "🩸 Hemoglobina Baixa - Risco de Anemia",
      mensagem: "Consulte seu obstetra para avaliar suplementação de ferro.",
    });
  }

  // Ganho de peso
  if (pesoInicial > 0 && idade.semanas > 0) {
    if (idade.semanas <= 12 && ganhoTotal > 2) {
      alerts.push({
        tipo: "warning",
        titulo: "📈 Acompanhamento de Peso",
        mensagem: `Ganho de ${ganhoTotal.toFixed(1)}kg no primeiro trimestre. Mantenha alimentação equilibrada.`,
      });
    } else if (idade.semanas > 12 && ganhoTotal > 9) {
      alerts.push({
        tipo: "warning",
        titulo: "Atenção ao Ganho de Peso",
        mensagem: `Ganho total: ${ganhoTotal.toFixed(1)}kg. Meta recomendada: 5-9kg na gestação.`,
      });
    }
  }

  // Dor pélvica
  const temDorPelvica = dadosApp.sintomas.some(
    (s) =>
      s.descricao.toLowerCase().includes("pélvica") ||
      s.descricao.toLowerCase().includes("quadril"),
  );
  if (temDorPelvica) {
    alerts.push({
      tipo: "success",
      titulo: "🧘 Dica para Dor Pélvica",
      mensagem:
        "Faça exercícios de Kegel 3x ao dia, evite ficar muito tempo na mesma posição e use travesseiro entre as pernas.",
    });
  }

  if (alerts.length === 0 && dadosApp.registrosPeso.length > 0) {
    alerts.push({
      tipo: "success",
      titulo: "✨ Tudo está indo bem! ✨",
      mensagem:
        "Continue com o acompanhamento pré-natal, alimentação saudável e hidratação. Você e seu bebê estão sendo muito bem cuidados!",
    });
  }

  return alerts;
}

function renderizarTudo() {
  renderizarHeader();
  renderizarAlertas();
  renderizarGraficoPeso();
  renderizarListaPesos();
  renderizarPressao();
  renderizarMovimentos();
  renderizarSintomas();
  renderizarExamesConsultas();
  renderizarInsights();
}

function renderizarHeader() {
  const nome = dadosApp.config.nome || "Mamãe";
  document.getElementById("nomeUsuario").innerHTML = nome;

  const nomeBebe = dadosApp.config.nomeBebe || "seu bebê";
  document.getElementById("nomeBebeHeader").innerHTML = nomeBebe;

  const idade = calcularIdadeGestacional();
  const infoDiv = document.getElementById("infoGestacao");
  const sexo = dadosApp.config.sexoBebe || "";
  const sexoIcon = sexo === "Menina" ? "👧" : sexo === "Menino" ? "👦" : "❓";

  infoDiv.innerHTML = `
        <span class="badge">📅 ${idade.semanas} semanas e ${idade.dias} dias</span>
        <span class="badge">${nomeBebe} ${sexoIcon}</span>
        <span class="badge">💖 ${sexo === "Menina" ? "Princesinha" : sexo === "Menino" ? "Príncipe" : "Amor"}</span>
    `;

  document.getElementById("diasRestantes").innerText = calcularDiasRestantes();
}

function renderizarAlertas() {
  const alerts = gerarAlertasInteligentes();
  const container = document.getElementById("alertsContainer");
  if (alerts.length === 0) {
    container.innerHTML =
      '<div class="empty-state">✨ Adicione seus registros para receber dicas personalizadas do AcompanheGest</div>';
    return;
  }
  container.innerHTML = alerts
    .map(
      (alert) => `
        <div class="alert-box alert-${alert.tipo}">
            <strong>${alert.titulo}</strong><br>${alert.mensagem}
        </div>
    `,
    )
    .join("");
}

function renderizarGraficoPeso() {
  const container = document.getElementById("graficoPeso");
  if (dadosApp.registrosPeso.length === 0) {
    container.innerHTML =
      '<div class="empty-state">📊 Registre seu peso para ver o gráfico evolutivo</div>';
    return;
  }
  const ultimos = dadosApp.registrosPeso.slice(-7);
  const maxPeso = Math.max(...ultimos.map((r) => r.peso), 70);
  const minPeso = Math.min(...ultimos.map((r) => r.peso), 60);

  container.innerHTML = ultimos
    .map((r) => {
      const altura = 40 + ((r.peso - minPeso) / (maxPeso - minPeso)) * 100;
      return `
            <div class="barra-peso">
                <div class="barra" style="height: ${Math.max(45, altura)}px;"></div>
                <div style="font-size: 0.7rem; font-weight: bold;">${r.peso}kg</div>
                <div style="font-size: 0.6rem; color: #b87c9a;">${new Date(r.data).toLocaleDateString("pt-BR").slice(0, 5)}</div>
            </div>
        `;
    })
    .join("");
}

function renderizarListaPesos() {
  const div = document.getElementById("listaPesos");
  if (dadosApp.registrosPeso.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhum registro de peso ainda</div>';
    return;
  }
  div.innerHTML =
    "<h3 style='margin-top:16px;'>📋 Histórico de Peso</h3>" +
    dadosApp.registrosPeso
      .slice()
      .reverse()
      .map(
        (r) => `
            <div class="registro-item flex-between">
                <span>📅 ${new Date(r.data).toLocaleDateString("pt-BR")}</span>
                <strong>⚖️ ${r.peso} kg</strong>
            </div>
        `,
      )
      .join("");
}

function renderizarPressao() {
  const div = document.getElementById("listaPressao");
  if (dadosApp.pressaoArterial.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhuma medição de pressão registrada</div>';
    return;
  }
  div.innerHTML = dadosApp.pressaoArterial
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      (p) => `
        <div class="registro-item">
            <strong>📅 ${new Date(p.data).toLocaleDateString("pt-BR")}</strong><br>
            💓 Pressão: <strong>${p.valores} mmHg</strong>
        </div>
    `,
    )
    .join("");
}

function renderizarMovimentos() {
  const div = document.getElementById("listaMovimentos");
  if (dadosApp.movimentosFetais.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhum registro de movimentos do bebê</div>';
    return;
  }
  div.innerHTML = dadosApp.movimentosFetais
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      (m) => `
        <div class="registro-item">
            <strong>📅 ${new Date(m.data).toLocaleDateString("pt-BR")}</strong><br>
            👶 <strong>${m.quantidade}</strong> movimentos em 1 hora
        </div>
    `,
    )
    .join("");
}

function renderizarSintomas() {
  const div = document.getElementById("listaSintomas");
  if (dadosApp.sintomas.length === 0) {
    div.innerHTML =
      '<div class="empty-state">Nenhum sintoma registrado. Como você está se sentindo?</div>';
    return;
  }
  div.innerHTML = dadosApp.sintomas
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      (s) => `
        <div class="registro-item">
            <strong>📅 ${new Date(s.data).toLocaleDateString("pt-BR")}</strong><br>
            📝 ${s.descricao}
        </div>
    `,
    )
    .join("");
}

function renderizarExamesConsultas() {
  const div = document.getElementById("examesConsultasContainer");
  let html = "";

  if (dadosApp.exames.length > 0) {
    html += "<h3>🔬 Exames Realizados</h3>";
    html += dadosApp.exames
      .slice()
      .reverse()
      .map(
        (e) => `
            <div class="registro-item">
                <strong>${e.nome}</strong> - ${new Date(e.data).toLocaleDateString("pt-BR")}<br>
                📊 Resultado: ${e.valor} ${e.unidade}
            </div>
        `,
      )
      .join("");
  }

  if (dadosApp.consultas.length > 0) {
    html += "<h3 style='margin-top:20px;'>👩‍⚕️ Consultas</h3>";
    html += dadosApp.consultas
      .slice()
      .reverse()
      .map(
        (c) => `
            <div class="registro-item">
                <strong>${c.especialidade}</strong> - ${new Date(c.data).toLocaleDateString("pt-BR")}<br>
                💡 ${c.recomendacoes || "Acompanhamento de rotina"}
            </div>
        `,
      )
      .join("");
  }

  if (dadosApp.exames.length === 0 && dadosApp.consultas.length === 0) {
    html = '<div class="empty-state">Nenhum exame ou consulta registrado</div>';
  }

  div.innerHTML = html;
}

function renderizarInsights() {
  const div = document.getElementById("insightsContainer");
  const idade = calcularIdadeGestacional();
  const ultimoPeso =
    dadosApp.registrosPeso[dadosApp.registrosPeso.length - 1]?.peso || 0;
  const pesoInicial = dadosApp.config.pesoPreGestacional || 0;
  const ganhoTotal = ultimoPeso - pesoInicial;

  const mediaMovimentos = dadosApp.movimentosFetais.length
    ? (
        dadosApp.movimentosFetais.reduce((a, b) => a + b.quantidade, 0) /
        dadosApp.movimentosFetais.length
      ).toFixed(0)
    : "---";

  const dicasPorSemana = {
    primeiro: "💧 Beba bastante água e mantenha o ácido fólico em dia!",
    segundo: "🥛 Aumente o consumo de cálcio para formação dos ossos do bebê.",
    terceiro: "🛌 Descanse sempre que possível e monitore os movimentos.",
  };

  let dicaSemana = dicasPorSemana.primeiro;
  if (idade.semanas > 12 && idade.semanas <= 28)
    dicaSemana = dicasPorSemana.segundo;
  if (idade.semanas > 28) dicaSemana = dicasPorSemana.terceiro;

  div.innerHTML = `
        <div class="insight-card">
            <p><strong>📈 Ganho total na gestação:</strong> ${ganhoTotal > 0 ? ganhoTotal.toFixed(1) : "---"} kg <span style="font-size:0.8rem;">(meta: 5-9kg)</span></p>
            <p><strong>👶 Média de movimentos fetais:</strong> ${mediaMovimentos} por hora de contagem</p>
            <p><strong>📊 Percentil de peso atual:</strong> ${ultimoPeso > 0 ? getPercentilPeso(ultimoPeso, idade.semanas) : "Registre seu primeiro peso para análise"}</p>
            <p><strong>💡 Dica especial AcompanheGest:</strong> ${dicaSemana}</p>
            <hr style="margin: 12px 0; border-color: #f0d5e8;">
            <p style="font-size:0.85rem; text-align:center;">🌸 ${idade.semanas > 0 ? `Você já completou ${idade.semanas} semanas de amor e cuidado!` : "Configure sua data prevista para começar o acompanhamento"} 🌸</p>
        </div>
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
    alert("✅ Peso registrado com sucesso no AcompanheGest!");
  }
}

function adicionarPressao() {
  const sistolica = prompt("❤️ Pressão sistólica (máxima):", "");
  const diastolica = prompt("❤️ Pressão diastólica (mínima):", "");
  if (
    sistolica &&
    diastolica &&
    !isNaN(parseInt(sistolica)) &&
    !isNaN(parseInt(diastolica))
  ) {
    dadosApp.pressaoArterial.push({
      data: new Date().toISOString().slice(0, 10),
      valores: `${sistolica}/${diastolica}`,
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Pressão arterial registrada!");
  }
}

function adicionarMovimento() {
  const quantidade = prompt("👶 Quantos movimentos você sentiu em 1 hora?", "");
  if (quantidade && !isNaN(parseInt(quantidade))) {
    dadosApp.movimentosFetais.push({
      data: new Date().toISOString().slice(0, 10),
      quantidade: parseInt(quantidade),
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Movimentos do bebê registrados! 💖");
  }
}

function adicionarSintoma() {
  const sintoma = prompt(
    "📝 Como você está se sentindo hoje? (ex: náusea, dor pélvica, cansaço)",
    "",
  );
  if (sintoma && sintoma.trim()) {
    dadosApp.sintomas.push({
      data: new Date().toISOString().slice(0, 10),
      descricao: sintoma,
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Sintoma registrado! Cuide-se bem.");
  }
}

function adicionarExame() {
  const nome = prompt("🔬 Nome do exame:", "");
  const valor = prompt("📊 Valor do resultado:", "");
  const unidade = prompt("📏 Unidade (ex: g/dL, ng/mL):", "");
  if (nome && valor) {
    dadosApp.exames.push({
      nome: nome,
      data: new Date().toISOString().slice(0, 10),
      valor: parseFloat(valor),
      unidade: unidade || "",
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Exame registrado! AcompanheGest vai analisar seus resultados.");
  }
}

function adicionarConsulta() {
  const especialidade = prompt("👩‍⚕️ Especialidade da consulta:", "");
  const recomendacoes = prompt("💡 Recomendações do profissional:", "");
  if (especialidade) {
    dadosApp.consultas.push({
      especialidade: especialidade,
      data: new Date().toISOString().slice(0, 10),
      recomendacoes: recomendacoes || "",
    });
    salvarDados();
    renderizarTudo();
    alert("✅ Consulta registrada! Anote sempre as recomendações.");
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
  alert(
    "✨ Informações salvas! Agora o AcompanheGest vai personalizar suas dicas.",
  );
}

// ========== INICIALIZAÇÃO ==========
carregarDados();
renderizarTudo();

// Event listeners
document
  .getElementById("btnSalvarConfig")
  ?.addEventListener("click", salvarConfig);
document
  .getElementById("btnNovoPeso")
  ?.addEventListener("click", adicionarPeso);
document
  .getElementById("btnNovaPressao")
  ?.addEventListener("click", adicionarPressao);
document
  .getElementById("btnNovoMovimento")
  ?.addEventListener("click", adicionarMovimento);
document
  .getElementById("btnRegistrarSintoma")
  ?.addEventListener("click", adicionarSintoma);
document
  .getElementById("btnNovoExame")
  ?.addEventListener("click", adicionarExame);
document
  .getElementById("btnNovaConsulta")
  ?.addEventListener("click", adicionarConsulta);

// Preencher formulário se já tiver dados
if (dadosApp.config.dpp) {
  document.getElementById("dpp").value = dadosApp.config.dpp;
  document.getElementById("nome").value = dadosApp.config.nome;
  document.getElementById("altura").value = dadosApp.config.altura;
  document.getElementById("pesoPre").value = dadosApp.config.pesoPreGestacional;
  document.getElementById("nomeBebe").value = dadosApp.config.nomeBebe;
  document.getElementById("sexoBebe").value = dadosApp.config.sexoBebe;
}
