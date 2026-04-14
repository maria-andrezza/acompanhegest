// ==================== AcompanheGest - Lógica Principal ====================

let dadosApp = {
  config: {
    nome: "",
    dataInicioGestacao: null,
    nomeBebe: "",
    sexoBebe: "Menina",
  },
  consultas: [],
  exames: [],
  registrosDiarios: [],
};

// Sistema de Curiosidades para o Resumo IA
const curiosidadesIA = {
  8: "Sua pequena Íris está formando os dedinhos! Os braços já se movem.",
  12: "Os órgãos principais já estão formados. Ela já começa a soluçar!",
  20: "Metade do caminho! Ela já ouve sua voz e as batidas do seu coração.",
  28: "Ela já abre os olhos e consegue perceber a luz fora da barriga.",
  36: "Quase lá! Ela está ganhando gordura para ficar quentinha ao nascer.",
};

// Variável global para o usuário ativo
let usuarioAtivo = null;

// ==================== VARIÁVEIS DOS GRÁFICOS ====================
let graficoPeso = null;
let graficoPressao = null;
let graficoExames = null;
let tipoExameSelecionado = "todos";

// ==================== CONTROLE DE PAGINAÇÃO ====================
let examesPagina = 0;
let consultasPagina = 0;
const ITENS_POR_PAGINA = 10;

// ==================== SINCronização COM NEON ====================

async function carregarDadosDoNeon() {
  if (!usuarioAtivo) return false;

  try {
    console.log(`📡 Carregando dados do Neon para ${usuarioAtivo}...`);
    const response = await fetch(`/api/todos-dados/${usuarioAtivo}`);

    if (response.ok) {
      const dados = await response.json();

      dadosApp.consultas = dados.consultas || [];
      dadosApp.exames = dados.exames || [];
      dadosApp.registrosDiarios = dados.registrosDiarios || [];

      console.log(
        `✅ Carregados: ${dadosApp.consultas.length} consultas, ${dadosApp.exames.length} exames, ${dadosApp.registrosDiarios.length} registros`,
      );

      // Atualizar todas as interfaces
      atualizarEstatisticas();
      atualizarEstatisticasMedico();
      popularAnosFiltros();
      popularSeletorTiposExame();
      atualizarGraficoExames();

      // Verificar abas ativas
      if (
        document.getElementById("secao-saude")?.classList.contains("active")
      ) {
        atualizarGraficoPeso();
        atualizarGraficoPressao();
        exibirHistoricoPeso();
        exibirHistoricoPressao();
        exibirHistoricoSintomas();
      }

      if (
        document.getElementById("secao-medico")?.classList.contains("active")
      ) {
        examesPagina = 0;
        consultasPagina = 0;
        exibirExamesMedico();
        exibirConsultasMedico();
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Erro de conexão com Neon:", error);
    return false;
  }
}

async function salvarConsultaNeon(consulta) {
  if (!usuarioAtivo) return false;
  try {
    const response = await fetch("/api/consultas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usuarioAtivo,
        especialidade: consulta.especialidade,
        data: consulta.data,
        achados: consulta.achados,
      }),
    });
    if (response.ok) {
      console.log("✅ Consulta salva no Neon");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Erro ao salvar consulta:", error);
    return false;
  }
}

async function salvarExameNeon(exame) {
  if (!usuarioAtivo) return false;
  try {
    const response = await fetch("/api/exames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usuarioAtivo,
        tipo: exame.tipo,
        valor: exame.valor,
        data: exame.data,
      }),
    });
    if (response.ok) {
      console.log("✅ Exame salvo no Neon");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Erro ao salvar exame:", error);
    return false;
  }
}

async function salvarDiarioNeon(registro) {
  if (!usuarioAtivo) return false;
  try {
    const response = await fetch("/api/registros-diarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usuarioAtivo,
        data: registro.data,
        peso: registro.peso,
        pressao: registro.pressao,
        sintomas: registro.sintomas,
      }),
    });
    if (response.ok) {
      console.log("✅ Registro diário salvo no Neon");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Erro ao salvar registro diário:", error);
    return false;
  }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🌸 Inicializando UI...");

  if (typeof auth === "undefined") {
    console.error("❌ auth.js não foi carregado!");
    window.location.href = "/login.html";
    return;
  }

  usuarioAtivo = auth.getUsuarioAtivo();

  if (!usuarioAtivo) {
    console.log("Usuário não logado, redirecionando para login...");
    window.location.href = "/login.html";
    return;
  }

  const isAuthenticated = await auth.verificarAutenticacao();
  if (!isAuthenticated) {
    console.log("Autenticação falhou, redirecionando...");
    return;
  }

  inicializarApp();
});

