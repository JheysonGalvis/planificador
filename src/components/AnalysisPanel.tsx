import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  Check,
  Users,
  Compass,
  Scale,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { AnalisisInterger, PropuestaInterger } from '../types/interger';
import { calcularTotales, formatoCop } from '../utils/formatters';

interface AnalysisPanelProps {
  propuesta: PropuestaInterger;
  analisis: AnalisisInterger | null;
  cargando: boolean;
  error: string | null;
  copiado: boolean;
  onAnalizar: () => void;
  onCopiarResumen: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  propuesta,
  analisis,
  cargando,
  error,
  copiado,
  onAnalizar,
  onCopiarResumen,
}) => {
  const totales = calcularTotales(propuesta);

  const estadoEstilo = (estado?: string) => {
    if (estado === 'Equilibrado') {
      return {
        clase: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        icono: (
          <CheckCircle2
            className="w-5 h-5 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
        ),
      };
    }
    if (estado === 'Requiere ajustes') {
      return {
        clase: 'bg-red-50 text-red-900 border-red-200',
        icono: (
          <AlertCircle
            className="w-5 h-5 text-red-700 shrink-0"
            aria-hidden="true"
          />
        ),
      };
    }
    return {
      clase: 'bg-amber-50 text-amber-950 border-amber-200',
      icono: (
        <AlertTriangle
          className="w-5 h-5 text-amber-700 shrink-0"
          aria-hidden="true"
        />
      ),
    };
  };

  return (
    <section
      id="diagnostico-ia"
      aria-labelledby="titulo-diagnostico-ia"
      className="space-y-6"
    >
      {/* Resumen numérico en vivo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2
              id="titulo-diagnostico-ia"
              className="text-xl font-bold text-slate-900"
            >
              Tablero de equilibrio y análisis IA
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Cálculo automático en pesos colombianos (COP) y diagnóstico
              integral con Gemini.
            </p>
          </div>
          <button
            type="button"
            onClick={onCopiarResumen}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer whitespace-nowrap shrink-0"
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
                <ClipboardCopy className="w-4 h-4" aria-hidden="true" />
                <span>Copiar resumen</span>
              </>
            )}
          </button>
        </div>

        {/* 4 indicadores clave con tabular-nums */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-600">
              Dinero disponible
            </p>
            <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatoCop(totales.dineroDisponible)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {propuesta.dineroEsEstimado
                ? 'Estimado por confirmar'
                : 'Confirmado'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-600">
              Costos variables
            </p>
            <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatoCop(totales.totalCostosVariables)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totales.costosPorConfirmar > 0
                ? `${totales.costosPorConfirmar} partida(s) por confirmar`
                : 'Costos detallados'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-600">
              Balance en efectivo
            </p>
            <p
              className={`mt-1 text-lg font-bold font-mono tabular-nums ${
                totales.balanceEfectivo < 0
                  ? 'text-red-700'
                  : 'text-emerald-700'
              }`}
            >
              {formatoCop(totales.balanceEfectivo)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totales.balanceEfectivo < 0
                ? 'Faltante por cubrir o ajustar'
                : 'Cubre los costos en efectivo'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-medium text-slate-600">
              Valor estimado en especie
            </p>
            <p className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatoCop(totales.totalEspecie)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totales.aliadosPorConfirmar > 0
                ? `${totales.aliadosPorConfirmar} aliado(s) por confirmar`
                : 'Aportes sin salida de dinero'}
            </p>
          </div>
        </div>
      </div>

      {/* Estado de error amigable */}
      {error && (
        <div
          className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3.5"
          role="alert"
        >
          <AlertCircle
            className="w-5 h-5 text-red-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-950">
              No pudimos completar el análisis con IA
            </h3>
            <p className="mt-1 text-sm text-red-900 leading-relaxed">{error}</p>
            <p className="mt-2 text-xs text-red-800">
              Sugerencia: si no entiendes este mensaje, abre "¿Cómo se usa?" y
              pregúntale al chat de ayuda, o intenta analizar de nuevo en unos
              segundos.
            </p>
            <button
              type="button"
              onClick={onAnalizar}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Reintentar análisis</span>
            </button>
          </div>
        </div>
      )}

      {/* Estado cargando */}
      {cargando && (
        <div
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 text-teal-800">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <p className="text-base font-semibold">
              Analizando tu propuesta presupuestal e intergeneracional con IA...
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      )}

      {/* Estado vacío antes de analizar */}
      {!cargando && !error && !analisis && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">
            Tu diagnóstico con IA aparecerá aquí
          </h3>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Completa el formulario (o pulsa{' '}
            <strong>"Cargar ejemplo INTERGER"</strong>) y haz clic en{' '}
            <strong>"Analizar propuesta con IA"</strong> para revisar el
            equilibrio financiero, detectar supuestos por verificar, anticipar
            riesgos y diseñar tu piloto corto.
          </p>
          <button
            type="button"
            onClick={onAnalizar}
            className="mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-base font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <span>Analizar propuesta con IA</span>
          </button>
        </div>
      )}

      {/* Resultados estructurados del análisis */}
      {!cargando && analisis && (
        <div className="space-y-6">
          {/* Resumen ejecutivo */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-teal-800">
              Lectura general de tu propuesta
            </p>
            <p className="mt-2 text-base text-slate-900 leading-relaxed font-medium">
              {analisis.resumenEjecutivo}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Equilibrio y supuestos por verificar */}
            <article className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Scale
                      className="w-5 h-5 text-teal-700 shrink-0"
                      aria-hidden="true"
                    />
                    <h3 className="text-lg font-bold text-slate-900">
                      1. Diagnóstico de equilibrio
                    </h3>
                  </div>
                </div>

                {(() => {
                  const est = estadoEstilo(analisis.equilibrio.estado);
                  return (
                    <div
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold ${est.clase}`}
                    >
                      {est.icono}
                      <span>Estado: {analisis.equilibrio.estado}</span>
                    </div>
                  );
                })()}

                <p className="text-sm text-slate-700 leading-relaxed">
                  {analisis.equilibrio.resumen}
                </p>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-amber-900">
                    Supuestos por verificar antes de ejecutar
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {analisis.equilibrio.supuestosPorVerificar.map(
                      (item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">
                    Recomendaciones prácticas
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {analisis.equilibrio.recomendaciones.map((rec, i) => (
                      <li key={i} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            {/* 2. Riesgo operativo y plan de contingencia */}
            <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle
                  className="w-5 h-5 text-amber-700 shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-slate-900">
                  2. Riesgo operativo y plan B
                </h3>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-semibold text-slate-600">
                  Riesgo principal detectado
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {analisis.riesgo.riesgoPrincipal}
                </p>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  {analisis.riesgo.porQueOcurre}
                </p>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Plan de contingencia práctico (paso a paso)
                </h4>
                <ol className="mt-2 space-y-2 text-sm text-slate-700 list-decimal list-inside">
                  {analisis.riesgo.planContingencia.map((paso, i) => (
                    <li key={i} className="leading-relaxed">
                      {paso}
                    </li>
                  ))}
                </ol>
              </div>
            </article>

            {/* 3. Distribución de tareas en pareja intergeneracional */}
            <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Users
                  className="w-5 h-5 text-teal-700 shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-slate-900">
                  3. Tareas en pareja intergeneracional
                </h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {analisis.parejaIntergeneracional.enfoqueColaboracion}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-900">
                    Fortalezas generación joven
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {analisis.parejaIntergeneracional.tareasJovenes.map(
                      (t, i) => (
                        <li key={i} className="leading-relaxed">
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-900">
                    Fortalezas generación mayor
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                    {analisis.parejaIntergeneracional.tareasMayores.map(
                      (t, i) => (
                        <li key={i} className="leading-relaxed">
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Tareas que hacen mejor juntos
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                  {analisis.parejaIntergeneracional.tareasConjuntas.map(
                    (t, i) => (
                      <li key={i} className="leading-relaxed">
                        {t}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </article>

            {/* 4. Plan de piloto corto y criterio de decisión */}
            <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Compass
                    className="w-5 h-5 text-teal-700 shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-bold text-slate-900">
                    4. Plan de piloto corto
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {analisis.piloto.duracionSugerida}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-slate-900">Qué vamos a probar</p>
                  <p className="mt-0.5 text-slate-700 leading-relaxed">
                    {analisis.piloto.actividadPrueba}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600">
                      Indicador a observar
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {analisis.piloto.indicador}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600">
                      Umbral de éxito
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {analisis.piloto.umbralExito}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-sm">
                <h4 className="font-bold text-slate-900">
                  Criterio de decisión después del piloto
                </h4>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                  <strong>Continuar:</strong>{' '}
                  {analisis.piloto.criteriosDecision.continuar}
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                  <strong>Ajustar:</strong>{' '}
                  {analisis.piloto.criteriosDecision.ajustar}
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950">
                  <strong>Replantear:</strong>{' '}
                  {analisis.piloto.criteriosDecision.replantear}
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
};
