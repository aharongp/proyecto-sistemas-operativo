import { clonarProceso, TrazaEjecucionProceso, ProcesoEntrada, IntervaloEjecucion } from "../process";
import { ImplementacionAlgoritmo } from "./types";

/**
 * Selecciona el proceso con menor tiempo de ráfaga (burstTime).
 * Desempate: FCFS.
 */
const seleccionarTrabajoMasCorto = (listos: ProcesoEntrada[]): ProcesoEntrada => {
const ordenados = [...listos].sort((a, b) => {
if (a.tiempoRafaga === b.tiempoRafaga) {
if (a.tiempoLlegada === b.tiempoLlegada) {
return a.id.localeCompare(b.id);
}
return a.tiempoLlegada - b.tiempoLlegada;
}
return a.tiempoRafaga - b.tiempoRafaga;
});
return ordenados[0];
};

/**
 * Implementación del algoritmo SJF (Shortest Job First).
 * No expropiativo.
 */
const ejecutarSjf: ImplementacionAlgoritmo = (procesos) => {
const ordenados = [...procesos].sort((a, b) => {
if (a.tiempoLlegada === b.tiempoLlegada) {
return a.id.localeCompare(b.id);
}
return a.tiempoLlegada - b.tiempoLlegada;
});

const trazas: TrazaEjecucionProceso[] = ordenados.map((proc) => clonarProceso(proc));
const trazaPorId = new Map(trazas.map((traza) => [traza.proceso.id, traza]));

const intervalos: IntervaloEjecucion[] = [];
const listos: ProcesoEntrada[] = [];
let tiempoActual = 0;
let tiempoOcioso = 0;
let indice = 0;

while (listos.length > 0 || indice < ordenados.length) {
// Encolar los que llegan antes o en el momento actual
while (indice < ordenados.length && ordenados[indice].tiempoLlegada <= tiempoActual) {
listos.push(ordenados[indice]);
indice += 1;
}

if (listos.length === 0) {
const proximaLlegada = ordenados[indice].tiempoLlegada;
tiempoOcioso += proximaLlegada - tiempoActual;
tiempoActual = proximaLlegada;
continue;
}

const siguiente = seleccionarTrabajoMasCorto(listos);
const indiceCola = listos.findIndex((proc) => proc.id === siguiente.id);
listos.splice(indiceCola, 1);

const traza = trazaPorId.get(siguiente.id);
if (!traza) {
throw new Error(`Falta traza para el proceso ${siguiente.id}`);
}

traza.tiemposInicio.push(tiempoActual);
const tiempoFin = tiempoActual + siguiente.tiempoRafaga;
traza.tiempoRestante = 0;
traza.tiempoFinalizacion = tiempoFin;

intervalos.push({ idProceso: siguiente.id, tiempoInicio: tiempoActual, tiempoFin });
tiempoActual = tiempoFin;
}

return {
intervalos,
trazas,
tiempoTotal: tiempoActual,
tiempoOcioso,
};
};

export default ejecutarSjf;
