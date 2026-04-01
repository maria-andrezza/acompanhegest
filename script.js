// ==================== AcompanheGest - Script Principal ====================
let dadosApp = null;
let usuarioAtual = null;
let pesoChart = null;
let hemoglobinaChart = null;

// ========== CARREGAR DADOS ==========
function salvarDados() {
  if (usuarioAtual && dadosApp) {
    localStorage.setItem(
      `acompanhegest_dados_${usuarioAtual}`,
      JSON.stringify(dadosApp),
    );
    console.log("✅ Dados salvos");
  }
}

function carregarDados() {
  usuarioAtual = getUsuarioAtual();
  if (!usuarioAtual) {
    window.location.href = "login.html";
    return false;
  }

  const saved = localStorage.getItem(`acompanhegest_dados_${usuarioAtual}`);
  if (saved) {
    try {
      dadosApp = JSON.parse(saved);
      console.log("✅ Dados carregados");
    } catch (e) {
      console.error("Erro ao carregar dados");
    }
  }

  if (!dadosApp) {
    dadosApp = {
      config: {
        nome: "",
        cidade: "",
        altura: 0,
        pesoPreGestacional: 0,
        pesoAtual: 0,
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
      registrosDiarios: [],
    };
  }
  return true;
}

// ========== FUNÇÕES AUXILIARES ==========
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
  const totalDias = 280;
  const diasRestantes = calcularDiasRestantes();
  const diasPassados = totalDias - diasRestantes;
  return { semanas: Math.floor(diasPassados / 7), dias: diasPassados % 7 };
}

const tamanhosBebe = {
  12: "limão",
  16: "abacate",
  20: "banana",
  24: "espiga de milho",
  28: "berinjela",
  32: "abacaxi",
  36: "melão",
  40: "melancia",
};

function getTamanhoBebe(semanas) {
  if (semanas <= 12) return "limão";
  if (semanas <= 16) return "abacate";
  if (semanas <= 20) return "banana";
  if (semanas <= 24) return "espiga de milho";
  if (semanas <= 28) return "berinjela";
  if (semanas <= 32) return "abacaxi";
  if (semanas <= 36) return "melão";
  return "melancia";
}

const desenvolvimento = {
  12: "Os dedos estão formados e o bebê começa a se mexer!",
  16: "Os olhos e ouvidos estão se desenvolvendo. O bebê já ouve sua voz!",
  20: "O bebê já reconhece sua voz! Continue conversando com ele(a).",
  24: "Os pulmões estão se desenvolvendo. O bebê já reage a sons externos.",
  28: "O bebê abre e fecha os olhos. Já tem ciclos de sono definidos.",
  32: "O bebê ganha peso rapidamente. Os ossos estão se fortalecendo.",
  36: "O bebê já está na posição para o nascimento.",
  40: "O bebê está pronto para conhecer o mundo!",
};

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

// ========== EMOJIS PARA EXAMES ==========
function getEmojiExame(tipo, parametro, valor, unidade) {
  const paramLower = (parametro + " " + tipo).toLowerCase();

  // Hemoglobina
  if (paramLower.includes("hemoglobina")) {
    if (valor < 11) return "🔴";
    if (valor < 12) return "⚠️";
    return "✅";
  }

  // Ferritina
  if (paramLower.includes("ferritina")) {
    if (valor < 30) return "🔴";
    if (valor < 70) return "⚠️";
    return "✅";
  }

  // Glicose
  if (paramLower.includes("glicose") || paramLower.includes("glicemia")) {
    if (valor > 92) return "🔴";
    if (valor > 85) return "⚠️";
    return "✅";
  }

  return "📊";
}

