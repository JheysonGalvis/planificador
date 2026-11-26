import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Sparkles,
  ClipboardCopy,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import type {
  AnalisisInterger,
  AporteEspecieItem,
  CostoVariableItem,
  EstadoAliado,
  LineaPrincipal,
  PropuestaInterger,
  SugerenciaCampo,
} from './types/interger';
import { EJEMPLO_INTERGER, PROPUESTA_VACIA } from './data/ejemploInterger';
import {
  calcularTotales,
  formatoCop,
  generarResumenParaCopiar,
} from './utils/formatters';
import { SuggestionBox } from './components/SuggestionBox';
import { HelpDrawer } from './components/HelpDrawer';
import { AnalysisPanel } from './components/AnalysisPanel';

const LINEAS: LineaPrincipal[] = [
  'Sostenibilidad',
  'Cobertura',
  'Replicabilidad',
];

const DESCRIPCION_LINEAS: Record<LineaPrincipal, string> = {
  Sostenibilidad:
    'Asegura que la actividad pueda sostenerse en el tiempo sin depender solo de donaciones.',
  Cobertura:
    'Amplía el número de personas mayores, jóvenes o comunidades participantes.',
  Replicabilidad:
    'Permite que otros grupos o barrios adopten el modelo de forma sencilla.',
};

