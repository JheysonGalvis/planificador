import React, { useState } from 'react';
import { Lightbulb, Loader2, X, Check, AlertCircle } from 'lucide-react';
import type {
  CampoSugerencia,
  PropuestaInterger,
  SugerenciaCampo,
} from '../types/interger';
import { formatoCop } from '../utils/formatters';

interface SuggestionBoxProps {
  campo: CampoSugerencia;
  propuestaActual: PropuestaInterger;
  onAplicar: (sugerencia: SugerenciaCampo) => void;
  etiquetaBoton?: string;
}

export const SuggestionBox: React.FC<SuggestionBoxProps> = ({
  campo,
  propuestaActual,
  onAplicar,
  etiquetaBoton = 'Ayúdame a llenar esto',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciaCampo[]>([]);
  const [aplicadaIdx, setAplicadaIdx] = useState<number | null>(null);

  const solicitarSugerencias = async () => {
    setAbierto(true);
    setCargando(true);
    setError(null);
    setAplicadaIdx(null);

    try {
      const res = await fetch('/api/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campo, propuestaActual }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || 'No se pudieron obtener sugerencias en este momento.'
        );
      }

      setSugerencias(Array.isArray(data.sugerencias) ? data.sugerencias : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error de conexión al pedir sugerencias.'
      );
    } finally {
      setCargando(false);
    }
  };

  const manejarAplicar = (sug: SugerenciaCampo, idx: number) => {
    onAplicar(sug);
    setAplicadaIdx(idx);
    setTimeout(() => {
      setAplicadaIdx(null);
    }, 2000);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={solicitarSugerencias}
          disabled={cargando}
          className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {cargando ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
          )}
          <span>{cargando ? 'Pensando ideas...' : etiquetaBoton}</span>
        </button>
      </div>

      {abierto && (
        <div
          className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl"
          role="region"
          aria-label="Sugerencias generadas por IA"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm font-semibold text-slate-800">
              Ideas sugeridas para adaptar con un clic
            </p>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Cerrar sugerencias"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {cargando && (
            <div className="space-y-2.5">
              <div className="h-16 bg-slate-200/70 rounded-lg animate-pulse" />
              <div className="h-16 bg-slate-200/70 rounded-lg animate-pulse" />
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900"
              role="alert"
            >
              <AlertCircle
                className="w-4 h-4 text-red-700 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={solicitarSugerencias}
                  className="mt-1.5 text-xs font-semibold underline text-red-800 hover:text-red-950 cursor-pointer"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {!cargando && !error && sugerencias.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {sugerencias.map((sug, idx) => (
                <div
                  key={`${sug.titulo}-${idx}`}
                  className="flex flex-col justify-between p-3.5 bg-white border border-slate-200 rounded-lg"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                      {sug.titulo}
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {sug.resumen}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      {sug.valorPrincipal}
                      {typeof sug.montoSugeridoCop === 'number' &&
                      sug.montoSugeridoCop > 0
                        ? ` (${formatoCop(sug.montoSugeridoCop)})`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => manejarAplicar(sug, idx)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer"
                  >
                    {aplicadaIdx === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Insertado</span>
                      </>
                    ) : (
                      <span>Usar esta idea</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