// ========== GRÁFICO DE PESO ==========
function renderizarGraficoPeso() {
  const canvas = document.getElementById("pesoChart");
  if (!canvas) return;

  const pesos = [...dadosApp.registrosPeso].sort(
    (a, b) => new Date(a.data) - new Date(b.data),
  );
  const labels = pesos.map((p) =>
    new Date(p.data).toLocaleDateString("pt-BR").slice(0, 5),
  );
  const valores = pesos.map((p) => p.peso);

  if (pesoChart) pesoChart.destroy();

  if (pesos.length > 0) {
    pesoChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Peso (kg)",
            data: valores,
            borderColor: "#88E2B7",
            backgroundColor: "rgba(136,226,183,0.05)",
            borderWidth: 3,
            pointBackgroundColor: "#88E2B7",
            pointBorderColor: "white",
            pointRadius: 5,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { display: false } },
          x: { grid: { display: false } },
        },
      },
    });
  } else {
    canvas.parentElement.innerHTML =
      '<div class="empty-state">Nenhum registro de peso</div>';
  }

  const ganhoDiv = document.getElementById("ganhoIdeal");
  if (ganhoDiv) {
    const altura = dadosApp.config.altura || 0;
    const pesoPre = dadosApp.config.pesoPreGestacional || 0;
    if (altura > 0 && pesoPre > 0) {
      const imc = pesoPre / (altura / 100) ** 2;
      let ganhoMin = 5,
        ganhoMax = 9;
      if (imc < 18.5) {
        ganhoMin = 12.5;
        ganhoMax = 18;
      } else if (imc < 25) {
        ganhoMin = 11.5;
        ganhoMax = 16;
      } else if (imc < 30) {
        ganhoMin = 7;
        ganhoMax = 11.5;
      }
      ganhoDiv.innerHTML = `Ganho ideal (IMC ${imc.toFixed(1)}): ${ganhoMin}–${ganhoMax} kg na gestação`;
    } else {
      ganhoDiv.innerHTML = `Ganho ideal: 5–9 kg na gestação`;
    }
  }
}

// ========== GRÁFICO DE EXAMES ==========
function carregarGraficoParametro() {
  const parametro =
    document.getElementById("parametroSelect")?.value || "hemoglobina";
  renderizarGraficoHemoglobina(parametro);
}

function renderizarGraficoHemoglobina(parametro = "hemoglobina") {
  const canvas = document.getElementById("hemoglobinaChart");
  if (!canvas) return;

  let examesFiltrados = dadosApp.exames
    .filter((e) => {
      const nome = (e.nome + " " + (e.parametro || "")).toLowerCase();
      if (parametro === "hemoglobina") return nome.includes("hemoglobina");
      if (parametro === "ferritina") return nome.includes("ferritina");
      if (parametro === "glicose")
        return nome.includes("glicose") || nome.includes("glicemia");
      return false;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  const labels = examesFiltrados.map((e) =>
    new Date(e.data).toLocaleDateString("pt-BR").slice(0, 5),
  );
  const valores = examesFiltrados.map((e) => e.valor);

  if (hemoglobinaChart) hemoglobinaChart.destroy();

  if (examesFiltrados.length > 0) {
    const unidade =
      examesFiltrados[0]?.unidade ||
      (parametro === "hemoglobina"
        ? "g/dL"
        : parametro === "ferritina"
          ? "ng/mL"
          : "mg/dL");
    hemoglobinaChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label:
              parametro.charAt(0).toUpperCase() +
              parametro.slice(1) +
              ` (${unidade})`,
            data: valores,
            borderColor: "#C7B9FF",
            backgroundColor: "rgba(199,185,255,0.05)",
            borderWidth: 3,
            pointBackgroundColor: "#C7B9FF",
            pointBorderColor: "white",
            pointRadius: 5,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { display: false } },
          x: { grid: { display: false } },
        },
      },
    });

    const detalhesDiv = document.getElementById("detalhesParametro");
    if (detalhesDiv) {
      const ultimo = examesFiltrados[examesFiltrados.length - 1];
      const emoji = getEmojiExame(
        ultimo.nome,
        ultimo.parametro || "",
        ultimo.valor,
        ultimo.unidade,
      );
      detalhesDiv.innerHTML = `<div class="ganho-ideal" style="margin-top:12px">${emoji} Último resultado: ${ultimo.valor} ${ultimo.unidade || unidade} (${new Date(ultimo.data).toLocaleDateString("pt-BR")})</div>`;
    }
  } else {
    canvas.parentElement.innerHTML =
      '<div class="empty-state">Nenhum exame registrado para este parâmetro</div>';
  }
}