async function inicializarApp() {
  try {
    await carregarDadosDoNeon();

    const salvos = localStorage.getItem(`acompanhegest_dados_${usuarioAtivo}`);
    if (salvos) {
      const dadosLocais = JSON.parse(salvos);
      dadosApp.config = dadosLocais.config || dadosApp.config;
      console.log("✅ Config carregada do localStorage");
    }

    // Aplicar tema baseado no sexo do bebê
    aplicarTemaPorSexo();

    const loading = document.getElementById("loading");
    const app = document.getElementById("appContainer");

    if (loading) loading.style.display = "none";
    if (app) {
      app.classList.remove("container-oculto");
      app.classList.add("container-visivel");
    }

    configurarNavegacao();
    atualizarInterfaceHome();
    atualizarTodasAbas();
  } catch (e) {
    console.error("Erro na inicialização:", e);
    const app = document.getElementById("appContainer");
    if (app) app.classList.add("container-visivel");
  }
}
// ==================== NAVEGAÇÃO ====================

function configurarNavegacao() {
  const botoes = document.querySelectorAll(".menu-item");
  botoes.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const alvo = btn.getAttribute("data-secao");

      const isInicio = alvo === "inicio";
      const mainHeader = document.getElementById("mainHeader");
      const bebeCard = document.getElementById("bebeCard");

      if (mainHeader) mainHeader.style.display = isInicio ? "block" : "none";
      if (bebeCard) bebeCard.style.display = isInicio ? "flex" : "none";

      botoes.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document
        .querySelectorAll(".secao")
        .forEach((s) => s.classList.remove("active"));
      const secaoAlvo = document.getElementById(`secao-${alvo}`);
      if (secaoAlvo) secaoAlvo.classList.add("active");

      if (alvo === "medico") {
        await carregarDadosDoNeon();
        examesPagina = 0;
        consultasPagina = 0;
        exibirExamesMedico();
        exibirConsultasMedico();
      } else if (alvo === "saude") {
        await carregarDadosDoNeon();
        exibirHistoricoPeso();
        exibirHistoricoPressao();
        exibirHistoricoSintomas();
        atualizarGraficoPeso();
        atualizarGraficoPressao();
      } else if (alvo === "perfil") {
        carregarDadosPerfil();
      }
    });
  });
}

// ==================== CÁLCULO GESTACIONAL ====================

function calcularIdadeGestacional() {
  if (!dadosApp.config.dataInicioGestacao) {
    return { semanas: 0, dias: 0, mes: 1, percentual: 0, diasRestantes: 280 };
  }

  const diff = Math.floor(
    (new Date() - new Date(dadosApp.config.dataInicioGestacao)) / 86400000,
  );
  const semanas = Math.floor(diff / 7);

  let mes = 1;
  if (semanas > 4) mes = 2;
  if (semanas > 8) mes = 3;
  if (semanas > 13) mes = 4;
  if (semanas > 17) mes = 5;
  if (semanas > 22) mes = 6;
  if (semanas > 26) mes = 7;
  if (semanas > 31) mes = 8;
  if (semanas > 35) mes = 9;

  return {
    semanas,
    dias: diff % 7,
    mes,
    percentual: Math.min((diff / 280) * 100, 100).toFixed(1),
    diasRestantes: Math.max(280 - diff, 0),
  };
}

function atualizarInterfaceHome() {
  const info = calcularIdadeGestacional();

  const semanasDias = document.getElementById("semanasDias");
  const mesGestacao = document.getElementById("mesGestacao");
  const progressoBarra = document.getElementById("progressoBarra");
  const diasRestantes = document.getElementById("diasRestantes");
  const nomeUsuario = document.getElementById("nomeUsuario");
  const cardNomeBebe = document.getElementById("bebeNomeExibicao");
  const resumoIA = document.getElementById("resumoIA");

  if (semanasDias)
    semanasDias.textContent = `${info.semanas} semanas e ${info.dias} dias`;
  if (mesGestacao) mesGestacao.textContent = `${info.mes}º mês`;
  if (progressoBarra) progressoBarra.style.width = `${info.percentual}%`;
  if (diasRestantes) diasRestantes.textContent = info.diasRestantes;
  if (nomeUsuario) nomeUsuario.textContent = dadosApp.config.nome || "Mamãe";
  if (cardNomeBebe)
    cardNomeBebe.textContent = dadosApp.config.nomeBebe || "Íris";

  atualizarTamanhoBebe();

  if (resumoIA) {
    const chavesSemanas = Object.keys(curiosidadesIA).map(Number).reverse();
    const chaveEncontrada = chavesSemanas.find((s) => info.semanas >= s) || 8;
    resumoIA.innerHTML = `<p>"${curiosidadesIA[chaveEncontrada]}"</p>`;
  }
}

// ==================== MODAIS ====================

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

// ==================== SALVAR DADOS (NEON) ====================

async function salvarDiario() {
  const dataInput = document.getElementById("d_data");
  const pesoInput = document.getElementById("d_peso");
  const pressaoInput = document.getElementById("d_pressao");
  const sintomasInput = document.getElementById("d_sintomas");

  const novoRegistro = {
    data: dataInput?.value || new Date().toISOString().split("T")[0],
    peso: pesoInput?.value || null,
    pressao: pressaoInput?.value || "",
    sintomas: sintomasInput?.value || "",
  };

  const sucesso = await salvarDiarioNeon(novoRegistro);

  if (sucesso) {
    await carregarDadosDoNeon();
    fecharModal("modalDiario");
    if (pesoInput) pesoInput.value = "";
    if (pressaoInput) pressaoInput.value = "";
    if (sintomasInput) sintomasInput.value = "";
    alert("✅ Registro salvo com sucesso!");
    atualizarTodasAbas();
  } else {
    alert("❌ Erro ao salvar registro.");
  }
}

