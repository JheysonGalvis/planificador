import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  Banknote,
  Handshake,
  HelpCircle,
} from 'lucide-react';
import type { MensajeAyuda, PropuestaInterger } from '../types/interger';

interface HelpDrawerProps {
  abierto: boolean;
  pestanaInicial?: 'guia' | 'chat';
  onCerrar: () => void;
  propuestaActual: PropuestaInterger;
}

const PREGUNTAS_RAPIDAS = [
  '¿Qué pongo en aporte en especie?',
  '¿Cómo relleno el intercambio entre generaciones?',
  '¿Qué significa supuesto por verificar?',
  '¿Qué significa si sale un error de conexión o clave?',
];

export const HelpDrawer: React.FC<HelpDrawerProps> = ({
  abierto,
  pestanaInicial = 'guia',
  onCerrar,
  propuestaActual,
}) => {
  const [pestana, setPestana] = useState<'guia' | 'chat'>(pestanaInicial);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeAyuda[]>([
    {
      id: 'bienvenida',
      rol: 'asistente',
      texto:
        '¡Hola! Soy tu asistente guía de INTERGER. Pregúntame en palabras sencillas qué escribir en cualquier casilla, cómo calcular un gasto o qué hacer si ves algún mensaje de error.',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPestana(pestanaInicial);
  }, [pestanaInicial, abierto]);

  useEffect(() => {
    if (pestana === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, pestana]);

  if (!abierto) return null;

  const enviarPregunta = async (textoPregunta: string) => {
    const limpia = textoPregunta.trim();
    if (!limpia || cargando) return;

    const nuevoMensajeUsuario: MensajeAyuda = {
      id: `u-${Date.now()}`,
      rol: 'usuario',
      texto: limpia,
    };

    const historialPrevio = [...mensajes, nuevoMensajeUsuario];
    setMensajes(historialPrevio);
    setPregunta('');
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/ayuda-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: limpia,
          historial: historialPrevio.slice(-6),
          contextoFormulario: {
            nombreActividad: propuestaActual.nombreActividad,
            lineaPrincipal: propuestaActual.lineaPrincipal,
            dineroDisponibleCop: propuestaActual.dineroDisponibleCop,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || 'No se pudo consultar al asistente en este momento.'
        );
      }

      setMensajes((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          rol: 'asistente',
          texto: data.respuesta,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un problema de conexión al consultar la IA.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ayuda-interger"
    >
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Cabecera del panel */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <HelpCircle
              className="w-5 h-5 text-teal-700 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="titulo-ayuda-interger"
              className="text-lg font-bold text-slate-900"
            >
              ¿Cómo se usa esta app?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Selector de pestañas */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-200 bg-white">
          <div
            className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'guia'}
              onClick={() => setPestana('guia')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                pestana === 'guia'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Guía rápida</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'chat'}
              onClick={() => setPestana('chat')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                pestana === 'chat'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Pregúntale a la IA</span>
            </button>
          </div>
        </div>

        {/* Contenido */}
        {pestana === 'guia' ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-slate-800">
            {/* Prueba en 2 minutos */}
            <section className="p-5 bg-teal-50/70 border border-teal-200 rounded-xl">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-base">
                <Clock className="w-5 h-5 text-teal-700" aria-hidden="true" />
                <h3>Cómo hacer una prueba en 2 minutos</h3>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-slate-800 list-decimal list-inside leading-relaxed">
                <li>
                  Haz clic en <strong>"Cargar ejemplo INTERGER"</strong> arriba
                  del formulario para ver un caso real completo.
                </li>
                <li>
                  Cambia cualquier dato o pulsa{' '}
                  <strong>"Ayúdame a llenar esto"</strong> en cualquier bloque
                  para que la IA te proponga 3 ideas listas para usar.
                </li>
                <li>
                  Haz clic en <strong>"Analizar propuesta con IA"</strong> y
                  luego en <strong>"Copiar resumen"</strong> para llevarlo a tu
                  Plantilla del Campista.
                </li>
              </ol>
            </section>

            {/* Dinero vs Aporte en especie */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                ¿Cuál es la diferencia entre "Dinero" y "Aporte en especie"?
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                    <Banknote
                      className="w-4 h-4 text-teal-700"
                      aria-hidden="true"
                    />
                    <span>Dinero (en COP)</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Es plata real en efectivo o transferencia que entra o sale.
                    Por ejemplo: $120.000 COP para comprar refrigerios,
                    fotocopias o pasajes.
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                    <Handshake
                      className="w-4 h-4 text-teal-700"
                      aria-hidden="true"
                    />
                    <span>Aporte en especie</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Son cosas, espacios o tiempo que alguien presta o regala sin
                    cobrar plata. Por ejemplo: un salón de la Junta Comunal, un
                    proyector prestado o las horas de un mentor.
                  </p>
                </div>
              </div>
            </section>

            {/* Supuesto por verificar */}
            <section className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="text-base font-bold text-amber-950">
                ¿Qué es un "supuesto por verificar"?
              </h3>
              <p className="mt-1.5 text-sm text-amber-900 leading-relaxed">
                Es cualquier dato que hoy suponemos o calculamos "al ojo", pero
                que todavía no está asegurado. Por ejemplo: creer que el salón es
                gratis sin haber hablado con el presidente de la junta, o
                estimar que cada refrigerio cuesta $5.000 COP sin haber pedido
                cotización. Marcarlos te evita sorpresas después.
              </p>
            </section>

            {/* Qué hace cada sección */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                Qué va en cada parte del formulario
              </h3>
              <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <li className="pb-3 border-b border-slate-100">
                  <strong className="text-slate-900">
                    1. Actividad y Línea principal:
                  </strong>{' '}
                  Nombre de tu taller o ciclo y qué busca lograr principalmente:{' '}
                  <em>Sostenibilidad</em> (que se mantenga en el tiempo),{' '}
                  <em>Cobertura</em> (llegar a más personas) o{' '}
                  <em>Replicabilidad</em> (que otros grupos lo puedan copiar).
                </li>
                <li className="pb-3 border-b border-slate-100">
                  <strong className="text-slate-900">
                    2. Dinero y costos variables:
                  </strong>{' '}
                  Cuánta plata tienes y qué gastos cambian según el número de
                  asistentes. Indica si ya es seguro o sigue estimado.
                </li>
                <li className="pb-3 border-b border-slate-100">
                  <strong className="text-slate-900">
                    3. Aportes en especie y aliados:
                  </strong>{' '}
                  Lista quién aporta espacios, equipos o saberes, y marca si el
                  aliado ya dijo que sí (Confirmado), podría apoyar (Potencial)
                  o falta preguntarle (Por confirmar).
                </li>
                <li className="pb-3 border-b border-slate-100">
                  <strong className="text-slate-900">
                    4. Intercambio entre generaciones:
                  </strong>{' '}
                  El corazón de INTERGER: qué da la generación joven, qué da la
                  generación mayor, qué gana cada una y qué barrera (miedo,
                  distancia, prejuicio) ayudan a superar juntas.
                </li>
                <li>
                  <strong className="text-slate-900">
                    5. Primera prueba / piloto:
                  </strong>{' '}
                  Cómo hacer una versión pequeñita y barata antes de lanzarlo en
                  grande, y qué dato sencillo mirarás para saber si funcionó.
                </li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Preguntas rápidas */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Toca una pregunta frecuente o escribe la tuya abajo:
              </p>
              <div className="flex flex-wrap gap-2">
                {PREGUNTAS_RAPIDAS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={cargando}
                    onClick={() => enviarPregunta(q)}
                    className="text-left text-xs font-medium px-3 py-2 bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Historial del chat */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {mensajes.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.rol === 'usuario' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      m.rol === 'usuario'
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {m.texto}
                  </div>
                </div>
              ))}

              {cargando && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700">
                    <Loader2
                      className="w-4 h-4 animate-spin text-teal-700"
                      aria-hidden="true"
                    />
                    <span>Escribiendo respuesta sencilla...</span>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900"
                  role="alert"
                >
                  <AlertCircle
                    className="w-4 h-4 text-red-700 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Formulario del chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarPregunta(pregunta);
              }}
              className="p-4 border-t border-slate-200 bg-white flex items-center gap-2.5"
            >
              <label htmlFor="chat-ayuda-input" className="sr-only">
                Escribe tu pregunta sobre cómo usar la app
              </label>
              <input
                id="chat-ayuda-input"
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="Ej: ¿Qué pongo en intercambio entre generaciones?"
                className="flex-1 min-h-[44px] px-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={cargando || !pregunta.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
