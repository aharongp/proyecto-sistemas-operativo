import { calcularMetricas } from "./metrics";
import ejecutarFcfs from "./algorithms/fcfs";
import ejecutarSjf from "./algorithms/sjf";
import ejecutarRoundRobin from "./algorithms/round_robin";
import ejecutarPrioridad from "./algorithms/priority";
import {
ProcesoEntrada,
OpcionesPlanificador,
ResultadoSimulacion,
validarProcesos,
} from "./process";
import { ImplementacionAlgoritmo } from "./algorithms/types";

/**
 * Enumeración de algoritmos disponibles en el sistema.
 */
export enum AlgoritmoPlanificacion {
Fcfs = "FCFS",
Sjf = "SJF",
RoundRobin = "ROUND_ROBIN",
Prioridad = "PRIORITY",
}

/**
 * Describe las características y la implementación de un algoritmo.
 */
interface DescriptorAlgoritmo {
clave: AlgoritmoPlanificacion;
nombre: string;
ejecutar: ImplementacionAlgoritmo;
requiereQuantum?: boolean;
}

const ALGORITMOS: Record<AlgoritmoPlanificacion, DescriptorAlgoritmo> = {
[AlgoritmoPlanificacion.Fcfs]: {
clave: AlgoritmoPlanificacion.Fcfs,
nombre: "First Come First Served (FCFS)",
ejecutar: ejecutarFcfs,
},
[AlgoritmoPlanificacion.Sjf]: {
clave: AlgoritmoPlanificacion.Sjf,
nombre: "Shortest Job First (SJF)",
ejecutar: ejecutarSjf,
},
[AlgoritmoPlanificacion.RoundRobin]: {
clave: AlgoritmoPlanificacion.RoundRobin,
nombre: "Round Robin",
ejecutar: ejecutarRoundRobin,
requiereQuantum: true,
},
[AlgoritmoPlanificacion.Prioridad]: {
clave: AlgoritmoPlanificacion.Prioridad,
nombre: "Planificación por Prioridad",
ejecutar: ejecutarPrioridad,
},
};

/**
 * Obtiene la lista de algoritmos disponibles.
 * @returns Lista de descriptores de algoritmos (sin la función de ejecución).
 */
export const obtenerAlgoritmos = () => Object.values(ALGORITMOS).map((algoritmo) => ({
clave: algoritmo.clave,
nombre: algoritmo.nombre,
requiereQuantum: algoritmo.requiereQuantum,
}));

/**
 * Ejecuta una simulación con un algoritmo específico.
 * 
 * @param algoritmo Clave del algoritmo a ejecutar.
 * @param procesos Lista de procesos de entrada.
 * @param opciones Opciones específicas para el algoritmo (quantum, expropiación, etc.).
 * @returns Resultados completos de la simulación.
 */
export const ejecutarSimulacion = (
algoritmo: AlgoritmoPlanificacion,
procesos: ProcesoEntrada[],
opciones: OpcionesPlanificador = {},
): ResultadoSimulacion => {
validarProcesos(procesos);
const descriptor = ALGORITMOS[algoritmo];
if (!descriptor) {
throw new Error(`Algoritmo desconocido: ${algoritmo}`);
}

const { trazas, intervalos, tiempoTotal, tiempoOcioso } = descriptor.ejecutar(procesos, opciones);
const { metricas, resumen } = calcularMetricas({ trazas, tiempoTotal, tiempoOcioso, intervalos });

return {
algoritmo: descriptor.nombre,
intervalos,
metricas,
resumen,
tiempoTotal,
tiempoOcioso,
opciones,
};
};

/**
 * Ejecuta simulaciones para todos los algoritmos disponibles.
 * 
 * @param procesos Lista de procesos de entrada.
 * @param opciones Mapa de opciones por algoritmo.
 * @returns Lista de resultados de simulación.
 */
export const ejecutarTodasSimulaciones = (
procesos: ProcesoEntrada[],
opciones: Partial<Record<AlgoritmoPlanificacion, OpcionesPlanificador>> = {},
) =>
obtenerAlgoritmos().map((algoritmo) =>
ejecutarSimulacion(algoritmo.clave, procesos, opciones[algoritmo.clave] ?? {}),
);