async function salvarConsulta() {
  const especialidadeInput = document.getElementById("c_especialidade");
  const dataInput = document.getElementById("c_data");
  const achadosInput = document.getElementById("c_achados");

  const novaConsulta = {
    especialidade: especialidadeInput?.value || "",
    data: dataInput?.value || "",
    achados: achadosInput?.value || "",
  };

  if (!novaConsulta.data) {
    alert("❌ Por favor, selecione uma data");
    return;
  }

  const sucesso = await salvarConsultaNeon(novaConsulta);

  if (sucesso) {
    await carregarDadosDoNeon();
    fecharModal("modalConsulta");
    if (especialidadeInput) especialidadeInput.value = "";
    if (dataInput) dataInput.value = "";
    if (achadosInput) achadosInput.value = "";
    alert("✅ Consulta salva com sucesso!");
    atualizarTodasAbas();
  } else {
    alert("❌ Erro ao salvar consulta.");
  }
}

async function salvarExame() {
  const tipoInput = document.getElementById("e_tipo");
  const valorInput = document.getElementById("e_valor");
  const dataInput = document.getElementById("e_data");

  const novoExame = {
    tipo: tipoInput?.value || "",
    valor: valorInput?.value || "",
    data: dataInput?.value || "",
  };

  if (!novoExame.data) {
    alert("❌ Por favor, selecione uma data");
    return;
  }

  const sucesso = await salvarExameNeon(novoExame);

  if (sucesso) {
    await carregarDadosDoNeon();
    fecharModal("modalExame");
    if (tipoInput) tipoInput.value = "";
    if (valorInput) valorInput.value = "";
    if (dataInput) dataInput.value = "";
    alert("✅ Exame salvo com sucesso!");
    atualizarTodasAbas();
  } else {
    alert("❌ Erro ao salvar exame.");
  }
}

// ==================== PERFIL ====================

function carregarDadosPerfil() {
  const campoNome = document.getElementById("nome");
  const campoNomeBebe = document.getElementById("nomeBebe");
  const campoSexoBebe = document.getElementById("sexoBebe");
  const campoSemanas = document.getElementById("inputSemanas");
  const campoDias = document.getElementById("inputDias");

  if (campoNome) campoNome.value = dadosApp.config.nome || "";
  if (campoNomeBebe) campoNomeBebe.value = dadosApp.config.nomeBebe || "";
  if (campoSexoBebe) campoSexoBebe.value = dadosApp.config.sexoBebe || "Menina";

  const info = calcularIdadeGestacional();
  if (campoSemanas) campoSemanas.value = info.semanas;
  if (campoDias) campoDias.value = info.dias;
}

function salvarConfig() {
  const inputSemanas = document.getElementById("inputSemanas");
  const inputDias = document.getElementById("inputDias");
  const inputNome = document.getElementById("nome");
  const inputNomeBebe = document.getElementById("nomeBebe");
  const inputSexoBebe = document.getElementById("sexoBebe");

  const sem = parseInt(inputSemanas?.value) || 0;
  const dia = parseInt(inputDias?.value) || 0;

  const dataRef = new Date();
  dataRef.setDate(dataRef.getDate() - (sem * 7 + dia));

  dadosApp.config = {
    nome: inputNome?.value || "",
    nomeBebe: inputNomeBebe?.value || "Íris",
    sexoBebe: inputSexoBebe?.value || "Menina",
    dataInicioGestacao: dataRef.toISOString(),
  };

  localStorage.setItem(
    `acompanhegest_dados_${usuarioAtivo}`,
    JSON.stringify(dadosApp),
  );

  // Aplicar a cor do tema baseado no sexo do bebê
  aplicarTemaPorSexo();

  alert("Perfil Atualizado com sucesso!");
  atualizarInterfaceHome();
}

// ==================== TIMELINE ====================

