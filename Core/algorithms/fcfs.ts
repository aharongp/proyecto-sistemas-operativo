import { clonarProceso, TrazaEjecucionProceso, IntervaloEjecucion } from "../process";
import { ImplementacionAlgoritmo } from "./types";

/**
 * Implementación del algoritmo First-Come, First-Served (FCFS).
 * Los procesos se ejecutan en estricto orden de llegada.
 * No expropiativo.
 */
const ejecutarFcfs: ImplementacionAlgoritmo = (procesos) => {
// Ordenar por llegada
const ordenados = [...procesos].sort((a, b) => {
if (a.tiempoLlegada === b.tiempoLlegada) {
return a.id.localeCompare(b.id);
}
return a.tiempoLlegada - b.tiempoLlegada;
});

// Inicializar trazas
const trazas: TrazaEjecucionProceso[] = ordenados.map((proc) => clonarProceso(proc));
const trazaPorId = new Map(trazas.map((traza) => [traza.proceso.id, traza]));

const intervalos: IntervaloEjecucion[] = [];
let tiempoActual = 0;
let tiempoOcioso = 0;

ordenados.forEach((proc) => {
const traza = trazaPorId.get(proc.id);
if (!traza) {
throw new Error(`Falta traza para el proceso ${proc.id}`);
}

// Si el proceso llega después del tiempo actual, la CPU espera
if (tiempoActual < proc.tiempoLlegada) {
tiempoOcioso += proc.tiempoLlegada - tiempoActual;
tiempoActual = proc.tiempoLlegada;
}

// Ejecución
traza.tiemposInicio.push(tiempoActual);
const tiempoFin = tiempoActual + proc.tiempoRafaga;
traza.tiempoRestante = 0;
traza.tiempoFinalizacion = tiempoFin;

intervalos.push({ idProceso: proc.id, tiempoInicio: tiempoActual, tiempoFin });
tiempoActual = tiempoFin;
});

return {
intervalos,
trazas,
tiempoTotal: tiempoActual,
tiempoOcioso,
};
};

export default ejecutarFcfs;
