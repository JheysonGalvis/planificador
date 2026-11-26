export type LineaPrincipal = 'Sostenibilidad' | 'Cobertura' | 'Replicabilidad';

export type EstadoConfirmacion = 'confirmado' | 'estimado';

export type EstadoAliado = 'confirmado' | 'potencial' | 'por_confirmar';

export type CampoSugerencia =
  | 'linea'
  | 'presupuesto'
  | 'especie'
  | 'intercambio'
  | 'piloto';

export interface CostoVariableItem {
  id: string;
  concepto: string;
  montoCop: number;
  estado: EstadoConfirmacion;
}

export interface AporteEspecieItem {
  id: string;
  recurso: string;
  aliado: string;
  valorEstimadoCop: number;
  estadoAliado: EstadoAliado;
}

export interface PropuestaInterger {
  nombreActividad: string;
  periodicidad: 'Mensual' | 'Por ciclo de talleres';
  participantesEstimados: string;
  lineaPrincipal: LineaPrincipal;
  lineaRelacionada: '' | LineaPrincipal;
  justificacionLinea: string;
  dineroDisponibleCop: number;
  dineroEsEstimado: boolean;
  fuenteDinero: string;
  costosVariables: CostoVariableItem[];
  aportesEspecie: AporteEspecieItem[];
  aporteGeneracionJoven: string;
  aporteGeneracionMayor: string;
  queRecibeCadaGeneracion: string;
  barreraReducida: string;
  ideaPiloto: string;
  indicadorExito: string;
}

export interface SugerenciaCampo {
  titulo: string;
  resumen: string;
  valorPrincipal: string;
  valorSecundario?: string;
  valorTerciario?: string;
  valorCuarto?: string;
  montoSugeridoCop?: number;
}

export interface AnalisisInterger {
  resumenEjecutivo: string;
  equilibrio: {
    estado: 'Equilibrado' | 'Ajustado con supuestos' | 'Requiere ajustes';
    resumen: string;
    supuestosPorVerificar: string[];
    recomendaciones: string[];
  };
  riesgo: {
    riesgoPrincipal: string;
    porQueOcurre: string;
    planContingencia: string[];
  };
  parejaIntergeneracional: {
    enfoqueColaboracion: string;
    tareasJovenes: string[];
    tareasMayores: string[];
    tareasConjuntas: string[];
  };
  piloto: {
    duracionSugerida: string;
    actividadPrueba: string;
    indicador: string;
    umbralExito: string;
    criteriosDecision: {
      continuar: string;
      ajustar: string;
      replantear: string;
    };
  };
}

export interface MensajeAyuda {
  id: string;
  rol: 'usuario' | 'asistente';
  texto: string;
}
