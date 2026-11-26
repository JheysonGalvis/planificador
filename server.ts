import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(error: unknown, res: Response) {
  const message = error instanceof Error ? error.message : String(error);
  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 500;

  console.error('[Gemini API error]:', message);

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes('API_KEY_INVALID') ||
    message.includes('PERMISSION_DENIED')
  ) {
    return res.status(502).json({
      error:
        'La clave de inteligencia artificial (GEMINI_API_KEY) no es válida o no tiene permisos activos en el servidor.',
      codigo: 'GEMINI_KEY_INVALIDA',
    });
  }

  if (statusCode === 429 || message.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      error:
        'El servicio de IA recibió muchas solicitudes seguidas. Espera unos segundos e inténtalo de nuevo.',
      codigo: 'LIMITE_TEMPORAL',
    });
  }

  return res.status(502).json({
    error:
      'No fue posible conectar con el servicio de IA en este momento. Verifica tu conexión e inténtalo nuevamente.',
    codigo: 'ERROR_CONEXION_IA',
  });
}

function cleanText(value: unknown, maxLen = 1500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function cleanNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      servicio: 'Planificador INTERGER · Reto Innova Generaciones',
      iaConfigurada: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.post('/api/ayuda-app', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Falta configurar la variable de entorno GEMINI_API_KEY en el servidor para activar el asistente de IA.',
        codigo: 'FALTA_GEMINI_API_KEY',
      });
    }

    const pregunta = cleanText(req.body?.pregunta, 800);
    if (!pregunta) {
      return res.status(400).json({
        error: 'Escribe una pregunta para poder ayudarte.',
      });
    }

    const historial = Array.isArray(req.body?.historial)
      ? req.body.historial.slice(-6)
      : [];
    const contextoFormulario =
      typeof req.body?.contextoFormulario === 'object' &&
      req.body?.contextoFormulario !== null
        ? req.body.contextoFormulario
        : {};

    const historialTexto = historial
      .map((m: { rol?: unknown; texto?: unknown }) => {
        const rol = m?.rol === 'asistente' ? 'Asistente' : 'Persona usuaria';
        return `${rol}: ${cleanText(m?.texto, 400)}`;
      })
      .join('\n');

    const prompt = `Eres un guía paciente, amable y muy claro de la aplicación "Planificador INTERGER" del Reto Innova Generaciones (Universidad de Caldas y ACOPI, enfoque Universidad Intergeneracional en Colombia).

Tu misión es ayudar a personas de distintas edades (jóvenes, adultos y adultos mayores) a entender y usar la herramienta SIN tecnicismos, con frases cortas, cálidas y ejemplos cotidianos en Colombia (pesos colombianos COP, Juntas de Acción Comunal, talleres comunitarios, universidades).

Secciones de la app:
1. Datos de la actividad (nombre, periodicidad mensual o por ciclo de talleres, participantes).
2. Línea principal (Sostenibilidad = que siga funcionando sin depender siempre de donaciones; Cobertura = llegar a más personas o barrios; Replicabilidad = que otros grupos puedan copiar el modelo fácilmente).
3. Dinero disponible y costos variables en COP (dinero en efectivo o transferencia y gastos que suben o bajan según cuántas personas asisten, indicando qué está confirmado y qué es estimado).
4. Aportes en especie y estado de aliados (bienes, salones, equipos o tiempo voluntario sin pago en dinero; aliado confirmado, potencial o por confirmar).
5. Intercambio entre generaciones (qué aporta la generación joven, qué aporta la generación mayor, qué recibe cada una y qué barrera se reduce, como brecha digital o aislamiento).
6. Piloto e indicador de éxito (una prueba rápida y barata antes de lanzarlo en grande, y una forma sencilla de medir si funcionó).
7. Botón "Analizar propuesta con IA" (revisa equilibrio financiero, supuestos por verificar, riesgo operativo, reparto de tareas en pareja intergeneracional y plan de piloto).

Conceptos importantes:
- "Supuesto por verificar": algo que hoy asumimos o calculamos por encima (como un precio aproximado o un salón que aún no confirman) y debemos validar antes de gastar.
- Botón "Ayúdame a llenar esto": propone 3 ideas listas para copiar con un clic al lado de cada sección.
- Botón "Cargar ejemplo INTERGER": rellena todo el formulario con un caso real de ejemplo para probar la app en 2 minutos.

Contexto actual del formulario del usuario (si aplica):
${JSON.stringify(contextoFormulario).slice(0, 1200)}

${historialTexto ? `Conversación previa:\n${historialTexto}\n` : ''}
Pregunta actual de la persona usuaria:
"${pregunta}"

Responde en español sencillo, máximo 120 palabras, usando viñetas cortas solo si ayudan a leer mejor. Si pregunta sobre un error, explícale qué significa en palabras simples y qué paso práctico seguir.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const respuesta = response.text?.trim();
      if (!respuesta) {
        return res.status(502).json({
          error:
            'La IA devolvió una respuesta vacía. Intenta formular tu pregunta de otra manera.',
        });
      }

      return res.json({ respuesta });
    } catch (error) {
      return handleGeminiError(error, res);
    }
  });

  app.post('/api/sugerir', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Falta configurar la variable de entorno GEMINI_API_KEY en el servidor para generar sugerencias con IA.',
        codigo: 'FALTA_GEMINI_API_KEY',
      });
    }

    const campo = cleanText(req.body?.campo, 40);
    const camposPermitidos = new Set([
      'linea',
      'presupuesto',
      'especie',
      'intercambio',
      'piloto',
    ]);

    if (!camposPermitidos.has(campo)) {
      return res.status(400).json({
        error: 'El campo solicitado para sugerencias no es válido.',
      });
    }

    const propuesta =
      typeof req.body?.propuestaActual === 'object' &&
      req.body?.propuestaActual !== null
        ? req.body.propuestaActual
        : {};

    const nombreActividad =
      cleanText(propuesta.nombreActividad, 200) ||
      'Taller intergeneracional comunitario';
    const lineaPrincipal =
      cleanText(propuesta.lineaPrincipal, 50) || 'Sostenibilidad';
    const participantes =
      cleanText(propuesta.participantesEstimados, 80) || '20 personas';

    const instruccionesPorCampo: Record<string, string> = {
      linea: `Propón 3 opciones concretas de enfoque para la Línea Principal ("Sostenibilidad", "Cobertura" o "Replicabilidad") adaptadas a la actividad "${nombreActividad}".