export default function App() {
  const [propuesta, setPropuesta] = useState<PropuestaInterger>(PROPUESTA_VACIA);
  const [analisis, setAnalisis] = useState<AnalisisInterger | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [pestanaAyuda, setPestanaAyuda] = useState<'guia' | 'chat'>('guia');

  const totales = calcularTotales(propuesta);

  const abrirAyuda = (pestana: 'guia' | 'chat') => {
    setPestanaAyuda(pestana);
    setAyudaAbierta(true);
  };

  const cargarEjemplo = () => {
    setPropuesta(EJEMPLO_INTERGER);
    setAnalisis(null);
    setErrorAnalisis(null);
    setErrorValidacion(null);
  };

  const limpiarFormulario = () => {
    setPropuesta(PROPUESTA_VACIA);
    setAnalisis(null);
    setErrorAnalisis(null);
    setErrorValidacion(null);
  };

  const copiarResumen = async () => {
    const texto = generarResumenParaCopiar(propuesta, analisis);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const actualizarCampo = <K extends keyof PropuestaInterger>(
    campo: K,
    valor: PropuestaInterger[K]
  ) => {
    setPropuesta((prev) => ({ ...prev, [campo]: valor }));
    if (campo === 'nombreActividad' && errorValidacion) {
      setErrorValidacion(null);
    }
  };

  const agregarCosto = () => {
    const nuevo: CostoVariableItem = {
      id: `costo-${Date.now()}`,
      concepto: '',
      montoCop: 0,
      estado: 'estimado',
    };
    actualizarCampo('costosVariables', [...propuesta.costosVariables, nuevo]);
  };

  const actualizarCosto = (
    id: string,
    cambios: Partial<CostoVariableItem>
  ) => {
    actualizarCampo(
      'costosVariables',
      propuesta.costosVariables.map((item) =>
        item.id === id ? { ...item, ...cambios } : item
      )
    );
  };

  const eliminarCosto = (id: string) => {
    if (propuesta.costosVariables.length <= 1) {
      actualizarCampo('costosVariables', [
        { id: 'costo-1', concepto: '', montoCop: 0, estado: 'estimado' },
      ]);
      return;
    }
    actualizarCampo(
      'costosVariables',
      propuesta.costosVariables.filter((item) => item.id !== id)
    );
  };

  const agregarEspecie = () => {
    const nuevo: AporteEspecieItem = {
      id: `especie-${Date.now()}`,
      recurso: '',
      aliado: '',
      valorEstimadoCop: 0,
      estadoAliado: 'por_confirmar',
    };
    actualizarCampo('aportesEspecie', [...propuesta.aportesEspecie, nuevo]);
  };

  const actualizarEspecie = (
    id: string,
    cambios: Partial<AporteEspecieItem>
  ) => {
    actualizarCampo(
      'aportesEspecie',
      propuesta.aportesEspecie.map((item) =>
        item.id === id ? { ...item, ...cambios } : item
      )
    );
  };

  const eliminarEspecie = (id: string) => {
    if (propuesta.aportesEspecie.length <= 1) {
      actualizarCampo('aportesEspecie', [
        {
          id: 'especie-1',
          recurso: '',
          aliado: '',
          valorEstimadoCop: 0,
          estadoAliado: 'por_confirmar',
        },
      ]);
      return;
    }
    actualizarCampo(
      'aportesEspecie',
      propuesta.aportesEspecie.filter((item) => item.id !== id)
    );
  };

  const aplicarSugerenciaLinea = (sug: SugerenciaCampo) => {
    const principalValida = LINEAS.includes(sug.valorPrincipal as LineaPrincipal)
      ? (sug.valorPrincipal as LineaPrincipal)
      : 'Sostenibilidad';
    const relacionadaValida = LINEAS.includes(
      (sug.valorSecundario || '') as LineaPrincipal
    )
      ? (sug.valorSecundario as LineaPrincipal)
      : '';

    setPropuesta((prev) => ({
      ...prev,
      lineaPrincipal: principalValida,
      lineaRelacionada:
        relacionadaValida === principalValida ? '' : relacionadaValida,
      justificacionLinea: sug.valorTerciario || sug.resumen,
    }));
  };

  const aplicarSugerenciaPresupuesto = (sug: SugerenciaCampo) => {
    const nuevoCosto: CostoVariableItem = {
      id: `costo-${Date.now()}`,
      concepto: sug.valorPrincipal,
      montoCop: Math.max(0, Number(sug.montoSugeridoCop) || 0),
      estado: sug.valorSecundario === 'confirmado' ? 'confirmado' : 'estimado',
    };

    setPropuesta((prev) => {
      const sinVacios = prev.costosVariables.filter(
        (c) => c.concepto.trim().length > 0 || c.montoCop > 0
      );
      return {
        ...prev,
        costosVariables: [...sinVacios, nuevoCosto],
      };
    });
  };

  const aplicarSugerenciaEspecie = (sug: SugerenciaCampo) => {
    const estadoRaw = sug.valorTerciario;
    const estadoAliado: EstadoAliado =
      estadoRaw === 'confirmado' ||
      estadoRaw === 'potencial' ||
      estadoRaw === 'por_confirmar'
        ? estadoRaw
        : 'por_confirmar';

    const nuevoAporte: AporteEspecieItem = {
      id: `especie-${Date.now()}`,
      recurso: sug.valorPrincipal,
      aliado: sug.valorSecundario || 'Aliado local por definir',
      valorEstimadoCop: Math.max(0, Number(sug.montoSugeridoCop) || 0),
      estadoAliado,
    };

    setPropuesta((prev) => {
      const sinVacios = prev.aportesEspecie.filter(
        (a) => a.recurso.trim().length > 0 || a.aliado.trim().length > 0
      );
      return {
        ...prev,
        aportesEspecie: [...sinVacios, nuevoAporte],
      };
    });
  };

  const aplicarSugerenciaIntercambio = (sug: SugerenciaCampo) => {
    setPropuesta((prev) => ({
      ...prev,
      aporteGeneracionJoven: sug.valorPrincipal,
      aporteGeneracionMayor: sug.valorSecundario || prev.aporteGeneracionMayor,
      queRecibeCadaGeneracion:
        sug.valorTerciario || prev.queRecibeCadaGeneracion,
      barreraReducida: sug.valorCuarto || prev.barreraReducida,
    }));
  };

  const aplicarSugerenciaPiloto = (sug: SugerenciaCampo) => {
    setPropuesta((prev) => ({
      ...prev,
      ideaPiloto: sug.valorPrincipal,
      indicadorExito: sug.valorSecundario || prev.indicadorExito,
    }));
  };

  const analizarPropuesta = async () => {
    if (!propuesta.nombreActividad.trim()) {
      setErrorValidacion(
        'Escribe primero el nombre de tu actividad o ciclo de talleres (o pulsa "Cargar ejemplo INTERGER" para probar).'
      );
      document
        .getElementById('nombre-actividad')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrorValidacion(null);
    setErrorAnalisis(null);
    setAnalizando(true);

    try {
      const res = await fetch('/api/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propuesta }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ||
            'No fue posible analizar la propuesta en este momento.'
        );
      }

      setAnalisis(data.analisis);
      setTimeout(() => {
        document
          .getElementById('diagnostico-ia')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setErrorAnalisis(
        err instanceof Error
          ? err.message
          : 'Error de conexión al comunicarse con la IA.'
      );
    } finally {
      setAnalizando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Barra superior estricta de 3 zonas */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#inicio"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded"
          >
            INTERGER Planificador
          </a>

          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            aria-label="Navegación principal"
          >
            <a
              href="#formulario-planeacion"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Formulario
            </a>
            <a
              href="#diagnostico-ia"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Análisis IA
            </a>
            <button
              type="button"
              onClick={() => abrirAyuda('guia')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Guía rápida
            </button>
            <button
              type="button"
              onClick={() => abrirAyuda('chat')}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Preguntar a la IA
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => abrirAyuda('guia')}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>¿Cómo se usa?</span>
            </button>
          </div>
        </div>
      </header>

      <main id="inicio" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Encabezado contextual */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-teal-800">
              Reto Innova Generaciones · Universidad de Caldas y ACOPI · Enfoque
              INTERGER
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Planeación presupuestal e intergeneracional con apoyo de IA
            </h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Organiza el dinero disponible, los costos variables, los aportes
              en especie y el intercambio entre generaciones en lenguaje claro.
              Si tienes dudas en cualquier casilla, usa los botones{' '}
              <strong className="text-slate-800">
                "Ayúdame a llenar esto"
              </strong>{' '}
              o pregunta al asistente guía.
            </p>
          </div>

          {/* Barra de acciones cómodas */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={cargarEjemplo}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <span>Cargar ejemplo INTERGER</span>
            </button>

            <button
              type="button"
              onClick={() => abrirAyuda('guia')}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-slate-700" aria-hidden="true" />
              <span>Guía rápida (2 min)</span>
            </button>

            <button
              type="button"
              onClick={copiarResumen}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiado ? (
                <>
                  <Check
                    className="w-4 h-4 text-emerald-700"
                    aria-hidden="true"
                  />
                  <span>Resumen copiado</span>
                </>
              ) : (
                <>
                  <ClipboardCopy
                    className="w-4 h-4 text-slate-700"
                    aria-hidden="true"
                  />
                  <span>Copiar resumen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          </div>
        </section>

        {/* Mensaje de validación */}
        {errorValidacion && (
          <div
            className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950"
            role="alert"
          >
            <AlertCircle
              className="w-5 h-5 text-amber-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{errorValidacion}</p>
          </div>
        )}

        {/* Formulario principal */}
        <form
          id="formulario-planeacion"
          onSubmit={(e) => {
            e.preventDefault();
            analizarPropuesta();
          }}
          className="space-y-8"
        >
          {/* Bloque 1: Actividad y Línea principal */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                01. Actividad y línea principal del reto
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Describe qué actividad o ciclo de talleres quieren hacer y cuál
                es su foco principal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="nombre-actividad"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Nombre de la actividad o ciclo de talleres *
                </label>
                <input
                  id="nombre-actividad"
                  type="text"
                  value={propuesta.nombreActividad}
                  onChange={(e) =>
                    actualizarCampo('nombreActividad', e.target.value)
                  }
                  placeholder="Ej: Club de fotografía celular y memoria del barrio"
                  className="w-full min-h-[46px] px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="periodicidad"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Tipo de planeación
                </label>
                <select
                  id="periodicidad"
                  value={propuesta.periodicidad}
                  onChange={(e) =>
                    actualizarCampo(
                      'periodicidad',
                      e.target.value as 'Mensual' | 'Por ciclo de talleres'
                    )
                  }
                  className="w-full min-h-[46px] px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="Por ciclo de talleres">
                    Por ciclo de talleres
                  </option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="participantes"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Participantes estimados
                </label>
                <input
                  id="participantes"
                  type="text"
                  value={propuesta.participantesEstimados}
                  onChange={(e) =>
                    actualizarCampo('participantesEstimados', e.target.value)
                  }
                  placeholder="Ej: 20 personas (10 jóvenes y 10 mayores)"
                  className="w-full min-h-[46px] px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <div>
                <span className="block text-sm font-semibold text-slate-900 mb-2">
                  Línea principal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LINEAS.map((linea) => {
                    const activa = propuesta.lineaPrincipal === linea;
                    return (
                      <button
                        key={linea}
                        type="button"
                        onClick={() => {
                          actualizarCampo('lineaPrincipal', linea);
                          if (propuesta.lineaRelacionada === linea) {
                            actualizarCampo('lineaRelacionada', '');
                          }
                        }}
                        className={`text-left p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                          activa
                            ? 'bg-teal-50 border-teal-600 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold">{linea}</span>
                          {activa && (
                            <Check
                              className="w-4 h-4 text-teal-700"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          {DESCRIPCION_LINEAS[linea]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="linea-relacionada"
                    className="block text-sm font-semibold text-slate-900 mb-1.5"
                  >
                    Línea relacionada (opcional)
                  </label>
                  <select
                    id="linea-relacionada"
                    value={propuesta.lineaRelacionada}
                    onChange={(e) =>
                      actualizarCampo(
                        'lineaRelacionada',
                        e.target.value as '' | LineaPrincipal
                      )
                    }
                    className="w-full min-h-[46px] px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">Ninguna</option>
                    {LINEAS.filter((l) => l !== propuesta.lineaPrincipal).map(
                      (l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="justificacion-linea"
                    className="block text-sm font-semibold text-slate-900 mb-1.5"
                  >
                    ¿Cómo aporta la actividad a esa línea?
                  </label>
                  <textarea
                    id="justificacion-linea"
                    rows={2}
                    value={propuesta.justificacionLinea}
                    onChange={(e) =>
                      actualizarCampo('justificacionLinea', e.target.value)
                    }
                    placeholder="Explica en una o dos frases por qué escogiste esta línea..."
                    className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <SuggestionBox
                campo="linea"
                propuestaActual={propuesta}
                onAplicar={aplicarSugerenciaLinea}
              />
            </div>
          </section>

          {/* Bloque 2: Dinero disponible y costos variables */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  02. Dinero estimado y costos variables (COP)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Registra la plata disponible y los gastos que cambian según la
                  cantidad de asistentes. Marca si es confirmado o estimado.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">
                  Balance parcial en dinero
                </p>
                <p
                  className={`text-lg font-bold font-mono tabular-nums ${
                    totales.balanceEfectivo < 0
                      ? 'text-red-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {formatoCop(totales.balanceEfectivo)}
                </p>
              </div>
            </div>

            {/* Dinero disponible */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div>
                <label
                  htmlFor="dinero-disponible"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Dinero disponible estimado (COP)
                </label>
                <input
                  id="dinero-disponible"
                  type="number"
                  min={0}
                  step={1000}
                  value={propuesta.dineroDisponibleCop || ''}
                  onChange={(e) =>
                    actualizarCampo(
                      'dineroDisponibleCop',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  placeholder="Ej: 450000"
                  className="w-full min-h-[46px] px-4 py-2.5 text-base font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="fuente-dinero"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  ¿De dónde sale este dinero?
                </label>
                <input
                  id="fuente-dinero"
                  type="text"
                  value={propuesta.fuenteDinero}
                  onChange={(e) =>
                    actualizarCampo('fuenteDinero', e.target.value)
                  }
                  placeholder="Ej: Aporte grupal, fondo semilla o cuota solidaria"
                  className="w-full min-h-[46px] px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center min-h-[46px]">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={propuesta.dineroEsEstimado}
                    onChange={(e) =>
                      actualizarCampo('dineroEsEstimado', e.target.checked)
                    }
                    className="w-5 h-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Monto estimado / pendiente de confirmar
                  </span>
                </label>
              </div>
            </div>

            {/* Costos variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-slate-900">
                  Costos variables estimados (COP)
                </h3>
                <span className="text-sm font-mono font-semibold tabular-nums text-slate-700">
                  Total: {formatoCop(totales.totalCostosVariables)}
                </span>
              </div>

              <div className="space-y-3">
                {propuesta.costosVariables.map((costo, index) => (
                  <div
                    key={costo.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="md:col-span-5">
                      <label
                        htmlFor={`costo-concepto-${costo.id}`}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Concepto #{index + 1}
                      </label>
                      <input
                        id={`costo-concepto-${costo.id}`}
                        type="text"
                        value={costo.concepto}
                        onChange={(e) =>
                          actualizarCosto(costo.id, {
                            concepto: e.target.value,
                          })
                        }
                        placeholder="Ej: Refrigerios o fotocopias en letra grande"
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label
                        htmlFor={`costo-monto-${costo.id}`}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Valor (COP)
                      </label>
                      <input
                        id={`costo-monto-${costo.id}`}
                        type="number"
                        min={0}
                        step={1000}
                        value={costo.montoCop || ''}
                        onChange={(e) =>
                          actualizarCosto(costo.id, {
                            montoCop: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        placeholder="0"
                        className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label
                        htmlFor={`costo-estado-${costo.id}`}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Estado del valor
                      </label>
                      <select
                        id={`costo-estado-${costo.id}`}
                        value={costo.estado}
                        onChange={(e) =>
                          actualizarCosto(costo.id, {
                            estado: e.target.value as 'confirmado' | 'estimado',
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      >
                        <option value="estimado">Estimado por confirmar</option>
                        <option value="confirmado">
                          Confirmado (cotizado)
                        </option>
                      </select>
                    </div>

                    <div className="md:col-span-1 flex justify-end md:pt-5">
                      <button
                        type="button"
                        onClick={() => eliminarCosto(costo.id)}
                        className="p-2.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        aria-label={`Eliminar costo ${costo.concepto || index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={agregarCosto}
                  className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Agregar otro costo variable</span>
                </button>
              </div>

              <SuggestionBox
                campo="presupuesto"
                propuestaActual={propuesta}
                onAplicar={aplicarSugerenciaPresupuesto}
                etiquetaBoton="Ayúdame a llenar costos en COP"
              />
            </div>
          </section>

          {/* Bloque 3: Aportes en especie y estado de aliados */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  03. Aportes en especie y estado de aliados
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Salones, equipos, refrigerios donados o tiempo voluntario que
                  no requieren pagar dinero, junto con el estado de cada aliado.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">
                  Valor aproximado en especie
                </p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {formatoCop(totales.totalEspecie)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {propuesta.aportesEspecie.map((aporte, index) => (
                <div
                  key={aporte.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="md:col-span-4">
                    <label
                      htmlFor={`especie-recurso-${aporte.id}`}
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Aporte o recurso #{index + 1}
                    </label>
                    <input
                      id={`especie-recurso-${aporte.id}`}
                      type="text"
                      value={aporte.recurso}
                      onChange={(e) =>
                        actualizarEspecie(aporte.id, {
                          recurso: e.target.value,
                        })
                      }
                      placeholder="Ej: Salón comunal con sillas y sonido"
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label
                      htmlFor={`especie-aliado-${aporte.id}`}
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Aliado que aporta
                    </label>
                    <input
                      id={`especie-aliado-${aporte.id}`}
                      type="text"
                      value={aporte.aliado}
                      onChange={(e) =>
                        actualizarEspecie(aporte.id, {
                          aliado: e.target.value,
                        })
                      }
                      placeholder="Ej: Junta de Acción Comunal"
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`especie-valor-${aporte.id}`}
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Equivalente COP
                    </label>
                    <input
                      id={`especie-valor-${aporte.id}`}
                      type="number"
                      min={0}
                      step={10000}
                      value={aporte.valorEstimadoCop || ''}
                      onChange={(e) =>
                        actualizarEspecie(aporte.id, {
                          valorEstimadoCop: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      placeholder="0"
                      className="w-full min-h-[42px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`especie-estado-${aporte.id}`}
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      Estado del aliado
                    </label>
                    <select
                      id={`especie-estado-${aporte.id}`}
                      value={aporte.estadoAliado}
                      onChange={(e) =>
                        actualizarEspecie(aporte.id, {
                          estadoAliado: e.target.value as EstadoAliado,
                        })
                      }
                      className="w-full min-h-[42px] px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    >
                      <option value="confirmado">Confirmado</option>
                      <option value="potencial">Potencial</option>
                      <option value="por_confirmar">Por confirmar</option>
                    </select>
                  </div>

                  <div className="md:col-span-1 flex justify-end md:pt-5">
                    <button
                      type="button"
                      onClick={() => eliminarEspecie(aporte.id)}
                      className="p-2.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      aria-label={`Eliminar aporte ${aporte.recurso || index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarEspecie}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Agregar otro aporte en especie</span>
            </button>

            <SuggestionBox
              campo="especie"
              propuestaActual={propuesta}
              onAplicar={aplicarSugerenciaEspecie}
              etiquetaBoton="Ayúdame a identificar aportes y aliados"
            />
          </section>

          {/* Bloque 4: Intercambio entre generaciones */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                04. Intercambio entre generaciones
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Describe el valor de doble vía: qué enseña o entrega cada
                generación, qué recibe y qué barrera ayudan a superar juntas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="aporte-joven"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  ¿Qué aporta la generación joven / adulta joven?
                </label>
                <textarea
                  id="aporte-joven"
                  rows={3}
                  value={propuesta.aporteGeneracionJoven}
                  onChange={(e) =>
                    actualizarCampo('aporteGeneracionJoven', e.target.value)
                  }
                  placeholder="Ej: Acompañamiento en herramientas digitales, energía logística, diseño de material visual..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="aporte-mayor"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  ¿Qué aporta la generación mayor / adulta mayor?
                </label>
                <textarea
                  id="aporte-mayor"
                  rows={3}
                  value={propuesta.aporteGeneracionMayor}
                  onChange={(e) =>
                    actualizarCampo('aporteGeneracionMayor', e.target.value)
                  }
                  placeholder="Ej: Saberes de oficios, historia comunitaria, experiencia en trato humano y redes vecinales..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="que-recibe"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  ¿Qué recibe cada generación?
                </label>
                <textarea
                  id="que-recibe"
                  rows={3}
                  value={propuesta.queRecibeCadaGeneracion}
                  onChange={(e) =>
                    actualizarCampo('queRecibeCadaGeneracion', e.target.value)
                  }
                  placeholder="Ej: Los mayores ganan autonomía digital y compañía activa; los jóvenes aprenden un oficio y liderazgo real..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="barrera-reducida"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  ¿Qué barrera entre generaciones se reduce?
                </label>
                <textarea
                  id="barrera-reducida"
                  rows={3}
                  value={propuesta.barreraReducida}
                  onChange={(e) =>
                    actualizarCampo('barreraReducida', e.target.value)
                  }
                  placeholder="Ej: Miedo a la tecnología, soledad no deseada, prejuicios sobre la edad..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <SuggestionBox
              campo="intercambio"
              propuestaActual={propuesta}
              onAplicar={aplicarSugerenciaIntercambio}
            />
          </section>

          {/* Bloque 5: Idea de primera prueba / piloto e indicador de éxito */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                05. Primera prueba / piloto e indicador de éxito
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Antes de hacer todo el ciclo completo, define una prueba rápida y
                sencilla para comprobar si la idea funciona en la vida real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="idea-piloto"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Idea de primera prueba / piloto
                </label>
                <textarea
                  id="idea-piloto"
                  rows={3}
                  value={propuesta.ideaPiloto}
                  onChange={(e) =>
                    actualizarCampo('ideaPiloto', e.target.value)
                  }
                  placeholder="Ej: Hacer 1 sesión de prueba de 2 horas con 4 parejas (joven + mayor)..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="indicador-exito"
                  className="block text-sm font-semibold text-slate-900 mb-1.5"
                >
                  Indicador de éxito (cómo sabremos si funcionó)
                </label>
                <textarea
                  id="indicador-exito"
                  rows={3}
                  value={propuesta.indicadorExito}
                  onChange={(e) =>
                    actualizarCampo('indicadorExito', e.target.value)
                  }
                  placeholder="Ej: Al menos 3 de 4 parejas completan la actividad y quieren volver a la siguiente sesión..."
                  className="w-full px-4 py-2.5 text-base text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <SuggestionBox
              campo="piloto"
              propuestaActual={propuesta}
              onAplicar={aplicarSugerenciaPiloto}
            />
          </section>

          {/* Botón principal de análisis con IA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white border border-slate-200 rounded-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ¿Listo para revisar tu planeación?
              </h3>
              <p className="text-sm text-slate-600">
                La IA evaluará tu presupuesto en COP, detectará supuestos por
                verificar y propondrá tu piloto corto.
              </p>
            </div>
            <button
              type="submit"
              disabled={analizando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[50px] text-base font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              {analizando ? (
                <>
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Analizando propuesta...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>Analizar propuesta con IA</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Panel de análisis y resumen numérico */}
        <AnalysisPanel
          propuesta={propuesta}
          analisis={analisis}
          cargando={analizando}
          error={errorAnalisis}
          copiado={copiado}
          onAnalizar={analizarPropuesta}
          onCopiarResumen={copiarResumen}
        />
      </main>

      {/* Pie de página limpio */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
          <p>
            Reto Innova Generaciones · Universidad de Caldas y ACOPI · Enfoque
            INTERGER
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => abrirAyuda('guia')}
              className="hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Guía de uso
            </button>
            <button
              type="button"
              onClick={() => abrirAyuda('chat')}
              className="hover:text-slate-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Chat de ayuda IA
            </button>
          </div>
        </div>
      </footer>

      {/* Acceso rápido al asistente de ayuda */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => abrirAyuda('chat')}
          className="inline-flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          <span>Pregúntale a la IA</span>
        </button>
      </div>

      {/* Modal / Drawer de Guía rápida y chat */}
      <HelpDrawer
        abierto={ayudaAbierta}
        pestanaInicial={pestanaAyuda}
        onCerrar={() => setAyudaAbierta(false)}
        propuestaActual={propuesta}
      />
    </div>
  );
}
