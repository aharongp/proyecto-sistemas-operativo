import { TrazaEjecucionProceso, ProcesoEntrada, IntervaloEjecucion, OpcionesPlanificador } from "../process";

/**
 * Resultado crudo de la ejecución de un algoritmo de planificación.
 */
export interface ResultadoAlgoritmo {
  intervalos: IntervaloEjecucion[];
  trazas: TrazaEjecucionProceso[];
  tiempoTotal: number;
  tiempoOcioso: number;
}

/**
 * Definición de función para implementar un algoritmo de planificación.
 */
export type ImplementacionAlgoritmo = (
  procesos: ProcesoEntrada[],
  opciones?: OpcionesPlanificador,
) => ResultadoAlgoritmo;