Para cada opción devuelve:
- titulo: nombre corto de la opción (ej. "Sostenibilidad con microcuota solidaria")
- resumen: explicación simple de 1 frase
- valorPrincipal: exactamente "Sostenibilidad", "Cobertura" o "Replicabilidad"
- valorSecundario: línea relacionada opcional ("Sostenibilidad", "Cobertura", "Replicabilidad" o "")
- valorTerciario: texto claro (2 líneas) explicando cómo esta actividad impulsa esa línea`,
      presupuesto: `Propón 3 partidas realistas de costos variables en pesos colombianos (COP) para "${nombreActividad}" (${participantes}).
Para cada opción devuelve:
- titulo: nombre corto de la partida (ej. "Refrigerios para 20 personas")
- resumen: explicación práctica de cómo se calculó
- valorPrincipal: concepto exacto del gasto (ej. "Refrigerios saludables por sesión")
- valorSecundario: "estimado" o "confirmado"
- montoSugeridoCop: número entero en COP realista en Colombia (ej. 160000)`,
      especie: `Propón 3 opciones realistas de aportes en especie y aliados locales en Caldas/Colombia para "${nombreActividad}".
Para cada opción devuelve:
- titulo: resumen corto del aporte (ej. "Salón comunitario sin costo")
- resumen: por qué reduce el costo en efectivo
- valorPrincipal: recurso o aporte concreto (ej. "Salón amplio con sillas y mesas")
- valorSecundario: aliado sugerido (ej. "Junta de Acción Comunal o Casa de la Cultura")
- valorTerciario: "confirmado", "potencial" o "por_confirmar"
- montoSugeridoCop: valor equivalente estimado en COP (ej. 250000)`,
      intercambio: `Propón 3 modelos de intercambio entre generaciones (jóvenes/adultos jóvenes y personas mayores) para "${nombreActividad}" (línea: ${lineaPrincipal}).
Para cada opción devuelve:
- titulo: nombre atractivo del intercambio
- resumen: idea central en 1 frase
- valorPrincipal: qué aporta la generación joven
- valorSecundario: qué aporta la generación mayor
- valorTerciario: qué recibe cada generación
- valorCuarto: qué barrera intergeneracional se reduce (ej. brecha digital, aislamiento, desconfianza)`,
      piloto: `Propón 3 ideas de primera prueba o piloto corto (rápido, de bajo costo, 1 a 2 sesiones) e indicador de éxito para "${nombreActividad}".
