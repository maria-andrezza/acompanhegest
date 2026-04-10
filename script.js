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

// Define o usuário ativo através do sistema de auth
const usuarioAtivo =
  typeof auth !== "undefined" && auth.getUsuarioAtivo()
    ? auth.getUsuarioAtivo()
    : "Andrezza";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🌸 Inicializando UI...");
  // Força a autenticação para garantir que o usuário ativo exista
  if (typeof auth !== "undefined") auth.verificarAutenticacao();
  inicializarApp();
});

function inicializarApp() {
  try {
    const salvos = localStorage.getItem(`acompanhegest_dados_${usuarioAtivo}`);
    if (salvos) dadosApp = JSON.parse(salvos);

    // --- CORREÇÃO DA TELA BRANCA ---
    const loading = document.getElementById("loading");
    const app = document.getElementById("appContainer");

    if (loading) loading.style.display = "none";
    if (app) {
      app.classList.remove("container-oculto");
      app.classList.add("container-visivel");
    }

    configurarNavegacao();
    atualizarInterfaceHome();
  } catch (e) {
    console.error("Erro ao carregar app:", e);
    document.getElementById("appContainer").classList.add("container-visivel");
  }
}

function configurarNavegacao() {
  const botoes = document.querySelectorAll(".menu-item");
  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {
      const alvo = btn.getAttribute("data-secao");
      const isInicio = alvo === "inicio";

      document.getElementById("mainHeader").style.display = isInicio
        ? "block"
        : "none";
      document.getElementById("bebeCard").style.display = isInicio
        ? "flex"
        : "none";

      botoes.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelectorAll(".secao")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(`secao-${alvo}`).classList.add("active");

      if (alvo === "perfil") carregarDadosPerfil();
    });
  });
}

function calcularIdadeGestacional() {
  if (!dadosApp.config.dataInicioGestacao)
    return { semanas: 0, dias: 0, mes: 1, percentual: 0, diasRestantes: 280 };

  const diff = Math.floor(
    (new Date() - new Date(dadosApp.config.dataInicioGestacao)) / 86400000,
  );
  const semanas = Math.floor(diff / 7);

  // Tabela de Meses Gestacionais
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
  document.getElementById("semanasDias").textContent =
    `${info.semanas} semanas e ${info.dias} dias`;
  document.getElementById("mesGestacao").textContent = `${info.mes}º mês`;
  document.getElementById("progressoBarra").style.width = `${info.percentual}%`;
  document.getElementById("diasRestantes").textContent = info.diasRestantes;
  document.getElementById("nomeUsuario").textContent =
    dadosApp.config.nome || "Andrezza";
  document.getElementById("bebeNome").textContent =
    dadosApp.config.nomeBebe || "Íris";

  // Dashboard IA
  const chaves = Object.keys(curiosidadesIA).reverse();
  const chave = chaves.find((s) => info.semanas >= s) || 8;
  document.getElementById("resumoIA").innerHTML =
    `<p>"${curiosidadesIA[chave]}"</p>`;
}

// --- GESTÃO DE DADOS ---

function abrirModal(tipo) {
  const ids = {
    consulta: "modalConsulta",
    exame: "modalExame",
    diario: "modalDiario",
  };
  document.getElementById(ids[tipo]).style.display = "flex";
}

function fecharModal(id) {
  document.getElementById(id).style.display = "none";
}

function salvarConsulta() {
  dadosApp.consultas.push({
    especialidade: document.getElementById("c_especialidade").value,
    data: document.getElementById("c_data").value,
    achados: document.getElementById("c_achados").value,
  });
  finalizarUpdate("modalConsulta");
}

function salvarExame() {
  dadosApp.exames.push({
    parametro: document.getElementById("e_tipo").value,
    valor: document.getElementById("e_valor").value,
    data: document.getElementById("e_data").value,
  });
  finalizarUpdate("modalExame");
}

function salvarDiario() {
  dadosApp.registrosDiarios.push({
    data: document.getElementById("d_data").value,
    peso: document.getElementById("d_peso").value,
    pressao: document.getElementById("d_pressao").value,
    sintomas: document.getElementById("d_sintomas").value,
  });
  finalizarUpdate("modalDiario");
}

function finalizarUpdate(modalId) {
  localStorage.setItem(
    `acompanhegest_dados_${usuarioAtivo}`,
    JSON.stringify(dadosApp),
  );
  fecharModal(modalId);
  alert("Dados salvos com carinho! 🌸");
  atualizarInterfaceHome();
}

function salvarConfig() {
  const sem = parseInt(document.getElementById("inputSemanas").value) || 0;
  const dia = parseInt(document.getElementById("inputDias").value) || 0;
  const dataRef = new Date();
  dataRef.setDate(dataRef.getDate() - (sem * 7 + dia));

  dadosApp.config = {
    nome: document.getElementById("nome").value,
    dataInicioGestacao: dataRef.toISOString(),
    nomeBebe: document.getElementById("nomeBebe").value,
  };

  localStorage.setItem(
    `acompanhegest_dados_${usuarioAtivo}`,
    JSON.stringify(dadosApp),
  );
  alert("Perfil Atualizado!");
  atualizarInterfaceHome();
}

function carregarDadosPerfil() {
  document.getElementById("nome").value = dadosApp.config.nome || "";
  document.getElementById("nomeBebe").value = dadosApp.config.nomeBebe || "";
  const info = calcularIdadeGestacional();
  document.getElementById("inputSemanas").value = info.semanas;
  document.getElementById("inputDias").value = info.dias;
}

function renderizarFiltroGeral() {
  const inicio = new Date(document.getElementById("filtroInicio").value);
  const fim = new Date(document.getElementById("filtroFim").value);
  const container = document.getElementById("listaFiltradaGeral");

  if (isNaN(inicio)) return alert("Selecione as datas.");

  container.innerHTML = "";
  const todos = [
    ...dadosApp.consultas.map((i) => ({
      ...i,
      t: "👩‍⚕️ Consulta",
      c: "#F3E5F5",
    })),
    ...dadosApp.exames.map((i) => ({ ...i, t: "🔬 Exame", c: "#E8F5E9" })),
    ...dadosApp.registrosDiarios.map((i) => ({
      ...i,
      t: "📝 Diário",
      c: "#FFF1F3",
    })),
  ];

  const filtrados = todos
    .filter((i) => {
      const d = new Date(i.data);
      return d >= inicio && d <= fim;
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  filtrados.forEach((i) => {
    const detalhes =
      i.t === "📝 Diário"
        ? `PA: ${i.pressao || "--"} | Peso: ${i.peso}kg | Info: ${i.sintomas}`
        : i.achados || i.valor;
    container.innerHTML += `
            <div class="timeline-card" style="background:${i.c}; border-radius:15px; padding:15px; margin-bottom:10px; border-left: 5px solid rgba(0,0,0,0.1);">
                <small>${i.t} • ${new Date(i.data).toLocaleDateString("pt-BR")}</small>
                <p><strong>${i.especialidade || i.parametro || "Registro Diário"}</strong></p>
                <p style="font-size:12px">${detalhes}</p>
            </div>`;
  });
}