function renderizarFiltroGeral() {
  const inicioStr = document.getElementById("filtroInicio")?.value;
  const fimStr = document.getElementById("filtroFim")?.value;
  const container = document.getElementById("listaFiltradaGeral");

  if (!inicioStr || !fimStr) {
    alert("Por favor, selecione o período.");
    return;
  }

  const inicio = new Date(inicioStr);
  const fim = new Date(fimStr);
  fim.setHours(23, 59, 59); // Incluir todo o dia final

  if (container)
    container.innerHTML =
      "<div style='text-align:center; padding:20px;'>🔍 Buscando registros...</div>";

  console.log("🔍 Filtrando período:", inicioStr, "até", fimStr);
  console.log("📊 Total de consultas:", dadosApp.consultas.length);
  console.log("📊 Total de exames:", dadosApp.exames.length);
  console.log("📊 Total de diários:", dadosApp.registrosDiarios.length);

  // Unifica todos os tipos de registros
  const todos = [
    ...dadosApp.consultas.map((i) => ({
      ...i,
      tipo: "👩‍⚕️ Consulta",
      cor: "#F3E5F5",
      icone: "👩‍⚕️",
      titulo: i.especialidade || "Consulta médica",
      descricao: i.achados || "Sem anotações",
    })),
    ...dadosApp.exames.map((i) => ({
      ...i,
      tipo: "🔬 Exame",
      cor: "#E8F5E9",
      icone: "🔬",
      titulo: i.tipo || i.parametro || "Exame",
      descricao: `Resultado: ${i.valor || "--"}`,
    })),
    ...dadosApp.registrosDiarios.map((i) => ({
      ...i,
      tipo: "📝 Diário",
      cor: "#FFF1F3",
      icone: "📝",
      titulo: "Registro de Bem-estar",
      descricao: `Peso: ${i.peso || "--"}kg | Pressão: ${i.pressao || "--"} | Sintomas: ${i.sintomas || "--"}`,
    })),
  ];

  console.log("📋 Total de registros unificados:", todos.length);

  const filtrados = todos
    .filter((i) => {
      if (!i.data) {
        console.warn("Registro sem data:", i);
        return false;
      }
      const d = new Date(i.data);
      return d >= inicio && d <= fim;
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  console.log("✅ Registros filtrados:", filtrados.length);

  if (!container) return;

  if (filtrados.length === 0) {
    container.innerHTML =
      "<p style='text-align:center; color:#999; padding:20px;'>Nenhum registro neste período.</p>";
    return;
  }

  container.innerHTML = filtrados
    .map(
      (i) => `
    <div class="timeline-card" style="background:${i.cor}; padding:15px; border-radius:15px; margin-bottom:10px; border-left: 5px solid var(--rosa);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">${i.icone}</span>
          <span style="font-weight:600; color:#333;">${i.tipo}</span>
        </div>
        <span style="font-size:11px; color:#666;">${new Date(i.data).toLocaleDateString("pt-BR")}</span>
      </div>
      <p style="font-weight:700; margin:5px 0; color:#444;">${i.titulo}</p>
      <p style="font-size:12px; color:#666; margin-top:5px;">${i.descricao}</p>
    </div>
  `,
    )
    .join("");
}
// ==================== GRÁFICOS DA SAÚDE ====================

function atualizarGraficoPeso() {
  const canvas = document.getElementById("graficoPeso");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const registrosComPeso = dadosApp.registrosDiarios
    .filter((r) => r.peso && r.peso !== "" && !isNaN(parseFloat(r.peso)))
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (registrosComPeso.length === 0) {
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";
  if (graficoPeso) graficoPeso.destroy();

  graficoPeso = new Chart(ctx, {
    type: "line",
    data: {
      labels: registrosComPeso.map((r) =>
        new Date(r.data).toLocaleDateString("pt-BR"),
      ),
      datasets: [
        {
          label: "Peso (kg)",
          data: registrosComPeso.map((r) => parseFloat(r.peso)),
          borderColor: "#f06292",
          backgroundColor: "rgba(240, 98, 146, 0.1)",
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#f06292",
          pointRadius: 5,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: true },
  });
}

function atualizarGraficoPressao() {
  const canvas = document.getElementById("graficoPressao");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const registrosComPressao = dadosApp.registrosDiarios
    .filter((r) => r.pressao && r.pressao !== "" && r.pressao.includes("/"))
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (registrosComPressao.length === 0) {
    canvas.style.display = "none";
    return;
  }

  canvas.style.display = "block";
  if (graficoPressao) graficoPressao.destroy();

  graficoPressao = new Chart(ctx, {
    type: "line",
    data: {
      labels: registrosComPressao.map((r) =>
        new Date(r.data).toLocaleDateString("pt-BR"),
      ),
      datasets: [
        {
          label: "Sistólica (mmHg)",
          data: registrosComPressao.map((r) =>
            parseInt(r.pressao.split("/")[0]),
          ),
          borderColor: "#ba68c8",
          backgroundColor: "rgba(186, 104, 200, 0.1)",
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#ba68c8",
          pointRadius: 5,
        },
        {
          label: "Diastólica (mmHg)",
          data: registrosComPressao.map((r) =>
            parseInt(r.pressao.split("/")[1]),
          ),
          borderColor: "#81c784",
          backgroundColor: "rgba(129, 199, 132, 0.1)",
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#81c784",
          pointRadius: 5,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: true },
  });
}

// ==================== GRÁFICO DA SEÇÃO MÉDICO ====================

function atualizarGraficoExames() {
  const canvas = document.getElementById("graficoExames");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let examesFiltrados = [...dadosApp.exames];
  if (tipoExameSelecionado !== "todos") {
    examesFiltrados = examesFiltrados.filter((exame) => {
      const tipo = (exame.tipo || exame.parametro || "Exame").toLowerCase();
      return tipo === tipoExameSelecionado.toLowerCase();
    });
  }

  const examesComValor = examesFiltrados
    .filter(
      (exame) =>
        exame.valor &&
        !isNaN(parseFloat(exame.valor)) &&
        exame.valor.toString().trim() !== "",
    )
    .sort((a, b) => new Date(a.data) - new Date(b.data));

  if (examesComValor.length === 0) {
    canvas.style.display = "none";
    document.getElementById("infoExameSelecionado")?.classList.remove("show");
    return;
  }

  canvas.style.display = "block";
  if (graficoExames) graficoExames.destroy();

  const infoDiv = document.getElementById("infoExameSelecionado");
  if (infoDiv && tipoExameSelecionado !== "todos") {
    const ultimoValor = examesComValor[examesComValor.length - 1].valor;
    const primeiroValor = examesComValor[0].valor;
    const variacao = (
      parseFloat(ultimoValor) - parseFloat(primeiroValor)
    ).toFixed(1);
    infoDiv.innerHTML = `<strong>📊 ${tipoExameSelecionado.toUpperCase()}</strong><br>Último resultado: ${ultimoValor}<br>Variação: ${variacao > 0 ? "📈 +" : "📉 "}${variacao}`;
    infoDiv.classList.add("show");
  } else if (infoDiv) {
    infoDiv.classList.remove("show");
  }

  graficoExames = new Chart(ctx, {
    type: "line",
    data: {
      labels: examesComValor.map((e) =>
        new Date(e.data).toLocaleDateString("pt-BR"),
      ),
      datasets: [
        {
          label:
            tipoExameSelecionado === "todos"
              ? "Valores dos Exames"
              : tipoExameSelecionado,
          data: examesComValor.map((e) => parseFloat(e.valor)),
          borderColor: "#ba68c8",
          backgroundColor: "rgba(186, 104, 200, 0.1)",
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#ba68c8",
          pointRadius: 5,
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: true },
  });
}

// ==================== SEÇÃO MÉDICO - EXIBIR EXAMES ====================

function exibirExamesMedico() {
  const container = document.getElementById("listaExamesMedico");
  if (!container) return;

  const examesOrdenados = [...dadosApp.exames].sort(
    (a, b) => new Date(b.data) - new Date(a.data),
  );
  const total = examesOrdenados.length;
  const temMais = total > (examesPagina + 1) * ITENS_POR_PAGINA;
  const exibir = examesOrdenados.slice(
    0,
    (examesPagina + 1) * ITENS_POR_PAGINA,
  );

  if (exibir.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhum exame registrado</p>";
  } else {
    container.innerHTML = exibir
      .map(
        (exame) => `
      <div class="historico-item" onclick="verDetalhesExame(${dadosApp.exames.findIndex((e) => e === exame)})">
        <div class="historico-data">📅 ${new Date(exame.data).toLocaleDateString("pt-BR")}</div>
        <div class="historico-titulo">🔬 ${exame.tipo || exame.parametro || "Exame"}</div>
        <div class="historico-desc">Resultado: ${exame.valor || "--"}</div>
      </div>
    `,
      )
      .join("");
  }

  const btnMais = document.getElementById("btnMaisExamesMedico");
  if (btnMais) btnMais.style.display = temMais ? "block" : "none";
}

function carregarMaisExamesMedico() {
  examesPagina++;
  exibirExamesMedico();
}

// ==================== SEÇÃO MÉDICO - EXIBIR CONSULTAS ====================

function exibirConsultasMedico() {
  const container = document.getElementById("listaConsultasMedico");
  if (!container) return;

  const consultasOrdenadas = [...dadosApp.consultas].sort(
    (a, b) => new Date(b.data) - new Date(a.data),
  );
  const total = consultasOrdenadas.length;
  const temMais = total > (consultasPagina + 1) * ITENS_POR_PAGINA;
  const exibir = consultasOrdenadas.slice(
    0,
    (consultasPagina + 1) * ITENS_POR_PAGINA,
  );

  if (exibir.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhuma consulta registrada</p>";
  } else {
    container.innerHTML = exibir
      .map(
        (consulta) => `
      <div class="historico-item" onclick="verDetalhesConsulta(${dadosApp.consultas.findIndex((c) => c === consulta)})">
        <div class="historico-data">📅 ${new Date(consulta.data).toLocaleDateString("pt-BR")}</div>
        <div class="historico-titulo">👩‍⚕️ ${consulta.especialidade || "Consulta médica"}</div>
        <div class="historico-desc">${consulta.achados ? consulta.achados.substring(0, 60) + (consulta.achados.length > 60 ? "..." : "") : "Sem anotações"}</div>
      </div>
    `,
      )
      .join("");
  }

  const btnMais = document.getElementById("btnMaisConsultasMedico");
  if (btnMais) btnMais.style.display = temMais ? "block" : "none";
}

function carregarMaisConsultasMedico() {
  consultasPagina++;
  exibirConsultasMedico();
}

// ==================== FILTROS POR ANO ====================

function filtrarExamesPorAno() {
  const ano = document.getElementById("filtroExamesAno").value;
  examesPagina = 0;

  const container = document.getElementById("listaExamesMedico");
  if (!container) return;

  let examesFiltrados = [...dadosApp.exames];
  if (ano !== "todos") {
    examesFiltrados = examesFiltrados.filter(
      (e) => new Date(e.data).getFullYear() == ano,
    );
  }

  examesFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
  const temMais = examesFiltrados.length > ITENS_POR_PAGINA;
  const exibir = examesFiltrados.slice(0, ITENS_POR_PAGINA);

  if (exibir.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhum exame neste período</p>";
  } else {
    container.innerHTML = exibir
      .map(
        (exame) => `
      <div class="historico-item" onclick="verDetalhesExame(${dadosApp.exames.findIndex((e) => e === exame)})">
        <div class="historico-data">📅 ${new Date(exame.data).toLocaleDateString("pt-BR")}</div>
        <div class="historico-titulo">🔬 ${exame.tipo || exame.parametro || "Exame"}</div>
        <div class="historico-desc">Resultado: ${exame.valor || "--"}</div>
      </div>
    `,
      )
      .join("");
  }

  const btnMais = document.getElementById("btnMaisExamesMedico");
  if (btnMais) btnMais.style.display = temMais ? "block" : "none";
}

function filtrarConsultasPorAno() {
  const ano = document.getElementById("filtroConsultasAno").value;
  consultasPagina = 0;

  const container = document.getElementById("listaConsultasMedico");
  if (!container) return;

  let consultasFiltradas = [...dadosApp.consultas];
  if (ano !== "todos") {
    consultasFiltradas = consultasFiltradas.filter(
      (c) => new Date(c.data).getFullYear() == ano,
    );
  }

  consultasFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));
  const temMais = consultasFiltradas.length > ITENS_POR_PAGINA;
  const exibir = consultasFiltradas.slice(0, ITENS_POR_PAGINA);

  if (exibir.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhuma consulta neste período</p>";
  } else {
    container.innerHTML = exibir
      .map(
        (consulta) => `
      <div class="historico-item" onclick="verDetalhesConsulta(${dadosApp.consultas.findIndex((c) => c === consulta)})">
        <div class="historico-data">📅 ${new Date(consulta.data).toLocaleDateString("pt-BR")}</div>
        <div class="historico-titulo">👩‍⚕️ ${consulta.especialidade || "Consulta médica"}</div>
        <div class="historico-desc">${consulta.achados ? consulta.achados.substring(0, 60) + (consulta.achados.length > 60 ? "..." : "") : "Sem anotações"}</div>
      </div>
    `,
      )
      .join("");
  }

  const btnMais = document.getElementById("btnMaisConsultasMedico");
  if (btnMais) btnMais.style.display = temMais ? "block" : "none";
}

// ==================== TABS DA SEÇÃO MÉDICO ====================

function mudarTabMedico(tab) {
  document
    .querySelectorAll(".tab-medico")
    .forEach((btn) => btn.classList.remove("active"));
  if (tab === "exames") {
    document.querySelector(".tab-medico:first-child").classList.add("active");
    document.getElementById("tabExames").style.display = "block";
    document.getElementById("tabConsultas").style.display = "none";
    examesPagina = 0;
    exibirExamesMedico();
  } else {
    document.querySelector(".tab-medico:last-child").classList.add("active");
    document.getElementById("tabExames").style.display = "none";
    document.getElementById("tabConsultas").style.display = "block";
    consultasPagina = 0;
    exibirConsultasMedico();
  }
}

// ==================== POPULAR SELETOR DE TIPOS DE EXAME ====================

function popularSeletorTiposExame() {
  const select = document.getElementById("seletorTipoExame");
  if (!select) return;

  const tipos = [
    ...new Set(
      dadosApp.exames.map((exame) =>
        (exame.tipo || exame.parametro || "Exame").toLowerCase(),
      ),
    ),
  ].sort();

  let options = '<option value="todos">📊 Todos os exames</option>';
  tipos.forEach((tipo) => {
    const count = dadosApp.exames.filter(
      (e) => (e.tipo || e.parametro || "Exame").toLowerCase() === tipo,
    ).length;
    const tipoFormatado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    options += `<option value="${tipo}">🔬 ${tipoFormatado} (${count})</option>`;
  });

  select.innerHTML = options;
  if (tipoExameSelecionado && tipoExameSelecionado !== "todos") {
    const optionExists = Array.from(select.options).some(
      (opt) => opt.value === tipoExameSelecionado,
    );
    if (optionExists) select.value = tipoExameSelecionado;
    else tipoExameSelecionado = "todos";
  }
}

function filtrarGraficoPorExame() {
  const select = document.getElementById("seletorTipoExame");
  if (select) {
    tipoExameSelecionado = select.value;
    atualizarGraficoExames();
  }
}

// ==================== POPULAR ANOS NOS FILTROS ====================

function popularAnosFiltros() {
  const anos = [
    ...new Set([
      ...dadosApp.consultas.map((c) => new Date(c.data).getFullYear()),
      ...dadosApp.exames.map((e) => new Date(e.data).getFullYear()),
    ]),
  ]
    .sort()
    .reverse();

  const selectConsultas = document.getElementById("filtroConsultasAno");
  const selectExames = document.getElementById("filtroExamesAno");

  if (selectConsultas)
    selectConsultas.innerHTML =
      '<option value="todos">Todos os anos</option>' +
      anos.map((a) => `<option value="${a}">${a}</option>`).join("");
  if (selectExames)
    selectExames.innerHTML =
      '<option value="todos">Todos os anos</option>' +
      anos.map((a) => `<option value="${a}">${a}</option>`).join("");
}

// ==================== VER DETALHES ====================

function verDetalhesConsulta(index) {
  const consulta = dadosApp.consultas[index];
  if (!consulta) return;
  document.getElementById("detalhesData").textContent = new Date(
    consulta.data,
  ).toLocaleDateString("pt-BR");
  document.getElementById("detalhesEspecialidade").textContent =
    consulta.especialidade || "Não informada";
  document.getElementById("detalhesAchados").textContent =
    consulta.achados || "Sem anotações";
  document.getElementById("modalDetalhesConsulta").style.display = "flex";
}

function verDetalhesExame(index) {
  const exame = dadosApp.exames[index];
  if (!exame) return;
  document.getElementById("detalhesExameData").textContent = new Date(
    exame.data,
  ).toLocaleDateString("pt-BR");
  document.getElementById("detalhesExameTipo").textContent =
    exame.tipo || exame.parametro || "Não informado";
  document.getElementById("detalhesExameValor").textContent =
    exame.valor || "--";
  document.getElementById("modalDetalhesExame").style.display = "flex";
}

function fecharModalDetalhes() {
  document
    .querySelectorAll(".modal-detalhes")
    .forEach((modal) => (modal.style.display = "none"));
}

// ==================== HISTÓRICOS DA SAÚDE ====================

function exibirHistoricoPeso() {
  const container = document.getElementById("listaPeso");
  if (!container) return;
  const registros = dadosApp.registrosDiarios
    .filter((r) => r.peso)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  if (registros.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhum registro de peso</p>";
    return;
  }
  container.innerHTML = registros
    .map(
      (r) =>
        `<div class="historico-item"><div class="historico-data">📅 ${new Date(r.data).toLocaleDateString("pt-BR")}</div><div class="historico-titulo">⚖️ Peso: ${r.peso} kg</div><div class="historico-desc">Pressão: ${r.pressao || "--"}</div></div>`,
    )
    .join("");
}

function exibirHistoricoPressao() {
  const container = document.getElementById("listaPressao");
  if (!container) return;
  const registros = dadosApp.registrosDiarios
    .filter((r) => r.pressao)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  if (registros.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhum registro de pressão</p>";
    return;
  }
  container.innerHTML = registros
    .map(
      (r) =>
        `<div class="historico-item"><div class="historico-data">📅 ${new Date(r.data).toLocaleDateString("pt-BR")}</div><div class="historico-titulo">❤️ Pressão: ${r.pressao} mmHg</div><div class="historico-desc">Peso: ${r.peso || "--"} kg</div></div>`,
    )
    .join("");
}

function exibirHistoricoSintomas() {
  const container = document.getElementById("listaSintomas");
  if (!container) return;
  const registros = dadosApp.registrosDiarios
    .filter((r) => r.sintomas && r.sintomas.trim() !== "")
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  if (registros.length === 0) {
    container.innerHTML =
      "<p style='color:#999; text-align:center;'>Nenhum registro de sintomas</p>";
    return;
  }
  container.innerHTML = registros
    .map(
      (r) =>
        `<div class="historico-item"><div class="historico-data">📅 ${new Date(r.data).toLocaleDateString("pt-BR")}</div><div class="historico-titulo">🤰 Sintomas</div><div class="historico-desc">${r.sintomas}</div></div>`,
    )
    .join("");
}

// ==================== ATUALIZAR ESTATÍSTICAS ====================

function atualizarEstatisticas() {
  if (document.getElementById("totalConsultas"))
    document.getElementById("totalConsultas").textContent =
      dadosApp.consultas.length;
  if (document.getElementById("totalExames"))
    document.getElementById("totalExames").textContent = dadosApp.exames.length;
  if (document.getElementById("totalRegistros"))
    document.getElementById("totalRegistros").textContent =
      dadosApp.registrosDiarios.length;

  if (
    dadosApp.consultas.length > 0 &&
    document.getElementById("ultimaConsulta")
  ) {
    const ultima = [...dadosApp.consultas].sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    )[0];
    document.getElementById("ultimaConsulta").textContent = new Date(
      ultima.data,
    )
      .toLocaleDateString("pt-BR")
      .slice(0, 5);
  } else if (document.getElementById("ultimaConsulta")) {
    document.getElementById("ultimaConsulta").textContent = "--";
  }

  const pesoAtual = [...dadosApp.registrosDiarios]
    .filter((r) => r.peso)
    .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  if (pesoAtual && document.getElementById("pesoAtual")) {
    document.getElementById("pesoAtual").textContent =
      parseFloat(pesoAtual.peso).toFixed(1) + " kg";
  } else if (document.getElementById("pesoAtual")) {
    document.getElementById("pesoAtual").textContent = "-- kg";
  }

  const pressaoAtual = [...dadosApp.registrosDiarios]
    .filter((r) => r.pressao)
    .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
  if (pressaoAtual && document.getElementById("pressaoAtual")) {
    document.getElementById("pressaoAtual").textContent =
      pressaoAtual.pressao + " mmHg";
  } else if (document.getElementById("pressaoAtual")) {
    document.getElementById("pressaoAtual").textContent = "--";
  }
}

function atualizarEstatisticasMedico() {
  if (document.getElementById("totalExamesMedico"))
    document.getElementById("totalExamesMedico").textContent =
      dadosApp.exames.length;
  if (document.getElementById("totalConsultasMedico"))
    document.getElementById("totalConsultasMedico").textContent =
      dadosApp.consultas.length;
  if (dadosApp.exames.length > 0 && document.getElementById("ultimoExame")) {
    const ultimo = [...dadosApp.exames].sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    )[0];
    document.getElementById("ultimoExame").textContent = new Date(ultimo.data)
      .toLocaleDateString("pt-BR")
      .slice(0, 5);
  } else if (document.getElementById("ultimoExame")) {
    document.getElementById("ultimoExame").textContent = "--";
  }
}

// ==================== TABS DO HISTÓRICO DA SAÚDE ====================

function mudarTabHistorico(tab) {
  document
    .querySelectorAll(".tab-historico")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".historico-lista-tab")
    .forEach((div) => (div.style.display = "none"));
  if (tab === "peso") {
    document
      .querySelector(".tab-historico:first-child")
      .classList.add("active");
    document.getElementById("listaPeso").style.display = "block";
    exibirHistoricoPeso();
  } else if (tab === "pressao") {
    document
      .querySelector(".tab-historico:nth-child(2)")
      .classList.add("active");
    document.getElementById("listaPressao").style.display = "block";
    exibirHistoricoPressao();
  } else if (tab === "sintomas") {
    document
      .querySelector(".tab-historico:nth-child(3)")
      .classList.add("active");
    document.getElementById("listaSintomas").style.display = "block";
    exibirHistoricoSintomas();
  }
}

// ==================== ATUALIZAR TODAS AS ABAS ====================

function atualizarTodasAbas() {
  exibirHistoricoPeso();
  exibirHistoricoPressao();
  exibirHistoricoSintomas();
  atualizarGraficoPeso();
  atualizarGraficoPressao();
  examesPagina = 0;
  consultasPagina = 0;
  exibirExamesMedico();
  exibirConsultasMedico();
  atualizarGraficoExames();
}

// ==================== TAMANHO DO BEBÊ ====================

function calcularTamanhoBebe(semanas) {
  const tamanhos = {
    12: 5.4,
    16: 11.6,
    20: 16.4,
    24: 21.3,
    28: 24.8,
    32: 28.5,
    36: 34.6,
    40: 50.0,
  };
  let tamanho = 0;
  for (let i = 12; i <= 40; i++)
    if (semanas >= i && tamanhos[i]) tamanho = tamanhos[i];
  if (semanas < 12) tamanho = Math.max(1, Math.round((semanas / 12) * 5.4));
  else if (semanas > 40) tamanho = 50;
  else if (semanas > 12 && semanas < 16)
    tamanho = 5.4 + (11.6 - 5.4) * ((semanas - 12) / 4);
  else if (semanas > 16 && semanas < 20)
    tamanho = 11.6 + (16.4 - 11.6) * ((semanas - 16) / 4);
  else if (semanas > 20 && semanas < 24)
    tamanho = 16.4 + (21.3 - 16.4) * ((semanas - 20) / 4);
  else if (semanas > 24 && semanas < 28)
    tamanho = 21.3 + (24.8 - 21.3) * ((semanas - 24) / 4);
  else if (semanas > 28 && semanas < 32)
    tamanho = 24.8 + (28.5 - 24.8) * ((semanas - 28) / 4);
  else if (semanas > 32 && semanas < 36)
    tamanho = 28.5 + (34.6 - 28.5) * ((semanas - 32) / 4);
  else if (semanas > 36 && semanas < 40)
    tamanho = 34.6 + (50 - 34.6) * ((semanas - 36) / 4);
  return Math.round(tamanho * 10) / 10;
}

function atualizarTamanhoBebe() {
  const info = calcularIdadeGestacional();
  const semanas = info.semanas;
  const tamanhoElement = document.getElementById("tamanhoBebe");
  if (tamanhoElement)
    tamanhoElement.textContent = `${calcularTamanhoBebe(semanas)} cm`;
  const semanasRestantesElement = document.getElementById("semanasRestantes");
  if (semanasRestantesElement)
    semanasRestantesElement.textContent = Math.max(0, 40 - semanas);
}
function aplicarTemaPorSexo() {
  const sexo = dadosApp.config.sexoBebe || "Menina";
  const body = document.body;

  if (sexo === "Menino") {
    body.classList.add("modo-menino");
  } else {
    body.classList.remove("modo-menino");
  }
}
