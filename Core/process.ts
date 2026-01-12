// Definición de tipos básicos para el sistema de simulación de procesos

// Tipo para el identificador único de un proceso
export type IdProceso = string;

/**
 * Enumeración que representa los estados posibles de un proceso.
 * NUEVO: El proceso se está creando.
 * LISTO: El proceso está listo para ejecutarse.
 * EJECUTANDO: El proceso se está ejecutando.
 * ESPERANDO: El proceso está esperando un evento.
 * TERMINADO: El proceso ha terminado su ejecución.
 */
export enum EstadoProceso {
Nuevo = "NUEVO",
Listo = "LISTO",
Ejecutando = "EJECUTANDO",
Esperando = "ESPERANDO",
Terminado = "TERMINADO",
}

/**
 * Estructura de datos básica para la entrada de un proceso.
 * Contiene la información inicial necesaria para la simulación.
 */
export interface ProcesoEntrada {
id: IdProceso;          // Identificador único del proceso
tiempoLlegada: number;  // Instante de tiempo en que el proceso llega al sistema
tiempoRafaga: number;   // Tiempo de CPU requerido por el proceso
prioridad?: number;     // Prioridad del proceso (opcional, menor valor = mayor prioridad usualmente)
}

/**
 * Opciones de configuración para los algoritmos de planificación.
 */
export interface OpcionesPlanificador {
quantum?: number;            // Quantum de tiempo para Round Robin
prioridadExpropiativa?: boolean; // Indica si el algoritmo de prioridad es expropiativo
}

/**
 * Representa un intervalo de tiempo en el que un proceso ocupó la CPU.
 * Utilizado para generar el diagrama de Gantt.
 */
export interface IntervaloEjecucion {
idProceso: IdProceso; // ID del proceso ejecutado
tiempoInicio: number; // Tiempo de inicio del intervalo
tiempoFin: number;    // Tiempo de fin del intervalo
}

/**
 * Estructura auxiliar para rastrear el estado de ejecución de un proceso durante la simulación.
 */
export interface TrazaEjecucionProceso {
proceso: ProcesoEntrada;      // Referencia al proceso original
tiemposInicio: number[];      // Lista de momentos en que el proceso inició ejecución
tiempoFinalizacion: number | null; // Momento en que el proceso terminó (null si no ha terminado)
tiempoRestante: number;       // Tiempo de ráfaga restante por ejecutar
}

/**
 * Métricas calculadas para un proceso individual al finalizar la simulación.
 */
export interface MetricasProceso {
idProceso: IdProceso;
tiempoLlegada: number;
tiempoRafaga: number;
prioridad?: number;
tiempoFinalizacion: number; // Instante en que completa su ejecución
tiempoRetorno: number;      // Turnaround Time: Finalización - Llegada
tiempoEspera: number;       // Waiting Time: Retorno - Ráfaga
tiempoRespuesta: number;    // Response Time: Primer Inicio - Llegada
}

/**
 * Resumen global de la simulación.
 */
export interface ResumenSimulacion {
promedioRetorno: number;    // Promedio de tiempos de retorno
promedioEspera: number;     // Promedio de tiempos de espera
promedioRespuesta: number;  // Promedio de tiempos de respuesta
utilizacionCpu: number;     // Porcentaje de utilización de la CPU
rendimiento: number;        // Throughput: Procesos completados por unidad de tiempo
}

/**
 * Resultado completo de una simulación.
 */
export interface ResultadoSimulacion {
algoritmo: string;               // Nombre del algoritmo utilizado
intervalos: IntervaloEjecucion[]; // Secuencia de ejecución (Gantt)
metricas: MetricasProceso[];     // Métricas por proceso
resumen: ResumenSimulacion;      // Métricas globales
tiempoTotal: number;             // Tiempo total de la simulación
tiempoOcioso: number;            // Tiempo total que la CPU estuvo ociosa
opciones: OpcionesPlanificador;  // Opciones usadas
}

/**
 * Función auxiliar para clonar un proceso y crear su traza de ejecución inicial.
 * @param proceso El proceso de entrada.
 * @returns Una nueva instancia de TrazaEjecucionProceso.
 */
export const clonarProceso = (proceso: ProcesoEntrada): TrazaEjecucionProceso => ({
proceso: { ...proceso },
tiemposInicio: [],
tiempoFinalizacion: null,
tiempoRestante: proceso.tiempoRafaga,
});

/**
 * Ordena un array de procesos por tiempo de llegada ascendente.
 * En caso de empate, ordena por ID.
 * @param procesos Lista de procesos a ordenar.
 */
export const ordenarPorLlegada = (procesos: ProcesoEntrada[]): ProcesoEntrada[] =>
[...procesos].sort((a, b) => {
if (a.tiempoLlegada === b.tiempoLlegada) {
return a.id.localeCompare(b.id);
}
return a.tiempoLlegada - b.tiempoLlegada;
});

/**
 * Valida que los procesos tengan valores lógicos (tiempos no negativos, etc.).
 * @param procesos Lista de procesos a validar.
 * @throws Error si algún valor es inválido.
 */
export const validarProcesos = (procesos: ProcesoEntrada[]): void => {
procesos.forEach((proc) => {
if (proc.tiempoLlegada < 0) {
throw new Error(`El tiempo de llegada debe ser >= 0 para el proceso ${proc.id}`);
}
if (proc.tiempoRafaga <= 0) {
throw new Error(`El tiempo de ráfaga debe ser > 0 para el proceso ${proc.id}`);
}
if (proc.prioridad !== undefined && proc.prioridad < 0) {
throw new Error(`La prioridad debe ser >= 0 para el proceso ${proc.id}`);
}
});
};
