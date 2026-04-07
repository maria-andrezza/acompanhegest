function calcularIdadeGestacional() {
  if (!dadosApp.config.dpp)
    return {
      semanas: 0,
      dias: 0,
      meses: 0,
      semanasRestantes: 40,
      diasRestantes: 280,
      percentual: 0,
    };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dpp = new Date(dadosApp.config.dpp);
  dpp.setHours(0, 0, 0, 0);

  const totalDiasGestacao = 280; // 40 semanas
  const diasRestantes = Math.ceil((dpp - hoje) / (1000 * 60 * 60 * 24));
  const diasRestantesValidos = diasRestantes > 0 ? diasRestantes : 0;
  const diasPassados = totalDiasGestacao - diasRestantesValidos;

  const semanasCompletas = Math.floor(diasPassados / 7);
  const diasAvulsos = diasPassados % 7;
  const semanasRestantes = Math.floor(diasRestantesValidos / 7);
  const meses = Math.floor(semanasCompletas / 4.345);
  const percentual = (semanasCompletas / 40) * 100;

  return {
    semanas: semanasCompletas,
    dias: diasAvulsos,
    meses: meses,
    semanasRestantes: semanasRestantes,
    diasRestantes: diasRestantesValidos,
    percentual: percentual,
  };
}