Para cada opción devuelve:
- titulo: nombre corto del piloto
- resumen: qué se valida con esta prueba
- valorPrincipal: descripción práctica de la primera prueba / piloto
- valorSecundario: indicador de éxito claro y fácil de contar`,
    };

    const prompt = `Eres un asesor amable de innovación social del Reto Innova Generaciones (Universidad de Caldas y ACOPI, enfoque INTERGER).
${instruccionesPorCampo[campo]}

Usa español sencillo, cercano a Colombia, sin tecnicismos difíciles. Asegúrate de devolver exactamente 3 opciones útiles y distintas.`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sugerencias: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    resumen: { type: Type.STRING },
                    valorPrincipal: { type: Type.STRING },
                    valorSecundario: { type: Type.STRING },
                    valorTerciario: { type: Type.STRING },
                    valorCuarto: { type: Type.STRING },
                    montoSugeridoCop: { type: Type.INTEGER },
                  },
                  required: ['titulo', 'resumen', 'valorPrincipal'],
                },
              },
            },
            required: ['sugerencias'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"sugerencias":[]}');
      return res.json({
        sugerencias: Array.isArray(parsed.sugerencias)
          ? parsed.sugerencias.slice(0, 3)
          : [],
      });
    } catch (error) {
      return handleGeminiError(error, res);
    }
  });

  app.post('/api/analizar', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Falta configurar la variable de entorno GEMINI_API_KEY en el servidor para realizar el análisis con IA.',
        codigo: 'FALTA_GEMINI_API_KEY',
      });
    }

    const propuesta = req.body?.propuesta;
    if (!propuesta || typeof propuesta !== 'object') {
      return res.status(400).json({
        error: 'No se recibieron los datos de la propuesta para analizar.',
      });
    }

    const nombreActividad = cleanText(propuesta.nombreActividad, 200);
    if (!nombreActividad) {
      return res.status(400).json({
        error:
          'Por favor escribe al menos el nombre de la actividad o ciclo de talleres antes de analizar.',
      });
    }

    const dineroDisponibleCop = cleanNumber(propuesta.dineroDisponibleCop);
    const costosVariables = Array.isArray(propuesta.costosVariables)
      ? propuesta.costosVariables.slice(0, 25).map((c: Record<string, unknown>) => ({
          concepto: cleanText(c?.concepto, 150),
          montoCop: cleanNumber(c?.montoCop),
          estado: c?.estado === 'confirmado' ? 'confirmado' : 'estimado',
        }))
      : [];
    const totalCostosCop = costosVariables.reduce(
      (acc: number, item: { montoCop: number }) => acc + item.montoCop,
      0
    );

    const aportesEspecie = Array.isArray(propuesta.aportesEspecie)
      ? propuesta.aportesEspecie.slice(0, 25).map((a: Record<string, unknown>) => ({
          recurso: cleanText(a?.recurso, 150),
          aliado: cleanText(a?.aliado, 150),
          valorEstimadoCop: cleanNumber(a?.valorEstimadoCop),
          estadoAliado: cleanText(a?.estadoAliado, 30) || 'por_confirmar',
        }))
      : [];
    const totalEspecieCop = aportesEspecie.reduce(
      (acc: number, item: { valorEstimadoCop: number }) =>
        acc + item.valorEstimadoCop,
      0
    );

    const datosEstructurados = {
      nombreActividad,
      periodicidad: cleanText(propuesta.periodicidad, 50),
      participantesEstimados: cleanText(propuesta.participantesEstimados, 80),
      lineaPrincipal: cleanText(propuesta.lineaPrincipal, 50),
      lineaRelacionada: cleanText(propuesta.lineaRelacionada, 50),
      justificacionLinea: cleanText(propuesta.justificacionLinea, 500),
      dineroDisponibleCop,
      dineroEsEstimado: Boolean(propuesta.dineroEsEstimado),
      fuenteDinero: cleanText(propuesta.fuenteDinero, 200),
      totalCostosVariablesCop: totalCostosCop,
      diferenciaEfectivoCop: dineroDisponibleCop - totalCostosCop,
      costosVariables,
      totalValorEspecieEstimadoCop: totalEspecieCop,
      aportesEspecie,
      aporteGeneracionJoven: cleanText(propuesta.aporteGeneracionJoven, 400),
      aporteGeneracionMayor: cleanText(propuesta.aporteGeneracionMayor, 400),
      queRecibeCadaGeneracion: cleanText(propuesta.queRecibeCadaGeneracion, 400),
      barreraReducida: cleanText(propuesta.barreraReducida, 300),
      ideaPiloto: cleanText(propuesta.ideaPiloto, 400),
      indicadorExito: cleanText(propuesta.indicadorExito, 300),
    };

    const prompt = `Eres un asesor experto en innovación social, finanzas prácticas comunitarias y trabajo intergeneracional para el programa "Reto Innova Generaciones" (Universidad de Caldas y ACOPI, enfoque INTERGER — Universidad Intergeneracional).

