"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("../process");
/**
 * Selecciona el proceso con menor tiempo de ráfaga (burstTime).
 * Desempate: FCFS.
 */
const seleccionarTrabajoMasCorto = (listos) => {
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
const ejecutarSjf = (procesos) => {
    const ordenados = [...procesos].sort((a, b) => {
        if (a.tiempoLlegada === b.tiempoLlegada) {
            return a.id.localeCompare(b.id);
        }
        return a.tiempoLlegada - b.tiempoLlegada;
    });
    const trazas = ordenados.map((proc) => (0, process_1.clonarProceso)(proc));
    const trazaPorId = new Map(trazas.map((traza) => [traza.proceso.id, traza]));
    const intervalos = [];
    const listos = [];
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
exports.default = ejecutarSjf;