// ========== FILTRO DE PARÂMETROS ==========
function atualizarFiltroParametros() {
  const select = document.getElementById("parametroSelect");
  if (!select) return;

  const temHemoglobina = dadosApp.exames.some((e) =>
    (e.nome + " " + (e.parametro || "")).toLowerCase().includes("hemoglobina"),
  );
  const temFerritina = dadosApp.exames.some((e) =>
    (e.nome + " " + (e.parametro || "")).toLowerCase().includes("ferritina"),
  );
  const temGlicose = dadosApp.exames.some(
    (e) =>
      (e.nome + " " + (e.parametro || "")).toLowerCase().includes("glicose") ||
      (e.nome + " " + (e.parametro || "")).toLowerCase().includes("glicemia"),
  );

  const options = select.options;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (opt.value === "hemoglobina" && !temHemoglobina) {
      opt.disabled = true;
      opt.text = "Hemoglobina (g/dL) ⚠️ sem dados";
    } else if (opt.value === "ferritina" && !temFerritina) {
      opt.disabled = true;
      opt.text = "Ferritina (ng/mL) ⚠️ sem dados";
    } else if (opt.value === "glicose" && !temGlicose) {
      opt.disabled = true;
      opt.text = "Glicose jejum (mg/dL) ⚠️ sem dados";
    } else {
      opt.disabled = false;
      if (opt.value === "hemoglobina") opt.text = "Hemoglobina (g/dL)";
      if (opt.value === "ferritina") opt.text = "Ferritina (ng/mL)";
      if (opt.value === "glicose") opt.text = "Glicose jejum (mg/dL)";
    }
  }
}

// ========== HISTÓRICO ==========
function renderizarHistoricoRegistros() {
  const container = document.getElementById("historicoRegistros");
  if (!container) return;

  if (!dadosApp.registrosDiarios || dadosApp.registrosDiarios.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhum registro diário</div>';
    return;
  }

  container.innerHTML = dadosApp.registrosDiarios
    .slice(0, 10)
    .map((reg) => {
      const data = new Date(reg.data).toLocaleDateString("pt-BR");
      return `
            <div class="historico-item">
                <div class="historico-data">📅 ${data}</div>
                <div class="historico-peso">${reg.peso ? `⚖️ ${reg.peso} kg` : ""}</div>
                ${reg.sintomas?.length ? `<div class="historico-sintomas">${reg.sintomas.map((s) => `<span class="sintoma-badge">${s}</span>`).join("")}</div>` : ""}
                ${reg.movimentos ? `<div class="historico-movimentos">👶 ${reg.movimentos} movimentos</div>` : ""}
                ${reg.observacoes ? `<div class="historico-obs">💭 ${reg.observacoes}</div>` : ""}
            </div>
        `;
    })
    .join("");
}

// ========== EXAMES ==========
function renderizarExamesCompleta() {
  const container = document.getElementById("listaExamesCompleta");
  if (!container) return;

  if (dadosApp.exames.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhum exame registrado</div>';
    return;
  }

  const examesOrdenados = [...dadosApp.exames].sort(
    (a, b) => new Date(b.data) - new Date(a.data),
  );
  container.innerHTML = examesOrdenados
    .map((e) => {
      const emoji = getEmojiExame(
        e.nome,
        e.parametro || "",
        e.valor,
        e.unidade,
      );
      return `
            <div class="exame-item">
                <div class="exame-info">
                    <div class="exame-data">📅 ${new Date(e.data).toLocaleDateString("pt-BR")}</div>
                    <div class="exame-nome">${e.nome} ${e.parametro && e.parametro !== e.nome ? `(${e.parametro})` : ""}</div>
                    <div class="exame-valor">${e.valor} <span style="font-size:12px; color:#8D9BB0;">${e.unidade}</span></div>
                </div>
                <div class="exame-emoji">${emoji}</div>
            </div>
        `;
    })
    .join("");
}

