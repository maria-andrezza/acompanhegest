async function carregarDadosDoNeon() {
  if (!usuarioAtivo) return false;

  try {
    console.log(`📡 Carregando dados do Neon para ${usuarioAtivo}...`);

    const response = await fetch(`/api/todos-dados/${usuarioAtivo}`);

    if (!response.ok) {
      console.error(`❌ Erro na API: ${response.status}`);
      return false;
    }

    const dados = await response.json();

    dadosApp.consultas = dados.consultas || [];
    dadosApp.exames = dados.exames || [];
    dadosApp.registrosDiarios = dados.registrosDiarios || [];

    console.log(
      `✅ Carregados: ${dadosApp.consultas.length} consultas, ` +
        `${dadosApp.exames.length} exames, ` +
        `${dadosApp.registrosDiarios.length} registros`,
    );

    // Atualizar interfaces
    atualizarEstatisticas();
    atualizarEstatisticasMedico();
    popularAnosFiltros();
    popularSeletorTiposExame();
    atualizarGraficoExames();

    if (document.getElementById("secao-saude")?.classList.contains("active")) {
      atualizarGraficoPeso();
      atualizarGraficoPressao();
      exibirHistoricoPeso();
      exibirHistoricoPressao();
      exibirHistoricoSintomas();
    }

    if (document.getElementById("secao-medico")?.classList.contains("active")) {
      examesPagina = 0;
      consultasPagina = 0;
      exibirExamesMedico();
      exibirConsultasMedico();
    }

    return true;
  } catch (error) {
    console.error("❌ Erro de conexão com Neon:", error);
    // Opcional: mostrar mensagem amigável para o usuário
    // alert("Não foi possível carregar os dados. Verifique sua conexão.");
    return false;
  }
}
