import type { PropuestaInterger } from '../types/interger';

export const PROPUESTA_VACIA: PropuestaInterger = {
  nombreActividad: '',
  periodicidad: 'Por ciclo de talleres',
  participantesEstimados: '20 personas (10 jóvenes y 10 mayores)',
  lineaPrincipal: 'Sostenibilidad',
  lineaRelacionada: '',
  justificacionLinea: '',
  dineroDisponibleCop: 0,
  dineroEsEstimado: true,
  fuenteDinero: '',
  costosVariables: [
    {
      id: 'costo-1',
      concepto: '',
      montoCop: 0,
      estado: 'estimado',
    },
  ],
  aportesEspecie: [
    {
      id: 'especie-1',
      recurso: '',
      aliado: '',
      valorEstimadoCop: 0,
      estadoAliado: 'por_confirmar',
    },
  ],
  aporteGeneracionJoven: '',
  aporteGeneracionMayor: '',
  queRecibeCadaGeneracion: '',
  barreraReducida: '',
  ideaPiloto: '',
  indicadorExito: '',
};

export const EJEMPLO_INTERGER: PropuestaInterger = {
  nombreActividad:
    'Saberes Conectados: Memoria Artesanal y Ventas Digitales para Emprendedores',
  periodicidad: 'Por ciclo de talleres',
  participantesEstimados: '24 personas (12 jóvenes y 12 adultos mayores)',
  lineaPrincipal: 'Sostenibilidad',
  lineaRelacionada: 'Replicabilidad',
  justificacionLinea:
    'Busca que los talleres se autofinancien en el mediano plazo mediante una microferia solidaria de productos locales y un kit replicable para otros barrios de Manizales.',
  dineroDisponibleCop: 450000,
  dineroEsEstimado: true,
  fuenteDinero:
    'Fondo semilla grupal ($300.000 confirmados) y aporte solidario por confirmar ($150.000)',
  costosVariables: [
    {
      id: 'ej-c1',
      concepto: 'Refrigerios saludables (4 sesiones para 24 personas)',
      montoCop: 240000,
      estado: 'estimado',
    },
    {
      id: 'ej-c2',
      concepto: 'Cartillas impresas en letra grande y marcadores',
      montoCop: 110000,
      estado: 'confirmado',
    },
    {
      id: 'ej-c3',
      concepto: 'Auxilio de transporte urbano para participantes mayores',
      montoCop: 80000,
      estado: 'estimado',
    },
  ],
  aportesEspecie: [
    {
      id: 'ej-e1',
      recurso: 'Salón comunitario con mesas, sillas y conexión Wi-Fi',
      aliado: 'Junta de Acción Comunal Barrio Palermo',
      valorEstimadoCop: 320000,
      estadoAliado: 'confirmado',
    },
    {
      id: 'ej-e2',
      recurso: 'Video beam, sonido y acompañamiento metodológico',
      aliado: 'Universidad de Caldas · Programa INTERGER',
      valorEstimadoCop: 250000,
      estadoAliado: 'potencial',
    },
    {
      id: 'ej-e3',
      recurso: 'Muestra comercial en vitrina de aliados locales',
      aliado: 'Empresas afiliadas a ACOPI Caldas',
      valorEstimadoCop: 180000,
      estadoAliado: 'por_confirmar',
    },
  ],
  aporteGeneracionJoven:
    'Estudiantes y jóvenes enseñan uso práctico de WhatsApp Business, fotografía con celular y pagos digitales sin enredos.',
  aporteGeneracionMayor:
    'Personas mayores comparten técnicas de oficios tradicionales (tejido, panadería artesanal, huerta urbana), historias de vida y trato cercano al cliente.',
  queRecibeCadaGeneracion:
    'Las personas mayores ganan autonomía digital para ofrecer sus productos; los jóvenes fortalecen habilidades de escucha, liderazgo comunitario y aprenden un oficio práctico.',
  barreraReducida:
    'Miedo a la tecnología en personas mayores y desconexión de los jóvenes con los saberes productivos tradicionales del territorio.',
  ideaPiloto:
    'Realizar 1 encuentro práctico de 2 horas con 4 parejas intergeneracionales (4 jóvenes + 4 mayores) para crear el catálogo en WhatsApp de 4 productos reales y probar la guía en letra grande.',
  indicadorExito:
    'Al menos 3 de las 4 parejas completan su catálogo publicado y califican la claridad del taller con 4 o más sobre 5.',
};
