import {
TrazaEjecucionProceso,
MetricasProceso,
IntervaloEjecucion,
ResumenSimulacion,
} from "./process";

/**
 * Entrada necesaria para calcular las métricas de la simulación.
 */
export interface EntradaMetricas {
trazas: TrazaEjecucionProceso[];
intervalos: IntervaloEjecucion[];
tiempoTotal: number;
tiempoOcioso: number;
}

/**
 * Calcula las métricas individuales para cada proceso basándose en su traza de ejecución.
 * 
 * @param trazas Lista de trazas de ejecución de los procesos.
 * @returns Lista de métricas individuales.
 */
export const calcularMetricasProcesos = (
trazas: TrazaEjecucionProceso[],
): MetricasProceso[] => {
return trazas.map((traza) => {
if (traza.tiempoFinalizacion === null) {
throw new Error(`El proceso ${traza.proceso.id} nunca terminó`);
}
// El primer inicio es el primer elemento de la lista o el tiempo de llegada si (raro) se ejecutó instantáneamente
// Mejor lógica: response time = startTimes[0] - arrivalTime
const primerInicio = traza.tiemposInicio.length > 0 ? traza.tiemposInicio[0] : traza.proceso.tiempoLlegada;
const tiempoRetorno = traza.tiempoFinalizacion - traza.proceso.tiempoLlegada;
const tiempoEspera = tiempoRetorno - traza.proceso.tiempoRafaga;
const tiempoRespuesta = primerInicio - traza.proceso.tiempoLlegada;

return {
idProceso: traza.proceso.id,
tiempoLlegada: traza.proceso.tiempoLlegada,
tiempoRafaga: traza.proceso.tiempoRafaga,
prioridad: traza.proceso.prioridad,
tiempoFinalizacion: traza.tiempoFinalizacion,
tiempoRetorno,
tiempoEspera,
tiempoRespuesta,
};
});
};

/**
 * Calcula las métricas globales o de resumen de la simulación.
 * 
 * @param procesos Lista de métricas individuales de los procesos.
 * @param tiempoTotal Duración total de la simulación.
 * @param tiempoOcioso Tiempo total que la CPU estuvo sin ejecutar procesos.
 * @returns Objeto con el resumen de la simulación.
 */
export const calcularResumenSimulacion = (
procesos: MetricasProceso[],
tiempoTotal: number,
tiempoOcioso: number,
): ResumenSimulacion => {
const cantidad = procesos.length;
const sumaRetorno = procesos.reduce((acc, proc) => acc + proc.tiempoRetorno, 0);
const sumaEspera = procesos.reduce((acc, proc) => acc + proc.tiempoEspera, 0);
const sumaRespuesta = procesos.reduce((acc, proc) => acc + proc.tiempoRespuesta, 0);
const tiempoOcupado = Math.max(tiempoTotal - tiempoOcioso, 0);

const promedioRetorno = cantidad > 0 ? sumaRetorno / cantidad : 0;
const promedioEspera = cantidad > 0 ? sumaEspera / cantidad : 0;
const promedioRespuesta = cantidad > 0 ? sumaRespuesta / cantidad : 0;
const utilizacionCpu = tiempoTotal > 0 ? (tiempoOcupado / tiempoTotal) * 100 : 0;
const rendimiento = tiempoTotal > 0 ? cantidad / tiempoTotal : 0;

return {
promedioRetorno,
promedioEspera,
promedioRespuesta,
utilizacionCpu,
rendimiento,
};
};

/**
 * Función principal para orquestar el cálculo de todas las métricas.
 * 
 * @param input Datos de entrada (trazas, tiempos).
 * @returns Objeto con métricas detalladas y resumen.
 */
export const calcularMetricas = ({ trazas, tiempoTotal, tiempoOcioso }: EntradaMetricas) => {
const metricas = calcularMetricasProcesos(trazas);
const resumen = calcularResumenSimulacion(metricas, tiempoTotal, tiempoOcioso);
return { metricas, resumen };
};
