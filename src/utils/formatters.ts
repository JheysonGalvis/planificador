import type {
  AnalisisInterger,
  EstadoAliado,
  PropuestaInterger,
} from '../types/interger';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatoCop(valor: number): string {
  const limpio = Number.isFinite(valor) ? Math.round(valor) : 0;
  return `${copFormatter.format(limpio)} COP`;
}

export function etiquetaEstadoAliado(estado: EstadoAliado): string {
  switch (estado) {
    case 'confirmado':
      return 'Confirmado';
    case 'potencial':
      return 'Potencial';
    case 'por_confirmar':
      return 'Por confirmar';
  }
}

export function calcularTotales(propuesta: PropuestaInterger) {
  const totalCostosVariables = propuesta.costosVariables.reduce(
    (sum, item) => sum + (Number(item.montoCop) || 0),
    0
  );
  const costosPorConfirmar = propuesta.costosVariables.filter(
    (item) => item.estado === 'estimado' && item.concepto.trim().length > 0
  ).length;
  const totalEspecie = propuesta.aportesEspecie.reduce(
    (sum, item) => sum + (Number(item.valorEstimadoCop) || 0),
    0
  );
  const aliadosPorConfirmar = propuesta.aportesEspecie.filter(
    (item) =>
      item.estadoAliado !== 'confirmado' &&
      (item.recurso.trim().length > 0 || item.aliado.trim().length > 0)
  ).length;

  const dineroDisponible = Number(propuesta.dineroDisponibleCop) || 0;
  const balanceEfectivo = dineroDisponible - totalCostosVariables;

  return {
    dineroDisponible,
    totalCostosVariables,
    costosPorConfirmar,
    totalEspecie,
    aliadosPorConfirmar,
    balanceEfectivo,
  };
}

export function generarResumenParaCopiar(
  propuesta: PropuestaInterger,
  analisis: AnalisisInterger | null
): string {
  const totales = calcularTotales(propuesta);
  const lineas: string[] = [
    '====================================================',
    'RESUMEN DE PLANEACIÓN · RETO INNOVA GENERACIONES (INTERGER)',
    'Universidad de Caldas · ACOPI',
    '====================================================',
    '',
    `Actividad o ciclo: ${propuesta.nombreActividad || 'Sin definir'}`,
    `Periodicidad: ${propuesta.periodicidad} | Participantes: ${propuesta.participantesEstimados || 'Sin definir'}`,
    `Línea principal: ${propuesta.lineaPrincipal}${propuesta.lineaRelacionada ? ` | Línea relacionada: ${propuesta.lineaRelacionada}` : ''}`,
    propuesta.justificacionLinea
      ? `Enfoque de la línea: ${propuesta.justificacionLinea}`
      : '',
    '',
    '1. PRESUPUESTO EN DINERO (COP)',
    `- Dinero disponible estimado: ${formatoCop(totales.dineroDisponible)} (${propuesta.dineroEsEstimado ? 'Estimado por confirmar' : 'Confirmado'})`,
    propuesta.fuenteDinero ? `- Fuente: ${propuesta.fuenteDinero}` : '',
    `- Total costos variables: ${formatoCop(totales.totalCostosVariables)}`,
    `- Balance en efectivo: ${formatoCop(totales.balanceEfectivo)}`,
    'Detalle de costos variables:',
    ...propuesta.costosVariables
      .filter((c) => c.concepto.trim() || c.montoCop > 0)
      .map(
        (c) =>
          `  * ${c.concepto || 'Concepto sin nombre'}: ${formatoCop(c.montoCop)} [${c.estado === 'confirmado' ? 'Confirmado' : 'Estimado por confirmar'}]`
      ),
    '',
    '2. APORTES EN ESPECIE Y ALIADOS',
    `- Valor equivalente estimado en especie: ${formatoCop(totales.totalEspecie)}`,
    ...propuesta.aportesEspecie
      .filter((a) => a.recurso.trim() || a.aliado.trim())
      .map(
        (a) =>
          `  * ${a.recurso || 'Recurso'} — Aliado: ${a.aliado || 'Por definir'} (${etiquetaEstadoAliado(a.estadoAliado)})${a.valorEstimadoCop > 0 ? ` · Aprox. ${formatoCop(a.valorEstimadoCop)}` : ''}`
      ),
    '',
    '3. INTERCAMBIO ENTRE GENERACIONES',
    `- Aporta generación joven: ${propuesta.aporteGeneracionJoven || 'Sin definir'}`,
    `- Aporta generación mayor: ${propuesta.aporteGeneracionMayor || 'Sin definir'}`,
    `- Qué recibe cada generación: ${propuesta.queRecibeCadaGeneracion || 'Sin definir'}`,
    `- Barrera que se reduce: ${propuesta.barreraReducida || 'Sin definir'}`,
    '',
    '4. PRIMERA PRUEBA / PILOTO',
    `- Idea de piloto: ${propuesta.ideaPiloto || 'Sin definir'}`,
    `- Indicador de éxito: ${propuesta.indicadorExito || 'Sin definir'}`,
  ];

  if (analisis) {
    lineas.push(
      '',
      '====================================================',
      'DIAGNÓSTICO DE IA (GEMINI)',
      '====================================================',
      `Resumen ejecutivo: ${analisis.resumenEjecutivo}`,
      '',
      `EQUILIBRIO FINANCIERO Y EN ESPECIE (${analisis.equilibrio.estado}):`,
      analisis.equilibrio.resumen,
      'Supuestos por verificar:',
      ...analisis.equilibrio.supuestosPorVerificar.map((s) => `  - ${s}`),
      'Recomendaciones:',
      ...analisis.equilibrio.recomendaciones.map((r) => `  - ${r}`),
      '',
      `RIESGO OPERATIVO PRINCIPAL: ${analisis.riesgo.riesgoPrincipal}`,
      `Por qué ocurre: ${analisis.riesgo.porQueOcurre}`,
      'Plan de contingencia:',
      ...analisis.riesgo.planContingencia.map((p) => `  - ${p}`),
      '',
      'DISTRIBUCIÓN EN PAREJA INTERGENERACIONAL:',
      `Enfoque: ${analisis.parejaIntergeneracional.enfoqueColaboracion}`,
      'Tareas generación joven:',
      ...analisis.parejaIntergeneracional.tareasJovenes.map((t) => `  - ${t}`),
      'Tareas generación mayor:',
      ...analisis.parejaIntergeneracional.tareasMayores.map((t) => `  - ${t}`),
      'Tareas conjuntas:',
      ...analisis.parejaIntergeneracional.tareasConjuntas.map((t) => `  - ${t}`),
      '',
      `PLAN DE PILOTO CORTO (${analisis.piloto.duracionSugerida}):`,
      `- Prueba: ${analisis.piloto.actividadPrueba}`,
      `- Indicador: ${analisis.piloto.indicador}`,
      `- Umbral de éxito: ${analisis.piloto.umbralExito}`,
      `- Continuar si: ${analisis.piloto.criteriosDecision.continuar}`,
      `- Ajustar si: ${analisis.piloto.criteriosDecision.ajustar}`,
      `- Replantear si: ${analisis.piloto.criteriosDecision.replantear}`
    );
  }

  return lineas.filter((l) => l !== undefined).join('\n');
}
