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
const usuarioAtivo = auth.getUsuarioAtivo();

const curiosidadesIA = {
  8: "Os dedinhos da Íris estão se formando e ela já se mexe (mesmo que você não sinta)! 🧸",
  12: "O sistema urinário dela começou a funcionar! O rosto está cada vez mais definido. ✨",
  20: "Metade do caminho! A Íris já ouve sua voz. Que tal ler uma história para ela hoje? 📖",
  28: "Ela já pisca os olhos! O cérebro está em uma fase de crescimento explosivo. 🧠",
  36: "Ela está ganhando gordura para ficar quentinha. Quase hora de conhecer esse amor! ❤️",
};

document.addEventListener("DOMContentLoaded", () => {
  if (auth.verificarAutenticacao()) inicializarApp();
});

function inicializarApp() {
  const salvos = localStorage.getItem(`acompanhegest_dados_${usuarioAtivo}`);
  if (salvos) dadosApp = JSON.parse(salvos);
  if (!dadosApp.registrosDiarios) dadosApp.registrosDiarios = [];

  document.getElementById("loading").style.display = "none";
  document
    .getElementById("appContainer")
    .classList.replace("container-oculto", "container-visivel");

  configurarNavegacao();
  atualizarInterfaceHome();
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

  // Tabela simplificada de meses gestacionais
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
    `${info.semanas} sem. e ${info.dias} dias`;
  document.getElementById("mesGestacao").textContent = `${info.mes}º mês`;
  document.getElementById("progressoBarra").style.width = `${info.percentual}%`;
  document.getElementById("diasRestantes").textContent = info.diasRestantes;
  document.getElementById("nomeUsuario").textContent =
    dadosApp.config.nome || "Andrezza";
  document.getElementById("bebeNome").textContent =
    dadosApp.config.nomeBebe || "Íris";

  const chaves = Object.keys(curiosidadesIA).reverse();
  const chave = chaves.find((s) => info.semanas >= s) || 8;
  document.getElementById("resumoIA").innerHTML =
    `<p>"${curiosidadesIA[chave]}"</p>`;
}

// Modais e Registros
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
  alert("Perfil Atualizado! 🌸");
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
    ...dadosApp.consultas.map((i) => ({ ...i, t: "Consulta", c: "#F3E5F5" })),
    ...dadosApp.exames.map((i) => ({ ...i, t: "Exame", c: "#E8F5E9" })),
    ...dadosApp.registrosDiarios.map((i) => ({
      ...i,
      t: "Diário",
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
      i.t === "Diário"
        ? `PA: ${i.pressao || "--"} | Peso: ${i.peso}kg`
        : i.achados || i.valor;
    container.innerHTML += `<div class="timeline-card" style="background:${i.c}">
            <small>${i.t} • ${new Date(i.data).toLocaleDateString("pt-BR")}</small>
            <p><strong>${i.especialidade || i.parametro}</strong></p>
            <p style="font-size:12px">${detalhes}</p>
        </div>`;
  });
}
