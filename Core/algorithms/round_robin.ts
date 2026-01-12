import { clonarProceso, TrazaEjecucionProceso, ProcesoEntrada, IntervaloEjecucion } from "../process";
import { ImplementacionAlgoritmo } from "./types";

const encolarLlegadas = (
ordenados: ProcesoEntrada[],
indice: { valor: number },
tiempoActual: number,
cola: TrazaEjecucionProceso[],
trazaPorId: Map<string, TrazaEjecucionProceso>,
) => {
while (indice.valor < ordenados.length && ordenados[indice.valor].tiempoLlegada <= tiempoActual) {
const entrando = ordenados[indice.valor];
const traza = trazaPorId.get(entrando.id);
if (!traza) {
throw new Error(`Falta traza para el proceso ${entrando.id}`);
}
cola.push(traza);
indice.valor += 1;
}
};

/**
 * Implementación del algoritmo Round Robin.
 * Expropiativo basado en quantum.
 */
const ejecutarRoundRobin: ImplementacionAlgoritmo = (procesos, opciones) => {
const quantum = opciones?.quantum ?? 2;
if (quantum <= 0) {
throw new Error("Round Robin requiere quantum > 0");
}

const ordenados = [...procesos].sort((a, b) => {
if (a.tiempoLlegada === b.tiempoLlegada) {
return a.id.localeCompare(b.id);
}
return a.tiempoLlegada - b.tiempoLlegada;
});

const trazas: TrazaEjecucionProceso[] = ordenados.map((proc) => clonarProceso(proc));
const trazaPorId = new Map(trazas.map((traza) => [traza.proceso.id, traza]));

const intervalos: IntervaloEjecucion[] = [];
const cola: TrazaEjecucionProceso[] = [];
const indice = { valor: 0 };

let tiempoActual = 0;
let tiempoOcioso = 0;

if (ordenados.length === 0) {
return { intervalos, trazas, tiempoTotal: 0, tiempoOcioso: 0 };
}

tiempoActual = Math.min(...ordenados.map((proc) => proc.tiempoLlegada));
encolarLlegadas(ordenados, indice, tiempoActual, cola, trazaPorId);

while (cola.length > 0 || indice.valor < ordenados.length) {
if (cola.length === 0) {
const proximaLlegada = ordenados[indice.valor].tiempoLlegada;
tiempoOcioso += proximaLlegada - tiempoActual;
tiempoActual = proximaLlegada;
encolarLlegadas(ordenados, indice, tiempoActual, cola, trazaPorId);
continue;
}

const traza = cola.shift();
if (!traza) {
continue;
}

const tiempoIntervalo = Math.min(quantum, traza.tiempoRestante);

// Corrección de vacío si algo salió mal en llegadas (seguridad)
if (tiempoActual < traza.proceso.tiempoLlegada) {
tiempoOcioso += traza.proceso.tiempoLlegada - tiempoActual;
tiempoActual = traza.proceso.tiempoLlegada;
}

traza.tiemposInicio.push(tiempoActual);
const tiempoFin = tiempoActual + tiempoIntervalo;

traza.tiempoRestante -= tiempoIntervalo;
if (traza.tiempoRestante < 0) {
traza.tiempoRestante = 0;
}

intervalos.push({ idProceso: traza.proceso.id, tiempoInicio: tiempoActual, tiempoFin });
tiempoActual = tiempoFin;

encolarLlegadas(ordenados, indice, tiempoActual, cola, trazaPorId);

if (traza.tiempoRestante === 0) {
traza.tiempoFinalizacion = tiempoActual;
} else {
cola.push(traza);
}
}

return {
intervalos,
trazas,
tiempoTotal: tiempoActual,
tiempoOcioso,
};
};

export default ejecutarRoundRobin;