Analiza la siguiente propuesta presupuestal e intergeneracional en pesos colombianos (COP). Usa un lenguaje español claro, cálido, concreto y fácil de leer por personas de todas las edades (jóvenes, adultos y adultos mayores), evitando tecnicismos innecesarios.

Datos de la propuesta:
${JSON.stringify(datosEstructurados, null, 2)}

Instrucciones obligatorias para el diagnóstico:
1. "resumenEjecutivo": 2 o 3 oraciones claras resumiendo la viabilidad general y el valor intergeneracional de la propuesta.
2. "equilibrio":
   - Evalúa la relación real entre dinero disponible (${dineroDisponibleCop} COP), costos variables (${totalCostosCop} COP) y aportes en especie (${totalEspecieCop} COP).
   - En "estado" elige exactamente uno de: "Equilibrado", "Ajustado con supuestos", o "Requiere ajustes".
   - En "supuestosPorVerificar" lista claramente qué montos estimados, fuentes de dinero sin confirmar o aliados potenciales/por confirmar son supuestos que deben validarse antes de ejecutar.
   - En "recomendaciones" da 2 a 4 acciones prácticas en COP o especie para mejorar el equilibrio.
3. "riesgo":
   - Identifica el riesgo operativo principal (el que más podría frenar la actividad o el intercambio entre generaciones).
   - Explica "porQueOcurre" en palabras simples.
   - En "planContingencia" da 3 pasos prácticos y realistas de plan B.
4. "parejaIntergeneracional":
   - Propón cómo repartir el trabajo en pareja intergeneracional (joven + persona mayor) aprovechando las fortalezas de cada edad para esta actividad específica.
   - Incluye tareas concretas en "tareasJovenes", "tareasMayores" y "tareasConjuntas".
5. "piloto":
   - Diseña un plan de piloto corto y económico (1 a 2 semanas o 1 sesión prueba) coherente con la idea del usuario.
   - Define "indicador" medible, "umbralExito" numérico o verificable, y "criteriosDecision" claros para saber cuándo "continuar", cuándo "ajustar" y cuándo "replantear".`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumenEjecutivo: { type: Type.STRING },
              equilibrio: {
                type: Type.OBJECT,
                properties: {
                  estado: { type: Type.STRING },
                  resumen: { type: Type.STRING },
                  supuestosPorVerificar: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recomendaciones: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'estado',
                  'resumen',
                  'supuestosPorVerificar',
                  'recomendaciones',
                ],
              },
              riesgo: {
                type: Type.OBJECT,
                properties: {
                  riesgoPrincipal: { type: Type.STRING },
                  porQueOcurre: { type: Type.STRING },
                  planContingencia: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['riesgoPrincipal', 'porQueOcurre', 'planContingencia'],
              },
              parejaIntergeneracional: {
                type: Type.OBJECT,
                properties: {
                  enfoqueColaboracion: { type: Type.STRING },
                  tareasJovenes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  tareasMayores: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  tareasConjuntas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'enfoqueColaboracion',
                  'tareasJovenes',
                  'tareasMayores',
                  'tareasConjuntas',
                ],
              },
              piloto: {
                type: Type.OBJECT,
                properties: {
                  duracionSugerida: { type: Type.STRING },
                  actividadPrueba: { type: Type.STRING },
                  indicador: { type: Type.STRING },
                  umbralExito: { type: Type.STRING },
                  criteriosDecision: {
                    type: Type.OBJECT,
                    properties: {
                      continuar: { type: Type.STRING },
                      ajustar: { type: Type.STRING },
                      replantear: { type: Type.STRING },
                    },
                    required: ['continuar', 'ajustar', 'replantear'],
                  },
                },
                required: [
                  'duracionSugerida',
                  'actividadPrueba',
                  'indicador',
                  'umbralExito',
                  'criteriosDecision',
                ],
              },
            },
            required: [
              'resumenEjecutivo',
              'equilibrio',
              'riesgo',
              'parejaIntergeneracional',
              'piloto',
            ],
          },
        },
      });

      const analisis = JSON.parse(response.text || '{}');
      return res.json({ analisis });
    } catch (error) {
      return handleGeminiError(error, res);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Servidor Planificador INTERGER escuchando en http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