// ========== CONSULTAS ==========
function renderizarConsultasCompleta() {
  const container = document.getElementById("listaConsultasCompleta");
  if (!container) return;

  if (dadosApp.consultas.length === 0) {
    container.innerHTML =
      '<div class="empty-state">Nenhuma consulta registrada</div>';
    return;
  }

  const consultasOrdenadas = [...dadosApp.consultas].sort(
    (a, b) => new Date(b.data) - new Date(a.data),
  );
  container.innerHTML = consultasOrdenadas
    .map((c) => {
      const getIcone = (esp) => {
        const lower = esp.toLowerCase();
        if (lower.includes("obstetra")) return "🤰";
        if (lower.includes("pediatra")) return "👶";
        if (lower.includes("fisio")) return "🧘";
        if (lower.includes("nutri")) return "🥗";
        if (lower.includes("endo")) return "🩺";
        if (lower.includes("cardio")) return "❤️";
        return "👩‍⚕️";
      };
      return `
            <div class="consulta-item">
                <div class="consulta-data">📅 ${new Date(c.data).toLocaleDateString("pt-BR")}</div>
                <div class="consulta-especialidade">${getIcone(c.especialidade)} ${c.especialidade}</div>
                <div class="consulta-achados"><strong>🔍 Achados:</strong><br>${c.achados}</div>
                <div class="consulta-recomendacoes"><strong>💡 Recomendações:</strong><br>${c.recomendacoes}</div>
            </div>
        `;
    })
    .join("");
}

// ========== MODAIS ==========
function abrirModal(tipo) {
  const modalMap = {
    peso: "modalRegistro",
    exame: "modalExame",
    consulta: "modalConsulta",
  };
  const modal = document.getElementById(modalMap[tipo]);
  if (modal) modal.style.display = "flex";
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

// ========== DICAS ==========
function dicaPeso(peso, pesoAnterior) {
  if (!pesoAnterior)
    return "💡 Este é seu primeiro registro de peso! Continue acompanhando.";
  const diferenca = peso - pesoAnterior;
  if (diferenca > 0.8)
    return "⚠️ Aumento significativo. Mantenha alimentação equilibrada.";
  if (diferenca > 0.3) return "📈 Ganho dentro do esperado! Continue assim.";
  if (diferenca > 0) return "✨ Pequeno aumento. Ótimo!";
  if (diferenca < -0.3)
    return "⚠️ Você perdeu peso. Observe e converse com seu médico.";
  return "💪 Peso estável. Continue se cuidando!";
}

function dicaPressao(sist, diast) {
  if (sist >= 140 || diast >= 90)
    return "🔴 ALERTA: Pressão alta! Procure atendimento médico.";
  if (sist >= 130 || diast >= 85)
    return "🟠 Atenção: Pressão um pouco elevada. Reduza o sal e descanse.";
  if (sist >= 120 || diast >= 80) return "🟡 Pressão dentro do esperado.";
  if (sist < 100 || diast < 60)
    return "💙 Pressão baixa. Levante-se devagar e beba água.";
  return "💚 Pressão excelente! Continue cuidando da saúde.";
}

function dicaMovimentos(quantidade, semanas) {
  if (semanas < 24)
    return "👶 Os movimentos ainda podem ser sutis. Com o tempo você sentirá mais!";
  if (quantidade < 8)
    return "⚠️ Poucos movimentos. Beba água gelada e reconte. Se persistir, procure atendimento.";
  if (quantidade < 10)
    return "💛 Movimentos dentro do esperado. O ideal é acima de 10 em 1 hora.";
  if (quantidade <= 20) return "💚 Ótimo! Seu bebê está se movimentando bem.";
  return "💙 Bebê bem ativo! Isso é um ótimo sinal.";
}

function dicaSintomas(sintomas) {
  const dicas = [];
  if (sintomas.includes("Náusea"))
    dicas.push("🤢 Náusea: Refeições pequenas a cada 3 horas, gengibre ajuda.");
  if (sintomas.includes("Dor pélvica"))
    dicas.push(
      "🦴 Dor pélvica: Faça Kegel, evite ficar muito tempo na mesma posição.",
    );
  if (sintomas.includes("Inchaço"))
    dicas.push("💧 Inchaço: Eleve as pernas, beba água e reduza o sal.");
  if (sintomas.includes("Dor de cabeça"))
    dicas.push("🤕 Dor de cabeça: Descanse em local escuro, beba água.");
  if (sintomas.includes("Fadiga"))
    dicas.push(
      "😴 Fadiga: Descanse sempre que possível, alimentação rica em ferro.",
    );
  if (sintomas.includes("Insônia"))
    dicas.push("🌙 Insônia: Evite telas antes de dormir, mantenha rotina.");
  if (sintomas.includes("Azia"))
    dicas.push("🔥 Azia: Evite frituras, não se deite após comer.");
  if (sintomas.includes("Cãibras"))
    dicas.push(
      "🦵 Cãibras: Alongue-se, aumente consumo de banana e se hidrate.",
    );
  if (dicas.length === 0) return "💚 Que bom que você está se sentindo bem!";
  return dicas.join(" ");
}

function dicaHumor(humor) {
  if (humor === "😢 Triste")
    return "💜 É normal sentir variações. Converse com alguém que confia.";
  if (humor === "😤 Irritada")
    return "💙 Irritabilidade é comum. Respire fundo e tire um momento para você.";
  if (humor === "😴 Cansada")
    return "💛 Descanse sempre que possível. Seu corpo está trabalhando muito!";
  if (humor === "🤢 Enjoada")
    return "💚 Enjôos são comuns. Alimentos secos podem ajudar.";
  if (humor === "😊 Feliz")
    return "💖 Que bom que você está feliz! Aproveite cada momento.";
  return "💜 Cada dia é único na gestação. Se cuide!";
}

// ========== SALVAR REGISTRO DIÁRIO ==========
function salvarRegistroModal() {
  const peso = document.getElementById("modalPeso").value;
  const pressaoSistolica = document.getElementById(
    "modalPressaoSistolica",
  ).value;
  const pressaoDiastolica = document.getElementById(
    "modalPressaoDiastolica",
  ).value;
  const sintomas = Array.from(
    document.querySelectorAll("#modalRegistro .sintoma-checkbox input:checked"),
  ).map((cb) => cb.value);
  const humor = document.querySelector(
    '#modalRegistro input[name="modalHumor"]:checked',
  )?.value;
  const movimentos = document.getElementById("modalMovimentos").value;
  const observacoes = document.getElementById("modalObservacoes").value;

  if (
    !peso &&
    sintomas.length === 0 &&
    !humor &&
    !movimentos &&
    !observacoes &&
    !pressaoSistolica
  ) {
    alert("📝 Preencha pelo menos um campo!");
    return;
  }

  // Coletar dicas
  let dicas = [];
  const idade = calcularIdadeGestacional();

  if (peso) {
    const pesoAnterior =
      dadosApp.registrosPeso[dadosApp.registrosPeso.length - 1]?.peso;
    dicas.push(dicaPeso(parseFloat(peso), pesoAnterior));
  }
  if (pressaoSistolica && pressaoDiastolica) {
    dicas.push(
      dicaPressao(parseInt(pressaoSistolica), parseInt(pressaoDiastolica)),
    );
  }
  if (movimentos) {
    dicas.push(dicaMovimentos(parseInt(movimentos), idade.semanas));
  }
  if (sintomas.length > 0) {
    dicas.push(dicaSintomas(sintomas));
  }
  if (humor) {
    dicas.push(dicaHumor(humor));
  }

  const registro = {
    data: new Date().toISOString().slice(0, 10),
    peso: peso ? parseFloat(peso) : null,
    pressao:
      pressaoSistolica && pressaoDiastolica
        ? `${pressaoSistolica}/${pressaoDiastolica}`
        : null,
    sintomas: sintomas,
    humor: humor,
    movimentos: movimentos ? parseInt(movimentos) : null,
    observacoes: observacoes || null,
  };

  if (!dadosApp.registrosDiarios) dadosApp.registrosDiarios = [];
  dadosApp.registrosDiarios.unshift(registro);
  if (registro.peso)
    dadosApp.registrosPeso.push({ data: registro.data, peso: registro.peso });
  if (registro.pressao)
    dadosApp.pressaoArterial.push({
      data: registro.data,
      valores: registro.pressao,
    });
  if (registro.sintomas.length)
    dadosApp.sintomas.push({
      data: registro.data,
      descricao: registro.sintomas.join(", "),
    });
  if (registro.movimentos)
    dadosApp.movimentosFetais.push({
      data: registro.data,
      quantidade: registro.movimentos,
    });

  salvarDados();
  renderizarTudo();
  fecharModal("modalRegistro");

  // Limpar formulário
  document.getElementById("modalPeso").value = "";
  document.getElementById("modalPressaoSistolica").value = "";
  document.getElementById("modalPressaoDiastolica").value = "";
  document
    .querySelectorAll("#modalRegistro .sintoma-checkbox input")
    .forEach((cb) => (cb.checked = false));
  document
    .querySelectorAll('#modalRegistro input[name="modalHumor"]')
    .forEach((radio) => (radio.checked = false));
  document.getElementById("modalMovimentos").value = "";
  document.getElementById("modalObservacoes").value = "";

  alert("✅ Registro salvo!\n\n💡 DICAS:\n\n" + dicas.join("\n\n"));
}

// ========== ADICIONAR EXAME ==========
function adicionarExameCompleto() {
  const tipo = document.getElementById("novoTipoExame").value;
  const parametro = document.getElementById("novoParametroExame").value;
  const valor = document.getElementById("novoValorExame").value;
  const unidade = document.getElementById("novaUnidadeExame").value;
  const data = document.getElementById("novaDataExame").value;

  if (!tipo || !valor || !data) {
    alert("❌ Preencha: Tipo, Valor e Data!");
    return;
  }

  const valorNum = parseFloat(valor);
  const emoji = getEmojiExame(tipo, parametro, valorNum, unidade);
  let dica = "";

  const paramLower = (parametro + " " + tipo).toLowerCase();
  if (paramLower.includes("hemoglobina")) {
    if (valorNum < 11)
      dica = "🔴 Hemoglobina baixa. Aumente consumo de ferro e vitamina C.";
    else if (valorNum < 12)
      dica = "⚠️ Hemoglobina nos limites. Invista em alimentos ricos em ferro.";
    else dica = "✅ Hemoglobina dentro do esperado! Continue assim.";
  } else if (paramLower.includes("ferritina")) {
    if (valorNum < 30)
      dica =
        "🔴 Ferritina baixa. Aumente consumo de carnes, feijão e espinafre.";
    else if (valorNum < 70)
      dica =
        "⚠️ Ferritina pode melhorar. Continue com alimentação rica em ferro.";
    else dica = "✅ Ferritina adequada! Ótimo resultado.";
  } else if (
    paramLower.includes("glicose") ||
    paramLower.includes("glicemia")
  ) {
    if (valorNum > 92)
      dica = "🔴 Glicose elevada. Reduza açúcares e carboidratos refinados.";
    else if (valorNum > 85)
      dica = "⚠️ Glicose nos limites. Mantenha alimentação equilibrada.";
    else dica = "✅ Glicose dentro do esperado! Continue assim.";
  } else {
    dica = `📊 ${tipo} registrado! Continue acompanhando sua saúde.`;
  }

  dadosApp.exames.push({
    nome: tipo,
    parametro: parametro || tipo,
    data: data,
    valor: valorNum,
    unidade: unidade || "",
    observacao: "",
  });

  salvarDados();
  renderizarTudo();
  fecharModal("modalExame");

  document.getElementById("novoTipoExame").value = "";
  document.getElementById("novoParametroExame").value = "";
  document.getElementById("novoValorExame").value = "";
  document.getElementById("novaUnidadeExame").value = "";
  document.getElementById("novaDataExame").value = "";

  alert(`✅ Exame salvo!\n\n${emoji} ${dica}`);
}

// ========== ADICIONAR CONSULTA ==========
function adicionarConsultaCompleta() {
  let especialidade = document.getElementById("novaEspecialidadeSelect").value;
  const outro = document.getElementById("novaEspecialidadeOutro");

  if (especialidade === "Outro") {
    especialidade = outro.value.trim();
    if (!especialidade) {
      alert("Digite a especialidade!");
      return;
    }
  }

  const data = document.getElementById("novaDataConsulta").value;
  const achados = document.getElementById("novaAchadosConsulta").value;
  const recomendacoes = document.getElementById(
    "novaRecomendacoesConsulta",
  ).value;

  if (!especialidade || !data) {
    alert("Preencha especialidade e data!");
    return;
  }

  let dica = "";
  if (recomendacoes && recomendacoes !== "Não informado") {
    dica = `💡 Dica da consulta com ${especialidade}: ${recomendacoes.substring(0, 100)}${recomendacoes.length > 100 ? "..." : ""}`;
  } else {
    const dicasPorEspecialidade = {
      Obstetra: "🤰 Continue com o pré-natal em dia!",
      Pediatra:
        "👶 O pediatra será fundamental após o nascimento. Comece a preparar as perguntas!",
      "Fisioterapeuta Pélvica":
        "🧘 Os exercícios de Kegel são essenciais. Pratique diariamente!",
      Nutricionista:
        "🥗 Uma alimentação equilibrada é fundamental para você e seu bebê.",
      Endocrinologista: "🩺 Mantenha o acompanhamento dos hormônios em dia.",
      Cardiologista:
        "❤️ Cuide do seu coração! Atividade física leve é essencial.",
    };
    dica =
      dicasPorEspecialidade[especialidade] ||
      "💚 Consulta registrada! Continue cuidando da sua saúde.";
  }

  dadosApp.consultas.push({
    especialidade: especialidade,
    data: data,
    achados: achados || "Não informado",
    recomendacoes: recomendacoes || "Não informado",
  });

  salvarDados();
  renderizarTudo();
  fecharModal("modalConsulta");

  document.getElementById("novaEspecialidadeSelect").value = "";
  document.getElementById("novaEspecialidadeOutro").value = "";
  document.getElementById("novaDataConsulta").value = "";
  document.getElementById("novaAchadosConsulta").value = "";
  document.getElementById("novaRecomendacoesConsulta").value = "";

  alert(`✅ Consulta salva!\n\n${dica}`);
}

// ========== CONFIGURAÇÕES ==========
function salvarConfig() {
  const pesoAtual = document.getElementById("pesoAtual").value;
  if (pesoAtual) {
    dadosApp.registrosPeso.push({
      data: new Date().toISOString().slice(0, 10),
      peso: parseFloat(pesoAtual),
    });
  }

  dadosApp.config = {
    nome: document.getElementById("nome").value,
    cidade: document.getElementById("cidade").value,
    altura: parseFloat(document.getElementById("altura").value) || 0,
    pesoPreGestacional:
      parseFloat(document.getElementById("pesoPre").value) || 0,
    pesoAtual: parseFloat(pesoAtual) || 0,
    dpp: document.getElementById("dpp").value,
    nomeBebe: document.getElementById("nomeBebe").value,
    sexoBebe: document.getElementById("sexoBebe").value,
  };

  salvarDados();
  renderizarTudo();
  alert("✅ Perfil salvo!");
}

// ========== RENDERIZAÇÃO PRINCIPAL ==========
function renderizarTudo() {
  const idade = calcularIdadeGestacional();

  document.getElementById("nomeUsuario").innerHTML =
    dadosApp.config.nome || "Mamãe";
  document.getElementById("nomeBebeHeader").innerHTML =
    dadosApp.config.nomeBebe || "seu bebê";
  document.getElementById("bebeNome").innerHTML =
    dadosApp.config.nomeBebe || "Aguardando nome";
  document.getElementById("semanasDias").innerHTML =
    `${idade.semanas} sem ${idade.dias} dias`;
  document.getElementById("progressoBarra").style.width =
    `${(idade.semanas / 40) * 100}%`;
  document.getElementById("diasRestantes").innerHTML = calcularDiasRestantes();
  document.getElementById("bebeTamanho").innerHTML =
    `É do tamanho de um(a) ${getTamanhoBebe(idade.semanas)}!`;
  document.getElementById("bebeSexo").innerHTML =
    dadosApp.config.sexoBebe === "Menina"
      ? "👧 Menina"
      : dadosApp.config.sexoBebe === "Menino"
        ? "👦 Menino"
        : "❓ Não sei";
  document.getElementById("desenvolvimento").innerHTML =
    `<strong>Semana ${idade.semanas}</strong> — ${getDesenvolvimento(idade.semanas)}`;

  // Alertas
  const alertas = [];
  const ultimoSintoma = dadosApp.sintomas[dadosApp.sintomas.length - 1];
  if (ultimoSintoma)
    alertas.push(`Você relatou "${ultimoSintoma.descricao}" recentemente.`);
  const ultimaConsulta = dadosApp.consultas[dadosApp.consultas.length - 1];
  if (
    ultimaConsulta?.recomendacoes &&
    ultimaConsulta.recomendacoes !== "Não informado"
  ) {
    alertas.push(
      `${ultimaConsulta.especialidade} recomendou: "${ultimaConsulta.recomendacoes}". Lembre-se de seguir! 😊`,
    );
  }
  if (alertas.length === 0)
    alertas.push(
      "✨ Tudo bem por aqui! Continue cuidando de você e do seu bebê! 💖",
    );

  document.getElementById("alertasContainer").innerHTML = alertas
    .map((a) => `<div class="alerta-card">${a}</div>`)
    .join("");
  document.getElementById("resumoSemana").innerHTML =
    `<p>🌸 <strong>${idade.semanas} semanas</strong> de gestação</p><p>📏 Tamanho: <strong>${getTamanhoBebe(idade.semanas)}</strong></p><p>💡 ${getDesenvolvimento(idade.semanas)}</p>`;

  renderizarGraficoPeso();
  renderizarGraficoHemoglobina();
  renderizarHistoricoRegistros();
  renderizarExamesCompleta();
  renderizarConsultasCompleta();
  atualizarFiltroParametros();

  // Preencher perfil
  document.getElementById("nome").value = dadosApp.config.nome || "";
  document.getElementById("cidade").value = dadosApp.config.cidade || "";
  document.getElementById("altura").value = dadosApp.config.altura || "";
  document.getElementById("pesoPre").value =
    dadosApp.config.pesoPreGestacional || "";
  document.getElementById("pesoAtual").value = dadosApp.config.pesoAtual || "";
  document.getElementById("dpp").value = dadosApp.config.dpp || "";
  document.getElementById("nomeBebe").value = dadosApp.config.nomeBebe || "";
  document.getElementById("sexoBebe").value =
    dadosApp.config.sexoBebe || "Menina";

  document.getElementById("loading").style.display = "none";
  document.getElementById("appContainer").classList.remove("container-oculto");
}

// ========== NAVEGAÇÃO ==========
function initNavegacao() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const secao = item.dataset.secao;
      document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      document
        .querySelectorAll(".secao")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`secao-${secao}`).classList.add("active");
    });
  });

  document.querySelectorAll(".submenu-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.sub;
      document
        .querySelectorAll(".submenu-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelectorAll(".submenu-conteudo")
        .forEach((c) => c.classList.remove("active"));
      document.getElementById(`sub-${sub}`).classList.add("active");
    });
  });

  const selectEspecialidade = document.getElementById(
    "novaEspecialidadeSelect",
  );
  if (selectEspecialidade) {
    selectEspecialidade.addEventListener("change", function () {
      const outro = document.getElementById("novaEspecialidadeOutro");
      if (this.value === "Outro") outro.style.display = "block";
      else outro.style.display = "none";
    });
  }

  window.onclick = function (event) {
    if (event.target.classList && event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  };
}

// ========== INICIALIZAÇÃO ==========
if (carregarDados()) {
  renderizarTudo();
  initNavegacao();
}
